import { BaseGeneratorPlugin } from '../../contracts/GeneratorContracts.js';

/**
 * DAGPlugin - Reusable Pattern Plugin for Directed Acyclic Graph Problems (Topological Sort, Course Schedule)
 * Guarantees zero directed cycles by directing edges strictly from u -> v where u < v.
 */
export class DAGPlugin extends BaseGeneratorPlugin {
  constructor() {
    super('DAGPlugin', 'GraphPrimitive');
  }

  /**
   * Generates a DAG input object { input: { n: number, edges: number[][] } }.
   * @param {SeededPRNG} prng
   * @param {any} primitiveData
   * @param {Object} pluginOptions
   * @returns {{ input: { n: number, edges: number[][] }, expectedOutput: null }}
   */
  apply(prng, primitiveData, pluginOptions = {}) {
    const {
      vertexCountMin = 4,
      vertexCountMax = 8,
      edgeCountMin = 3,
      edgeCountMax = 10,
      weighted = false,
      weightMin = 1,
      weightMax = 20
    } = pluginOptions;

    const V = prng.nextInt(vertexCountMin, vertexCountMax);
    const maxEdges = (V * (V - 1)) / 2;
    const targetE = Math.min(prng.nextInt(edgeCountMin, edgeCountMax), maxEdges);

    const edges = [];
    const edgeSet = new Set();

    while (edges.length < targetE) {
      const u = prng.nextInt(0, V - 2);
      const v = prng.nextInt(u + 1, V - 1); // u < v guarantees acyclic invariant
      const key = `${u}->${v}`;

      if (edgeSet.has(key)) continue;
      edgeSet.add(key);

      if (weighted) {
        edges.push([u, v, prng.nextInt(weightMin, weightMax)]);
      } else {
        edges.push([u, v]);
      }
    }

    return {
      input: { n: V, edges },
      expectedOutput: null
    };
  }
}
