import React, { useState, useEffect, useMemo } from 'react';
import { IoCloseOutline, IoCalendarOutline, IoTimeOutline, IoSparklesOutline, IoCheckmarkCircleOutline, IoAlertCircleOutline, IoRefreshOutline, IoTrashOutline } from 'react-icons/io5';
import { ProjectApi } from '../../services/api/Project.api';
import { TaskApi } from '../../services/api/Task.api';
import toast from 'react-hot-toast';
import moment from 'moment';

const ArenaScheduleModal = ({
  isOpen,
  onClose,
  projectId,
  projectName,
  onScheduleApplied,
  tasks = []
}) => {
  const [startDate, setStartDate] = useState(moment().format('YYYY-MM-DD'));
  const [tasksPerDay, setTasksPerDay] = useState(4);
  const [revisionDaysPerParent, setRevisionDaysPerParent] = useState(2);
  const [targetMonths, setTargetMonths] = useState('');
  const [existingSchedule, setExistingSchedule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch current user's schedule for this Arena
  useEffect(() => {
    if (!isOpen || !projectId) return;

    let isMounted = true;
    const fetchCurrentSchedule = async () => {
      setLoading(true);
      try {
        const res = await ProjectApi.getArenaSchedule(projectId);
        if (isMounted && res.data?.data?.isScheduled) {
          const s = res.data.data.schedule;
          setExistingSchedule(s);
          if (s.startDate) setStartDate(moment(s.startDate).format('YYYY-MM-DD'));
          if (s.tasksPerDay) setTasksPerDay(s.tasksPerDay);
          if (s.revisionDaysPerParent !== undefined) setRevisionDaysPerParent(s.revisionDaysPerParent);
        } else if (isMounted) {
          setExistingSchedule(null);
        }
      } catch (err) {
        console.error("Failed to load arena schedule:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCurrentSchedule();
    return () => { isMounted = false; };
  }, [isOpen, projectId]);

  // Compute tasks hierarchy breakdown for live preview
  const { totalParentTasks, totalChildTasks } = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return { totalParentTasks: 0, totalChildTasks: 0 };
    }
    const parents = tasks.filter(t => !t.parentTask);
    const children = tasks.filter(t => !!t.parentTask);
    return {
      totalParentTasks: parents.length,
      totalChildTasks: children.length
    };
  }, [tasks]);

  // Live client-side preview calculation
  const preview = useMemo(() => {
    const numPerDay = Math.max(1, parseInt(tasksPerDay) || 4);
    const numRevDays = Math.max(0, parseInt(revisionDaysPerParent) || 0);

    // Group child tasks by parent
    const parents = (tasks || []).filter(t => !t.parentTask);
    const children = (tasks || []).filter(t => !!t.parentTask);

    const childrenByParent = new Map();
    parents.forEach(p => childrenByParent.set(p._id.toString(), []));

    const orphanChildren = [];
    children.forEach(c => {
      const pId = c.parentTask ? (typeof c.parentTask === 'object' ? c.parentTask._id : c.parentTask).toString() : null;
      if (pId && childrenByParent.has(pId)) {
        childrenByParent.get(pId).push(c);
      } else {
        orphanChildren.push(c);
      }
    });

    let currentDate = moment.utc(startDate).startOf('day');
    const startCalendarDate = currentDate.clone();
    let scheduledParentsCount = 0;

    parents.forEach((parent, pIndex) => {
      const parentChildren = childrenByParent.get(parent._id.toString()) || [];
      if (parentChildren.length === 0) return;

      scheduledParentsCount++;
      const chunks = Math.ceil(parentChildren.length / numPerDay);
      currentDate.add(Math.max(0, chunks - 1), 'days');

      const isLast = pIndex === parents.length - 1 && orphanChildren.length === 0;
      if (!isLast && numRevDays > 0) {
        currentDate.add(numRevDays + 1, 'days');
      } else if (!isLast) {
        currentDate.add(1, 'days');
      }
    });

    if (orphanChildren.length > 0) {
      const chunks = Math.ceil(orphanChildren.length / numPerDay);
      currentDate.add(Math.max(0, chunks - 1), 'days');
    }

    const calculatedEndDate = currentDate.clone();
    const calculatedDays = calculatedEndDate.diff(startCalendarDate, 'days') + 1;

    // Feasibility against target months
    let feasibility = null;
    if (targetMonths && parseInt(targetMonths) > 0) {
      const months = parseInt(targetMonths);
      const maxAllowedEndDate = startCalendarDate.clone().add(months, 'months');
      const maxAllowedDays = maxAllowedEndDate.diff(startCalendarDate, 'days') + 1;
      const isPossible = calculatedDays <= maxAllowedDays;
      feasibility = {
        months,
        maxAllowedDays,
        calculatedDays,
        isPossible,
        diffDays: Math.abs(calculatedDays - maxAllowedDays)
      };
    }

    return {
      startDateFormatted: startCalendarDate.format('DD MMM, YYYY'),
      endDateFormatted: calculatedEndDate.format('DD MMM, YYYY'),
      calculatedDays,
      scheduledParentsCount,
      totalChildTasks: children.length,
      feasibility
    };
  }, [startDate, tasksPerDay, revisionDaysPerParent, targetMonths, tasks]);

  const handleApplySchedule = async () => {
    if (!startDate) {
      toast.error("Please choose a start date.");
      return;
    }

    if (preview.feasibility && !preview.feasibility.isPossible) {
      toast.error(`Target of ${preview.feasibility.months} month(s) is impossible. Requires ${preview.calculatedDays} days vs ${preview.feasibility.maxAllowedDays} days available.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        startDate,
        tasksPerDay: parseInt(tasksPerDay),
        revisionDaysPerParent: parseInt(revisionDaysPerParent),
        targetMonths: targetMonths ? parseInt(targetMonths) : undefined
      };

      const res = await ProjectApi.scheduleArena(projectId, payload);
      toast.success(existingSchedule ? "Arena schedule updated successfully!" : "Arena timeline generated & applied!");
      if (onScheduleApplied) onScheduleApplied(res.data?.data);
      onClose();
    } catch (err) {
      console.error("Error applying arena schedule:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to apply arena schedule");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSchedule = async () => {
    if (!window.confirm("Are you sure you want to reset your personal schedule for this Arena? Task dates will be cleared.")) {
      return;
    }

    setIsSubmitting(true);
    try {
      await ProjectApi.resetArenaSchedule(projectId);
      toast.success("Personal Arena schedule reset successfully.");
      if (onScheduleApplied) onScheduleApplied(null);
      onClose();
    } catch (err) {
      console.error("Error resetting arena schedule:", err);
      toast.error(err.response?.data?.message || "Failed to reset arena schedule");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
              <IoCalendarOutline size={20} />
            </div>
            <div>
              <h3 className="font-black text-base tracking-tight leading-tight">
                {existingSchedule ? 'Manage Arena Schedule' : 'Automated Arena Scheduler'}
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                {projectName || 'Arena Timeline'} • Personal Execution
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
          >
            <IoCloseOutline size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* One-Time Scheduling Rule Notice */}
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3 text-amber-900 dark:text-amber-200">
            <IoAlertCircleOutline size={20} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <p className="font-black uppercase tracking-wider text-[11px] text-amber-700 dark:text-amber-400 mb-0.5">
                ⚠️ One-Time Schedule Setup
              </p>
              <p className="font-medium text-slate-600 dark:text-slate-300">
                You can only schedule this Arena <strong>once</strong>. Once timeline dates are generated and saved, they are locked to your personal roadmap and cannot be recalculated or rescheduled. Please choose your start date, study pace, and revision buffer carefully.
              </p>
            </div>
          </div>

          {existingSchedule && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200/60 rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-emerald-800 font-bold">
                <IoCheckmarkCircleOutline size={18} className="text-emerald-600" />
                <span>Active Schedule: {moment(existingSchedule.startDate).format('DD MMM, YYYY')} → {moment(existingSchedule.endDate).format('DD MMM, YYYY')}</span>
              </div>
              <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-100/60 px-2 py-0.5 rounded-full">
                {existingSchedule.calculatedTotalDays} Days
              </span>
            </div>
          )}

          {/* Form Controls Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Start Date */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5 block">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-primary focus:bg-white transition-all"
              />
            </div>

            {/* Tasks Per Day */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5 block">
                Tasks / Day (Pace)
              </label>
              <select
                value={tasksPerDay}
                onChange={(e) => setTasksPerDay(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-primary focus:bg-white transition-all"
              >
                <option value={1}>1 child task / day (Relaxed)</option>
                <option value={2}>2 child tasks / day (Moderate)</option>
                <option value={3}>3 child tasks / day (Fast)</option>
                <option value={4}>4 child tasks / day (Standard)</option>
                <option value={6}>6 child tasks / day (Intensive)</option>
                <option value={8}>8 child tasks / day (Sprint)</option>
              </select>
            </div>

            {/* Revision Buffer Days Per Parent Topic */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5 block">
                Revision Days / Topic
              </label>
              <select
                value={revisionDaysPerParent}
                onChange={(e) => setRevisionDaysPerParent(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-primary focus:bg-white transition-all"
              >
                <option value={0}>0 days (No buffer)</option>
                <option value={1}>1 revision day / topic</option>
                <option value={2}>2 revision days / topic (Recommended)</option>
                <option value={3}>3 revision days / topic</option>
                <option value={5}>5 revision days / topic</option>
              </select>
            </div>

            {/* Optional Target Duration */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5 block">
                Target Duration (Optional)
              </label>
              <select
                value={targetMonths}
                onChange={(e) => setTargetMonths(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-primary focus:bg-white transition-all"
              >
                <option value="">No fixed target</option>
                <option value="1">1 Month</option>
                <option value="2">2 Months</option>
                <option value="3">3 Months</option>
                <option value="4">4 Months</option>
                <option value="6">6 Months</option>
              </select>
            </div>
          </div>

          {/* Live Feasibility Indicator if Target is set */}
          {preview.feasibility && (
            <div className={`p-3.5 rounded-2xl border flex items-start gap-2.5 text-xs transition-all ${
              preview.feasibility.isPossible
                ? 'bg-green-50 border-green-200/60 text-green-800'
                : 'bg-rose-50 border-rose-200/60 text-rose-800'
            }`}>
              <span className="text-base shrink-0 mt-0.5">
                {preview.feasibility.isPossible ? '✅' : '⚠️'}
              </span>
              <div>
                <h5 className="font-black text-xs">
                  {preview.feasibility.isPossible 
                    ? `Feasible: Fits within ${preview.feasibility.months} month(s)`
                    : `Infeasible: Exceeds ${preview.feasibility.months}-month target`}
                </h5>
                <p className="text-[11px] font-semibold mt-0.5 opacity-90 leading-relaxed">
                  {preview.feasibility.isPossible
                    ? `Requires ${preview.calculatedDays} days out of ${preview.feasibility.maxAllowedDays} days available (${preview.feasibility.diffDays} buffer days remaining).`
                    : `Requires ${preview.calculatedDays} days, but ${preview.feasibility.months} month(s) allows only ${preview.feasibility.maxAllowedDays} days (${preview.feasibility.diffDays} days over target). Increase tasks/day or extend duration.`}
                </p>
              </div>
            </div>
          )}

          {/* Live Timeline Preview Box */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Calculated Schedule Summary
              </span>
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                Auto-calculated
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Start Date</span>
                <span className="text-xs font-black text-slate-800">{preview.startDateFormatted}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Estimated End</span>
                <span className="text-xs font-black text-primary">{preview.endDateFormatted}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Total Duration</span>
                <span className="text-xs font-black text-slate-800">{preview.calculatedDays} Days</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Child Tasks</span>
                <span className="text-xs font-black text-slate-800">{preview.totalChildTasks} Tasks</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApplySchedule}
            disabled={isSubmitting || (preview.feasibility && !preview.feasibility.isPossible)}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-md transition-all active:scale-95 flex items-center gap-2 ${
              preview.feasibility && !preview.feasibility.isPossible
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-primary hover:bg-primary-dark shadow-primary/20'
            }`}
          >
            <IoSparklesOutline size={14} />
            <span>{isSubmitting ? 'Generating & Locking...' : 'Confirm & Lock Schedule (One-Time Setup)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArenaScheduleModal;
