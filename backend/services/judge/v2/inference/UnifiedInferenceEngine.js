import { InputSpecification } from '../specs/InputSpecification.js';
import { InputSpecIR } from '../specs/InputSpecIR.js';
import { ProviderRegistry } from '../registries/ProviderRegistry.js';

/**
 * UnifiedInferenceEngine - Multi-Signal Auto-Inference Engine (v4.1)
 * Derives InputSpecification, InputSpecIR, and best Provider bindings from function signature and constraints.
 */
export class UnifiedInferenceEngine {
  static inferFromSignature(functionDefinition = {}, constraintsList = []) {
    const parameters = functionDefinition?.parameters || [];
    const firstParam = parameters[0] || { name: 'input', type: 'string' };
    const paramName = firstParam.name;
    const typeLower = (firstParam.type || 'string').toLowerCase();

    // 1. Determine Structural Specification Category & Type
    let category = 'PRIMITIVE';
    let type = typeLower;
    let grammarSpecRef = null;

    if (typeLower === 'listnode' || typeLower === 'linkedlist') {
      category = 'LIST';
      type = 'ListNode';
    } else if (typeLower === 'randomlistnode' || typeLower === 'randomlist') {
      category = 'LIST';
      type = 'RandomListNode';
    } else if (typeLower === 'treenode' || typeLower === 'binarytree') {
      category = 'TREE';
      type = 'TreeNode';
    } else if (typeLower === 'narytreenode' || typeLower === 'narytree') {
      category = 'TREE';
      type = 'NaryTreeNode';
    } else if (typeLower === 'graphnode' || typeLower === 'graph' || typeLower === 'dag') {
      category = 'GRAPH';
      type = typeLower.includes('dag') ? 'DAG' : 'GraphNode';
    } else if (typeLower === 'trienode' || typeLower === 'trie') {
      category = 'TREE';
      type = 'TrieNode';
    } else if (typeLower.includes('matrix') || typeLower.includes('[][]')) {
      category = 'MATRIX';
      type = typeLower;
    } else if (typeLower.endsWith('[]')) {
      category = 'ARRAY';
      type = typeLower;
    } else if (typeLower === 'string') {
      category = 'PRIMITIVE';
      type = 'string';
    }

    // 2. Parse Text Constraints for Bounds & Charset
    const validationSpec = {
      minN: 1,
      maxN: 30,
      minValue: -100,
      maxValue: 100,
      charset: 'alphabetic',
      customCharset: null,
      maxK: 5,
      maxDepth: 2
    };

    const textArray = Array.isArray(constraintsList)
      ? constraintsList.map(c => (typeof c === 'string' ? c : (c?.text || '')))
      : [];

    textArray.forEach(line => {
      if (!line) return;
      const lineLower = line.toLowerCase();

      // Length bounds: 1 <= s.length <= 30
      const lenMatch = line.match(/(?:(\d+)\s*<=?\s*)?\w+(?:\.length)?\s*<=?\s*(\d+)/i);
      if (lenMatch) {
        if (lenMatch[1]) validationSpec.minN = Number(lenMatch[1]);
        if (lenMatch[2]) validationSpec.maxN = Number(lenMatch[2]);
      }

      // Check for Encoded Bracket String / Grammar signals
      if (typeLower === 'string' && (lineLower.includes('bracket') || lineLower.includes('[]') || lineLower.includes('encoded'))) {
        category = 'GRAMMAR';
        grammarSpecRef = 'EncodedBracketEncoding';
        validationSpec.charset = 'custom';
        validationSpec.customCharset = 'abcdefghijklmnopqrstuvwxyz0123456789[]';
      } else if (typeLower === 'string' && (lineLower.includes('rpn') || lineLower.includes('calculator') || lineLower.includes('expression'))) {
        category = 'GRAMMAR';
        grammarSpecRef = lineLower.includes('rpn') ? 'rpn' : 'calculator';
      }
    });

    // 3. Construct InputSpecification & InputSpecIR
    const inputSpec = new InputSpecification({
      structuralSpec: { category, type, grammarSpecRef },
      validationSpec
    });

    const ir = new InputSpecIR({
      problemId: `prob_inferred_${Date.now()}`,
      signature: functionDefinition,
      inputSpecification: inputSpec
    });

    // 4. Capability Scoring via ProviderRegistry
    const generator = ProviderRegistry.findBestProvider('GENERATOR', ir);
    const parser = ProviderRegistry.findBestProvider('PARSER', ir);
    const serializer = ProviderRegistry.findBestProvider('SERIALIZER', ir);
    const comparator = ProviderRegistry.findBestProvider('COMPARATOR', ir);
    const validator = ProviderRegistry.findBestProvider('VALIDATOR', ir);

    ir.resolvedPlugins = {
      generatorId: generator ? generator.id : 'DefaultGenerator',
      parserId: parser ? parser.id : 'DefaultParser',
      serializerId: serializer ? serializer.id : 'DefaultSerializer',
      comparatorId: comparator ? comparator.id : 'DefaultComparator',
      validatorId: validator ? validator.id : 'DefaultValidator'
    };

    return {
      inputSpec,
      ir,
      resolvedPlugins: ir.resolvedPlugins
    };
  }
}
