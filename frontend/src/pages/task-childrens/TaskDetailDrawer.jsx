import React, { useEffect, useState, useRef } from 'react';
import { IoClose, IoFlagSharp, IoCalendarOutline, IoTimeOutline, IoPersonOutline, IoAttachOutline, IoGitNetworkSharp, IoCheckmarkCircleOutline, IoTrashOutline, IoArrowDown, IoArrowUp } from 'react-icons/io5';
import { MdEdit } from 'react-icons/md';
import { LuCode2 } from 'react-icons/lu';
import moment from 'moment';
window.moment = moment;
import { TaskApi } from '../../services/api/Task.api';
import { NoteApi } from '../../services/api/Note.api';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { server } from '../../services/config';
import DsaCodingArenaModal from '../../components/dsa/DsaCodingArenaModal';
import { FaCode } from "react-icons/fa";

const hasAdditionalNotes = (notes) => {
    if (!notes) return false;
    if (typeof notes !== 'string') return false;
    const stripped = notes.replace(/<[^>]*>?/gm, '');
    const decoded = stripped
        .replace(/&nbsp;/gi, '')
        .replace(/&amp;/gi, '')
        .trim();
    return decoded.length > 0;
};

const getYoutubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

const decodeHtmlEntities = (str) => {
    if (!str) return "";
    const txt = document.createElement("textarea");
    txt.innerHTML = str;
    return txt.value;
};

const isHtmlNote = (content) => {
    if (!content) return false;
    const lower = content.toLowerCase();
    return lower.includes("<!doctype html>") ||
        lower.includes("&lt;!doctype html&gt;") ||
        lower.includes("<html") ||
        lower.includes("&lt;html") ||
        lower.includes("<style") ||
        lower.includes("&lt;style") ||
        lower.includes("<body") ||
        lower.includes("&lt;body");
};

