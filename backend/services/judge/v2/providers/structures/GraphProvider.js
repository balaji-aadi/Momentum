import { IGeneratorProvider, IComparatorProvider } from '../../contracts/ProviderContracts.js';

export class GraphGeneratorProvider extends IGeneratorProvider {
  constructor() {
    super('GraphGeneratorProvider', '1.0.0');
  }

  supports(ir) {
    const type = (ir?.inputSpecification?.structuralSpec?.type || '').toLowerCase();
    const category = ir?.inputSpecification?.structuralSpec?.category;

    if (category === 'GRAPH' || type === 'graphnode' || type === 'graph' || type === 'dag') {
      return 0.95;
    }
    return 0.0;
  }

  generate(prng, ir, options = {}) {
    const paramName = options.paramName || 'node';
    const validation = ir?.inputSpecification?.validationSpec || {};
    const numNodes = prng.nextInt(validation.minN ?? 3, validation.maxN ?? 6);
    const isDAG = (ir?.inputSpecification?.structuralSpec?.type || '').toLowerCase() === 'dag';

    // Generates Adjacency List: [[2,4],[1,3],[2,4],[1,3]]
    const adj = Array.from({ length: numNodes }, () => []);

    for (let i = 0; i < numNodes; i++) {
      const numEdges = prng.nextInt(1, Math.min(3, numNodes - 1));
      for (let e = 0; e < numEdges; e++) {
        const target = isDAG ? prng.nextInt(i + 1, numNodes - 1) : prng.nextInt(0, numNodes - 1);
        if (target >= 0 && target < numNodes && target !== i && !adj[i].includes(target + 1)) {
          adj[i].push(target + 1); // 1-indexed node labels
        }
      }
      adj[i].sort((a, b) => a - b);
    }

    return {
      input: { [paramName]: adj },
      expectedOutput: null
    };
  }
}

export class GraphComparatorProvider extends IComparatorProvider {
  constructor() {
    super('GraphComparatorProvider', '1.0.0');
  }

  supports(ir) {
    const type = (ir?.inputSpecification?.structuralSpec?.type || '').toLowerCase();
    const category = ir?.inputSpecification?.structuralSpec?.category;
    if (category === 'GRAPH' || type === 'graphnode' || type === 'graph' || type === 'dag') {
      return 0.95;
    }
    return 0.0;
  }

  compare(actual, expected) {
    const toCanonical = (val) => {
      if (Array.isArray(val)) {
        return JSON.stringify(val.map(row => (Array.isArray(row) ? [...row].sort((a, b) => a - b) : row)));
      }
      if (!val) return '[]';
      // GraphNode traversal if node object passed
      const visited = new Map();
      const queue = [val];
      while (queue.length > 0) {
        const curr = queue.shift();
        if (!visited.has(curr.val)) {
          visited.set(curr.val, (curr.neighbors || []).map(n => n.val).sort((a, b) => a - b));
          (curr.neighbors || []).forEach(n => queue.push(n));
        }
      }
      const sortedKeys = Array.from(visited.keys()).sort((a, b) => a - b);
      return JSON.stringify(sortedKeys.map(k => visited.get(k)));
    };

    return toCanonical(actual) === toCanonical(expected);
  }
}
