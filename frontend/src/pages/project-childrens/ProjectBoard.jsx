
import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import Board from '../task-childrens/Board';
import { TaskApi } from '../../services/api/Task.api';
import { ProjectApi } from '../../services/api/Project.api';
import { IoFilterOutline, IoAddOutline } from 'react-icons/io5';

const ProjectBoard = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [milestones, setMilestones] = useState([]);
    const [selectedMilestone, setSelectedMilestone] = useState('');
    const [memberFilter, setMemberFilter] = useState(''); // Could be enhanced later

    useEffect(() => {
        const fetchProjectData = async () => {
            setLoading(true);
            try {
                // Fetch Milestones for Filter
                const mRes = await ProjectApi.getAllmileStones(projectId);
                setMilestones(mRes.data?.data?.milestones || []);

                // Fetch Tasks
                const filter = { projectName: projectId };
                if (selectedMilestone) filter.milestone = selectedMilestone;
                // if (memberFilter) filter.assignee = memberFilter;

                const tRes = await TaskApi.getAllTasks({ filter });
                setTasks(tRes.data?.data || []);

            } catch (error) {
                console.error("Failed to fetch board data", error);
            } finally {
                setLoading(false);
            }
        };

        if (projectId) {
            fetchProjectData();
        }
    }, [projectId, selectedMilestone]);



    return (
        <div className="h-full flex flex-col">
            {/* Board Header / Toolbar */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-textMain">Board</h1>
                
                <div className="flex items-center gap-3">
                    {/* Create Task Button */}
                    <button
                        onClick={() => navigate('/task/create-task', { state: { project: { _id: projectId } } })} // Pass project context
                        className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primaryHover transition-colors shadow-sm flex items-center gap-2"
                    >
                        <IoAddOutline size={18} />
                        Create Issue
                    </button>

                    {/* Milestone Filter */}
                    <div className="relative">
                        <select 
                            className="pl-3 pr-8 py-2 bg-white border border-borderLight rounded-lg text-sm focus:outline-none focus:border-primary appearance-none cursor-pointer"
                            value={selectedMilestone}
                            onChange={(e) => setSelectedMilestone(e.target.value)}
                        >
                            <option value="">All Milestones</option>
                            {milestones.map(m => (
                                <option key={m._id} value={m._id}>{m.milestoneName}</option>
                            ))}
                        </select>
                         <IoFilterOutline className="absolute right-3 top-1/2 -translate-y-1/2 text-textSub pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Board Area */}
            <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar min-w-full">
                {loading ? (
                    <div className="flex items-center justify-center h-64 text-textSub">Loading tasks...</div>
                ) : (
                    <Board 
                        tasks={tasks} 
                        setTasks={setTasks} 
                        selectedProject={projectId} 
                        milestoneId={selectedMilestone}
                    />
                )}
            </div>
        </div>
    );
};

export default ProjectBoard;
