/**
 * Graph Node Output Serializer (Phase 4)
 * Converts a `GraphNode` network into a deterministic canonical adjacency representation.
 * Supports arbitrary graph node values (not limited to 1..V) and handles cyclic structures safely.
 */
export class GraphNodeSerializer {
  static serialize(entryNode) {
    if (entryNode === null || entryNode === undefined) return [];

    if (Array.isArray(entryNode)) return entryNode; // Already an adjacency array

    // 1. Discover all reachable vertices using BFS and a visited Set
    const visited = new Set();
    const discoveredNodes = [];
    const queue = [entryNode];
    visited.add(entryNode);

    while (queue.length > 0) {
      const current = queue.shift();
      discoveredNodes.push(current);

      const neighbors = Array.isArray(current.neighbors) ? current.neighbors : [];
      for (const neighbor of neighbors) {
        if (neighbor && !visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    if (discoveredNodes.length === 0) return [];

    // 2. Sort nodes deterministically by val
    discoveredNodes.sort((a, b) => {
      if (typeof a.val === 'number' && typeof b.val === 'number') {
        return a.val - b.val;
      }
      return String(a.val).localeCompare(String(b.val));
    });

    // 3. Check if nodes form a contiguous 1..V sequence
    const isStandard1ToV = discoveredNodes.every((n, i) => n.val === i + 1);

    if (isStandard1ToV) {
      // Standard LeetCode-style 1..V 2D adjacency array
      return discoveredNodes.map(node => {
        const neighborVals = (node.neighbors || []).map(n => (n && n.val !== undefined ? n.val : n));
        return neighborVals;
      });
    }

    // Arbitrary node values: Return deterministic array of node descriptors
    return discoveredNodes.map(node => ({
      val: node.val,
      neighbors: (node.neighbors || []).map(n => (n && n.val !== undefined ? n.val : n))
    }));
  }
}
