import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import GlobalConsistencyModal from '../analytics/GlobalConsistencyModal';

const MainLayout = () => {
    return (
        <div className="flex h-screen bg-bgLight font-sans text-textMain overflow-hidden">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 ml-64 flex flex-col h-screen overflow-hidden relative">
                <Header />
                
                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-8">
                    <Outlet />
                </main>
            </div>

            {/* Global Modals */}
            <GlobalConsistencyModal />
        </div>
    );
};

export default MainLayout;
