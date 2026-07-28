import { generatePythonDriverHarness } from './pythonDriverTemplate.js';

export class DriverGeneratorService {
  static generateDriverHarness(language, studentCode, functionDefinition, executionProfile, testCases = []) {
    const cleanLang = (language || '').toLowerCase().trim();

    switch (cleanLang) {
      case 'python':
      case 'python3':
      case 'py':
        return generatePythonDriverHarness(studentCode, functionDefinition, executionProfile, testCases);
      default:
        return generatePythonDriverHarness(studentCode, functionDefinition, executionProfile, testCases);
    }
  }
}
