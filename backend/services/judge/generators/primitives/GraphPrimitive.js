import { BasePrimitiveGenerator } from '../../contracts/GeneratorContracts.js';

/**
 * GraphPrimitive - Generic Graph Primitive Data Generator
 * Generates directed, undirected, unweighted, or weighted graphs backed by SeededPRNG.
 */
export class GraphPrimitive extends BasePrimitiveGenerator {
  constructor() {
    super('GraphPrimitive', 'Graphs');
  }

  /**
   * Generates a graph in edgeList, adjacencyList, or adjacencyMatrix format.
   * @param {SeededPRNG} prng - Deterministic seed instance
   * @param {Object} options - Generator options
   * @param {number} [options.vertexCountMin=4] - Min vertices (0..V-1)
   * @param {number} [options.vertexCountMax=8] - Max vertices (0..V-1)
   * @param {number} [options.edgeCountMin=3] - Min edges
   * @param {number} [options.edgeCountMax=10] - Max edges
   * @param {boolean} [options.directed=false] - Directed graph flag
   * @param {boolean} [options.weighted=false] - Weighted edges flag
   * @param {number} [options.weightMin=1] - Min edge weight
   * @param {number} [options.weightMax=20] - Max edge weight
   * @param {string} [options.format='edgeList'] - 'edgeList' | 'adjacencyList' | 'adjacencyMatrix'
   * @returns {any}
   */
  generate(prng, options = {}) {
    if (!prng) {
      throw new Error("GraphPrimitive requires a valid SeededPRNG instance.");
    }

    const {
      vertexCountMin = 4,
      vertexCountMax = 8,
      edgeCountMin = 3,
      edgeCountMax = 10,
      directed = false,
      weighted = false,
      weightMin = 1,
      weightMax = 20,
      format = 'edgeList'
    } = options;

    if (vertexCountMin > vertexCountMax) {
      throw new Error(`Invalid vertex range: vertexCountMin (${vertexCountMin}) cannot exceed vertexCountMax (${vertexCountMax})`);
    }

    const V = prng.nextInt(vertexCountMin, vertexCountMax);
    const maxPossibleEdges = directed ? V * (V - 1) : (V * (V - 1)) / 2;
    const targetE = Math.min(prng.nextInt(edgeCountMin, edgeCountMax), maxPossibleEdges);

    const edgeSet = new Set();
    const edges = [];

    while (edges.length < targetE) {
      const u = prng.nextInt(0, V - 1);
      const v = prng.nextInt(0, V - 1);

      if (u === v) continue; // No self-loops

      const edgeKey = directed ? `${u}->${v}` : u < v ? `${u}-${v}` : `${v}-${u}`;
      if (edgeSet.has(edgeKey)) continue;

      edgeSet.add(edgeKey);
      const weight = weighted ? prng.nextInt(weightMin, weightMax) : null;

      if (weighted) {
        edges.push([u, v, weight]);
      } else {
        edges.push([u, v]);
      }
    }

    if (format === 'adjacencyList') {
      const adjList = {};
      for (let i = 0; i < V; i++) adjList[i] = [];

      edges.forEach(edge => {
        const u = edge[0];
        const v = edge[1];
        const w = weighted ? edge[2] : null;

        adjList[u].push(weighted ? { node: v, weight: w } : v);
        if (!directed) {
          adjList[v].push(weighted ? { node: u, weight: w } : u);
        }
      });
      return { numVertices: V, adjacencyList: adjList };
    }

    if (format === 'adjacencyMatrix') {
      const matrix = Array.from({ length: V }, () => Array(V).fill(0));
      edges.forEach(edge => {
        const u = edge[0];
        const v = edge[1];
        const w = weighted ? edge[2] : 1;

        matrix[u][v] = w;
        if (!directed) {
          matrix[v][u] = w;
        }
      });
      return { numVertices: V, adjacencyMatrix: matrix };
    }

    // Default edgeList
    return { numVertices: V, edges, directed, weighted };
  }
}