const TaskDetailDrawer = ({ isOpen, onClose, task: initialTask, onTaskUpdate, canEdit }) => {
    const [task, setTask] = useState(initialTask);
    const [showCodingModal, setShowCodingModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [subtasks, setSubtasks] = useState([]);
    const [activeTab, setActiveTab] = useState('subtasks'); // 'subtasks', 'activity', 'attachments'
    const { currentUser } = useSelector(state => state.store);
    const isAdmin = currentUser?.userRole?.name?.toLowerCase() === 'admin' ||
                    currentUser?.role === 'admin' ||
                    currentUser?.email === 'balajiaadi2000@gmail.com' ||
                    (currentUser?.userRoles && currentUser.userRoles.some(r => r.name?.toLowerCase() === 'admin'));
    const [notes, setNotes] = useState([]);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isReaderOpen, setIsReaderOpen] = useState(false);
    const [activeReaderNoteId, setActiveReaderNoteId] = useState(null);
    const [readerSearchTerm, setReaderSearchTerm] = useState("");
    const [isEditingNote, setIsEditingNote] = useState(false);
    const [editedTitle, setEditedTitle] = useState("");
    const [editedContent, setEditedContent] = useState("");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isBilingual, setIsBilingual] = useState(false);
    const [bilingualTaskId, setBilingualTaskId] = useState("");
    const [editedEnContent, setEditedEnContent] = useState("");
    const [editedHiContent, setEditedHiContent] = useState("");
    const [isTranslating, setIsTranslating] = useState(false);
    const activeNote = notes.find(n => n._id === activeReaderNoteId);
    // Zen Reading Mode State
    const [isReadingModeActive, setIsReadingModeActive] = useState(false);
    const lastScrollTopRef = useRef(0);
    const accumulatedScrollRef = useRef(0);
    const transitionLockRef = useRef(false);
    const [iframeScrollInfo, setIframeScrollInfo] = useState({ isAtBottom: false, canScroll: false });
    const iframeRef = useRef(null);

    useEffect(() => {
        setIsReadingModeActive(false);
        transitionLockRef.current = false;
        lastScrollTopRef.current = 0;
        accumulatedScrollRef.current = 0;
    }, [activeReaderNoteId]);

    const handleExitReadingMode = () => {
        transitionLockRef.current = true;
        accumulatedScrollRef.current = 0;
        setIsReadingModeActive(false);
        // Lock transitions for 1200ms so any scroll events fired during header/sidebar expansion are completely ignored
        setTimeout(() => {
            transitionLockRef.current = false;
            accumulatedScrollRef.current = 0;
        }, 1200);
    };

    useEffect(() => {
        const handleMessage = (e) => {
            if (e.data?.type === 'iframeScroll') {
                const { scrollTop, scrollHeight, clientHeight } = e.data;
                const parentHeight = window.innerHeight;

                // Track scroll state for FAB
                setIframeScrollInfo({
                    isAtBottom: Math.ceil(scrollTop + clientHeight) >= scrollHeight - 50,
                    canScroll: scrollHeight > clientHeight + 100
                });

                if (scrollHeight < parentHeight && !isReadingModeActive) {
                    return;
                }

                if (transitionLockRef.current) {
                    accumulatedScrollRef.current = 0;
                    lastScrollTopRef.current = scrollTop;
                    return;
                }

                const delta = scrollTop - lastScrollTopRef.current;
                lastScrollTopRef.current = scrollTop;

                if (delta > 0) {
                    if (accumulatedScrollRef.current < 0) accumulatedScrollRef.current = 0;
                    accumulatedScrollRef.current += delta;
                } else if (delta < 0) {
                    if (accumulatedScrollRef.current > 0) accumulatedScrollRef.current = 0;
                    accumulatedScrollRef.current += delta;
                }

                const isScrollingDown = accumulatedScrollRef.current > 120;

                // Only automatically ENTER reading mode when scrolling down.
                // Once in reading mode, NEVER automatically exit via scroll. User must click "End Read" / "Exit Full Screen".
                if (!isReadingModeActive && isScrollingDown && scrollTop > 150) {
                    transitionLockRef.current = true;
                    accumulatedScrollRef.current = 0;
                    setIsReadingModeActive(true);
                    setTimeout(() => { transitionLockRef.current = false; }, 800);
                }
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [isReadingModeActive]);

    const handleReaderScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        const parentHeight = window.innerHeight;

        setIframeScrollInfo({
            isAtBottom: Math.ceil(scrollTop + clientHeight) >= scrollHeight - 50,
            canScroll: scrollHeight > clientHeight + 100
        });

        if (scrollHeight < parentHeight && !isReadingModeActive) {
            return;
        }

        if (transitionLockRef.current) {
            accumulatedScrollRef.current = 0;
            lastScrollTopRef.current = scrollTop;
            return;
        }

        const delta = scrollTop - lastScrollTopRef.current;
        lastScrollTopRef.current = scrollTop;

        if (delta > 0) {
            if (accumulatedScrollRef.current < 0) accumulatedScrollRef.current = 0;
            accumulatedScrollRef.current += delta;
        } else if (delta < 0) {
            if (accumulatedScrollRef.current > 0) accumulatedScrollRef.current = 0;
            accumulatedScrollRef.current += delta;
        }

        const isScrollingDown = accumulatedScrollRef.current > 120;

        // Only automatically ENTER reading mode when scrolling down.
        // Once in reading mode, NEVER automatically exit via scroll. User must click "End Read" / "Exit Full Screen".
        if (!isReadingModeActive && isScrollingDown && scrollTop > 150) {
            transitionLockRef.current = true;
            accumulatedScrollRef.current = 0;
            setIsReadingModeActive(true);
            setTimeout(() => { transitionLockRef.current = false; }, 800);
        }
    };

    const handleFloatingScroll = () => {
        if (iframeScrollInfo.isAtBottom) {
            // Scroll to top
            if (iframeRef.current) {
                iframeRef.current.contentWindow.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                document.querySelector('.note-reader-container')?.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } else {
            // Scroll to bottom
            if (iframeRef.current) {
                const height = iframeRef.current.contentDocument?.documentElement?.scrollHeight || 9999;
                iframeRef.current.contentWindow.scrollTo({ top: height, behavior: 'smooth' });
            } else {
                const container = document.querySelector('.note-reader-container');
                if (container) container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
            }
        }
    };
    const handleTranslateToHindi = async (englishText) => {
        if (!englishText || englishText.trim() === "" || englishText === "<p><br></p>") {
            toast.error("Please enter some English content first");
            return null;
        }
        setIsTranslating(true);
        const loadingToast = toast.loading("Translating to Hindi...");
        try {
            const res = await NoteApi.aiEnhance({ content: englishText, action: "translate-hi" });
            const translated = res.data?.data?.enhancedContent || res.data?.enhancedContent;
            if (translated) {
                toast.success("Translation completed!");
                return translated;
            } else {
                toast.error("Translation returned empty content");
                return null;
            }
        } catch (err) {
            console.error("Translation failed:", err);
            toast.error("Failed to translate note");
            return null;
        } finally {
            toast.dismiss(loadingToast);
            setIsTranslating(false);
        }
    };

    const getCleanSnippet = (content, limit = 100) => {
        if (!content) return "No content";
        let clean = decodeHtmlEntities(content);
        clean = clean.replace(/<style[\s\S]*?<\/style>/gi, '');
        clean = clean.replace(/<script[\s\S]*?<\/script>/gi, '');
        clean = clean.replace(/<div[^>]*class="note-root"[\s\S]*?<div[^>]*class="lang-en-[^"]*"[^>]*>/gi, '');
        clean = clean.replace(/<[^>]*>?/gm, '');
        clean = clean.replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();
        return clean.slice(0, limit) + (clean.length > limit ? "..." : "");
    };

    const extractBilingual = (html, noteId) => {
        if (!html) return { isBilingual: false, en: "", hi: "" };
        const enMarker = `class="lang-en-`;
        const hiMarker = `class="lang-hi-`;
        const enIdx = html.indexOf(enMarker);
        const hiIdx = html.indexOf(hiMarker);
        if (enIdx === -1 || hiIdx === -1) {
            return { isBilingual: false, en: html, hi: "" };
        }
        const taskIdMatch = html.substring(enIdx).match(/class="lang-en-([^"]+)"/);
        const taskId = taskIdMatch ? taskIdMatch[1] : noteId;
        const enTagEnd = html.indexOf('>', enIdx) + 1;
        const hiDivStart = html.lastIndexOf('<div', hiIdx);
        const enContentEnd = html.lastIndexOf('</div>', hiDivStart);
        const hiTagEnd = html.indexOf('>', hiIdx) + 1;
        const outerDivEnd = html.lastIndexOf('</div>');
        const hiContentEnd = html.lastIndexOf('</div>', outerDivEnd - 1);
        if (enTagEnd > 0 && enContentEnd > enTagEnd && hiTagEnd > 0 && hiContentEnd > hiTagEnd) {
            return {
                isBilingual: true,
                taskId,
                en: html.substring(enTagEnd, enContentEnd).trim(),
                hi: html.substring(hiTagEnd, hiContentEnd).trim()
            };
        }
        return { isBilingual: false, en: html, hi: "" };
    };

    const rebuildBilingualNote = (taskId, enContent, hiContent) => {
        return `<div class="note-root"><input type="radio" id="lang-en-${taskId}" name="lang-${taskId}" checked style="display: none;" /><input type="radio" id="lang-hi-${taskId}" name="lang-${taskId}" style="display: none;" /><div style="display: flex; gap: 8px; margin-bottom: 14px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;"><label for="lang-en-${taskId}" id="lbl-en-${taskId}" style="padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; background: #e2e8f0; color: #475569; border: 1px solid #cbd5e1; user-select: none; transition: all 0.2s;">🇬🇧 English</label><label for="lang-hi-${taskId}" id="lbl-hi-${taskId}" style="padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; background: #f1f5f9; color: #94a3b8; border: 1px solid #e2e8f0; user-select: none; transition: all 0.2s;">🇮🇳 हिन्दी (Hindi)</label></div><style>#lang-en-${taskId}:checked ~ div #lbl-en-${taskId} { background-color: #3b82f6 !important; color: white !important; border-color: #3b82f6 !important; } #lang-hi-${taskId}:checked ~ div #lbl-hi-${taskId} { background-color: #3b82f6 !important; color: white !important; border-color: #3b82f6 !important; } #lang-en-${taskId}:checked ~ .lang-en-${taskId} { display: block !important; } #lang-en-${taskId}:checked ~ .lang-hi-${taskId} { display: none !important; } #lang-hi-${taskId}:checked ~ .lang-en-${taskId} { display: none !important; } #lang-hi-${taskId}:checked ~ .lang-hi-${taskId} { display: block !important; }</style><div class="lang-en-${taskId}" style="display: block;">${enContent}</div><div class="lang-hi-${taskId}" style="display: none;">${hiContent}</div></div>`;
    };

    useEffect(() => {
        if (initialTask) {
            setTask(initialTask);
        }
    }, [initialTask]);

    const fetchNotes = async (currTaskId = task?._id, parentId = null) => {
        const targetTaskId = currTaskId || initialTask?._id;
        if (!targetTaskId) return;
        try {
            const ids = [targetTaskId];
            const actualParentId = parentId || (task?.parentTask ? (typeof task.parentTask === 'object' ? task.parentTask?._id : task.parentTask) : null);
            if (actualParentId) {
                ids.push(actualParentId);
            }
            const res = await NoteApi.getNotes({ taskIds: ids.join(',') });
            setNotes(res.data?.data || []);
        } catch (error) {
            console.error("Failed to fetch notes in details drawer:", error);
        }
    };

    const handleCreateNote = async () => {
        try {
            const defaultTitle = `Note for ${task?.taskName || 'Task'}`;
            const defaultContent = `<div style="font-family: sans-serif;">
  <h3 style="color: #0f172a; font-size: 15px; font-weight: 800; margin-top: 0; margin-bottom: 6px;">🧠 Key Revision Lesson</h3>
  <p style="color: #334155; font-size: 13px; line-height: 1.5; margin: 0 0 10px 0;">
    Type your notes here...
  </p>
</div>`;
            const noteData = {
                title: defaultTitle,
                content: defaultContent,
                color: "#fef08a",
                position: { x: 100, y: 100 },
                size: { width: 380, height: 350 },
                taskId: task?._id
            };
            const res = await NoteApi.createNote(noteData);
            const createdNote = res.data?.data || res.data;
            if (createdNote && createdNote._id) {
                toast.success("Note created successfully!");
                await fetchNotes();
                setActiveReaderNoteId(createdNote._id);
                setIsReaderOpen(true);
            } else {
                toast.error("Failed to create note");
            }
        } catch (error) {
            console.error("Error creating note:", error);
            toast.error("Error creating note");
        }
    };

    const handleSaveNote = async () => {
        try {
            const finalContent = isBilingual
                ? rebuildBilingualNote(bilingualTaskId, editedEnContent, editedHiContent)
                : editedContent;
            const res = await NoteApi.updateNote(activeReaderNoteId, {
                title: editedTitle,
                content: finalContent
            });
            if (res.data?.success) {
                toast.success("Note saved successfully!");
                setIsEditingNote(false);
                await fetchNotes();
            } else {
                toast.error("Failed to save note");
            }
        } catch (error) {
            console.error("Error saving note:", error);
            toast.error("Error saving note");
        }
    };

    const handleDeleteNote = async (noteId) => {
        try {
            const res = await NoteApi.deleteNote(noteId);
            if (res.data?.success) {
                toast.success("Note deleted successfully!");
                setIsEditingNote(false);
                setActiveReaderNoteId(null);
                await fetchNotes();
            } else {
                toast.error("Failed to delete note");
            }
        } catch (error) {
            console.error("Error deleting note:", error);
            toast.error("Error deleting note");
        }
    };

    useEffect(() => {
        if (isOpen && initialTask?._id) {
            fetchTaskDetails(initialTask._id);
            fetchSubtasks(initialTask._id);
            const initialParentId = initialTask.parentTask ? (typeof initialTask.parentTask === 'object' ? initialTask.parentTask?._id : initialTask.parentTask) : null;
            fetchNotes(initialTask._id, initialParentId);
        }
    }, [isOpen, initialTask?._id]);

    const fetchTaskDetails = async (taskId) => {
        setLoading(true);
        try {
            console.log("Fetching task details for:", taskId);
            const res = await TaskApi.getTaskById(taskId);
            console.log("Task details response:", res.data);
            const taskData = res.data?.data;
            setTask(taskData);
            if (taskData) {
                const parentId = taskData.parentTask ? (typeof taskData.parentTask === 'object' ? taskData.parentTask?._id : taskData.parentTask) : null;
                fetchNotes(taskData._id, parentId);
            }
        } catch (error) {
            console.error("Failed to fetch task details", error);
            console.error("Error response data:", error.response?.data);
            toast.error("Failed to fetch task details");
        } finally {
            setLoading(false);
        }
    };

    const handleNavigateToParent = (parentId) => {
        if (!parentId) return;
        setIsReaderOpen(false);
        setActiveReaderNoteId(null);
        fetchTaskDetails(parentId);
        fetchSubtasks(parentId);
    };

    const fetchSubtasks = async (parentId) => {
        try {
            const res = await TaskApi.getAllTasks({ filter: { parentTask: parentId } });
            setSubtasks(res.data?.data || []);
        } catch (error) {
            console.error("Failed to fetch subtasks", error);
        }
    };

    if (!isOpen) return null;

    const priorityColors = {
        high: "bg-red-500/10 text-red-600 border-red-200/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]",
        medium: "bg-amber-500/10 text-amber-600 border-amber-200/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]",
        low: "bg-emerald-500/10 text-emerald-600 border-emerald-200/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
    };

    const statusColors = {
        todo: "bg-slate-500/10 text-slate-600 border-slate-200/50",
        inprogress: "bg-vermilion-50 text-primary border-vermilion-200/50",
        review: "bg-purple-500/10 text-purple-600 border-purple-200/50",
        done: "bg-green-500/10 text-green-600 border-green-200/50",
        hold: "bg-orange-500/10 text-orange-600 border-orange-200/50",
        backlog: "bg-gray-500/10 text-gray-600 border-gray-200/50"
    };

    return (
        <div className={`fixed inset-0 z-[1000] flex justify-end transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

            {/* Drawer Content */}
            <div className={`relative w-full max-w-2xl bg-white shadow-2xl h-full flex flex-col transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white sticky top-0 z-[70] shadow-sm">
                    <div className="flex items-center gap-3 min-w-0 justify-between w-full">
                        <span className="text-sm font-mono font-bold text-textSub bg-slate-50 px-2 py-1 rounded border border-borderLight shadow-sm shrink-0">
                            {task?.taskId || `#${task?._id?.slice(-4)}`}
                        </span>
                        <h2 className="text-lg font-bold text-textMain truncate tracking-tight">{task?.taskName}</h2>
                        <div className="flex items-center justify-between gap-2 shrink-0">
                            {task?.parentTask && (
                                <button
                                    onClick={() => setShowCodingModal(true)}
                                    className="px-2.5 py-1.5 bg-slate-50 text-textSub rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold shadow-sm group cursor-pointer"
                                    title="Open Code Workspace"
                                >
                                    <span className="text-emerald-500 font-black text-sm tracking-tighter"><FaCode /></span>
                                    <span className="hidden sm:inline text-sm font-semibold">Code</span>
                                </button>
                            )}
                            {canEdit && (
                                <button
                                    onClick={() => onTaskUpdate(task)}
                                    className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all flex items-center gap-1 text-sm font-bold"
                                >
                                    <MdEdit size={20} />
                                    <span className="hidden sm:inline">Edit</span>
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="text-slate-500 hover:text-red-500 rounded-lg transition-all shadow-lg"
                                title="Close"
                            >
                                <IoClose size={24} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                        {/* Left Main Content */}
                        <div className="md:col-span-2 space-y-8">
                            {/* Description */}
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-[11px] font-black text-textSub uppercase tracking-[0.2em]">Description</h3>
                                    <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent ml-4" />
                                </div>
                                <div
                                    className="text-textMain text-sm leading-relaxed bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm quill-content w-full max-w-full break-words overflow-hidden"
                                    dangerouslySetInnerHTML={{
                                        __html: (() => {
                                            let html = task?.taskDescription || "<p class='italic text-slate-400'>No description provided.</p>";
                                            // Robust unescaping for double/triple escaped content
                                            for (let i = 0; i < 3; i++) {
                                                html = html.replace(/&lt;/g, '<')
                                                    .replace(/&gt;/g, '>')
                                                    .replace(/&amp;/g, '&')
                                                    .replace(/&quot;/g, '"')
                                                    .replace(/&#39;/g, "'");
                                                if (!html.includes('&')) break;
                                            }
                                            // Auto-link
                                            return html.replace(/(?<!href=")(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
                                        })()
                                    }}
                                />

                                {task?.youtubeUrl && getYoutubeId(task.youtubeUrl) && (
                                    <div className="mt-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-[11px] font-black text-textSub uppercase tracking-[0.2em]">YouTube Video</h3>
                                            <div className="h-px flex-1 bg-gradient-to-r from-red-500/30 to-transparent ml-4" />
                                        </div>
                                        <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm">
                                            <iframe
                                                src={`https://www.youtube.com/embed/${getYoutubeId(task.youtubeUrl)}`}
                                                title="YouTube video player"
                                                frameBorder="0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                allowFullScreen
                                                className="absolute inset-0 w-full h-full"
                                            ></iframe>
                                        </div>
                                    </div>
                                )}

                                {(() => {
                                    const imgFiles = (Array.isArray(task?.attachments) ? task.attachments : [task?.attachments || ""])
                                        .filter(f => f && f.trim() !== "" && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f));

                                    if (imgFiles.length === 0) return null;

                                    // Ensure index boundary
                                    const safeIndex = Math.min(activeImageIndex, imgFiles.length - 1);
                                    const activeFile = imgFiles[safeIndex] || imgFiles[0];
                                    const fileUrl = activeFile.startsWith('http') ? activeFile : `${server}file/get-file/${activeFile}`;
                                    const filename = activeFile.split('/').pop() || `Attachment ${safeIndex + 1}`;

                                    return (
                                        <div className="mt-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-[11px] font-black text-textSub uppercase tracking-[0.2em]">Attachment Images</h3>
                                                <div className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent ml-4" />
                                            </div>

                                            {/* Slider Viewport */}
                                            <div className="relative group rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm aspect-video bg-slate-50 flex items-center justify-center">
                                                <a href={fileUrl} target="_blank" rel="noreferrer" className="w-full h-full block">
                                                    <img src={fileUrl} className="w-full h-full object-cover" alt={filename} />
                                                </a>

                                                {/* Left & Right Nav Controls (only show if multiple images) */}
                                                {imgFiles.length > 1 && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => setActiveImageIndex(prev => (prev - 1 + imgFiles.length) % imgFiles.length)}
                                                            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-md active:scale-95 transition-all select-none cursor-pointer"
                                                        >
                                                            ◀
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setActiveImageIndex(prev => (prev + 1) % imgFiles.length)}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-md active:scale-95 transition-all select-none cursor-pointer"
                                                        >
                                                            ▶
                                                        </button>

                                                        {/* Count Indicator */}
                                                        <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-xs rounded-lg text-[9px] font-black text-white tracking-wider select-none">
                                                            {safeIndex + 1} / {imgFiles.length}
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            {/* Indicators tray */}
                                            {imgFiles.length > 1 && (
                                                <div className="flex items-center justify-center gap-1.5 mt-2.5">
                                                    {imgFiles.map((_, index) => (
                                                        <button
                                                            key={index}
                                                            type="button"
                                                            onClick={() => setActiveImageIndex(index)}
                                                            className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${safeIndex === index ? "bg-primary w-3" : "bg-slate-300 hover:bg-slate-400"
                                                                }`}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}

                                {(() => {
                                    const linkedNotes = notes.filter(n => {
                                        const isLinked = (n.taskId === task?._id) || (n.taskIds && n.taskIds.includes(task?._id));
                                        if (isLinked) return true;
                                        if (task?.parentTask) {
                                            const parentId = typeof task.parentTask === 'object' ? task.parentTask?._id : task.parentTask;
                                            if (n.taskId === parentId || (n.taskIds && n.taskIds.includes(parentId))) return true;
                                        }
                                        return false;
                                    });

                                    return (
                                        <div className="mt-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-[11px] font-black text-textSub uppercase tracking-[0.2em]">Linked Notes</h3>
                                                {isAdmin && (
                                                    <button
                                                        type="button"
                                                        onClick={handleCreateNote}
                                                        className="px-2 py-1 bg-yellow-450 hover:bg-yellow-500 text-slate-800 text-[10px] font-bold rounded-lg transition-all cursor-pointer select-none"
                                                    >
                                                        + Add Note
                                                    </button>
                                                )}
                                            </div>

                                            {linkedNotes.length === 0 ? (
                                                <div className="text-center py-6 bg-slate-50 dark:bg-slate-900/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 select-none">
                                                    <p className="text-xs text-slate-400 font-bold uppercase">No notes linked</p>
                                                    <p className="text-[10px] text-slate-400/85 mt-0.5">Create notes directly for this task.</p>
                                                </div>
                                            ) : (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setActiveReaderNoteId(linkedNotes[0]._id);
                                                            setIsReaderOpen(true);
                                                        }}
                                                        className="w-full py-2.5 px-4 bg-yellow-450 hover:bg-yellow-500 text-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-lg shadow-yellow-500/10 flex items-center justify-center gap-2 mb-3 cursor-pointer select-none"
                                                    >
                                                        📖 Open Notes Document Center
                                                    </button>

                                                    <div className="max-h-72 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                                                        {linkedNotes.map((note) => {
                                                            const snippet = getCleanSnippet(note.content, 100);
                                                            return (
                                                                <div
                                                                    key={note._id}
                                                                    onClick={() => {
                                                                        setActiveReaderNoteId(note._id);
                                                                        setIsReaderOpen(true);
                                                                    }}
                                                                    style={{ borderColor: `${note.color}40`, borderLeftColor: note.color }}
                                                                    className="p-3 bg-white dark:bg-slate-900/40 rounded-2xl border border-l-4 flex flex-col gap-1.5 shadow-2xs hover:shadow-xs transition-shadow duration-200 cursor-pointer select-none"
                                                                >
                                                                    <div className="flex items-center justify-between">
                                                                        <h5 className="font-extrabold text-[11px] text-slate-850 dark:text-slate-200 uppercase tracking-wider truncate flex-1">
                                                                            {note.title || "Untitled Note"}
                                                                        </h5>
                                                                        <span className="text-[8px] font-bold text-slate-400">
                                                                            {note.updatedAt ? moment(note.updatedAt).format("ll") : "Just now"}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                                                                        {snippet}
                                                                    </p>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    );
                                })()}
                            </section>

                            {/* Subtasks / Tabs Section */}
                            <section>
                                <div className="border-b border-borderLight mb-4 flex gap-6">
                                    <button
                                        onClick={() => setActiveTab('subtasks')}
                                        className={`pb-3 px-1 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'subtasks' ? 'text-primary' : 'text-textSub hover:text-textMain'}`}
                                    >
                                        Subtasks
                                        {activeTab === 'subtasks' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full shadow-[0_-2px_10px_rgba(59,130,246,0.3)]" />}
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('activity')}
                                        className={`pb-3 px-1 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'activity' ? 'text-primary' : 'text-textSub hover:text-textMain'}`}
                                    >
                                        Activity
                                        {activeTab === 'activity' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full shadow-[0_-2px_10px_rgba(59,130,246,0.3)]" />}
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('attachments')}
                                        className={`pb-3 px-1 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'attachments' ? 'text-primary' : 'text-textSub hover:text-textMain'}`}
                                    >
                                        Attachments
                                        {activeTab === 'attachments' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full shadow-[0_-2px_10px_rgba(59,130,246,0.3)]" />}
                                    </button>
                                </div>

                                <div className="min-h-[200px]">
                                    {activeTab === 'subtasks' && (
                                        <div className="space-y-4">
                                            {task?.subtaskStats?.total > 0 ? (
                                                <div className="mb-6 bg-primary/5 p-4 rounded-xl border border-primary/10">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-xs font-bold text-primary uppercase tracking-wider">Overall Subtask Progress</span>
                                                        <span className="text-xs font-bold text-textMain">{task.subtaskStats.completed}/{task.subtaskStats.total} Completed</span>
                                                    </div>
                                                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden shadow-inner">
                                                        <div
                                                            className="bg-primary h-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                                            style={{ width: `${(task.subtaskStats.completed / task.subtaskStats.total) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ) : null}

                                            {subtasks.length > 0 ? (
                                                <div className="grid grid-cols-1 gap-3">
                                                    {subtasks.map(sub => (
                                                        <div key={sub._id} className="group p-3 bg-white border border-borderLight rounded-xl hover:border-primary/30 hover:shadow-sm transition-all flex items-center justify-between">
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <div className={`w-2 h-2 rounded-full shrink-0 ${sub.status === 'done' ? 'bg-green-500' : 'bg-slate-400'}`} />
                                                                <div className="min-w-0">
                                                                    <p className={`text-sm font-bold truncate leading-none mb-1 ${sub.status === 'done' ? 'text-textSub/60 line-through' : 'text-textMain'}`}>{sub.taskName}</p>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-[10px] font-mono font-bold text-textSub bg-slate-100 px-1.5 py-0.5 rounded">{sub.taskId || 'N/A'}</span>
                                                                        <span className={`text-[10px] font-bold uppercase ${statusColors[sub.status]} px-1.5 py-0.5 rounded`}>{sub.status}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right shrink-0">
                                                                <p className="text-[10px] font-bold text-textSub uppercase">Assignee</p>
                                                                <p className="text-xs font-semibold text-textMain">{sub.assignee?.firstName || 'Unassigned'}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                                    <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                                                        <IoGitNetworkSharp className="text-slate-300" size={24} />
                                                    </div>
                                                    <p className="text-sm text-textSub font-bold tracking-tight">No subtasks found.</p>
                                                    <p className="text-xs text-textSub/60 mt-1">This task has no child tasks assigned to it.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'activity' && (
                                        <div className="space-y-4">
                                            {task?.activityLogs?.map((log, i) => (
                                                <div key={i} className="flex gap-4 group">
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-white ring-2 ring-slate-50 group-last:ring-0">
                                                            <IoCheckmarkCircleOutline className="text-primary" />
                                                        </div>
                                                        <div className="w-0.5 h-full bg-slate-100 group-last:hidden" />
                                                    </div>
                                                    <div className="pb-4 pt-1">
                                                        <p className="text-sm font-semibold text-textMain capitalize">{log.currentStatus}</p>
                                                        <p className="text-xs text-textSub mt-0.5">{log.message}</p>
                                                        <p className="text-[10px] text-textSub mt-1">{moment(log.date).fromNow()}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {activeTab === 'attachments' && (
                                        <div className="grid grid-cols-2 gap-4">
                                            {task?.attachments?.filter(f => f && f.trim() !== "").map((filename, i) => {
                                                const fileUrl = filename.startsWith('http') ? filename : `${server}file/get-file/${filename}`;
                                                const displayName = filename.split('/').pop().includes('-') ? filename.split('/').pop().split('-').slice(1).join('-') : filename.split('/').pop();
                                                return (
                                                    <div key={i} className="p-3 bg-white border border-borderLight rounded-lg shadow-sm hover:border-primary/30 transition-all flex items-center gap-3">
                                                        <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-slate-50 border border-slate-100 rounded">
                                                            {/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(filename) ? (
                                                                <img src={fileUrl} className="w-full h-full object-cover rounded shadow-sm" alt={displayName} />
                                                            ) : (
                                                                <IoAttachOutline size={20} className="text-primary" />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-xs font-bold text-textMain truncate" title={filename}>{filename.split('-').slice(1).join('-') || filename}</p>
                                                            <a
                                                                href={fileUrl}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="text-[10px] text-primary hover:underline font-extrabold uppercase tracking-tight flex items-center gap-1 mt-1"
                                                            >
                                                                Download / View
                                                            </a>
                                                        </div>
                                                    </div>
                                                );
                                            }) || (
                                                    <p className="text-sm text-textSub col-span-2 text-center py-10">No attachments found.</p>
                                                )}
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>

                        {/* Right Sidebar Metadata */}
                        <div className="space-y-6">
                            {/* Status */}
                            <div>
                                <label className="text-[10px] font-black text-textSub uppercase mb-3 block tracking-[0.1em]">Status</label>
                                <span className={`px-4 py-2 rounded-xl font-black text-[11px] uppercase tracking-widest border transition-all hover:scale-105 duration-300 inline-block ${statusColors[task?.status] || 'bg-slate-100'}`}>
                                    {task?.status}
                                </span>
                            </div>

                            {/* Priority */}
                            <div>
                                <label className="text-[10px] font-black text-textSub uppercase mb-3 block tracking-[0.1em]">Priority</label>
                                <span className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-black tracking-widest uppercase border transition-all hover:scale-105 duration-300 ${priorityColors[task?.taskPriority] || 'bg-slate-100'}`}>
                                    <IoFlagSharp className="text-sm" /> {task?.taskPriority}
                                </span>
                            </div>

                            {/* Dates */}
                            <div className="bg-slate-50/50 dark:bg-slate-900/30 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-5">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                                            <IoCalendarOutline size={16} className="text-primary" />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-textSub uppercase block tracking-widest">Start Date</label>
                                            <span className="text-xs font-bold text-textMain">{task?.taskStartDate ? moment(task.taskStartDate).format("MMM DD, YYYY") : "N/A"}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                                            <IoCalendarOutline size={16} className="text-orange-500" />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-textSub uppercase block tracking-widest">Due Date</label>
                                            <span className="text-xs font-bold text-textMain">{task?.taskDueDate ? moment(task.taskDueDate).format("MMM DD, YYYY") : "N/A"}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center gap-3">
                                    <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                                        <IoTimeOutline size={16} className="text-emerald-500" />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-textSub uppercase block tracking-widest">Estimation</label>
                                        <span className="text-xs font-bold text-textMain">{task?.estimatedHours ? `${Math.floor(task.estimatedHours)}h ${Math.round((task.estimatedHours % 1) * 60)}m` : "0h 0m"}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Assignee */}
                            <div>
                                <label className="text-[10px] font-black text-textSub uppercase mb-3 block tracking-[0.1em]">Assignee</label>
                                <div className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                    <div className="relative">
                                        {task?.assignee?.profileImage ? (
                                            <img src={task.assignee.profileImage} alt="User" className="w-12 h-12 rounded-2xl border-2 border-white dark:border-slate-700 shadow-md object-cover" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border-2 border-white dark:border-slate-700 shadow-md">
                                                <IoPersonOutline className="text-primary text-2xl" />
                                            </div>
                                        )}
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full shadow-sm" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-black text-textMain truncate tracking-tight">
                                            {task?.assignee?.firstName} {task?.assignee?.lastName}
                                        </p>
                                        <p className="text-[10px] font-bold text-textSub truncate opacity-70">
                                            {task?.assignee?.email}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Linked Notes Documentation Center Overlay Modal */}
            {isReaderOpen && (() => {
                const serverUrl = server.replace('/api/v1', '');
                const linkedNotes = notes.filter(n => {
                    const isLinked = (n.taskId === task?._id) || (n.taskIds && n.taskIds.includes(task?._id));
                    if (isLinked) return true;
                    if (task?.parentTask) {
                        const parentId = typeof task.parentTask === 'object' ? task.parentTask?._id : task.parentTask;
                        if (n.taskId === parentId || (n.taskIds && n.taskIds.includes(parentId))) return true;
                    }
                    return false;
                });

                return (
                    <div className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs transition-all duration-500 ${isReadingModeActive ? 'p-0' : 'p-2 sm:p-4 md:p-8'}`}>
                        <div className={`bg-white dark:bg-themeBG text-themeText shadow-2xl w-full h-full overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-300 transition-all ${isReadingModeActive ? 'rounded-none' : 'rounded-2xl sm:rounded-3xl'}`}>
                            {/* Header */}
                            <div className={`px-4 sm:px-6 md:px-8 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50 transition-all duration-500 ease-in-out origin-top ${isReadingModeActive ? 'max-h-0 py-0 opacity-0 overflow-hidden border-none' : 'max-h-[160px] sm:max-h-[100px] py-3.5 sm:py-5 opacity-100'}`}>
                                <div className="min-w-0 w-full sm:w-auto flex items-center justify-between sm:block">
                                    <div className="min-w-0">
                                        <h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-white truncate">
                                            Document Center: {task?.taskName}
                                        </h2>
                                        <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                                            {linkedNotes.length} Linked Note(s)
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setIsReaderOpen(false);
                                            setReaderSearchTerm("");
                                        }}
                                        className="sm:hidden group p-2 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-500 rounded-xl transition-all duration-200 border border-slate-200/50 cursor-pointer shrink-0"
                                    >
                                        <IoClose size={18} />
                                    </button>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
                                    <input
                                        type="text"
                                        placeholder="Search linked notes..."
                                        value={readerSearchTerm}
                                        onChange={(e) => setReaderSearchTerm(e.target.value)}
                                        className="px-3 sm:px-4 py-1.5 sm:py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary w-full sm:w-60 bg-white font-semibold text-slate-800"
                                    />
                                    <button
                                        onClick={() => {
                                            setIsReaderOpen(false);
                                            setReaderSearchTerm("");
                                        }}
                                        className="hidden sm:flex group p-2.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-500 rounded-xl transition-all duration-200 border border-slate-200/50 cursor-pointer shrink-0"
                                    >
                                        <IoClose size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Split Body */}
                            <div className="flex-1 flex overflow-hidden min-h-0 relative">
                                {/* Left Column: Notes List Sidebar */}
                                <div className={`border-r border-slate-100 dark:border-slate-800 flex flex-col bg-slate-50/20 shrink-0 transition-all duration-500 ease-in-out origin-left ${isReadingModeActive
                                    ? 'w-0 opacity-0 overflow-hidden border-none'
                                    : `${activeReaderNoteId ? 'hidden md:flex' : 'flex w-full'} md:w-72 lg:w-80 opacity-100`
                                    }`}>
                                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                                        {linkedNotes
                                            .filter(n => {
                                                if (!readerSearchTerm) return true;
                                                return (n.title || "").toLowerCase().includes(readerSearchTerm.toLowerCase()) ||
                                                    (n.content || "").toLowerCase().includes(readerSearchTerm.toLowerCase());
                                            })
                                            .map((note) => {
                                                const isActive = activeReaderNoteId === note._id;
                                                const snippet = getCleanSnippet(note.content, 60);
                                                return (
                                                    <div
                                                        key={note._id}
                                                        onClick={() => setActiveReaderNoteId(note._id)}
                                                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col gap-1 relative overflow-hidden select-none ${isActive
                                                            ? "bg-primary/5 border-primary shadow-sm"
                                                            : "bg-white dark:bg-slate-900 border-slate-150 dark:border-slate-800 hover:border-slate-350"
                                                            }`}
                                                    >
                                                        {/* Color dot */}
                                                        <div
                                                            style={{ backgroundColor: note.color }}
                                                            className="absolute top-0 bottom-0 left-0 w-1.5"
                                                        />
                                                        <h5 className={`font-black text-xs truncate pl-1.5 ${isActive ? "text-primary" : "text-slate-800 dark:text-white"}`}>
                                                            {note.title || "Untitled Note"}
                                                        </h5>
                                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 pl-1.5 line-clamp-2 leading-relaxed">
                                                            {snippet}
                                                        </p>
                                                    </div>
                                                );
                                            })
                                        }
                                        {linkedNotes.filter(n => {
                                            if (!readerSearchTerm) return true;
                                            return (n.title || "").toLowerCase().includes(readerSearchTerm.toLowerCase()) ||
                                                (n.content || "").toLowerCase().includes(readerSearchTerm.toLowerCase());
                                        }).length === 0 && (
                                                <div className="text-center py-10 text-slate-400 text-xs font-bold uppercase">
                                                    No matching notes
                                                </div>
                                            )}
                                    </div>
                                </div>

                                {/* Right Column: Reading Area */}
                                <div
                                    className={`flex-1 flex flex-col bg-white dark:bg-themeBG overflow-y-auto custom-scrollbar min-w-0 ${!activeReaderNoteId ? 'hidden md:flex' : 'flex w-full'
                                        }`}
                                    onScroll={handleReaderScroll}
                                >
                                    {(() => {
                                        const activeNote = linkedNotes.find(n => n._id === activeReaderNoteId);
                                        if (!activeNote) {
                                            return (
                                                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2 p-6 text-center">
                                                    <p className="text-xs font-bold uppercase tracking-wider">Select a note from the sidebar to read</p>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div className="w-full space-y-4 sm:space-y-6">
                                                {/* Mobile Navigation Bar back to Notes List */}
                                                {!isReadingModeActive && (
                                                    <div className="md:hidden px-4 pt-3 pb-2 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 z-[100000]">
                                                        <button
                                                            onClick={() => setActiveReaderNoteId(null)}
                                                            className="flex items-center gap-1.5 text-xs font-black text-primary bg-primary/10 px-3 py-1.5 rounded-xl active:scale-95 transition-all shadow-2xs cursor-pointer"
                                                        >
                                                            <span className="text-sm">←</span> All Notes ({linkedNotes.length})
                                                        </button>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[140px] pl-2">
                                                            {activeNote.title || "Untitled Note"}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Note Header */}
                                                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-slate-100 dark:border-slate-800 sticky top-0 bg-white z-[99999] transition-all duration-500 ease-in-out overflow-hidden ${isReadingModeActive ? 'max-h-0 p-0 opacity-0 border-none' : 'max-h-[320px] sm:max-h-[200px] px-4 sm:px-8 py-3.5 sm:py-5 border-b opacity-100'}`}>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span
                                                                style={{ backgroundColor: activeNote.color }}
                                                                className="w-3 h-3 rounded-full border border-black/10"
                                                            />
                                                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Linked Sticky Note</span>
                                                        </div>
                                                        {isEditingNote ? (
                                                            <input
                                                                type="text"
                                                                value={editedTitle}
                                                                onChange={(e) => setEditedTitle(e.target.value)}
                                                                className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl outline-none focus:ring-1 focus:ring-primary"
                                                            />
                                                        ) : (
                                                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight break-words">
                                                                {activeNote.title || "Untitled Note"}
                                                            </h1>
                                                        )}
                                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-2">
                                                            Last updated: {new Date(activeNote.updatedAt).toLocaleString("en-US", {
                                                                day: "numeric",
                                                                month: "long",
                                                                year: "numeric",
                                                                hour: "numeric",
                                                                minute: "2-digit",
                                                                hour12: true
                                                            })}
                                                        </p>
                                                    </div>

                                                    {/* Edit & Action Buttons */}
                                                    <div className="flex flex-wrap items-center gap-2 shrink-0 sm:ml-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 sm:border-none w-full sm:w-auto justify-end">
                                                        {isEditingNote ? (
                                                            <>
                                                                <button
                                                                    onClick={handleSaveNote}
                                                                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md select-none"
                                                                >
                                                                    Save
                                                                </button>
                                                                <button
                                                                    onClick={() => setIsEditingNote(false)}
                                                                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer select-none"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </>
                                                        ) : (
                                                            activeNote.taskId && task?._id && String(activeNote.taskId) !== String(task._id) ? (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[10px] font-black text-violet-500 bg-violet-500/10 border border-violet-200/50 px-2.5 py-1.5 rounded-xl uppercase tracking-wider select-none">
                                                                        📌 Parent Note (Read-Only)
                                                                    </span>
                                                                    {task?.parentTask && (
                                                                        <button
                                                                            onClick={() => {
                                                                                const parentId = typeof task.parentTask === 'object' ? task.parentTask?._id : task.parentTask;
                                                                                if (parentId) {
                                                                                    handleNavigateToParent(parentId);
                                                                                }
                                                                            }}
                                                                            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md select-none"
                                                                        >
                                                                            Navigate to Parent
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            ) : isAdmin ? (
                                                                <>
                                                                    <button
                                                                        onClick={() => {
                                                                            setEditedTitle(activeNote.title || "Untitled Note");
                                                                            const info = extractBilingual(activeNote.content, activeNote._id);
                                                                            if (info.isBilingual) {
                                                                                setIsBilingual(true);
                                                                                setBilingualTaskId(info.taskId);
                                                                                setEditedEnContent(info.en);
                                                                                setEditedHiContent(info.hi);
                                                                            } else {
                                                                                setIsBilingual(false);
                                                                                const isHtml = isHtmlNote(activeNote.content);
                                                                                const rawContent = isHtml ? decodeHtmlEntities(activeNote.content) : (activeNote.content || "");
                                                                                setEditedContent(rawContent);
                                                                                setEditorMode(isHtml ? "code" : "rich");
                                                                            }
                                                                            setIsEditingNote(true);
                                                                        }}
                                                                        className="px-4 py-2 bg-yellow-450 hover:bg-yellow-500 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md select-none"
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setShowDeleteConfirm(true)}
                                                                        className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-500 text-xs font-bold rounded-xl transition-all cursor-pointer border border-red-200/50 select-none"
                                                                    >
                                                                        Delete
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <span className="text-[10px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl uppercase tracking-wider select-none">
                                                                    📖 Read-Only
                                                                </span>
                                                            )
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Optional Attachment Image */}
                                                {activeNote.imageUrl && (
                                                    <div className="rounded-2xl border border-slate-100 overflow-hidden bg-slate-50/50 aspect-video max-h-96 flex items-center justify-center">
                                                        <img
                                                            src={activeNote.imageUrl.startsWith("http") ? activeNote.imageUrl : `${serverUrl}${activeNote.imageUrl}`}
                                                            alt="Note attachment"
                                                            className="w-full h-full object-contain"
                                                        />
                                                    </div>
                                                )}

                                                {/* Content */}
                                                {isEditingNote ? (
                                                    <div className="space-y-4 drawer-quill">
                                                        <style>{`
                                                              .drawer-quill .ql-toolbar.ql-snow {
                                                                border-color: #cbd5e1 !important;
                                                                background-color: #f8fafc;
                                                                border-top-left-radius: 12px;
                                                                border-top-right-radius: 12px;
                                                              }
                                                              .drawer-quill .ql-container.ql-snow {
                                                                border-color: #cbd5e1 !important;
                                                                background-color: #ffffff;
                                                                border-bottom-left-radius: 12px;
                                                                border-bottom-right-radius: 12px;
                                                                font-family: inherit !important;
                                                                font-size: 13px !important;
                                                              }
                                                              .drawer-quill .ql-editor {
                                                                min-height: 250px;
                                                                max-height: 600px;
                                                                overflow-y: auto;
                                                                color: #1e293b;
                                                              }
                                                              .dark .drawer-quill .ql-toolbar.ql-snow {
                                                                border-color: #334155 !important;
                                                                background-color: #1e293b;
                                                              }
                                                              .dark .drawer-quill .ql-toolbar.ql-snow .ql-stroke {
                                                                stroke: #cbd5e1 !important;
                                                              }
                                                              .dark .drawer-quill .ql-toolbar.ql-snow .ql-fill {
                                                                fill: #cbd5e1 !important;
                                                              }
                                                              .dark .drawer-quill .ql-toolbar.ql-snow .ql-picker {
                                                                color: #cbd5e1 !important;
                                                              }
                                                              .dark .drawer-quill .ql-container.ql-snow {
                                                                border-color: #334155 !important;
                                                                background-color: #0f172a;
                                                              }
                                                              .dark .drawer-quill .ql-editor {
                                                                color: #f1f5f9 !important;
                                                              }
                                                          `}</style>
                                                        {isBilingual ? (
                                                            <div className="space-y-4">
                                                                <div className="space-y-2">
                                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                                        🇬🇧 English Content
                                                                    </label>
                                                                    <textarea
                                                                        value={editedEnContent}
                                                                        onChange={(e) => setEditedEnContent(e.target.value)}
                                                                        placeholder="Paste or write HTML/CSS code directly here..."
                                                                        className="w-full min-h-[200px] max-h-[600px] font-mono text-[11px] p-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 leading-normal"
                                                                    />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <div className="flex justify-between items-center mb-1">
                                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                                            🇮🇳 Hindi Content (हिन्दी अनुवाद)
                                                                        </label>
                                                                        <button
                                                                            type="button"
                                                                            disabled={isTranslating}
                                                                            onClick={async () => {
                                                                                const translation = await handleTranslateToHindi(editedEnContent);
                                                                                if (translation) {
                                                                                    setEditedHiContent(translation);
                                                                                }
                                                                            }}
                                                                            className="text-[10px] font-black text-violet-500 hover:text-violet-600 uppercase tracking-wider flex items-center gap-1 cursor-pointer select-none bg-violet-50 dark:bg-violet-950/20 px-2.5 py-1 rounded-lg border border-violet-100 dark:border-violet-900 transition-all active:scale-95"
                                                                        >
                                                                            {isTranslating ? "⏳ Translating..." : "⚡ Translate from English"}
                                                                        </button>
                                                                    </div>
                                                                    <textarea
                                                                        value={editedHiContent}
                                                                        onChange={(e) => setEditedHiContent(e.target.value)}
                                                                        placeholder="Paste or write HTML/CSS code directly here..."
                                                                        className="w-full min-h-[200px] max-h-[600px] font-mono text-[11px] p-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 leading-normal"
                                                                    />
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between items-center mb-1 gap-2 flex-wrap">
                                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Note HTML / Text Content</label>
                                                                    <button
                                                                        type="button"
                                                                        disabled={isTranslating}
                                                                        onClick={async () => {
                                                                            const translation = await handleTranslateToHindi(editedContent);
                                                                            if (translation) {
                                                                                setEditedEnContent(editedContent);
                                                                                setEditedHiContent(translation);
                                                                                setIsBilingual(true);
                                                                                setBilingualTaskId(activeNote?.taskId || task?._id);
                                                                            }
                                                                        }}
                                                                        className="text-[10px] font-black text-violet-500 hover:text-violet-600 uppercase tracking-wider flex items-center gap-1 cursor-pointer select-none bg-violet-50 dark:bg-violet-950/20 px-2.5 py-1 rounded-lg border border-violet-100 dark:border-violet-900 transition-all active:scale-95"
                                                                    >
                                                                        {isTranslating ? "⏳ Translating..." : "🌐 Auto-Translate note to Hindi"}
                                                                    </button>
                                                                </div>
                                                                <textarea
                                                                    value={editedContent}
                                                                    onChange={(e) => setEditedContent(e.target.value)}
                                                                    placeholder="Paste or write HTML/CSS code directly here..."
                                                                    className="w-full min-h-[300px] max-h-[600px] font-mono text-[11px] p-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 leading-normal"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="ql-snow">
                                                        <style>{`
                                                              .ql-snow .ql-editor pre.ql-syntax {
                                                                background-color: #0f172a !important;
                                                                color: #f8fafc !important;
                                                                padding: 16px !important;
                                                                border-radius: 12px !important;
                                                                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
                                                                font-size: 12px !important;
                                                                line-height: 1.6 !important;
                                                                margin: 12px 0 !important;
                                                              }
                                                              .dark .ql-snow .ql-editor pre.ql-syntax {
                                                                background-color: #020617 !important;
                                                                border-color: #1e293b !important;
                                                              }
                                                              .ql-snow .ql-editor > .note-root > div > *:first-child {
                                                                margin-top: 0 !important;
                                                              }
                                                              .ql-snow .ql-editor {
                                                                white-space: normal !important;
                                                              }
                                                              .ql-snow .ql-editor * {
                                                                white-space: normal !important;
                                                              }
                                                              .ql-snow .ql-editor pre,
                                                              .ql-snow .ql-editor pre *,
                                                              .ql-snow .ql-editor code,
                                                              .ql-snow .ql-editor code *,
                                                              .ql-snow .ql-editor [class*="lang-"],
                                                              .ql-snow .ql-editor [class*="lang-"] * {
                                                                white-space: pre-wrap !important;
                                                              }
                                                              .ql-snow .ql-editor h1,
                                                              .ql-snow .ql-editor h2,
                                                              .ql-snow .ql-editor h3 {
                                                                margin-top: 16px !important;
                                                                margin-bottom: 8px !important;
                                                                font-weight: 800 !important;
                                                              }
                                                              .ql-snow .ql-editor p {
                                                                margin-top: 0 !important;
                                                                                margin-bottom: 8px !important;
                                                              }
                                                              .ql-snow .ql-editor ul,
                                                              .ql-snow .ql-editor ol {
                                                                margin-top: 0 !important;
                                                                margin-bottom: 8px !important;
                                                              }
                                                          `}</style>
                                                        {isHtmlNote(activeNote.content) ? (
                                                            <iframe
                                                                ref={iframeRef}
                                                                title={activeNote.title || "Note HTML Preview"}
                                                                srcDoc={decodeHtmlEntities(activeNote.content) + `
                                                                 <script>
                                                                    window.addEventListener('scroll', () => {
                                                                        window.parent.postMessage({ type: 'iframeScroll', scrollTop: window.scrollY || document.documentElement.scrollTop, scrollHeight: document.documentElement.scrollHeight, clientHeight: window.innerHeight || document.documentElement.clientHeight }, '*');
                                                                    });
                                                                    window.addEventListener('load', () => {
                                                                        window.parent.postMessage({ type: 'iframeScroll', scrollTop: window.scrollY || document.documentElement.scrollTop, scrollHeight: document.documentElement.scrollHeight, clientHeight: window.innerHeight || document.documentElement.clientHeight }, '*');
                                                                    });
                                                                    window.addEventListener('resize', () => {
                                                                        window.parent.postMessage({ type: 'iframeScroll', scrollTop: window.scrollY || document.documentElement.scrollTop, scrollHeight: document.documentElement.scrollHeight, clientHeight: window.innerHeight || document.documentElement.clientHeight }, '*');
                                                                    });
                                                                 </script>
                                                                 `}
                                                                className={`w-full bg-white transition-all duration-500 border-none ${isReadingModeActive ? 'min-h-[100vh] rounded-none' : 'min-h-[600px] rounded-b-2xl md:rounded-b-3xl'}`}
                                                                sandbox="allow-scripts allow-same-origin"
                                                            />
                                                        ) : (
                                                            <div
                                                                className="note-reader-container max-w-none text-sm text-slate-700 dark:text-slate-355 leading-relaxed font-medium ql-editor overflow-y-auto"
                                                                style={{ maxHeight: isReadingModeActive ? '100vh' : '600px' }}
                                                                onScroll={handleReaderScroll}
                                                                dangerouslySetInnerHTML={{ __html: activeNote.content }}
                                                            />
                                                        )}

                                                        {/* Floating Bottom Action Bar (End Read & Scroll Button) in Full Screen/Reading Mode */}
                                                        {isReadingModeActive && (
                                                            <div className="fixed bottom-8 sm:bottom-10 left-1/2 -translate-x-1/2 z-[999999] pointer-events-auto flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in zoom-in duration-300">
                                                                <button
                                                                    onClick={handleExitReadingMode}
                                                                    className="group flex items-center gap-2 px-5 py-3 rounded-full bg-slate-900/70 dark:bg-slate-900/80 hover:bg-slate-900 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-2xl text-white transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer text-xs font-black tracking-wider uppercase select-none"
                                                                    title="Exit Full Screen Reading Mode"
                                                                >
                                                                    <IoClose className="text-base text-red-400 group-hover:rotate-90 transition-transform duration-300" />
                                                                    <span>End Read</span>
                                                                </button>

                                                                {iframeScrollInfo.canScroll && (
                                                                    <button
                                                                        onClick={handleFloatingScroll}
                                                                        className="group flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/30 dark:bg-slate-900/60 hover:bg-white/50 dark:hover:bg-slate-900/80 backdrop-blur-md border border-white/30 dark:border-white/10 shadow-2xl text-slate-800 dark:text-white transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer select-none"
                                                                        title={iframeScrollInfo.isAtBottom ? "Scroll to Top" : "Scroll to Bottom"}
                                                                    >
                                                                        {iframeScrollInfo.isAtBottom ? (
                                                                            <IoArrowUp className="text-lg sm:text-xl opacity-90 group-hover:opacity-100 transition-opacity" />
                                                                        ) : (
                                                                            <IoArrowDown className="text-lg sm:text-xl opacity-90 group-hover:opacity-100 transition-opacity" />
                                                                        )}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Custom Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-6 overflow-hidden flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
                        <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/20 flex items-center justify-center mb-4">
                            <IoTrashOutline className="text-red-500 text-xl" />
                        </div>

                        <h3 className="text-base font-black text-slate-850 dark:text-white uppercase tracking-wider mb-2">Delete Note</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 max-w-xs leading-relaxed font-semibold">
                            Are you sure you want to delete this note? This action cannot be undone.
                        </p>

                        <div className="flex gap-3 w-full">
                            <button
                                onClick={() => {
                                    handleDeleteNote(activeReaderNoteId);
                                    setShowDeleteConfirm(false);
                                }}
                                className="flex-1 py-2.5 bg-red-500 hover:bg-red-650 text-white text-xs font-black rounded-xl uppercase tracking-wider transition-all cursor-pointer shadow-md select-none animate-in duration-200"
                            >
                                Confirm Delete
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl uppercase tracking-wider transition-all cursor-pointer select-none"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* LeetCode Coding Simulation Modal */}
            <DsaCodingArenaModal
                isOpen={showCodingModal}
                onClose={() => setShowCodingModal(false)}
                task={task}
            />
        </div>
    );
};

export default TaskDetailDrawer;
