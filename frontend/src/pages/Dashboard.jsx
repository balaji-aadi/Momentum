import React, { useEffect, useState } from 'react';
import DashboardHeader from '../components/layout/DashboardHeader';
import TaskTable from '../components/tasks/TaskTable';
import MyTask from './task-childrens/MyTask';
import TimelineBoard from '../components/tasks/TimelineBoard';
import CalendarBoard from '../components/tasks/CalendarBoard';
import { ProjectApi } from '../services/api/Project.api';
import { UserApi } from '../services/api/user.api';
import { TaskApi } from '../services/api/Task.api';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Sprints from './project-childrens/Sprints';
import TaskDetailDrawer from '../components/tasks/TaskDetailDrawer';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { IoChevronDownOutline, IoFilterOutline } from 'react-icons/io5';
import { useDispatch } from 'react-redux';
import { setGlobalSearch } from '../store/slices/storeSlice';

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser, globalSearch } = useSelector((state) => state.store);
  const isManager = currentUser?.userRole?.name === "projectmanager";
  const isAdmin = currentUser?.userRole?.name === "admin";
  const canCreate = isManager || isAdmin;

  const [viewMode, setViewMode] = useState('board'); // 'board', 'spreadsheet', 'timeline', 'calendar'
  
  // Global Filters
  const [projectId, setProjectId] = useState('');
  const [memberId, setMemberId] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [parentId, setParentId] = useState('');
  const [parentTasks, setParentTasks] = useState([]);
  
  // Data State
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState(null); // For views that need raw tasks (Timeline, Calendar, Table)
  const [loading, setLoading] = useState(false);
  
  // Controls Visibility Logic
  const [isControlsVisible, setIsControlsVisible] = useState(false); // Default to false for max space
  const [isEditingTask, setIsEditingTask] = useState(false);

  // Sync filters from URL
  useEffect(() => {
    const pId = searchParams.get('projectId');
    // If projectId is in URL, set it. If missing, clear it.
    setProjectId(pId || '');
  }, [searchParams]);

  // Fetch Options (Projects, Members)
  useEffect(() => {
    const fetchOptions = async () => {
        // Fetch Projects
        try {
            const pRes = await ProjectApi.getAllProjects();
            const fetchedProjects = pRes.data?.data?.map(p => ({ value: p._id, label: p.name })) || [];
            
            // Reorder based on localStorage priority
            const savedOrder = JSON.parse(localStorage.getItem('projectTabsOrder')) || [];
            if (savedOrder.length > 0) {
                fetchedProjects.sort((a, b) => {
                    const indexA = savedOrder.indexOf(a.value);
                    const indexB = savedOrder.indexOf(b.value);
                    if (indexA === -1 && indexB === -1) return 0;
                    if (indexA === -1) return 1;
                    if (indexB === -1) return -1;
                    return indexA - indexB;
                });
            }
            setProjects(fetchedProjects);

            // Auto-select the first project if no projectId is currently selected (meaning user just opened dashboard)
            const currentUrlProjectId = searchParams.get('projectId');
            if (!currentUrlProjectId && fetchedProjects.length > 0) {
                setProjectId(fetchedProjects[0].value);
                const params = new URLSearchParams(searchParams);
                params.set('projectId', fetchedProjects[0].value);
                setSearchParams(params, { replace: true });
            }
        } catch (error) {
            console.error("Failed to fetch dashboard projects", error);
        }

        // Fetch Members (Only for Managers/Admins based on sidebar/roles, but safe to try and catch)
        try {
            const uRes = await UserApi.users();
            setMembers(uRes.data?.data?.map(u => ({ value: u._id, label: `${u.firstName} ${u.lastName}` })) || []);
        } catch (error) {
            console.error("Failed to fetch dashboard members (likely restricted)", error);
        }
    };
    fetchOptions();
  }, []);

  // Fetch Tasks for Non-Board Views (Board fetches its own for now to preserve strict logic)
  useEffect(() => {
    const fetchTasks = async () => {
        setLoading(true);
        setTasks(null); // Clear old tasks to prevent data leak during project switch
        try {
            const filter = {};
            if (projectId) filter.projectName = projectId;
            if (memberId) filter.assignee = memberId;

            // Note: If search is implemented in backend, add here. 
            // Otherwise we filter client-side below.
            
            // Avoid fetching all tasks if we are in a project context but ID is briefly missing
            if (!projectId) {
                setTasks([]);
                setLoading(false);
                return;
            }
            
            const res = await TaskApi.getAllTasks({ filter });
            setTasks(res.data?.data || []);
        } catch (error) {
            console.error("Failed to fetch tasks", error);
        } finally {
            setLoading(false);
        }
    };
    fetchTasks();
  }, [projectId, memberId, viewMode, sortBy, parentId]);

  // Fetch Parent Tasks for Filtering
  useEffect(() => {
    const fetchParents = async () => {
        if (!projectId) {
            setParentTasks([]);
            return;
        }
        try {
            const res = await TaskApi.getAllTasks({ filter: { projectName: projectId } });
            // Filter tasks that can be parents (usually those that aren't subtasks themselves, 
            // or just all tasks if the user wants to filter by ANY parent).
            // Let's provide all tasks as parent options for now.
            setParentTasks(res.data?.data || []);
        } catch (error) {
            console.error("Failed to fetch parent tasks", error);
            setParentTasks([]);
        }
    };
    fetchParents();
  }, [projectId]);

  const filteredTasks = (tasks || []).filter(t => 
    t.taskName?.toLowerCase().includes(globalSearch.toLowerCase()) ||
    t.taskId?.toLowerCase().includes(globalSearch.toLowerCase())
  );

  const handleCreateTask = () => {
      navigate('/task/create-task');
  };

    const handleTaskClick = (task) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('taskId', task._id);
        setSearchParams(newParams);
    };



    // Premium Auto-hide Logic with Activity Tracking
    const timerRef = React.useRef(null);

    const resetTimer = React.useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (isControlsVisible && viewMode === 'board' && !isEditingTask) {
            timerRef.current = setTimeout(() => {
                setIsControlsVisible(false);
            }, 30000); // Updated to 30 seconds
        }
    }, [isControlsVisible, viewMode, isEditingTask]);

    useEffect(() => {
        resetTimer();
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [isControlsVisible, viewMode, isEditingTask, resetTimer]);

    return (
      <div className="h-full flex flex-col bg-bgLight relative">
          {/* Quick Access Floating Trigger - Dynamic Height for responsiveness */}
          {!isControlsVisible && viewMode === 'board' && !isEditingTask && (
              <div 
                  className="fixed right-8 z-[100] pointer-events-none"
                  onMouseEnter={() => setIsControlsVisible(true)}
              >
                  <motion.button 
                    initial={{ scale: 0.8, opacity: 0, x: 20 }}
                    animate={{ scale: 1, opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.05 }}
                    className="group flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-full shadow-[0_8px_30px_rgba(79,70,229,0.4)] transition-all duration-300 border border-white/20 pointer-events-auto"
                    onClick={() => setIsControlsVisible(true)}
                  >
                     <IoFilterOutline className="group-hover:rotate-12 transition-transform" size={14} />
                     <span className="text-[10px] font-bold uppercase tracking-tight">Controls</span>
                     <IoChevronDownOutline size={12} className="opacity-50" />
                  </motion.button>
              </div>
          )}

          <AnimatePresence>
            {((isControlsVisible || viewMode !== 'board') && !isEditingTask) && (
                <motion.div
                    initial={{ height: 0, opacity: 0, y: -20 }}
                    animate={{ height: 'auto', opacity: 1, y: 0 }}
                    exit={{ height: 0, opacity: 0, y: -20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    onMouseMove={resetTimer}
                    onClick={resetTimer}
                    onKeyDown={resetTimer}
                    className="z-40 bg-bgLight overflow-hidden border-b border-borderLight"
                >
                    <div className="w-full max-w-full overflow-hidden">
                        <DashboardHeader 
                            viewMode={viewMode}
                            setViewMode={setViewMode}
                            projects={projects}
                            members={members}
                            selectedProject={projectId}
                            onProjectChange={(id) => {
                                setProjectId(id);
                                const params = new URLSearchParams(searchParams);
                                if (id) params.set('projectId', id);
                                else params.delete('projectId');
                                setSearchParams(params);
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
                        />
                    </div>


                </motion.div>
            )}
          </AnimatePresence>

         <div 
            className={`flex-1 overflow-hidden ${viewMode === 'board' ? 'p-0' : 'p-6'} transition-all duration-500`}
            onMouseEnter={() => {
                // Optional: You could start the timer here if it's already shown
            }}
         >
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
