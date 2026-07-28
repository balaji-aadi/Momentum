import React, { useEffect, useState } from 'react';
import { LuLayers, LuPlus, LuTrash2, LuRefreshCw, LuSparkles } from 'react-icons/lu';
import { ProblemApi } from '../../services/api/Problem.api';
import toast from 'react-hot-toast';

export default function PatternManagement() {
  const [patterns, setPatterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const fetchPatterns = async () => {
    setLoading(true);
    try {
      const res = await ProblemApi.getPatterns();
      if (res.data?.success) setPatterns(res.data.data || []);
    } catch (err) {
      toast.error("Failed to load patterns");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatterns();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Pattern name is required");
    setCreating(true);
    try {
      const res = await ProblemApi.createPattern({ name: name.trim(), description: description.trim() });
      if (res.data?.success) {
        toast.success(`Pattern "${name}" created!`);
        setName('');
        setDescription('');
        fetchPatterns();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create pattern");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id, patternName) => {
    if (!window.confirm(`Are you sure you want to delete pattern "${patternName}"?`)) return;
    try {
      const res = await ProblemApi.deletePattern(id);
      if (res.data?.success) {
        toast.success(`Pattern "${patternName}" deleted!`);
        fetchPatterns();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete pattern");
    }
  };

  const handleSeedDefaults = async () => {
    setSeeding(true);
    try {
      const res = await ProblemApi.seedDefaults();
      if (res.data?.success) {
        toast.success(res.data.message);
        fetchPatterns();
      }
    } catch (err) {
      toast.error("Failed to seed default patterns");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-borderLight dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-textMain dark:text-white flex items-center gap-2">
            <LuLayers className="text-primary" />
            <span>Algorithmic Patterns Management</span>
          </h1>
          <p className="text-xs text-textSub mt-1 font-normal">
            Create, manage, and delete problem pattern taxonomies (Sliding Window, Monotonic Stack, Fast & Slow Pointers).
          </p>
        </div>

        <button
          type="button"
          disabled={seeding}
          onClick={handleSeedDefaults}
          className="px-4 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-2xs shrink-0"
        >
          {seeding ? <LuRefreshCw className="animate-spin" size={14} /> : <LuSparkles size={15} />}
          <span>Seed All Standard Patterns</span>
        </button>
      </div>

      {/* Add Pattern Form */}
      <form onSubmit={handleCreate} className="bg-surface dark:bg-slate-900 p-5 rounded-2xl border border-borderLight dark:border-slate-800 flex flex-col md:flex-row gap-3 items-end shadow-xs">
        <div className="w-full md:w-64 space-y-1">
          <label className="text-xs font-bold text-textMain dark:text-slate-200">Pattern Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sliding Window"
            className="w-full px-3.5 py-2.5 bg-bgLight dark:bg-slate-800 border border-borderLight dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary/50"
          />
        </div>

        <div className="flex-1 space-y-1 w-full">
          <label className="text-xs font-bold text-textMain dark:text-slate-200">Description (Optional)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Maintain a running window range over arrays or strings."
            className="w-full px-3.5 py-2.5 bg-bgLight dark:bg-slate-800 border border-borderLight dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary/50"
          />
        </div>

        <button
          type="submit"
          disabled={creating || !name.trim()}
          className="px-5 py-2.5 bg-primary hover:bg-primaryHover text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer shrink-0"
        >
          {creating ? <LuRefreshCw className="animate-spin" size={14} /> : <LuPlus size={15} />}
          <span>Add Pattern</span>
        </button>
      </form>

      {/* Patterns List */}
      <div className="bg-surface dark:bg-slate-900 rounded-2xl border border-borderLight dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-borderLight dark:border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-textMain dark:text-white">Existing Patterns ({patterns.length})</h3>
          <span className="text-xs text-textSub">Click trash icon to delete mistake entries</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-textSub font-semibold animate-pulse">Loading patterns from database...</div>
        ) : patterns.length === 0 ? (
          <div className="p-8 text-center text-xs text-textSub italic">No patterns added yet. Click "Seed All Standard Patterns" above.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {patterns.map((pat) => (
              <div key={pat._id} className="p-4 bg-bgLight dark:bg-slate-800 border border-borderLight dark:border-slate-700 rounded-xl space-y-1 shadow-2xs group relative">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs text-textMain dark:text-white flex items-center gap-1.5">
                    <LuLayers size={14} className="text-primary shrink-0" />
                    <span>{pat.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(pat._id, pat.name)}
                    className="text-slate-400 hover:text-rose-600 transition-colors p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                    title={`Delete ${pat.name}`}
                  >
                    <LuTrash2 size={13} />
                  </button>
                </div>
                {pat.description && <p className="text-[11px] text-textSub leading-relaxed">{pat.description}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
