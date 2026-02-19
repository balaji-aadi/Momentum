import React from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { IoSettingsOutline } from 'react-icons/io5';
import CreateProject from './CreateProject'; // Reusing the form component

const Settings = () => {
    const { project } = useOutletContext();
    const navigate = useNavigate();

    return (
        <div className="">
            <div className="mb-6 pb-6 border-b border-borderLight">
                <h1 className="text-2xl font-bold text-textMain flex items-center gap-3">
                    <IoSettingsOutline />
                    Project Settings
                </h1>
                <p className="text-textSub mt-1">Manage project details, team members, and configurations.</p>
            </div>
            
            {/* Reuse CreateProject in "Update" mode */}
            {project ? (
                <CreateProject 
                    data={project} 
                    isUpdating={true} 
                    id={project._id}
                    setIsUpdating={() => {}} // Optional: handle state update if needed
                />
            ) : (
                <div className="p-8 text-center text-textSub">Loading settings...</div>
            )}
        </div>
    );
};

export default Settings;
