import React from 'react';
import { IoWarningOutline, IoCheckmarkCircleOutline, IoAlertCircleOutline } from 'react-icons/io5';

const RiskCard = ({ healthScore, riskFactors }) => {
    let statusColor = 'text-green-500';
    let statusBg = 'bg-green-50';
    let statusText = 'Healthy';
    let Icon = IoCheckmarkCircleOutline;

    if (healthScore < 50) {
        statusColor = 'text-red-500';
        statusBg = 'bg-red-50';
        statusText = 'Critical';
        Icon = IoAlertCircleOutline;
    } else if (healthScore < 80) {
        statusColor = 'text-amber-500';
        statusBg = 'bg-amber-50';
        statusText = 'At Risk';
        Icon = IoWarningOutline;
    }

    return (
        <div className="bg-white p-6 rounded-xl border border-borderLight shadow-sm">
            <h3 className="text-lg font-semibold text-textMain mb-4 flex items-center gap-2">
                <Icon className={statusColor} size={24} />
                Project Health
            </h3>

            <div className="flex items-center gap-6">
                {/* Gauge / Score */}
                <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="w-full h-full" viewBox="0 0 36 36">
                        <path
                            className="text-gray-100"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                        />
                        <path
                            className={`${statusColor} transition-all duration-1000 ease-out`}
                            strokeDasharray={`${healthScore}, 100`}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                        />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                        <span className={`text-3xl font-bold ${statusColor}`}>{healthScore}</span>
                        <span className="text-xs text-textSub uppercase">Score</span>
                    </div>
                </div>

                {/* Risk Factors */}
                <div className="flex-1">
                    <h4 className="text-sm font-medium text-textMain mb-2">Risk Factors Identified:</h4>
                    {riskFactors.length > 0 ? (
                        <ul className="space-y-2">
                            {riskFactors.map((factor, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm text-textSub">
                                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0"></span>
                                    {factor}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-green-600 flex items-center gap-1">
                            <IoCheckmarkCircleOutline /> No significant risks detected.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RiskCard;
