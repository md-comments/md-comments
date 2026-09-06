import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { features, invariants } from '../.velite';

describe('Quality Knowledge Graph Invariants', () => {
  it('validates that all 34 features are loaded with mapped test implementations', () => {
    expect(features.length).toBeGreaterThanOrEqual(34);
    for (const feature of features) {
      expect(feature.verifiedIn.length).toBeGreaterThan(0);
      for (const testPath of feature.verifiedIn) {
        expect(fs.existsSync(path.resolve(testPath))).toBe(true);
      }
    }
  });

  it('validates that all feature dependencies exist in catalog', () => {
    const featureIds = new Set(features.map((f) => f.id));
    for (const feature of features) {
      if (feature.dependsOn && Array.isArray(feature.dependsOn)) {
        for (const depId of feature.dependsOn) {
          expect(featureIds.has(depId)).toBe(true);
        }
      }
    }
  });

  it('validates that all feature invariants exist in invariant catalog', () => {
    const invariantIds = new Set(invariants.map((i) => i.id));
    expect(invariantIds.size).toBeGreaterThanOrEqual(3);
    for (const feature of features) {
      for (const invId of feature.invariants || []) {
        expect(invariantIds.has(invId)).toBe(true);
      }
    }
  });

  it('verifies that all referenced implementation files exist in codebase', () => {
    for (const feature of features) {
      for (const imp of feature.implementedIn) {
        expect(fs.existsSync(path.resolve(imp))).toBe(true);
      }
    }
  });

  it('verifies every feature specifies target interfaces and minCoverage requirement', () => {
    for (const feature of features) {
      expect(feature.interfaces.length).toBeGreaterThan(0);
      expect(feature.minCoverage).toBe(100);
      expect(feature.flowId).toMatch(/^FLOW-[A-Z0-9-]+$/);
    }
  });
});
