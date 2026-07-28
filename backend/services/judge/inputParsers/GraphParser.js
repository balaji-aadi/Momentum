import { GraphNode } from './nodes.js';

/**
 * Graph Input Parser
 * Converts adjacency list `[[2,4],[1,3],[2,4],[1,3]]` into GraphNode network connections.
 */

export class GraphParser {
  static parse(val) {
    if (val === null || val === undefined) return null;

    let adjList = val;
    if (typeof val === 'string') {
      try {
        adjList = JSON.parse(val);
      } catch (e) {
        throw new Error(`GraphParser: Unable to parse JSON adjacency list '${val}'`);
      }
    }

    if (!Array.isArray(adjList)) {
      if (typeof adjList === 'object' && adjList !== null && 'val' in adjList) {
        return adjList; // Already a GraphNode
      }
      throw new Error(`GraphParser: Expected adjacency list, received ${typeof adjList}`);
    }

    if (adjList.length === 0) return null;

    // Create node objects (1-indexed nodes)
    const nodes = {};
    for (let i = 1; i <= adjList.length; i++) {
      nodes[i] = new GraphNode(i);
    }

    // Connect edges
    adjList.forEach((neighbors, idx) => {
      const nodeVal = idx + 1;
      const currentNode = nodes[nodeVal];
      if (Array.isArray(neighbors)) {
        neighbors.forEach(nVal => {
          if (nodes[nVal]) {
            currentNode.neighbors.push(nodes[nVal]);
          }
        });
      }
    });

    return nodes[1] || null;
  }
}
