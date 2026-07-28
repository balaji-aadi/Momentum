import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DsaCodingArena from '../../components/dsa/DsaCodingArena';
import { ProblemApi } from '../../services/api/Problem.api';
import { 
  LuCode2, 
  LuAlertCircle, 
  LuRefreshCw, 
  LuArrowLeft, 
  LuClock 
} from 'react-icons/lu';

export function DsaProblemPage() {
  const { problemId } = useParams();
  const navigate = useNavigate();

  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [underPrep, setUnderPrep] = useState(false);

  const fetchProblem = async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    setUnderPrep(false);

    try {
      const res = await ProblemApi.getProblemByIdOrSlug(problemId || "asteroid-collision");
      if (res.data?.success && res.data.data) {
        const prob = res.data.data;
        
        // If problem is draft/review and user is not admin, mark under preparation
        if (prob.status === 'Draft' || prob.status === 'Review') {
          setUnderPrep(true);
        }

        setProblem(prob);
      } else {
        setNotFound(true);
      }
    } catch (err) {
      console.error("Failed to load problem", err);
      if (err.response?.status === 404) {
        setNotFound(true);
      } else {
        setError(err.response?.data?.message || "Failed to load problem. Check server connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblem();
  }, [problemId]);

  // Loading Skeleton State
  if (loading) {
    return (
      <div className="h-screen w-full bg-[#141414] text-slate-100 flex flex-col justify-between p-6 font-sans">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="h-6 w-48 bg-slate-800 rounded-md animate-pulse"></div>
          <div className="h-8 w-24 bg-slate-800 rounded-xl animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 my-4">
          <div className="bg-[#1a1a1a] rounded-2xl p-6 space-y-4 border border-slate-800">
            <div className="h-8 w-3/4 bg-slate-800 rounded-md animate-pulse"></div>
            <div className="h-4 w-1/4 bg-slate-800 rounded-md animate-pulse"></div>
            <div className="space-y-2 pt-4">
              <div className="h-4 w-full bg-slate-800 rounded-md animate-pulse"></div>
              <div className="h-4 w-5/6 bg-slate-800 rounded-md animate-pulse"></div>
              <div className="h-4 w-4/6 bg-slate-800 rounded-md animate-pulse"></div>
            </div>
          </div>

          <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
            <div className="h-full bg-slate-800/60 rounded-xl animate-pulse"></div>
          </div>
        </div>

        <div className="h-10 bg-slate-800/80 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  // Not Found State
  if (notFound || !problem) {
    return (
      <div className="h-screen w-full bg-[#141414] text-slate-100 flex flex-col items-center justify-center p-6 font-sans text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4 border border-rose-500/20">
          <LuAlertCircle size={28} />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Problem Not Found</h1>
        <p className="text-xs text-slate-400 max-w-md mb-6">
          The requested problem identifier <code className="text-primary font-mono font-bold">{problemId}</code> does not exist or has been removed.
        </p>
        <button
          onClick={() => navigate('/dsa-management/problems')}
          className="px-5 py-2.5 bg-primary hover:bg-primaryHover text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-xs"
        >
          <LuArrowLeft size={16} />
          <span>Back to Problems Bank</span>
        </button>
      </div>
    );
  }

  // Problem Under Preparation Banner
  if (underPrep) {
    return (
      <div className="h-screen w-full bg-[#141414] text-slate-100 flex flex-col items-center justify-center p-6 font-sans text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4 border border-amber-500/20">
          <LuClock size={28} />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Problem Under Preparation</h1>
        <p className="text-xs text-slate-400 max-w-md mb-6">
          "<strong className="text-white">{problem.title}</strong>" is currently in <span className="text-amber-400 font-bold">{problem.status}</span> mode. The authoring team is working on test cases and editorials.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchProblem}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer"
          >
            <LuRefreshCw size={15} />
            <span>Check Status Again</span>
          </button>
          <button
            onClick={() => navigate('/dsa-management/problems')}
            className="px-5 py-2.5 bg-primary hover:bg-primaryHover text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <LuArrowLeft size={16} />
            <span>Back to Problems List</span>
          </button>
        </div>
      </div>
    );
  }

  // Error State with Retry Button
  if (error) {
    return (
      <div className="h-screen w-full bg-[#141414] text-slate-100 flex flex-col items-center justify-center p-6 font-sans text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4 border border-rose-500/20">
          <LuAlertCircle size={28} />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Failed to Load Problem</h1>
        <p className="text-xs text-slate-400 max-w-md mb-6">{error}</p>
        <button
          onClick={fetchProblem}
          className="px-5 py-2.5 bg-primary hover:bg-primaryHover text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-xs"
        >
          <LuRefreshCw size={16} />
          <span>Retry Loading</span>
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen w-full overflow-hidden bg-slate-950">
      <DsaCodingArena
        problemId={problemId}
        problem={problem}
        onClose={() => navigate('/dsa-management/problems')}
        onSolveSuccess={(submission) => {
          console.log('Problem solved successfully!', submission);
        }}
      />
    </div>
  );
}

export default DsaProblemPage;
