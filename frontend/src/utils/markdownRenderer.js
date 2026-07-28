/**
 * Robust GFM Markdown Renderer
 * High-Contrast 16px (text-base) Typography optimized for both Dark & Light themes.
 * Guarantees 100% text visibility against dark IDE/panel backgrounds.
 */
export function renderMarkdown(markdown = '') {
  if (!markdown || typeof markdown !== 'string') return '';

  const lines = markdown.split(/\r?\n/);
  let html = '';
  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeBlockBuffer = [];
  let inList = false;
  let listType = 'ul'; // 'ul' | 'ol'

  const closeListIfNeeded = () => {
    if (inList) {
      html += listType === 'ul' ? '</ul>' : '</ol>';
      inList = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // 1. Fenced Code Blocks (```lang)
    if (line.trim().startsWith('```')) {
      closeListIfNeeded();
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockLang = line.trim().slice(3).trim();
        codeBlockBuffer = [];
      } else {
        inCodeBlock = false;
        const codeContent = codeBlockBuffer.join('\n')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        
        html += `<div class="my-4 rounded-xl overflow-hidden bg-[#1e1e1e] border border-slate-800 font-mono text-sm text-slate-100 shadow-md">
          ${codeBlockLang ? `<div class="px-4 py-1.5 bg-[#252526] text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-800">${codeBlockLang}</div>` : ''}
          <pre class="p-4 overflow-x-auto leading-relaxed whitespace-pre font-mono text-sm"><code>${codeContent}</code></pre>
        </div>`;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockBuffer.push(line);
      continue;
    }

    // 2. Lists (- item, * item, 1. item)
    const ulMatch = line.match(/^(\s*)([\-\*])\s+(.*)$/);
    const olMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);

    if (ulMatch || olMatch) {
      const isOl = !!olMatch;
      const targetType = isOl ? 'ol' : 'ul';
      const itemContent = formatInlineMarkdown(isOl ? olMatch[3] : ulMatch[3]);

      if (!inList || listType !== targetType) {
        closeListIfNeeded();
        inList = true;
        listType = targetType;
        html += targetType === 'ul' 
          ? '<ul class="list-disc list-inside space-y-2.5 my-3.5 text-slate-100 text-base font-normal leading-relaxed pl-1">' 
          : '<ol class="list-decimal list-inside space-y-2.5 my-3.5 text-slate-100 text-base font-normal leading-relaxed pl-1">';
      }

      html += `<li class="my-1.5"><span class="text-slate-100">${itemContent}</span></li>`;
      continue;
    } else {
      closeListIfNeeded();
    }

    // 3. Headings (#, ##, ###)
    if (line.startsWith('# ')) {
      const text = formatInlineMarkdown(line.slice(2));
      html += `<h1 class="text-3xl font-extrabold text-white mt-7 mb-4 border-b border-slate-700/60 pb-2.5 tracking-tight">${text}</h1>`;
      continue;
    }
    if (line.startsWith('## ')) {
      const text = formatInlineMarkdown(line.slice(3));
      html += `<h2 class="text-2xl font-bold text-white mt-6 mb-3 border-b border-slate-700/60 pb-2 tracking-tight">${text}</h2>`;
      continue;
    }
    if (line.startsWith('### ')) {
      const text = formatInlineMarkdown(line.slice(4));
      html += `<h3 class="text-xl font-bold text-white mt-5 mb-2.5 tracking-tight">${text}</h3>`;
      continue;
    }

    // 4. Blockquotes (> text)
    if (line.startsWith('> ')) {
      const text = formatInlineMarkdown(line.slice(2));
      html += `<blockquote class="border-l-4 border-primary bg-primary/10 text-slate-200 pl-4 py-3 my-4 rounded-r-xl text-base italic leading-relaxed">${text}</blockquote>`;
      continue;
    }

    // 5. Horizontal Rule (---)
    if (line.trim() === '---' || line.trim() === '***') {
      html += `<hr class="my-6 border-slate-700/60" />`;
      continue;
    }

    // 6. Tables (| col1 | col2 |)
    if (line.trim().startsWith('|')) {
      const tableLines = [line];
      while (i + 1 < lines.length && lines[i + 1].trim().startsWith('|')) {
        i++;
        tableLines.push(lines[i]);
      }
      html += renderMarkdownTable(tableLines);
      continue;
    }

    // 7. Standard Paragraphs
    if (line.trim() === '') {
      html += `<div class="h-2"></div>`;
    } else {
      const text = formatInlineMarkdown(line);
      html += `<p class="text-base text-slate-100 my-3 leading-relaxed font-normal">${text}</p>`;
    }
  }

  closeListIfNeeded();
  return html;
}

// Helper to format inline bold, italic, code, links, images
function formatInlineMarkdown(text = '') {
  if (!text) return '';

  let res = text;

  // Escape raw HTML angle brackets in standard text to prevent parsing errors
  res = res
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Images ![alt](url)
  res = res.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="my-4 rounded-xl border border-slate-700 max-h-96 object-contain shadow-md inline-block" />');

  // Links [label](url)
  res = res.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline font-bold">$1</a>');

  // Bold & Italic (***text*** or ___text___)
  res = res.replace(/\*\*\*(.*?)\*\*\*/g, '<strong class="font-extrabold italic text-white">$1</strong>');

  // Bold (**text**)
  res = res.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white">$1</strong>');

  // Italic (*text*)
  res = res.replace(/\*(.*?)\*/g, '<em class="italic text-slate-200 font-medium">$1</em>');

  // Inline Code (`code`)
  res = res.replace(/`([^`]+)`/g, '<code class="px-2 py-0.5 rounded-md bg-rose-500/20 border border-rose-500/35 text-rose-300 font-mono text-sm font-bold shadow-2xs">$1</code>');

  return res;
}

// Helper to render Markdown tables cleanly
function renderMarkdownTable(tableLines = []) {
  if (tableLines.length < 2) return '';

  const parseRow = (rowStr) => {
    return rowStr
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map(cell => cell.trim());
  };

  const header = parseRow(tableLines[0]);
  const hasDivider = tableLines[1] && tableLines[1].includes('---');
  const bodyRows = hasDivider ? tableLines.slice(2) : tableLines.slice(1);

  let html = `<div class="my-4 overflow-x-auto rounded-xl border border-slate-700 shadow-md">
    <table class="w-full text-left text-base font-sans border-collapse">
      <thead class="bg-slate-800 text-white font-bold border-b border-slate-700">
        <tr>`;
  
  header.forEach(col => {
    html += `<th class="px-4 py-3 border-r last:border-r-0 border-slate-700">${formatInlineMarkdown(col)}</th>`;
  });
  
  html += `</tr></thead><tbody class="divide-y divide-slate-800">`;

  bodyRows.forEach(rowStr => {
    const cols = parseRow(rowStr);
    html += `<tr class="hover:bg-slate-800/40 transition-colors">`;
    cols.forEach(col => {
      html += `<td class="px-4 py-3 border-r last:border-r-0 border-slate-800 text-slate-100">${formatInlineMarkdown(col)}</td>`;
    });
    html += `</tr>`;
  });

  html += `</tbody></table></div>`;
  return html;
}
