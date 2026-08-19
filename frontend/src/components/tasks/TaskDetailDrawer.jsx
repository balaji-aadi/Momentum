
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { TaskApi } from '../../services/api/Task.api';
import { NoteApi } from '../../services/api/Note.api';
import { SprintApi } from '../../services/api/Sprint.api';
import { ProjectApi } from '../../services/api/Project.api';
import { CommonApi } from '../../services/api/Common.api';
import { server } from '../../services/config';
import DsaCodingArenaModal from '../dsa/DsaCodingArenaModal';
import { LuCode2 } from 'react-icons/lu';
import ReactQuill from 'react-quill';
import { IoRepeatOutline, IoTrophyOutline, IoTrashOutline } from 'react-icons/io5';

import moment from 'moment';
import {
    IoClose,
    IoCheckmarkCircleOutline,
    IoCalendarOutline,
    IoFlagOutline,
    IoPersonOutline,
    IoDocumentTextOutline,
    IoChatbubbleEllipsesOutline,
    IoListOutline,
    IoTimeOutline
} from 'react-icons/io5';

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

const TaskDetailDrawer = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();

    // Get taskId from query params
    const taskId = searchParams.get('taskId');
    const { currentUser } = useSelector(state => state.store);
    const [showCodingModal, setShowCodingModal] = useState(false);

    // Role Permissions
    const isAdmin = currentUser?.userRole?.name?.toLowerCase() === 'admin' ||
                    currentUser?.role === 'admin' ||
                    currentUser?.email === 'balajiaadi2000@gmail.com' ||
                    (currentUser?.userRoles && currentUser.userRoles.some(r => r.name?.toLowerCase() === 'admin'));
    const isManager = currentUser?.userRole?.name === 'projectmanager';
    const isHR = currentUser?.userRole?.name === 'hr';
    const canEditDates = isAdmin || isManager || isHR;

    const [task, setTask] = useState(null);
    const [subtasks, setSubtasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newSubtaskName, setNewSubtaskName] = useState('');
    const [showAddSubtask, setShowAddSubtask] = useState(false);
    const [creatingSubtask, setCreatingSubtask] = useState(false);
    const [sprints, setSprints] = useState([]);
    const [milestones, setMilestones] = useState([]);
    const [notes, setNotes] = useState([]);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isReaderOpen, setIsReaderOpen] = useState(false);
    const [activeReaderNoteId, setActiveReaderNoteId] = useState(null);
    const [readerSearchTerm, setReaderSearchTerm] = useState("");

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

    const [isEditingNote, setIsEditingNote] = useState(false);
    const [editedTitle, setEditedTitle] = useState("");
    const [editedContent, setEditedContent] = useState("");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isBilingual, setIsBilingual] = useState(false);
    const [bilingualTaskId, setBilingualTaskId] = useState("");
    const [editedEnContent, setEditedEnContent] = useState("");
    const [editedHiContent, setEditedHiContent] = useState("");
    const [isTranslating, setIsTranslating] = useState(false);
    const [editorMode, setEditorMode] = useState("rich"); // "rich" or "code"
    const activeNote = notes.find(n => n._id === activeReaderNoteId);

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

    const fetchNotes = async (currTaskId = task?._id || taskId, parentId = null) => {
        const targetTaskId = currTaskId || taskId;
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
        if (!taskId) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await TaskApi.task(taskId);
                const taskData = res.data?.data?.[0] || res.data?.data;
                setTask(taskData);

                const parentId = taskData?.parentTask ? (typeof taskData.parentTask === 'object' ? taskData.parentTask?._id : taskData.parentTask) : null;
                const noteIdsToQuery = [taskData?._id || taskId];
                if (parentId) {
                    noteIdsToQuery.push(parentId);
                }

                if (taskData?.projectName) {
                    const [sRes, mRes, nRes] = await Promise.all([
                        SprintApi.getSprintsByProject(taskData.projectName),
                        ProjectApi.getAllmileStones(taskData.projectName),
                        NoteApi.getNotes({ taskIds: noteIdsToQuery.join(',') })
                    ]);
                    setSprints(sRes.data?.data || []);
                    setMilestones(mRes.data?.data?.milestones || []);
                    setNotes(nRes.data?.data || []);
                } else {
                    const nRes = await NoteApi.getNotes({ taskIds: noteIdsToQuery.join(',') });
                    setNotes(nRes.data?.data || []);
                }

                const subRes = await TaskApi.getAllTasks({ filter: { parentTask: taskId } });
                setSubtasks(subRes.data?.data || []);
            } catch (error) {
                console.error("Failed to fetch task details", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [taskId]);

    const handleUpdateTask = async (updates) => {
        try {
            // Optimistic update
            setTask(prev => ({ ...prev, ...updates }));
            await TaskApi.updateTask(taskId, updates);
        } catch (error) {
            console.error("Failed to update task", error);
            // Revert logic could be added here
        }
    };



    const handleAddSubtask = async () => {
        if (!newSubtaskName.trim() || !task) return;
        setCreatingSubtask(true);
        try {
            const payload = {
                taskName: newSubtaskName,
                projectName: task.projectName,
                parentTask: task._id,
                taskPriority: 'medium', // Default
                taskType: 'subtask',
                status: 'todo',
                sprint: task.sprint, // Inherit Sprint
                milestone: task.milestone // Inherit Milestone
            };
            const res = await TaskApi.createTask(payload);
            const newSub = res.data?.data;
            if (newSub) {
                setSubtasks([...subtasks, newSub]);
                setNewSubtaskName('');
                setShowAddSubtask(false); // Optional: keep open for multiple adds
            }
        } catch (error) {
            console.error("Failed to create subtask", error);
        } finally {
            setCreatingSubtask(false);
        }
    };

    const toggleSubtaskStatus = async (subtask) => {
        const newStatus = subtask.status === 'done' ? 'todo' : 'done';
        // Optimistic Update
        const updatedSubtasks = subtasks.map(s =>
            s._id === subtask._id ? { ...s, status: newStatus } : s
        );
        setSubtasks(updatedSubtasks);

        try {
            await TaskApi.updateTask(subtask._id, { status: newStatus });
        } catch (error) {
            console.error("Failed to update subtask status", error);
            // Revert on error
            setSubtasks(subtasks);
        }
    };

    const calculateSubtaskProgress = () => {
        if (subtasks.length === 0) return 0;
        const completed = subtasks.filter(s => s.status === 'done').length;
        return Math.round((completed / subtasks.length) * 100);
    };

    const closeDrawer = () => {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('taskId');
        setSearchParams(newParams);
    };

    if (!taskId) return null;

    return (
        <div className="fixed inset-y-0 right-0 w-[450px] bg-white shadow-2xl z-[1000] transform transition-transform duration-300 ease-in-out border-l border-borderLight flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pt-[3rem] pb-4 px-2 border-b border-slate-100 bg-white sticky top-0 z-[70] shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${task?.status === 'done' ? 'bg-green-500/10 text-green-600 border-green-200' :
                            task?.status === 'inprogress' ? 'bg-blue-500/10 text-blue-600 border-blue-200' :
                                'bg-slate-50 text-slate-500 border-slate-200'
                        }`}>
                        {task?.status || 'Loading...'}
                    </span>
                    <span className="text-xs text-textSub font-mono font-bold bg-slate-50 px-2 py-0.5 rounded border border-borderLight">{task?.taskId}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {task?.parentTask && (
                        <button
                            onClick={() => setShowCodingModal(true)}
                            className="px-2.5 py-1.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-600 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold shadow-sm group cursor-pointer"
                            title="Open Code Workspace"
                        >
                            <span className="text-emerald-500 font-black text-sm tracking-tighter">&lt;/&gt;</span>
                            <span className="hidden sm:inline font-bold">Code</span>
                        </button>
                    )}
                    <button
                        onClick={closeDrawer}
                        className="p-2.5 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-500 rounded-xl transition-all shadow-sm flex items-center justify-center border border-slate-200 hover:border-red-200 group"
                        title="Close Drawer"
                    >
                        <IoClose size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center text-textSub p-10">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                        <p className="text-sm font-bold animate-pulse">Loading task details...</p>
                    </div>
                </div>
            ) : task ? (
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                    {/* Title */}
                    <div>
                        <h2 className="text-2xl font-black text-textMain tracking-tight mb-1">{task.taskName}</h2>
                        <div className="h-1 w-20 bg-primary/20 rounded-full"></div>
                    </div>

                    {/* Meta Data Grid */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-textSub uppercase tracking-widest flex items-center gap-1">
                                <IoPersonOutline /> Assignee
                            </label>
                            <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                                <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center text-sm font-black shadow-lg shadow-primary/20">
                                    {task.assignee?.firstName?.[0] || 'U'}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-textMain truncate leading-none">{task.assignee?.firstName || 'Unassigned'}</p>
                                    <p className="text-[10px] text-textSub mt-1">Primary Owner</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-textSub uppercase tracking-widest flex items-center gap-1">
                                <IoFlagOutline /> Priority
                            </label>
                            <div className={`flex items-center gap-2 p-3 bg-slate-50/50 rounded-2xl border ${task.taskPriority === 'high' ? 'border-red-100 text-red-600' :
                                    task.taskPriority === 'medium' ? 'border-amber-100 text-amber-600' :
                                        'border-blue-100 text-blue-600'
                                }`}>
                                <span className={`w-2 h-2 rounded-full ${task.taskPriority === 'high' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                                        task.taskPriority === 'medium' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' :
                                            'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                                    }`}></span>
                                <span className="text-sm font-black truncate capitalize">{task.taskPriority}</span>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-textSub uppercase tracking-widest flex items-center gap-1">
                                <IoCalendarOutline /> Start Date
                            </label>
                            {canEditDates ? (
                                <input
                                    type="date"
                                    defaultValue={task.taskStartDate ? moment(task.taskStartDate).format('YYYY-MM-DD') : ''}
                                    onChange={(e) => handleUpdateTask({ taskStartDate: e.target.value })}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-textMain focus:ring-1 focus:ring-primary outline-none cursor-pointer"
                                />
                            ) : (
                                <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                                    <span className="text-sm font-bold text-textMain">
                                        {task.taskStartDate ? moment(task.taskStartDate).format('MMM DD, YYYY') : 'Not Started'}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-textSub uppercase tracking-widest flex items-center gap-1">
                                <IoCalendarOutline /> Due Date
                            </label>
                            {canEditDates ? (
                                <input
                                    type="date"
                                    defaultValue={task.taskDueDate ? moment(task.taskDueDate).format('YYYY-MM-DD') : ''}
                                    onChange={(e) => handleUpdateTask({ taskDueDate: e.target.value })}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-textMain focus:ring-1 focus:ring-primary outline-none cursor-pointer"
                                />
                            ) : (
                                <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                                    <span className="text-sm font-bold text-textMain">
                                        {task.taskDueDate ? moment(task.taskDueDate).format('MMM DD, YYYY') : 'No Date Set'}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-textSub uppercase tracking-widest flex items-center gap-1">
                                <IoTimeOutline /> Estimation
                            </label>
                            <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                                <span className="text-sm font-bold text-textMain">{task.estimatedHours || 0} Hours</span>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-textSub uppercase tracking-widest flex items-center gap-1">
                                <IoDocumentTextOutline /> Description
                            </label>
                            <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent ml-4" />
                        </div>
                        <div
                            className="w-full min-h-[120px] p-5 text-sm text-textMain bg-white border border-slate-100 rounded-3xl shadow-sm leading-relaxed quill-content break-words overflow-hidden"
                            dangerouslySetInnerHTML={{
                                __html: (() => {
                                    let html = task?.taskDescription || "<p class='italic text-slate-400'>No description provided.</p>";
                                    // Robust unescaping
                                    for (let i = 0; i < 3; i++) {
                                        html = html.replace(/&lt;/g, '<')
                                            .replace(/&gt;/g, '>')
                                            .replace(/&amp;/g, '&')
                                            .replace(/&quot;/g, '"')
                                            .replace(/&#39;/g, "'");
                                        if (!html.includes('&')) break;
                                    }
                                    // Auto-link URLs
                                    return html.replace(/(?<!href=")(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>');
                                })()
                            }}
                        />
                    </div>

                    {task?.youtubeUrl && getYoutubeId(task.youtubeUrl) && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black text-textSub uppercase tracking-widest flex items-center gap-1">
                                    YouTube Video
                                </label>
                                <div className="h-px flex-1 bg-gradient-to-r from-red-500/30 to-transparent ml-4" />
                            </div>
                            <div className="relative w-full aspect-video rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
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
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black text-textSub uppercase tracking-widest flex items-center gap-1">
                                        Attachment Images
                                    </label>
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
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black text-textSub uppercase tracking-widest flex items-center gap-1">
                                        Linked Notes
                                    </label>
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
                                                        style={{ borderColor: `${note.color}40`, itBorderLeftColor: note.color }}
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

                    {/* Subtasks Section */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-textMain flex items-center gap-2">
                                <IoListOutline /> Subtasks
                            </label>
                            <button
                                onClick={() => setShowAddSubtask(!showAddSubtask)}
                                className="text-xs text-primary hover:underline font-medium"
                            >
                                + Add Subtask
                            </button>
                        </div>

                        {/* Progress Bar */}
                        {subtasks.length > 0 && (
                            <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2">
                                <div
                                    className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
                                    style={{ width: `${calculateSubtaskProgress()}%` }}
                                ></div>
                            </div>
                        )}

                        <div className="space-y-2">
                            {/* Add Subtask Input */}
                            {showAddSubtask && (
                                <div className="flex items-center gap-2 p-2 bg-slate-50 border border-borderLight rounded-lg">
                                    <input
                                        type="text"
                                        value={newSubtaskName}
                                        onChange={(e) => setNewSubtaskName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                                        placeholder="What needs to be done?"
                                        className="flex-1 bg-transparent border-none text-sm focus:ring-0 p-0"
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleAddSubtask}
                                        disabled={creatingSubtask || !newSubtaskName.trim()}
                                        className="text-primary text-xs font-bold disabled:opacity-50"
                                    >
                                        Add
                                    </button>
                                </div>
                            )}

                            {/* Subtask List */}
                            {subtasks.length > 0 ? (
                                subtasks.map(subtask => (
                                    <div key={subtask._id} className="group flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg border border-transparent hover:border-borderLight transition-colors">
                                        <button
                                            onClick={() => toggleSubtaskStatus(subtask)}
                                            className={`text-slate-400 hover:text-green-600 transition-colors ${subtask.status === 'done' ? 'text-green-500' : ''}`}
                                        >
                                            <IoCheckmarkCircleOutline size={20} />
                                        </button>
                                        <span className={`flex-1 text-sm ${subtask.status === 'done' ? 'text-textSub line-through' : 'text-textMain'}`}>
                                            {subtask.taskName}
                                        </span>
                                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-2">
                                            {/* Assignee Avatar (Small) */}
                                            {subtask.assignee && (
                                                <div
                                                    className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold"
                                                    title={subtask.assignee.firstName}
                                                >
                                                    {subtask.assignee.firstName[0]}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                !showAddSubtask && (
                                    <div className="p-4 border border-dashed border-borderLight rounded-lg text-center cursor-pointer hover:bg-slate-50" onClick={() => setShowAddSubtask(true)}>
                                        <p className="text-xs text-textSub">No subtasks yet. Click to add one.</p>
                                    </div>
                                )
                            )}
                        </div>
                    </div>

                    {/* Attachments Section */}
                    <div className="h-px bg-borderLight w-full my-4"></div>
                    <div className="space-y-4">
                        <label className="text-sm font-semibold text-textMain flex items-center gap-2">
                            <IoDocumentTextOutline /> Attachments
                        </label>

                        {task.attachments && (typeof task.attachments === 'string' || (Array.isArray(task.attachments) && task.attachments.length > 0)) ? (
                            <div className="space-y-2">
                                {(Array.isArray(task.attachments) ? task.attachments : [task.attachments]).map((attachment, i) => (
                                    <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 border border-borderLight rounded-lg group">
                                        <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-white rounded border border-borderLight text-primary">
                                            {/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(attachment) ? (
                                                <img src={attachment} className="w-full h-full object-cover rounded shadow-sm" alt="attachment" />
                                            ) : (
                                                <IoDocumentTextOutline size={16} />
                                            )}
                                        </div>
                                        <a
                                            href={attachment}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 text-sm text-blue-600 hover:underline truncate"
                                            title={attachment}
                                        >
                                            {attachment.split('/').pop() || `Attachment ${i + 1}`}
                                        </a>
                                        <button
                                            onClick={() => {
                                                if (Array.isArray(task.attachments)) {
                                                    const newAttachments = task.attachments.filter((_, idx) => idx !== i);
                                                    handleUpdateTask({ attachments: newAttachments });
                                                } else {
                                                    handleUpdateTask({ attachments: "" });
                                                }
                                            }}
                                            className="p-1 hover:bg-slate-200 rounded text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Remove attachment"
                                        >
                                            <IoClose />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="relative border border-dashed border-borderLight rounded-lg p-4 hover:bg-slate-50 transition-colors text-center cursor-pointer">
                                <input
                                    type="file"
                                    onChange={async (e) => {
                                        const file = e.target.files[0];
                                        if (!file) return;

                                        const formData = new FormData();
                                        formData.append("file", file);

                                        // Simple toast or loading state here would be good
                                        try {
                                            const res = await CommonApi.uploadFile(formData);
                                            const fileUrl = res.data?.data?.url || res.data?.url || res.data?.data;
                                            if (fileUrl) {
                                                handleUpdateTask({ attachments: fileUrl });
                                            }
                                        } catch (err) {
                                            console.error("Upload failed", err);
                                        }
                                    }}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                />
                                <div className="flex flex-col items-center gap-1 text-textSub">
                                    <span className="text-xs font-medium">Click to upload attachment</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="h-px bg-borderLight w-full my-4"></div>

                    {/* Comments Placeholder */}
                    <div className="space-y-4">
                        <label className="text-sm font-semibold text-textMain flex items-center gap-2">
                            <IoChatbubbleEllipsesOutline /> Comments
                        </label>
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0"></div>
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Write a comment..."
                                    className="w-full px-4 py-2 text-sm border border-borderLight rounded-full focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                />
                            </div>
                        </div>
                    </div>

                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center text-textSub">
                    Task not found.
                </div>
            )}
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
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-3xl shadow-2xl w-full max-w-6xl h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                            {/* Header */}
                            <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50">
                                <div className="min-w-0">
                                    <h2 className="text-lg font-black text-slate-800 dark:text-white truncate">
                                        Document Center: {task?.taskName}
                                    </h2>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                                        {linkedNotes.length} Linked Note(s)
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {/* Search input */}
                                    <input
                                        type="text"
                                        placeholder="Search linked notes..."
                                        value={readerSearchTerm}
                                        onChange={(e) => setReaderSearchTerm(e.target.value)}
                                        className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary w-60 bg-white font-semibold text-slate-800"
                                    />
                                    <button
                                        onClick={() => {
                                            setIsReaderOpen(false);
                                            setReaderSearchTerm("");
                                        }}
                                        className="group p-2.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-500 rounded-xl transition-all duration-200 border border-slate-200/50 cursor-pointer"
                                    >
                                        <IoClose size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Split Body */}
                            <div className="flex-1 flex overflow-hidden min-h-0">
                                {/* Left Column: Notes List Sidebar */}
                                <div className="w-80 border-r border-slate-100 dark:border-slate-800 flex flex-col bg-slate-50/20 shrink-0">
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
                                                                : "bg-white dark:bg-slate-900 border-slate-150 dark:border-slate-800 hover:border-slate-355"
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
                                <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 overflow-y-auto custom-scrollbar p-10 min-w-0">
                                    {(() => {
                                        const activeNote = linkedNotes.find(n => n._id === activeReaderNoteId);
                                        if (!activeNote) {
                                            return (
                                                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
                                                    <p className="text-xs font-bold uppercase tracking-wider">Select a note from the sidebar to read</p>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div className="max-w-3xl w-full mx-auto space-y-6">
                                                {/* Note Header */}
                                                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-5">
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
                                                                className="text-2xl font-black text-slate-900 dark:text-white leading-tight w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl outline-none focus:ring-1 focus:ring-primary"
                                                            />
                                                        ) : (
                                                            <h1 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">
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
                                                    <div className="flex items-center gap-2 shrink-0 ml-4">
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
                                                                                    setIsReaderOpen(false);
                                                                                    setActiveReaderNoteId(null);
                                                                                    setSearchParams({ taskId: parentId });
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
                                                    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden bg-slate-50/50 aspect-video max-h-96 flex items-center justify-center">
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
                                                                    <ReactQuill
                                                                        value={editedEnContent}
                                                                        onChange={setEditedEnContent}
                                                                        placeholder="Type English notes here..."
                                                                        modules={{
                                                                            toolbar: [
                                                                                [{ 'header': [1, 2, 3, false] }],
                                                                                ['bold', 'italic', 'underline', 'strike'],
                                                                                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                                                                ['link', 'clean']
                                                                            ]
                                                                        }}
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
                                                                    <ReactQuill
                                                                        value={editedHiContent}
                                                                        onChange={setEditedHiContent}
                                                                        placeholder="Type Hindi notes here..."
                                                                        modules={{
                                                                            toolbar: [
                                                                                [{ 'header': [1, 2, 3, false] }],
                                                                                ['bold', 'italic', 'underline', 'strike'],
                                                                                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                                                                ['link', 'clean']
                                                                            ]
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between items-center mb-1 gap-2 flex-wrap">
                                                                    <div className="flex items-center gap-2">
                                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Note HTML / Text Content</label>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                if (editorMode === "rich") {
                                                                                    setEditedContent(decodeHtmlEntities(editedContent));
                                                                                    setEditorMode("code");
                                                                                } else {
                                                                                    setEditorMode("rich");
                                                                                }
                                                                            }}
                                                                            className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border transition-all ${
                                                                                editorMode === "code"
                                                                                    ? "bg-blue-500 text-white border-blue-500 hover:bg-blue-600"
                                                                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200"
                                                                            }`}
                                                                        >
                                                                            {editorMode === "code" ? "📝 Use Rich Text" : "💻 Use HTML/CSS Code"}
                                                                        </button>
                                                                    </div>
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
                                                                {editorMode === "code" ? (
                                                                    <textarea
                                                                        value={editedContent}
                                                                        onChange={(e) => setEditedContent(e.target.value)}
                                                                        placeholder="Paste or write HTML/CSS code directly here..."
                                                                        className="w-full min-h-[300px] max-h-[600px] font-mono text-[11px] p-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 leading-normal"
                                                                    />
                                                                ) : (
                                                                    <ReactQuill
                                                                        value={editedContent}
                                                                        onChange={setEditedContent}
                                                                        placeholder="Type notes here..."
                                                                        modules={{
                                                                            toolbar: [
                                                                                [{ 'header': [1, 2, 3, false] }],
                                                                                ['bold', 'italic', 'underline', 'strike'],
                                                                                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                                                                ['link', 'clean']
                                                                            ]
                                                                        }}
                                                                    />
                                                                )}
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
                                                                color: inherit !important;
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
                                                                title={activeNote.title || "Note HTML Preview"}
                                                                srcDoc={decodeHtmlEntities(activeNote.content)}
                                                                className="w-full min-h-[600px] border border-slate-200 dark:border-slate-800 rounded-2xl bg-white"
                                                                sandbox="allow-scripts allow-same-origin"
                                                            />
                                                        ) : (
                                                            <div
                                                                className="max-w-none text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium ql-editor"
                                                                dangerouslySetInnerHTML={{ __html: activeNote.content }}
                                                            />
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
