import React, { useEffect, useState } from 'react';
import { ProjectApi } from '../services/api/Project.api';
import { IoSettingsOutline, IoLogoYoutube, IoSaveOutline } from 'react-icons/io5';
import { SiLeetcode } from 'react-icons/si';
import toast from 'react-hot-toast';

const SettingsGlobal = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('features');

    const [showTopBar, setShowTopBar] = useState(localStorage.getItem('momentum_show_topbar') !== 'false');

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleToggleTopBar = () => {
        const newValue = !showTopBar;
        setShowTopBar(newValue);
        localStorage.setItem('momentum_show_topbar', newValue.toString());
        window.dispatchEvent(new Event('topbarToggled'));
        toast.success(`Inspirational Top Bar ${newValue ? 'enabled' : 'disabled'}`);
    };

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const res = await ProjectApi.getAllProjects();
            setProjects(res.data?.data || []);
        } catch (error) {
            console.error("Failed to fetch projects", error);
            toast.error("Failed to load projects");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleYoutube = async (project, currentState) => {
        try {
            setSaving(true);
            const updatedSettings = {
                ...(project.settings || {}),
                enableYoutubeSearch: !currentState
            };
            
            const payload = {
                ...project,
                settings: updatedSettings
            };
            
            await ProjectApi.updateProject(project._id, payload);
            toast.success(`YouTube search ${!currentState ? 'enabled' : 'disabled'} for ${project.name}`);
            
            setProjects(prev => prev.map(p => 
                p._id === project._id ? { ...p, settings: updatedSettings } : p
            ));
        } catch (error) {
            console.error("Failed to update project settings", error);
            toast.error("Failed to update settings");
        } finally {
            setSaving(false);
        }
    };

    const handleToggleLeetCode = async (project, currentState) => {
        try {
            setSaving(true);
            const updatedSettings = {
                ...(project.settings || {}),
                enableLeetCodeSearch: !currentState
            };
            
            const payload = {
                ...project,
                settings: updatedSettings
            };
            
            await ProjectApi.updateProject(project._id, payload);
            toast.success(`LeetCode search ${!currentState ? 'enabled' : 'disabled'} for ${project.name}`);
            
            setProjects(prev => prev.map(p => 
                p._id === project._id ? { ...p, settings: updatedSettings } : p
            ));
        } catch (error) {
            console.error("Failed to update project settings", error);
            toast.error("Failed to update settings");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#F8FAFC]">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-8 py-6 shrink-0">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <IoSettingsOutline className="text-primary" />
                        Global Settings
                    </h1>
                    <p className="text-sm font-medium text-slate-400 mt-1">Manage global preferences and project-specific features.</p>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto p-8">
                <div className="max-w-4xl mx-auto flex gap-8 min-h-full">
                    
                    {/* Settings Sidebar */}
                    <div className="w-64 shrink-0">
                        <nav className="space-y-1">
                            <button 
                                onClick={() => setActiveTab('features')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'features' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}
                            >
                                <IoSettingsOutline size={18} />
                                Preferences
                            </button>
                        </nav>
                    </div>

                    {/* Settings Panel */}
                    <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8">
                        {activeTab === 'features' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                
                                {/* Global User Preferences */}
                                <div className="mb-8">
                                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Global Interface</h2>
                                    <p className="text-sm font-medium text-slate-400 mt-1">Customize your global app experience.</p>
                                </div>

                                <div className="space-y-6 mb-12">
                                    <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-base font-black text-slate-800">Inspirational Top Bar</h3>
                                                <p className="text-xs font-medium text-slate-500 mt-1 max-w-sm leading-relaxed">Displays a global dark top bar with your current consistency streak and daily motivational quotes.</p>
                                            </div>
                                            <button 
                                                onClick={handleToggleTopBar}
                                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${showTopBar ? 'bg-primary' : 'bg-slate-200'}`}
                                                role="switch"
                                                aria-checked={showTopBar}
                                            >
                                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${showTopBar ? 'translate-x-5' : 'translate-x-0'}`} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Project Features */}
                                <div className="mb-8 border-t border-slate-200/60 pt-8">
                                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Project Features</h2>
                                    <p className="text-sm font-medium text-slate-400 mt-1">Enable or disable specific features on a per-project basis.</p>
                                </div>

                                <div className="space-y-8">
                                    {/* YouTube Search Feature */}
                                    <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6">
                                        <div className="flex items-start gap-4 mb-6 pb-6 border-b border-slate-200/60">
                                            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center shrink-0 border border-red-100">
                                                <IoLogoYoutube size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-black text-slate-800">YouTube Search Action</h3>
                                                <p className="text-xs font-medium text-slate-500 mt-1 leading-relaxed">Adds a quick-action button to child tasks that instantly searches YouTube for the task's name.</p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {loading ? (
                                                <div className="text-sm font-bold text-slate-400 p-4 text-center">Loading projects...</div>
                                            ) : projects.length > 0 ? (
                                                projects.map((project) => {
                                                    const isEnabled = project.settings?.enableYoutubeSearch || false;
                                                    return (
                                                        <div key={project._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm transition-all group">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                                                                    {project.key || project.name.substring(0,2).toUpperCase()}
                                                                </div>
                                                                <span className="text-sm font-bold text-slate-700">{project.name}</span>
                                                            </div>
                                                            <button 
                                                                onClick={() => handleToggleYoutube(project, isEnabled)}
                                                                disabled={saving}
                                                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${isEnabled ? 'bg-primary' : 'bg-slate-200'}`}
                                                                role="switch"
                                                                aria-checked={isEnabled}
                                                            >
                                                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                                            </button>
                                                        </div>
                                                    )
                                                })
                                            ) : null}
                                        </div>
                                    </div>

                                    {/* LeetCode Search Feature */}
                                    <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6">
                                        <div className="flex items-start gap-4 mb-6 pb-6 border-b border-slate-200/60">
                                            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0 border border-orange-100">
                                                <SiLeetcode size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-black text-slate-800">LeetCode Search Action</h3>
                                                <p className="text-xs font-medium text-slate-500 mt-1 leading-relaxed">Adds a quick-action button to tasks that instantly searches LeetCode for the task's name. Perfect for DSA tracking.</p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {loading ? (
                                                <div className="text-sm font-bold text-slate-400 p-4 text-center">Loading projects...</div>
                                            ) : projects.length > 0 ? (
                                                projects.map((project) => {
                                                    const isEnabled = project.settings?.enableLeetCodeSearch || false;
                                                    return (
                                                        <div key={project._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm transition-all group">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                                                                    {project.key || project.name.substring(0,2).toUpperCase()}
                                                                </div>
                                                                <span className="text-sm font-bold text-slate-700">{project.name}</span>
                                                            </div>
                                                            <button 
                                                                onClick={() => handleToggleLeetCode(project, isEnabled)}
                                                                disabled={saving}
                                                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${isEnabled ? 'bg-primary' : 'bg-slate-200'}`}
                                                                role="switch"
                                                                aria-checked={isEnabled}
                                                            >
                                                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                                            </button>
                                                        </div>
                                                    )
                                                })
                                            ) : (
                                                <div className="text-sm font-bold text-slate-400 p-4 text-center">No projects found.</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsGlobal;
