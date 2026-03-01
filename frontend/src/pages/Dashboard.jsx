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

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useSelector((state) => state.store);
  const isManager = currentUser?.userRole?.name === "projectmanager";
  const isAdmin = currentUser?.userRole?.name === "admin";
  const canCreate = isManager || isAdmin;

  const [viewMode, setViewMode] = useState('board'); // 'board', 'spreadsheet', 'timeline', 'calendar'
  
  // Global Filters
  const [projectId, setProjectId] = useState('');
  const [memberId, setMemberId] = useState('');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  
  // Data State
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]); // For views that need raw tasks (Timeline, Calendar, Table)
  const [loading, setLoading] = useState(false);

  // Fetch Options (Projects, Members)
  useEffect(() => {
    const fetchOptions = async () => {
        // Fetch Projects
        try {
            const pRes = await ProjectApi.getAllProjects();
            setProjects(pRes.data?.data?.map(p => ({ value: p._id, label: p.name })) || []);
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
    if (viewMode === 'board') return; // MyTask handles its own fetching
    
    const fetchTasks = async () => {
        setLoading(true);
        try {
            const filter = {};
            if (projectId) filter.projectName = projectId;
            if (memberId) filter.assignee = memberId;

            // Note: If search is implemented in backend, add here. 
            // Otherwise we filter client-side below.
            
            const res = await TaskApi.getAllTasks({ filter });
            setTasks(res.data?.data || []);
        } catch (error) {
            console.error("Failed to fetch tasks", error);
        } finally {
            setLoading(false);
        }
    };
    fetchTasks();
  }, [projectId, memberId, viewMode]);

  const filteredTasks = tasks.filter(t => 
    t.taskName?.toLowerCase().includes(search.toLowerCase()) ||
    t.taskDescription?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateTask = () => {
      navigate('/task/create-task');
  };

  const handleTaskClick = (task) => {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('taskId', task._id);
      setSearchParams(newParams);
  };

  return (
    <div className="h-full flex flex-col bg-bgLight">
        <DashboardHeader 
            viewMode={viewMode}
            setViewMode={setViewMode}
            projects={projects}
            members={members}
            selectedProject={projectId}
            onProjectChange={setProjectId}
            selectedMember={memberId}
            onMemberChange={setMemberId}
            search={search}
            onSearchChange={setSearch}
            onResetFilters={() => {
                setProjectId('');
                setMemberId('');
                setSearch('');
                setDateFilter('');
            }}
            onCreateTask={handleCreateTask}
            isManager={isManager}
            isAdmin={isAdmin}
            canCreate={canCreate}
            dateFilter={dateFilter}
            onDateChange={setDateFilter}
        />

       <div className={`flex-1 overflow-hidden ${viewMode === 'board' ? 'p-0' : 'p-6'}`}>
           {viewMode === 'board' && (
               <MyTask 
                    viewMode={viewMode} 
                    setViewMode={setViewMode}
                    // Pass filters to MyTask so it can sync
                    externalProjectId={projectId}
                    externalMemberId={memberId}
                    externalSearch={search}
                    externalDateFilter={dateFilter}
               />
           )}
           
           {viewMode === 'spreadsheet' && (
               <TaskTable 
                    tasks={filteredTasks}
                    isLoading={loading}
                    // Pass raw data for internal lookups if needed
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
