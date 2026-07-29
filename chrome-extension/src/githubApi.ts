export interface ViewerInfo {
  login: string;
  avatarUrl: string;
}

export interface RepoMetadata {
  owner: string;
  repo: string;
  branch: string; // e.g. "main"
  filePath: string; // e.g. "docs/readme.md"
}

export class GitHubApi {
  private token: string | null;

  constructor(token: string | null) {
    this.token = token;
  }

  private async fetchGraphQL(query: string, variables: any = {}): Promise<any> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables }),
    });

    if (!res.ok) {
      throw new Error(`GitHub API HTTP error: ${res.status} ${res.statusText}`);
    }

    const json = await res.json();
    if (json.errors && json.errors.length > 0) {
      throw new Error(`GitHub API GraphQL error: ${json.errors[0].message}`);
    }

    return json.data;
  }

  async getViewer(): Promise<ViewerInfo> {
    const data = await this.fetchGraphQL(`
      query {
        viewer {
          login
          avatarUrl
        }
      }
    `);
    return {
      login: data.viewer.login,
      avatarUrl: data.viewer.avatarUrl,
    };
  }

  async getRepoInfo(
    owner: string,
    repo: string,
    branch: string
  ): Promise<{
    id: string; // repository Node ID
    viewerPermission: string; // e.g. "WRITE", "READ", etc.
    isProtected: boolean;
    headOid: string | null;
    defaultBranch: string;
    defaultBranchHeadOid: string | null;
  }> {
    const qualifiedName = `refs/heads/${branch}`;
    const data = await this.fetchGraphQL(
      `
      query($owner: String!, $repo: String!, $qualifiedName: String!) {
        repository(owner: $owner, name: $repo) {
          id
          viewerPermission
          defaultBranchRef {
            name
            target {
              oid
            }
          }
          ref(qualifiedName: $qualifiedName) {
            target {
              oid
            }
            branchProtectionRule {
              id
            }
          }
        }
      }
    `,
      { owner, repo, qualifiedName }
    );

    const repository = data.repository;
    if (!repository) {
      throw new Error(`Repository ${owner}/${repo} not found`);
    }

    const ref = repository.ref;
    const defaultBranchRef = repository.defaultBranchRef;
    return {
      id: repository.id,
      viewerPermission: repository.viewerPermission,
      isProtected: !!ref?.branchProtectionRule,
      headOid: ref?.target?.oid || null,
      defaultBranch: defaultBranchRef?.name || 'main',
      defaultBranchHeadOid: defaultBranchRef?.target?.oid || null,
    };
  }

  async createBranch(repositoryId: string, branchName: string, oid: string): Promise<string> {
    const refName = `refs/heads/${branchName}`;
    const data = await this.fetchGraphQL(
      `
      mutation($repositoryId: ID!, $name: String!, $oid: GitObjectID!) {
        createRef(input: { repositoryId: $repositoryId, name: $name, oid: $oid }) {
          ref {
            name
            target {
              oid
            }
          }
        }
      }
    `,
      { repositoryId, name: refName, oid }
    );

    return data.createRef.ref.target.oid;
  }

  async checkBranchExists(
    owner: string,
    repo: string,
    branchName: string
  ): Promise<{ oid: string; message: string | null } | null> {
    const qualifiedName = `refs/heads/${branchName}`;
    const data = await this.fetchGraphQL(
      `
      query($owner: String!, $repo: String!, $qualifiedName: String!) {
        repository(owner: $owner, name: $repo) {
          ref(qualifiedName: $qualifiedName) {
            target {
              oid
              ... on Commit {
                message
              }
            }
          }
        }
      }
    `,
      { owner, repo, qualifiedName }
    );
    if (!data || !data.repository) {
      throw new Error(`Repository ${owner}/${repo} not found or inaccessible`);
    }
    const ref = data.repository.ref;
    if (!ref || !ref.target) {
      return null;
    }
    return {
      oid: ref.target.oid,
      message: ref.target.message || null,
    };
  }

  async commitFile(
    owner: string,
    repo: string,
    branch: string,
    filePath: string,
    content: string,
    commitMessage: string,
    expectedHeadOid: string
  ): Promise<string> {
    // Convert content to base64
    // Use btoa or Buffer depending on environment. In browser, btoa is native but requires handling unicode properly.
    const base64Content = this.toBase64Unicode(content);
    const nameWithOwner = `${owner}/${repo}`;
    const refName = `refs/heads/${branch}`;

    const data = await this.fetchGraphQL(
      `
      mutation($input: CreateCommitOnBranchInput!) {
        createCommitOnBranch(input: $input) {
          commit {
            oid
          }
        }
      }
    `,
      {
        input: {
          branch: {
            repositoryNameWithOwner: nameWithOwner,
            branchName: refName,
          },
          message: {
            headline: commitMessage,
          },
          fileChanges: {
            additions: [
              {
                path: filePath,
                contents: base64Content,
              },
            ],
          },
          expectedHeadOid,
        },
      }
    );

    return data.createCommitOnBranch.commit.oid;
  }

  async commitFiles(
    owner: string,
    repo: string,
    branch: string,
    files: { filePath: string; content: string }[],
    commitMessage: string,
    expectedHeadOid: string
  ): Promise<string> {
    const additions = files.map((f) => ({
      path: f.filePath,
      contents: this.toBase64Unicode(f.content),
    }));
    const nameWithOwner = `${owner}/${repo}`;
    const refName = `refs/heads/${branch}`;

    const data = await this.fetchGraphQL(
      `
      mutation($input: CreateCommitOnBranchInput!) {
        createCommitOnBranch(input: $input) {
          commit {
            oid
          }
        }
      }
    `,
      {
        input: {
          branch: {
            repositoryNameWithOwner: nameWithOwner,
            branchName: refName,
          },
          message: {
            headline: commitMessage,
          },
          fileChanges: {
            additions,
          },
          expectedHeadOid,
        },
      }
    );

    return data.createCommitOnBranch.commit.oid;
  }

  async deleteBranch(owner: string, repo: string, branchName: string): Promise<void> {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(branchName)}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    if (!res.ok && res.status !== 404) {
      throw new Error(`Failed to delete branch ${branchName}: ${res.statusText}`);
    }
  }

  async getPullRequestInfo(
    owner: string,
    repo: string,
    pullNumber: number
  ): Promise<{
    headBranch: string;
    headOwner: string;
    headRepo: string;
    changedFiles: string[];
  }> {
    if (this.token) {
      try {
        const data = await this.fetchGraphQL(
          `
          query($owner: String!, $repo: String!, $pullNumber: Int!) {
            repository(owner: $owner, name: $repo) {
              pullRequest(number: $pullNumber) {
                headRefName
                headRepository {
                  owner {
                    login
                  }
                  name
                }
                files(first: 100) {
                  nodes {
                    path
                  }
                }
              }
            }
          }
        `,
          { owner, repo, pullNumber }
        );

        const pr = data.repository?.pullRequest;
        if (pr) {
          const changedFiles = pr.files?.nodes?.map((node: any) => node.path) || [];
          return {
            headBranch: pr.headRefName,
            headOwner: pr.headRepository?.owner?.login || owner,
            headRepo: pr.headRepository?.name || repo,
            changedFiles,
          };
        }
      } catch (gqlErr) {
        console.warn(
          '[md-comments] GraphQL getPullRequestInfo failed, trying REST fallback:',
          gqlErr
        );
      }
    }

    // REST API fallback (no token to avoid invalid-token error if it is a graphql-only transient token)
    const headers: HeadersInit = { Accept: 'application/vnd.github.v3+json' };
    const prRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}`, {
      headers,
    });
    if (!prRes.ok) {
      throw new Error(`Failed to fetch Pull Request #${pullNumber}: ${prRes.statusText}`);
    }
    const prData = await prRes.json();

    const filesRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/files?per_page=100`,
      { headers }
    );
    if (!filesRes.ok) {
      throw new Error(`Failed to fetch Pull Request files: ${filesRes.statusText}`);
    }
    const filesData = await filesRes.json();
    const changedFiles = filesData.map((f: any) => f.filename);

    return {
      headBranch: prData.head.ref,
      headOwner: prData.head.repo?.owner?.login || owner,
      headRepo: prData.head.repo?.name || repo,
      changedFiles,
    };
  }

  async renderMarkdown(text: string, owner: string, repo: string): Promise<string> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    const res = await fetch('https://api.github.com/markdown', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        text,
        mode: 'gfm',
        context: `${owner}/${repo}`,
      }),
    });
    if (!res.ok) {
      throw new Error(`Failed to render markdown: ${res.statusText}`);
    }
    return await res.text();
  }

  private toBase64Unicode(str: string): string {
    // Correct base64 encoding for unicode string in browser environment
    return btoa(
      encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => {
        return String.fromCharCode(parseInt(p1, 16));
      })
    );
  }
}
