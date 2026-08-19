import { createComparisonResult } from './ComparatorErrors.js';
import { GraphNodeSerializer } from '../outputSerializers/GraphNodeSerializer.js';

/**
 * Graph Match Comparator (Phase 5)
 * Compares canonical graph outputs enforcing strict labeled-node equivalence.
 */
export class GraphMatch {
  static compare(actual, expected) {
    const COMP_NAME = 'GraphMatch';

    let normActual = Array.isArray(actual) ? actual : GraphNodeSerializer.serialize(actual);
    let normExpected = Array.isArray(expected) ? expected : GraphNodeSerializer.serialize(expected);

    // 1. Null / Empty Checks
    if (normActual.length === 0 && normExpected.length === 0) {
      return createComparisonResult(true, COMP_NAME, 'MATCH', 'Both graphs are empty.', normExpected, normActual);
    }
    if (normActual.length !== normExpected.length) {
      return createComparisonResult(
        false,
        COMP_NAME,
        'LENGTH_MISMATCH',
        `Graph vertex count mismatch: expected ${normExpected.length} vertices, received ${normActual.length} vertices.`,
        normExpected,
        normActual,
        { expectedVertexCount: normExpected.length, actualVertexCount: normActual.length }
      );
    }

    // 2. Format Normalization: Convert 2D Adjacency Array to Labeled Node Descriptors if mixed
    const isStandardActual = normActual.length > 0 && Array.isArray(normActual[0]);
    const isStandardExpected = normExpected.length > 0 && Array.isArray(normExpected[0]);

    if (isStandardActual && !isStandardExpected) {
      normActual = normActual.map((neighbors, idx) => ({ val: idx + 1, neighbors: neighbors || [] }));
    } else if (!isStandardActual && isStandardExpected) {
      normExpected = normExpected.map((neighbors, idx) => ({ val: idx + 1, neighbors: neighbors || [] }));
    } else if (isStandardActual && isStandardExpected) {
      // Both are standard 1..V Adjacency Arrays
      for (let i = 0; i < normExpected.length; i++) {
        const expNeighbors = [...normExpected[i]].sort((a, b) => a - b);
        const actNeighbors = [...normActual[i]].sort((a, b) => a - b);

        if (JSON.stringify(expNeighbors) !== JSON.stringify(actNeighbors)) {
          return createComparisonResult(
            false,
            COMP_NAME,
            'GRAPH_MISMATCH',
            `Adjacency mismatch at vertex ${i + 1}: expected neighbors ${JSON.stringify(expNeighbors)}, received ${JSON.stringify(actNeighbors)}.`,
            normExpected,
            normActual,
            { vertex: i + 1, expectedNeighbors: expNeighbors, actualNeighbors: actNeighbors }
          );
        }
      }
      return createComparisonResult(true, COMP_NAME, 'MATCH', 'Graph adjacency structures match perfectly.', normExpected, normActual);
    }

    // 3. Arbitrary Node Label Descriptors [{ val: 10, neighbors: [20, 50] }, ...]
    // Map by val for labeled equivalence comparison
    const buildGraphMap = (nodes) => {
      const map = new Map();
      for (const node of nodes) {
        if (!node || node.val === undefined) continue;
        const sortedNeighbors = (node.neighbors || []).slice().sort((a, b) => {
          if (typeof a === 'number' && typeof b === 'number') return a - b;
          return String(a).localeCompare(String(b));
        });
        map.set(String(node.val), sortedNeighbors);
      }
      return map;
    };

    const actualMap = buildGraphMap(normActual);
    const expectedMap = buildGraphMap(normExpected);

    for (const [nodeVal, expNeighbors] of expectedMap.entries()) {
      if (!actualMap.has(nodeVal)) {
        return createComparisonResult(
          false,
          COMP_NAME,
          'GRAPH_MISMATCH',
          `Missing expected vertex with label '${nodeVal}'.`,
          normExpected,
          normActual,
          { missingVertex: nodeVal }
        );
      }

      const actNeighbors = actualMap.get(nodeVal);
      if (JSON.stringify(expNeighbors) !== JSON.stringify(actNeighbors)) {
        return createComparisonResult(
          false,
          COMP_NAME,
          'GRAPH_MISMATCH',
          `Adjacency mismatch at vertex '${nodeVal}': expected neighbors ${JSON.stringify(expNeighbors)}, received ${JSON.stringify(actNeighbors)}.`,
          normExpected,
          normActual,
          { vertex: nodeVal, expectedNeighbors: expNeighbors, actualNeighbors: actNeighbors }
        );
      }
    }

    // Check for extra unexpected vertices
    for (const [nodeVal] of actualMap.entries()) {
      if (!expectedMap.has(nodeVal)) {
        return createComparisonResult(
          false,
          COMP_NAME,
          'GRAPH_MISMATCH',
          `Unexpected extra vertex with label '${nodeVal}'.`,
          normExpected,
          normActual,
          { extraVertex: nodeVal }
        );
      }
    }

    return createComparisonResult(true, COMP_NAME, 'MATCH', 'Labeled graph structures match perfectly.', normExpected, normActual);
  }
}
