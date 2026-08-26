import { generatePythonDriverHarness } from './PythonDriverGenerator.js';
import { generateJavaScriptDriverHarness } from './JavaScriptDriverGenerator.js';
import { generateCppDriverHarness } from './CppDriverGenerator.js';
import { generateJavaDriverHarness } from './JavaDriverGenerator.js';
import { UnsupportedLanguageError } from './DriverErrors.js';
import { SemanticValidatorRegistry } from '../validators/SemanticValidatorRegistry.js';

export {
  generatePythonDriverHarness,
  generateJavaScriptDriverHarness,
  generateCppDriverHarness,
  generateJavaDriverHarness,
  UnsupportedLanguageError
};

export class DriverGeneratorService {
  /**
   * Universal Driver Harness Generator Router (Phase 6)
   * 
   * @param {string} language Target language ('python', 'javascript', 'cpp', 'java')
   * @param {string} studentCode Student solution source code
   * @param {Object} functionDefinition Function signature metadata (name, parameters, returnType)
   * @param {Object} executionProfile Execution options (inPlaceMutation, mutatedParameter, semanticValidator)
   * @param {Array} testCases Array of testcases with input IRs
   * @returns {string} Complete, self-contained driver source code
   */
  static generateDriverHarness(language, studentCode, functionDefinition, executionProfile = {}, testCases = []) {
    if (executionProfile?.semanticValidator) {
      SemanticValidatorRegistry.assertValid(executionProfile.semanticValidator);
    }
    const cleanLang = (language || '').toLowerCase().trim();

    switch (cleanLang) {
      case 'python':
      case 'python3':
      case 'py':
        return generatePythonDriverHarness(studentCode, functionDefinition, executionProfile, testCases);

      case 'javascript':
      case 'js':
      case 'node':
      case 'nodejs':
        return generateJavaScriptDriverHarness(studentCode, functionDefinition, executionProfile, testCases);

      case 'cpp':
      case 'c++':
      case 'cplusplus':
        return generateCppDriverHarness(studentCode, functionDefinition, executionProfile, testCases);

      case 'java':
        return generateJavaDriverHarness(studentCode, functionDefinition, executionProfile, testCases);

      default:
        throw new UnsupportedLanguageError(language);
    }
  }
}
