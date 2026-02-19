import React, { useEffect, useState } from 'react';
import { ProjectApi } from '../../services/api/Project.api';
import { useNavigate } from 'react-router-dom';
import { IoAdd, IoSearchOutline, IoGridOutline, IoListOutline, IoFlagOutline } from 'react-icons/io5';
import moment from 'moment';
import { Table } from '../../components/Table/Table';
import { FaEdit } from 'react-icons/fa';
import { useFormik } from 'formik';
import toast from 'react-hot-toast';
import InputField from '../../components/InputField';

const ProjectList = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const res = await ProjectApi.getAllProjects();
            setProjects(res.data?.data || []);
        } catch (error) {
            console.error("Failed to fetch projects", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredProjects = projects.filter(p => 
        p.name?.toLowerCase().includes(search.toLowerCase()) || 
        p.description?.toLowerCase().includes(search.toLowerCase())
    );

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentProjects = filteredProjects.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handleEditProject = (project) => {
        navigate('/project/create-project', { state: { project } });
    };

    const openMilestoneModal = (projectId) => {
        setSelectedProjectId(projectId);
        setIsMilestoneModalOpen(true);
    };

    const closeMilestoneModal = () => {
        setIsMilestoneModalOpen(false);
        setSelectedProjectId(null);
        milestoneFormik.resetForm();
    };

    const milestoneFormik = useFormik({
        initialValues: {
            milestoneName: "",
            summary: "",
            commenceDate: "",
            expectedDate: "",
            deliverables: ""
        },
        onSubmit: async (values) => {
            if (!selectedProjectId) return;
            try {
                await ProjectApi.createMileStone(selectedProjectId, values);
                toast.success("Milestone added successfully!");
                closeMilestoneModal();
            } catch (error) {
                console.error("Failed to add milestone", error);
                toast.error("Failed to add milestone");
            }
        }
    });

    const columnDefs = [
        { headerName: "Project Name", field: "name" },
        { headerName: "Key", field: "key" },
        { headerName: "Status", field: "status" },
        { headerName: "Priority", field: "priority" },
        { 
            headerName: "Start Date", 
            field: "startDate",
            valueFormatter: (params) => moment(params.value).format("MMM D, YYYY")
        },
        { 
            headerName: "End Date", 
            field: "endDate",
            valueFormatter: (params) => moment(params.value).format("MMM D, YYYY")
        },
        {
            headerName: "Actions",
            field: "actions",
            cellRenderer: (params) => (
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => navigate(`/project/${params.data._id}/overview`)}
                        className="text-primary hover:underline text-sm font-medium"
                        title="View Board"
                    >
                        View Project
                    </button>
                    <button 
                        onClick={() => handleEditProject(params.data)}
                        className="text-blue-500 hover:text-blue-700"
                        title="Edit Project"
                    >
                        <FaEdit />
                    </button>
                    <button 
                        onClick={() => openMilestoneModal(params.data._id)}
                        className="text-amber-500 hover:text-amber-700"
                        title="Add Milestone"
                    >
                        <IoFlagOutline />
                    </button>
                </div>
            )
        }
    ];

    const getProjectsForTable = async () => {
        return { data: { data: filteredProjects } }; // Wrapping to match Table expectation if it calls API directly, but we have data. 
        // Actually Table calls getTableFunction. If we pass a function it awaits it.
        // Let's pass the API function BUT we want to filter? Table handles search internally if we use its search.
        // For consistent UI with Grid, let's use the API directly and let Table handle it.
         return await ProjectApi.getAllProjects();
    };

    return (
        <div className="p-6 bg-bgLight min-h-full flex flex-col">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-textMain">Projects</h1>
                    <p className="text-textSub text-sm mt-1">Manage and track all your ongoing projects</p>
                </div>
                <div className="flex items-center gap-3">
                     <div className="flex bg-white p-1 rounded-lg border border-borderLight mr-2">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-textSub hover:text-textMain'}`}
                            title="Grid View"
                        >
                            <IoGridOutline />
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-primary/10 text-primary' : 'text-textSub hover:text-textMain'}`}
                            title="List View"
                        >
                            <IoListOutline />
                        </button>
                     </div>

                     {viewMode === 'grid' && (
                        <div className="relative">
                            <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-textSub" />
                            <input 
                                type="text" 
                                placeholder="Search projects..." 
                                className="pl-10 pr-4 py-2 rounded-xl border border-borderLight focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white text-sm w-64"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                     )}
                     
                     <button 
                        onClick={() => navigate('/project/create-project')}
                        className="bg-primary hover:bg-primaryHover text-white px-4 py-2 rounded-xl font-semibold shadow-lg shadow-primary/30 flex items-center gap-2 transition-transform active:scale-95"
                     >
                        <IoAdd size={18} />
                        <span>New Project</span>
                     </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1">
                {viewMode === 'table' ? (
                    <div className="bg-surface rounded-2xl shadow-sm border border-borderLight overflow-hidden h-[calc(100vh-200px)]">
                         <Table
                            column={columnDefs}
                            getTableFunction={ProjectApi.getAllProjects}
                            searchLabel={"Project"}
                            totalCount={true}
                        />
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {loading ? (
                                [...Array(4)].map((_, i) => (
                                    <div key={i} className="bg-surface h-48 rounded-2xl shadow-sm border border-borderLight animate-pulse"></div>
                                ))
                            ) : currentProjects.length > 0 ? (
                                currentProjects.map((project) => (
                                    <div 
                                        key={project._id} 
                                        className="bg-surface rounded-2xl p-5 shadow-sm border border-borderLight hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group flex flex-col justify-between relative"
                                    >
                                        <div onClick={() => navigate(`/project/${project._id}/overview`)}>
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
                                                    {project.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${project.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                                    {project.status || 'Active'}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-bold text-textMain mb-1 group-hover:text-primary transition-colors line-clamp-1 pr-14">{project.name}</h3>
                                            <p className="text-sm text-textSub line-clamp-2 min-h-[2.5em] mb-3">{project.description || "No description provided."}</p>
                                            
                                            {/* Progress Section */}
                                            <div className="mb-2">
                                                <div className="flex justify-between items-center text-xs text-textSub mb-1">
                                                    <span>Progress</span>
                                                    <span className="font-medium text-textMain">
                                                        {project.taskStats?.percentage || 0}% ({project.taskStats?.completed || 0}/{project.taskStats?.total || 0} tasks)
                                                    </span>
                                                </div>
                                                <div className="w-full h-2 bg-borderLight rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out"
                                                        style={{ width: `${project.taskStats?.percentage || 0}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-surface/80 backdrop-blur-sm rounded-lg p-1 shadow-sm border border-borderLight/50">
                                             <button 
                                                onClick={(e) => { e.stopPropagation(); openMilestoneModal(project._id); }}
                                                className="p-1.5 text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                                                title="Add Milestone"
                                             >
                                                <IoFlagOutline size={16} />
                                             </button>
                                             <button 
                                                onClick={(e) => { e.stopPropagation(); handleEditProject(project); }}
                                                className="p-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                                title="Edit Project"
                                             >
                                                <FaEdit size={16} />
                                             </button>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-borderLight flex items-center justify-between text-xs text-textSub">
                                            <div className="flex -space-x-2">
                                                 {/* Teammates avatars if available */}
                                                 {(project.teamMembers || []).slice(0, 3).map((member, idx) => (
                                                     <img 
                                                        key={idx}
                                                        src={member.profileImage || `https://ui-avatars.com/api/?name=${member.firstName}+${member.lastName}&background=random`}
                                                        alt={member.firstName}
                                                        className="w-6 h-6 rounded-full border-2 border-white object-cover"
                                                        title={`${member.firstName} ${member.lastName}`}
                                                     />
                                                 ))}
                                                 {(project.teamMembers?.length || 0) > 3 && (
                                                     <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-textSub">
                                                         +{project.teamMembers.length - 3}
                                                     </div>
                                                 )}
                                            </div>
                                            <span>{moment(project.createdAt).format("MMM D, YYYY")}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-20 text-textSub">
                                    <p>No projects found. Create one to get started!</p>
                                </div>
                            )}
                        </div>
                        {/* Pagination for Grid */}
                        {!loading && totalPages > 1 && (
                            <div className="mt-8 flex justify-center items-center gap-2">
                                <button 
                                    onClick={() => paginate(currentPage - 1)} 
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 bg-white border border-borderLight rounded-lg text-sm text-textSub disabled:opacity-50 hover:bg-slate-50 disabled:hover:bg-white transition-colors"
                                >
                                    Previous
                                </button>
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => paginate(i + 1)}
                                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                                            currentPage === i + 1 
                                                ? 'bg-primary text-white shadow-sm' 
                                                : 'bg-white border border-borderLight text-textSub hover:bg-slate-50'
                                        }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button 
                                    onClick={() => paginate(currentPage + 1)} 
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 bg-white border border-borderLight rounded-lg text-sm text-textSub disabled:opacity-50 hover:bg-slate-50 disabled:hover:bg-white transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
            {/* Milestone Modal */}
            {isMilestoneModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 m-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Add Milestone</h2>
                            <button onClick={closeMilestoneModal} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                                ✕
                            </button>
                        </div>
                        <form onSubmit={milestoneFormik.handleSubmit} className="space-y-4">
                            <InputField
                                label="Milestone Name"
                                name="milestoneName"
                                type="text"
                                placeholder="Enter milestone name..."
                                value={milestoneFormik.values.milestoneName}
                                onChange={milestoneFormik.handleChange}
                                onBlur={milestoneFormik.handleBlur}
                                error={milestoneFormik.touched.milestoneName && milestoneFormik.errors.milestoneName}
                                isRequired
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <InputField
                                    label="Start Date"
                                    name="commenceDate"
                                    type="date"
                                    value={milestoneFormik.values.commenceDate}
                                    onChange={milestoneFormik.handleChange}
                                    onBlur={milestoneFormik.handleBlur}
                                    error={milestoneFormik.touched.commenceDate && milestoneFormik.errors.commenceDate}
                                    isRequired
                                />
                                <InputField
                                    label="End Date"
                                    name="expectedDate"
                                    type="date"
                                    value={milestoneFormik.values.expectedDate}
                                    onChange={milestoneFormik.handleChange}
                                    onBlur={milestoneFormik.handleBlur}
                                    error={milestoneFormik.touched.expectedDate && milestoneFormik.errors.expectedDate}
                                    isRequired
                                />
                            </div>
                            <InputField
                                label="Summary"
                                name="summary"
                                type="textarea"
                                placeholder="Describe the milestone..."
                                value={milestoneFormik.values.summary}
                                onChange={milestoneFormik.handleChange}
                                onBlur={milestoneFormik.handleBlur}
                                error={milestoneFormik.touched.summary && milestoneFormik.errors.summary}
                            />
                            <InputField
                                label="Deliverables (comma separated)"
                                name="deliverables"
                                type="text"
                                placeholder="e.g. Design, API, Testing"
                                value={milestoneFormik.values.deliverables}
                                onChange={milestoneFormik.handleChange}
                                onBlur={milestoneFormik.handleBlur}
                                error={milestoneFormik.touched.deliverables && milestoneFormik.errors.deliverables}
                            />
                            
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={closeMilestoneModal}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primaryHover shadow-lg shadow-primary/30 transition-colors"
                                >
                                    Add Milestone
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectList;
