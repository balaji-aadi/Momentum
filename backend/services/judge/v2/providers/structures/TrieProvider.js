import { IGeneratorProvider, IComparatorProvider } from '../../contracts/ProviderContracts.js';

export class TrieGeneratorProvider extends IGeneratorProvider {
  constructor() {
    super('TrieGeneratorProvider', '1.0.0');
  }

  supports(ir) {
    const type = (ir?.inputSpecification?.structuralSpec?.type || '').toLowerCase();
    if (type === 'trienode' || type === 'trie') {
      return 0.98;
    }
    return 0.0;
  }

  generate(prng, ir, options = {}) {
    const paramName = options.paramName || 'words';
    const validation = ir?.inputSpecification?.validationSpec || {};
    const count = prng.nextInt(validation.minN ?? 3, validation.maxN ?? 6);
    const charPool = 'abcdefghijklmnopqrstuvwxyz';

    const words = [];
    const prefixes = ['app', 'cat', 'car', 'bat'];
    for (let i = 0; i < count; i++) {
      const base = prefixes[i % prefixes.length];
      const suffixLen = prng.nextInt(0, 3);
      let word = base;
      for (let s = 0; s < suffixLen; s++) {
        word += charPool[prng.nextInt(0, charPool.length - 1)];
      }
      words.push(word);
    }

    return {
      input: { [paramName]: words },
      expectedOutput: null
    };
  }
}

export class TrieComparatorProvider extends IComparatorProvider {
  constructor() {
    super('TrieComparatorProvider', '1.0.0');
  }

  supports(ir) {
    const type = (ir?.inputSpecification?.structuralSpec?.type || '').toLowerCase();
    if (type === 'trienode' || type === 'trie') {
      return 0.98;
    }
    return 0.0;
  }

  compare(actual, expected) {
    return JSON.stringify(actual) === JSON.stringify(expected);
  }
}
