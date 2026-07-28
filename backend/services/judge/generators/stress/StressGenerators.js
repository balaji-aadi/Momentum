import { ArrayPrimitive } from '../primitives/ArrayPrimitive.js';
import { SkewedTreePlugin } from '../plugins/SkewedTreePlugin.js';
import { GraphPrimitive } from '../primitives/GraphPrimitive.js';

/**
 * StressGenerators - Worst-Case Performance & Complexity Limit Test Generator Layer
 * Intentionally generates worst-case inputs (N = 10^5, max depth trees, dense graphs)
 * designed to trigger TLE (Time Limit Exceeded) and MLE (Memory Limit Exceeded).
 */
export class StressGenerators {
  /**
   * Generates maximum length array stress testcase (N = maxN, extreme min/max values).
   * @param {SeededPRNG} prng
   * @param {Object} options
   * @param {number} [options.maxN=100000]
   * @param {number} [options.minValue=-1000000000]
   * @param {number} [options.maxValue=1000000000]
   * @returns {{ input: { nums: number[] }, isStress: true, category: 'MaxArray' }}
   */
  static generateMaxArrayStress(prng, options = {}) {
    const {
      maxN = 100000,
      minValue = -1000000000,
      maxValue = 1000000000
    } = options;

    const arrayPrimitive = new ArrayPrimitive();
    const nums = arrayPrimitive.generate(prng, {
      lengthMin: maxN,
      lengthMax: maxN,
      valueMin: minValue,
      valueMax: maxValue
    });

    return {
      input: { nums },
      isStress: true,
      category: 'MaxArray'
    };
  }

  /**
   * Generates deep skewed tree stress testcase (Height H = nodeCount, e.g. 5000)
   * to test recursion stack overflow or O(H) depth TLE.
   * @param {SeededPRNG} prng
   * @param {Object} options
   * @param {number} [options.nodeCount=1000]
   * @param {string} [options.direction='right']
   * @returns {{ input: { root: (number|null)[] }, isStress: true, category: 'DeepTree' }}
   */
  static generateDeepSkewedTreeStress(prng, options = {}) {
    const { nodeCount = 1000, direction = 'right' } = options;
    const skewedPlugin = new SkewedTreePlugin();

    const res = skewedPlugin.apply(prng, null, {
      nodeCountMin: nodeCount,
      nodeCountMax: nodeCount,
      direction
    });

    return {
      input: res.input,
      isStress: true,
      category: 'DeepTree'
    };
  }

  /**
   * Generates dense graph stress testcase (V = maxV, E = maxE)
   * designed to test O(V^2) or O(E log V) algorithm efficiency limits.
   * @param {SeededPRNG} prng
   * @param {Object} options
   * @param {number} [options.maxV=1000]
   * @param {number} [options.maxE=5000]
   * @returns {{ input: any, isStress: true, category: 'DenseGraph' }}
   */
  static generateDenseGraphStress(prng, options = {}) {
    const { maxV = 1000, maxE = 5000 } = options;
    const graphPrimitive = new GraphPrimitive();

    const graph = graphPrimitive.generate(prng, {
      vertexCountMin: maxV,
      vertexCountMax: maxV,
      edgeCountMin: maxE,
      edgeCountMax: maxE,
      format: 'edgeList'
    });

    return {
      input: { n: graph.numVertices, edges: graph.edges },
      isStress: true,
      category: 'DenseGraph'
    };
  }

  /**
   * Generates worst-case Two Sum stress testcase:
   * Placed the matching target pair at the VERY LAST TWO INDICES (nums[N-2] + nums[N-1] = target).
   * Forces O(N^2) brute-force solutions to scan the entire N(N-1)/2 array space.
   * @param {SeededPRNG} prng
   * @param {Object} options
   * @param {number} [options.maxN=50000]
   * @returns {{ input: { nums: number[], target: number }, isStress: true, category: 'WorstCaseTwoSum' }}
   */
  static generateWorstCaseTwoSumStress(prng, options = {}) {
    const { maxN = 50000 } = options;
    const set = new Set();

    while (set.size < maxN) {
      set.add(prng.nextInt(1, 1000000));
    }

    const nums = Array.from(set);
    // Target is formed by last two elements
    const target = nums[maxN - 2] + nums[maxN - 1];

    return {
      input: { nums, target },
      isStress: true,
      category: 'WorstCaseTwoSum'
    };
  }

  /**
   * Generates worst-case DP / Backtracking stress testcase:
   * Large target total and subset array designed to trigger exponential O(2^N) recursion without memoization.
   * @param {SeededPRNG} prng
   * @param {Object} options
   * @param {number} [options.count=35]
   * @param {number} [options.targetTotal=10000]
   * @returns {{ input: { candidates: number[], target: number }, isStress: true, category: 'WorstCaseDP' }}
   */
  static generateWorstCaseDPStress(prng, options = {}) {
    const { count = 35, targetTotal = 10000 } = options;
    const candidates = [];

    for (let i = 0; i < count; i++) {
      candidates.push(prng.nextInt(100, 500));
    }

    return {
      input: { candidates, target: targetTotal },
      isStress: true,
      category: 'WorstCaseDP'
    };
  }
}
