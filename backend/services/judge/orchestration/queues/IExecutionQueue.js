/**
 * IExecutionQueue - Abstract Execution Queue Interface
 * (Phase 11 Queue Abstraction Layer)
 * 
 * Defines standardized execution queue operations.
 */
export class IExecutionQueue {
  /**
   * Enqueues an ExecutionJob into the queue.
   * @param {ExecutionJob} job
   * @returns {Promise<void>}
   */
  async enqueue(job) {
    throw new Error("IExecutionQueue.enqueue() must be implemented by subclass.");
  }

  /**
   * Dequeues / claims the next available ExecutionJob from the queue.
   * @param {string} workerId Unique worker process identifier
   * @returns {Promise<ExecutionJob|null>}
   */
  async dequeue(workerId) {
    throw new Error("IExecutionQueue.dequeue() must be implemented by subclass.");
  }

  /**
   * Acknowledges successful execution completion of a job.
   * @param {string} jobId
   * @returns {Promise<void>}
   */
  async ack(jobId) {
    throw new Error("IExecutionQueue.ack() must be implemented by subclass.");
  }

  /**
   * Negative-acknowledges a failed job, scheduling requeue or dead-lettering.
   * @param {string} jobId
   * @param {string} reason
   * @returns {Promise<void>}
   */
  async nack(jobId, reason) {
    throw new Error("IExecutionQueue.nack() must be implemented by subclass.");
  }

  /**
   * Retrieves current queue metrics (queued count, active count, completed count).
   * @returns {Promise<{ queued: number, active: number, total: number }>}
   */
  async getMetrics() {
    throw new Error("IExecutionQueue.getMetrics() must be implemented by subclass.");
  }

  /**
   * Fetches an ExecutionJob by jobId from memory/store.
   * @param {string} jobId
   * @returns {Promise<ExecutionJob|null>}
   */
  async getJob(jobId) {
    throw new Error("IExecutionQueue.getJob() must be implemented by subclass.");
  }
}
