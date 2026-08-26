import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  LuPlus, 
  LuCode2, 
  LuSearch, 
  LuFilter, 
  LuEye, 
  LuPencil, 
  LuCopy, 
  LuTrash2, 
  LuChevronLeft, 
  LuChevronRight,
  LuRefreshCw,
  LuX
} from 'react-icons/lu';
import { ProblemApi } from '../../services/api/Problem.api';
import toast from 'react-hot-toast';
import moment from 'moment';

export default function ProblemList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // State Management
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState([]);
  
  // Filter States
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [difficulty, setDifficulty] = useState('');
  const [status, setStatus] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');

  useEffect(() => {
    const q = searchParams.get('search');
    if (q !== null) {
      setSearch(q);
    }
  }, [searchParams]);

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Fetch Problems
  const fetchProblems = async () => {
    setLoading(true);
    try {
      const res = await ProblemApi.getProblems({
        page,
        limit: 10,
        search: search.trim(),
        difficulty,
        status,
        topic: selectedTopic
      });

      if (res.data?.success) {
        setProblems(res.data.data || []);
        const pagination = res.data.pagination || {};
        const total = pagination.total || 0;
        const pages = pagination.totalPages || pagination.pages || Math.ceil(total / 10) || 1;
        setTotalPages(pages);
        setTotalItems(total);
      }
    } catch (error) {
      console.error("Failed to fetch problems", error);
      toast.error("Failed to load problems list");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Metadata Filters
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const topicRes = await ProblemApi.getTopics();
        if (topicRes.data?.success) {
          setTopics(topicRes.data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch topic metadata", err);
      }
    };
    fetchMeta();
  }, []);

  // Re-fetch on filter or page change
  useEffect(() => {
    fetchProblems();
  }, [page, difficulty, status, selectedTopic]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchProblems();
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Handle Archive
  const handleArchive = async (id, title) => {
    if (!window.confirm(`Are you sure you want to archive "${title}"?`)) return;
    try {
      const res = await ProblemApi.archiveProblem(id);
      if (res.data?.success) {
        toast.success("Problem archived successfully!");
        fetchProblems();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to archive problem");
    }
  };

  // Handle Duplicate
  const handleDuplicate = async (problem) => {
    try {
      const duplicatePayload = {
        ...problem,
        title: `${problem.title} (Copy)`,
        slug: `${problem.slug}-copy-${Date.now().toString().slice(-4)}`,
        status: 'Draft'
      };
      delete duplicatePayload._id;
      delete duplicatePayload.problemCode;
      delete duplicatePayload.createdAt;
      delete duplicatePayload.updatedAt;

      const res = await ProblemApi.createProblem(duplicatePayload);
      if (res.data?.success) {
        toast.success("Problem duplicated as draft!");
        fetchProblems();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to duplicate problem");
    }
  };

  // Difficulty Badge Colors
  const getDifficultyBadge = (diff) => {
    switch (diff) {
      case 'Easy':
        return 'bg-emerald-50 text-emerald-600 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400';
      case 'Medium':
        return 'bg-amber-50 text-amber-600 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-400';
      case 'Hard':
        return 'bg-rose-50 text-rose-600 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  // Status Badge Colors
  const getStatusBadge = (st) => {
    switch (st) {
      case 'Published':
        return 'bg-emerald-50 text-emerald-600 border-emerald-200/60';
      case 'Review':
        return 'bg-amber-50 text-amber-600 border-amber-200/60';
      case 'Archived':
        return 'bg-rose-50 text-rose-600 border-rose-200/60';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200/60';
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-borderLight dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-textMain dark:text-white flex items-center gap-2">
            <span className="text-primary font-mono font-extrabold text-sm">&lt;/&gt;</span>
            <span>DSA Problems Management</span>
          </h1>
          <p className="text-xs text-textSub dark:text-slate-400 mt-1 font-normal">
            Manage Data Structures & Algorithms problem bank, test cases, and editorial solutions.
          </p>
        </div>

        <button
          onClick={() => navigate('/dsa-management/create-problem')}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primaryHover text-white rounded-xl text-sm font-semibold shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <LuPlus size={16} />
          <span>Create Problem</span>
        </button>
      </div>

      {/* Control & Filter Bar */}
      <div className="bg-surface dark:bg-slate-900 p-4 rounded-2xl border border-borderLight dark:border-slate-800 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <LuSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-textSub text-sm" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search problems by title, code, or slug..."
            className="w-full pl-9 pr-8 py-2 bg-bgLight dark:bg-slate-800/60 border border-borderLight dark:border-slate-700 rounded-xl text-xs font-semibold text-textMain dark:text-slate-200 placeholder:text-textSub/60 focus:outline-none focus:border-primary/50 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-textSub hover:text-textMain"
            >
              <LuX size={14} />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Difficulty Filter */}
          <select
            value={difficulty}
            onChange={(e) => { setDifficulty(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-bgLight dark:bg-slate-800/60 border border-borderLight dark:border-slate-700 rounded-xl text-xs font-semibold text-textSub focus:text-textMain focus:outline-none cursor-pointer"
          >
            <option value="">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-bgLight dark:bg-slate-800/60 border border-borderLight dark:border-slate-700 rounded-xl text-xs font-semibold text-textSub focus:text-textMain focus:outline-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="Published">Published</option>
            <option value="Draft">Draft</option>
            <option value="Review">Review</option>
            <option value="Archived">Archived</option>
          </select>

          {/* Topic Filter */}
          {topics.length > 0 && (
            <select
              value={selectedTopic}
              onChange={(e) => { setSelectedTopic(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-bgLight dark:bg-slate-800/60 border border-borderLight dark:border-slate-700 rounded-xl text-xs font-semibold text-textSub focus:text-textMain focus:outline-none cursor-pointer max-w-[150px] truncate"
            >
              <option value="">All Topics</option>
              {topics.map((t) => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
          )}

          {/* Refresh Button */}
          <button
            onClick={() => fetchProblems()}
            title="Refresh Table"
            className="p-2 text-textSub hover:text-primary hover:bg-primary/5 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <LuRefreshCw size={15} className={loading ? "animate-spin text-primary" : ""} />
          </button>
        </div>
      </div>

      {/* Data Table Container */}
      <div className="bg-surface dark:bg-slate-900 rounded-2xl border border-borderLight dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bgLight dark:bg-slate-800/40 border-b border-borderLight dark:border-slate-800 text-[11px] font-bold text-textSub uppercase tracking-wider">
                <th className="py-3.5 px-4">Code</th>
                <th className="py-3.5 px-4">Title & Difficulty</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Topics / Companies</th>
                <th className="py-3.5 px-4">Updated</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {loading ? (
                // Skeleton Rows
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-16"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-48 mb-1"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-12"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-20"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-32"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-24"></div></td>
                    <td className="py-4 px-4 text-right"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-12 ml-auto"></div></td>
                  </tr>
                ))
              ) : problems.length === 0 ? (
                // Empty State
                <tr>
                  <td colSpan="7" className="py-16 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                      <LuCode2 size={22} />
                    </div>
                    <p className="text-sm font-bold text-textMain dark:text-white">No problems found</p>
                    <p className="text-xs text-textSub mt-1 max-w-sm mx-auto">
                      {search || difficulty || status || selectedTopic 
                        ? "Try clearing filters or search terms."
                        : "Click below to create your first problem in the database."}
                    </p>
                    {!search && !difficulty && !status && !selectedTopic && (
                      <button
                        onClick={() => navigate('/dsa-management/create-problem')}
                        className="mt-4 px-4 py-2 bg-primary hover:bg-primaryHover text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition-colors"
                      >
                        <LuPlus size={14} />
                        <span>Create Problem</span>
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                // Real Problem Rows
                problems.map((prob) => (
                  <tr key={prob._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    {/* Code */}
                    <td className="py-3.5 px-4 font-mono text-textSub font-bold text-[11px]">
                      {prob.problemCode || 'DSA-???'}
                    </td>

                    {/* Title & Difficulty */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span 
                          onClick={() => navigate(`/arena/${prob.slug}`)}
                          className="font-bold text-textMain dark:text-slate-100 hover:text-primary hover:underline cursor-pointer"
                        >
                          {prob.title}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getDifficultyBadge(prob.difficulty)}`}>
                          {prob.difficulty}
                        </span>
                      </div>
                    </td>

                    {/* Problem Type */}
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-textSub rounded-md font-bold text-[10px]">
                        {prob.problemType || 'DSA'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(prob.status)}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        {prob.status}
                      </span>
                    </td>

                    {/* Topics & Companies */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {prob.topics && prob.topics.length > 0 ? (
                          prob.topics.slice(0, 2).map((top, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-md">
                              {typeof top === 'object' ? top.name : top}
                            </span>
                          ))
                        ) : (
                          <span className="text-textSub/60 text-[10px] italic">No topics</span>
                        )}
                        {prob.topics && prob.topics.length > 2 && (
                          <span className="text-textSub text-[10px] font-semibold">+{prob.topics.length - 2}</span>
                        )}
                      </div>
                    </td>

                    {/* Last Updated */}
                    <td className="py-3.5 px-4 text-textSub text-[11px] font-medium">
                      {moment(prob.updatedAt).format('MMM D, YYYY')}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/arena/${prob.slug}`)}
                          title="View Student Arena"
                          className="p-1.5 text-textSub hover:text-primary hover:bg-primary/5 rounded-lg transition-colors cursor-pointer"
                        >
                          <LuEye size={15} />
                        </button>
                        <button
                          onClick={() => navigate(`/dsa-management/create-problem?id=${prob._id}`)}
                          title="Edit Problem"
                          className="p-1.5 text-textSub hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <LuPencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDuplicate(prob)}
                          title="Duplicate Problem"
                          className="p-1.5 text-textSub hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <LuCopy size={15} />
                        </button>
                        <button
                          onClick={() => handleArchive(prob._id, prob.title)}
                          title="Archive Problem"
                          className="p-1.5 text-textSub hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <LuTrash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {!loading && problems.length > 0 && (
          <div className="p-4 bg-bgLight dark:bg-slate-800/40 border-t border-borderLight dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-textSub font-medium">
              Showing Page {page} of {totalPages} ({totalItems} total problems)
            </span>

            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                className="p-1.5 rounded-lg border border-borderLight dark:border-slate-700 text-textSub disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface transition-colors cursor-pointer"
              >
                <LuChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${page === i + 1 ? 'bg-primary text-white shadow-xs' : 'text-textSub hover:bg-slate-200/60'}`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                disabled={page >= totalPages}
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                className="p-1.5 rounded-lg border border-borderLight dark:border-slate-700 text-textSub disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface transition-colors cursor-pointer"
              >
                <LuChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
