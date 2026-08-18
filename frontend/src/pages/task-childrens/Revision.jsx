import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setDailyRevision } from '../../store/slices/storeSlice';
import { TaskApi } from '../../services/api/Task.api';
import { ProjectApi } from '../../services/api/Project.api';
import { FocusApi } from '../../services/api/Focus.api';
import { NoteApi } from '../../services/api/Note.api';
import { useLoading } from '../../components/loader/LoaderContext';
import moment from 'moment';
import {
    IoSearchOutline,
    IoFilterOutline,
    IoSyncOutline,
    IoCalendarOutline,
    IoCheckmarkCircleOutline,
    IoListOutline,
    IoChevronForward,
    IoChevronDown,
    IoCloseOutline,
    IoChevronUpOutline,
    IoEyeOutline,
    IoEyeOffOutline,
    IoTimerOutline,
    IoPlay,
    IoPause,
    IoSparklesOutline,
    IoOpenOutline,
    IoRefreshOutline,
    IoLogoYoutube,
    IoDocumentTextOutline
} from 'react-icons/io5';
import toast from 'react-hot-toast';
import InputField from '../../components/InputField';
import { IoEllipsisHorizontalOutline } from 'react-icons/io5';
import { FaYoutube } from 'react-icons/fa';
import DsaCodingArenaModal from '../../components/dsa/DsaCodingArenaModal';
import TaskDetailDrawer from './TaskDetailDrawer';
import CreateTask from './CreateTask';

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

const NoteCell = ({ text, onReadMore }) => {
    const [isLong, setIsLong] = useState(false);
    const textRef = useRef(null);

    useEffect(() => {
        const checkOverflow = () => {
            if (textRef.current) {
                setIsLong(textRef.current.scrollHeight > textRef.current.clientHeight + 2);
            }
        };

        checkOverflow();
        window.addEventListener('resize', checkOverflow);
        return () => window.removeEventListener('resize', checkOverflow);
    }, [text]);

    if (!hasAdditionalNotes(text)) return <span className="text-[9px] font-black text-slate-200 uppercase tracking-[0.15em] italic">No Notes</span>;

    return (
        <div className="min-w-[200px] max-w-[320px] py-1">
            <div
                ref={textRef}
                className="text-[11px] font-semibold text-slate-500 leading-[1.6] transition-all duration-300 rich-text-preview break-words whitespace-pre-wrap line-clamp-2"
                dangerouslySetInnerHTML={{ __html: text }}
            />
            {isLong && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onReadMore();
                    }}
                    className="flex items-center gap-1 text-[9px] font-black text-primary uppercase tracking-widest mt-1.5 hover:text-primary-dark transition-colors group/read"
                >
                    READ MORE <IoChevronDown className="group-hover/read:translate-y-0.5 transition-transform" />
                </button>
            )}
        </div>
    );
};

const getRemainingSeconds = (rev) => {
    if (!rev) return 10800;
    if (rev.isCompleted) return 0;
    if (!rev.isStarted) return 10800;
    if (!rev.timerIsActive || !rev.timerLastUpdated) return rev.timeLeft;
    const elapsed = Math.floor((Date.now() - new Date(rev.timerLastUpdated).getTime()) / 1000);
    return Math.max(0, rev.timeLeft - elapsed);
};

