# Security Policy

## Supported Versions

Only the latest release of Markdown Comments is actively supported with security updates. We recommend always upgrading to the latest version to ensure you have the latest security patches.

| Version | Supported          |
| ------- | ------------------ |
| >= 1.0  | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please **do not** open a public issue. Doing so exposes the vulnerability to the public before a fix can be prepared.

Instead, please report security vulnerabilities using one of the following methods:

### 1. GitHub Private Vulnerability Reporting

You can report vulnerabilities privately directly via GitHub:

1. Navigate to the main page of the repository on GitHub.
2. Under the repository name, click the **Security** (or **Security & quality**) tab.
3. In the left sidebar, under "Reporting", click **Advisories**.
4. Click **Report a vulnerability** to open the advisory form.

### 2. Contact the Maintainers

Alternatively, you can contact the project maintainers directly by emailing [maintainers-email@example.com] (please replace with actual contact details as appropriate) or opening a private communication channel.

### What to Include

When reporting a vulnerability, please provide the following details:

- A detailed description of the vulnerability.
- Steps to reproduce the issue (including proof of concept or sample code if possible).
- The potential impact of the vulnerability.
- The environment details (OS, extension host, version of Markdown Comments).

## GitHub App & Git Ref Security Hardening

Markdown Comments stores comments in isolated Git references (`refs/md-comments/data`) separate from your source codebase (`refs/heads/*`).

### Restricting Access with Repository Rulesets

Because GitHub's `contents: write` API permission is repository-wide, organizations and repository owners should configure GitHub Repository Rulesets to enforce the principle of least privilege:

1. **Protect Source Branches:** Configure rulesets targeting **All branches** (`refs/heads/**`) and **All tags** (`refs/tags/**`) requiring Pull Requests, linear history, or restricting direct push privileges.
2. **Exclude the App from Bypass Lists:** Do not grant bypass rights to Markdown Comments tokens or GitHub Apps.
3. **Isolate Custom Ref Namespace:** Because `refs/md-comments/data` is outside `refs/heads/**`, the commenting system retains read and write capabilities exclusively for comment data, while source branches remain protected from unauthorized direct modifications.
4. **Scope App Installations:** Install GitHub Apps only on specific, selected repositories rather than organization-wide.
