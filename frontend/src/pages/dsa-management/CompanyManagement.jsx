import React, { useEffect, useState } from 'react';
import { LuBuilding2, LuPlus, LuTrash2, LuRefreshCw, LuSparkles } from 'react-icons/lu';
import { ProblemApi } from '../../services/api/Problem.api';
import toast from 'react-hot-toast';

export default function CompanyManagement() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [creating, setCreating] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await ProblemApi.getCompanies();
      if (res.data?.success) setCompanies(res.data.data || []);
    } catch (err) {
      toast.error("Failed to load companies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Company name is required");
    setCreating(true);
    try {
      const res = await ProblemApi.createCompany({ name: name.trim(), logoUrl: logoUrl.trim() });
      if (res.data?.success) {
        toast.success(`Company "${name}" created!`);
        setName('');
        setLogoUrl('');
        fetchCompanies();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create company");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id, companyName) => {
    if (!window.confirm(`Are you sure you want to delete company "${companyName}"?`)) return;
    try {
      const res = await ProblemApi.deleteCompany(id);
      if (res.data?.success) {
        toast.success(`Company "${companyName}" deleted!`);
        fetchCompanies();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete company");
    }
  };

  const handleSeedDefaults = async () => {
    setSeeding(true);
    try {
      const res = await ProblemApi.seedDefaults();
      if (res.data?.success) {
        toast.success(res.data.message);
        fetchCompanies();
      }
    } catch (err) {
      toast.error("Failed to seed default companies");
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
            <LuBuilding2 className="text-primary" />
            <span>Company Tag Management</span>
          </h1>
          <p className="text-xs text-textSub mt-1 font-normal">
            Create, manage, and delete company tags (Google, Meta, Amazon, Microsoft).
          </p>
        </div>

        <button
          type="button"
          disabled={seeding}
          onClick={handleSeedDefaults}
          className="px-4 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-2xs shrink-0"
        >
          {seeding ? <LuRefreshCw className="animate-spin" size={14} /> : <LuSparkles size={15} />}
          <span>Seed All Tech Companies</span>
        </button>
      </div>

      {/* Add Company Form */}
      <form onSubmit={handleCreate} className="bg-surface dark:bg-slate-900 p-5 rounded-2xl border border-borderLight dark:border-slate-800 flex flex-col md:flex-row gap-3 items-end shadow-xs">
        <div className="flex-1 space-y-1 w-full">
          <label className="text-xs font-bold text-textMain dark:text-slate-200">Company Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Google"
            className="w-full px-3.5 py-2.5 bg-bgLight dark:bg-slate-800 border border-borderLight dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary/50"
          />
        </div>

        <div className="flex-1 space-y-1 w-full">
          <label className="text-xs font-bold text-textMain dark:text-slate-200">Logo URL (Optional)</label>
          <input
            type="text"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://logo.clearbit.com/google.com"
            className="w-full px-3.5 py-2.5 bg-bgLight dark:bg-slate-800 border border-borderLight dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary/50"
          />
        </div>

        <button
          type="submit"
          disabled={creating || !name.trim()}
          className="px-5 py-2.5 bg-primary hover:bg-primaryHover text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer shrink-0"
        >
          {creating ? <LuRefreshCw className="animate-spin" size={14} /> : <LuPlus size={15} />}
          <span>Add Company</span>
        </button>
      </form>

      {/* Companies List */}
      <div className="bg-surface dark:bg-slate-900 rounded-2xl border border-borderLight dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-borderLight dark:border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-textMain dark:text-white">Existing Companies ({companies.length})</h3>
          <span className="text-xs text-textSub">Click trash icon to delete mistake entries</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-textSub font-semibold animate-pulse">Loading companies from database...</div>
        ) : companies.length === 0 ? (
          <div className="p-8 text-center text-xs text-textSub italic">No companies added yet. Click "Seed All Tech Companies" above.</div>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {companies.map((comp) => (
              <div key={comp._id} className="px-3.5 py-2 bg-bgLight dark:bg-slate-800 border border-borderLight dark:border-slate-700 rounded-xl flex items-center gap-2 text-xs font-bold text-textMain dark:text-white shadow-2xs group hover:border-slate-300 dark:hover:border-slate-600 transition-all">
                {comp.logoUrl && <img src={comp.logoUrl} alt={comp.name} className="w-4 h-4 object-contain" />}
                <span>{comp.name}</span>
                <span className="text-[10px] font-mono text-textSub/60 font-normal">({comp.slug})</span>
                <button
                  type="button"
                  onClick={() => handleDelete(comp._id, comp.name)}
                  className="text-slate-400 hover:text-rose-600 transition-colors p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer ml-1"
                  title={`Delete ${comp.name}`}
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
