/**
 * JobStateMachine - State Transition Validator & Lifecycle Tracker
 * (Phase 11 Job State Machine)
 * 
 * Enforces monotonic state transitions and defines valid lifecycle progression.
 */
export class JobStateMachine {
  static STATES = Object.freeze({
    CREATED: 'CREATED',
    QUEUED: 'QUEUED',
    CLAIMED: 'CLAIMED',
    RUNNING: 'RUNNING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
    RETRYING: 'RETRYING',
    CANCELLED: 'CANCELLED',
    EXPIRED: 'EXPIRED',
    INFRA_ERROR: 'INFRA_ERROR'
  });

  static TERMINAL_STATES = Object.freeze([
    'COMPLETED',
    'FAILED',
    'CANCELLED',
    'EXPIRED',
    'INFRA_ERROR'
  ]);

  static ALLOWED_TRANSITIONS = Object.freeze({
    CREATED: ['QUEUED', 'CANCELLED', 'EXPIRED'],
    QUEUED: ['CLAIMED', 'CANCELLED', 'EXPIRED'],
    CLAIMED: ['RUNNING', 'RETRYING', 'FAILED', 'INFRA_ERROR', 'CANCELLED'],
    RUNNING: ['COMPLETED', 'FAILED', 'RETRYING', 'INFRA_ERROR', 'CANCELLED'],
    RETRYING: ['QUEUED', 'FAILED', 'INFRA_ERROR', 'CANCELLED'],
    COMPLETED: [],
    FAILED: [],
    CANCELLED: [],
    EXPIRED: [],
    INFRA_ERROR: []
  });

  /**
   * Validates whether a state transition from currentState to nextState is permitted.
   * 
   * @param {string} currentState
   * @param {string} nextState
   * @returns {boolean}
   */
  static isValidTransition(currentState, nextState) {
    if (!currentState || !nextState) return false;
    if (currentState === nextState) return true;
    const allowed = JobStateMachine.ALLOWED_TRANSITIONS[currentState] || [];
    return allowed.includes(nextState);
  }

  /**
   * Checks if a given state is terminal.
   * 
   * @param {string} state
   * @returns {boolean}
   */
  static isTerminal(state) {
    return JobStateMachine.TERMINAL_STATES.includes(state);
  }

  /**
   * Transitions a job instance to nextState if allowed.
   * 
   * @param {Object} job ExecutionJob instance
   * @param {string} nextState Desired state
   * @param {Object} [metadata] Optional status/error details
   * @returns {Object} Updated ExecutionJob instance
   */
  static transition(job, nextState, metadata = {}) {
    if (!JobStateMachine.isValidTransition(job.state, nextState)) {
      throw new Error(`JobStateMachine Invalid Transition: Cannot transition job ${job.jobId} from '${job.state}' to '${nextState}'.`);
    }

    job.state = nextState;

    if (nextState === JobStateMachine.STATES.CLAIMED || nextState === JobStateMachine.STATES.RUNNING) {
      if (!job.startedAt) job.startedAt = new Date().toISOString();
    }

    if (JobStateMachine.isTerminal(nextState)) {
      job.completedAt = new Date().toISOString();
    }

    if (metadata.error) {
      job.error = metadata.error;
    }
    if (metadata.result) {
      job.result = metadata.result;
    }

    return job;
  }
}
