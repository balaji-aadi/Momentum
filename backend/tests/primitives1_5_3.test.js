import { describe, test, before } from 'node:test';
import assert from 'node:assert';
import { SeededPRNG } from '../services/judge/generators/prng/SeededPRNG.js';
import { TreePrimitive } from '../services/judge/generators/primitives/TreePrimitive.js';
import { GraphPrimitive } from '../services/judge/generators/primitives/GraphPrimitive.js';
import { ArrayPrimitive } from '../services/judge/generators/primitives/ArrayPrimitive.js';
import { StringPrimitive } from '../services/judge/generators/primitives/StringPrimitive.js';
import { MatrixPrimitive } from '../services/judge/generators/primitives/MatrixPrimitive.js';
import { LinkedListPrimitive } from '../services/judge/generators/primitives/LinkedListPrimitive.js';
import { GeneratorPluginRegistry } from '../services/judge/generators/registries/GeneratorPluginRegistry.js';

describe('Phase 1.5.3 Primitives: Tree & Graph', () => {
  let treeGen, graphGen;

  before(() => {
    treeGen = new TreePrimitive();
    graphGen = new GraphPrimitive();

    GeneratorPluginRegistry.registerPrimitive('TreePrimitive', treeGen);
    GeneratorPluginRegistry.registerPrimitive('GraphPrimitive', graphGen);
    GeneratorPluginRegistry.registerPrimitive('ArrayPrimitive', new ArrayPrimitive());
    GeneratorPluginRegistry.registerPrimitive('StringPrimitive', new StringPrimitive());
    GeneratorPluginRegistry.registerPrimitive('MatrixPrimitive', new MatrixPrimitive());
    GeneratorPluginRegistry.registerPrimitive('LinkedListPrimitive', new LinkedListPrimitive());
  });

  describe('1. TreePrimitive Unit Tests', () => {
    test('Level-order array serialization and non-null node count validation', () => {
      const prng = new SeededPRNG(1234);
      const tree = treeGen.generate(prng, { nodeCountMin: 6, nodeCountMax: 6, valueMin: 1, valueMax: 50 });

      assert.strictEqual(Array.isArray(tree), true);
      const nonNullCount = tree.filter(val => val !== null).length;
      assert.strictEqual(nonNullCount, 6);

      // Trailing element must not be null
      assert.notStrictEqual(tree[tree.length - 1], null);
    });

    test('Seeded PRNG reproducibility for tree level-order arrays', () => {
      const prngA = new SeededPRNG(133742);
      const prngB = new SeededPRNG(133742);

      const treeA = treeGen.generate(prngA, { nodeCountMin: 8, nodeCountMax: 8 });
      const treeB = treeGen.generate(prngB, { nodeCountMin: 8, nodeCountMax: 8 });

      assert.deepStrictEqual(treeA, treeB);
    });
  });

  describe('2. GraphPrimitive Unit Tests', () => {
    test('EdgeList format, vertex count, and edge count validation', () => {
      const prng = new SeededPRNG(5678);
      const graph = graphGen.generate(prng, {
        vertexCountMin: 5, vertexCountMax: 5,
        edgeCountMin: 4, edgeCountMax: 4,
        directed: false, weighted: false,
        format: 'edgeList'
      });

      assert.strictEqual(graph.numVertices, 5);
      assert.strictEqual(graph.edges.length, 4);
      graph.edges.forEach(edge => {
        assert.strictEqual(edge.length, 2);
        assert.strictEqual(edge[0] >= 0 && edge[0] < 5, true);
        assert.strictEqual(edge[1] >= 0 && edge[1] < 5, true);
      });
    });

    test('Weighted directed graph adjacencyList format validation', () => {
      const prng = new SeededPRNG(9012);
      const graph = graphGen.generate(prng, {
        vertexCountMin: 6, vertexCountMax: 6,
        edgeCountMin: 5, edgeCountMax: 5,
        directed: true, weighted: true,
        weightMin: 10, weightMax: 50,
        format: 'adjacencyList'
      });

      assert.strictEqual(graph.numVertices, 6);
      assert.strictEqual(typeof graph.adjacencyList, 'object');

      let totalEdges = 0;
      Object.values(graph.adjacencyList).forEach(neighbors => {
        totalEdges += neighbors.length;
        neighbors.forEach(neighbor => {
          assert.strictEqual(neighbor.weight >= 10 && neighbor.weight <= 50, true);
        });
      });

      assert.strictEqual(totalEdges, 5);
    });

    test('AdjacencyMatrix format validation', () => {
      const prng = new SeededPRNG(3456);
      const graph = graphGen.generate(prng, {
        vertexCountMin: 4, vertexCountMax: 4,
        format: 'adjacencyMatrix'
      });

      assert.strictEqual(graph.numVertices, 4);
      assert.strictEqual(graph.adjacencyMatrix.length, 4);
      graph.adjacencyMatrix.forEach(row => {
        assert.strictEqual(row.length, 4);
      });
    });
  });

  describe('3. Complete Primitive Suite Registry Integration Test', () => {
    test('All 5 primitive generators registered and accessible from GeneratorPluginRegistry', () => {
      const registeredList = GeneratorPluginRegistry.listPrimitives();

      assert.strictEqual(registeredList.includes('ArrayPrimitive'), true);
      assert.strictEqual(registeredList.includes('StringPrimitive'), true);
      assert.strictEqual(registeredList.includes('MatrixPrimitive'), true);
      assert.strictEqual(registeredList.includes('LinkedListPrimitive'), true);
      assert.strictEqual(registeredList.includes('TreePrimitive'), true);
      assert.strictEqual(registeredList.includes('GraphPrimitive'), true);
    });
  });
});
