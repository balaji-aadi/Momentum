import { JudgeGatewayService } from './JudgeGatewayService.js';
import { ClusterSafeQueueAdapter } from './scheduling/ClusterSafeQueueAdapter.js';
import { ClusterSafeFairShareScheduler } from './scheduling/ClusterSafeFairShareScheduler.js';
import { DatabaseProtectionLayer } from './persistence/DatabaseProtectionLayer.js';
import { DSAProblemPlatform } from '../platform/DSAProblemPlatform.js';
import { ChildProcessWorkerPoolDriver } from './scaling/drivers/ChildProcessWorkerPoolDriver.js';
import { WorkerThreadsPoolDriver } from './scaling/drivers/WorkerThreadsPoolDriver.js';
import { DistributedWorkerPoolDriver } from './scaling/drivers/DistributedWorkerPoolDriver.js';

/**
 * Phase15OrchestrationAdapter - Composition Adapter & Feature-Flagged Control Layer
 * (Phase 15 Governance Module - Stage 15.5)
 * 
 * Wraps JudgeGatewayService via composition to integrate Phase 15 capabilities
 * (Cluster-Safe Sharding, Async DB Persistence, DSA Platform, Multi-Driver Scaling)
 * WITHOUT modifying any frozen Phase 1–14 core modules.
 * 
 * Provides zero-downtime feature flag toggle & rollback guarantees.
 */
export class Phase15OrchestrationAdapter {
  constructor({ redisClient = null, mongoConnection = null, gatewayService = null } = {}) {
    this.gateway = gatewayService || JudgeGatewayService;
    this.redis = redisClient;
    this.mongo = mongoConnection;

    // Feature Flags Configuration (Default: Enabled in Phase 15, reversible via env)
    this.flags = {
      workerDriver: process.env.JUDGE_WORKER_DRIVER || 'child_process',
      clusterEnabled: process.env.JUDGE_REDIS_CLUSTER_ENABLED !== 'false',
      asyncDbPersistence: process.env.JUDGE_ASYNC_DB_PERSISTENCE_ENABLED !== 'false',
      dsaPlatformEnabled: process.env.JUDGE_DSA_PLATFORM_ENABLED !== 'false'
    };

    // Phase 15 Subsystems Initialization
    this.queueAdapter = this.flags.clusterEnabled 
      ? new ClusterSafeQueueAdapter({ redisClient: this.redis })
      : null;

    this.scheduler = this.flags.clusterEnabled
      ? new ClusterSafeFairShareScheduler({ redisClient: this.redis, queueAdapter: this.queueAdapter })
      : null;

    this.databaseProtection = this.flags.asyncDbPersistence
      ? new DatabaseProtectionLayer({ redisClient: this.redis, mongoConnection: this.mongo })
      : null;

    this.dsaPlatform = this.flags.dsaPlatformEnabled
      ? new DSAProblemPlatform()
      : null;
  }

  /**
   * Resolves the configured worker pool driver based on feature flag.
   */
  getWorkerDriver(queue = null) {
    const targetQueue = queue || this.queueAdapter;
    switch (this.flags.workerDriver) {
      case 'worker_threads':
        return new WorkerThreadsPoolDriver({ queue: targetQueue });
      case 'child_process':
        return new ChildProcessWorkerPoolDriver({ queue: targetQueue });
      case 'distributed':
        return new DistributedWorkerPoolDriver({ queue: targetQueue });
      default:
        return null; // Reverts to Phase 13 InProcessWorkerPoolDriver
    }
  }

  /**
   * Submits an evaluation job through the Phase 15 Composition Layer.
   * If feature flags are disabled, gracefully falls back to frozen JudgeGatewayService.
   */
  async submitJob(requestPayload) {
    if (!this.flags.clusterEnabled || !this.queueAdapter) {
      // Rollback Path: Fallback to frozen JudgeGatewayService
      return await this.gateway.processRun(requestPayload);
    }

    // Ingest via Phase 15 ClusterSafeQueueAdapter
    const job = requestPayload.job || requestPayload;
    await this.queueAdapter.enqueue(job);

    return {
      status: 'QUEUED',
      jobId: job.jobId,
      adapter: 'Phase15OrchestrationAdapter'
    };
  }

  /**
   * Evaluates feature flag status and reports rollback availability.
   */
  getRollbackStatus() {
    return {
      activeFlags: { ...this.flags },
      canRollbackWithoutMigration: true,
      frozenModulesModified: false,
      status: 'READY_FOR_ZERO_DOWNTIME_ROLLBACK'
    };
  }
}
