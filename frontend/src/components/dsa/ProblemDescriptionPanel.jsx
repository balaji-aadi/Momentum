import React, { useState, useRef } from 'react';
import { useCodingArena } from './CodingArenaContext';
import {
  LuFileText,
  LuBookOpen,
  LuHistory,
  LuCopy,
  LuCheck,
  LuBuilding2,
  LuLightbulb,
  LuTag,
  LuCheckCircle2,
  LuChevronDown,
  LuChevronUp
} from 'react-icons/lu';
import { renderMarkdown } from '../../utils/markdownRenderer';

export function ProblemDescriptionPanel({ task }) {
  const { problem, submissions = [], taskLinkedNotes = [] } = useCodingArena();
  const [activeTab, setActiveTab] = useState('description'); // 'description' | 'editorial' | 'submissions'
  const [copiedId, setCopiedId] = useState(null);
  const [openHintIndex, setOpenHintIndex] = useState(null);
  const [showEditorialModal, setShowEditorialModal] = useState(false);
  const [editorialUnlocked, setEditorialUnlocked] = useState(false);
  const containerRef = useRef(null);

  // Dropdown states for LeetCode style Header Pills
  const [showTopics, setShowTopics] = useState(false);
  const [showCompanies, setShowCompanies] = useState(false);
  const [showHints, setShowHints] = useState(false);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const getDifficultyBadge = (diff) => {
    switch (diff?.toLowerCase()) {
      case 'easy':
        return 'bg-[#2cbb5d]/10 text-[#2cbb5d] border-[#2cbb5d]/20';
      case 'medium':
        return 'bg-[#ffc01e]/10 text-[#ffc01e] border-[#ffc01e]/20';
      case 'hard':
        return 'bg-[#ef4743]/10 text-[#ef4743] border-[#ef4743]/20';
      default:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  const isHtmlNote = (content) => {
    if (!content || typeof content !== 'string') return false;
    const lower = content.toLowerCase();
    return lower.includes("<html") ||
      lower.includes("&lt;html") ||
      lower.includes("<style") ||
      lower.includes("&lt;style") ||
      lower.includes("<body") ||
      lower.includes("&lt;body") ||
      lower.includes("<script");
  };

  const decodeHtml = (html) => {
    if (!html) return '';
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  };

  const handleNoteTabClick = (e) => {
    const target = e.target;
    if (!target) return;

    const btn = target.closest('button, .tab, .code-tab, [class*="tab"]');
    if (btn) {
      const parentBlock = btn.closest('.code-block, .code-container, [class*="code"], div');
      if (parentBlock) {
        const allBtns = parentBlock.querySelectorAll('button, .tab, .code-tab, [class*="tab"]');
        allBtns.forEach(b => {
          b.classList.remove('active', 'selected');
          b.style.opacity = '0.6';
          b.style.borderBottom = 'none';
        });
        btn.classList.add('active');
        btn.style.opacity = '1';
        btn.style.borderBottom = '2px solid #3b82f6';
      }
    }
  };

  const handleEditorialClick = () => {
    if (!editorialUnlocked) {
      setShowEditorialModal(true);
    } else {
      setActiveTab('editorial');
    }
  };

  const topicsList = problem.topics || [];
  const companiesList = problem.companies || [];

  return (
    <div className="h-full flex flex-col bg-[#1a1a1a] text-[#eff1f6] border-r border-[#2d2d2d] overflow-hidden select-none font-sans relative">
      {/* Tab bar header */}
      <div className="h-10 flex items-center gap-1 border-b border-[#2d2d2d] px-3 bg-[#141414] shrink-0">
        <button
          onClick={() => setActiveTab('description')}
          className={`flex items-center gap-2 px-3 h-full text-xs font-bold border-b-2 transition-all cursor-pointer ${activeTab === 'description'
            ? 'border-emerald-500 text-emerald-400'
            : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
        >
          <LuFileText size={15} />
          <span>Description</span>
        </button>

        <button
          onClick={handleEditorialClick}
          className={`flex items-center gap-2 px-3 h-full text-xs font-bold border-b-2 transition-all cursor-pointer ${activeTab === 'editorial'
            ? 'border-emerald-500 text-emerald-400'
            : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
        >
          <LuBookOpen size={15} />
          <span>Editorial</span>
        </button>

        <button
          onClick={() => setActiveTab('submissions')}
          className={`flex items-center gap-2 px-3 h-full text-xs font-bold border-b-2 transition-all cursor-pointer ${activeTab === 'submissions'
            ? 'border-emerald-500 text-emerald-400'
            : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
        >
          <LuHistory size={15} />
          <span>Submissions</span>
        </button>
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6 text-[#eff1f6] text-sm leading-relaxed scrollbar-thin select-text">
        {/* TAB 1: DESCRIPTION */}
        {activeTab === 'description' && (
          <div className="space-y-5 animate-fade-in">
            {problem.isWorkInProgress && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                  <span>🛠️ Problem Under Preparation</span>
                </div>
                <p className="text-[11px] text-amber-200/80 leading-relaxed">
                  This problem has not been published to the MongoDB database yet.
                </p>
                <a
                  href={`#/dsa-management/create-problem?title=${encodeURIComponent(problem.title || '')}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary hover:bg-primaryHover text-white text-xs font-bold rounded-lg transition-all"
                >
                  <span>+ Create Problem in CMS</span>
                </a>
              </div>
            )}

            {/* Problem Title & Header */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  {problem.problemCode || '1'}. {problem.title}
                </h1>
                {problem.isSolved && (
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    Solved <LuCheckCircle2 size={13} />
                  </span>
                )}
              </div>

              {/* LeetCode Collapsible Header Pills: Difficulty, Topics & Companies */}
              <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
                <span className={`px-2.5 py-1 font-extrabold rounded-full border text-[11px] ${getDifficultyBadge(problem.difficulty)}`}>
                  {problem.difficulty || 'Medium'}
                </span>

                {/* Topics Collapsible Pill */}
                {topicsList.length > 0 && (
                  <button
                    onClick={() => setShowTopics(prev => !prev)}
                    className={`px-3 py-1 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                      showTopics 
                        ? 'bg-primary/20 text-primary border-primary/40' 
                        : 'bg-[#262626] text-slate-300 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    <LuTag size={13} className="text-primary" />
                    <span>Topics ({topicsList.length})</span>
                    {showTopics ? <LuChevronUp size={13} /> : <LuChevronDown size={13} />}
                  </button>
                )}

                {/* Companies Collapsible Pill */}
                {companiesList.length > 0 && (
                  <button
                    onClick={() => setShowCompanies(prev => !prev)}
                    className={`px-3 py-1 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                      showCompanies 
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                        : 'bg-[#262626] text-slate-300 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    <LuBuilding2 size={13} className="text-amber-400" />
                    <span>Companies ({companiesList.length})</span>
                    {showCompanies ? <LuChevronUp size={13} /> : <LuChevronDown size={13} />}
                  </button>
                )}
              </div>

              {/* Expanded Topics Drawer */}
              {showTopics && topicsList.length > 0 && (
                <div className="p-3.5 bg-[#222222] border border-slate-700/80 rounded-xl space-y-2 animate-fade-in shadow-inner">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <LuTag size={12} className="text-primary" />
                    <span>Related Topics</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {topicsList.map((t, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-[#2a2a2a] text-slate-200 border border-slate-700 text-xs font-semibold">
                        {typeof t === 'object' ? t.name : t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Expanded Companies Drawer */}
              {showCompanies && companiesList.length > 0 && (
                <div className="p-3.5 bg-[#222222] border border-slate-700/80 rounded-xl space-y-2 animate-fade-in shadow-inner">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <LuBuilding2 size={12} className="text-amber-400" />
                    <span>Target Companies</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {companiesList.map((c, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-semibold flex items-center gap-1.5">
                        <LuBuilding2 size={12} />
                        <span>{typeof c === 'object' ? c.name : c}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Description Statement */}
            <div
              className="prose prose-invert max-w-none text-[#eff1f6] space-y-4 leading-relaxed text-base font-sans"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(problem.descriptionMarkdown) || problem.descriptionHtml || task?.taskDescription || "<p>Problem description statement.</p>" }}
            />

            {/* Structured Examples */}
            {problem.examples && problem.examples.length > 0 && (
              <div className="space-y-4 pt-1">
                {problem.examples.map((eg, index) => (
                  <div
                    key={eg.id || index}
                    className="p-3.5 rounded-xl bg-[#262626] border border-[#333333] space-y-1.5 font-mono text-xs relative group"
                  >
                    <div className="flex justify-between items-center text-slate-400 text-[11px] font-sans font-bold uppercase mb-1">
                      <span>Example {index + 1}:</span>
                      <button
                        onClick={() => handleCopy(`Input: ${eg.input}\nOutput: ${eg.output}`, `eg-${index}`)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-white cursor-pointer"
                        title="Copy Example"
                      >
                        {copiedId === `eg-${index}` ? <LuCheck size={14} className="text-emerald-400" /> : <LuCopy size={14} />}
                      </button>
                    </div>

                    <div>
                      <span className="text-slate-400 font-bold select-none">Input: </span>
                      <span className="text-slate-100 font-semibold">{eg.input}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-bold select-none">Output: </span>
                      <span className="text-slate-100 font-semibold">{eg.output}</span>
                    </div>

                    {eg.explanation && (
                      <div className="pt-1 text-slate-300 font-sans text-xs leading-relaxed">
                        <strong className="text-slate-200">Explanation: </strong>
                        <span className="italic text-slate-300">{eg.explanation}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Constraints (Matching Image 4) */}
            {problem.constraints && problem.constraints.length > 0 && (
              <div className="space-y-2.5 pt-3 border-t border-[#2d2d2d]">
                <h3 className="text-sm font-bold text-white">Constraints:</h3>
                <ul className="space-y-2 list-disc list-inside text-xs text-slate-300">
                  {problem.constraints.map((c, i) => (
                    <li key={i} className="leading-relaxed">
                      <code className="bg-[#262626] text-slate-200 border border-[#383838] px-2 py-0.5 rounded-md font-mono text-sm inline-block">
                        {c}
                      </code>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Progressive Hints Accordion */}
            {problem.hints && problem.hints.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-[#2d2d2d]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <LuLightbulb size={14} />
                  <span>Progressive Hints</span>
                </h3>
                <div className="space-y-2">
                  {problem.hints.map((hint, i) => {
                    const isOpen = openHintIndex === i;
                    return (
                      <div key={i} className="rounded-xl border border-[#333333] bg-[#262626] overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setOpenHintIndex(isOpen ? null : i)}
                          className="w-full px-3.5 py-2 flex items-center justify-between text-xs font-bold text-slate-200 hover:bg-[#333333] transition-colors cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <span className="text-amber-400 font-extrabold text-[11px]">Hint {i + 1}</span>
                          </span>
                          {isOpen ? <LuChevronUp size={14} /> : <LuChevronDown size={14} />}
                        </button>

                        {isOpen && (
                          <div className="p-3.5 text-xl text-slate-300 font-sans border-t border-[#333333] bg-[#1e1e1e] leading-relaxed">
                            {hint}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: EDITORIAL */}
        {activeTab === 'editorial' && (
          <div
            ref={containerRef}
            onClick={handleNoteTabClick}
            className="animate-fade-in -m-4 sm:-m-5 min-h-full bg-white text-slate-900 rounded-none overflow-hidden"
          >
            {taskLinkedNotes && taskLinkedNotes.length > 0 ? (
              <div className="space-y-6">
                {taskLinkedNotes.map((note, idx) => {
                  const content = note.content || note.description || '';
                  const isFullHtml = isHtmlNote(content);

                  return (
                    <div key={note._id || idx} className="w-full h-full">
                      {isFullHtml ? (
                        <iframe
                          title={note.title || "Sarthi Note Editorial"}
                          srcDoc={decodeHtml(content)}
                          className="w-full min-h-[750px] border-none bg-white"
                          sandbox="allow-scripts allow-same-origin"
                        />
                      ) : (
                        <div
                          className="p-6 text-xs text-slate-800 font-sans leading-relaxed space-y-3 prose max-w-none"
                          dangerouslySetInnerHTML={{ __html: content }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center text-[11px] uppercase font-bold tracking-widest text-amber-600">
                  <span>{problem.title?.toUpperCase()}</span>
                  <span className="text-slate-400 font-mono">OFFICIAL EDITORIAL</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 font-extrabold text-[10px] rounded-lg uppercase tracking-wider">
                    DSA SOLUTION
                  </span>
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold text-[10px] rounded-lg uppercase tracking-wider">
                    {(problem.difficulty || 'EASY').toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <span className="w-1.5 h-7 bg-blue-600 rounded-sm shrink-0 inline-block" />
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    {problem.title}
                  </h2>
                </div>

                <hr className="border-slate-200 my-3" />

                <div
                  className="p-4 bg-slate-50 border border-slate-200 text-xs font-sans text-slate-800 leading-relaxed prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(problem.editorialMarkdown) || problem.editorial || "Official solution approach and complexity analysis available." }}
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SUBMISSIONS */}
        {activeTab === 'submissions' && (
          <div className="space-y-3 animate-fade-in">
            <h2 className="text-sm font-bold text-white">
              Submission History
            </h2>
            {submissions.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No submissions yet for this problem.</p>
            ) : (
              <div className="space-y-2">
                {submissions.map((sub) => (
                  <div key={sub.id} className="p-3 rounded-xl bg-[#262626] border border-[#333333] flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-emerald-400 mr-2">{sub.status}</span>
                      <span className="text-slate-400 font-mono">({sub.language})</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                      <span>{sub.runtime}</span>
                      <span>{sub.memory}</span>
                      <span className="text-slate-500">{sub.submittedAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Editorial Confirmation Lock Modal */}
      {showEditorialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-[#1e1e1e] border border-[#333333] rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xl shrink-0 border border-amber-500/20">
                💡
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Unlock Official Solution?</h3>
                <p className="text-xs text-slate-400">Try it yourself before viewing the solution!</p>
              </div>
            </div>

            <p className="text-xl text-slate-300 leading-relaxed bg-[#262626] p-3 rounded-xl border border-[#333333]">
              We strongly recommend attempting to solve the problem on your own first! Working through the problem yourself builds deep problem-solving skills. Are you sure you want to reveal the editorial solution?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowEditorialModal(false)}
                className="px-4 py-2 bg-[#262626] hover:bg-[#333333] text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Keep Trying
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditorialUnlocked(true);
                  setShowEditorialModal(false);
                  setActiveTab('editorial');
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer"
              >
                Yes, Unlock Solution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
