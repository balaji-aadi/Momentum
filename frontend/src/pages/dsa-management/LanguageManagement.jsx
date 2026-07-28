import React, { useEffect, useState } from 'react';
import { LuTerminal, LuPlus, LuRefreshCw } from 'react-icons/lu';
import { ProblemApi } from '../../services/api/Problem.api';
import toast from 'react-hot-toast';

export default function LanguageManagement() {
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [monacoId, setMonacoId] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchLanguages = async () => {
    setLoading(true);
    try {
      const res = await ProblemApi.getLanguages();
      if (res.data?.success) {
        // Filter out 'go' as user explicitly stated they don't want Go
        setLanguages((res.data.data || []).filter(l => l.code !== 'go'));
      }
    } catch (err) {
      toast.error("Failed to load languages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLanguages();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return toast.error("Language name and code key are required");
    if (code.toLowerCase() === 'go') return toast.error("Go language is disabled");
    
    setCreating(true);
    try {
      const res = await ProblemApi.createLanguage({ 
        name: name.trim(), 
        code: code.trim().toLowerCase(), 
        monacoId: (monacoId.trim() || code.trim()).toLowerCase()
      });
      if (res.data?.success) {
        toast.success(`Language "${name}" configured!`);
        setName('');
        setCode('');
        setMonacoId('');
        fetchLanguages();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add language");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans">
      <div className="flex items-center justify-between border-b border-borderLight dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-textMain dark:text-white flex items-center gap-2">
            <LuTerminal className="text-primary" />
            <span>Execution Languages Management</span>
          </h1>
          <p className="text-xs text-textSub mt-1 font-normal">
            Configure code execution runtimes (Python, JavaScript, C++, Java) for the Monaco Editor and judge worker.
          </p>
        </div>
      </div>

      {/* Add Language Form */}
      <form onSubmit={handleCreate} className="bg-surface dark:bg-slate-900 p-5 rounded-2xl border border-borderLight dark:border-slate-800 flex flex-col md:flex-row gap-3 items-end shadow-xs">
        <div className="flex-1 space-y-1 w-full">
          <label className="text-xs font-bold text-textMain dark:text-slate-200">Display Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Python 3"
            className="w-full px-3.5 py-2.5 bg-bgLight dark:bg-slate-800 border border-borderLight dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary/50"
          />
        </div>

        <div className="w-full md:w-48 space-y-1">
          <label className="text-xs font-bold text-textMain dark:text-slate-200">Code Identifier *</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. python"
            className="w-full px-3.5 py-2.5 bg-bgLight dark:bg-slate-800 border border-borderLight dark:border-slate-700 rounded-xl font-mono text-xs font-semibold focus:outline-none focus:border-primary/50"
          />
        </div>

        <div className="w-full md:w-48 space-y-1">
          <label className="text-xs font-bold text-textMain dark:text-slate-200">Monaco Mode ID</label>
          <input
            type="text"
            value={monacoId}
            onChange={(e) => setMonacoId(e.target.value)}
            placeholder="e.g. python"
            className="w-full px-3.5 py-2.5 bg-bgLight dark:bg-slate-800 border border-borderLight dark:border-slate-700 rounded-xl font-mono text-xs font-semibold focus:outline-none focus:border-primary/50"
          />
        </div>

        <button
          type="submit"
          disabled={creating || !name.trim() || !code.trim()}
          className="px-5 py-2.5 bg-primary hover:bg-primaryHover text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer shrink-0"
        >
          {creating ? <LuRefreshCw className="animate-spin" size={14} /> : <LuPlus size={15} />}
          <span>Add Language</span>
        </button>
      </form>

      {/* Languages List */}
      <div className="bg-surface dark:bg-slate-900 rounded-2xl border border-borderLight dark:border-slate-800 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-textMain dark:text-white">Active Execution Languages ({languages.length})</h3>

        {loading ? (
          <div className="p-8 text-center text-xs text-textSub font-semibold animate-pulse">Loading languages from database...</div>
        ) : languages.length === 0 ? (
          <div className="p-8 text-center text-xs text-textSub italic">No custom languages configured. Defaulting to Python, JavaScript, C++, Java.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {languages.map((lang) => (
              <div key={lang._id} className="p-4 bg-[#1a1a1a] text-white border border-[#282828] rounded-xl space-y-1 shadow-sm">
                <div className="font-bold text-xs flex items-center gap-2">
                  <LuTerminal size={14} className="text-primary" />
                  <span>{lang.name}</span>
                </div>
                <div className="text-[10px] font-mono text-slate-400">Code: {lang.code} | Monaco: {lang.monacoId}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
