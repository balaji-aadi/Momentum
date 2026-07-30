import { IGeneratorProvider, IComparatorProvider } from '../../contracts/ProviderContracts.js';

export class BinaryTreeGeneratorProvider extends IGeneratorProvider {
  constructor() {
    super('BinaryTreeGeneratorProvider', '1.0.0');
  }

  supports(ir) {
    const type = (ir?.inputSpecification?.structuralSpec?.type || '').toLowerCase();
    const category = ir?.inputSpecification?.structuralSpec?.category;

    if (category === 'TREE' || type === 'treenode' || type === 'binarytree' || type === 'bst') {
      return 0.95;
    }
    return 0.0;
  }

  generate(prng, ir, options = {}) {
    const paramName = options.paramName || 'root';
    const validation = ir?.inputSpecification?.validationSpec || {};
    const count = prng.nextInt(validation.minN ?? 3, validation.maxN ?? 7);
    const minVal = validation.minValue ?? 1;
    const maxVal = validation.maxValue ?? 50;

    const isBST = ir?.inputSpecification?.structuralSpec?.type?.toLowerCase() === 'bst';

    if (isBST) {
      // Generate sorted distinct values for BST
      const vals = new Set();
      while (vals.size < count) {
        vals.add(prng.nextInt(minVal, maxVal));
      }
      const sorted = Array.from(vals).sort((a, b) => a - b);
      return { input: { [paramName]: sorted }, expectedOutput: null };
    }

    // Standard Binary Tree Level-Order Array: [1, 2, 3, null, null, 4]
    const treeArr = [prng.nextInt(minVal, maxVal)];
    for (let i = 1; i < count; i++) {
      treeArr.push(prng.nextInt(1, 10) > 2 ? prng.nextInt(minVal, maxVal) : null);
    }

    return {
      input: { [paramName]: treeArr },
      expectedOutput: null
    };
  }
}

export class BinaryTreeComparatorProvider extends IComparatorProvider {
  constructor() {
    super('BinaryTreeComparatorProvider', '1.0.0');
  }

  supports(ir) {
    const type = (ir?.inputSpecification?.structuralSpec?.type || '').toLowerCase();
    const category = ir?.inputSpecification?.structuralSpec?.category;
    if (category === 'TREE' || type === 'treenode' || type === 'binarytree' || type === 'bst') {
      return 0.95;
    }
    return 0.0;
  }

  compare(actual, expected) {
    const toCanonical = (val) => {
      if (Array.isArray(val)) return JSON.stringify(val);
      if (!val) return '[]';

      // BFS Level-Order Traversal
      const res = [];
      const queue = [val];
      while (queue.length > 0) {
        const curr = queue.shift();
        if (curr) {
          res.push(curr.val);
          queue.push(curr.left);
          queue.push(curr.right);
        } else {
          res.push(null);
        }
      }
      // Trim trailing nulls
      while (res.length > 0 && res[res.length - 1] === null) {
        res.pop();
      }
      return JSON.stringify(res);
    };

    return toCanonical(actual) === toCanonical(expected);
  }
}
