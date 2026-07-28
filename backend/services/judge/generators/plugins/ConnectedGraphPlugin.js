import { BaseGeneratorPlugin } from '../../contracts/GeneratorContracts.js';

/**
 * ConnectedGraphPlugin - Reusable Pattern Plugin for Connected Graph Problems
 * Guarantees that all vertices are connected in a single component.
 */
export class ConnectedGraphPlugin extends BaseGeneratorPlugin {
  constructor() {
    super('ConnectedGraphPlugin', 'GraphPrimitive');
  }

  /**
   * Generates a connected graph input object { input: { n: number, edges: number[][] } }.
   * @param {SeededPRNG} prng
   * @param {any} primitiveData
   * @param {Object} pluginOptions
   * @returns {{ input: { n: number, edges: number[][] }, expectedOutput: null }}
   */
  apply(prng, primitiveData, pluginOptions = {}) {
    const {
      vertexCountMin = 4,
      vertexCountMax = 8,
      weighted = false,
      weightMin = 1,
      weightMax = 20
    } = pluginOptions;

    const V = prng.nextInt(vertexCountMin, vertexCountMax);
    const edges = [];
    const edgeSet = new Set();

    // 1. Build spanning tree to guarantee 100% connectivity across all V nodes
    for (let i = 1; i < V; i++) {
      const parent = prng.nextInt(0, i - 1);
      const edgeKey = `${parent}-${i}`;
      edgeSet.add(edgeKey);

      if (weighted) {
        edges.push([parent, i, prng.nextInt(weightMin, weightMax)]);
      } else {
        edges.push([parent, i]);
      }
    }

    // 2. Add extra random edges for density
    const extraEdgeCount = prng.nextInt(0, V);
    let added = 0;
    while (added < extraEdgeCount) {
      const u = prng.nextInt(0, V - 1);
      const v = prng.nextInt(0, V - 1);
      if (u === v) continue;

      const minNode = Math.min(u, v);
      const maxNode = Math.max(u, v);
      const key = `${minNode}-${maxNode}`;

      if (edgeSet.has(key)) continue;
      edgeSet.add(key);

      if (weighted) {
        edges.push([minNode, maxNode, prng.nextInt(weightMin, weightMax)]);
      } else {
        edges.push([minNode, maxNode]);
      }
      added++;
    }

    return {
      input: { n: V, edges },
      expectedOutput: null
    };
  }
}
