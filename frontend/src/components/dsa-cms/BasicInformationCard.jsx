import React, { useEffect, useState } from 'react';
import { 
  LuFileText, 
  LuCheckCircle2, 
  LuAlertCircle, 
  LuRefreshCw, 
  LuBuilding2, 
  LuBookOpen, 
  LuLayers,
  LuSparkles,
  LuPlus,
  LuX
} from 'react-icons/lu';
import { ProblemApi } from '../../services/api/Problem.api';
import toast from 'react-hot-toast';

export default function BasicInformationCard({ formData, setFormData }) {
  // Metadata state fetched from DB
  const [companies, setCompanies] = useState([]);
  const [topics, setTopics] = useState([]);
  const [patterns, setPatterns] = useState([]);
  
  // Slug checking state
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [slugStatus, setSlugStatus] = useState(null);

  // Inline Quick Add Tag States
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  
  const [showAddPattern, setShowAddPattern] = useState(false);
  const [newPatternName, setNewPatternName] = useState('');

  // Load tag options from MongoDB
  const fetchMetadata = async () => {
    try {
      const [compRes, topRes, patRes] = await Promise.all([
        ProblemApi.getCompanies(),
        ProblemApi.getTopics(),
        ProblemApi.getPatterns()
      ]);

      if (compRes.data?.success) setCompanies(compRes.data.data || []);
      if (topRes.data?.success) setTopics(topRes.data.data || []);
      if (patRes.data?.success) setPatterns(patRes.data.data || []);
    } catch (error) {
      console.error("Failed to load tag metadata", error);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  // Slug generator helper
  const slugify = (text) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Handle Title Change (auto-update slug if not locked)
  const handleTitleChange = (e) => {
    const titleVal = e.target.value;
    const generatedSlug = slugify(titleVal);

    setFormData(prev => ({
      ...prev,
      title: titleVal,
      slug: prev.isSlugTouched ? prev.slug : generatedSlug
    }));
    setSlugStatus(null);
  };

  // Handle Slug Change
  const handleSlugChange = (e) => {
    const rawVal = e.target.value;
    const cleanSlug = slugify(rawVal);

    setFormData(prev => ({
      ...prev,
      slug: cleanSlug,
      isSlugTouched: true
    }));
    setSlugStatus(null);
  };

  // Check Slug Availability API Call
  const handleCheckSlug = async () => {
    if (!formData.slug) {
      toast.error("Please enter a slug first");
      return;
    }
    setCheckingSlug(true);
    try {
      const res = await ProblemApi.checkSlugAvailability(formData.slug);
      if (res.data?.success) {
        setSlugStatus({
          available: res.data.available,
          suggestedSlug: res.data.suggestedSlug
        });
        if (res.data.available) {
          toast.success("Slug is available!");
        } else {
          toast.error(`Slug taken. Suggested: ${res.data.suggestedSlug}`);
        }
      }
    } catch (err) {
      toast.error("Failed to verify slug availability");
    } finally {
      setCheckingSlug(false);
    }
  };

  // Toggle multi-select tags
  const toggleCompany = (id) => {
    setFormData(prev => {
      const existing = prev.companies || [];
      const updated = existing.includes(id) 
        ? existing.filter(item => item !== id)
        : [...existing, id];
      return { ...prev, companies: updated };
    });
  };

  const toggleTopic = (id) => {
    setFormData(prev => {
      const existing = prev.topics || [];
      const updated = existing.includes(id) 
        ? existing.filter(item => item !== id)
        : [...existing, id];
      return { ...prev, topics: updated };
    });
  };

  // Quick Add Handlers
  const handleCreateCompany = async () => {
    if (!newCompanyName.trim()) return;
    try {
      const res = await ProblemApi.createCompany({ name: newCompanyName.trim() });
      if (res.data?.success) {
        toast.success(`Company "${newCompanyName}" created!`);
        const createdComp = res.data.data;
        setCompanies(prev => [...prev, createdComp]);
        toggleCompany(createdComp._id);
        setNewCompanyName('');
        setShowAddCompany(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create company");
    }
  };

  const handleCreateTopic = async () => {
    if (!newTopicName.trim()) return;
    try {
      const res = await ProblemApi.createTopic({ name: newTopicName.trim(), category: "Algorithms" });
      if (res.data?.success) {
        toast.success(`Topic "${newTopicName}" created!`);
        const createdTop = res.data.data;
        setTopics(prev => [...prev, createdTop]);
        toggleTopic(createdTop._id);
        setNewTopicName('');
        setShowAddTopic(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create topic");
    }
  };

  const handleCreatePattern = async () => {
    if (!newPatternName.trim()) return;
    try {
      const res = await ProblemApi.createPattern({ name: newPatternName.trim() });
      if (res.data?.success) {
        toast.success(`Pattern "${newPatternName}" created!`);
        const createdPat = res.data.data;
        setPatterns(prev => [...prev, createdPat]);
        setFormData(prev => ({ ...prev, pattern: createdPat._id }));
        setNewPatternName('');
        setShowAddPattern(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create pattern");
    }
  };

  return (
    <div className="bg-surface dark:bg-slate-900 rounded-2xl border border-borderLight dark:border-slate-800 p-6 shadow-xs space-y-6 font-sans">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-borderLight dark:border-slate-800 pb-4">
        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <LuFileText size={18} />
        </div>
        <div>
          <h2 className="text-base font-bold text-textMain dark:text-white">Basic Information</h2>
          <p className="text-xs text-textSub">Title, slug, classification, status, and tag references.</p>
        </div>
      </div>

      {/* Grid Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Title Input */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-xs font-bold text-textMain dark:text-slate-200 flex items-center gap-1">
            <span>Problem Title</span>
            <span className="text-primary">*</span>
          </label>
          <input
            type="text"
            value={formData.title || ''}
            onChange={handleTitleChange}
            placeholder="e.g. Fruit Into Baskets"
            className="w-full px-3.5 py-2.5 bg-bgLight dark:bg-slate-800/60 border border-borderLight dark:border-slate-700 rounded-xl text-xs font-semibold text-textMain dark:text-white placeholder:text-textSub/50 focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>

        {/* Slug Input with Availability Checker */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-xs font-bold text-textMain dark:text-slate-200 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <span>URL Slug</span>
              <span className="text-primary">*</span>
            </span>
            <span className="text-[11px] font-normal text-textSub">Auto-generated from title</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={formData.slug || ''}
              onChange={handleSlugChange}
              placeholder="e.g. fruit-into-baskets"
              className="flex-1 px-3.5 py-2.5 bg-bgLight dark:bg-slate-800/60 border border-borderLight dark:border-slate-700 rounded-xl text-xs font-mono font-semibold text-textMain dark:text-white placeholder:text-textSub/50 focus:outline-none focus:border-primary/50 transition-colors"
            />
            <button
              type="button"
              onClick={handleCheckSlug}
              disabled={checkingSlug || !formData.slug}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-textMain dark:text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              {checkingSlug ? <LuRefreshCw className="animate-spin" size={14} /> : <LuSparkles size={14} />}
              <span>Check Slug</span>
            </button>
          </div>

          {/* Slug Status Feedback */}
          {slugStatus && (
            <div className={`text-[11px] font-bold flex items-center gap-1.5 mt-1 ${slugStatus.available ? 'text-emerald-600' : 'text-rose-600'}`}>
              {slugStatus.available ? <LuCheckCircle2 size={13} /> : <LuAlertCircle size={13} />}
              <span>
                {slugStatus.available ? "Slug is unique and available!" : `Slug is taken. Click to apply: `}
              </span>
              {!slugStatus.available && (
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, slug: slugStatus.suggestedSlug }))}
                  className="underline hover:text-rose-800 cursor-pointer"
                >
                  {slugStatus.suggestedSlug}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Problem Type Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-textMain dark:text-slate-200">
            Problem Type
          </label>
          <select
            value={formData.problemType || 'DSA'}
            onChange={(e) => setFormData(prev => ({ ...prev, problemType: e.target.value }))}
            className="w-full px-3.5 py-2.5 bg-bgLight dark:bg-slate-800/60 border border-borderLight dark:border-slate-700 rounded-xl text-xs font-semibold text-textMain dark:text-white focus:outline-none focus:border-primary/50 cursor-pointer"
          >
            <option value="DSA">Data Structures & Algorithms (DSA)</option>
            <option value="SQL">Database Systems (SQL)</option>
            <option value="Frontend_JS">Web Engineering (JavaScript)</option>
            <option value="System_Design">System Design Architecture</option>
            <option value="Aptitude">Aptitude & Logical Reasoning</option>
            <option value="Mock_Interview">Mock Technical Interview</option>
          </select>
        </div>

        {/* Pattern Dropdown with Quick Add */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-textMain dark:text-slate-200">
              Algorithmic Pattern
            </label>
            <button
              type="button"
              onClick={() => setShowAddPattern(prev => !prev)}
              className="text-[11px] font-bold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <LuPlus size={12} />
              <span>New Pattern</span>
            </button>
          </div>

          {showAddPattern && (
            <div className="flex gap-2 mb-2 p-2 bg-primary/5 rounded-xl border border-primary/20">
              <input
                type="text"
                value={newPatternName}
                onChange={(e) => setNewPatternName(e.target.value)}
                placeholder="e.g. Sliding Window"
                className="flex-1 px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-borderLight rounded-lg text-xs font-semibold focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCreatePattern}
                className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                Save
              </button>
            </div>
          )}

          <select
            value={formData.pattern || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, pattern: e.target.value }))}
            className="w-full px-3.5 py-2.5 bg-bgLight dark:bg-slate-800/60 border border-borderLight dark:border-slate-700 rounded-xl text-xs font-semibold text-textMain dark:text-white focus:outline-none focus:border-primary/50 cursor-pointer"
          >
            <option value="">-- Select Pattern (Optional) --</option>
            {patterns.map(pat => (
              <option key={pat._id} value={pat._id}>{pat.name}</option>
            ))}
          </select>
        </div>

        {/* Difficulty Pill Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-textMain dark:text-slate-200 flex items-center gap-1">
            <span>Difficulty Level</span>
            <span className="text-primary">*</span>
          </label>
          <div className="flex gap-2">
            {['Easy', 'Medium', 'Hard'].map((diff) => (
              <button
                type="button"
                key={diff}
                onClick={() => setFormData(prev => ({ ...prev, difficulty: diff }))}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  formData.difficulty === diff
                    ? diff === 'Easy' ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs'
                      : diff === 'Medium' ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                      : 'bg-rose-500 text-white border-rose-500 shadow-xs'
                    : 'bg-bgLight dark:bg-slate-800 text-textSub border-borderLight dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        {/* Status Pill Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-textMain dark:text-slate-200">
            Publication Status
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {['Draft', 'Review', 'Published', 'Archived'].map((st) => (
              <button
                type="button"
                key={st}
                onClick={() => setFormData(prev => ({ ...prev, status: st }))}
                className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer text-center truncate ${
                  formData.status === st
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-bgLight dark:bg-slate-800 text-textSub border-borderLight dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Topics Multi-select Pills with Quick Inline Add */}
        <div className="space-y-2 md:col-span-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-textMain dark:text-slate-200 flex items-center gap-1.5">
              <LuBookOpen className="text-primary" />
              <span>Topics Tagging (Select Multiple)</span>
            </label>

            <button
              type="button"
              onClick={() => setShowAddTopic(prev => !prev)}
              className="text-[11px] font-bold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <LuPlus size={12} />
              <span>Add Topic Tag</span>
            </button>
          </div>

          {showAddTopic && (
            <div className="flex gap-2 p-2 bg-primary/5 rounded-xl border border-primary/20">
              <input
                type="text"
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                placeholder="e.g. Dynamic Programming"
                className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-borderLight rounded-lg text-xs font-semibold focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCreateTopic}
                className="px-3.5 py-1.5 bg-primary text-white text-xs font-bold rounded-lg cursor-pointer shrink-0"
              >
                Save Topic
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 p-3 bg-bgLight dark:bg-slate-800/40 rounded-xl border border-borderLight dark:border-slate-700 min-h-[50px]">
            {topics.length === 0 ? (
              <span className="text-xs text-textSub/60 italic">No topics available in database. Click "+ Add Topic Tag" above to create one.</span>
            ) : (
              topics.map(t => {
                const isSelected = (formData.topics || []).includes(t._id);
                return (
                  <button
                    type="button"
                    key={t._id}
                    onClick={() => toggleTopic(t._id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-white border-primary shadow-xs'
                        : 'bg-surface dark:bg-slate-800 text-textSub border-borderLight hover:border-primary/40'
                    }`}
                  >
                    {t.name}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Companies Multi-select Pills with Quick Inline Add */}
        <div className="space-y-2 md:col-span-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-textMain dark:text-slate-200 flex items-center gap-1.5">
              <LuBuilding2 className="text-primary" />
              <span>Target Companies Tagging (Select Multiple)</span>
            </label>

            <button
              type="button"
              onClick={() => setShowAddCompany(prev => !prev)}
              className="text-[11px] font-bold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <LuPlus size={12} />
              <span>Add Company Tag</span>
            </button>
          </div>

          {showAddCompany && (
            <div className="flex gap-2 p-2 bg-primary/5 rounded-xl border border-primary/20">
              <input
                type="text"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                placeholder="e.g. Google, Meta, Amazon"
                className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-borderLight rounded-lg text-xs font-semibold focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCreateCompany}
                className="px-3.5 py-1.5 bg-primary text-white text-xs font-bold rounded-lg cursor-pointer shrink-0"
              >
                Save Company
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 p-3 bg-bgLight dark:bg-slate-800/40 rounded-xl border border-borderLight dark:border-slate-700 min-h-[50px]">
            {companies.length === 0 ? (
              <span className="text-xs text-textSub/60 italic">No companies available in database. Click "+ Add Company Tag" above to create one.</span>
            ) : (
              companies.map(c => {
                const isSelected = (formData.companies || []).includes(c._id);
                return (
                  <button
                    type="button"
                    key={c._id}
                    onClick={() => toggleCompany(c._id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-white border-primary shadow-xs'
                        : 'bg-surface dark:bg-slate-800 text-textSub border-borderLight hover:border-primary/40'
                    }`}
                  >
                    {c.name}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
