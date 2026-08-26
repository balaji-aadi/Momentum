import React, { useState, useRef, useEffect } from 'react';
import { CodingArenaProvider, useCodingArena } from './CodingArenaContext';
import { DsaArenaHeader } from './DsaArenaHeader';
import { ProblemDescriptionPanel } from './ProblemDescriptionPanel';
import { CodeEditorPanel } from './CodeEditorPanel';
import { OutputConsolePanel } from './OutputConsolePanel';
import { ProblemApi } from '../../services/api/Problem.api';
import { LuFileText, LuBookOpen, LuHistory, LuChevronRight, LuChevronLeft, LuCode2 } from 'react-icons/lu';

function CodingArenaWorkspace({ onClose, containerRef, isResizing, isDraggingHorizontal, isDraggingVertical, leftWidthPercent, setLeftWidthPercent, editorHeightPercent, setEditorHeightPercent, isFullscreenEditor, setIsFullscreenEditor }) {
  const { isConsoleCollapsed } = useCodingArena();
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);

  return (
    <div 
      ref={containerRef}
      className="h-screen w-full flex flex-col bg-[#141414] text-slate-100 overflow-hidden font-sans select-none relative"
    >
      {/* Transparent Overlay during dragging */}
      {isResizing && (
        <div className="fixed inset-0 z-50 cursor-col-resize select-none pointer-events-auto" />
      )}

      {/* Top Header */}
      <DsaArenaHeader onClose={onClose} />

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Panel: Collapsed Vertical Sidebar vs Full Description Panel */}
        {isLeftCollapsed ? (
          <div className="w-[44px] h-full bg-[#141414] border-r border-[#2d2d2d] flex flex-col items-center py-3 gap-4 shrink-0 z-20 font-sans">
            <button
              onClick={() => { setIsLeftCollapsed(false); setIsRightCollapsed(false); }}
              className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-[#252526] rounded-xl transition-all cursor-pointer relative group"
              title="Expand Description"
            >
              <LuFileText size={18} />
            </button>
            <button
              onClick={() => { setIsLeftCollapsed(false); setIsRightCollapsed(false); }}
              className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-[#252526] rounded-xl transition-all cursor-pointer relative group"
              title="Expand Editorial"
            >
              <LuBookOpen size={18} />
            </button>
            <button
              onClick={() => { setIsLeftCollapsed(false); setIsRightCollapsed(false); }}
              className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-[#252526] rounded-xl transition-all cursor-pointer relative group"
              title="Expand Submissions"
            >
              <LuHistory size={18} />
            </button>

            <div className="mt-auto border-t border-[#2d2d2d] pt-3 w-full flex justify-center">
              <button
                onClick={() => { setIsLeftCollapsed(false); setIsRightCollapsed(false); }}
                className="p-2 text-slate-400 hover:text-white hover:bg-[#252526] rounded-xl transition-all cursor-pointer"
                title="Expand Description Panel"
              >
                <LuChevronRight size={18} />
              </button>
            </div>
          </div>
        ) : (
          <div 
            style={{ width: isRightCollapsed ? 'calc(100% - 44px)' : `${leftWidthPercent}%` }}
            className={`h-full overflow-hidden shrink-0 transition-all duration-150 ${isRightCollapsed ? 'flex-1' : ''}`}
          >
            <ProblemDescriptionPanel 
              onToggleCollapse={() => { setIsLeftCollapsed(true); setIsRightCollapsed(false); }}
              onToggleExpandFull={() => { setIsRightCollapsed(prev => !prev); setIsLeftCollapsed(false); }}
              isExpandedFull={isRightCollapsed}
            />
          </div>
        )}

        {/* Horizontal Splitter */}
        {!isLeftCollapsed && !isRightCollapsed && (
          <div 
            onMouseDown={(e) => {
              e.preventDefault();
              isDraggingHorizontal.current = true;
              document.body.style.cursor = 'col-resize';
              document.body.style.userSelect = 'none';
            }}
            className="w-1.5 h-full bg-[#1e1e1e] hover:bg-primary/80 transition-colors cursor-col-resize shrink-0 z-10 flex items-center justify-center group"
          >
            <div className="w-[2px] h-6 bg-slate-600 group-hover:bg-white rounded-full"></div>
          </div>
        )}

        {/* Right Panel: Collapsed Vertical Sidebar vs Full Code Editor + Console */}
        {isRightCollapsed ? (
          <div className="w-[44px] h-full bg-[#141414] border-l border-[#2d2d2d] flex flex-col items-center py-3 gap-4 shrink-0 z-20 font-sans">
            <button
              onClick={() => { setIsRightCollapsed(false); setIsLeftCollapsed(false); }}
              className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-[#252526] rounded-xl transition-all cursor-pointer relative group"
              title="Expand Code Editor"
            >
              <LuCode2 size={18} />
            </button>

            <div className="mt-auto border-t border-[#2d2d2d] pt-3 w-full flex justify-center">
              <button
                onClick={() => { setIsRightCollapsed(false); setIsLeftCollapsed(false); }}
                className="p-2 text-slate-400 hover:text-white hover:bg-[#252526] rounded-xl transition-all cursor-pointer"
                title="Expand Code Editor Panel"
              >
                <LuChevronLeft size={18} />
              </button>
            </div>
          </div>
        ) : (
          <div 
            id="right-panel-container"
            className="flex-1 h-full flex flex-col overflow-hidden min-w-[200px]"
          >
            {/* Upper Right: Code Editor Panel */}
            <div 
              style={{ 
                height: isFullscreenEditor 
                  ? '100%' 
                  : isConsoleCollapsed 
                    ? 'calc(100% - 40px)' 
                    : `${editorHeightPercent}%` 
              }}
              className="w-full overflow-hidden shrink-0 transition-all duration-150"
            >
              <CodeEditorPanel 
                isFullscreen={isFullscreenEditor || isLeftCollapsed}
                onToggleFullscreen={() => {
                  if (isLeftCollapsed) {
                    setIsLeftCollapsed(false);
                    setIsRightCollapsed(false);
                  } else {
                    setIsLeftCollapsed(true);
                    setIsRightCollapsed(false);
                  }
                }}
              />
            </div>

            {/* Vertical Splitter (Visible only when console is expanded) */}
            {!isFullscreenEditor && !isConsoleCollapsed && (
              <div 
                onMouseDown={(e) => {
                  e.preventDefault();
                  isDraggingVertical.current = true;
                  document.body.style.cursor = 'row-resize';
                  document.body.style.userSelect = 'none';
                }}
                className="h-1.5 w-full bg-[#1e1e1e] hover:bg-primary/80 transition-colors cursor-row-resize shrink-0 z-10 flex items-center justify-center group"
              >
                <div className="h-[2px] w-6 bg-slate-600 group-hover:bg-white rounded-full"></div>
              </div>
            )}

            {/* Lower Right: Console Panel (Exactly 40px at bottom when collapsed, flex-1 when expanded) */}
            {!isFullscreenEditor && (
              <div className={`w-full overflow-hidden transition-all duration-150 ${isConsoleCollapsed ? 'h-10 shrink-0' : 'flex-1 min-h-[140px]'}`}>
                <OutputConsolePanel />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function DsaCodingArena({ problemId, problem: inputProblem, task, onClose, onSolveSuccess }) {
  const [problem, setProblem] = useState(inputProblem || null);
  const [loading, setLoading] = useState(!inputProblem);

  // Split-pane ratios
  const [leftWidthPercent, setLeftWidthPercent] = useState(44); // 44% left panel
  const [editorHeightPercent, setEditorHeightPercent] = useState(60); // 60% editor height
  const [isFullscreenEditor, setIsFullscreenEditor] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const isDraggingHorizontal = useRef(false);
  const isDraggingVertical = useRef(false);
  const containerRef = useRef(null);

  // Target identifier string
  const targetId = problemId || task?.taskName || task?._id || "dsa-problem";

  // Fetch Problem from Backend MongoDB
  useEffect(() => {
    if (inputProblem && inputProblem.descriptionMarkdown) {
      setProblem(inputProblem);
      setLoading(false);
      return;
    }

    const fetchBackendProblem = async () => {
      setLoading(true);
      try {
        const queryKey = typeof targetId === 'string'
          ? targetId.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-')
          : targetId;
        const res = await ProblemApi.getProblemByIdOrSlug(targetId);
        
        if (res.data?.success && res.data.data) {
          setProblem(res.data.data);
        } else {
          setProblem({
            isWorkInProgress: true,
            title: task?.taskName || targetId || "Problem Under Preparation",
            difficulty: "Medium",
            slug: queryKey,
            descriptionMarkdown: `### 🛠️ Problem is Under Preparation\n\nThis problem has not been published to the MongoDB database yet.`
          });
        }
      } catch (err) {
        setProblem({
          isWorkInProgress: true,
          title: task?.taskName || targetId || "Problem Under Preparation",
          difficulty: "Medium",
          slug: targetId,
          descriptionMarkdown: `### 🛠️ Problem is Under Preparation\n\nThis problem has not been published to the MongoDB database yet.`
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBackendProblem();
  }, [targetId, inputProblem]);

  // Mouse move resize handling
  useEffect(() => {
    let animationFrameId = null;

    const handleMouseMove = (e) => {
      if (!containerRef.current) return;

      if (animationFrameId) cancelAnimationFrame(animationFrameId);

      animationFrameId = requestAnimationFrame(() => {
        const rect = containerRef.current.getBoundingClientRect();

        if (isDraggingHorizontal.current) {
          const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
          if (newWidth > 20 && newWidth < 80) {
            setLeftWidthPercent(newWidth);
          }
        }

        if (isDraggingVertical.current) {
          const rightContainer = document.getElementById('right-panel-container');
          if (rightContainer) {
            const rightRect = rightContainer.getBoundingClientRect();
            const newHeight = ((e.clientY - rightRect.top) / rightRect.height) * 100;
            if (newHeight > 20 && newHeight < 85) {
              setEditorHeightPercent(newHeight);
            }
          }
        }
      });
    };

    const handleMouseUp = () => {
      isDraggingHorizontal.current = false;
      isDraggingVertical.current = false;
      setIsResizing(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  if (loading || !problem) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#141414] text-slate-400 font-sans text-xs font-semibold animate-pulse">
        Fetching problem from MongoDB backend...
      </div>
    );
  }

  return (
    <CodingArenaProvider
      problem={problem}
      task={task}
      onClose={onClose}
      onSolveSuccess={onSolveSuccess}
    >
      <CodingArenaWorkspace
        onClose={onClose}
        containerRef={containerRef}
        isResizing={isResizing}
        isDraggingHorizontal={isDraggingHorizontal}
        isDraggingVertical={isDraggingVertical}
        leftWidthPercent={leftWidthPercent}
        setLeftWidthPercent={setLeftWidthPercent}
        editorHeightPercent={editorHeightPercent}
        setEditorHeightPercent={setEditorHeightPercent}
        isFullscreenEditor={isFullscreenEditor}
        setIsFullscreenEditor={setIsFullscreenEditor}
      />
    </CodingArenaProvider>
  );
}

export default DsaCodingArena;
