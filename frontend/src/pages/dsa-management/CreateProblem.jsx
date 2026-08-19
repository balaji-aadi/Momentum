import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  LuArrowLeft, 
  LuSave, 
  LuSend, 
  LuCheckCircle2, 
  LuRefreshCw, 
  LuBookOpen 
} from 'react-icons/lu';
import BasicInformationCard from '../../components/dsa-cms/BasicInformationCard';
import ProblemMetadataCard from '../../components/dsa-cms/ProblemMetadataCard';
import { FunctionDefinitionCard } from '../../components/dsa-cms/FunctionDefinitionCard';
import { ExecutionProfileCard } from '../../components/dsa-cms/ExecutionProfileCard';
import MarkdownEditor from '../../components/dsa-cms/MarkdownEditor';
import ExampleCard from '../../components/dsa-cms/ExampleCard';
import ConstraintCard from '../../components/dsa-cms/ConstraintCard';
import HintCard from '../../components/dsa-cms/HintCard';
import StarterCodeTabs from '../../components/dsa-cms/StarterCodeTabs';
import TestCaseCard from '../../components/dsa-cms/TestCaseCard';
import { ProblemApi } from '../../services/api/Problem.api';
import toast from 'react-hot-toast';

export default function CreateProblem() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    problemCode: '',
    problemType: 'DSA',
    difficulty: 'Medium',
    status: 'Draft',
    companies: [],
    topics: [],
    pattern: '',
    descriptionMarkdown: '# Problem Description\n\nGiven an array of integers `fruits` where `fruits[i]` is the type of fruit the `i-th` tree produces, return *the maximum number of fruits you can collect*.\n\n### Example 1:\n```\nInput: fruits = [1,2,1]\nOutput: 3\nExplanation: We can pick from all 3 trees.\n```\n',
    examples: [
      { input: '[1,2,1]', output: '3', explanation: 'We can pick from all 3 trees.', order: 1 },
      { input: '[0,1,2,2]', output: '3', explanation: 'We can pick from trees [1,2,2].', order: 2 }
    ],
    constraints: [
      '1 <= fruits.length <= 10^5',
      '0 <= fruits[i] < fruits.length'
    ],
    hints: [
      'Try using a sliding window approach with two pointers.',
      'Use a frequency hash map to track the count of each fruit type in the current window.'
    ],
    starterCode: [
      { 
        language: 'python', 
        code: 'class Solution:\n    def totalFruit(self, fruits: List[int]) -> int:\n        pass',
        functionSignature: 'totalFruit(self, fruits: List[int]) -> int',
        defaultTemplate: ''
      },
      { 
        language: 'javascript', 
        code: '/**\n * @param {number[]} fruits\n * @return {number}\n */\nvar totalFruit = function(fruits) {\n    \n};',
        functionSignature: 'totalFruit(fruits)',
        defaultTemplate: ''
      }
    ],
    visibleTestCases: [
      { input: '[1,2,1]', expectedOutput: '3', explanation: 'Sample case 1', weight: 1.0, isActive: true },
      { input: '[0,1,2,2]', expectedOutput: '3', explanation: 'Sample case 2', weight: 1.0, isActive: true }
    ],
    hiddenTestCases: [
      { input: '[1,2,3,2,2]', expectedOutput: '4', explanation: 'Evaluation case 1', weight: 1.0, isActive: true },
      { input: '[3,3,3,1,2,1,1,2,3,3,4]', expectedOutput: '5', explanation: 'Evaluation case 2', weight: 1.0, isActive: true }
    ],
    executionLimits: { timeLimitMs: 2000, memoryLimitMb: 256 },
    functionDefinition: {
      functionName: 'solution',
      parameters: [
        { name: 'nums', type: 'number[]', required: true, nullable: false, description: 'Input array' }
      ],
      returnType: 'number[]'
    },
    executionProfile: {
      runtimeType: 'FUNCTION',
      inputParser: 'ArrayParser',
      outputSerializer: 'ArraySerializer',
      comparator: 'UnorderedArrayMatch'
    },
    editorialMarkdown: '## Solution Approach: Sliding Window\n\n### Complexity Analysis\n- **Time Complexity:** $O(N)$\n- **Space Complexity:** $O(1)$',
    metadata: {
      estimatedSolveTime: 20,
      xpReward: 50,
      revisionWeight: 1,
      interviewFrequency: 'Medium',
      featuredProblem: false,
      contestProblem: false,
      learningObjective: ''
    }
  });

  // Fetch problem details if editing
  useEffect(() => {
    if (!editId) return;
    const fetchExisting = async () => {
      setLoading(true);
      try {
        const res = await ProblemApi.getProblemByIdOrSlug(editId);
        if (res.data?.success) {
          const prob = res.data.data;
          setFormData({
            ...prob,
            companies: (prob.companies || []).map(c => typeof c === 'object' ? c._id : c),
            topics: (prob.topics || []).map(t => typeof t === 'object' ? t._id : t),
            pattern: typeof prob.pattern === 'object' ? prob.pattern._id : prob.pattern || ''
          });
        }
      } catch (err) {
        toast.error("Failed to load existing problem data");
      } finally {
        setLoading(false);
      }
    };
    fetchExisting();
  }, [editId]);

  // Comprehensive Pre-flight Validation
  const validateForm = (targetStatus) => {
    if (!formData.title || formData.title.trim().length < 3) {
      toast.error("Problem Title must be at least 3 characters long.");
      return false;
    }
    if (!formData.slug || formData.slug.trim().length === 0) {
      toast.error("Valid URL slug is required.");
      return false;
    }

    if (targetStatus === 'Published') {
      if (!formData.descriptionMarkdown || formData.descriptionMarkdown.trim().length < 10) {
        toast.error("Problem description cannot be empty before publishing.");
        return false;
      }
      if (!formData.visibleTestCases || formData.visibleTestCases.length === 0) {
        toast.error("At least 1 visible test case is required to publish a problem.");
        return false;
      }
      if (!formData.starterCode || formData.starterCode.length === 0) {
        toast.error("At least 1 starter code template is required to publish a problem.");
        return false;
      }
    }

    return true;
  };

  // Submit Handler (Draft, Review, Published)
  const handleSubmit = async (targetStatus) => {
    if (!validateForm(targetStatus)) return;

    setSaving(true);
    const payload = {
      ...formData,
      status: targetStatus,
      pattern: formData.pattern || undefined
    };

    try {
      let res;
      if (editId) {
        res = await ProblemApi.updateProblem(editId, payload);
      } else {
        res = await ProblemApi.createProblem(payload);
      }

      if (res.data?.success) {
        const actionVerb = editId ? "updated" : "created";
        toast.success(`Problem successfully ${actionVerb} as ${targetStatus}!`);
        navigate('/dsa-management/problems');
      }
    } catch (err) {
      console.error("Save problem error", err);
      toast.error(err.response?.data?.message || "Failed to save problem");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans pb-28">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-borderLight dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dsa-management/problems')}
            className="p-2 rounded-xl text-textSub hover:text-textMain hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-borderLight"
            title="Back to Problems"
          >
            <LuArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-textMain dark:text-white flex items-center gap-2">
              <span className="text-primary font-mono font-extrabold text-sm">&lt;/&gt;</span>
              <span>{editId ? "Edit Problem (Production CMS)" : "Create Problem (Production CMS)"}</span>
            </h1>
            <p className="text-xs text-textSub mt-1 font-normal">
              {editId ? "Modify problem definition, test cases, and metadata." : "Define basic information, metadata, description, starter code, and test cases."}
            </p>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSubmit('Draft')}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-textMain dark:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
          >
            <LuSave size={14} />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSubmit('Published')}
            className="px-4 py-2 bg-primary hover:bg-primaryHover text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-40"
          >
            {saving ? <LuRefreshCw className="animate-spin" size={14} /> : <LuCheckCircle2 size={15} />}
            <span>Publish Problem</span>
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="p-12 text-center text-textSub text-xs font-semibold animate-pulse">
          Loading problem details from database...
        </div>
      ) : (
        /* CMS Cards Stack */
        <div className="space-y-6">
          {/* Phase 4: Basic Information Card */}
          <BasicInformationCard formData={formData} setFormData={setFormData} />

          {/* Universal Execution Engine Phase 1: Function Definition & Execution Profile */}
          <FunctionDefinitionCard 
            functionDefinition={formData.functionDefinition} 
            onChange={(fnDef) => setFormData(prev => ({ ...prev, functionDefinition: fnDef }))} 
          />

          <ExecutionProfileCard 
            functionDefinition={formData.functionDefinition}
            executionProfile={formData.executionProfile} 
            onChange={(execProfile) => setFormData(prev => ({ ...prev, executionProfile: execProfile }))} 
          />

          {/* Phase 4: Problem Metadata Card */}
          <ProblemMetadataCard formData={formData} setFormData={setFormData} />

          {/* Phase 5: Problem Description Markdown Editor */}
          <MarkdownEditor
            title="Problem Description (Markdown)"
            placeholder="Write problem statement, background, and explanation in Markdown..."
            value={formData.descriptionMarkdown || ''}
            onChange={(val) => setFormData(prev => ({ ...prev, descriptionMarkdown: val }))}
          />

          {/* Phase 6: Dynamic Examples Card */}
          <ExampleCard formData={formData} setFormData={setFormData} />

          {/* Phase 6: Dynamic Constraints Card */}
          <ConstraintCard formData={formData} setFormData={setFormData} />

          {/* Phase 6: Progressive Hints Card */}
          <HintCard formData={formData} setFormData={setFormData} />

          {/* Phase 7: Multi-Language Starter Code with Monaco Editor */}
          <StarterCodeTabs formData={formData} setFormData={setFormData} />

          {/* Phase 8: Visible & Hidden Test Cases */}
          <TestCaseCard formData={formData} setFormData={setFormData} />
        </div>
      )}

      {/* Floating Bottom Action Bar */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] bg-surface/90 dark:bg-slate-900/90 backdrop-blur-md px-5 py-3 rounded-2xl border border-borderLight dark:border-slate-800 shadow-xl flex items-center justify-between gap-6 w-[90%] max-w-4xl font-sans">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-semibold text-textSub">
            Status: <span className="font-bold text-textMain dark:text-white">{formData.status || 'Draft'}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/dsa-management/problems')}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-textSub rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSubmit('Draft')}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-textMain dark:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
          >
            <LuSave size={14} />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSubmit('Review')}
            className="px-4 py-2 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
          >
            <LuSend size={14} />
            <span>Submit Review</span>
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSubmit('Published')}
            className="px-5 py-2 bg-primary hover:bg-primaryHover text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-40"
          >
            {saving ? <LuRefreshCw className="animate-spin" size={14} /> : <LuCheckCircle2 size={16} />}
            <span>Publish Problem</span>
          </button>
        </div>
      </div>
    </div>
  );
}