const Revision = () => {
    const dispatch = useDispatch();
    const { activeBranch, currentUser } = useSelector((state) => state.store);
    const [dailyRevisionState, setDailyRevisionState] = useState(null);
    const [timerTimeLeft, setTimerTimeLeft] = useState(10800);
    const [timerIsActive, setTimerIsActive] = useState(false);
    
    // Testing states
    const [showCompletionModal, setShowCompletionModal] = useState(false);

    const isManager = currentUser?.userRole?.name === "projectmanager";
    const isAdmin = currentUser?.userRole?.name === "admin";
    const canEdit = isManager || isAdmin;

    const { handleLoading } = useLoading();
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [selectedTaskForDrawer, setSelectedTaskForDrawer] = useState(null);
    const [codingModalTask, setCodingModalTask] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editTaskId, setEditTaskId] = useState(null);
    const [editTaskData, setEditTaskData] = useState(null);

    const handleOpenDrawer = (task) => {
        setSelectedTaskForDrawer(task);
        setIsDrawerOpen(true);
    };

    const handleEditFromDrawer = (task) => {
        setIsDrawerOpen(false);
        setEditTaskId(task._id);
        setEditTaskData(task);
    };
    const [projects, setProjects] = useState([]);
    const [filteredTasks, setFilteredTasks] = useState([]);
    const [stats, setStats] = useState({ currentStreak: 0, longestStreak: 0, revisionsByDate: {}, completedByDate: {} });
    const [notes, setNotes] = useState([]);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProject, setSelectedProject] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [selectedParent, setSelectedParent] = useState('all');
    const [selectedDate, setSelectedDate] = useState('');
    const [revisionFilter, setRevisionFilter] = useState('all');
    const [showFilters, setShowFilters] = useState(true);

    // UI State
    const [expandedTaskId, setExpandedTaskId] = useState(null);
    const [showRevisionModal, setShowRevisionModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [revisionNote, setRevisionNote] = useState('');
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [notesModalTask, setNotesModalTask] = useState(null);
    const [showYtModal, setShowYtModal] = useState(false);
    const [ytModalTask, setYtModalTask] = useState(null);

    const [activeTimer, setActiveTimer] = useState(null);

    // AI Challenge State
    const [showAiModal, setShowAiModal] = useState(false);
    const [completedParents, setCompletedParents] = useState([]);
    const [selectedParentId, setSelectedParentId] = useState('random');
    const [isGeneratingChallenge, setIsGeneratingChallenge] = useState(false);
    const [generatedChallenge, setGeneratedChallenge] = useState(null);
    const [showHint, setShowHint] = useState(false);

    const updateActiveTimer = () => {
        const timerStateStr = localStorage.getItem("focus_timer_state");
        const bindingObjStr = localStorage.getItem("focus_timer_task_binding");
        if (timerStateStr && bindingObjStr) {
            try {
                const timerState = JSON.parse(timerStateStr);
                const bindingObj = JSON.parse(bindingObjStr);
                if (bindingObj.isRevision) {
                    const durationSetting = timerState.selectedDuration * 60;
                    if (timerState.isActive && timerState.startTime) {
                        const startTimeMs = new Date(timerState.startTime).getTime();
                        const nowMs = Date.now();
                        const sessionSeconds = Math.floor((nowMs - startTimeMs) / 1000);
                        const totalSpent = (timerState.accumulatedTime || 0) + sessionSeconds;
                        const remaining = durationSetting - totalSpent;
                        setActiveTimer({
                            taskId: bindingObj.taskId,
                            taskName: bindingObj.taskName.replace("Revision: ", ""),
                            timeLeft: remaining,
                            selectedDuration: timerState.selectedDuration,
                            isActive: true
                        });
                    } else {
                        setActiveTimer({
                            taskId: bindingObj.taskId,
                            taskName: bindingObj.taskName.replace("Revision: ", ""),
                            timeLeft: timerState.timeLeft,
                            selectedDuration: timerState.selectedDuration,
                            isActive: false
                        });
                    }
                    return;
                }
            } catch (e) { console.error("Error reading revision timer state", e); }
        }
        setActiveTimer(null);
    };

    useEffect(() => {
        updateActiveTimer();
        const interval = setInterval(updateActiveTimer, 1000);
        return () => clearInterval(interval);
    }, [stats]);

    const handleTogglePlayPause = () => {
        const timerStateStr = localStorage.getItem("focus_timer_state");
        if (timerStateStr) {
            try {
                const timerState = JSON.parse(timerStateStr);
                if (timerState.isActive) {
                    // Pause
                    const startTimeMs = new Date(timerState.startTime).getTime();
                    const nowMs = Date.now();
                    const sessionSeconds = Math.floor((nowMs - startTimeMs) / 1000);
                    const newAccumulated = (timerState.accumulatedTime || 0) + sessionSeconds;
                    const durationSetting = timerState.selectedDuration * 60;
                    const newTimeLeft = durationSetting - newAccumulated;

                    timerState.isActive = false;
                    timerState.startTime = null;
                    timerState.accumulatedTime = newAccumulated;
                    timerState.timeLeft = newTimeLeft;
                } else {
                    // Resume
                    timerState.isActive = true;
                    timerState.startTime = new Date().toISOString();
                }
                localStorage.setItem("focus_timer_state", JSON.stringify(timerState));
                toast.success(timerState.isActive ? "Timer resumed" : "Timer paused");
                updateActiveTimer();
            } catch (e) { console.error("Error toggling timer state", e); }
        }
    };

    const handleOpenRevisionLogForActiveTimer = () => {
        if (activeTimer) {
            const taskObj = tasks.find(t => t._id === activeTimer.taskId);
            if (taskObj) {
                setSelectedTask(taskObj);
                setShowRevisionModal(true);
            }
        }
    };

    const handleCancelActiveTimer = () => {
        if (window.confirm("Are you sure you want to cancel the active revision timer? Your progress will not be saved.")) {
            localStorage.removeItem("focus_timer_task_binding");
            localStorage.removeItem("focus_timer_state");
            localStorage.removeItem("focus_timer_retrievable");
            setActiveTimer(null);
            toast.success("Revision timer cancelled.");
        }
    };

    useEffect(() => {
        if (activeBranch) {
            loadInitialData();
        }
    }, [activeBranch]);

    const loadInitialData = async () => {
        if (!navigator.onLine) {
            console.log("Sarthi is offline. Waiting to go online to sync revision state...");
            return;
        }
        handleLoading(true);
        try {
            const timezoneOffset = new Date().getTimezoneOffset();
            const [tasksRes, projectsRes, statsRes, notesRes, dailyRevisionRes] = await Promise.all([
                TaskApi.getAllTasks({ filter: { status: 'done' } }),
                ProjectApi.getAllProjects(),
                TaskApi.getRevisionStats(timezoneOffset),
                NoteApi.getNotes(),
                TaskApi.getDailyRevision(timezoneOffset)
            ]);

            const allTasks = tasksRes.data?.data || [];

            const completedChildTasks = allTasks.filter(t => {
                const isSubtask = t.parentTask;
                const isDone = t.status === 'done';
                return isSubtask && isDone;
            });

            setTasks(completedChildTasks);
            setFilteredTasks(completedChildTasks);
            setProjects(projectsRes.data?.data || []);
            setStats(statsRes.data?.data || { currentStreak: 0, longestStreak: 0, revisionsByDate: {}, completedByDate: {} });
            setNotes(notesRes.data?.data || []);

            const dailyRev = dailyRevisionRes.data?.data;
            setDailyRevisionState(dailyRev);
            if (dailyRev) {
                setTimerTimeLeft(getRemainingSeconds(dailyRev));
                setTimerIsActive(dailyRev.timerIsActive);
                dispatch(setDailyRevision(dailyRev)); // Sync with global store
                
                if (dailyRev.isCompleted) {
                    const hasSeenKey = `seen_revision_summary_${dailyRev.dateStr}`;
                    if (!localStorage.getItem(hasSeenKey)) {
                        setShowCompletionModal(true);
                    }
                }
            }
        } catch (error) {
            console.error("Failed to load revision data", error);
            toast.error("Failed to load tasks");
        } finally {
            handleLoading(false);
        }
    };

    // Start Daily Revision session
    const handleStartDailyRevision = async () => {
        handleLoading(true);
        try {
            const tzOffset = new Date().getTimezoneOffset();
            const res = await TaskApi.startDailyRevision(tzOffset);
            const dailyRev = res.data?.data;
            setDailyRevisionState(dailyRev);
            setTimerTimeLeft(getRemainingSeconds(dailyRev));
            setTimerIsActive(dailyRev.timerIsActive);
            dispatch(setDailyRevision(dailyRev));
            toast.success("3-Hour Revision Timer started!");
        } catch (err) {
            console.error("Failed to start daily revision:", err);
            toast.error("Failed to start revision protocol");
        } finally {
            handleLoading(false);
        }
    };

    // Toggle timer pause/resume
    const handleToggleDailyTimer = async () => {
        try {
            const tzOffset = new Date().getTimezoneOffset();
            const res = await TaskApi.toggleDailyRevisionTimer(tzOffset);
            const dailyRev = res.data?.data;
            setDailyRevisionState(dailyRev);
            setTimerTimeLeft(getRemainingSeconds(dailyRev));
            setTimerIsActive(dailyRev.timerIsActive);
            dispatch(setDailyRevision(dailyRev));
        } catch (err) {
            console.error("Failed to toggle timer:", err);
            toast.error("Failed to update timer");
        }
    };

    // 1. Tick effect for active timer countdown (resilient to browser background tab throttling)
    useEffect(() => {
        let interval = null;
        if (dailyRevisionState?.isStarted && !dailyRevisionState?.isCompleted && timerIsActive && dailyRevisionState?.timerLastUpdated) {
            const lastUpdatedMs = new Date(dailyRevisionState.timerLastUpdated).getTime();
            const startVal = dailyRevisionState.timeLeft;

            const tick = () => {
                const elapsed = Math.floor((Date.now() - lastUpdatedMs) / 1000);
                const currentVal = Math.max(0, startVal - elapsed);
                setTimerTimeLeft(currentVal);
                if (currentVal <= 0) {
                    setTimerIsActive(false);
                    if (interval) clearInterval(interval);
                }
            };

            tick();
            interval = setInterval(tick, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [dailyRevisionState?.isStarted, dailyRevisionState?.isCompleted, timerIsActive, dailyRevisionState?.timerLastUpdated, dailyRevisionState?.timeLeft]);

    // 2. Periodically sync timer to backend (every 30 seconds) using accurately calculated remaining time
    // 2. Periodically sync timer to backend (every 30 seconds) using accurately calculated remaining time
    useEffect(() => {
        if (!dailyRevisionState?.isStarted || dailyRevisionState?.isCompleted || !timerIsActive || !dailyRevisionState?.timerLastUpdated) return;
        const syncInterval = setInterval(async () => {
            try {
                const tzOffset = new Date().getTimezoneOffset();
                const lastUpdatedMs = new Date(dailyRevisionState.timerLastUpdated).getTime();
                const elapsed = Math.floor((Date.now() - lastUpdatedMs) / 1000);
                const currentVal = Math.max(0, dailyRevisionState.timeLeft - elapsed);

                await TaskApi.syncDailyRevisionTimer({
                    timeLeft: currentVal,
                    timerIsActive: timerIsActive,
                    timezoneOffset: tzOffset
                });
            } catch (err) {
                console.error("Timer sync failed:", err);
            }
        }, 30000);
        return () => clearInterval(syncInterval);
    }, [timerIsActive, dailyRevisionState]);

    // 3. Document visibility change listener to handle auto reload after > 5 hours sleep
    useEffect(() => {
        // Record last active time periodically (every 10 seconds)
        const recordInterval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                localStorage.setItem("sarthi_last_active_time", Date.now().toString());
            }
        }, 10000);

        const handleResume = () => {
            if (document.visibilityState === 'visible') {
                const lastActiveStr = localStorage.getItem("sarthi_last_active_time");
                if (lastActiveStr) {
                    const lastActive = parseInt(lastActiveStr, 10);
                    const elapsedMs = Date.now() - lastActive;
                    const FIVE_HOURS_MS = 5 * 60 * 60 * 1000;
                    if (elapsedMs > FIVE_HOURS_MS) {
                        console.log("Sarthi was asleep/inactive for > 5 hours. Reloading...");
                        window.location.reload();
                    }
                }
            }
        };

        document.addEventListener("visibilitychange", handleResume);
        return () => {
            clearInterval(recordInterval);
            document.removeEventListener("visibilitychange", handleResume);
        };
    }, []);

    useEffect(() => {
        applyFilters();
    }, [searchTerm, selectedProject, selectedParent, sortBy, selectedDate, revisionFilter, tasks]);

    const applyFilters = () => {
        let result = [...tasks];

        if (searchTerm) {
            result = result.filter(t => t.taskName?.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        if (selectedProject !== 'all') {
            result = result.filter(t => {
                const proj = t.projectName;
                const pid = typeof proj === 'object' ? proj?._id : proj;
                return pid === selectedProject;
            });
        }

        if (selectedParent !== 'all') {
            result = result.filter(t => t.parentTask?._id === selectedParent || t.parentTask === selectedParent);
        }

        if (selectedDate) {
            result = result.filter(t => {
                const finishDateRaw = getFinishDateRaw(t);
                const isCompletedOnDate = finishDateRaw ? moment(finishDateRaw).format('YYYY-MM-DD') === selectedDate : false;
                const hasRevisionOnDate = t.revisionLogs?.some(log => moment(log.revisionDate).format('YYYY-MM-DD') === selectedDate);
                return isCompletedOnDate || hasRevisionOnDate;
            });
        }

        if (revisionFilter === 'revised') {
            result = result.filter(t => t.revisionLogs && t.revisionLogs.length > 0);
        } else if (revisionFilter === 'unrevised') {
            result = result.filter(t => !t.revisionLogs || t.revisionLogs.length === 0);
        }

        // Sorting
        result.sort((a, b) => {
            const dateA = getFinishDateRaw(a) || 0;
            const dateB = getFinishDateRaw(b) || 0;
            if (sortBy === 'newest') return new Date(dateB) - new Date(dateA);
            if (sortBy === 'oldest') return new Date(dateA) - new Date(dateB);
            return 0;
        });

        setFilteredTasks(result);
    };

    const getFinishDateRaw = (task) => {
        if (!task.activityLogs || !Array.isArray(task.activityLogs)) return null;
        const logs = [...task.activityLogs].reverse();
        const doneLog = logs.find(log => log.currentStatus === 'done');
        return doneLog ? doneLog.date : null;
    };

    const getFinishDate = (task) => {
        const date = getFinishDateRaw(task);
        return date ? moment(date).format('DD MMM') : 'N/A';
    };

    const getLastRevisionInfo = () => {
        const dates = Object.keys(stats.revisionsByDate || {});
        if (dates.length === 0) return { date: 'None', count: 0 };
        const sorted = dates.sort((a, b) => new Date(b) - new Date(a));
        const lastDate = sorted[0];
        const count = stats.revisionsByDate[lastDate]?.length || 0;
        return {
            date: moment(lastDate).format('DD MMM, YYYY'),
            count
        };
    };

    const getBestRevisionInfo = () => {
        const dates = Object.keys(stats.revisionsByDate || {});
        if (dates.length === 0) return { date: 'None', count: 0 };

        let bestDate = dates[0];
        let maxCount = stats.revisionsByDate[bestDate]?.length || 0;

        for (let i = 1; i < dates.length; i++) {
            const date = dates[i];
            const count = stats.revisionsByDate[date]?.length || 0;
            if (count > maxCount) {
                maxCount = count;
                bestDate = date;
            }
        }

        return {
            date: moment(bestDate).format('DD MMM, YYYY'),
            count: maxCount
        };
    };

    const handleReviseWithTimer = (task) => {
        // Check if there is already a focus timer task binding in localStorage
        const existingBinding = localStorage.getItem("focus_timer_task_binding");
        if (existingBinding) {
            const confirmed = window.confirm("A focus timer is already running. Start a new revision timer and discard the current one?");
            if (!confirmed) return;
        }

        // 1. Set the focus timer task binding in localStorage
        const focusTimerBinding = {
            taskId: task._id,
            taskName: `Revision: ${task.taskName}`,
            taskIdString: task.taskId || 'DSA-X',
            estimatedHours: 0.5,
            dueDate: task.taskDueDate,
            isBacklog: false,
            isRevision: true
        };
        localStorage.setItem("focus_timer_task_binding", JSON.stringify(focusTimerBinding));

        // 2. Set the focus timer state to active, 30 minutes (1800s)
        const timerState = {
            timeLeft: 30 * 60,
            isActive: true,
            startTime: new Date().toISOString(),
            accumulatedTime: 0,
            selectedDuration: 30,
            currentTheme: { name: 'Vermilion', color: '#E34234', bg: 'rgba(227, 66, 52, 0.05)', shadow: 'rgba(227, 66, 52, 0.4)' },
            customHeading: `Revision: ${task.taskName}`,
            isCustomSessionActive: false
        };
        localStorage.setItem("focus_timer_state", JSON.stringify(timerState));

        toast.success(`Starting 30-minute revision timer for: ${task.taskName}`);

        // Update local state immediately
        updateActiveTimer();
    };

    const handleAddRevision = async () => {
        if (!revisionNote.trim()) {
            toast.error("Please enter a note for the revision");
            return;
        }



        handleLoading(true);
        try {
            const tzOffset = new Date().getTimezoneOffset();
            await TaskApi.addRevision(selectedTask._id, { notes: revisionNote, timezoneOffset: tzOffset });
            toast.success("Revision logged successfully");

            // Refresh daily revision status
            const dailyRevisionRes = await TaskApi.getDailyRevision(tzOffset);
            const dailyRev = dailyRevisionRes.data?.data;
            setDailyRevisionState(dailyRev);
            if (dailyRev) {
                setTimerTimeLeft(dailyRev.timeLeft);
                setTimerIsActive(dailyRev.timerIsActive);
                dispatch(setDailyRevision(dailyRev));
                if (dailyRev.isCompleted) {
                    toast.success("🎉 Daily revision complete! Sarthi is fully unlocked!");
                    setShowCompletionModal(true);
                }
            }

            // Check if there is an active focus timer for this exact task
            const bindingObjStr = localStorage.getItem("focus_timer_task_binding");
            if (bindingObjStr) {
                try {
                    const bindingObj = JSON.parse(bindingObjStr);
                    if (bindingObj.taskId === selectedTask._id) {
                        // Compute duration and save the focus session!
                        const timerStateStr = localStorage.getItem("focus_timer_state");
                        if (timerStateStr) {
                            const timerState = JSON.parse(timerStateStr);
                            const startTimeMs = timerState.startTime ? new Date(timerState.startTime).getTime() : Date.now();
                            const nowMs = Date.now();
                            const sessionSeconds = Math.floor((nowMs - startTimeMs) / 1000);
                            const totalSpent = (timerState.accumulatedTime || 0) + (timerState.isActive ? sessionSeconds : 0);

                            const actualDuration = Math.max(Math.round(totalSpent / 60), 1);

                            const start = timerState.startTime ? moment(timerState.startTime) : moment();
                            const end = moment(nowMs);

                            const sessionData = {
                                date: start.format("YYYY-MM-DD"),
                                startTime: start.toISOString(),
                                endTime: end.toISOString(),
                                duration: actualDuration,
                                type: "Focus",
                                task: bindingObj.taskId,
                                taskName: bindingObj.taskName,
                                taskIdString: bindingObj.taskIdString,
                                statusAtCompletion: "done",
                                completionState: "completed",
                                estimatedTimeAtStart: timerState.selectedDuration
                            };

                            await FocusApi.createSession(sessionData);
                            toast.success("Focus timer session saved!");
                        }

                        // Clear/reset the focus timer state
                        localStorage.removeItem("focus_timer_task_binding");
                        localStorage.removeItem("focus_timer_state");
                        localStorage.removeItem("focus_timer_retrievable");
                    }
                } catch (timerErr) {
                    console.error("Failed to auto-log focus timer from revision page", timerErr);
                }
            }

            setShowRevisionModal(false);
            setRevisionNote('');
            loadInitialData();
        } catch (error) {
            console.error("Failed to add revision", error);
            toast.error(error.response?.data?.message || "Failed to log revision");
        } finally {
            handleLoading(false);
        }
    };

    const handleOpenAiChallengeModal = async () => {
        setShowAiModal(true);
        setGeneratedChallenge(null);
        setSelectedParentId("random");
        setShowHint(false);
        try {
            const res = await TaskApi.getCompletedParents();
            const allCompletedParents = res.data?.data || [];
            // Filter completed parents to only those belonging to the selected project (Arena)
            const filtered = allCompletedParents.filter(p => {
                const proj = p.projectName;
                const projId = typeof proj === 'object' ? proj?._id : proj;
                return projId === selectedProject;
            });
            setCompletedParents(filtered);
        } catch (error) {
            console.error("Failed to load completed parents", error);
            toast.error("Failed to load completed patterns");
        }
    };

    const handleGenerateChallenge = async () => {
        setIsGeneratingChallenge(true);
        setGeneratedChallenge(null);
        setShowHint(false);
        try {
            const payload = {
                parentTaskId: selectedParentId === "random" ? "random" : selectedParentId
            };

            // If random, select a random one from our filtered completedParents
            if (selectedParentId === "random") {
                if (completedParents.length > 0) {
                    const randomParent = completedParents[Math.floor(Math.random() * completedParents.length)];
                    payload.parentTaskId = randomParent._id;
                } else {
                    toast.error("Please complete a parent task first before generating a challenge.");
                    setIsGeneratingChallenge(false);
                    return;
                }
            }

            const res = await TaskApi.suggestRevisionChallenge(payload);
            setGeneratedChallenge(res.data?.data);
        } catch (error) {
            console.error("Failed to generate AI challenge", error);
            toast.error(error.response?.data?.message || "Failed to generate AI challenge");
        } finally {
            setIsGeneratingChallenge(false);
        }
    };

    const handleAcceptChallenge = async () => {
        if (!generatedChallenge) return;
        handleLoading(true);
        try {
            const payload = {
                projectName: selectedProject,
                taskName: generatedChallenge.problemTitle,
                taskPriority: "medium",
                taskType: "AI Challenge",
                parentTask: generatedChallenge.parentTaskId,
                status: "inprogress",
                taskDescription: generatedChallenge.description,
                additionalNotes: `<h3>AI Solution Approach Hint</h3><p>${generatedChallenge.hint}</p><br/>Platform: <b>${generatedChallenge.platform}</b><br/>Asked in Companies: <b>${generatedChallenge.companies?.join(", ") || "N/A"}</b><br/>Link to Problem: <a href="${generatedChallenge.problemUrl}" target="_blank" rel="noopener noreferrer">${generatedChallenge.problemTitle}</a>`
            };
            const res = await TaskApi.createTask(payload);
            const createdTask = res.data?.data;

            if (createdTask) {
                const focusTimerBinding = {
                    taskId: createdTask._id,
                    taskName: createdTask.taskName,
                    taskIdString: createdTask.taskId || 'DSA-X',
                    estimatedHours: 40 / 60,
                    dueDate: createdTask.taskDueDate,
                    isBacklog: false,
                    taskType: "AI Challenge"
                };
                localStorage.setItem("focus_timer_task_binding", JSON.stringify(focusTimerBinding));

                const timerState = {
                    timeLeft: 40 * 60,
                    isActive: true,
                    startTime: new Date().toISOString(),
                    accumulatedTime: 0,
                    selectedDuration: 40,
                    currentTheme: { name: 'Vermilion', color: '#E34234', bg: 'rgba(227, 66, 52, 0.05)', shadow: 'rgba(227, 66, 52, 0.4)' },
                    customHeading: createdTask.taskName,
                    isCustomSessionActive: false
                };
                localStorage.setItem("focus_timer_state", JSON.stringify(timerState));

                toast.success("AI Challenge accepted, added to tasks, and 40-minute timer started!");
            } else {
                toast.success("AI Challenge accepted and added to tasks!");
            }

            setShowAiModal(false);
            loadInitialData(); // Refresh revision page tasks
            updateActiveTimer(); // Sync timer display
        } catch (error) {
            console.error("Failed to accept challenge", error);
            toast.error(error.response?.data?.message || "Failed to accept challenge");
        } finally {
            handleLoading(false);
        }
    };

    const projectOptions = [
        { value: 'all', label: 'All Arenas' },
        ...projects.map(p => ({ value: p._id, label: p.key || p.name }))
    ];

    const parentOptions = [
        { value: 'all', label: 'All Parents' },
        ...Array.from(new Set(tasks.map(t => t.parentTask?._id).filter(Boolean)))
            .map(id => {
                const p = tasks.find(t => t.parentTask?._id === id).parentTask;
                return { value: p._id, label: p.taskName };
            })
    ];

    const sortOptions = [
        { value: 'newest', label: 'Newest First' },
        { value: 'oldest', label: 'Oldest First' }
    ];

    const revisionStatusOptions = [
        { value: 'all', label: 'All Status' },
        { value: 'revised', label: 'Revised' },
        { value: 'unrevised', label: 'Unrevised' }
    ];

    const completedCountOnDate = selectedDate ? tasks.filter(t => {
        const finishDateRaw = getFinishDateRaw(t);
        return finishDateRaw ? moment(finishDateRaw).format('YYYY-MM-DD') === selectedDate : false;
    }).length : 0;

    const revisedCountOnDate = selectedDate ? tasks.filter(t => {
        return t.revisionLogs?.some(log => moment(log.revisionDate).format('YYYY-MM-DD') === selectedDate);
    }).length : 0;

    const selectedProjObj = projects.find(p => p._id === selectedProject);
    const isAiEligible = selectedProject !== 'all' && selectedProjObj && selectedProjObj.key !== 'ESP';

    const isLockedMode = dailyRevisionState && dailyRevisionState.isStarted && !dailyRevisionState.isCompleted;

    if (!dailyRevisionState) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[75vh] bg-[#F8FAFC] p-6 animate-in fade-in duration-500">
                <div className="relative w-16 h-16 flex items-center justify-center mb-4">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-100 border-t-primary animate-spin"></div>
                    <span className="text-xl">🔒</span>
                </div>
                <h3 className="text-sm font-black text-slate-700 tracking-wider uppercase">Initializing Revision Protocol...</h3>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 animate-pulse">Syncing Sarthi Security Gate</p>
            </div>
        );
    }

    if (dailyRevisionState && !dailyRevisionState.isStarted) {
        return (
            <div className="flex items-center justify-center min-h-[75vh] bg-[#F8FAFC] p-6 animate-in fade-in duration-500">
                <div className="bg-white border border-slate-200 shadow-xl rounded-[2.5rem] p-8 max-w-lg w-full text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary via-vermilion-500 to-accent"></div>
                    <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-primary mx-auto mb-6 border border-rose-100 shadow-sm relative animate-pulse">
                        <span className="text-4xl">🔒</span>
                    </div>

                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Daily Revision Protocol</h2>
                    <p className="text-[11px] font-bold text-primary uppercase tracking-widest mt-1">Consistency Gate Active</p>

                    <p className="text-sm text-slate-500 leading-relaxed mt-4">
                        To access Sarthi today, you must launch and complete today's revision session. You will be given exactly <strong>4 randomized questions</strong> from your completed <strong>DSA & DSAP2</strong> arenas.
                    </p>

                    <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 text-left my-6 space-y-3.5">
                        <div className="flex items-start gap-3">
                            <span className="text-base shrink-0 mt-0.5">⏱️</span>
                            <div>
                                <h4 className="text-xs font-black text-slate-700">3-Hour Focus Timer</h4>
                                <p className="text-[11px] text-slate-400 font-medium">A 3-hour timer will start automatically. You can pause and resume it as needed.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="text-base shrink-0 mt-0.5">🚫</span>
                            <div>
                                <h4 className="text-xs font-black text-slate-700">Application Lockout</h4>
                                <p className="text-[11px] text-slate-400 font-medium">All other features and navigation tabs are locked until you successfully log all 4 revisions.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="text-base shrink-0 mt-0.5">🔥</span>
                            <div>
                                <h4 className="text-xs font-black text-slate-700">Streak Shield</h4>
                                <p className="text-[11px] text-slate-400 font-medium">Complete revision daily to grow your streak of {stats.currentStreak} {stats.currentStreak === 1 ? 'day' : 'days'}!</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleStartDailyRevision}
                        className="w-full py-4 bg-gradient-to-r from-primary to-vermilion-500 hover:from-primary-dark hover:to-vermilion-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-98 shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                    >
                        <span>Launch Session & Start Timer</span>
                    </button>
                </div>
            </div>
        );
    }

    if (isLockedMode) {
        const completedQuestionsCount = dailyRevisionState.completedQuestions?.length || 0;
        const totalQuestionsCount = dailyRevisionState.questions?.length || 0;
        const progressPercentage = totalQuestionsCount > 0 ? (completedQuestionsCount / totalQuestionsCount) * 100 : 0;

        const formatTimer = (seconds) => {
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            const s = seconds % 60;
            return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        };

        return (
            <div className="flex flex-col h-full bg-[#F8FAFC] animate-in fade-in duration-500 overflow-y-auto p-6">
                {/* Header Lock Section */}
                <div className="max-w-5xl mx-auto w-full mb-8 text-center shrink-0">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 border border-rose-100 rounded-full text-primary text-[10px] font-black uppercase tracking-wider mb-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                        Revision Lock Protocol Active
                    </div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Today's Focus Revision</h1>
                    <p className="text-xs font-semibold text-slate-400 mt-1">Complete and log all 4 questions to restore full app access.</p>
                </div>

                {/* Main Timer and Stats Dashboard */}
                <div className="max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 shrink-0">
                    {/* Timer Box */}
                    <div className="bg-slate-800 text-white rounded-3xl p-6 border border-slate-700 shadow-xl flex flex-col items-center justify-center relative overflow-hidden md:col-span-2">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <IoTimerOutline size={120} />
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Revision Time Remaining</p>
                        <div className="font-mono text-5xl font-black tracking-wider flex items-center gap-1 bg-black/20 px-6 py-2.5 rounded-2xl border border-white/5 shadow-inner">
                            {timerTimeLeft <= 0 && <span className="text-rose-500">-</span>}
                            <span>{formatTimer(timerTimeLeft)}</span>
                        </div>
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={handleToggleDailyTimer}
                                className="px-6 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-all font-bold text-xs active:scale-95 flex items-center gap-2"
                            >
                                {timerIsActive ? <IoPause size={14} /> : <IoPlay size={14} />}
                                {timerIsActive ? "PAUSE COUNTER" : "RESUME TIMER"}
                            </button>
                        </div>
                    </div>

                    {/* Progress Box */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Protocol Progress</p>
                            <h3 className="text-3xl font-black text-slate-800 mt-1 leading-none">
                                {completedQuestionsCount} <span className="text-slate-300 text-2xl font-light">/</span> {totalQuestionsCount}
                            </h3>
                            <p className="text-[10px] font-medium text-slate-400 mt-1.5">Questions successfully revised</p>
                        </div>
                        <div className="mt-4">
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-100/50">
                                <div
                                    className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                                    style={{ width: `${progressPercentage}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Milestone Stepper */}
                <div className="flex justify-center items-center gap-3 mb-8 bg-white border border-slate-200/80 p-5 rounded-3xl max-w-lg mx-auto w-full shadow-sm">
                    {dailyRevisionState.questions?.map((q, idx) => {
                        const isDone = idx < completedQuestionsCount;
                        const isActive = idx === completedQuestionsCount;
                        return (
                            <React.Fragment key={q._id}>
                                <div className="flex items-center gap-2">
                                    <div className={`w-8 h-8 rounded-2xl flex items-center justify-center font-black text-xs border ${isDone ? 'bg-green-500 border-green-500 text-white shadow-sm' :
                                            isActive ? 'bg-primary border-primary text-white shadow-md animate-pulse' :
                                                'bg-slate-50 border-slate-200 text-slate-400'
                                        }`} title={q.taskName}>
                                        {isDone ? '✓' : idx + 1}
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-wider hidden sm:inline ${isActive ? 'text-primary' : isDone ? 'text-green-600' : 'text-slate-400'
                                        }`}>
                                        Q{idx + 1}
                                    </span>
                                </div>
                                {idx < totalQuestionsCount - 1 && (
                                    <div className={`flex-1 h-0.5 max-w-[40px] rounded-full ${idx < completedQuestionsCount ? 'bg-green-500' : 'bg-slate-200'}`} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* Single Active Question Card */}
                {dailyRevisionState.questions?.[completedQuestionsCount] ? (() => {
                    const task = dailyRevisionState.questions[completedQuestionsCount];
                    const elapsedSecondsOnActive = Math.max(0, (dailyRevisionState.currentQuestionStartTimeLeft || 10800) - timerTimeLeft);
                    const remainingSecondsToLog = Math.max(0, 900 - elapsedSecondsOnActive);
                    const isTimeRequirementMet = remainingSecondsToLog === 0;

                    const formatMinsSecs = (seconds) => {
                        const m = Math.floor(seconds / 60);
                        const s = seconds % 60;
                        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                    };

                    return (
                        <div className="max-w-5xl mx-auto w-full bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-md relative overflow-hidden flex flex-col justify-between min-h-[400px] mb-12">
                            <div>
                                <div className="flex items-center gap-2 flex-wrap mb-4">
                                    <span className="text-[10px] font-black text-primary bg-primary/5 px-3 py-1 rounded-full border border-primary/10 uppercase tracking-widest">
                                        {task.projectName?.key || 'DSA'}
                                    </span>
                                    <span className="text-[10px] font-extrabold text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-200/50 uppercase tracking-widest">
                                        {task.parentTask?.taskName || 'Topic'}
                                    </span>
                                </div>

                                <h2 
                                    onClick={() => handleOpenDrawer(task)}
                                    className="text-2xl font-black text-slate-800 tracking-tight leading-snug hover:text-primary transition-colors cursor-pointer flex items-center gap-2"
                                >
                                    {completedQuestionsCount + 1}. {task.taskName}
                                    <span className="text-xs font-normal text-slate-400 font-sans tracking-normal opacity-70">(click to view details & notes)</span>
                                </h2>
                                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{task.taskId || 'DSA-X'}</p>

                                {/* Time restriction warning banner */}
                                <div className={`mt-6 p-4.5 rounded-2xl border flex items-start gap-3 transition-all duration-300 ${isTimeRequirementMet
                                        ? 'bg-green-50 border-green-200/60 text-green-800'
                                        : 'bg-amber-50 border-amber-200/60 text-amber-800'
                                    }`}>
                                    <span className="text-lg shrink-0 mt-0.5">{isTimeRequirementMet ? '🔓' : '⏳'}</span>
                                    <div>
                                        <h4 className="text-xs font-black uppercase tracking-wider">{isTimeRequirementMet ? 'Ready to Complete' : 'Revision Focus Period'}</h4>
                                        <p className="text-[11px] font-semibold mt-0.5 opacity-90 leading-relaxed">
                                            {isTimeRequirementMet
                                                ? "You have studied this question for over 15 minutes! You are now allowed to log your revision notes and mark it complete."
                                                : `Spend a minimum of 15 minutes revising this question. Time remaining: ${formatMinsSecs(remainingSecondsToLog)}.`
                                            }
                                        </p>
                                    </div>
                                </div>

                                {/* Action Links */}
                                <div className="flex items-center gap-3 mt-6 flex-wrap">
                                    <button
                                        onClick={() => handleOpenDrawer(task)}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-primary/5 hover:bg-primary/10 text-xs font-bold text-primary rounded-xl border border-primary/10 transition-all shrink-0 active:scale-95"
                                    >
                                        📖 VIEW DETAILS & NOTES
                                    </button>
                                    {(task.projectName?.key === 'DSA' || (task.taskId && task.taskId.startsWith('DSA-'))) && (
                                         <button
                                             onClick={() => {
                                                 const slug = task.taskName
                                                     .toLowerCase()
                                                     .trim()
                                                     .replace(/[^\w\s-]/g, '')
                                                     .replace(/[\s_-]+/g, '-')
                                                     .replace(/^-+|-+$/g, '');
                                                 window.open(`https://leetcode.com/problems/${slug}/description/`, '_blank');
                                             }}
                                             className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-600 rounded-xl border border-slate-100 transition-all shrink-0 animate-fade-in"
                                         >
                                             <img src="/leetcode.png" alt="LeetCode" className="w-4 h-4 object-contain" />
                                             LEETCODE DESCRIPTION
                                         </button>
                                    )}
                                    {task.youtubeUrl && (
                                        <button
                                            onClick={() => {
                                                setYtModalTask(task);
                                                setShowYtModal(true);
                                            }}
                                            className="flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-xs font-bold text-red-600 rounded-xl border border-red-100 transition-all shrink-0 animate-fade-in"
                                        >
                                            <IoLogoYoutube size={16} />
                                            VIDEO RESOURCE
                                        </button>
                                    )}
                                    {hasAdditionalNotes(task.additionalNotes) && (
                                        <button
                                            onClick={() => {
                                                setNotesModalTask(task);
                                                setShowNotesModal(true);
                                            }}
                                            className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-600 rounded-xl border border-slate-100 transition-all shrink-0 animate-fade-in"
                                        >
                                            <IoDocumentTextOutline size={16} className="text-slate-400" />
                                            REFERENCE NOTES
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                                <button
                                    onClick={() => {
                                        if (!isTimeRequirementMet) {
                                            toast.error(`Please revise for at least 15 minutes. Wait another ${formatMinsSecs(remainingSecondsToLog)}.`);
                                            return;
                                        }
                                        setSelectedTask(task);
                                        setShowRevisionModal(true);
                                    }}
                                    className={`px-6 py-3.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center gap-2 ${isTimeRequirementMet
                                            ? 'bg-gradient-to-r from-primary to-vermilion-500 hover:from-primary-dark hover:to-vermilion-600 text-white active:scale-95'
                                            : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed opacity-75'
                                        }`}
                                >
                                    <IoSyncOutline size={14} className={isTimeRequirementMet ? 'animate-spin-slow' : ''} />
                                    {isTimeRequirementMet ? 'LOG REVISION' : `REVISE (${formatMinsSecs(remainingSecondsToLog)})`}
                                </button>
                            </div>
                        </div>
                    );
                })() : null}

                {/* Completed Today list inside Locked Mode */}
                {completedQuestionsCount > 0 && (
                    <div className="max-w-2xl mx-auto w-full bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm mb-12 animate-in slide-in-from-bottom-4 duration-300">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Completed Questions (Revise Tomorrow Queue)</p>
                        <div className="space-y-2.5">
                            {dailyRevisionState.questions?.slice(0, completedQuestionsCount).map((q, idx) => {
                                const isPinned = dailyRevisionState.reviseTomorrowQuestions?.some(pq => pq._id === q._id || pq === q._id);
                                return (
                                    <div key={q._id} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-2xl p-3 hover:bg-slate-100/50 transition-colors">
                                        <div 
                                            onClick={() => handleOpenDrawer(q)}
                                            className="truncate pr-4 flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
                                        >
                                            <span className="text-green-500 font-bold">✓</span>
                                            <span className="text-xs font-bold text-slate-700 truncate">{idx + 1}. {q.taskName}</span>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const tzOffset = new Date().getTimezoneOffset();
                                                    const res = await TaskApi.toggleReviseTomorrow({
                                                        taskId: q._id,
                                                        reviseTomorrow: !isPinned,
                                                        timezoneOffset: tzOffset
                                                    });
                                                    setDailyRevisionState(res.data?.data);
                                                    dispatch(setDailyRevision(res.data?.data));
                                                    if (!isPinned) {
                                                        toast.success("Pinned to revise again tomorrow! 📌");
                                                    } else {
                                                        toast.success("Removed from tomorrow's list.");
                                                    }
                                                } catch (err) {
                                                    console.error("Failed to pin task:", err);
                                                    toast.error("Failed to update preference");
                                                }
                                            }}
                                            className={`px-3 py-1.5 rounded-xl text-[9px] font-black tracking-wider uppercase transition-all shrink-0 active:scale-95 border ${
                                                isPinned 
                                                ? 'bg-primary border-primary text-white shadow-sm' 
                                                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                            }`}
                                        >
                                            {isPinned ? '📌 PINNED' : '🔄 REVISE TOMORROW'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Sub Modals */}
                {showRevisionModal && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500" onClick={() => setShowRevisionModal(false)}></div>
                        <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
                            <div className="bg-slate-900 px-8 py-10 flex items-center justify-between text-white relative overflow-hidden">
                                <div className="relative z-10 flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/10">
                                        <IoSyncOutline size={24} className="text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-xl tracking-tight leading-none">Log Review</h3>
                                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1.5">Cycle Submission</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowRevisionModal(false)} className="relative z-10 w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/5">
                                    <IoCloseOutline size={24} />
                                </button>
                            </div>

                            <div className="p-8 bg-white">
                                <div className="mb-8">
                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-3 block">Task</span>
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary font-black shadow-sm border border-slate-100">
                                            {selectedTask?.taskName?.[0] || 'T'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-800 tracking-tight">{selectedTask?.taskName}</p>
                                            <p className="text-[9px] font-black text-primary uppercase tracking-widest mt-0.5">{selectedTask?.projectName?.key || 'MOM'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <div>
                                        <label className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-3 block">Insights</label>
                                        <textarea
                                            rows="4"
                                            placeholder="Record key findings..."
                                            value={revisionNote}
                                            onChange={(e) => setRevisionNote(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-[13px] font-bold text-slate-700 placeholder:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary focus:bg-white transition-all resize-none shadow-inner"
                                        ></textarea>
                                    </div>

                                    <div className="flex items-center gap-4 pt-2">
                                        <button
                                            onClick={() => setShowRevisionModal(false)}
                                            className="px-6 py-4 rounded-xl text-[10px] font-black text-slate-400 hover:text-slate-600 transition-all"
                                        >
                                            CANCEL
                                        </button>
                                        <button
                                            onClick={handleAddRevision}
                                            className="flex-1 px-6 py-4 rounded-xl text-[10px] font-black text-white bg-primary hover:bg-primary-dark transition-all active:scale-95 shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                                        >
                                            <IoSyncOutline size={16} />
                                            SUBMIT LOG
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showNotesModal && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500" onClick={() => { setShowNotesModal(false); setNotesModalTask(null); }}></div>
                        <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
                            <div className="bg-slate-900 px-8 py-10 flex items-center justify-between text-white relative overflow-hidden">
                                <div className="relative z-10 flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/10">
                                        <IoListOutline size={24} className="text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-xl tracking-tight leading-none">Reference Notes</h3>
                                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1.5">Study Material</p>
                                    </div>
                                </div>
                                <button onClick={() => { setShowNotesModal(false); setNotesModalTask(null); }} className="relative z-10 w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/5">
                                    <IoCloseOutline size={24} />
                                </button>
                            </div>

                            <div className="p-8 bg-white flex flex-col max-h-[75vh]">
                                <div className="mb-6 shrink-0">
                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-3 block">Task Reference</span>
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary font-black shadow-sm border border-slate-100">
                                                {notesModalTask?.taskName?.[0] || 'T'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-800 tracking-tight">{notesModalTask?.taskName}</p>
                                                <p className="text-[9px] font-black text-primary uppercase tracking-widest mt-0.5">{notesModalTask?.projectName?.key || 'MOM'}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                if (notesModalTask?.additionalNotes) {
                                                    const tempEl = document.createElement("div");
                                                    tempEl.innerHTML = notesModalTask.additionalNotes;
                                                    const textToCopy = tempEl.textContent || tempEl.innerText || "";
                                                    navigator.clipboard.writeText(textToCopy);
                                                    toast.success("Notes copied to clipboard!");
                                                }
                                            }}
                                            className="px-3 py-1.5 rounded-xl border border-slate-200 text-[9px] font-black text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all active:scale-95"
                                        >
                                            COPY TEXT
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-3 block">Content</span>
                                    <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100/50 min-h-[150px]">
                                        <div
                                            className="text-[13px] font-medium text-slate-600 leading-relaxed rich-text-content break-words whitespace-pre-wrap"
                                            dangerouslySetInnerHTML={{ __html: notesModalTask?.additionalNotes }}
                                        />
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end shrink-0">
                                    <button
                                        onClick={() => { setShowNotesModal(false); setNotesModalTask(null); }}
                                        className="px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl text-[10px] font-black transition-all active:scale-95 shadow-lg shadow-primary/20"
                                    >
                                        CLOSE
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showYtModal && ytModalTask && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500"
                            onClick={() => { setShowYtModal(false); setYtModalTask(null); }}
                        ></div>
                        <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
                            <div className="bg-slate-900 px-8 py-8 flex items-center justify-between text-white relative overflow-hidden">
                                <div className="relative z-10 flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/10">
                                        <IoLogoYoutube size={24} className="text-red-500 animate-pulse" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-xl tracking-tight leading-none truncate max-w-[450px]">
                                            {ytModalTask.taskName}
                                        </h3>
                                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1.5">
                                            Distraction-Free Video
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { setShowYtModal(false); setYtModalTask(null); }}
                                    className="relative z-10 w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/5 text-white"
                                >
                                    <IoCloseOutline size={24} />
                                </button>
                            </div>

                            <div className="p-8 bg-white flex flex-col">
                                <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-black">
                                    {getYoutubeId(ytModalTask.youtubeUrl) ? (
                                        <iframe
                                            src={`https://www.youtube.com/embed/${getYoutubeId(ytModalTask.youtubeUrl)}?autoplay=1`}
                                            title="YouTube video player"
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                            allowFullScreen
                                            className="absolute inset-0 w-full h-full"
                                        ></iframe>
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                                            Invalid YouTube URL
                                        </div>
                                    )}
                                </div>
                                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end shrink-0">
                                    <button
                                        onClick={() => { setShowYtModal(false); setYtModalTask(null); }}
                                        className="px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl text-[10px] font-black transition-all active:scale-95 shadow-lg shadow-primary/20"
                                    >
                                        CLOSE
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <TaskDetailDrawer
                    isOpen={isDrawerOpen}
                    onClose={() => setIsDrawerOpen(false)}
                    task={selectedTaskForDrawer}
                    canEdit={canEdit}
                    onTaskUpdate={handleEditFromDrawer}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#F8FAFC] animate-in fade-in duration-500 overflow-visible">
            {/* Header Area */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 shrink-0 z-50">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                            Revision Hub
                            <span className="bg-primary/10 text-primary text-[9px] font-bold px-2 py-0.5 rounded-full border border-primary/20 tracking-normal">BETA</span>
                        </h1>
                        <p className="text-[11px] font-medium text-slate-400 mt-0.5 tracking-tight">Focus on subtask mastery through strategic review.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end mr-4">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Last Revision</span>
                            <span className="text-base font-black text-primary leading-none mt-0.5">
                                {getLastRevisionInfo().date} {getLastRevisionInfo().count > 0 && `(${getLastRevisionInfo().count})`}
                            </span>
                        </div>
                        <div className="flex flex-col items-end mr-4">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Mastery Count</span>
                            <span className="text-base font-black text-slate-800 leading-none">{filteredTasks.length}</span>
                        </div>
                        <button
                            onClick={() => {
                                if (selectedProject === 'all') {
                                    toast.error("Please select a specific Arena (e.g., DSA) in the filters to use the AI Challenge.");
                                    return;
                                }
                                if (selectedProjObj?.key === 'ESP') {
                                    toast.error("AI Challenges are disabled for the ESP Arena.");
                                    return;
                                }
                                handleOpenAiChallengeModal();
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all bg-primary hover:bg-primaryHover text-white shadow-md shadow-primary/20 active:scale-95 shrink-0"
                        >
                            <IoSparklesOutline size={14} />
                            AI Challenge
                        </button>

                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border ${showFilters ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-primary text-white border-primary shadow-lg shadow-primary/20'}`}
                        >
                            {showFilters ? <IoEyeOffOutline size={14} /> : <IoEyeOutline size={14} />}
                            {showFilters ? 'Hide' : 'Filter'}
                        </button>
                    </div>
                </div>
            </div>

{/* Stats Dashboard Grid */}
            <div className="px-6 pt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
                <div className="bg-white border border-slate-200 rounded-3xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
                    <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 shrink-0">
                        <IoCheckmarkCircleOutline size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Problems Done</p>
                        <h3 className="text-xl font-black text-slate-800 mt-1 leading-none">{tasks.length}</h3>
                        <p className="text-[10px] font-medium text-slate-400 mt-1.5">Completed coding problems</p>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                    <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 shrink-0 group-hover:scale-110 transition-transform">
                        <span className="text-2xl">🔥</span>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Streak</p>
                        <h3 className="text-xl font-black text-slate-800 mt-1 leading-none">
                            {stats.currentStreak} {stats.currentStreak === 1 ? 'Day' : 'Days'}
                        </h3>
                        <p className="text-[10px] font-medium text-slate-400 mt-1.5">
                            {stats.currentStreak > 0 ? "You're on fire! Keep it up!" : "Log a revision to start your streak!"}
                        </p>
                    </div>
                    {stats.currentStreak > 0 && (
                        <div className="absolute right-0 bottom-0 top-0 w-1.5 bg-gradient-to-b from-orange-400 to-amber-500"></div>
                    )}
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                    <div className="w-12 h-12 bg-vermilion-50 rounded-2xl flex items-center justify-center text-primary shrink-0">
                        <span className="text-2xl">🏆</span>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Longest Streak</p>
                        <h3 className="text-xl font-black text-slate-800 mt-1 leading-none">
                            {stats.longestStreak} {stats.longestStreak === 1 ? 'Day' : 'Days'}
                        </h3>
                        <p className="text-[10px] font-medium text-slate-400 mt-1.5">Your personal best streak</p>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                    <div className="w-12 h-12 bg-vermilion-50 rounded-2xl flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform">
                        <span className="text-2xl">📅</span>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Revision</p>
                        <h3 className="text-xl font-black text-slate-800 mt-1 leading-none">
                            {getLastRevisionInfo().date}
                        </h3>
                        <p className="text-[10px] font-medium text-slate-400 mt-1.5">
                            {getLastRevisionInfo().count} {getLastRevisionInfo().count === 1 ? 'problem' : 'problems'} revised
                        </p>
                    </div>
                </div>
            </div>

            {/* Active Revision Timer Banner */}
            {activeTimer && (
                <div className="mx-6 mt-6 bg-slate-800 text-white rounded-3xl p-5 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 shrink-0 relative">
                            <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-emerald-400 opacity-75 top-1 right-1"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 top-1 right-1 absolute"></span>
                            <IoTimerOutline size={24} className="text-white animate-pulse" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Revision Session</p>
                            <h4 className="text-base font-black tracking-tight mt-0.5">{activeTimer.taskName}</h4>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Live Timer Counter */}
                        <div className="font-mono text-3xl font-black tracking-wider flex items-center gap-1 bg-black/15 px-4 py-1.5 rounded-2xl border border-white/5 shadow-inner">
                            {activeTimer.timeLeft < 0 && <span className="text-rose-400">-</span>}
                            <span>{Math.abs(Math.floor(activeTimer.timeLeft / 60)).toString().padStart(2, '0')}</span>
                            <span className="animate-pulse">:</span>
                            <span>{Math.abs(activeTimer.timeLeft % 60).toString().padStart(2, '0')}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Pause/Resume Button */}
                            <button
                                onClick={handleTogglePlayPause}
                                className="p-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-all font-bold text-xs active:scale-95 flex items-center gap-1.5"
                                title={activeTimer.isActive ? "Pause Timer" : "Resume Timer"}
                            >
                                {activeTimer.isActive ? <IoPause size={16} /> : <IoPlay size={16} />}
                                {activeTimer.isActive ? "PAUSE" : "RESUME"}
                            </button>

                            {/* Complete & Log Button */}
                            <button
                                onClick={handleOpenRevisionLogForActiveTimer}
                                className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 border border-emerald-400 text-white rounded-xl transition-all font-black text-xs active:scale-95 shadow-md flex items-center gap-1.5"
                            >
                                <IoSyncOutline size={16} />
                                LOG REVISION
                            </button>

                            {/* Discard Button */}
                            <button
                                onClick={handleCancelActiveTimer}
                                className="p-3 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white font-bold text-xs"
                                title="Cancel and Discard Timer"
                            >
                                DISCARD
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Filter Section - Collapsible */}
            {showFilters && (
                <div className="bg-white border-b border-slate-200 px-6 py-2 animate-in slide-in-from-top duration-300 z-40 relative">
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Search Bar */}
                        <div className="w-44 sm:w-52 relative shrink-0">
                            <IoSearchOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                                type="text"
                                placeholder="Find a task..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-3 py-1.5 text-xs font-bold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all"
                            />
                        </div>

                        {/* Dropdowns */}
                        <div className="shrink-0">
                            <InputField
                                type="select"
                                options={projectOptions}
                                value={selectedProject}
                                onChange={(e) => setSelectedProject(e.target.value)}
                                className="!py-1 !rounded-xl !text-[10px] !font-bold shadow-none min-w-[110px]"
                                menuPortalTarget={document.body}
                                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                            />
                        </div>

                        <div className="shrink-0">
                            <InputField
                                type="select"
                                options={parentOptions}
                                value={selectedParent}
                                onChange={(e) => setSelectedParent(e.target.value)}
                                className="!py-1 !rounded-xl !text-[10px] !font-bold shadow-none min-w-[11rem]"
                                menuPortalTarget={document.body}
                                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                            />
                        </div>

                        <div className="shrink-0">
                            <InputField
                                type="select"
                                options={revisionStatusOptions}
                                value={revisionFilter}
                                onChange={(e) => setRevisionFilter(e.target.value)}
                                className="!py-1 !rounded-xl !text-[10px] !font-bold shadow-none min-w-[110px]"
                                menuPortalTarget={document.body}
                                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                            />
                        </div>

                        <div className="shrink-0">
                            <InputField
                                type="select"
                                options={sortOptions}
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="!py-1 !rounded-xl !text-[10px] !font-bold shadow-none min-w-[110px]"
                                menuPortalTarget={document.body}
                                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                            />
                        </div>

                        {/* Date Picker */}
                        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 hover:border-slate-200 transition-all shrink-0 h-[34px]">
                            <IoCalendarOutline className="text-slate-400 shrink-0" size={14} />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="bg-transparent text-[10px] font-bold text-slate-700 outline-none border-none cursor-pointer focus:ring-0 p-0"
                            />
                        </div>

                        <button
                            onClick={() => { setSearchTerm(''); setSelectedProject('all'); setSelectedParent('all'); setSortBy('newest'); setSelectedDate(''); setRevisionFilter('all'); }}
                            className="h-[34px] w-[34px] flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-400 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-100 transition-all shadow-sm shrink-0"
                            title="Reset Filters"
                        >
                            <IoFilterOutline size={15} />
                        </button>
                    </div>
                </div>
            )}

            {/* Date-wise Activity Banner */}
            {selectedDate && (
                <div className="bg-primary/5 border border-primary/20 rounded-2xl px-6 py-3 mx-6 mt-4 flex items-center justify-between animate-in fade-in duration-300">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <IoCalendarOutline size={16} />
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-800">
                                Activity for {moment(selectedDate).format('MMMM DD, YYYY')}
                            </p>
                            <p className="text-[10px] font-bold text-slate-500 mt-0.5">
                                Completed: <span className="text-slate-700 font-extrabold">{completedCountOnDate} {completedCountOnDate === 1 ? 'problem' : 'problems'}</span> · Revised: <span className="text-slate-700 font-extrabold">{revisedCountOnDate} {revisedCountOnDate === 1 ? 'problem' : 'problems'}</span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setSelectedDate('')}
                        className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                        title="Clear Date Filter"
                    >
                        <IoCloseOutline size={18} />
                    </button>
                </div>
            )}

            {/* Table Area */}
            <div className="flex-1 pt-1 overflow-visible">
                <div className="bg-white border border-slate-200 shadow-sm h-full flex flex-col overflow-visible">
                    <div className="overflow-x-auto custom-scrollbar flex-1 rounded-[2rem] overflow-visible">
                        <table className="w-full text-left border-collapse min-w-[1100px]">
                            <thead className="sticky top-0 bg-white z-20 border-b border-slate-100">
                                <tr className="bg-white">
                                    <th className="pl-8 pr-4 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] w-12"></th>
                                    <th className="px-4 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Mastery Detail</th>
                                    <th className="px-4 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Context (Parent)</th>
                                    <th className="px-4 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] w-[300px]">Reference Notes</th>
                                    <th className="px-4 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Key</th>
                                    <th className="px-4 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Timeline</th>
                                    <th className="px-4 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Rev</th>
                                    <th className="pl-4 pr-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Execution</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredTasks.length > 0 ? filteredTasks.map((task) => (
                                    <React.Fragment key={task._id}>
                                        <tr className={`hover:bg-slate-50/80 transition-all group ${expandedTaskId === task._id ? 'bg-slate-50' : ''}`}>
                                            <td className="pl-8 pr-4 py-4">
                                                <button
                                                    onClick={() => setExpandedTaskId(expandedTaskId === task._id ? null : task._id)}
                                                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${expandedTaskId === task._id ? 'bg-primary text-white rotate-90 shadow-lg shadow-primary/20' : 'bg-slate-50 text-slate-400 group-hover:bg-white group-hover:text-primary group-hover:shadow-sm'}`}
                                                >
                                                    <IoChevronForward size={12} />
                                                </button>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[13px] font-black text-slate-700 leading-tight mb-0.5 flex items-center gap-1.5 flex-wrap">
                                                        <span
                                                            onClick={() => handleOpenDrawer(task)}
                                                            className="cursor-pointer hover:underline hover:text-primary transition-colors"
                                                        >
                                                            {task.taskName}
                                                        </span>
                                                        {(task.projectName?.key === 'DSA' || (task.taskId && task.taskId.startsWith('DSA-'))) && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const slug = task.taskName
                                                                        .toLowerCase()
                                                                        .trim()
                                                                        .replace(/[^\w\s-]/g, '')
                                                                        .replace(/[\s_-]+/g, '-')
                                                                        .replace(/^-+|-+$/g, '');
                                                                    window.open(`https://leetcode.com/problems/${slug}/description/`, '_blank');
                                                                }}
                                                                className="hover:scale-115 transition-all shrink-0 inline-flex items-center p-0.5 rounded hover:bg-orange-50 dark:hover:bg-orange-950/40"
                                                                title="Open on LeetCode"
                                                            >
                                                                <img src="/leetcode.png" alt="LeetCode" className="w-3.5 h-3.5 object-contain" />
                                                            </button>
                                                        )}
                                                        {task.taskType === "AI Challenge" && (
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-violet-100 text-violet-700 border border-violet-200 uppercase tracking-widest leading-none scale-90 origin-left">
                                                                AI
                                                            </span>
                                                        )}
                                                        {task.youtubeUrl && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setYtModalTask(task);
                                                                    setShowYtModal(true);
                                                                }}
                                                                className="text-red-500 hover:text-red-600 hover:scale-110 transition-all shrink-0 inline-flex items-center p-1 rounded-md hover:bg-red-50"
                                                                title="Watch YouTube Video"
                                                            >
                                                                <IoLogoYoutube size={16} />
                                                            </button>
                                                        )}

                                                        {/* Attachment Indicator Badge */}
                                                        {task.attachments && task.attachments.length > 0 && (
                                                            <span
                                                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-widest leading-none scale-90"
                                                                title="Task has attachments"
                                                            >
                                                                📎 Attachments
                                                            </span>
                                                        )}

                                                        {/* Sticky Note Indicator Badge */}
                                                        {notes.some(n => {
                                                            if (!n.taskId) return false;
                                                            if (n.taskId === task._id) return true;
                                                            if (task.parentTask) {
                                                                const parentId = typeof task.parentTask === 'object' ? task.parentTask?._id : task.parentTask;
                                                                if (n.taskId === parentId) return true;
                                                            }
                                                            return false;
                                                        }) && (
                                                                <span
                                                                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-yellow-50 text-yellow-600 border border-yellow-100 uppercase tracking-widest leading-none scale-90"
                                                                    title="Task has linked sticky notes"
                                                                >
                                                                    📝 Notes
                                                                </span>
                                                            )}
                                                    </span>
                                                    <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">{task.taskId || 'DSA-X'}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-50 rounded-lg w-fit border border-slate-100 group-hover:bg-white group-hover:border-slate-200 transition-all">
                                                    <div className="w-1 h-1 rounded-full bg-slate-300 group-hover:bg-primary transition-colors"></div>
                                                    <span className="text-[10px] font-bold text-slate-500 group-hover:text-slate-700 truncate max-w-[200px]">
                                                        {task.parentTask?.taskName || 'Individual Task'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <NoteCell
                                                    text={task.additionalNotes}
                                                    onReadMore={() => {
                                                        setNotesModalTask(task);
                                                        setShowNotesModal(true);
                                                    }}
                                                />
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="text-[9px] font-black text-primary bg-primary/5 px-2.5 py-0.5 rounded-full border border-primary/10 uppercase tracking-wider">
                                                    {task.projectName?.key || task.projectName || 'MOM'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <div className="flex flex-col items-center">
                                                    <div className="text-[10px] font-black text-slate-700">{getFinishDate(task)}</div>
                                                    <div className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter">Done</div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <div className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-black transition-all ${task.revisionLogs?.length > 0 ? 'bg-green-500 text-white shadow-sm' : 'bg-slate-100 text-slate-400'}`}>
                                                    {task.revisionLogs?.length || 0}
                                                </div>
                                            </td>
                                            <td className="pl-4 pr-8 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {activeTimer && activeTimer.taskId === task._id ? (
                                                        <button
                                                            onClick={handleTogglePlayPause}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary border border-primary text-[10px] font-black text-white hover:bg-primaryHover transition-all active:scale-95 group/revise-btn shadow-md animate-pulse"
                                                            title={activeTimer.isActive ? "Pause Active Revision Timer" : "Resume Active Revision Timer"}
                                                        >
                                                            {activeTimer.isActive ? <IoPause size={12} /> : <IoPlay size={12} />}
                                                            {activeTimer.timeLeft < 0 && "-"}
                                                            {Math.abs(Math.floor(activeTimer.timeLeft / 60)).toString().padStart(2, '0')}:
                                                            {Math.abs(activeTimer.timeLeft % 60).toString().padStart(2, '0')}
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleReviseWithTimer(task)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-vermilion-50 border border-vermilion-100 text-[10px] font-black text-primary hover:bg-primary hover:text-white hover:border-primary transition-all active:scale-95 group/revise-btn shadow-sm"
                                                            title="Start 30-minute Focus Revision Session"
                                                        >
                                                            <IoTimerOutline size={12} />
                                                            TIMER
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => { setSelectedTask(task); setShowRevisionModal(true); }}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-[10px] font-black text-slate-700 hover:bg-primary hover:text-white hover:border-primary transition-all active:scale-95 group/btn"
                                                    >
                                                        <IoSyncOutline className="group-hover/btn:animate-spin" size={12} />
                                                        LOG
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>

                                        {expandedTaskId === task._id && (
                                            <tr className="bg-slate-50/30 animate-in slide-in-from-top-1 duration-200">
                                                <td colSpan="8" className="px-12 py-6">
                                                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                                                        <div className="flex items-center justify-between mb-5 border-b border-slate-50 pb-3">
                                                            <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                                                <IoListOutline size={16} className="text-primary" />
                                                                Logs
                                                            </h4>
                                                        </div>

                                                        <div className="flex items-center justify-between mb-4">
                                                            <h5 className="text-[9px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                                                <IoSyncOutline size={14} className="text-primary" />
                                                                Revision History
                                                            </h5>
                                                        </div>

                                                        {task.revisionLogs && task.revisionLogs.length > 0 ? (
                                                            <div className="space-y-2">
                                                                {task.revisionLogs.map((log, lIdx) => (
                                                                    <div key={lIdx} className="bg-slate-50/30 p-3 rounded-xl border border-slate-50 flex items-start gap-3 hover:border-slate-100 transition-all">
                                                                        <div className="shrink-0 w-6 h-6 rounded-full bg-white flex items-center justify-center text-[9px] font-black text-primary border border-slate-100">
                                                                            {lIdx + 1}
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <div className="flex items-center justify-between mb-1">
                                                                                <span className="text-[10px] font-black text-slate-700">Review</span>
                                                                                <span className="text-[15px] font-bold text-slate-400">
                                                                                    {moment(log.revisionDate).format('DD MMM, YYYY · HH:mm')}
                                                                                </span>
                                                                            </div>
                                                                            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{log.notes || 'Insight not recorded.'}</p>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="py-6 flex flex-col items-center justify-center text-center opacity-30">
                                                                <IoSyncOutline size={24} className="text-slate-300 mb-2" />
                                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em]">No Logs</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                )) : (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-24 text-center">
                                            <div className="flex flex-col items-center justify-center opacity-30">
                                                <IoCheckmarkCircleOutline size={40} className="text-slate-200 mb-4" />
                                                <p className="text-sm font-black text-slate-700 uppercase tracking-widest">Protocol Clear</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Revision Modal */}
            {showRevisionModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500" onClick={() => setShowRevisionModal(false)}></div>
                    <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
                        <div className="bg-slate-900 px-8 py-10 flex items-center justify-between text-white relative overflow-hidden">
                            <div className="relative z-10 flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/10">
                                    <IoSyncOutline size={24} className="text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-black text-xl tracking-tight leading-none">Log Review</h3>
                                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1.5">Cycle Submission</p>
                                </div>
                            </div>
                            <button onClick={() => setShowRevisionModal(false)} className="relative z-10 w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/5">
                                <IoCloseOutline size={24} />
                            </button>
                        </div>

                        <div className="p-8 bg-white">
                            <div className="mb-8">
                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-3 block">Task</span>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary font-black shadow-sm border border-slate-100">
                                        {selectedTask?.taskName?.[0] || 'T'}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-800 tracking-tight">{selectedTask?.taskName}</p>
                                        <p className="text-[9px] font-black text-primary uppercase tracking-widest mt-0.5">{selectedTask?.projectName?.key || 'MOM'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-3 block">Insights</label>
                                    <textarea
                                        rows="4"
                                        placeholder="Record key findings..."
                                        value={revisionNote}
                                        onChange={(e) => setRevisionNote(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-[13px] font-bold text-slate-700 placeholder:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary focus:bg-white transition-all resize-none shadow-inner"
                                    ></textarea>
                                </div>

                                <div className="flex items-center gap-4 pt-2">
                                    <button
                                        onClick={() => setShowRevisionModal(false)}
                                        className="px-6 py-4 rounded-xl text-[10px] font-black text-slate-400 hover:text-slate-600 transition-all"
                                    >
                                        CANCEL
                                    </button>
                                    <button
                                        onClick={handleAddRevision}
                                        className="flex-1 px-6 py-4 rounded-xl text-[10px] font-black text-white bg-primary hover:bg-primary-dark transition-all active:scale-95 shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                                    >
                                        <IoSyncOutline size={16} />
                                        SUBMIT LOG
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reference Notes Modal */}
            {showNotesModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500" onClick={() => { setShowNotesModal(false); setNotesModalTask(null); }}></div>
                    <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
                        <div className="bg-slate-900 px-8 py-10 flex items-center justify-between text-white relative overflow-hidden">
                            <div className="relative z-10 flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/10">
                                    <IoListOutline size={24} className="text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-black text-xl tracking-tight leading-none">Reference Notes</h3>
                                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1.5">Study Material</p>
                                </div>
                            </div>
                            <button onClick={() => { setShowNotesModal(false); setNotesModalTask(null); }} className="relative z-10 w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/5">
                                <IoCloseOutline size={24} />
                            </button>
                        </div>

                        <div className="p-8 bg-white flex flex-col max-h-[75vh]">
                            <div className="mb-6 shrink-0">
                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-3 block">Task Reference</span>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary font-black shadow-sm border border-slate-100">
                                            {notesModalTask?.taskName?.[0] || 'T'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-800 tracking-tight">{notesModalTask?.taskName}</p>
                                            <p className="text-[9px] font-black text-primary uppercase tracking-widest mt-0.5">{notesModalTask?.projectName?.key || 'MOM'}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (notesModalTask?.additionalNotes) {
                                                const tempEl = document.createElement("div");
                                                tempEl.innerHTML = notesModalTask.additionalNotes;
                                                const textToCopy = tempEl.textContent || tempEl.innerText || "";
                                                navigator.clipboard.writeText(textToCopy);
                                                toast.success("Notes copied to clipboard!");
                                            }
                                        }}
                                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-[9px] font-black text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all active:scale-95"
                                    >
                                        COPY TEXT
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-3 block">Content</span>
                                <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100/50 min-h-[150px]">
                                    <div
                                        className="text-[13px] font-medium text-slate-600 leading-relaxed rich-text-content break-words whitespace-pre-wrap"
                                        dangerouslySetInnerHTML={{ __html: notesModalTask?.additionalNotes }}
                                    />
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end shrink-0">
                                <button
                                    onClick={() => { setShowNotesModal(false); setNotesModalTask(null); }}
                                    className="px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl text-[10px] font-black transition-all active:scale-95 shadow-lg shadow-primary/20"
                                >
                                    CLOSE
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* YouTube Video Player Modal */}
            {showYtModal && ytModalTask && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500"
                        onClick={() => { setShowYtModal(false); setYtModalTask(null); }}
                    ></div>
                    <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
                        <div className="bg-slate-900 px-8 py-8 flex items-center justify-between text-white relative overflow-hidden">
                            <div className="relative z-10 flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/10">
                                    <IoLogoYoutube size={24} className="text-red-500 animate-pulse" />
                                </div>
                                <div>
                                    <h3 className="font-black text-xl tracking-tight leading-none truncate max-w-[450px]">
                                        {ytModalTask.taskName}
                                    </h3>
                                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1.5">
                                        Distraction-Free Video
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setShowYtModal(false); setYtModalTask(null); }}
                                className="relative z-10 w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/5 text-white"
                            >
                                <IoCloseOutline size={24} />
                            </button>
                        </div>

                        <div className="p-8 bg-white flex flex-col">
                            <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-black">
                                {getYoutubeId(ytModalTask.youtubeUrl) ? (
                                    <iframe
                                        src={`https://www.youtube.com/embed/${getYoutubeId(ytModalTask.youtubeUrl)}?autoplay=1`}
                                        title="YouTube video player"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        allowFullScreen
                                        className="absolute inset-0 w-full h-full"
                                    ></iframe>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                                        Invalid YouTube URL
                                    </div>
                                )}
                            </div>
                            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end shrink-0">
                                <button
                                    onClick={() => { setShowYtModal(false); setYtModalTask(null); }}
                                    className="px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl text-[10px] font-black transition-all active:scale-95 shadow-lg shadow-primary/20"
                                >
                                    CLOSE
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Challenge Modal */}
            {showAiModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500"
                        onClick={() => { if (!isGeneratingChallenge) setShowAiModal(false); }}
                    ></div>
                    <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100 flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="bg-slate-800 px-8 py-10 flex items-center justify-between text-white relative overflow-hidden shrink-0">
                            {/* Decorative background glow */}
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

                            <div className="relative z-10 flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/10 shrink-0">
                                    <IoSparklesOutline size={24} className="text-white animate-pulse" />
                                </div>
                                <div>
                                    <h3 className="font-black text-xl tracking-tight leading-none">AI Revision Challenge</h3>
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1.5">Reinforce Your Patterns</p>
                                </div>
                            </div>
                            <button
                                onClick={() => { if (!isGeneratingChallenge) setShowAiModal(false); }}
                                disabled={isGeneratingChallenge}
                                className="relative z-10 w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/5 active:scale-95 disabled:opacity-50"
                            >
                                <IoCloseOutline size={24} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-8 bg-white flex flex-col overflow-y-auto custom-scrollbar flex-1">
                            {!generatedChallenge && !isGeneratingChallenge && (
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Select Completed Pattern</label>
                                        <select
                                            value={selectedParentId}
                                            onChange={(e) => setSelectedParentId(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all cursor-pointer"
                                        >
                                            <option value="random">🎲 Random Completed Pattern</option>
                                            {completedParents.map(p => (
                                                <option key={p._id} value={p._id}>
                                                    {p.taskName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="p-4 bg-vermilion-50 rounded-2xl border border-vermilion-100 flex gap-3 text-primary">
                                        <span className="text-lg">💡</span>
                                        <p className="text-xs font-semibold leading-relaxed">
                                            This AI generator will analyze your selected pattern, scan the problems you have already solved, and suggest a medium difficulty company-asked problem from LeetCode, GeeksforGeeks, or Codeforces that you haven't done yet!
                                        </p>
                                    </div>

                                    <button
                                        onClick={handleGenerateChallenge}
                                        className="w-full px-6 py-4 rounded-xl text-[11px] font-black text-white bg-primary hover:bg-primaryHover shadow-md shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2 mt-4"
                                    >
                                        <IoSparklesOutline size={14} />
                                        GENERATE REVISION CHALLENGE
                                    </button>
                                </div>
                            )}

                            {/* Loading State */}
                            {isGeneratingChallenge && (
                                <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-in fade-in duration-300">
                                    <div className="relative w-16 h-16 flex items-center justify-center">
                                        <div className="absolute inset-0 rounded-full border-4 border-vermilion-100 border-t-primary animate-spin"></div>
                                        <IoSparklesOutline size={24} className="text-primary animate-pulse" />
                                    </div>
                                    <div className="text-center">
                                        <h4 className="text-sm font-black text-slate-800">AI is selecting a challenge...</h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Filtering your solved problems</p>
                                    </div>
                                </div>
                            )}

                            {/* Challenge Result */}
                            {generatedChallenge && !isGeneratingChallenge && (
                                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                                    <div className="p-5 bg-gradient-to-br from-slate-50 to-vermilion-50/20 rounded-3xl border border-slate-100 space-y-4 relative overflow-hidden">
                                        {/* Platform and Title */}
                                        <div>
                                            <span className="text-[9px] font-black text-primary bg-vermilion-50 px-2.5 py-0.5 rounded-full border border-vermilion-100 uppercase tracking-wider">
                                                {generatedChallenge.platform}
                                            </span>
                                            <h4 className="text-base font-black text-slate-800 tracking-tight mt-2 flex items-center gap-1.5">
                                                {generatedChallenge.problemTitle}
                                                <a
                                                    href={generatedChallenge.problemUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-slate-400 hover:text-primary transition-colors p-1"
                                                    title="Open Problem Link"
                                                >
                                                    <IoOpenOutline size={16} />
                                                </a>
                                            </h4>
                                        </div>

                                        {/* Description */}
                                        <div className="space-y-1">
                                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest block">Problem Summary</span>
                                            <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                                                {generatedChallenge.description}
                                            </p>
                                        </div>

                                        {/* Companies */}
                                        {generatedChallenge.companies && generatedChallenge.companies.length > 0 && (
                                            <div className="space-y-1.5">
                                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest block">Asked in Companies</span>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {generatedChallenge.companies.map((c, i) => (
                                                        <span key={i} className="text-[9px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-lg shadow-sm">
                                                            {typeof c === 'object' ? c.name : c}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Collapsible Hint */}
                                    <div>
                                        <button
                                            onClick={() => setShowHint(!showHint)}
                                            className="w-full flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100/50 transition-colors"
                                        >
                                            <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                                                💡 Reveal AI Approach Hint
                                            </span>
                                            <span className="text-slate-400 transition-transform">
                                                {showHint ? "Hide" : "Show"}
                                            </span>
                                        </button>
                                        {showHint && (
                                            <div className="mt-3 p-5 bg-violet-50/30 border border-violet-100 rounded-2xl text-xs font-semibold text-slate-600 leading-relaxed animate-in slide-in-from-top-2 duration-300">
                                                {generatedChallenge.hint}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3 pt-2 shrink-0">
                                        <button
                                            onClick={handleGenerateChallenge}
                                            className="px-4 py-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-[10px] font-black text-slate-500 hover:text-slate-700 transition-all flex items-center gap-1.5"
                                            title="Get a different challenge"
                                        >
                                            <IoRefreshOutline size={16} />
                                            TRY ANOTHER
                                        </button>
                                        <button
                                            onClick={handleAcceptChallenge}
                                            className="flex-1 px-6 py-4 rounded-xl text-[10px] font-black text-white bg-primary hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            <IoCheckmarkCircleOutline size={16} />
                                            ACCEPT & ADD TO TASKS
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <TaskDetailDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                task={selectedTaskForDrawer}
                canEdit={canEdit}
                onTaskUpdate={handleEditFromDrawer}
            />

            {editTaskId && editTaskData && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center p-6">
                    <div className="absolute inset-0 bg-black/50" onClick={() => { setEditTaskId(null); setEditTaskData(null); }} />
                    <div className="relative w-full h-full overflow-auto bg-white dark:bg-themeBG rounded-2xl shadow-2xl z-10">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h4 className="text-lg font-bold">Update Task</h4>
                            <button
                                className="text-gray-500 hover:text-gray-800 font-bold"
                                onClick={() => { setEditTaskId(null); setEditTaskData(null); }}
                            >
                                Close
                            </button>
                        </div>
                        <div className="p-4">
                            <CreateTask
                                modalMode={true}
                                task={editTaskData}
                                id={editTaskId}
                                setId={setEditTaskId}
                                setTask={setEditTaskData}
                                setProjectTasks={() => {
                                    loadInitialData();
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {showCompletionModal && dailyRevisionState && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500"
                        onClick={() => {
                            const dateStr = dailyRevisionState.dateStr;
                            localStorage.setItem(`seen_revision_summary_${dateStr}`, "true");
                            setShowCompletionModal(false);
                        }}
                    ></div>
                    
                    {/* Modal Content */}
                    <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
                        {/* Header / Celebration Banner */}
                        <div className="bg-slate-900 px-8 py-10 flex items-center justify-between text-white relative overflow-hidden">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent)] pointer-events-none"></div>
                            <div className="relative z-10 flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/10 text-xl animate-bounce">
                                    🎉
                                </div>
                                <div>
                                    <h3 className="font-black text-xl tracking-tight leading-none">Revision Protocol Completed</h3>
                                    <p className="text-primary text-[10px] font-bold uppercase tracking-widest mt-1.5">All Focus Questions Solved</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    const dateStr = dailyRevisionState.dateStr;
                                    localStorage.setItem(`seen_revision_summary_${dateStr}`, "true");
                                    setShowCompletionModal(false);
                                }}
                                className="relative z-10 w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/5 text-white"
                            >
                                <IoCloseOutline size={24} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-8 bg-white max-h-[50vh] overflow-y-auto custom-scrollbar">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Questions Revised</span>
                                    <p className="text-2xl font-black text-slate-800 mt-1">4 / 4</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Time Spent</span>
                                    <p className="text-2xl font-black text-primary mt-1">
                                        {(() => {
                                            const totalSecs = dailyRevisionState.questionLogs?.reduce((acc, log) => acc + (log.timeSpent || 0), 0) || 0;
                                            const m = Math.floor(totalSecs / 60);
                                            return `${m} minutes`;
                                        })()}
                                    </p>
                                </div>
                            </div>

                            {/* Question list with pinning option and stats */}
                            <div className="space-y-4">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Question Stats & Pin Preferences</span>
                                <div className="space-y-3">
                                    {dailyRevisionState.questions?.map((q, idx) => {
                                        const isPinned = dailyRevisionState.reviseTomorrowQuestions?.some(pq => pq._id === q._id || pq === q._id);
                                        const logEntry = dailyRevisionState.questionLogs?.find(l => (l.taskId?._id || l.taskId) === q._id);
                                        const timeSpentSecs = logEntry ? logEntry.timeSpent : 0;
                                        const formatTimeSpent = (totalSeconds) => {
                                            if (!totalSeconds) return "N/A";
                                            const m = Math.floor(totalSeconds / 60);
                                            const s = totalSeconds % 60;
                                            return `${m}m ${s}s`;
                                        };

                                        return (
                                            <div key={q._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-4 hover:bg-slate-100/50 transition-colors">
                                                <div className="flex-1 min-w-0 pr-2">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-green-500 font-bold">✓</span>
                                                        <span className="text-xs font-bold text-slate-700 truncate">{idx + 1}. {q.taskName}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-[10px] text-slate-400 font-semibold pl-5">
                                                        <span>Arena: <strong className="text-slate-500">{q.projectName?.key || 'DSA'}</strong></span>
                                                        <span>•</span>
                                                        <span>Time: <strong className="text-slate-500">{formatTimeSpent(timeSpentSecs)}</strong></span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            const tzOffset = new Date().getTimezoneOffset();
                                                            const res = await TaskApi.toggleReviseTomorrow({
                                                                taskId: q._id,
                                                                reviseTomorrow: !isPinned,
                                                                timezoneOffset: tzOffset
                                                            });
                                                            setDailyRevisionState(res.data?.data);
                                                            dispatch(setDailyRevision(res.data?.data));
                                                            if (!isPinned) {
                                                                toast.success("Pinned to revise again tomorrow! 📌");
                                                            } else {
                                                                toast.success("Removed from tomorrow's list.");
                                                            }
                                                        } catch (err) {
                                                            console.error("Failed to pin task:", err);
                                                            toast.error("Failed to update preference");
                                                        }
                                                    }}
                                                    className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-wider uppercase transition-all shrink-0 active:scale-95 border ${
                                                        isPinned 
                                                        ? 'bg-gradient-to-r from-primary to-vermilion-500 hover:from-primary-dark hover:to-vermilion-600 text-white border-transparent shadow-sm' 
                                                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    {isPinned ? '📌 PINNED' : '🔄 REVISE TOMORROW'}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-8 border-t border-slate-100 flex justify-center bg-slate-50">
                            <button
                                onClick={() => {
                                    const dateStr = dailyRevisionState.dateStr;
                                    localStorage.setItem(`seen_revision_summary_${dateStr}`, "true");
                                    setShowCompletionModal(false);
                                }}
                                className="w-full py-4 rounded-xl text-[10px] font-black text-white bg-gradient-to-r from-primary to-vermilion-500 hover:from-primary-dark hover:to-vermilion-600 shadow-lg shadow-primary/20 transition-all active:scale-95 text-center uppercase tracking-widest"
                            >
                                Unlock All & Continue to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* LeetCode Coding Simulation Modal */}
            <DsaCodingArenaModal
                isOpen={Boolean(codingModalTask)}
                onClose={() => setCodingModalTask(null)}
                task={codingModalTask}
            />
        </div>
    );
};

export default Revision;
