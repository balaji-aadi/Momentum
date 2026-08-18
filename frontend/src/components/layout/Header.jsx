import React, { useEffect, useState, useRef } from 'react';
import { IoNotificationsOutline, IoSearchOutline, IoCalendarOutline, IoTimeOutline, IoCloseCircleOutline, IoLinkOutline, IoMenuOutline } from 'react-icons/io5';
import { LuTrophy } from 'react-icons/lu';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { ProjectApi } from '../../services/api/Project.api';
import { ProblemApi } from '../../services/api/Problem.api';
import { useSocket } from '../../SocketProvider';
import { NotificationApi } from '../../services/api/notification.api';
import { UserApi } from '../../services/api/user.api';
import { TaskApi } from '../../services/api/Task.api';
import { messaging } from '../../firebaseConfig';
import { getToken } from 'firebase/messaging';
import { useSelector, useDispatch } from 'react-redux';
import { useLoading } from '../loader/LoaderContext';
import { setShowConsistencyModal, setGlobalSearch } from '../../store/slices/storeSlice';
import moment from 'moment';
import toast from 'react-hot-toast';

const Header = ({ toggleSidebar }) => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");
  const [projectName, setProjectName] = useState("");
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const notificationRef = useRef();
  const searchRef = useRef();

  const [userXp, setUserXp] = useState(() => Number(localStorage.getItem('sarthi_user_xp') || 0));

  useEffect(() => {
    const syncXp = () => {
      const saved = localStorage.getItem('sarthi_user_xp');
      setUserXp(saved !== null ? Number(saved) : 0);
    };
    window.addEventListener('storage', syncXp);
    return () => window.removeEventListener('storage', syncXp);
  }, []);

  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const { globalSearch, activeBranch, currentUser, dailyRevision } = useSelector((state) => state.store);
  const isLocked = dailyRevision && dailyRevision.isStarted && !dailyRevision.isCompleted;

  const {
    isNotification,
    setIsNotification,
    notificationData,
    getAllNotification,
  } = useSocket();

  const { handleLoading } = useLoading();

  useEffect(() => {
    const fetchProjectName = async () => {
      if (projectId && activeBranch) {
        try {
          const res = await ProjectApi.project(projectId);
          setProjectName(res.data?.data?.name || "Project");
        } catch (error) {
          console.error("Failed to fetch project name", error);
          setProjectName("Project");
        }
      } else {
        setProjectName("");
      }
    };
    fetchProjectName();
  }, [projectId]);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/arenas')) return 'Arenas';
    if (path.includes('/task')) return 'Tasks';
    if (path.includes('/user')) return 'Users';
    if (path.includes('/testing')) return 'Testing';
    if (path.includes('/dsa-management') || path.includes('/dsa')) return 'Studio';
    return 'Dashboard';
  };

  // Notification Logic
  const handleNavigateToNotification = () => {
    navigate("/notification");
    setShowDropdown(false);
  };

  const handleMarkAllAsRead = async () => {
    try {
      await NotificationApi.markAllAsRead();
      getAllNotification();
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const groupNotificationsByDay = (notifications) => {
    if (!notifications) return [];
    const today = moment().startOf('day');
    const yesterday = moment().subtract(1, 'days').startOf('day');

    const groups = [];
    let currentDate = null;
    let currentGroup = null;

    notifications.forEach(notification => {
      const notificationDate = moment(notification.createdAt);
      let dateLabel;

      if (notificationDate.isSame(today, 'd')) {
        dateLabel = 'Today';
      } else if (notificationDate.isSame(yesterday, 'd')) {
        dateLabel = 'Yesterday';
      } else if (notificationDate.isAfter(moment().subtract(7, 'days'))) {
        dateLabel = notificationDate.format('dddd');
      } else {
        dateLabel = notificationDate.format('MMM D, YYYY');
      }

      if (dateLabel !== currentDate) {
        currentDate = dateLabel;
        currentGroup = {
          dateLabel,
          notifications: []
        };
        groups.push(currentGroup);
      }

      currentGroup.notifications.push(notification);
    });

    return groups;
  };

  const handleUpdateNotify = async (data) => {
    const id = data?._id;

    if (
      data?.title === "Task created for you" ||
      data?.title === "Task updated for you"
    ) {
      navigate(`/task/dashboard?projectId=${data?.projectId?._id}`);
    } else if (
      data?.title === "Test created for you" ||
      data?.title === "Test updated for you"
    ) {
      navigate(
        `/testing/my-task?type=Test Case&projectId=${data?.projectId?._id}`
      );
    } else if (
      data?.title === "Bug created for you" ||
      data?.title === "Bug updated for you"
    ) {
      navigate(
        `/testing/my-task?type=Bug Reporting&projectId=${data?.projectId?._id}`
      );
    }
    try {
      await NotificationApi.updateStatus(id);
      setTimeout(() => {
        getAllNotification();
      }, 1000);
      setShowDropdown(false);
    } catch (err) {
      console.log(err);
    }
  };

  const requestPermission = async (userId) => {
    try {
      const registration = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js"
      );
      console.log("Service Worker registered successfully:", registration);

      if (!messaging) {
        console.log("Messaging instance not yet initialized.");
        return;
      }

      const token = await getToken(messaging, {
        vapidKey:
          "BPuhQ5iZ4rOcxGmyJ5mEcItRY2RlzEKhzwHC9RwTIbvD694R4p_xdGen-C--tULAPhVUmb_kfMOQcjy5NIOzKzw",
      });

      if (token) {
        const payload = {
          user_id: userId || null,
          fcm_token: token,
          device_type: "web",
        };

        (async () => {
          try {
            const res = await UserApi.saveFcmToken(payload);
            console.log("This is the response of the fcm token ", res.data);
          } catch (err) {
            console.log(err);
          }
        })();
      } else {
        console.log("No registration token available.");
      }
    } catch (error) {
      console.error("Error getting token:", error);
    }
  };

  useEffect(() => {
    if (activeBranch) {
      getAllNotification();
    }
  }, [activeBranch]);

  useEffect(() => {
    if (currentUser?._id && activeBranch) {
      requestPermission(currentUser._id);
    }
    const saved = localStorage.getItem('recentSearches');
    if (saved) setRecentSearches(JSON.parse(saved));
  }, [currentUser, activeBranch]);

  // Enhanced debounced suggestion fetching across DSA Problems, Tasks, and Arenas
  useEffect(() => {
    const trimmed = (globalSearch || '').trim();
    if (!trimmed || trimmed.length < 2) {
      setSuggestions([]);
      return;
    }

    const handler = setTimeout(async () => {
      try {
        const results = [];

        // 1. Fetch DSA Problems
        try {
          const problemRes = await ProblemApi.getProblems({ search: trimmed, limit: 5 });
          const problemItems = (problemRes.data?.data || []).slice(0, 4).map(p => ({
            type: 'dsa_problem',
            label: p.title,
            id: p._id,
            slug: p.slug
          }));
          results.push(...problemItems);
        } catch (e) {
          console.error("DSA problem search error", e);
        }

        // 2. Fetch Tasks with Arena metadata
        try {
          const taskRes = await TaskApi.getAllTasks({}, trimmed);
          const taskItems = (taskRes.data?.data || [])
            .filter(t => t.taskName?.toLowerCase().includes(trimmed.toLowerCase()))
            .slice(0, 4)
            .map(t => {
              const projObj = typeof t.projectId === 'object' ? t.projectId : (typeof t.projectName === 'object' ? t.projectName : null);
              const projId = projObj ? (projObj._id || projObj.id) : (t.projectId || t.projectName);
              const projName = projObj ? projObj.name : null;
              const projSlug = projObj ? (projObj.key?.toLowerCase() || projObj.name?.toLowerCase().replace(/\s+/g, '-')) : null;
              return {
                type: 'task',
                label: t.taskName,
                id: t._id,
                projectId: projId,
                projectName: projName,
                projectSlug: projSlug
              };
            });
          results.push(...taskItems);
        } catch (e) {
          console.error("Task search error", e);
        }

        // 3. Fetch Arenas / Projects
        try {
          const projectRes = await ProjectApi.getAllProjects();
          const projectItems = (projectRes.data?.data || [])
            .filter(p => p.name?.toLowerCase().includes(trimmed.toLowerCase()))
            .slice(0, 3)
            .map(p => ({
              type: 'project',
              label: p.name,
              id: p._id,
              key: p.key,
              slug: p.key?.toLowerCase() || p.name.toLowerCase().replace(/\s+/g, '-')
            }));
          results.push(...projectItems);
        } catch (e) {
          console.error("Project search error", e);
        }

        setSuggestions(results);
      } catch (err) {
        console.error("Suggestion fetch failed", err);
      }
    }, 250);

    return () => clearTimeout(handler);
  }, [globalSearch]);

  const handleSearchChange = (val) => {
    dispatch(setGlobalSearch(val));
    setIsTyping(true);
  };

  const saveToHistory = (query) => {
    if (!query || query.trim() === "") return;
    const cleanQuery = query.trim();
    const updated = [cleanQuery, ...recentSearches.filter(s => s !== cleanQuery)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const handleClearSearch = () => {
    dispatch(setGlobalSearch(''));
  };

  const handleSearchSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!globalSearch || !globalSearch.trim()) return;
    const term = globalSearch.trim();
    saveToHistory(term);
    setShowSearchDropdown(false);

    // If already on an Arena board, Task board, or Studio page, filter in place (keep URL clean!)
    if (
      location.pathname.startsWith('/arena/') ||
      location.pathname.startsWith('/task/dashboard') ||
      location.pathname.startsWith('/dsa-management')
    ) {
      return;
    }

    // If on another page (Focus Timer, Settings, etc.), route to the clean Arena URL for matching task
    try {
      const taskRes = await TaskApi.getAllTasks({}, term);
      const foundTasks = (taskRes.data?.data || []).filter(t => t.taskName?.toLowerCase().includes(term.toLowerCase()));
      if (foundTasks.length > 0) {
        const topTask = foundTasks[0];
        const projObj = typeof topTask.projectId === 'object' ? topTask.projectId : (typeof topTask.projectName === 'object' ? topTask.projectName : null);
        if (projObj) {
          const arenaSlug = projObj.key?.toLowerCase() || projObj.name?.toLowerCase().replace(/\s+/g, '-');
          navigate(`/arena/${arenaSlug}`);
          return;
        }
      }
    } catch (err) {
      console.error("Task search routing failed", err);
    }

    // Fallback to task dashboard cleanly
    navigate('/task/dashboard');
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Link copied to clipboard!");
    }).catch(err => {
      console.error("Copy failed", err);
      toast.error("Failed to copy link");
    });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const notificationIconClass = isNotification ? "shake" : "";

  return (
    <header className="h-16 bg-surface border-b border-borderLight px-4 lg:px-8 flex items-center justify-between sticky top-0 z-[100]">
      {/* Breadcrumbs / Page Title */}
      <div className="flex items-center gap-1 sm:gap-4 overflow-hidden">
        {/* Hamburger Menu Toggler */}
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 text-textSub hover:text-textMain hover:bg-slate-100/80 rounded-xl transition-all shrink-0"
          aria-label="Toggle Sidebar"
        >
          <IoMenuOutline size={22} />
        </button>

        <div className="flex items-center text-xs sm:text-sm text-textSub whitespace-nowrap overflow-hidden">
          <span className="hover:text-textMain cursor-pointer shrink-0">{getPageTitle()}</span>
          {projectName && (
            <div className="flex items-center min-w-0 ml-1 sm:ml-2">
              <span className="mx-1 sm:mx-2 shrink-0">/</span>
              <span className="font-semibold text-textMain flex items-center gap-1 sm:gap-2 truncate max-w-[100px] sm:max-w-none">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary shrink-0"></span>
                <span className="truncate">{projectName}</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="relative hidden md:block" ref={searchRef}>
          <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-textSub z-10" />
          <form onSubmit={(e) => { if (isLocked) { e.preventDefault(); return; } handleSearchSubmit(e); }}>
            <input
              type="text"
              placeholder={isLocked ? "Complete Revision to Search... 🔒" : "Search tasks, studio problems, arenas..."}
              value={globalSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => { if (!isLocked) setShowSearchDropdown(true); }}
              disabled={isLocked}
              className={`pl-9 pr-4 py-2 rounded-lg border border-borderLight bg-bgLight text-sm text-textMain focus:outline-none focus:ring-2 focus:ring-primary/20 w-[30rem] transition-all ${isLocked ? 'opacity-40 cursor-not-allowed' : ''}`}
            />
          </form>

          {/* Search Dropdown */}
          {showSearchDropdown && (globalSearch || recentSearches.length > 0) && (
            <div className="absolute top-[calc(100%+8px)] left-0 w-[30rem] bg-surface border border-borderLight rounded-xl shadow-2xl z-50 overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 duration-200">
              {globalSearch && globalSearch.length > 0 && globalSearch.length < 2 && (
                <div className="px-4 py-3 text-center text-[11px] font-medium text-textSub bg-bgLight/50 border-b border-borderLight animate-pulse">
                  Type 2+ characters to search tasks, studio problems & arenas...
                </div>
              )}

              {recentSearches.length > 0 && !globalSearch && (
                <div className="py-1">
                  <div className="px-4 py-1 text-[10px] font-black text-textSub uppercase tracking-widest opacity-50">Recent Searches</div>
                  {recentSearches.map((s, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        dispatch(setGlobalSearch(s));
                        saveToHistory(s);
                        setShowSearchDropdown(false);
                      }}
                      className="group px-4 py-1.5 flex items-center justify-between cursor-pointer text-xs transition-all relative hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-primary"></span>
                        <span className="text-textSub group-hover:text-textMain font-medium transition-all">
                          {s}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 opacity-60">Search</span>
                    </div>
                  ))}
                </div>
              )}

              {globalSearch && suggestions.length > 0 && (
                <div className="py-1">
                  <div className="px-4 py-1 text-[10px] font-black text-textSub uppercase tracking-widest opacity-50">Suggestions</div>
                  {suggestions.map((s, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        saveToHistory(s.label);
                        dispatch(setGlobalSearch(s.label));
                        setShowSearchDropdown(false);

                        if (s.type === 'dsa_problem') {
                          navigate('/dsa-management/problems');
                        } else if (s.type === 'project') {
                          navigate(`/arena/${s.slug}`);
                        } else if (s.type === 'task') {
                          if (s.projectSlug) {
                            navigate(`/arena/${s.projectSlug}`);
                          } else {
                            navigate('/task/dashboard');
                          }
                        }
                      }}
                      className="group px-4 py-2 flex items-center justify-between cursor-pointer text-xs transition-all hover:bg-slate-50 border-b border-slate-100/50 last:border-0"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.type === 'dsa_problem' ? 'bg-purple-500' : s.type === 'project' ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                        <span className="text-textMain font-semibold truncate group-hover:text-primary transition-colors">
                          {s.label}
                        </span>
                      </div>
                      {s.type === 'dsa_problem' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-100 shrink-0">
                          Studio Problem
                        </span>
                      )}
                      {s.type === 'task' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
                          Task
                        </span>
                      )}
                      {s.type === 'project' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
                          Arena
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {globalSearch && globalSearch.length >= 2 && suggestions.length === 0 && (
                <div className="px-4 py-6 text-center text-[11px] font-medium text-textSub bg-bgLight/30">
                  <div className="text-slate-600 font-bold">No exact matches found</div>
                  <div className="mt-1 opacity-70 text-slate-400">Press Enter to search all items for "{globalSearch}"</div>
                </div>
              )}

              {globalSearch && (
                <div
                  onClick={handleClearSearch}
                  className="px-4 py-2 mt-1 border-t border-borderLight flex items-center gap-2 hover:bg-rose-50 cursor-pointer text-xs text-rose-500 font-medium transition-colors"
                >
                  <IoCloseCircleOutline size={14} />
                  <span>Clear Search</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Total XP Badge in Main Navbar (Image 5) */}
        {/* <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-extrabold text-xs shrink-0 shadow-2xs" title="Total Accumulated DSA XP">
              <LuTrophy size={15} className="text-amber-500" />
              <span>{userXp} XP</span>
            </div> */}

        <button
          onClick={() => { if (!isLocked) dispatch(setShowConsistencyModal(true)); }}
          disabled={isLocked}
          className={`w-10 h-10 rounded-full border border-borderLight flex items-center justify-center text-textSub hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all shrink-0 ${isLocked ? 'opacity-40 cursor-not-allowed' : ''}`}
          title={isLocked ? "Complete Revision to Unlock 🔒" : "Performance View"}
        >
          <IoCalendarOutline size={20} />
        </button>

        <div className="relative shrink-0" ref={notificationRef}>
          <button
            onClick={() => {
              if (isLocked) return;
              setShowDropdown(!showDropdown);
              if (isNotification) setIsNotification(false);
            }}
            disabled={isLocked}
            className={`w-10 h-10 rounded-full border border-borderLight flex items-center justify-center text-textSub hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all relative ${notificationIconClass} ${isLocked ? 'opacity-40 cursor-not-allowed' : ''}`}
            title={isLocked ? "Complete Revision to Unlock 🔒" : "Notifications"}
          >
            <IoNotificationsOutline size={20} />
            {notificationData?.length > 0 && !isLocked && (
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
            )}
          </button>

          {showDropdown && (
            <div className="absolute top-12 right-0 w-96 bg-surface border border-borderLight rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="flex justify-between items-center px-4 py-3 border-b border-borderLight bg-bgLight/50">
                <div className="font-semibold text-textMain">Notifications</div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-primary hover:underline font-medium"
                    disabled={notificationData?.length === 0}
                  >
                    Mark all read
                  </button>
                  <button
                    onClick={handleNavigateToNotification}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    View all
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="max-h-[28rem] overflow-y-auto custom-scrollbar">
                {notificationData?.length > 0 ? (
                  groupNotificationsByDay(notificationData).map((group, groupIndex) => (
                    <div key={groupIndex}>
                      <div className="sticky top-0 px-4 py-1.5 bg-bgLight text-xs font-semibold text-textSub uppercase tracking-wider backdrop-blur-sm border-y border-borderLight/50">
                        {group.dateLabel}
                      </div>
                      {group.notifications.map((data, index) => (
                        <div
                          key={index}
                          onClick={() => handleUpdateNotify(data)}
                          className={`p-4 cursor-pointer border-b border-borderLight last:border-0 hover:bg-bgLight/50 transition-colors ${!data.notificationStatus ? 'bg-primary/5' : ''}`}
                        >
                          <div className="flex gap-3">
                            <div className="relative flex-shrink-0">
                              {data.senderId?.profileImage ? (
                                <img
                                  src={data.senderId.profileImage}
                                  alt="Avatar"
                                  className="w-10 h-10 rounded-full object-cover border border-borderLight"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold border border-primary/20">
                                  {data.senderId?.firstName?.charAt(0) || 'U'}
                                </div>
                              )}
                              {!data.notificationStatus && (
                                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-primary rounded-full border-2 border-white"></span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start mb-0.5">
                                <p className="text-sm font-semibold text-textMain truncate">
                                  {data.senderId?.firstName} {data.senderId?.lastName}
                                </p>
                                <span className="text-xs text-textSub ml-2 whitespace-nowrap">
                                  {moment(data.createdAt).fromNow(true)}
                                </span>
                              </div>
                              <p className="text-sm text-textMain leading-snug">
                                {data.title}
                                {data.projectId?.name && (
                                  <span className="text-textSub ml-1 block text-xs mt-0.5">
                                    in {data.projectId.name}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center flex flex-col items-center justify-center text-textSub">
                    <IoNotificationsOutline size={48} className="mb-3 opacity-20" />
                    <p className="text-sm">No notifications yet</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => { if (!isLocked) handleShare(); }}
          disabled={isLocked}
          className={`p-2 sm:px-4 sm:py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primaryHover transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-95 shrink-0 ${isLocked ? 'opacity-40 cursor-not-allowed' : ''}`}
          title={isLocked ? "Complete Revision to Unlock 🔒" : "Share Link"}
        >
          <IoLinkOutline size={18} />
          <span className="hidden sm:inline">Share</span>
        </button>
      </div>
    </header>
  );
};


export default Header;
