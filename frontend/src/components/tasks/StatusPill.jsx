import React from 'react';

const StatusPill = ({ status }) => {
    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case 'urgent':
                return 'bg-red-100 text-red-600 border-red-200';
            case 'normal':
                return 'bg-emerald-100 text-emerald-600 border-emerald-200';
            case 'low':
                return 'bg-gray-100 text-gray-600 border-gray-200';
            case 'in progress':
                return 'bg-amber-100 text-amber-600 border-amber-200';
            case 'completed':
            case 'done':
                return 'bg-blue-100 text-blue-600 border-blue-200';
            default:
                return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusStyle(status)} flex items-center justify-center w-fit`}>
            {status}
        </span>
    );
};

export default StatusPill;
