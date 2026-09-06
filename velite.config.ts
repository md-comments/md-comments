import { defineConfig, defineCollection, s } from 'velite';

export const features = defineCollection({
  name: 'Feature',
  pattern: 'quality/features/**/*.md',
  schema: s.object({
    id: s.string(),
    title: s.string(),
    category: s.string(),
    interfaces: s.array(s.string()),
    flowId: s.string(),
    dependsOn: s.array(s.string()).default([]),
    implementedIn: s.array(s.string()),
    verifiedIn: s.array(s.string()),
    invariants: s.array(s.string()).default([]),
    minCoverage: s.number().default(100),
    content: s.markdown(),
  }),
});

export const invariants = defineCollection({
  name: 'Invariant',
  pattern: 'quality/invariants/**/*.md',
  schema: s.object({
    id: s.string(),
    description: s.string(),
    enforcementMechanism: s.string(),
    content: s.markdown().optional(),
  }),
});

export default defineConfig({
  root: '.',
  output: {
    data: '.velite',
    assets: '.velite/assets',
  },
  collections: { features, invariants },
});
