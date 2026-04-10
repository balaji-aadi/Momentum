import React, { useMemo, useState, useEffect } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './quill-override.css';

// Decode HTML entities that might be escaped by backend xss-clean middleware
const unescapeHTML = (str) => {
    if (!str) return '';
    const txt = document.createElement('textarea');
    txt.innerHTML = str;
    return txt.value;
};

const GridSection = ({ section, updateSection, removeSection, searchQuery }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [editingRowId, setEditingRowId] = useState(null);
  const PAGE_SIZE = 15;

  const handleTitleChange = (e) => {
    updateSection({ ...section, title: e.target.value });
  };

  const addRow = () => {
    const newRow = { 
        id: `row_${Date.now()}`, 
        date: new Date().toISOString().split('T')[0],
        content: ''
    };
    updateSection({ ...section, rows: [newRow, ...section.rows] });
    setEditingRowId(newRow.id); // Auto-focus new row
    setCurrentPage(1);
  };

  const updateRow = (rowId, field, value) => {
    const updatedRows = section.rows.map(r => r.id === rowId ? { ...r, [field]: value } : r);
    updateSection({ ...section, rows: updatedRows });
  };

  const removeRow = (rowId) => {
    const updatedRows = section.rows.filter(r => r.id !== rowId);
    updateSection({ ...section, rows: updatedRows });
  };

  const filteredRows = useMemo(() => {
     if (!searchQuery) return section.rows;
     const lowerQuery = searchQuery.toLowerCase();
     return section.rows.filter(row => {
         const d = row.date || '';
         const c = row.content ? String(row.content).replace(/<[^>]+>/g, '') : '';
         const v = row.verdict || '';
         return d.toLowerCase().includes(lowerQuery) || 
                c.toLowerCase().includes(lowerQuery) || 
                v.toLowerCase().includes(lowerQuery);
     });
  }, [section.rows, searchQuery]);

  const paginatedRows = useMemo(() => {
     const start = (currentPage - 1) * PAGE_SIZE;
     return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  
  useEffect(() => {
      if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const todayStr = new Date().toISOString().split('T')[0];

  // Rich Text Quilt Configurations
  const quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
      ['link', 'image'],                                // link and image (attachments)
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['clean']                                         // remove formatting button
    ],
  };

  return (
    <div className="flex flex-col h-full w-full bg-white border border-borderLight rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] overflow-hidden group/section">
        {/* Section Header */}
        <div className="flex items-center justify-between p-4 border-b border-borderLight bg-slate-50/80">
            <div className="flex items-center gap-3 w-full">
                <span className="text-textSub font-bold text-sm tracking-widest uppercase">Topic:</span>
                <input 
                    type="text" 
                    value={section.title}
                    onChange={handleTitleChange}
                    className="font-bold text-lg text-primary bg-transparent border-b border-transparent hover:border-borderLight focus:border-primary focus:outline-none rounded-none px-1 py-1 w-full max-w-[400px] transition-all"
                    placeholder="Topic Name (e.g., Arduino)"
                />
            </div>
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => removeSection(section.id)}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                    title="Delete Entire Topic Column"
                >
                    <FaTrash size={12} /> Delete
                </button>
            </div>
        </div>

        {/* Section Table Body */}
        <div className="flex-1 overflow-auto custom-scrollbar relative">
            <div className="w-full min-w-[800px] flex flex-col">
                {/* Fixed Headers for this table */}
                <div className="flex sticky top-0 bg-slate-50 border-b border-borderLight z-20 text-xs font-bold text-slate-500 uppercase tracking-wider shadow-sm">
                    <div className="p-4 border-r border-borderLight w-[70px] flex-shrink-0 text-center">S.No</div>
                    <div className="p-4 border-r border-borderLight w-[150px] flex-shrink-0">Log Date</div>
                    <div className="p-4 border-r border-borderLight flex-1 min-w-[300px]">Content & Notes</div>
                    <div className="p-4 w-[80px] flex-shrink-0 bg-slate-50/90 text-center">Del</div>
                </div>

                {/* Rows specific to this section */}
                <div className="flex flex-col w-full h-full pb-32">
                    {paginatedRows.length === 0 ? (
                        <div className="p-12 text-center text-textSub italic">
                            {searchQuery ? 'No matching logs found.' : 'No entries yet. Add a row below to start tracking.'}
                        </div>
                    ) : (
                        paginatedRows.map((row, idx) => {
                            const globalIndex = (currentPage - 1) * PAGE_SIZE + idx + 1;
                            const isToday = row.date === todayStr;
                            
                            return (
                                <div key={row.id} className={`flex border-b border-borderLight/50 hover:bg-slate-50/50 transition-all duration-150 ${isToday ? 'bg-orange-50/20' : 'bg-white'}`}>
                                    {/* S.No */}
                                    <div className="p-4 border-r border-borderLight/50 w-[70px] flex-shrink-0 flex items-start justify-center">
                                        <span className="text-textSub font-bold text-sm bg-slate-100 w-8 h-8 flex items-center justify-center rounded-full mt-1.5">{globalIndex}</span>
                                    </div>
                                    
                                    {/* Date */}
                                    <div className="p-4 border-r border-borderLight/50 w-[150px] flex-shrink-0 flex items-start">
                                        <input 
                                            type="date" 
                                            value={row.date || ''} 
                                            onChange={(e) => updateRow(row.id, 'date', e.target.value)}
                                            className={`w-full bg-slate-50 border border-borderLight mt-1 focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-lg px-3 py-2 text-sm transition-colors ${isToday ? 'border-orange-200 text-orange-700 bg-orange-50/50 font-semibold' : 'text-textMain hover:bg-white'}`}
                                        />
                                    </div>

                                    {/* Content (Rich Text OR Rendered HTML) */}
                                    <div className="p-4 border-r border-borderLight/50 flex-1 min-w-[300px] flex flex-col">
                                        {editingRowId === row.id ? (
                                            <div className="bg-white border text-sm border-primary/50 relative rounded-lg focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-transparent transition-all overflow-hidden h-full shadow-sm">
                                                <ReactQuill 
                                                    theme="snow" 
                                                    value={unescapeHTML(row.content || '')} 
                                                    onChange={(val) => updateRow(row.id, 'content', val)}
                                                    modules={quillModules}
                                                    className="quill-minimal h-full p-0 border-none"
                                                    placeholder="Write your notes, logs, insert links or images here..."
                                                />
                                                <button 
                                                    onClick={() => setEditingRowId(null)}
                                                    className="absolute top-2 right-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white text-[10px] font-bold px-3 py-1 rounded-full transition-colors border border-emerald-200 shadow-sm"
                                                >
                                                    Done Editing
                                                </button>
                                            </div>
                                        ) : (
                                            <div 
                                                className={`cursor-text h-full min-h-[50px] p-3 rounded-lg border border-transparent hover:border-borderLight hover:bg-slate-50 transition-colors`}
                                                onClick={() => setEditingRowId(row.id)}
                                            >
                                                {row.content && row.content.trim() !== '' && row.content !== '<p><br></p>' ? (
                                                     <div 
                                                        className={`prose prose-sm max-w-none text-slate-700 leading-relaxed`}
                                                        dangerouslySetInnerHTML={{ __html: unescapeHTML(row.content) }}
                                                    />
                                                ) : (
                                                    <span className="text-slate-400 italic text-sm">Click here to add rich text notes, images, or links...</span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="p-4 w-[80px] flex-shrink-0 flex items-start justify-center">
                                        <button 
                                            onClick={() => removeRow(row.id)}
                                            className="text-slate-400 hover:text-white bg-slate-50 mt-1 hover:bg-rose-500 border border-borderLight rounded-lg p-2.5 transition-colors shadow-sm"
                                            title="Delete log permanently"
                                        >
                                            <FaTrash size={14} className="mx-auto" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>

        {/* Section Footer (Pagination and Add Row) */}
        <div className="p-4 border-t border-borderLight bg-slate-50/80 flex items-center justify-between shrink-0 z-20">
            <button 
                onClick={addRow} 
                className="flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-primary hover:bg-primary/90 shadow-md shadow-primary/20 rounded-lg transition-all"
            >
                <FaPlus size={12} /> Add New Log
            </button>
            
            {filteredRows.length > PAGE_SIZE && (
                <div className="flex items-center gap-2 text-sm bg-white border border-borderLight rounded-lg p-1 shadow-sm">
                    <button 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => p - 1)}
                        className="px-3 py-1.5 rounded-md hover:bg-slate-100 disabled:opacity-40 text-textMain font-semibold transition-colors"
                    >
                        Prev
                    </button>
                    <span className="text-textSub font-bold px-3">Page {currentPage} of {totalPages}</span>
                    <button 
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => p + 1)}
                        className="px-3 py-1.5 rounded-md hover:bg-slate-100 disabled:opacity-40 text-textMain font-semibold transition-colors"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    </div>
  );
};

export default GridSection;
