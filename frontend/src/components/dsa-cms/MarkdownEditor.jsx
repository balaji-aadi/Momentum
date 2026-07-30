import React, { useState, useRef } from 'react';
import { 
  LuPencil, 
  LuEye, 
  LuColumns, 
  LuBold, 
  LuItalic, 
  LuHeading1, 
  LuHeading2, 
  LuCode, 
  LuList, 
  LuListOrdered, 
  LuQuote, 
  LuLink, 
  LuImage, 
  LuTable, 
  LuMaximize2, 
  LuMinimize2,
  LuFileCode
} from 'react-icons/lu';

import { renderMarkdown } from '../../utils/markdownRenderer';
export { renderMarkdown };

export default function MarkdownEditor({ 
  value = '', 
  onChange, 
  title = "Problem Description", 
  placeholder = "Write problem description in Markdown format...",
  minHeight = "min-h-[300px]"
}) {
  const [viewMode, setViewMode] = useState('split'); // 'write' | 'split' | 'preview'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const textareaRef = useRef(null);

  // Formatting Helper Insertion
  const insertFormatting = (prefix, suffix = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const replacement = prefix + (selectedText || 'text') + suffix;

    const newValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selectedText.length || 4));
    }, 50);
  };

  const insertTable = () => {
    const tableTemplate = `\n| Header 1 | Header 2 | Header 3 |\n| :--- | :--- | :--- |\n| Cell 1 | Cell 2 | Cell 3 |\n| Cell 4 | Cell 5 | Cell 6 |\n`;
    onChange(value + tableTemplate);
  };

  // Word & Character count
  const charCount = value.length;
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;

  return (
    <div className={`bg-surface dark:bg-slate-900 rounded-2xl border border-borderLight dark:border-slate-800 overflow-hidden shadow-xs font-sans transition-all ${
      isFullscreen ? 'fixed inset-4 z-[200] shadow-2xl flex flex-col' : 'space-y-0'
    }`}>
      {/* Top Toolbar */}
      <div className="bg-bgLight dark:bg-slate-800/60 p-3 border-b border-borderLight dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Left Title & View Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <LuFileCode className="text-primary" size={18} />
            <span className="text-xs font-bold text-textMain dark:text-white">{title}</span>
          </div>

          <div className="h-4 w-[1px] bg-borderLight dark:bg-slate-700"></div>

          {/* View Mode Buttons */}
          <div className="flex bg-surface dark:bg-slate-900 p-0.5 rounded-lg border border-borderLight dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('write')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === 'write' ? 'bg-primary text-white shadow-xs' : 'text-textSub hover:text-textMain'
              }`}
            >
              <LuPencil size={13} />
              <span>Write</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === 'split' ? 'bg-primary text-white shadow-xs' : 'text-textSub hover:text-textMain'
              }`}
            >
              <LuColumns size={13} />
              <span>Split</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === 'preview' ? 'bg-primary text-white shadow-xs' : 'text-textSub hover:text-textMain'
              }`}
            >
              <LuEye size={13} />
              <span>Preview</span>
            </button>
          </div>
        </div>

        {/* Right Formatting Tools */}
        {viewMode !== 'preview' && (
          <div className="flex items-center gap-1 flex-wrap">
            <button
              type="button"
              onClick={() => insertFormatting('# ')}
              title="Heading 1"
              className="p-1.5 text-textSub hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
            >
              <LuHeading1 size={15} />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('## ')}
              title="Heading 2"
              className="p-1.5 text-textSub hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
            >
              <LuHeading2 size={15} />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('**', '**')}
              title="Bold Text"
              className="p-1.5 text-textSub hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
            >
              <LuBold size={15} />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('*', '*')}
              title="Italic Text"
              className="p-1.5 text-textSub hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
            >
              <LuItalic size={15} />
            </button>

            <div className="h-4 w-[1px] bg-borderLight dark:bg-slate-700 mx-1"></div>

            <button
              type="button"
              onClick={() => insertFormatting('```python\n', '\n```')}
              title="Code Block"
              className="p-1.5 text-textSub hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
            >
              <LuCode size={15} />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('> ')}
              title="Blockquote"
              className="p-1.5 text-textSub hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
            >
              <LuQuote size={15} />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('- ')}
              title="Bullet List"
              className="p-1.5 text-textSub hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
            >
              <LuList size={15} />
            </button>
            <button
              type="button"
              onClick={insertTable}
              title="Insert Table"
              className="p-1.5 text-textSub hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
            >
              <LuTable size={15} />
            </button>

            <div className="h-4 w-[1px] bg-borderLight dark:bg-slate-700 mx-1"></div>

            <button
              type="button"
              onClick={() => insertFormatting('[', '](https://example.com)')}
              title="Insert Link"
              className="p-1.5 text-textSub hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
            >
              <LuLink size={15} />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('![Image Alt](', ')')}
              title="Insert Image"
              className="p-1.5 text-textSub hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
            >
              <LuImage size={15} />
            </button>

            <div className="h-4 w-[1px] bg-borderLight dark:bg-slate-700 mx-1"></div>

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={() => setIsFullscreen(prev => !prev)}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Mode"}
              className="p-1.5 text-textSub hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
            >
              {isFullscreen ? <LuMinimize2 size={15} /> : <LuMaximize2 size={15} />}
            </button>
          </div>
        )}
      </div>

      {/* Editor Body Workspace */}
      <div className={`grid ${viewMode === 'split' ? 'grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-borderLight dark:divide-slate-800' : 'grid-cols-1'} flex-1 min-h-[350px]`}>
        {/* Write Pane */}
        {viewMode !== 'preview' && (
          <div className="p-3 flex flex-col min-h-[350px]">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className={`w-full p-3 bg-transparent text-slate-900 dark:text-slate-100 font-mono text-sm leading-relaxed focus:outline-none resize-y min-h-[330px] ${isFullscreen ? 'flex-1 min-h-[500px]' : ''}`}
            ></textarea>
          </div>
        )}

        {/* Live Preview Pane */}
        {viewMode !== 'write' && (
          <div className={`p-5 bg-slate-50/70 dark:bg-slate-950 overflow-y-auto min-h-[350px] max-h-[600px] ${isFullscreen ? 'flex-1 max-h-none min-h-[500px]' : ''}`}>
            <div 
              className="prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed text-slate-900 dark:text-slate-100 font-sans"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }}
            />
          </div>
        )}
      </div>

      {/* Footer Status Bar */}
      <div className="px-4 py-2 bg-bgLight dark:bg-slate-800/40 border-t border-borderLight dark:border-slate-800 flex items-center justify-between text-[11px] text-textSub font-medium">
        <span>Markdown Supported (GFM)</span>
        <div className="flex items-center gap-3">
          <span>{charCount} characters</span>
          <span>{wordCount} words</span>
        </div>
      </div>
    </div>
  );
}
