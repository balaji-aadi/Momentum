import React, { useEffect, useState } from 'react';
import { ProjectApi } from '../services/api/Project.api';
import { IoSettingsOutline, IoLogoYoutube, IoShieldCheckmarkOutline, IoCalendarOutline, IoCardOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { BranchApi } from '../services/api/Branch.api';
import { useSelector } from 'react-redux';

const SettingsGlobal = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('features');
    const { currentUser } = useSelector((state) => state.store);
    const isAdmin = currentUser?.email === "balajiaadi2000@gmail.com";

    const [subscription, setSubscription] = useState('free');
    const [subLoading, setSubLoading] = useState(false);

    useEffect(() => {
        fetchProjects();
        if (isAdmin) fetchSubscription();
    }, [isAdmin]);

    const fetchSubscription = async () => {
        try {
            const res = await BranchApi.getGlobalSettings();
            setSubscription(res.data?.data?.subscriptionType || 'free');
        } catch (error) {
            console.error("Failed to fetch subscription settings", error);
        }
    };

    const handleSubscriptionChange = async (type) => {
        setSubLoading(true);
        try {
            await BranchApi.updateGlobalSettings({ subscriptionType: type });
            setSubscription(type);
            toast.success(`Subscription updated to ${type}`);
        } catch (error) {
            toast.error("Failed to update subscription");
        } finally {
            setSubLoading(false);
        }
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
        <div className="min-h-full bg-slate-50/60 p-4 sm:p-6 lg:p-8">
            <div className="max-w-5xl mx-auto space-y-6">
                
                {/* Page Title Header */}
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
                    <div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                            <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                <IoSettingsOutline size={20} />
                            </span>
                            Settings
                        </h1>
                        <p className="text-xs font-medium text-slate-500 mt-1">Manage global preferences and project-specific features.</p>
                    </div>
                </div>

                {/* Main 2-Column Content Layout */}
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    
                    {/* Left Settings Sub-Sidebar */}
                    <div className="w-full md:w-56 shrink-0 bg-white rounded-2xl border border-slate-200/80 p-2 shadow-xs">
                        <nav className="space-y-1">
                            <button 
                                onClick={() => setActiveTab('features')}
                                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'features' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                            >
                                <IoSettingsOutline size={16} />
                                Preferences
                            </button>
                            {isAdmin && (
                                <button 
                                    onClick={() => setActiveTab('subscription')}
                                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'subscription' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                                >
                                    <IoShieldCheckmarkOutline size={16} />
                                    Subscription
                                </button>
                            )}
                        </nav>
                    </div>

                    {/* Right Content Panel */}
                    <div className="flex-1 w-full bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 md:p-8">
                        {activeTab === 'features' && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <div>
                                    <h2 className="text-base font-black text-slate-800 tracking-tight">Project Features</h2>
                                    <p className="text-xs font-medium text-slate-400 mt-0.5">Enable or disable specific features on a per-project basis.</p>
                                </div>

                                <div className="space-y-6">
                                    {/* YouTube Search Feature */}
                                    <div className="bg-slate-50/70 rounded-xl border border-slate-200/60 p-5">
                                        <div className="flex items-start gap-3.5 mb-4 pb-4 border-b border-slate-200/60">
                                            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0 border border-red-100">
                                                <IoLogoYoutube size={20} />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-800">YouTube Search Action</h3>
                                                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">Adds a quick-action button to child tasks that instantly searches YouTube for the task's name.</p>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            {loading ? (
                                                <div className="text-xs font-semibold text-slate-400 p-3 text-center">Loading projects...</div>
                                            ) : projects.length > 0 ? (
                                                projects.map((project) => {
                                                    const isEnabled = project.settings?.enableYoutubeSearch || false;
                                                    return (
                                                        <div key={project._id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-white border border-transparent hover:border-slate-200/80 transition-all">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center text-primary font-black text-[11px]">
                                                                    {project.key || project.name.substring(0,2).toUpperCase()}
                                                                </div>
                                                                <span className="text-xs font-bold text-slate-700">{project.name}</span>
                                                            </div>
                                                            <button 
                                                                onClick={() => handleToggleYoutube(project, isEnabled)}
                                                                disabled={saving}
                                                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${isEnabled ? 'bg-primary' : 'bg-slate-200'}`}
                                                                role="switch"
                                                                aria-checked={isEnabled}
                                                            >
                                                                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                                                            </button>
                                                        </div>
                                                    )
                                                })
                                            ) : (
                                                <div className="text-xs font-semibold text-slate-400 p-3 text-center">No projects found.</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* LeetCode Search Feature */}
                                    <div className="bg-slate-50/70 rounded-xl border border-slate-200/60 p-5">
                                        <div className="flex items-start gap-3.5 mb-4 pb-4 border-b border-slate-200/60">
                                            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100 p-2">
                                                <img src="/leetcode.png" alt="LeetCode" className="w-full h-full object-contain" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-800">LeetCode Search Action</h3>
                                                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">Adds a quick-action button to tasks that instantly searches LeetCode for the task's name. Perfect for DSA tracking.</p>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            {loading ? (
                                                <div className="text-xs font-semibold text-slate-400 p-3 text-center">Loading projects...</div>
                                            ) : projects.length > 0 ? (
                                                projects.map((project) => {
                                                    const isEnabled = project.settings?.enableLeetCodeSearch || false;
                                                    return (
                                                        <div key={project._id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-white border border-transparent hover:border-slate-200/80 transition-all">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center text-primary font-black text-[11px]">
                                                                    {project.key || project.name.substring(0,2).toUpperCase()}
                                                                </div>
                                                                <span className="text-xs font-bold text-slate-700">{project.name}</span>
                                                            </div>
                                                            <button 
                                                                onClick={() => handleToggleLeetCode(project, isEnabled)}
                                                                disabled={saving}
                                                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${isEnabled ? 'bg-primary' : 'bg-slate-200'}`}
                                                                role="switch"
                                                                aria-checked={isEnabled}
                                                            >
                                                                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                                                            </button>
                                                        </div>
                                                    )
                                                })
                                            ) : (
                                                <div className="text-xs font-semibold text-slate-400 p-3 text-center">No projects found.</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'subscription' && isAdmin && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <div>
                                    <h2 className="text-base font-black text-slate-800 tracking-tight">Subscription Management</h2>
                                    <p className="text-xs font-medium text-slate-400 mt-0.5">Set the global access level for all users.</p>
                                </div>

                                <div className="space-y-3">
                                    <button 
                                        disabled={subLoading}
                                        onClick={() => handleSubscriptionChange('free')}
                                        className={`w-full p-4 rounded-xl border text-left transition-all cursor-pointer ${subscription === 'free' ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-slate-200/80 hover:border-slate-300'}`}
                                    >
                                        <div className="flex items-center gap-3.5">
                                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${subscription === 'free' ? 'bg-primary text-white shadow-sm' : 'bg-slate-100 text-slate-400'}`}>
                                                <IoShieldCheckmarkOutline size={18} />
                                            </div>
                                            <div>
                                                <h3 className="text-xs font-bold text-slate-800">Free Access</h3>
                                                <p className="text-[11px] text-slate-500 mt-0.5">No restrictions for any user. Everyone can access all branches for free.</p>
                                            </div>
                                        </div>
                                    </button>

                                    <button 
                                        disabled={subLoading}
                                        onClick={() => handleSubscriptionChange('1-year')}
                                        className={`w-full p-4 rounded-xl border text-left transition-all cursor-pointer ${subscription === '1-year' ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-slate-200/80 hover:border-slate-300'}`}
                                    >
                                        <div className="flex items-center gap-3.5">
                                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${subscription === '1-year' ? 'bg-primary text-white shadow-sm' : 'bg-slate-100 text-slate-400'}`}>
                                                <IoCalendarOutline size={18} />
                                            </div>
                                            <div>
                                                <h3 className="text-xs font-bold text-slate-800">1 Year Validity</h3>
                                                <p className="text-[11px] text-slate-500 mt-0.5">Users have access for 1 year from their first login date.</p>
                                            </div>
                                        </div>
                                    </button>

                                    <button 
                                        disabled={subLoading}
                                        onClick={() => handleSubscriptionChange('paid')}
                                        className={`w-full p-4 rounded-xl border text-left transition-all cursor-pointer ${subscription === 'paid' ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-slate-200/80 hover:border-slate-300'}`}
                                    >
                                        <div className="flex items-center gap-3.5">
                                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${subscription === 'paid' ? 'bg-primary text-white shadow-sm' : 'bg-slate-100 text-slate-400'}`}>
                                                <IoCardOutline size={18} />
                                            </div>
                                            <div>
                                                <h3 className="text-xs font-bold text-slate-800">Paid Model</h3>
                                                <p className="text-[11px] text-slate-500 mt-0.5">Users will be required to pay for access. Redirects non-paid users to pricing.</p>
                                            </div>
                                        </div>
                                    </button>
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
