# Markdown Comments Badge for Plans and Documentation

Whenever creating or editing plan files, design documents, specifications, or RFCs located under `.plans/` (or any documentation intended for collaborative review), **ALWAYS** place the Markdown Comments header badge immediately below the top `# Document Title` (H1 header):

```markdown
[![Markdown Comments](https://img.shields.io/badge/markdown--comments-active-6366f1?style=flat-square&logo=github&logoColor=white)](https://chromewebstore.google.com/detail/markdown-comments/mjlhdjonjfcedkbpajkfeidfebefhkpp)
```

## Why

When viewing rendered markdown files on GitHub, there is no native indicator that inline comments and review threads exist unless the user has installed the browser extension. This badge signals to viewers that comments are enabled on the file and links directly to the extension in the Chrome Web Store.

## Plan Removal After Implementation

- Once all milestones and tasks in a plan under `.plans/` have been fully implemented and verified, the plan file **MUST be deleted/removed**. Do not retain completed plan files in `.plans/`.
