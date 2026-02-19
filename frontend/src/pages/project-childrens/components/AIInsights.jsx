import React from 'react';
import { IoBulbOutline, IoAnalyticsOutline, IoFlashOutline } from 'react-icons/io5';

const AIInsights = ({ summary, suggestions, velocity }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Smart Summary */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100 shadow-sm relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10">
                    <IoAnalyticsOutline size={100} className="text-indigo-600" />
                 </div>
                <h3 className="text-lg font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                    <IoFlashOutline className="text-indigo-600" />
                    AI Executive Summary
                </h3>
                <div className="prose prose-sm text-indigo-800">
                    <p className="leading-relaxed whitespace-pre-line">{summary}</p>
                </div>
                 {velocity && (
                    <div className="mt-4 pt-4 border-t border-indigo-200 flex items-center gap-2">
                        <span className="text-xs font-bold bg-white/50 px-2 py-1 rounded text-indigo-700 border border-indigo-100">
                            Velocity
                        </span>
                        <span className="text-sm text-indigo-800">{velocity}</span>
                    </div>
                 )}
            </div>

            {/* Suggestions */}
            <div className="bg-white p-6 rounded-xl border border-borderLight shadow-sm">
                <h3 className="text-lg font-semibold text-textMain mb-4 flex items-center gap-2">
                    <IoBulbOutline className="text-amber-500" />
                    Intelligent Suggestions
                </h3>
                <div className="space-y-3">
                    {suggestions.length > 0 ? (
                        suggestions.map((suggestion, index) => (
                            <div key={index} className="flex gap-3 p-3 rounded-lg bg-bgLight border border-borderLight hover:border-primary/30 transition-colors group">
                                <div className="mt-0.5 text-amber-500">
                                    <IoBulbOutline />
                                </div>
                                <div>
                                    <p className="text-sm text-textMain font-medium">{suggestion.title}</p>
                                    <p className="text-xs text-textSub mt-0.5">{suggestion.desc}</p>
                                    {suggestion.action && (
                                        <button className="text-xs text-primary font-semibold mt-2 hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
                                            {suggestion.action} &rarr;
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-textSub">
                            <p>No suggestions at this time. Keep up the good work!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIInsights;
