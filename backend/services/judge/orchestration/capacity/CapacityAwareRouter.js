/**
 * CapacityAwareRouter - Workload Classification & Capacity Borrowing Router
 * (Phase 13 Capacity Management Module)
 * 
 * Classifies jobs into LIGHTWEIGHT (Python/Node) vs HEAVY (C++/Java) resource classes.
 * Enforces soft 60/40 capacity allocation and dynamic slot borrowing when workloads are asymmetrical.
 */
export class CapacityAwareRouter {
  static WORKLOAD_CLASSES = {
    LIGHTWEIGHT: 'LIGHTWEIGHT',
    HEAVY: 'HEAVY'
  };

  /**
   * Classifies source code language into LIGHTWEIGHT or HEAVY resource class.
   * 
   * @param {string} language Programming language name
   * @returns {string} 'LIGHTWEIGHT' | 'HEAVY'
   */
  static classifyWorkload(language = 'javascript') {
    const lang = (language || 'javascript').toLowerCase();
    if (lang === 'cpp' || lang === 'c++' || lang === 'java') {
      return CapacityAwareRouter.WORKLOAD_CLASSES.HEAVY;
    }
    return CapacityAwareRouter.WORKLOAD_CLASSES.LIGHTWEIGHT;
  }

  /**
   * Evaluates capacity availability and soft borrowing rules for job dispatch.
   * 
   * @param {Object} params
   * @param {string} params.language Target programming language
   * @param {number} params.totalExecutionSlots Total sum of maxConcurrency across active workers
   * @param {number} params.activeLightweightCount Number of currently running lightweight jobs
   * @param {number} params.activeHeavyCount Number of currently running heavy jobs
   * @param {number} params.heavyWaitTimeMs Current p95 wait time for heavy jobs
   * @returns {Object} { allowed: boolean, class: string, borrowed: boolean }
   */
  static canExecute({
    language = 'javascript',
    totalExecutionSlots = 10,
    activeLightweightCount = 0,
    activeHeavyCount = 0,
    heavyWaitTimeMs = 0
  }) {
    const workloadClass = CapacityAwareRouter.classifyWorkload(language);
    const softLightweightSlots = Math.ceil(totalExecutionSlots * 0.60);
    const softHeavySlots = totalExecutionSlots - softLightweightSlots;

    if (workloadClass === CapacityAwareRouter.WORKLOAD_CLASSES.LIGHTWEIGHT) {
      // Lightweight can consume up to soft quota, OR up to total slots if Heavy queue is empty
      if (activeLightweightCount < softLightweightSlots || activeHeavyCount === 0) {
        return { allowed: true, class: workloadClass, borrowed: false };
      }
      return { allowed: activeLightweightCount < totalExecutionSlots, class: workloadClass, borrowed: true };
    }

    // Heavy Workload
    if (activeHeavyCount < softHeavySlots || activeLightweightCount === 0) {
      return { allowed: true, class: workloadClass, borrowed: false };
    }

    // Check dynamic borrowing condition: Heavy wait > 5000ms AND Lightweight utilization < 30%
    const lightweightUtilization = softLightweightSlots > 0 ? (activeLightweightCount / softLightweightSlots) : 0;
    if (heavyWaitTimeMs > 5000 && lightweightUtilization < 0.30) {
      const maxBorrowedSlots = Math.floor(softLightweightSlots * 0.50);
      if (activeHeavyCount < (softHeavySlots + maxBorrowedSlots)) {
        return { allowed: true, class: workloadClass, borrowed: true };
      }
    }

    return { allowed: (activeLightweightCount + activeHeavyCount) < totalExecutionSlots, class: workloadClass, borrowed: false };
  }
}
