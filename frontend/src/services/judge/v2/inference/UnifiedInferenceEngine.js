import { InputSpecification } from '../specs/InputSpecification.js';
import { InputSpecIR } from '../specs/InputSpecIR.js';

/**
 * UnifiedInferenceEngine - Frontend Mirror for Sarthi Judge v2.0
 */
export class UnifiedInferenceEngine {
  static inferFromSignature(functionDefinition = {}, constraintsList = []) {
    const parameters = functionDefinition?.parameters || [];
    const firstParam = parameters[0] || { name: 'input', type: 'string' };
    const paramName = firstParam.name;
    const typeLower = (firstParam.type || 'string').toLowerCase();

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

      const lenMatch = line.match(/(?:(\d+)\s*<=?\s*)?\w+(?:\.length)?\s*<=?\s*(\d+)/i);
      if (lenMatch) {
        if (lenMatch[1]) validationSpec.minN = Number(lenMatch[1]);
        if (lenMatch[2]) validationSpec.maxN = Number(lenMatch[2]);
      }

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

    const inputSpec = new InputSpecification({
      structuralSpec: { category, type, grammarSpecRef },
      validationSpec
    });

    const ir = new InputSpecIR({
      problemId: `prob_inferred_${Date.now()}`,
      signature: functionDefinition,
      inputSpecification: inputSpec
    });

    // Universal v4.1 Provider Resolution Pipeline
    // Rule: Parser, Generator & Validator are driven by Input Parameters
    // Rule: Serializer & Comparator are driven by Return Type
    const retTypeLower = (functionDefinition?.returnType || 'void').toLowerCase();

    let parserId = 'PrimitiveParserProvider';
    let generatorId = 'PrimitiveGeneratorProvider';
    let validatorId = 'PrimitiveValidatorProvider';

    if (category === 'LIST') {
      if (type === 'RandomListNode') {
        parserId = 'RandomListParserProvider';
        generatorId = 'RandomListGeneratorProvider';
        validatorId = 'RandomListValidatorProvider';
      } else {
        parserId = 'LinkedListParserProvider';
        generatorId = 'LinkedListGeneratorProvider';
        validatorId = 'LinkedListValidatorProvider';
      }
    } else if (category === 'TREE') {
      parserId = type === 'NaryTreeNode' ? 'NaryTreeParserProvider' : (type === 'TrieNode' ? 'TrieParserProvider' : 'BinaryTreeParserProvider');
      generatorId = type === 'NaryTreeNode' ? 'NaryTreeGeneratorProvider' : (type === 'TrieNode' ? 'TrieGeneratorProvider' : 'BinaryTreeGeneratorProvider');
      validatorId = type === 'NaryTreeNode' ? 'NaryTreeValidatorProvider' : (type === 'TrieNode' ? 'TrieValidatorProvider' : 'BinaryTreeValidatorProvider');
    } else if (category === 'GRAPH') {
      parserId = 'GraphParserProvider';
      generatorId = 'GraphGeneratorProvider';
      validatorId = 'GraphValidatorProvider';
    } else if (category === 'GRAMMAR') {
      parserId = 'PrimitiveParserProvider';
      generatorId = grammarSpecRef === 'EncodedBracketEncoding' ? 'EncodedStringGrammarProvider' : 'ExpressionGrammarProvider';
      validatorId = 'PrimitiveValidatorProvider';
    } else if (category === 'ARRAY') {
      parserId = 'ArrayParserProvider';
      generatorId = 'ArrayPrimitiveGenerator';
      validatorId = 'PrimitiveValidatorProvider';
    } else if (category === 'MATRIX') {
      parserId = 'MatrixParserProvider';
      generatorId = 'MatrixPrimitiveGenerator';
      validatorId = 'PrimitiveValidatorProvider';
    } else if (category === 'PRIMITIVE' && type === 'number') {
      parserId = 'PrimitiveParserProvider';
      generatorId = 'NumberPrimitiveGenerator';
      validatorId = 'PrimitiveValidatorProvider';
    }

    // Serializer and Comparator Resolution (Driven strictly by Return Type)
    let serializerId = 'PrimitiveSerializerProvider';
    let comparatorId = 'PrimitiveComparatorProvider';

    if (retTypeLower.includes('listnode') || retTypeLower.includes('linkedlist')) {
      if (retTypeLower.includes('random')) {
        serializerId = 'RandomListSerializerProvider';
        comparatorId = 'RandomListComparatorProvider';
      } else {
        serializerId = 'LinkedListSerializerProvider';
        comparatorId = 'LinkedListComparatorProvider';
      }
    } else if (retTypeLower.includes('treenode') || retTypeLower.includes('tree')) {
      serializerId = 'BinaryTreeSerializerProvider';
      comparatorId = 'BinaryTreeComparatorProvider';
    } else if (retTypeLower.includes('graph')) {
      serializerId = 'GraphSerializerProvider';
      comparatorId = 'GraphComparatorProvider';
    } else if (retTypeLower.includes('[]') || retTypeLower.includes('array') || retTypeLower.includes('list')) {
      serializerId = 'ArraySerializerProvider';
      comparatorId = 'ArrayComparatorProvider';
    } else if (retTypeLower.includes('matrix')) {
      serializerId = 'MatrixSerializerProvider';
      comparatorId = 'MatrixComparatorProvider';
    } else {
      // boolean, number, string, void primitives
      serializerId = 'PrimitiveSerializerProvider';
      comparatorId = 'PrimitiveComparatorProvider';
    }

    return {
      inputSpec,
      ir,
      resolvedPlugins: {
        parserId,
        generatorId,
        validatorId,
        serializerId,
        comparatorId
      }
    };
  }
}
