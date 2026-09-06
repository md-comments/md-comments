export default function (plop) {
  plop.setGenerator('feature', {
    description: 'Scaffold a new Markdown feature specification with YAML frontmatter',
    prompts: [
      { type: 'input', name: 'id', message: 'Feature ID (e.g. FEAT-COMM-POPOVER):' },
      { type: 'input', name: 'title', message: 'Feature Title:' },
      {
        type: 'list',
        name: 'category',
        message: 'Category:',
        choices: [
          'auth',
          'anchoring',
          'comments',
          'threads',
          'reactions',
          'mentions',
          'notifications',
          'dom',
          'storage',
          'security',
        ],
      },
      { type: 'input', name: 'flowId', message: 'Flow ID (e.g. FLOW-COMM-POPOVER):' },
    ],
    actions: [
      {
        type: 'add',
        path: 'quality/features/{{category}}/{{id}}.md',
        templateFile: 'templates/feature.md.hbs',
      },
    ],
  });
}
