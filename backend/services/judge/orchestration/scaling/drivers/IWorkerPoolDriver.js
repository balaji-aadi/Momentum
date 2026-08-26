/**
 * IWorkerPoolDriver - Abstract Worker Pool Infrastructure Driver Interface
 * (Phase 13 Auto-Scaling Driver Interface)
 * 
 * Standardizes worker pool management across Node threads, process clusters, and cloud pods.
 */
export class IWorkerPoolDriver {
  /**
   * Returns current active worker instance count.
   * @returns {Promise<number>}
   */
  async getActiveWorkerCount() {
    throw new Error("IWorkerPoolDriver.getActiveWorkerCount() must be implemented by subclass.");
  }

  /**
   * Returns list of currently active worker objects or IDs.
   * @returns {Promise<Array>}
   */
  async getActiveWorkers() {
    throw new Error("IWorkerPoolDriver.getActiveWorkers() must be implemented by subclass.");
  }

  /**
   * Scales the worker pool size safely to the target worker count.
   * @param {number} targetWorkerCount Desired number of workers
   * @returns {Promise<number>} Updated active worker count
   */
  async scaleTo(targetWorkerCount) {
    throw new Error("IWorkerPoolDriver.scaleTo() must be implemented by subclass.");
  }

  /**
   * Terminates a specific worker instance by ID.
   * @param {string} workerId 
   * @returns {Promise<boolean>}
   */
  async terminateWorker(workerId) {
    throw new Error("IWorkerPoolDriver.terminateWorker() must be implemented by subclass.");
  }
}
