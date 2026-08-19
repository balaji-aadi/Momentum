import { InputParserError, validateIR } from './IRValidator.js';

/**
 * Graph Input Parser (for GraphNode data structure representations)
 * Produces GraphNodeIR: {
 *   kind: 'graph_node',
 *   nodeType: 'GraphNode',
 *   entryNodeVal: 1,
 *   adjacencyList: [...],
 *   vertexCount: ...
 * }
 */
export class GraphParser {
  static parse(val, targetType = 'GraphNode', paramName = 'node') {
    if (val === null || val === undefined) {
      return validateIR({
        kind: 'graph_node',
        nodeType: 'GraphNode',
        entryNodeVal: 1,
        adjacencyList: [],
        vertexCount: 0
      });
    }

    let adjList = val;
    if (typeof val === 'string') {
      try {
        adjList = JSON.parse(val);
      } catch (e) {
        throw new InputParserError('GraphParser', paramName, val, 'JSON Array of adjacency neighbors', e.message);
      }
    }

    if (!Array.isArray(adjList)) {
      throw new InputParserError('GraphParser', paramName, val, '1-indexed Adjacency List Array [[2,4],[1,3],...]');
    }

    const V = adjList.length;
    if (V === 0) {
      return validateIR({
        kind: 'graph_node',
        nodeType: 'GraphNode',
        entryNodeVal: 1,
        adjacencyList: [],
        vertexCount: 0
      });
    }

    for (let i = 0; i < V; i++) {
      const neighbors = adjList[i];
      if (!Array.isArray(neighbors)) {
        throw new InputParserError('GraphParser', `${paramName}[${i}]`, neighbors, 'Array of neighbor vertex indices');
      }

      for (const nVal of neighbors) {
        if (typeof nVal !== 'number' || nVal < 1 || nVal > V) {
          throw new InputParserError(
            'GraphParser',
            `${paramName}[${i}]`,
            nVal,
            `Valid 1-indexed vertex in range [1, ${V}]`,
            `Vertex ${nVal} is out of graph bounds`
          );
        }
      }
    }

    const ir = {
      kind: 'graph_node',
      nodeType: 'GraphNode',
      entryNodeVal: 1,
      adjacencyList: adjList,
      vertexCount: V
    };

    return validateIR(ir);
  }
}
