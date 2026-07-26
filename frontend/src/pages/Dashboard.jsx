import React, { useEffect, useState } from 'react';
import DashboardHeader from '../components/layout/DashboardHeader';
import TaskTable from '../components/tasks/TaskTable';
import MyTask from './task-childrens/MyTask';
import TimelineBoard from '../components/tasks/TimelineBoard';
import CalendarBoard from '../components/tasks/CalendarBoard';
import PerformanceDashboard from './Analytics/PerformanceDashboard';
import { ProjectApi } from '../services/api/Project.api';
import { UserApi } from '../services/api/user.api';
import { TaskApi } from '../services/api/Task.api';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Sprints from './project-childrens/Sprints';
import TaskDetailDrawer from '../components/tasks/TaskDetailDrawer';
import { setGlobalSearch } from '../store/slices/storeSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { IoChevronDownOutline, IoFilterOutline } from 'react-icons/io5';

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser, globalSearch, activeBranch } = useSelector((state) => state.store);

  const isManager = currentUser?.userRole?.name === "projectmanager";
  const isAdmin = currentUser?.userRole?.name === "admin";
  const canCreate = isManager || isAdmin;

  // View mode for Arena views ('board', 'spreadsheet', 'timeline', 'calendar', 'sprints')
  const [viewMode, setViewMode] = useState(searchParams.get('view') || 'board');
  const [isEditingTask, setIsEditingTask] = useState(false);

  // Controls visibility toggle for Arena views (collapsed by default as shown in Image 2)
  const [isControlsVisible, setIsControlsVisible] = useState(false);

  // Global Filters
  const [projectId, setProjectId] = useState('');
  const [memberId, setMemberId] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [parentId, setParentId] = useState('');
  const [parentTasks, setParentTasks] = useState([]);

  // Data State
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState(null);
  const [loading, setLoading] = useState(false);

  // In-memory cache for ultra-fast instant switching without network delays
  const taskCacheRef = React.useRef({});
  const projectsCacheRef = React.useRef(null);

  useEffect(() => {
    if (!activeBranch) {
      navigate('/branch', { replace: true });
    }
  }, [activeBranch, navigate]);

  // Consolidated Fast Fetch Effect
  useEffect(() => {
    if (!slug || !activeBranch) return;

    let isMounted = true;

    const loadArenaData = async () => {
      let currentProjects = projectsCacheRef.current;

      // 1. Fetch projects in parallel if not cached
      if (!currentProjects) {
        try {
          const [pRes, uRes] = await Promise.all([
            ProjectApi.getAllProjects(),
            UserApi.users()
          ]);
          currentProjects = pRes.data?.data?.map(p => ({
            value: p._id,
            label: p.name,
            slug: p.key?.toLowerCase() || p.name.toLowerCase().replace(/\s+/g, '-')
          })) || [];
          projectsCacheRef.current = currentProjects;
          if (isMounted) {
            setProjects(currentProjects);
            setMembers(uRes.data?.data?.map(u => ({ value: u._id, label: `${u.firstName} ${u.lastName}` })) || []);
          }
        } catch (error) {
          console.error("Failed to load options", error);
        }
      }

      // 2. Instant project resolution from slug
      const matched = (currentProjects || []).find(p => p.slug === slug);
      const targetProjectId = matched ? matched.value : null;

      if (!targetProjectId) {
        if (isMounted) {
          setLoading(false);
          setTasks([]);
        }
        return;
      }

      if (isMounted) setProjectId(targetProjectId);

      // 3. Instant Cache Hit: Display cached tasks instantly (0ms latency!)
      if (taskCacheRef.current[targetProjectId]) {
        if (isMounted) {
          setTasks(taskCacheRef.current[targetProjectId]);
          setLoading(false);
        }
      } else {
        if (isMounted) setLoading(true);
      }

      // 4. Background Fetch to keep data freshly synced
      try {
        const filter = { projectName: targetProjectId };
        if (memberId) filter.assignee = memberId;

        const res = await TaskApi.getAllTasks({ filter });
        const fetchedTasks = res.data?.data || [];

        // Save to cache for 0ms instant load next time
        taskCacheRef.current[targetProjectId] = fetchedTasks;

        if (isMounted) {
          setTasks(fetchedTasks);
        }
      } catch (error) {
        console.error("Failed to fetch tasks", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadArenaData();

    return () => {
      isMounted = false;
    };
  }, [slug, memberId, activeBranch]);

  // Fetch Parent Tasks for Filtering
  useEffect(() => {
    const fetchParents = async () => {
      if (!projectId || !slug) {
        setParentTasks([]);
        return;
      }
      try {
        const res = await TaskApi.getAllTasks({ filter: { projectName: projectId } });
        setParentTasks(res.data?.data || []);
      } catch (error) {
        console.error("Failed to fetch parent tasks", error);
        setParentTasks([]);
      }
    };
    fetchParents();
  }, [projectId, slug]);

  const filteredTasks = (tasks || []).filter(t => {
    const matchesSearch = t.taskName?.toLowerCase().includes(globalSearch.toLowerCase()) ||
      t.taskId?.toLowerCase().includes(globalSearch.toLowerCase());
    
    if (!projectId) return matchesSearch;
    const pId = typeof t.projectName === 'object' ? (t.projectName?._id || t.projectName?.id) : t.projectName;
    return matchesSearch && (pId?.toString() === projectId?.toString());
  });

  const handleCreateTask = () => {
    navigate('/task/create-task');
  };

  const handleTaskClick = (task) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('taskId', task._id);
    setSearchParams(newParams);
  };

  // 1. MAIN DASHBOARD ROUTE ("/") -> Render ONLY Performance Analytics Dashboard
  if (!slug) {
    return (
      <div className="h-full w-full overflow-y-auto bg-bgLight">
        <PerformanceDashboard />
      </div>
    );
  }

  // 2. SPECIFIC ARENA ROUTE ("/arena/:slug") -> Render Arena Tasks with Collapsible Controls Header
  return (
    <div className="h-full flex flex-col bg-bgLight relative">
      {/* Floating CONTROLS Trigger Button when Collapsed */}
      {!isControlsVisible && !isEditingTask && (
        <div className="fixed right-4 top-20 z-[100] pointer-events-auto">
          <motion.button
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setIsControlsVisible(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-vermilion-500 hover:bg-vermilion-600 text-white rounded-full shadow-md transition-all border border-white/20 text-[9px] font-black uppercase tracking-wider cursor-pointer"
          >
            <IoFilterOutline size={12} />
            <span className='text-[12px]'>Controls</span>
            <IoChevronDownOutline size={11} className="opacity-70" />
          </motion.button>
        </div>
      )}

      {/* Expandable Header Controls (Image 3 style) */}
      <AnimatePresence>
        {isControlsVisible && !isEditingTask && (
          <motion.div
            initial={{ height: 0, opacity: 0, y: -15 }}
            animate={{ height: 'auto', opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="z-40 bg-bgLight border-b border-borderLight shadow-sm"
          >
            <DashboardHeader
              viewMode={viewMode}
              setViewMode={(mode) => {
                setViewMode(mode);
                const newParams = new URLSearchParams(searchParams);
                newParams.set('view', mode);
                setSearchParams(newParams);
              }}
              projects={projects}
              members={members}
              selectedProject={projectId}
              onProjectChange={(id) => {
                const selected = projects.find(p => p.value === id);
                if (selected) {
                  navigate(`/arena/${selected.slug}`);
                } else {
                  navigate('/');
                }
              }}
              selectedMember={memberId}
              onMemberChange={setMemberId}
              search={globalSearch}
              onSearchChange={(val) => dispatch(setGlobalSearch(val))}
              onResetFilters={() => {
                setProjectId('');
                setMemberId('');
                dispatch(setGlobalSearch(''));
                setSortBy('');
                setParentId('');
                setSearchParams({});
              }}
              onCreateTask={handleCreateTask}
              isManager={isManager}
              isAdmin={isAdmin}
              canCreate={canCreate}
              sortBy={sortBy}
              onSortChange={setSortBy}
              parentId={parentId}
              onParentChange={setParentId}
              parentTasks={parentTasks}
              onHideControls={() => setIsControlsVisible(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Arena View Content (Board, Spreadsheet, Timeline, Calendar, Sprints) - Full Page Coverage */}
      <div className={`flex-1 overflow-y-auto w-full transition-all duration-500 ${viewMode === 'board' ? 'p-0 h-full' : 'p-3 sm:p-4'}`}>
        {viewMode === 'board' && (
          <MyTask
            viewMode={viewMode}
            setViewMode={setViewMode}
            externalProjectId={projectId}
            externalMemberId={memberId}
            externalSearch={globalSearch}
            externalSort={sortBy}
            externalParentId={parentId}
            externalTasks={tasks}
            externalLoading={loading}
            onEditStateChange={(editing) => setIsEditingTask(editing)}
          />
        )}

        {viewMode === 'spreadsheet' && (
          <TaskTable
            tasks={filteredTasks}
            isLoading={loading}
            projects={projects.map(p => ({ _id: p.value, name: p.label }))}
            members={members.map(m => ({ _id: m.value, firstName: m.label.split(' ')[0], lastName: m.label.split(' ')[1] }))}
            selectedProject={projectId}
            selectedMember={memberId}
            onProjectChange={setProjectId}
            onMemberChange={setMemberId}
          />
        )}

        {viewMode === 'timeline' && (
          <TimelineBoard tasks={filteredTasks} isLoading={loading} onTaskClick={handleTaskClick} />
        )}

        {viewMode === 'calendar' && (
          <CalendarBoard tasks={filteredTasks} isLoading={loading} onTaskClick={handleTaskClick} />
        )}

        {viewMode === 'sprints' && (
          <Sprints projectId={projectId} />
        )}
      </div>

      <TaskDetailDrawer />
    </div>
  );
};

export default Dashboard;
