import React, { useEffect, useState } from 'react';
import { LuBookOpen, LuPlus, LuRefreshCw, LuTrash2, LuSparkles } from 'react-icons/lu';
import { ProblemApi } from '../../services/api/Problem.api';
import toast from 'react-hot-toast';

export default function TopicManagement() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Data Structures');
  const [creating, setCreating] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const fetchTopics = async () => {
    setLoading(true);
    try {
      const res = await ProblemApi.getTopics();
      if (res.data?.success) setTopics(res.data.data || []);
    } catch (err) {
      toast.error("Failed to load topics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Topic name is required");
    setCreating(true);
    try {
      const res = await ProblemApi.createTopic({ name: name.trim(), category });
      if (res.data?.success) {
        toast.success(`Topic "${name}" created!`);
        setName('');
        fetchTopics();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create topic");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id, topicName) => {
    if (!window.confirm(`Are you sure you want to delete topic "${topicName}"?`)) return;
    try {
      const res = await ProblemApi.deleteTopic(id);
      if (res.data?.success) {
        toast.success(`Topic "${topicName}" deleted!`);
        fetchTopics();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete topic");
    }
  };

  const handleSeedDefaults = async () => {
    setSeeding(true);
    try {
      const res = await ProblemApi.seedDefaults();
      if (res.data?.success) {
        toast.success(res.data.message);
        fetchTopics();
      }
    } catch (err) {
      toast.error("Failed to seed default DSA topics");
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
            <LuBookOpen className="text-primary" />
            <span>Topic Tag Management</span>
          </h1>
          <p className="text-xs text-textSub mt-1 font-normal">
            Create, manage, and delete topic tags (Arrays, Dynamic Programming, Graphs, Two Pointers).
          </p>
        </div>

        <button
          type="button"
          disabled={seeding}
          onClick={handleSeedDefaults}
          className="px-4 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-2xs shrink-0"
        >
          {seeding ? <LuRefreshCw className="animate-spin" size={14} /> : <LuSparkles size={15} />}
          <span>Seed All Standard DSA Topics</span>
        </button>
      </div>

      {/* Add Topic Form */}
      <form onSubmit={handleCreate} className="bg-surface dark:bg-slate-900 p-5 rounded-2xl border border-borderLight dark:border-slate-800 flex flex-col md:flex-row gap-3 items-end shadow-xs">
        <div className="flex-1 space-y-1 w-full">
          <label className="text-xs font-bold text-textMain dark:text-slate-200">Topic Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Dynamic Programming"
            className="w-full px-3.5 py-2.5 bg-bgLight dark:bg-slate-800 border border-borderLight dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary/50"
          />
        </div>

        <div className="w-full md:w-64 space-y-1">
          <label className="text-xs font-bold text-textMain dark:text-slate-200">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-bgLight dark:bg-slate-800 border border-borderLight dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary/50 cursor-pointer"
          >
            <option value="Data Structures">Data Structures</option>
            <option value="Algorithms">Algorithms</option>
            <option value="Advanced Topics">Advanced Topics</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={creating || !name.trim()}
          className="px-5 py-2.5 bg-primary hover:bg-primaryHover text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer shrink-0"
        >
          {creating ? <LuRefreshCw className="animate-spin" size={14} /> : <LuPlus size={15} />}
          <span>Add Topic</span>
        </button>
      </form>

      {/* Topics List */}
      <div className="bg-surface dark:bg-slate-900 rounded-2xl border border-borderLight dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-borderLight dark:border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-textMain dark:text-white">Existing Topics ({topics.length})</h3>
          <span className="text-xs text-textSub">Click trash icon to delete mistake entries</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-textSub font-semibold animate-pulse">Loading topics from database...</div>
        ) : topics.length === 0 ? (
          <div className="p-8 text-center text-xs text-textSub italic">No topics added yet. Click "Seed All Standard DSA Topics" above.</div>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {topics.map((top) => (
              <div key={top._id} className="px-3.5 py-2 bg-bgLight dark:bg-slate-800 border border-borderLight dark:border-slate-700 rounded-xl flex items-center gap-2 text-xs font-bold text-textMain dark:text-white shadow-2xs group hover:border-slate-300 dark:hover:border-slate-600 transition-all">
                <span>{top.name}</span>
                <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] rounded-md">{top.category}</span>
                <button
                  type="button"
                  onClick={() => handleDelete(top._id, top.name)}
                  className="text-slate-400 hover:text-rose-600 transition-colors p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer ml-1"
                  title={`Delete ${top.name}`}
                >
                  <LuTrash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
