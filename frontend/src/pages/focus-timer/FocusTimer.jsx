import React, { useState, useEffect, useRef } from "react";
import { 
  IoPlay, 
  IoPause, 
  IoSettingsOutline, 
  IoTimeOutline, 
  IoStatsChartOutline,
  IoStop,
  IoFlame,
  IoColorPaletteOutline,
  IoRefreshOutline,
  IoSyncOutline
} from "react-icons/io5";
import moment from "moment";
import { FocusApi } from "../../services/api/Focus.api";
import { TaskApi } from "../../services/api/Task.api";
import { toast } from "react-hot-toast";
import { getScopedItem, setScopedItem, removeScopedItem } from "../../utils/userStorage";
import "./FocusTimer.style.css";

const themes = [
  { name: 'Vermilion', color: '#E34234', bg: 'rgba(227, 66, 52, 0.05)', shadow: 'rgba(227, 66, 52, 0.4)' },
  { name: 'Rose', color: '#e11d48', bg: 'rgba(225, 29, 72, 0.05)', shadow: 'rgba(225, 29, 72, 0.4)' },
  { name: 'Emerald', color: '#10b981', bg: 'rgba(16, 185, 129, 0.05)', shadow: 'rgba(16, 185, 129, 0.4)' },
  { name: 'Amber', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.05)', shadow: 'rgba(245, 158, 11, 0.4)' },
  { name: 'Slate', color: '#475569', bg: 'rgba(71, 85, 105, 0.05)', shadow: 'rgba(71, 85, 105, 0.4)' }
];

const FlipUnit = ({ digit, label }) => {
  return (
    <div className="flip-unit">
      <div className="card-half card-top">
        <span className="digit-text">{digit}</span>
      </div>
      <div className="card-half card-bottom">
        <span className="digit-text">{digit}</span>
      </div>
      <div className="unit-label-new">{label}</div>
    </div>
  );
};

