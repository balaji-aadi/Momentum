import React from 'react';
import { IoAlertCircleOutline } from 'react-icons/io5';

const TrollingEmptyState = ({ period = 'day' }) => {
    const trolls = [
        {
            face: "🤡",
            message: "Nothing you do in this day! Absolute zero.",
            sub: "Even a sloth does more than this."
        },
        {
            face: "🙈",
            message: "I can't see any productivity here.",
            sub: "Are you even awake? Recheck your life choices."
        },
        {
            face: "🐢",
            message: "Slow down! Oh wait, you haven't even started.",
            sub: "You're making the turtles look fast."
        },
        {
            face: "🥱",
            message: "This graph is as bored as you are.",
            sub: "Stats flatlining... just like your motivation?"
        },
        {
            face: "🌵",
            message: "This is a productivity desert.",
            sub: "Nothing grows here. Especially not your career."
        }
    ];

    const randomTroll = trolls[Math.floor(Math.random() * trolls.length)];

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] animate-in zoom-in-95 duration-500 overflow-hidden relative group transition-all hover:border-indigo-200 hover:bg-white">
            {/* Background floating face */}
            <div className="absolute -right-4 -bottom-4 text-[120px] opacity-[0.03] group-hover:opacity-[0.08] transition-opacity rotate-12 group-hover:scale-110 duration-700 select-none">
                {randomTroll.face}
            </div>
            
            <div className="relative z-10 flex flex-col items-center text-center">
                <div className="text-6xl mb-4 animate-bounce hover:animate-spin transition-all duration-300 cursor-pointer">
                    {randomTroll.face}
                </div>
                
                <h3 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight">
                    {randomTroll.message}
                </h3>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest italic opacity-70">
                    {randomTroll.sub}
                </p>
                
                <div className="mt-8 px-5 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-100 hover:scale-105 transition-transform cursor-pointer">
                    GET TO WORK STUPID!
                </div>
            </div>
        </div>
    );
};

export default TrollingEmptyState;
