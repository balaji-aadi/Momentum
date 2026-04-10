
import React, { useState, useEffect } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import ProjectSidebar from './ProjectSidebar';
import Header from './Header'; // Reusing existing Header for TopbarUser info
import TaskDetailDrawer from '../tasks/TaskDetailDrawer';
import { ProjectApi } from '../../services/api/Project.api';

const ProjectLayout = () => {
    const { projectId } = useParams();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProject = async () => {
            console.log("ProjectLayout: Fetching project for ID:", projectId);
            if (!projectId) {
                console.warn("ProjectLayout: No projectId found in URL params");
                return;
            }
            setLoading(true);
            try {
                const res = await ProjectApi.getProjectById(projectId);
                console.log("ProjectLayout: API Response:", res);
                if (res.data?.data) {
                    setProject(res.data.data);
                } else {
                    console.warn("ProjectLayout: Project data missing in response");
                    setProject(null);
                }
            } catch (error) {
                console.error("Failed to fetch project context", error);
                setProject(null);
            } finally {
                setLoading(false);
            }
        };
        fetchProject();
    }, [projectId]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-bgLight">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="flex h-screen items-center justify-center bg-bgLight">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-textMain">Project not found</h2>
                    <p className="text-textSub mt-2">The project you are looking for does not exist or you don't have permission.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full w-full bg-bgLight font-sans text-textMain overflow-hidden">
            {/* Project Specific Sidebar */}
            <ProjectSidebar project={project} />

            {/* Main Content Area */}
            <div className="flex-1 ml-64 flex flex-col h-full overflow-hidden relative">
                <Header />
                
                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-8 relative scroll-smooth">
                    <Outlet context={{ project }} />
                </main>

                {/* Task Detail Drawer */}
                <TaskDetailDrawer />
            </div>
        </div>
    );
};

export default ProjectLayout;
