import { Task } from "../../models/task.model.js";
import { Milestone } from "../../models/milestone.model.js";
import { Project } from "../../models/project.model.js";

export const ProgressService = {
  /**
   * Recalculates the progress of a parent task based on its immediate children.
   * If the parent also has a parent, it recurses up.
   * @param {string} parentId 
   */
  async updateParentTaskProgress(parentId) {
    if (!parentId) return;

    // 1. Get all subtasks of this parent
    const subtasks = await Task.find({ parentTask: parentId });
    
    // 2. Calculate Stats
    const totalSubtasks = subtasks.length;
    const completedSubtasks = totalSubtasks > 0 ? subtasks.filter(t => t.status === 'done').length : 0;
    const progress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

    // 3. Update Parent Task
    const parent = await Task.findByIdAndUpdate(
      parentId, 
      { 
        progress: progress,
        subtaskStats: {
            total: totalSubtasks,
            completed: completedSubtasks
        }
      },
      { new: true }
    );

    // 4. Recurse up if this parent also has a parent
    if (parent && parent.parentTask) {
        await this.updateParentTaskProgress(parent.parentTask);
    }
  },

  /**
   * Recalculates Milestone progress based on TOP-LEVEL tasks linked to it.
   * @param {string} milestoneId 
   */
  async updateMilestoneProgress(milestoneId) {
    if (!milestoneId) return;

    // Filter for tasks in this milestone that DO NOT have a parent (to avoid double counting)
    // OR we can decide to count all work items. Standard is usually top-level or leaf nodes.
    // Let's go with Top-Level for consistency with Project progress.
    const tasks = await Task.find({ 
        milestone: milestoneId, 
        parentTask: null 
    });
    
    if (tasks.length === 0) return;

    const totalProgress = tasks.reduce((sum, task) => sum + (task.progress || 0), 0);
    const averageProgress = Math.round(totalProgress / tasks.length);

    await Milestone.findByIdAndUpdate(milestoneId, { progress: averageProgress });
  },

  /**
   * Recalculates Project progress based on TOP-LEVEL tasks.
   * @param {string} projectId 
   */
  async updateProjectProgress(projectId) {
      if (!projectId) return;

      const result = await Task.aggregate([
          { 
              $match: { 
                  projectName: new mongoose.Types.ObjectId(projectId),
                  parentTask: null // Only consider top-level tasks
              } 
          },
          {
              $group: {
                  _id: null,
                  avgProgress: { $avg: "$progress" }
              }
          }
      ]);

      const projectProgress = result.length > 0 ? Math.round(result[0].avgProgress) : 0;
      
      await Project.findByIdAndUpdate(projectId, { progress: projectProgress });
  },
  /**
   * Recalculates Sprint progress based on TOP-LEVEL tasks.
   * @param {string} sprintId 
   */
  async updateSprintProgress(sprintId) {
      if (!sprintId) return;

      const result = await Task.aggregate([
          { 
              $match: { 
                  sprint: new mongoose.Types.ObjectId(sprintId),
                  parentTask: null 
              } 
          },
          {
              $group: {
                  _id: null,
                  avgProgress: { $avg: "$progress" }
              }
          }
      ]);

      const sprintProgress = result.length > 0 ? Math.round(result[0].avgProgress) : 0;
      
      // Need to import Sprint model dynamically or adding import at top
      // To avoid circular dependency issues if any, usually valid to import.
      // But let's check imports.
      // I need to add import { Sprint } from "../../models/sprint.model.js"; at the top.
      const { Sprint } = await import("../../models/sprint.model.js");
      await Sprint.findByIdAndUpdate(sprintId, { progress: sprintProgress });
  }
};

import mongoose from "mongoose";
