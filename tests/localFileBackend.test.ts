import { describe, it, expect, vi } from 'vitest';
import { LocalFileBackend, type LocalFileAdapter } from '../shared/localFileBackend.js';
import type { CommentsFile, InlineComment, PageComment } from '../shared/types.js';

describe('LocalFileBackend', () => {
  const mockAdapter: LocalFileAdapter = {
    readText: vi.fn(),
    writeText: vi.fn(),
    pathForMarkdown: vi.fn((filePath, commit) =>
      commit ? `${filePath}.${commit}.comments.yaml` : `${filePath}.comments.yaml`
    ),
    parseYaml: vi.fn((text) => JSON.parse(text)),
    dumpYaml: vi.fn((data) => JSON.stringify(data)),
  };

  const sampleKey = {
    owner: 'test-owner',
    repo: 'test-repo',
    filePath: 'guide.md',
    commitHash: 'sha123',
  };

  it('reads comments from commit-specific path when present', async () => {
    const backend = new LocalFileBackend(mockAdapter);
    const mockPageComment: PageComment = {
      id: 'p1',
      author: 'alice',
      body: 'page comment',
      created_at: '2026-01-01',
      resolved: false,
      reactions: [],
      replies: [],
    };
    const mockData: CommentsFile = {
      page_comments: [mockPageComment],
      inline_comments: [],
    };

    vi.mocked(mockAdapter.readText).mockImplementation(async (p) => {
      if (p.includes('sha123')) return JSON.stringify(mockData);
      return null;
    });

    const result = await backend.read(sampleKey);
    expect(result.page_comments).toHaveLength(1);
    expect(result.page_comments[0].id).toBe('p1');
  });

  it('merges legacy comments when legacy path exists and differs from commit path', async () => {
    const backend = new LocalFileBackend(mockAdapter);
    const commitData: CommentsFile = {
      page_comments: [
        {
          id: 'p1',
          author: 'alice',
          body: 'commit page comment',
          created_at: '2026-01-01',
          resolved: false,
          reactions: [],
          replies: [],
        },
      ],
      inline_comments: [],
    };
    const legacyData: CommentsFile = {
      page_comments: [],
      inline_comments: [
        {
          id: 'i1',
          author: 'bob',
          body: 'legacy inline',
          created_at: '2026-01-02',
          anchor_hash: 'hash1',
          paragraph_index: 0,
          heading_context: 'Intro',
          anchor_text: 'sample text',
          orphaned: false,
          resolved: false,
          reactions: [],
          replies: [],
        },
      ],
    };

    vi.mocked(mockAdapter.readText).mockImplementation(async (p) => {
      if (p.includes('sha123')) return JSON.stringify(commitData);
      if (p === 'guide.md.comments.yaml') return JSON.stringify(legacyData);
      return null;
    });

    const result = await backend.read(sampleKey);
    expect(result.page_comments).toHaveLength(1);
    expect(result.inline_comments).toHaveLength(1);
    expect(result.inline_comments[0].id).toBe('i1');
  });

  it('handles parsed YAML omitting page_comments and inline_comments arrays', async () => {
    const backend = new LocalFileBackend(mockAdapter);
    vi.mocked(mockAdapter.readText).mockImplementation(async (p) => {
      if (p.includes('sha123') || p === 'guide.md.comments.yaml') return '{}';
      return null;
    });

    const result = await backend.read(sampleKey);
    expect(result.page_comments).toEqual([]);
    expect(result.inline_comments).toEqual([]);
  });

  it('gracefully handles missing files and parse errors without throwing', async () => {
    const errorAdapter: LocalFileAdapter = {
      readText: vi.fn().mockRejectedValue(new Error('File not found')),
      writeText: vi.fn().mockResolvedValue(undefined),
      pathForMarkdown: vi.fn((f) => `${f}.comments.yaml`),
      parseYaml: vi.fn().mockImplementation(() => {
        throw new Error('YAML parse error');
      }),
      dumpYaml: vi.fn().mockReturnValue('{}'),
    };

    const backend = new LocalFileBackend(errorAdapter);
    const result = await backend.read({
      owner: 'test-owner',
      repo: 'test-repo',
      filePath: 'invalid.md',
    });
    expect(result).toEqual({ page_comments: [], inline_comments: [] });
  });

  it('handles error thrown during legacy read gracefully', async () => {
    const backend = new LocalFileBackend({
      readText: vi.fn().mockImplementation(async (p) => {
        if (p.includes('sha123')) return JSON.stringify({ page_comments: [], inline_comments: [] });
        throw new Error('Legacy read error');
      }),
      writeText: vi.fn(),
      pathForMarkdown: vi.fn((f, c) => (c ? `${f}.${c}.yaml` : `${f}.legacy.yaml`)),
      parseYaml: vi.fn((t) => JSON.parse(t)),
      dumpYaml: vi.fn((d) => JSON.stringify(d)),
    });

    const res = await backend.read(sampleKey);
    expect(res).toEqual({ page_comments: [], inline_comments: [] });
  });

  it('writes comments file using adapter dumpYaml and writeText', async () => {
    const backend = new LocalFileBackend(mockAdapter);
    const inlineComment: InlineComment = {
      id: 'c1',
      author: 'charlie',
      body: 'test comment',
      created_at: '2026-01-01',
      anchor_hash: 'h1',
      paragraph_index: 2,
      heading_context: '',
      anchor_text: 'target',
      orphaned: false,
      resolved: false,
      reactions: [],
      replies: [],
    };
    const mockData: CommentsFile = {
      page_comments: [],
      inline_comments: [inlineComment],
    };

    await backend.write(
      { owner: 'test-owner', repo: 'test-repo', filePath: 'doc.md', commitHash: 'abc' },
      mockData
    );
    expect(mockAdapter.dumpYaml).toHaveBeenCalledWith(mockData);
    expect(mockAdapter.writeText).toHaveBeenCalledWith(
      'doc.md.abc.comments.yaml',
      JSON.stringify(mockData)
    );
  });
});