const FocusTimer = () => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [accumulatedTime, setAccumulatedTime] = useState(0); // in seconds
  const [sessions, setSessions] = useState([]);
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [customMinutes, setCustomMinutes] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(themes[0]);
  const [showThemes, setShowThemes] = useState(false);
  const [retrievableObj, setRetrievableObj] = useState(null);
  const [currentTimeMs, setCurrentTimeMs] = useState(Date.now());
  const [autoExtensions, setAutoExtensions] = useState(0);
  
  // Custom Task/Heading Selection
  const [availableTasks, setAvailableTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState("");
  const [customHeading, setCustomHeading] = useState("");
  const [isBindingActive, setIsBindingActive] = useState(false);
  const [isCustomSessionActive, setIsCustomSessionActive] = useState(false);
  
  // Custom Modals and Table Filters
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [filterDate, setFilterDate] = useState("");
  
  // Backlog Modal
  const [showBacklogModal, setShowBacklogModal] = useState(false);
  const [backlogTaskData, setBacklogTaskData] = useState(null);
  const [backlogHoursInput, setBacklogHoursInput] = useState("");

  // Revision Modal
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionNote, setRevisionNote] = useState("");

  const getBindingObj = () => {
    try {
      const val = getScopedItem("focus_timer_task_binding");
      return val ? JSON.parse(val) : null;
    } catch (e) {
      return null;
    }
  };
  const bindingObj = getBindingObj();

  const triggerConfirm = (msg, action) => {
      setConfirmMessage(msg);
      setConfirmAction(() => action); // Need to wrap function to store in state without executing
      setShowConfirm(true);
  };
  
  const timerRef = useRef(null);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await FocusApi.getSessions();
      setSessions(res.data?.data || []);
    } catch (error) {
      console.error("Failed to fetch focus sessions", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTasks = async () => {
    try {
      const res = await TaskApi.getAllTasks({});
      const all = res.data?.data || [];
      const backlogTasks = all.filter(t => {
          const isExplicitBacklog = t.status === 'backlog';
          const isOverdue = t.taskDueDate && moment(t.taskDueDate).isBefore(moment(), 'day') && t.status !== 'done' && t.status !== 'inprogress' && t.status !== 'hold';
          return isExplicitBacklog || isOverdue;
      });
      setAvailableTasks(backlogTasks);
    } catch (e) { console.error("Failed to fetch available tasks", e); }
  };

  // Load state and sessions
  useEffect(() => {
    fetchSessions();
    fetchAvailableTasks();
    const savedState = getScopedItem("focus_timer_state");
    if (savedState) {
      const { timeLeft: sTime, isActive: sActive, startTime: sStart, selectedDuration: sDur, currentTheme: sTheme, accumulatedTime: sAccum, autoExtensions: sExt } = JSON.parse(savedState);
      
      setAccumulatedTime(sAccum || 0);
      setAutoExtensions(sExt || 0);

      if (sActive && sStart) {
        const start = new Date(sStart).getTime();
        const now = Date.now();
        const sessionSeconds = Math.floor((now - start) / 1000);
        const totalSpent = (sAccum || 0) + sessionSeconds;
        const remaining = (sDur * 60) - totalSpent;
        
        setTimeLeft(remaining);
        setIsActive(true);
        
        // If it expired while away, the App.jsx background watcher might have already handled it.
        // But we handle it here too for immediate UI feedback.
        if (remaining === 0) {
           handleComplete(true);
        }
      } else {
        setTimeLeft(sTime);
        setIsActive(sActive);
      }
      
      if (sStart && sActive) setStartTime(new Date(sStart));
      setSelectedDuration(sDur || 25);
      if (sTheme) setCurrentTheme(sTheme);
    }
    
    const { customHeading: sCustomHeading, isCustomSessionActive: sCustomActive } = savedState ? JSON.parse(savedState) : {};
    if (sCustomHeading) setCustomHeading(sCustomHeading);
    if (sCustomActive) setIsCustomSessionActive(sCustomActive);
    
    setIsBindingActive(!!getScopedItem("focus_timer_task_binding"));
    
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
    }

    const savedRetObj = getScopedItem("focus_timer_retrievable");
    if (savedRetObj) {
      setRetrievableObj(JSON.parse(savedRetObj));
    }
    
    const int = setInterval(() => setCurrentTimeMs(Date.now()), 1000);
    return () => clearInterval(int);
  }, []);

  // Persist state
  useEffect(() => {
    const state = {
      timeLeft,
      isActive,
      startTime: startTime ? (startTime instanceof Date ? startTime.toISOString() : startTime) : null,
      accumulatedTime,
      selectedDuration,
      currentTheme,
      customHeading,
      isCustomSessionActive,
      autoExtensions
    };
    setScopedItem("focus_timer_state", state);
  }, [timeLeft, isActive, startTime, accumulatedTime, selectedDuration, currentTheme, customHeading, isCustomSessionActive, autoExtensions]);

  const handleAiChallengeAutoExtend = React.useCallback(async () => {
      playSound();
      showNotification();
      
      const endTime = new Date();
      const actualDuration = selectedDuration;
      
      const bindingObjStr = getScopedItem("focus_timer_task_binding");
      if (!bindingObjStr) return;
      const bindingObj = JSON.parse(bindingObjStr);
      
      const newSession = {
          date: moment().format("YYYY-MM-DD"),
          startTime: startTime || new Date(),
          endTime: endTime,
          duration: actualDuration,
          type: "Focus",
          task: bindingObj.taskId,
          taskName: bindingObj.taskName,
          taskIdString: bindingObj.taskIdString,
          statusAtCompletion: "inprogress",
          completionState: "incompleted",
          estimatedTimeAtStart: selectedDuration,
          isBacklog: false,
          originalDueDate: bindingObj.dueDate
      };
      
      try {
          await FocusApi.createSession(newSession);
          toast.success("AI Challenge block logged. Automatically adding 20 minutes!");
      } catch (err) {
          console.error("Failed to log AI Challenge auto-extend session", err);
      }
      
      const newStartTime = new Date();
      setStartTime(newStartTime);
      setAccumulatedTime(0);
      setSelectedDuration(20);
      setTimeLeft(20 * 60);
      
      const timerState = {
          timeLeft: 20 * 60,
          isActive: true,
          startTime: newStartTime.toISOString(),
          accumulatedTime: 0,
          selectedDuration: 20,
          currentTheme: currentTheme,
          customHeading: bindingObj.taskName,
          isCustomSessionActive: false
      };
      setScopedItem("focus_timer_state", timerState);
  }, [startTime, selectedDuration, currentTheme]);

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        if (startTime) {
          const start = new Date(startTime).getTime();
          const now = Date.now();
          const sessionSeconds = Math.floor((now - start) / 1000);
          const totalSpent = accumulatedTime + sessionSeconds;
          const remaining = (selectedDuration * 60) - totalSpent;
          
          if (remaining <= 0) {
              const bindingObjStr = getScopedItem("focus_timer_task_binding");
              const bindingObj = bindingObjStr ? JSON.parse(bindingObjStr) : null;
              const hasTask = !!bindingObj;
              
              if (bindingObj && bindingObj.taskType === "AI Challenge") {
                  handleAiChallengeAutoExtend();
                  return;
              }
              
              if (hasTask) {
                  if (bindingObj.isRevision) {
                      // Overtime limit: 4 hours for revision (14400s)
                      const limit = 14400;
                      const isOvertimeLimitReached = remaining <= -limit;
                      if (isOvertimeLimitReached) {
                          setTimeLeft(remaining);
                          handleComplete(true);
                          return;
                      }
                      setTimeLeft(remaining);
                      return;
                  }

                  // Regular tasks automatic extension by 30 minutes up to 2 times
                  if (autoExtensions < 2) {
                      setAutoExtensions(prev => prev + 1);
                      setSelectedDuration(prev => prev + 30);
                      toast.success("Focus block ended. Automatically extended by 30 minutes!");
                      playSound();
                      showNotification();
                      return;
                  } else {
                      // Overtime limit reached (total 1 hour overtime)
                      setTimeLeft(remaining);
                      handleComplete(true);
                      return;
                  }
              }

              // Standalone session: auto-log
              setTimeLeft(remaining); 
              handleComplete(true);
              return;
          } else {
              setTimeLeft(remaining);
          }
        } else {
          // Fallback (rarely hits if startTime is used)
          setTimeLeft((prev) => prev - 1);
        }
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isActive, startTime, accumulatedTime, selectedDuration, autoExtensions, handleAiChallengeAutoExtend]);

  const handleStart = () => {
    if (selectedTask && !isBindingActive) {
      const taskObj = availableTasks.find(t => t._id === selectedTask);
      if (taskObj) {
         const isAiChallenge = taskObj.taskType === "AI Challenge";
         const durationMins = isAiChallenge ? 40 : (taskObj.backlogEstimatedHours ? taskObj.backlogEstimatedHours * 60 : (taskObj.estimatedHours ? taskObj.estimatedHours * 60 : 25));
         const isTaskBacklog = taskObj.status === 'backlog' || (taskObj.taskDueDate && moment(taskObj.taskDueDate).isBefore(moment(), 'day') && taskObj.status !== 'done' && taskObj.status !== 'inprogress' && taskObj.status !== 'hold');
         
         const focusTimerBinding = {
             taskId: taskObj._id,
             taskName: taskObj.taskName,
             taskIdString: taskObj.taskId,
             estimatedHours: isAiChallenge ? (40 / 60) : (taskObj.backlogEstimatedHours || taskObj.estimatedHours || 0),
             dueDate: taskObj.taskDueDate,
             isBacklog: isTaskBacklog,
             taskType: taskObj.taskType
         };
         setScopedItem("focus_timer_task_binding", focusTimerBinding);
         setIsBindingActive(true);
         if (durationMins > 0) {
             setSelectedDuration(durationMins);
             setTimeLeft(durationMins * 60);
         }
      }
    } else if (!selectedTask && !isBindingActive) {
      setIsCustomSessionActive(true);
    }

    setIsActive(true);
    setStartTime(new Date());
  };

  const handleStop = () => {
    if (isActive && startTime) {
      const sessionSeconds = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
      setAccumulatedTime(prev => prev + sessionSeconds);
    }
    setIsActive(false);
    setStartTime(null);
  };

  const handleReset = () => {
     triggerConfirm("End session early? Your progress will be saved in the logs.", () => handleComplete(false));
  };

  const resetToDefault = () => {
    setIsActive(false);
    setStartTime(null);
    setAccumulatedTime(0);
    setTimeLeft(25 * 60);
    setSelectedDuration(25);
    setAutoExtensions(0);
    setIsBindingActive(false);
    setIsCustomSessionActive(false);
    setSelectedTask("");
    setCustomHeading("");
    setCustomMinutes("");
    removeScopedItem("focus_timer_task_binding");
    removeScopedItem("focus_timer_state");
    toast.success("Timer reset to default");
  };

  const setDuration = (mins) => {
    if (isActive) return;
    setSelectedDuration(mins);
    setTimeLeft(mins * 60);
    setAccumulatedTime(0);
    setStartTime(null);
    setAutoExtensions(0);
  };

  const playSound = () => {
    const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
    audio.play().catch(e => console.error("Audio play failed:", e));
  }

  const showNotification = () => {
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Focus Session Complete", {
            body: "Great job! Your focus session has ended.",
            icon: "/favicon.ico"
        });
    }
  }

  const handleComplete = async (isExpiration = false) => {
    setIsActive(false);
    playSound();
    showNotification();
    const endTime = new Date();
    // actualElapsedSeconds accounts for overtime (timeLeft can be negative)
    const actualElapsedSeconds = (selectedDuration * 60) - timeLeft;
    const actualDuration = Math.max(Math.round(actualElapsedSeconds / 60), 1); 
    
    let taskMeta = {};
    let activeBinding = null;
    const bindingObjStr = getScopedItem("focus_timer_task_binding");
    
    if (bindingObjStr) {
       activeBinding = JSON.parse(bindingObjStr);
       taskMeta = {
           task: activeBinding.taskId,
           taskName: activeBinding.taskName,
           taskIdString: activeBinding.taskIdString,
           statusAtCompletion: isExpiration ? "backlog" : "done",
           completionState: isExpiration ? "incompleted" : "completed",
           estimatedTimeAtStart: activeBinding.estimatedHours * 60 || selectedDuration
       };

       if (isExpiration) {
          // Check if due date has actually passed before relegating to backlog
          const hasExpired = activeBinding.dueDate ? moment(activeBinding.dueDate).isBefore(moment(), 'day') : true;

          if (hasExpired) {
              try {
                await TaskApi.taskLogs(activeBinding.taskId, { status: "backlog" });
                setBacklogTaskData(activeBinding);
                // setShowBacklogModal(true); // Disabled to prevent user disturbance
                taskMeta.statusAtCompletion = "backlog";
                taskMeta.completionState = "incompleted";
              } catch(e) { 
                console.error("Failed to relegate task to backlog", e);
                toast.error("Failed to update task status to backlog on server.");
              }
          } else {
              // Due date still in future: just log as hold/inprogress as usual
              taskMeta.statusAtCompletion = isExpiration ? "inprogress" : "done";
              taskMeta.completionState = "incompleted";
              toast.success("Focus block ended. Task remains active as due date hasn't passed.");
          }
       }
    }

    try {
      const isBacklogTask = activeBinding?.isBacklog || false;
      const originalDueDate = activeBinding?.dueDate || null;
      
      const newSession = {
        date: moment().format("YYYY-MM-DD"),
        startTime: startTime || new Date(), // segment start
        endTime: endTime,
        duration: actualDuration,
        type: "Focus",
        task: activeBinding?.taskId || null,
        taskName: activeBinding ? (isBacklogTask ? `${activeBinding.taskName} (Backlog)` : activeBinding.taskName) : (customHeading || "Standalone Session"),
        taskIdString: activeBinding?.taskIdString || "N/A",
        isBacklog: isBacklogTask,
        originalDueDate: originalDueDate,
        ...taskMeta
      };

      const res = await FocusApi.createSession(newSession);
      const newSavedSession = res.data?.data;
      
      if (newSavedSession && newSavedSession._id) {
          const retObj = {
            id: newSavedSession._id,
            timeLeftAtStop: timeLeft,
            selectedDuration: selectedDuration,
            endTime: endTime.getTime()
          };
          setScopedItem("focus_timer_retrievable", retObj);
          setRetrievableObj(retObj);
      }

      fetchSessions();
      removeScopedItem("focus_timer_state");
      removeScopedItem("focus_timer_task_binding");
      setIsBindingActive(false);
      setIsCustomSessionActive(false);
      setSelectedTask("");
      setCustomHeading("");
      setStartTime(null);
      setAccumulatedTime(0);
      setTimeLeft(selectedDuration * 60);
      setAutoExtensions(0);
      toast.success("Focus session logged successfully!");
    } catch (error) {
      console.error("Failed to save focus session", error);
      toast.error("Failed to save focus session to server. Please check your connection and try again.");
    }
  };

  const handleEndRevision = () => {
    setShowRevisionModal(true);
  };

  const handleSubmitRevisionLog = async () => {
    if (isActive && startTime) {
      const sessionSeconds = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
      setAccumulatedTime(prev => prev + sessionSeconds);
    }
    
    setIsActive(false);
    playSound();
    showNotification();
    
    const endTime = new Date();
    const bindingObjStr = getScopedItem("focus_timer_task_binding");
    if (bindingObjStr) {
      try {
        const bindingObj = JSON.parse(bindingObjStr);
        // actualElapsedSeconds accounts for overtime (timeLeft can be negative)
        const actualElapsedSeconds = (selectedDuration * 60) - timeLeft;
        const actualDuration = Math.max(Math.round(actualElapsedSeconds / 60), 1);
        
        const newSession = {
          date: moment().format("YYYY-MM-DD"),
          startTime: startTime || new Date(),
          endTime: endTime,
          duration: actualDuration,
          type: "Focus",
          task: bindingObj.taskId || null,
          taskName: bindingObj.taskName,
          taskIdString: bindingObj.taskIdString || "N/A",
          statusAtCompletion: "done",
          completionState: "completed",
          estimatedTimeAtStart: selectedDuration
        };

        await FocusApi.createSession(newSession);
        await TaskApi.addRevision(bindingObj.taskId, { notes: revisionNote || "Completed revision focus session" });
        toast.success("Revision and Focus session logged successfully!");

        // Reset everything ONLY on success
        removeScopedItem("focus_timer_state");
        removeScopedItem("focus_timer_task_binding");
        setIsBindingActive(false);
        setIsCustomSessionActive(false);
        setSelectedTask("");
        setCustomHeading("");
        setRevisionNote("");
        setShowRevisionModal(false);
        setStartTime(null);
        setAccumulatedTime(0);
        setTimeLeft(25 * 60);
        setSelectedDuration(25);
        setAutoExtensions(0);
        fetchSessions();
      } catch (err) {
        console.error("Failed to complete revision focus log", err);
        toast.error("Failed to log revision. Session data preserved.");
      }
    }
  };

  const handleDeleteSession = async (sessionId) => {
    triggerConfirm("Permanently delete this timer log?", async () => {
        try {
          await FocusApi.deleteSession(sessionId);
          fetchSessions();
          if (retrievableObj?.id === sessionId) {
             setRetrievableObj(null);
             removeScopedItem("focus_timer_retrievable");
          }
        } catch (err) {
          console.error("Failed to delete session", err);
        }
    });
  };

  const handleRetrieveSession = async (session) => {
    try {
      await FocusApi.deleteSession(session._id);
      fetchSessions();
      
      let newTimeLeft = session.duration * 60;
      let newSelectedDuration = session.duration;

      if (retrievableObj && retrievableObj.id === session._id) {
         newSelectedDuration = retrievableObj.selectedDuration;
         newTimeLeft = retrievableObj.timeLeftAtStop;
         setRetrievableObj(null);
         removeScopedItem("focus_timer_retrievable");
      } else {
         if (newSelectedDuration < 15) newSelectedDuration = 15;
      }
      
      setSelectedDuration(newSelectedDuration);
      setTimeLeft(newTimeLeft);
      setStartTime(new Date());
      setIsActive(true);
    } catch (err) {
      console.error("Failed to retrieve session", err);
    }
  };

  const handleSubmitBacklog = async () => {
    if (!backlogHoursInput || isNaN(backlogHoursInput)) return;
    try {
      await TaskApi.updateTask(backlogTaskData.taskId, { backlogEstimatedHours: parseFloat(backlogHoursInput) });
      setShowBacklogModal(false);
      setBacklogTaskData(null);
      setBacklogHoursInput("");
    } catch(e) {
      console.error("Failed to save backlog estimate", e);
    }
  };

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const pad = (n) => {
    const absN = Math.abs(n);
    return absN < 10 ? `0${absN}` : absN;
  };
  const isOvertime = timeLeft < 0;
  const hStr = pad(hours).toString();
  const mStr = pad(minutes).toString();
  const sStr = pad(seconds).toString();

  const statsDate = filterDate ? moment(filterDate) : moment();
  const isToday = statsDate.isSame(moment(), 'day');
  const statsSessions = sessions.filter(s => moment(s.date).isSame(statsDate, 'day'));
  const totalFocused = statsSessions.reduce((acc, s) => acc + s.duration, 0);

  const formattedHours = Math.floor(totalFocused / 60);
  const formattedMins = totalFocused % 60;
  const displayTotalTime = formattedHours > 0 ? `${formattedHours}h ${formattedMins}m` : `${formattedMins}m`;

  const filteredSessions = sessions.filter(s => {
    if (filterDate) return moment(s.date).isSame(filterDate, 'day');
    return true;
  });

  const themeVars = {
    '--theme-primary': currentTheme.color,
    '--theme-bg': currentTheme.bg,
    '--theme-shadow': currentTheme.shadow
  };

  return (
    <div className="focus-timer-page animate-in fade-in duration-700" style={themeVars}>
      
      {/* Main Focus Card */}
      <div className="focus-main-card">
          <div className="focus-header">
             <div className="focus-title-group">
                 <h2>{isActive ? "Deep Session" : "Focus Studio"}</h2>
                 <p>{isActive ? "Work hard, stay silent." : "Set your goal and start."}</p>
             {bindingObj && bindingObj.isBacklog && (
                 <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 bg-red-100 text-red-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-red-200">
                     <IoFlame /> Backlog Completion: Due {bindingObj.dueDate ? moment(bindingObj.dueDate).format("MMM DD") : "Overdue"}
                 </div>
             )}
             </div>
             <div className="header-actions relative">
               <button 
                  onClick={() => setShowThemes(!showThemes)} 
                  className="icon-btn focus:ring-2 ring-primary/20 flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"
                  style={{ color: 'var(--theme-primary)' }}
               >
                  <IoColorPaletteOutline size={20} />
                  <span className="text-sm font-semibold">Theme</span>
               </button>
               
               {showThemes && (
                 <div className="absolute right-0 top-12 bg-white shadow-xl border border-slate-100 rounded-xl p-2 flex flex-col gap-1 z-50 min-w-[120px]">
                    {themes.map(t => (
                      <button 
                        key={t.name}
                        onClick={() => { setCurrentTheme(t); setShowThemes(false); }}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-sm font-semibold !text-slate-700"
                      >
                         <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.color }}></div>
                         {t.name}
                      </button>
                    ))}
                 </div>
               )}
            </div>
         </div>

          <div className="flex flex-col items-center justify-center mt-6 mb-2 max-w-md mx-auto w-full px-4">
             {!isActive && !isBindingActive && !isCustomSessionActive ? (
                <div className="w-full flex flex-col gap-3 relative z-10 animate-in slide-in-from-bottom-2 duration-500">
                    <select 
                        value={selectedTask}
                        onChange={(e) => {
                            setSelectedTask(e.target.value);
                            setCustomHeading("");
                        }}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    >
                        <option value="">-- Select a Backlog Task --</option>
                        {Object.entries(
                            availableTasks.reduce((acc, t) => {
                                const pName = t.projectName?.name || 'Independent / No Project';
                                if (!acc[pName]) acc[pName] = [];
                                acc[pName].push(t);
                                return acc;
                            }, {})
                        ).map(([project, tasks]) => (
                            <optgroup key={project} label={project}>
                                {tasks.map(t => (
                                    <option key={t._id} value={t._id}>
                                        {t.taskId || '#' + t._id.slice(-4)} - {t.taskName}
                                    </option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                    {!selectedTask && (
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">OR</span>
                            </div>
                            <input 
                                type="text"
                                placeholder="Enter custom heading..."
                                value={customHeading}
                                onChange={(e) => setCustomHeading(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-12 pr-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            />
                        </div>
                    )}
                </div>
             ) : (
                <div className="w-full flex items-center gap-2">
                    <div className="flex-1 px-4 py-3 bg-white/50 backdrop-blur-sm border border-slate-200 rounded-xl text-center shadow-sm">
                        <span className="text-sm font-bold text-slate-700">
                            {isBindingActive && bindingObj ? bindingObj.taskName : (customHeading || "Standalone Session")}
                        </span>
                    </div>
                    {!isActive && (
                        <button 
                            onClick={resetToDefault}
                            className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 transition-all shadow-sm group"
                            title="Reset Timer & Task"
                        >
                            <IoRefreshOutline size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                        </button>
                    )}
                </div>
             )}
          </div>

         <div className="clock-container">
            <div className="clock-group">
               <FlipUnit digit={hStr[0]} label="HRS" />
               <FlipUnit digit={hStr[1]} label="HRS" />
            </div>
            <div className="clock-sep">:</div>
            <div className="clock-group">
               <FlipUnit digit={mStr[0]} label="MINS" />
               <FlipUnit digit={mStr[1]} label="MINS" />
            </div>
            <div className="clock-sep">:</div>
            <div className="clock-group">
               <FlipUnit digit={sStr[0]} label="SECS" />
               <FlipUnit digit={sStr[1]} label="SECS" />
            </div>
            {isOvertime && (
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-rose-200 animate-bounce">
                Overtime Active
              </div>
            )}
         </div>

         <div className="timer-controls-group">
            <div className="duration-presets">
                {[15, 25, 45, 60].map(mins => (
                    <button 
                        key={mins}
                        onClick={() => setDuration(mins)}
                        className={`preset-btn ${selectedDuration === mins ? 'active' : ''} ${isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {mins}m
                    </button>
                ))}
                
                <div className="manual-input-wrapper">
                    <input 
                        type="number" 
                        placeholder="Custom" 
                        value={customMinutes}
                        onChange={(e) => {
                            const val = e.target.value;
                            setCustomMinutes(val);
                            if (val && !isNaN(val)) setDuration(parseInt(val));
                        }}
                        disabled={isActive}
                        className="manual-input"
                    />
                    <span className="unit" style={{ color: 'var(--theme-primary)' }}>m</span>
                </div>
            </div>

            <button 
                onClick={isActive ? handleStop : handleStart} 
                className={`action-btn-main ${isActive ? 'active' : ''}`}
            >
               {isActive ? <IoPause /> : <IoPlay />}
               <span>{isActive ? "Pause" : "Start"}</span>
            </button>

             {isBindingActive && bindingObj && bindingObj.isRevision ? (
                 <button onClick={handleEndRevision} className="text-primary dark:text-vermilion-400 font-bold text-sm hover:underline mt-2 flex items-center gap-1 justify-center">
                     <IoSyncOutline className="animate-spin-slow" /> End & Log Revision
                 </button>
             ) : (
                 (isActive || isBindingActive) && (
                     <button onClick={handleReset} className="text-rose-500 font-bold text-sm hover:underline mt-2">
                         End & Save Session
                     </button>
                 )
             )}
         </div>
      </div>

      {/* Stats Quick View */}
      <div className="session-stats-grid">
         <div className="mini-stat-card">
            <span className="label font-bold uppercase tracking-tighter text-slate-400">{isToday ? "Today's Sessions" : `Sessions on ${statsDate.format("MMM DD")}`}</span>
            <span className="value">{statsSessions.length}</span>
            <span className="sub">Target: 8 sessions</span>
         </div>
         <div className="mini-stat-card shadow-xl" style={{ borderColor: 'var(--theme-bg)', boxShadow: '0 20px 25px -5px var(--theme-shadow)'}}>
            <span className="label font-bold uppercase tracking-tighter text-slate-400">Total Focused Time</span>
            <span className="value" style={{ color: 'var(--theme-primary)' }}>{displayTotalTime}</span>
            <span className="sub">{isToday ? "Consistently tracked today" : `Tracked on ${statsDate.format("MMM DD")}`}</span>
         </div>
         <div className="mini-stat-card">
            <span className="label font-bold uppercase tracking-tighter text-slate-400">Current Streak</span>
            <span className="value">5</span>
            <span className="sub">Days consistent</span>
         </div>
      </div>

      {/* Custom Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowConfirm(false)}></div>
           <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm flex flex-col gap-4 animate-in zoom-in-95 duration-200">
              <h3 className="text-xl font-bold text-slate-800">Please Confirm</h3>
              <p className="text-slate-600 text-sm font-medium">{confirmMessage}</p>
              <div className="flex items-center gap-3 mt-2 justify-end">
                <button 
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 font-bold hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                      if (confirmAction) confirmAction();
                      setShowConfirm(false);
                  }}
                  className="px-4 py-2 rounded-xl font-bold text-white shadow-lg transition-transform hover:scale-105"
                  style={{ backgroundColor: 'var(--theme-primary)' }}
                >
                  Confirm Action
                </button>
              </div>
           </div>
        </div>
      )}

      {/* Backlog Estimator Modal */}
      {showBacklogModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-red-900/40 backdrop-blur-sm"></div>
           <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md flex flex-col gap-4 animate-in zoom-in-95 duration-200 border border-slate-100">
              <div className="flex items-center gap-3 text-rose-500">
                 <IoTimeOutline size={28} />
                 <h3 className="text-xl font-bold text-slate-800">Time Expired</h3>
              </div>
              <p className="text-slate-600 text-sm font-medium">Your timer elapsed completely for <strong className="text-slate-800">{backlogTaskData?.taskName}</strong> without being marked as done. This task has been automatically moved to the <strong>Backlog</strong>.</p>
              <p className="text-slate-600 text-sm font-medium mt-2">Please provide a new time estimate (in hours) required to complete this task so it can be re-assigned effectively.</p>
              
              <div className="mt-4">
                 <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">New Backlog Estimate (Hours)</label>
                 <input 
                    type="number" 
                    step="0.5" 
                    placeholder="e.g. 1.5"
                    value={backlogHoursInput}
                    onChange={(e) => setBacklogHoursInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-colors"
                 />
              </div>

              <div className="flex items-center gap-3 mt-4 justify-end">
                <button 
                  onClick={handleSubmitBacklog}
                  disabled={!backlogHoursInput}
                  className="w-full px-4 py-3 rounded-xl font-bold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 bg-rose-500 hover:bg-rose-600"
                >
                  Save Backlog Estimate
                </button>
              </div>
           </div>
        </div>
      )}

      {/* Revision Logging Modal */}
      {showRevisionModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowRevisionModal(false)}></div>
           <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md flex flex-col gap-4 animate-in zoom-in-95 duration-200 border border-slate-100">
              <div className="flex items-center gap-3 text-primary">
                 <IoSyncOutline size={28} className="animate-spin-slow" />
                 <h3 className="text-xl font-bold text-slate-800">Log Revision</h3>
              </div>
              <p className="text-slate-600 text-sm font-medium">
                 Ready to complete your revision for <strong>{bindingObj?.taskName}</strong>? Enter any insights or notes below.
              </p>
              
              <div className="mt-4">
                 <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Revision Notes / Key Findings</label>
                 <textarea 
                    rows="4"
                    placeholder="E.g., solved using binary search, optimized time complexity to O(log N)..."
                    value={revisionNote}
                    onChange={(e) => setRevisionNote(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none text-sm"
                 />
              </div>

              <div className="flex items-center gap-3 mt-4 justify-end">
                <button 
                  onClick={() => setShowRevisionModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 font-bold hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSubmitRevisionLog}
                  className="px-5 py-2.5 rounded-xl font-bold text-white shadow-lg bg-primary hover:bg-primaryHover transition-transform active:scale-95"
                >
                  Log Revision & Save Timer
                </button>
              </div>
           </div>
        </div>
      )}
 
      {/* Tabular Reporting Section */}
      <div className="recent-logs-section">
         <div className="section-header flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex flex-col gap-1">
               <h3 className="text-2xl">Session Reports</h3>
               <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Detailed Log Registry</p>
            </div>
            
            <div className="flex items-center gap-3">
                <input 
                   type="date"
                   value={filterDate}
                   onChange={e => setFilterDate(e.target.value)}
                   className="bg-slate-50 border border-slate-200 text-slate-600 rounded-lg px-3 py-1.5 text-xs font-bold w-[140px] focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                />
                {filterDate && (
                  <button onClick={() => setFilterDate("")} className="text-[10px] text-slate-400 hover:text-slate-600 font-bold uppercase">Clear</button>
                )}
                <button onClick={fetchSessions} className="text-xs font-black uppercase tracking-widest flex items-center gap-1 bg-white border border-slate-100 shadow-sm px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors" style={{ color: 'var(--theme-primary)' }}>
                    <IoStatsChartOutline /> Refresh
                </button>
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
               <thead>
                  <tr className="border-b border-slate-100">
                     <th className="py-4 px-4 text-xs font-black text-slate-400 uppercase tracking-widest">Date / Time</th>
                     <th className="py-4 px-4 text-xs font-black text-slate-400 uppercase tracking-widest">Task Detail</th>
                     <th className="py-4 px-4 text-xs font-black text-slate-400 uppercase tracking-widest">Est / Actual</th>
                     <th className="py-4 px-4 text-xs font-black text-slate-400 uppercase tracking-widest">Status / Outcome</th>
                     <th className="py-4 px-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {filteredSessions.map((session, idx) => {
                      const isRecent = (currentTimeMs - new Date(session.endTime).getTime()) <= 120000;
                      const hasTask = !!session.taskIdString;
                      
                      return (
                      <tr key={idx} className="hover:bg-slate-50/70 transition-colors group">
                         <td className="py-4 px-4">
                            <div className="flex flex-col gap-1">
                               <span className="text-sm font-bold text-slate-800">{moment(session.date).format("MMM DD, YYYY")}</span>
                               <span className="text-[10px] font-bold text-slate-400">{moment(session.startTime).format("HH:mm")} - {moment(session.endTime).format("HH:mm")}</span>
                            </div>
                         </td>
                         <td className="py-4 px-4">
                            {hasTask ? (
                               <div className="flex flex-col gap-1">
                                  <span className="text-sm font-bold text-slate-800 max-w-[200px] truncate" title={session.taskName}>{session.taskName}</span>
                                  <span className="text-[10px] font-black text-slate-400 font-mono">{session.taskIdString}</span>
                               </div>
                            ) : (
                               <span className="text-xs font-bold text-slate-400 italic">Standalone Session</span>
                            )}
                         </td>
                         <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                               {hasTask && session.estimatedTimeAtStart && (
                                   <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-xs font-bold" title="Estimated">
                                      {session.estimatedTimeAtStart}m
                                   </span>
                               )}
                               <span className="px-2 py-1 font-bold text-xs rounded" style={{ backgroundColor: 'var(--theme-bg)', color: 'var(--theme-primary)' }} title="Actual logged">
                                  {session.duration}m
                               </span>
                            </div>
                         </td>
                         <td className="py-4 px-4">
                            {hasTask && (
                                <div className="flex gap-2 items-center">
                                    <span className={`px-2 py-1 text-[10px] uppercase tracking-wider font-bold rounded-full border ${session.completionState === 'completed' ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : 'text-amber-600 border-amber-200 bg-amber-50'}`}>
                                        {session.completionState || 'N/A'}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400">
                                        &rarr; {session.statusAtCompletion?.toUpperCase()}
                                    </span>
                                </div>
                            )}
                         </td>
                         <td className="py-4 px-4 text-right">
                             {isRecent ? (
                                <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleRetrieveSession(session)} className="px-3 py-1.5 text-[10px] font-bold text-white bg-amber-500 rounded-lg hover:bg-amber-600 shadow-sm transition-colors">Restore Timer</button>
                                    <button onClick={() => handleDeleteSession(session._id)} className="px-3 py-1.5 text-[10px] font-bold text-rose-500 bg-rose-50 border border-rose-100 rounded-lg hover:bg-rose-500 hover:text-white shadow-sm transition-colors">Delete Log</button>
                                </div>
                             ) : (
                                <span className="text-[10px] text-slate-300 font-bold italic">Locked</span>
                             )}
                         </td>
                      </tr>
                  )})}
                  {filteredSessions.length === 0 && (
                      <tr>
                         <td colSpan="5" className="py-12 text-center text-sm font-medium text-slate-400 italic">
                             No matching logs found for this filter.
                         </td>
                      </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>

    </div>
  );
};

export default FocusTimer;
