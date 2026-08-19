import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveBranch, setBranches } from '../store/slices/storeSlice';
import {
    IoAdd,
    IoSearchOutline,
    IoCloseOutline,
    IoPencilOutline,
    IoTrashOutline,
    IoAlertCircleOutline,
    IoArrowForwardOutline,
    IoDocumentTextOutline,
    IoEyeOutline,
    IoCodeSlashOutline
} from 'react-icons/io5';
import { motion, AnimatePresence } from 'framer-motion';
import { BranchApi } from '../services/api/Branch.api';
import toast from 'react-hot-toast';
import DOMPurify from 'dompurify';

// High-fidelity HTML & CSS Pamphlet Frame Renderer
const PamphletFrame = ({ htmlContent, className = "w-full h-[520px]" }) => {
    const sanitizedHtml = DOMPurify.sanitize(htmlContent || '', {
        ADD_TAGS: ['style', 'head', 'meta', 'link', 'title', 'header', 'footer', 'main', 'section', 'article', 'nav', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'li', 'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'code', 'pre', 'blockquote', 'hr', 'br', 'b', 'strong', 'i', 'em'],
        ADD_ATTR: ['target', 'style', 'class', 'id', 'href', 'rel', 'name', 'content', 'charset', 'src', 'alt', 'width', 'height']
    });

    const isFullDoc = /<!DOCTYPE|<html>|<head>|<body/i.test(sanitizedHtml);

    const docSrc = isFullDoc ? sanitizedHtml : `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <base target="_blank">
            <style>
                body { 
                    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; 
                    margin: 0; 
                    padding: 24px; 
                    color: #1e293b; 
                    background-color: #ffffff; 
                    line-height: 1.6;
                }
                * { box-sizing: border-box; }
                h1, h2, h3, h4 { color: #0f172a; margin-top: 1em; margin-bottom: 0.5em; }
                p { margin-bottom: 1em; }
                ul, ol { padding-left: 1.5em; margin-bottom: 1em; }
                li { margin-bottom: 0.25em; }
            </style>
        </head>
        <body>
            ${sanitizedHtml}
        </body>
        </html>
    `;

    return (
        <iframe
            srcDoc={docSrc}
            title="Module Pamphlet Showcase"
            className={`${className} border-0 rounded-xl bg-white w-full`}
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals"
        />
    );
};

const BranchDashboard = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { branches, currentUser } = useSelector((state) => state.store);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [pamphletModalModule, setPamphletModalModule] = useState(null);
    const [dontShowAgain, setDontShowAgain] = useState(true);

    // Edit/Create Modal Tab state
    const [modalTab, setModalTab] = useState('code'); // 'code' | 'preview'

    const [selectedBranch, setSelectedBranch] = useState(null);
    const [branchStats, setBranchStats] = useState({ projectCount: 0, taskCount: 0 });
    const [deleteConfirmation, setDeleteConfirmation] = useState("");

    const [formData, setFormData] = useState({ name: "", description: "" });

    // Strictly check if user is Admin
    const isAdmin = currentUser?.email === "balajiaadi2000@gmail.com" ||
        currentUser?.userRole?.name?.toLowerCase() === "admin";

    const fetchBranches = async () => {
        try {
            const [branchesRes] = await Promise.all([
                BranchApi.getAllBranches(),
                BranchApi.getGlobalSettings()
            ]);
            dispatch(setBranches(branchesRes.data?.data || []));
        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBranches();
    }, [dispatch]);

    // Handle Module Entry
    const handleModuleClick = (module) => {
        if (!module) return;
        const hasDescription = module.description && module.description.trim().length > 0;
        const hasSeenPamphlet = localStorage.getItem(`pamphlet_seen_${module._id}`) === 'true';

        if (hasDescription && !hasSeenPamphlet) {
            setPamphletModalModule(module);
            setDontShowAgain(true);
        } else {
            enterModule(module);
        }
    };

    const enterModule = (module) => {
        if (!module) return;
        dispatch(setActiveBranch(module));
        navigate('/');
    };

    const handleConfirmPamphletEntry = () => {
        if (pamphletModalModule) {
            const target = pamphletModalModule;
            if (dontShowAgain) {
                localStorage.setItem(`pamphlet_seen_${target._id}`, 'true');
            }
            setPamphletModalModule(null);
            enterModule(target);
        }
    };

    const handleCreateBranch = async (e) => {
        e.preventDefault();
        if (!isAdmin) {
            toast.error("Only administrators can create modules");
            return;
        }
        try {
            setLoading(true);
            await BranchApi.createBranch({ ...formData, visibility: "public" });
            toast.success("Module created successfully!");
            setIsCreateModalOpen(false);
            setFormData({ name: "", description: "" });
            fetchBranches();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create module");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateBranch = async (e) => {
        e.preventDefault();
        if (!isAdmin) {
            toast.error("Only administrators can update modules");
            return;
        }
        try {
            setLoading(true);
            await BranchApi.updateBranch(selectedBranch._id, { ...formData, visibility: "public" });
            toast.success("Module updated successfully!");
            setIsEditModalOpen(false);
            fetchBranches();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update module");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteBranch = async (e) => {
        e.preventDefault();
        if (!isAdmin) {
            toast.error("Only administrators can delete modules");
            return;
        }
        if (deleteConfirmation !== selectedBranch.name) {
            toast.error("Module name confirmation mismatch");
            return;
        }
        try {
            setLoading(true);
            await BranchApi.deleteBranch(selectedBranch._id, deleteConfirmation);
            toast.success("Module permanently deleted");
            setIsDeleteModalOpen(false);
            setDeleteConfirmation("");
            fetchBranches();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete module");
        } finally {
            setLoading(false);
        }
    };

    const openEditModal = (e, branch) => {
        e.stopPropagation();
        setSelectedBranch(branch);
        setFormData({
            name: branch.name,
            description: branch.description || ""
        });
        setModalTab('code');
        setIsEditModalOpen(true);
    };

    const openDeleteModal = async (e, branch) => {
        e.stopPropagation();
        setSelectedBranch(branch);
        setDeleteConfirmation("");
        setIsDeleteModalOpen(true);
        try {
            const res = await BranchApi.getBranchStats(branch._id);
            setBranchStats(res.data?.data || { projectCount: 0, taskCount: 0 });
        } catch (error) {
            console.error("Failed to fetch stats", error);
        }
    };

    const filteredBranches = (branches || []).filter(b =>
        b.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex-1 flex flex-col h-full bg-[#f4f5f7] overflow-y-auto custom-scrollbar w-full">
            {/* Top Clean Header Bar */}
            <div className="w-full bg-white border-b border-slate-200/70 px-6 sm:px-10 py-6">
                <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                                Modules Hub
                            </h1>
                            <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200/60">
                                {branches?.length || 0} Modules
                            </span>
                        </div>
                        <p className="text-slate-500 text-xs font-medium mt-1">
                            Select a module environment to enter its workspace or view feature pamphlets.
                        </p>
                    </div>

                    {/* Search & Actions */}
                    <div className="flex items-center gap-3">
                        <div className="relative w-56 sm:w-64">
                            <IoSearchOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search modules..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-slate-900 text-xs font-medium text-slate-800 placeholder-slate-400 transition-all shadow-xs"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <IoCloseOutline size={14} />
                                </button>
                            )}
                        </div>

                        {/* Admin Only Create Module Button */}
                        {isAdmin && (
                            <button
                                onClick={() => {
                                    setFormData({ name: "", description: "" });
                                    setModalTab('code');
                                    setIsCreateModalOpen(true);
                                }}
                                className="flex items-center gap-2 px-5 py-2.5 bg-black hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs transition-all text-xs whitespace-nowrap cursor-pointer active:scale-95"
                            >
                                <IoAdd size={16} />
                                <span>Create Module</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Modules Grid */}
            <div className="px-6 sm:px-10 py-8 flex-1">
                <div className="max-w-[1400px] mx-auto">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-2">
                            <div className="w-8 h-8 border-3 border-slate-900/20 border-t-slate-900 rounded-full animate-spin"></div>
                            <p className="text-slate-400 text-xs font-medium">Loading modules...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredBranches.map((module) => {
                                const hasPamphlet = module.description && module.description.trim().length > 0;

                                return (
                                    <div
                                        key={module._id}
                                        className="bg-white rounded-[1.75rem] p-6 shadow-sm hover:shadow-xl border border-slate-200/80 transition-all duration-300 flex flex-col justify-between h-[280px] relative group"
                                    >
                                        {/* Top Row: Circular Avatar & Admin Quick Actions */}
                                        <div className="flex items-center justify-between">
                                            <div className="w-12 h-12 rounded-full border border-slate-100 bg-white flex items-center justify-center shadow-xs shrink-0 overflow-hidden font-bold text-slate-800 text-lg">
                                                {module.logo ? (
                                                    <img src={module.logo} alt={module.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span>{module.name.charAt(0).toUpperCase()}</span>
                                                )}
                                            </div>

                                            {/* Admin Only Quick Actions */}
                                            {isAdmin && (
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                                    <button
                                                        onClick={(e) => openEditModal(e, module)}
                                                        className="p-1.5 text-slate-400 hover:text-slate-900 transition-colors rounded-lg bg-slate-50 border border-slate-200"
                                                        title="Edit Module"
                                                    >
                                                        <IoPencilOutline size={13} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => openDeleteModal(e, module)}
                                                        className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors rounded-lg bg-slate-50 border border-slate-200"
                                                        title="Delete Module"
                                                    >
                                                        <IoTrashOutline size={13} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Middle Row: Metadata, Large Heading & Grey Tag Pills */}
                                        <div className="my-2">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <span className="text-xs font-bold text-slate-800">Module Hub</span>
                                                <span className="text-slate-300">•</span>
                                                <span className="text-xs text-slate-400 font-medium">Operational</span>
                                            </div>

                                            <h3 className="text-xl font-bold text-slate-900 tracking-tight leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                                                {module.name}
                                            </h3>

                                            <div className="flex flex-wrap items-center gap-2 mt-3">
                                                <span className="px-3 py-1 bg-[#eef0f2] text-slate-700 text-xs font-medium rounded-lg">
                                                    Workspace
                                                </span>
                                                {hasPamphlet && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setPamphletModalModule(module);
                                                        }}
                                                        className="px-3 py-1 bg-[#eef0f2] hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                                                    >
                                                        <IoDocumentTextOutline size={13} className="text-slate-600" />
                                                        <span>Pamphlet Guide</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Bottom Row: Metadata Info & Black Pill Action Button */}
                                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-bold text-slate-900">System Ready</p>
                                                <p className="text-[11px] text-slate-400 font-medium">Data Vault Active</p>
                                            </div>

                                            <button
                                                onClick={() => handleModuleClick(module)}
                                                className="px-5 py-2.5 bg-black hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                                            >
                                                <span>Enter Module</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Admin Only "Add New Module" Card */}
                            {isAdmin && (
                                <div
                                    onClick={() => {
                                        setFormData({ name: "", description: "" });
                                        setModalTab('code');
                                        setIsCreateModalOpen(true);
                                    }}
                                    className="bg-white rounded-[1.75rem] p-6 shadow-sm border-2 border-dashed border-slate-200 hover:border-black transition-all duration-300 flex flex-col justify-between h-[280px] cursor-pointer group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-black group-hover:text-white flex items-center justify-center text-slate-600 transition-colors shadow-xs">
                                            <IoAdd size={22} />
                                        </div>
                                        <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-xl text-[11px] font-semibold">
                                            Admin Action
                                        </span>
                                    </div>

                                    <div>
                                        <h4 className="text-xl font-bold text-slate-900 tracking-tight mb-1">
                                            Create New Module
                                        </h4>
                                        <p className="text-xs text-slate-400 font-medium">
                                            Establish a dedicated module workspace with HTML/CSS pamphlet.
                                        </p>
                                    </div>

                                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                        <span className="text-xs text-slate-400 font-medium">Click to setup</span>
                                        <button className="px-5 py-2.5 bg-black text-white text-xs font-bold rounded-xl">
                                            Create
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* PAMPHLET SHOWCASE MODAL WITH FULL HTML & CSS RENDERING */}
            <AnimatePresence>
                {pamphletModalModule && (
                    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 sm:p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setPamphletModalModule(null)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
                        ></motion.div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98, y: 10 }}
                            className="relative bg-white rounded-[1.75rem] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 z-10 my-auto"
                        >
                            {/* Modal Header */}
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                                        {pamphletModalModule.logo ? (
                                            <img src={pamphletModalModule.logo} alt={pamphletModalModule.name} className="w-full h-full object-cover rounded-full" />
                                        ) : (
                                            <span>{pamphletModalModule.name.charAt(0).toUpperCase()}</span>
                                        )}
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-slate-900">
                                            {pamphletModalModule.name} — Feature Pamphlet Guide
                                        </h2>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setPamphletModalModule(null)}
                                    className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors rounded-lg hover:bg-slate-200/60 cursor-pointer"
                                >
                                    <IoCloseOutline size={20} />
                                </button>
                            </div>

                            {/* Modal Body: High Fidelity HTML/CSS Iframe Renderer */}
                            <div className="p-4 flex-1 bg-slate-100 overflow-hidden flex flex-col min-h-0">
                                <PamphletFrame
                                    htmlContent={pamphletModalModule.description}
                                    className="w-full flex-1 min-h-[380px] h-full rounded-xl shadow-inner"
                                />
                            </div>

                            {/* Modal Footer */}
                            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-4 shrink-0">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={dontShowAgain}
                                        onChange={(e) => setDontShowAgain(e.target.checked)}
                                        className="w-4 h-4 rounded text-black focus:ring-black border-slate-300 cursor-pointer"
                                    />
                                    <span className="text-xs text-slate-600 font-medium">
                                        Don't show this pamphlet automatically on entry
                                    </span>
                                </label>

                                <button
                                    type="button"
                                    onClick={handleConfirmPamphletEntry}
                                    className="px-6 py-2.5 bg-black hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 text-xs cursor-pointer active:scale-95 z-20"
                                >
                                    <span>Enter Module</span>
                                    <IoArrowForwardOutline size={14} />
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* CREATE / EDIT MODULE MODAL (ADMIN ONLY) */}
            <AnimatePresence>
                {isAdmin && (isCreateModalOpen || isEditModalOpen) && (
                    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => {
                                setIsCreateModalOpen(false);
                                setIsEditModalOpen(false);
                            }}
                            className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs"
                        ></motion.div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98, y: 10 }}
                            className="relative bg-white rounded-[1.75rem] shadow-xl p-6 w-full max-w-3xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col"
                        >
                            <button
                                onClick={() => {
                                    setIsCreateModalOpen(false);
                                    setIsEditModalOpen(false);
                                }}
                                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-100 z-10"
                            >
                                <IoCloseOutline size={18} />
                            </button>

                            <div className="mb-4">
                                <h2 className="text-lg font-bold text-slate-900">
                                    {isCreateModalOpen ? "Create Module" : "Edit Module"}
                                </h2>
                                <p className="text-slate-500 text-xs mt-0.5">
                                    Configure module name and HTML/CSS pamphlet guide.
                                </p>
                            </div>

                            <form onSubmit={isCreateModalOpen ? handleCreateBranch : handleUpdateBranch} className="space-y-4 flex-1 flex flex-col overflow-hidden">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Module Name</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 text-xs font-medium outline-none focus:border-black focus:ring-1 focus:ring-black/20 transition-all"
                                        placeholder="e.g. Software Development or Revision"
                                    />
                                </div>

                                {/* Description Field with Source Code / Live Pamphlet Preview Tabs */}
                                <div className="flex-1 flex flex-col min-h-0">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-xs font-semibold text-slate-700">
                                            Module Pamphlet Content (HTML / CSS Supported)
                                        </label>
                                        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                                            <button
                                                type="button"
                                                onClick={() => setModalTab('code')}
                                                className={`px-3 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all ${modalTab === 'code' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                                                    }`}
                                            >
                                                <IoCodeSlashOutline size={13} />
                                                <span>HTML Source</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setModalTab('preview')}
                                                className={`px-3 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all ${modalTab === 'preview' ? 'bg-black text-white shadow-xs' : 'text-slate-500 hover:text-slate-700'
                                                    }`}
                                            >
                                                <IoEyeOutline size={13} />
                                                <span>Live Preview</span>
                                            </button>
                                        </div>
                                    </div>

                                    {modalTab === 'code' ? (
                                        <textarea
                                            rows="10"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full flex-1 bg-slate-900 text-slate-100 font-mono text-xs p-4 rounded-xl border border-slate-800 outline-none focus:ring-1 focus:ring-slate-700 transition-all resize-none min-h-[300px]"
                                            placeholder="<!DOCTYPE html>&#10;<html>&#10;<head>&#10;  <style>h1 { color: #000; }</style>&#10;</head>&#10;<body>&#10;  <h1>Module Guide</h1>&#10;</body>&#10;</html>"
                                        />
                                    ) : (
                                        <div className="w-full flex-1 border border-slate-200 rounded-xl overflow-hidden min-h-[300px]">
                                            <PamphletFrame
                                                htmlContent={formData.description}
                                                className="w-full h-full min-h-[300px]"
                                            />
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 bg-black hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs transition-all active:scale-98 disabled:opacity-50 text-xs cursor-pointer mt-2"
                                >
                                    {loading ? "Saving..." : (isCreateModalOpen ? "Create Module" : "Save Changes")}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* DELETE CONFIRMATION MODAL (ADMIN ONLY) */}
            <AnimatePresence>
                {isAdmin && isDeleteModalOpen && (
                    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs"
                        ></motion.div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98, y: 10 }}
                            className="relative bg-white rounded-[1.75rem] shadow-xl p-6 w-full max-w-md overflow-hidden border border-slate-200"
                        >
                            <div className="flex items-start gap-3 mb-4">
                                <div className="w-10 h-10 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 shrink-0 border border-rose-100">
                                    <IoAlertCircleOutline size={24} />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-slate-900">Delete Module</h2>
                                    <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">
                                        This action cannot be undone. All projects and tasks in this module will be permanently removed.
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleDeleteBranch} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                                        Type <span className="text-rose-600 font-bold">"{selectedBranch?.name}"</span> to confirm:
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        value={deleteConfirmation}
                                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                                        className="w-full bg-white border border-rose-200 rounded-xl px-3.5 py-2.5 text-rose-600 font-semibold text-xs outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20"
                                        placeholder={selectedBranch?.name}
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsDeleteModalOpen(false)}
                                        className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all text-xs"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || deleteConfirmation !== selectedBranch?.name}
                                        className="flex-[2] py-2.5 bg-rose-600 text-white font-bold rounded-xl shadow-xs hover:bg-rose-700 transition-all disabled:opacity-50 text-xs cursor-pointer"
                                    >
                                        {loading ? "Deleting..." : "Confirm Deletion"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default BranchDashboard;
