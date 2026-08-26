/**
 * JudgeMetricsCollector - Secured Prometheus Observability Telemetry Collector
 * (Phase 12 Observability Module)
 * 
 * Collects low-cardinality Prometheus metric gauges, counters, and histograms for the judge engine.
 * STRICTLY EXCLUDES worker_id, jobId, userId, and traceId from metric labels to prepare for Phase 13 scaling.
 */
export class JudgeMetricsCollector {
  constructor() {
    this.counters = new Map();   // metric_name + labels -> count
    this.gauges = new Map();     // metric_name + labels -> value
    this.histograms = new Map(); // metric_name + labels -> array of values
  }

  static instance = new JudgeMetricsCollector();

  static getInstance() {
    return JudgeMetricsCollector.instance;
  }

  // --- COUNTER OPERATIONS ---
  incCounter(name, labels = {}, value = 1) {
    const key = this._formatKey(name, labels);
    const curr = this.counters.get(key) || 0;
    this.counters.set(key, curr + value);
  }

  // --- GAUGE OPERATIONS ---
  setGauge(name, labels = {}, value = 0) {
    const key = this._formatKey(name, labels);
    this.gauges.set(key, value);
  }

  // --- HISTOGRAM OPERATIONS ---
  observeHistogram(name, labels = {}, value = 0) {
    const key = this._formatKey(name, labels);
    if (!this.histograms.has(key)) {
      this.histograms.set(key, []);
    }
    const vals = this.histograms.get(key);
    vals.push(value);
    if (vals.length > 1000) vals.shift(); // Keep bounded memory window
  }

  /**
   * Generates low-cardinality Prometheus text format string.
   */
  toPrometheusString() {
    let output = '# HELP sarthi_judge_metrics Sarthi Judge Engine Observability Metrics\n';
    output += '# TYPE sarthi_judge_metrics gauge\n';

    // Format Counters
    for (const [key, val] of this.counters.entries()) {
      output += `${key} ${val}\n`;
    }

    // Format Gauges
    for (const [key, val] of this.gauges.entries()) {
      output += `${key} ${val}\n`;
    }

    // Format Histograms Summary
    for (const [key, vals] of this.histograms.entries()) {
      if (vals.length === 0) continue;
      const sum = vals.reduce((a, b) => a + b, 0);
      const avg = sum / vals.length;
      output += `${key}_sum ${sum.toFixed(4)}\n`;
      output += `${key}_count ${vals.length}\n`;
      output += `${key}_avg ${avg.toFixed(4)}\n`;
    }

    return output;
  }

  _formatKey(name, labels) {
    const cleanLabels = { ...labels };
    // Enforce strict prohibition of high-cardinality labels
    delete cleanLabels.jobId;
    delete cleanLabels.userId;
    delete cleanLabels.submissionId;
    delete cleanLabels.problemId;
    delete cleanLabels.traceId;
    delete cleanLabels.code;
    delete cleanLabels.worker_id;
    delete cleanLabels.workerId;

    const labelPairs = Object.entries(cleanLabels)
      .map(([k, v]) => `${k}="${String(v).replace(/"/g, '\\"')}"`)
      .join(',');

    return labelPairs ? `${name}{${labelPairs}}` : name;
  }
}
