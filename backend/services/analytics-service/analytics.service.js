import { PerformanceStat } from "../../models/performanceStat.model.js";
import { Task } from "../../models/task.model.js";
import { Project } from "../../models/project.model.js";
import { UserTaskProgress } from "../../models/userTaskProgress.model.js";
import { FocusSession } from "../../models/focusSession.model.js";
import { DailyAccountability } from "../../models/dailyAccountability.model.js";
import { DailyRevision } from "../../models/dailyRevision.model.js";
import mongoose from "mongoose";
import moment from "moment";

class AnalyticsService {
  /**
   * Main entry point to update stats when a task is updated
   */
  async handleTaskUpdate(userId, projectId, taskId, oldStatus, newStatus) {
    console.log(`[Analytics] handleTaskUpdate: User:${userId}, Project:${projectId}, Task:${taskId}, Status:${oldStatus}->${newStatus}`);
    if (!userId || !projectId) return;

    // Only trigger if status actually changed
    if (oldStatus === newStatus) return;

    const task = await Task.findById(taskId);
    if (!task) return;

    const branchId = task.branchId;
    const date = new Date();
    
    // If task was previously done and is now reopened, find original completion date to decrement from
    let origDoneDate = date;
    if (oldStatus === "done" && task.activityLogs && task.activityLogs.length > 0) {
      const doneLog = [...task.activityLogs].reverse().find(l => l.currentStatus === "done");
      if (doneLog && doneLog.date) {
        origDoneDate = doneLog.date;
      } else {
        origDoneDate = task.createdAt || date;
      }
    }

    if (oldStatus === "done" && newStatus !== "done") {
      await this._recordStatUpdate(userId, projectId, task, oldStatus, newStatus, origDoneDate, branchId);
    } else {
      await this._recordStatUpdate(userId, projectId, task, oldStatus, newStatus, date, branchId);
    }
  }

  /**
   * Internal helper to record stats for both user and project across all periods
   */
  async _recordStatUpdate(userId, projectId, task, oldStatus, newStatus, date, branchId) {
    const periods = ["daily", "weekly", "monthly", "yearly"];
    for (const period of periods) {
      const normalizedDate = this._normalizeDate(date, period);
      // Update User Stats
      await this._updateStats("user", userId, period, normalizedDate, task, oldStatus, newStatus, branchId);
      // Update Project Stats
      await this._updateStats("project", projectId, period, normalizedDate, task, oldStatus, newStatus, branchId);
    }
  }

  /**
   * Sync all existing tasks to populate analytics
   */
  async syncAllExistingData() {
    // Clear existing stats to avoid double counting during a full sync
    await PerformanceStat.deleteMany({});

    const tasks = await Task.find({}).populate("activityLogs.user");
    console.log(`Syncing analytics for ${tasks.length} tasks...`);

    for (const task of tasks) {
      if (!task.assignee || !task.projectName) continue;

      // 1. Basic metrics (Completed, Points, On-Time)
      const createdDate = task.createdAt || new Date();

      // Find the exact completion or inprogress date from activity logs to be highly precise
      let statusChangeDate = createdDate;
      if (task.status === "done" && task.activityLogs && task.activityLogs.length > 0) {
          const doneLog = [...task.activityLogs].reverse().find(log => log.currentStatus === "done");
          if (doneLog && doneLog.date) {
              statusChangeDate = doneLog.date;
          }
      } else if (task.status === "inprogress" && task.activityLogs && task.activityLogs.length > 0) {
          const inprogressLog = [...task.activityLogs].reverse().find(log => log.currentStatus === "inprogress");
          if (inprogressLog && inprogressLog.date) {
              statusChangeDate = inprogressLog.date;
          }
      }

      // Initial assignment stat
      await this._recordStatUpdate(task.assignee, task.projectName, task, null, "todo", createdDate, task.branchId);
      
      // If currently not todo, update to current status
      if (task.status !== "todo") {
          await this._recordStatUpdate(task.assignee, task.projectName, task, "todo", task.status, statusChangeDate, task.branchId);
      }

    }

    // 2. Sync all Focus Sessions
    const focusSessions = await FocusSession.find({});
    console.log(`Syncing analytics for ${focusSessions.length} focus sessions...`);
    for (const session of focusSessions) {
        if (!session.user || !session.duration) continue;
        
        // Add Focus Session duration to user and project stats
        await this.recordFocusTime(session.user, session.duration, session.date || session.startTime, session.branchId, session.task);
    }

    // 4. Sync Daily Accountability Logs
    const accountabilityBoards = await DailyAccountability.find({});
    console.log(`Syncing analytics for ${accountabilityBoards.length} daily accountability boards...`);
    for (const board of accountabilityBoards) {
        if (!board.userId) continue;
        
        const userDoc = await mongoose.model("User").findById(board.userId);
        const defaultBranchId = userDoc?.branchAccess?.[0]?.branchId;

        const dateCounts = {};
        
        // Count logs per logic day date string
        (board.sections || []).forEach(sec => {
            (sec.rows || []).forEach(row => {
                if (row.date) {
                    dateCounts[row.date] = (dateCounts[row.date] || 0) + 1;
                }
            });
        });
        
        // Apply to PerformanceStat
        for (const [dateStr, count] of Object.entries(dateCounts)) {
            const dateObj = new Date(dateStr);
            if (isNaN(dateObj)) continue;
            
            const periods = ["daily", "weekly", "monthly", "yearly"];
            for (const period of periods) {
                const normalizedDate = this._normalizeDate(dateObj, period);
                const query = { entityType: "user", entityId: board.userId, period, date: normalizedDate };
                if (defaultBranchId) {
                    query.branchId = defaultBranchId;
                }
                await PerformanceStat.findOneAndUpdate(
                    query,
                    { $set: { "metrics.accountabilityLogs": count } },
                    { upsert: true }
                );
            }
        }
    }

    // Sanitize any negative values resulting from updates
    await this._sanitizeAllStats();

    return { 
        tasksProcessed: tasks.length, 
        focusSessionsProcessed: focusSessions.length,
        accountabilityBoardsProcessed: accountabilityBoards.length 
    };
  }

  /**
   * Helper to clamp metric fields to 0 or positive values
   */
  async _sanitizeAllStats() {
    const stats = await PerformanceStat.find({});
    const fields = ["hoursLogged", "tasksCompleted", "storyPointsDone", "onTimeTasks", "delayedTasks", "reopenedTasks", "totalTasksAssigned", "accountabilityLogs", "backlogTasksCompleted", "backlogHoursLogged"];
    for (const stat of stats) {
      let updated = false;
      if (stat.metrics) {
        fields.forEach(f => {
          if (typeof stat.metrics[f] === "number" && stat.metrics[f] < 0) {
            stat.metrics[f] = 0;
            updated = true;
          }
        });
      }
      if (updated) {
        await stat.save();
      }
    }
  }

  /**
   * Update or create a PerformanceStat record
   */
  async _updateStats(entityType, entityId, period, date, task, oldStatus, newStatus, branchId) {
    const update = { $inc: {} };

    // Initial Assignment Tracking
    if (oldStatus === null) {
        update.$inc["metrics.totalTasksAssigned"] = 1;
    }

    // Task Completion Metrics
    if (newStatus === "done") {
      update.$inc["metrics.tasksCompleted"] = 1;
      update.$inc["metrics.storyPointsDone"] = task.storyPoints || 0;

      // Check for on-time completion vs backlog completion
      if (task.taskDueDate) {
        const isLate = moment(date).isAfter(moment(task.taskDueDate), 'day');
        if (isLate) {
          update.$inc["metrics.delayedTasks"] = 1;
          update.$inc["metrics.backlogTasksCompleted"] = 1;
        } else {
          update.$inc["metrics.onTimeTasks"] = 1;
        }
      }
    }

    // Task Reopened logic (done -> anything else)
    if (oldStatus === "done" && newStatus !== "done") {
      update.$inc["metrics.tasksCompleted"] = -1;
      update.$inc["metrics.storyPointsDone"] = -(task.storyPoints || 0);
      update.$inc["metrics.reopenedTasks"] = 1;
      
      // Reverse on-time/delayed
      if (task.taskDueDate) {
        const wasLate = moment(date).isAfter(moment(task.taskDueDate));
        if (wasLate) {
           update.$inc["metrics.delayedTasks"] = -1;
        } else {
           update.$inc["metrics.onTimeTasks"] = -1;
        }
      }
    }

    const query = { entityType, entityId, period, date };
    if (branchId) {
        query.branchId = branchId;
    }

    // Only update if there are fields to increment to prevent empty $inc operator errors
    if (update.$inc && Object.keys(update.$inc).length > 0) {
        const updatedStat = await PerformanceStat.findOneAndUpdate(
          query,
          update,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // Clamp negative values if any metric dropped below 0
        if (updatedStat && updatedStat.metrics) {
          let hasNegative = false;
          const fields = ["hoursLogged", "tasksCompleted", "storyPointsDone", "onTimeTasks", "delayedTasks", "reopenedTasks", "totalTasksAssigned", "accountabilityLogs"];
          fields.forEach(f => {
            if (typeof updatedStat.metrics[f] === "number" && updatedStat.metrics[f] < 0) {
              updatedStat.metrics[f] = 0;
              hasNegative = true;
            }
          });
          if (hasNegative) {
            await updatedStat.save();
          }
        }
    }
  }

  /**
   * Handle task deletion to reverse stats
   */
  async handleTaskDeletion(task) {
    if (!task || !task.assignee || !task.projectName) return;

    let date = task.createdAt || new Date();
    if (task.status === "done" && task.activityLogs && task.activityLogs.length > 0) {
      const doneLog = [...task.activityLogs].reverse().find(l => l.currentStatus === "done");
      if (doneLog && doneLog.date) {
        date = doneLog.date;
      }
    }
    const periods = ["daily", "weekly", "monthly", "yearly"];
    const branchId = task.branchId;

    for (const period of periods) {
      const normalizedDate = this._normalizeDate(date, period);
      const update = { $inc: {} };

      // Reverse basic metrics
      update.$inc["metrics.totalTasksAssigned"] = -1;
      
      if (task.status === "done") {
        update.$inc["metrics.tasksCompleted"] = -1;
        update.$inc["metrics.storyPointsDone"] = -(task.storyPoints || 0);

        if (task.taskDueDate) {
          const isLate = moment(date).isAfter(moment(task.taskDueDate));
          if (isLate) {
            update.$inc["metrics.delayedTasks"] = -1;
          } else {
            update.$inc["metrics.onTimeTasks"] = -1;
          }
        }
      }
      
      const queryUser = { entityType: "user", entityId: task.assignee, period, date: normalizedDate };
      const queryProject = { entityType: "project", entityId: task.projectName, period, date: normalizedDate };
      if (branchId) {
          queryUser.branchId = branchId;
          queryProject.branchId = branchId;
      }

      await PerformanceStat.findOneAndUpdate(queryUser, update, { upsert: true });
      await PerformanceStat.findOneAndUpdate(queryProject, update, { upsert: true });
    }
    await this._sanitizeAllStats();
  }

  /**
   * Record standalone or task-linked focus session time
   */
  async recordFocusTime(userId, durationMinutes, date, branchId, taskId = null) {
    const hours = Number((durationMinutes / 60).toFixed(2));
    const periods = ["daily", "weekly", "monthly", "yearly"];
    for (const period of periods) {
      const normalizedDate = this._normalizeDate(date, period);
      const query = { entityType: "user", entityId: userId, period, date: normalizedDate };
      if (branchId) {
          query.branchId = branchId;
      }
      await PerformanceStat.findOneAndUpdate(
        query,
        { $inc: { "metrics.hoursLogged": hours } },
        { upsert: true }
      );

      // If the focus session is linked to a task, add to project stats
      if (taskId) {
        const task = await Task.findById(taskId);
        if (task && task.projectName) {
          const queryProject = { 
            entityType: "project", 
            entityId: task.projectName, 
            period, 
            date: normalizedDate 
          };
          if (branchId) {
            queryProject.branchId = branchId;
          } else if (task.branchId) {
            queryProject.branchId = task.branchId;
          }
          await PerformanceStat.findOneAndUpdate(
            queryProject,
            { $inc: { "metrics.hoursLogged": hours } },
            { upsert: true }
          );
        }
      }
    }
  }

  /**
   * Remove focus session time (for deletions)
   */
  async removeFocusTime(userId, durationMinutes, date, branchId, taskId = null) {
    const hours = Number((durationMinutes / 60).toFixed(2));
    const periods = ["daily", "weekly", "monthly", "yearly"];
    for (const period of periods) {
      const normalizedDate = this._normalizeDate(date, period);
      const query = { entityType: "user", entityId: userId, period, date: normalizedDate };
      if (branchId) {
          query.branchId = branchId;
      }
      await PerformanceStat.findOneAndUpdate(
        query,
        { $inc: { "metrics.hoursLogged": -hours } },
        { upsert: true }
      );

      // If the focus session was linked to a task, remove from project stats
      if (taskId) {
        const task = await Task.findById(taskId);
        if (task && task.projectName) {
          const queryProject = { 
            entityType: "project", 
            entityId: task.projectName, 
            period, 
            date: normalizedDate 
          };
          if (branchId) {
            queryProject.branchId = branchId;
          } else if (task.branchId) {
            queryProject.branchId = task.branchId;
          }
          await PerformanceStat.findOneAndUpdate(
            queryProject,
            { $inc: { "metrics.hoursLogged": -hours } },
            { upsert: true }
          );
        }
      }
    }
    await this._sanitizeAllStats();
  }

  /**
   * Helper to normalize date to the start of the period
   */
  _normalizeDate(date, period) {
    const mDate = moment(date);
    if (period === "daily") return mDate.startOf("day").toDate();
    if (period === "weekly") return mDate.startOf("isoWeek").toDate();
    if (period === "monthly") return mDate.startOf("month").toDate();
    if (period === "yearly") return mDate.startOf("year").toDate();
    return date;
  }

  /**
   * Dynamic fetching for project consistency stats with revisions tracking & UTC date grouping
   * STRICTLY SCOPED TO AUTHENTICATED USER (userId) via UserTaskProgress & FocusSession
   */
  async getProjectConsistencyStats(projectId, userId) {
    if (!projectId || !userId) return [];
    try {
      const pId = new mongoose.Types.ObjectId(projectId);
      const uId = new mongoose.Types.ObjectId(userId);
      const dateMap = {};

      const initDate = (dStr) => {
        if (!dateMap[dStr]) {
          dateMap[dStr] = {
            hoursLogged: 0,
            activeHours: 0,
            revisionHours: 0,
            tasksCompleted: 0,
            storyPointsDone: 0,
            revisionsCount: 0,
            accountabilityLogs: 0
          };
        }
      };

      // 1. Resolve canonical tasks for the project to ensure relational integrity
      const projectTasks = await Task.find({ projectName: pId }).select("_id storyPoints revisionLogs").lean();
      const taskIds = projectTasks.map(t => t._id);
      const taskStoryPointsMap = projectTasks.reduce((acc, t) => {
        acc[t._id.toString()] = t.storyPoints || 0;
        return acc;
      }, {});

      if (taskIds.length === 0) return [];

      // 2. Fetch authenticated user's completed tasks from UserTaskProgress
      const userProgress = await UserTaskProgress.find({
        userId: uId,
        taskId: { $in: taskIds },
        status: "done"
      }).lean();

      userProgress.forEach(p => {
        let doneDate = p.completedAt || p.updatedAt;
        if (p.activityLogs && p.activityLogs.length > 0) {
          const doneLog = [...p.activityLogs].reverse().find(l => l.currentStatus === "done");
          if (doneLog && doneLog.date) {
            doneDate = doneLog.date;
          }
        }
        if (!doneDate) doneDate = new Date();

        const dStr = moment.utc(doneDate).format("YYYY-MM-DD");
        initDate(dStr);
        dateMap[dStr].tasksCompleted += 1;
        const sp = taskStoryPointsMap[p.taskId.toString()] || 0;
        dateMap[dStr].storyPointsDone += sp;
      });

      // 3. Revision logs from UserTaskProgress
      const userRevisions = await UserTaskProgress.find({
        userId: uId,
        taskId: { $in: taskIds },
        "revisionLogs.0": { $exists: true }
      }).lean();

      userRevisions.forEach(p => {
        (p.revisionLogs || []).forEach(rl => {
          if (rl.revisionDate) {
            const rStr = moment.utc(rl.revisionDate).format("YYYY-MM-DD");
            initDate(rStr);
            dateMap[rStr].revisionsCount += 1;
          }
        });
      });

      // 4. Revision logs from Task model
      projectTasks.forEach(t => {
        (t.revisionLogs || []).forEach(rl => {
          if (rl.revisionDate) {
            const rStr = moment.utc(rl.revisionDate).format("YYYY-MM-DD");
            initDate(rStr);
            dateMap[rStr].revisionsCount = Math.max(dateMap[rStr].revisionsCount, 1);
          }
        });
      });

      // 5. Focus Sessions strictly for this user on tasks belonging to this project
      const sessions = await FocusSession.find({
        user: uId,
        task: { $in: taskIds }
      }).lean();

      sessions.forEach(s => {
        if (s.duration) {
          const dStr = moment.utc(s.date || s.startTime).format("YYYY-MM-DD");
          initDate(dStr);
          const durHours = Number((s.duration / 60).toFixed(2));
          dateMap[dStr].hoursLogged += durHours;
          if (s.type === "Revision") {
            dateMap[dStr].revisionHours += durHours;
            if (dateMap[dStr].revisionsCount === 0) dateMap[dStr].revisionsCount = 1;
          } else {
            dateMap[dStr].activeHours += durHours;
          }
        }
      });

      return Object.entries(dateMap).map(([dateStr, metrics]) => ({
        entityType: "project",
        entityId: pId,
        period: "daily",
        date: new Date(dateStr + "T00:00:00.000Z"),
        metrics: {
          ...metrics,
          hoursLogged: Number(metrics.hoursLogged.toFixed(2)),
          activeHours: Number(metrics.activeHours.toFixed(2)),
          revisionHours: Number(metrics.revisionHours.toFixed(2))
        }
      })).sort((a, b) => new Date(a.date) - new Date(b.date));
    } catch (err) {
      console.error("Error in getProjectConsistencyStats:", err);
      return [];
    }
  }

  /**
   * Dynamic fetching for user global consistency stats strictly scoped to UserTaskProgress & FocusSession
   */
  async getUserConsistencyStats(userId, branchId = null) {
    if (!userId) return [];
    try {
      const uId = new mongoose.Types.ObjectId(userId);
      const bId = branchId && mongoose.Types.ObjectId.isValid(branchId) ? new mongoose.Types.ObjectId(branchId) : null;
      const dateMap = {};

      const initDate = (dStr) => {
        if (!dateMap[dStr]) {
          dateMap[dStr] = {
            hoursLogged: 0,
            activeHours: 0,
            revisionHours: 0,
            tasksCompleted: 0,
            storyPointsDone: 0,
            revisionsCount: 0,
            accountabilityLogs: 0
          };
        }
      };

      // 1. Authenticated user's completed tasks in active branch
      const progressFilter = {
        userId: uId,
        status: "done"
      };
      if (bId) {
        progressFilter.branchId = bId;
      }

      const userProgress = await UserTaskProgress.find(progressFilter).populate("taskId", "storyPoints").lean();

      userProgress.forEach(p => {
        let doneDate = p.completedAt || p.updatedAt;
        if (p.activityLogs && p.activityLogs.length > 0) {
          const doneLog = [...p.activityLogs].reverse().find(l => l.currentStatus === "done");
          if (doneLog && doneLog.date) {
            doneDate = doneLog.date;
          }
        }
        if (!doneDate) doneDate = new Date();

        const dStr = moment.utc(doneDate).format("YYYY-MM-DD");
        initDate(dStr);
        dateMap[dStr].tasksCompleted += 1;
        const sp = p.taskId?.storyPoints || 0;
        dateMap[dStr].storyPointsDone += sp;
      });

      // 2. Revision logs from UserTaskProgress in active branch
      const userRevisionFilter = {
        userId: uId,
        "revisionLogs.0": { $exists: true }
      };
      if (bId) {
        userRevisionFilter.branchId = bId;
      }
      const userRevisions = await UserTaskProgress.find(userRevisionFilter).lean();

      userRevisions.forEach(p => {
        (p.revisionLogs || []).forEach(rl => {
          if (rl.revisionDate) {
            const rStr = moment.utc(rl.revisionDate).format("YYYY-MM-DD");
            initDate(rStr);
            dateMap[rStr].revisionsCount += 1;
          }
        });
      });

      // 3. Revision logs from Task model in active branch
      const taskRevisionFilter = { "revisionLogs.0": { $exists: true } };
      if (bId) {
        taskRevisionFilter.branchId = bId;
      }
      const taskRevisions = await Task.find(taskRevisionFilter).lean();
      taskRevisions.forEach(t => {
        (t.revisionLogs || []).forEach(rl => {
          if (rl.revisionDate) {
            const rStr = moment.utc(rl.revisionDate).format("YYYY-MM-DD");
            initDate(rStr);
            dateMap[rStr].revisionsCount = Math.max(dateMap[rStr].revisionsCount, 1);
          }
        });
      });

      // 4. DailyRevision records in active branch
      const dailyRevFilter = { userId: uId };
      if (bId) {
        dailyRevFilter.branchId = bId;
      }
      const dailyRevisions = await DailyRevision.find(dailyRevFilter).lean();
      dailyRevisions.forEach(dr => {
        if (dr.dateStr) {
          const rStr = dr.dateStr;
          const count = dr.questionLogs?.length || dr.completedQuestions?.length || 0;
          if (count > 0 || dr.isCompleted) {
            initDate(rStr);
            dateMap[rStr].revisionsCount = Math.max(dateMap[rStr].revisionsCount, count || 4);
          }
        }
      });

      // 5. Focus Sessions strictly for this user in active branch
      const sessionFilter = { user: uId };
      if (bId) {
        sessionFilter.branchId = bId;
      }
      const sessions = await FocusSession.find(sessionFilter).lean();
      sessions.forEach(s => {
        if (s.duration) {
          const dStr = moment.utc(s.date || s.startTime).format("YYYY-MM-DD");
          initDate(dStr);
          const durHours = Number((s.duration / 60).toFixed(2));
          dateMap[dStr].hoursLogged += durHours;
          if (s.type === "Revision") {
            dateMap[dStr].revisionHours += durHours;
            if (dateMap[dStr].revisionsCount === 0) dateMap[dStr].revisionsCount = 1;
          } else {
            dateMap[dStr].activeHours += durHours;
          }
        }
      });

      // 6. Daily Accountability strictly for this user
      const board = await DailyAccountability.findOne({ userId: uId }).lean();
      if (board && board.sections) {
        board.sections.forEach(sec => {
          (sec.rows || []).forEach(row => {
            if (row.date) {
              const dStr = row.date;
              initDate(dStr);
              dateMap[dStr].accountabilityLogs += 1;
            }
          });
        });
      }

      return Object.entries(dateMap).map(([dateStr, metrics]) => ({
        entityType: "user",
        entityId: uId,
        period: "daily",
        date: new Date(dateStr + "T00:00:00.000Z"),
        metrics: {
          ...metrics,
          hoursLogged: Number(metrics.hoursLogged.toFixed(2)),
          activeHours: Number(metrics.activeHours.toFixed(2)),
          revisionHours: Number(metrics.revisionHours.toFixed(2))
        }
      })).sort((a, b) => new Date(a.date) - new Date(b.date));
    } catch (err) {
      console.error("Error in getUserConsistencyStats:", err);
      return [];
    }
  }

  /**
   * Fetch detailed activity breakdown for a specific date strictly from UserTaskProgress & FocusSession
   */
  async getDayDetails(userId, dateStr, projectId = null, branchId = null) {
    const uId = new mongoose.Types.ObjectId(userId);

    // 1. Resolve canonical tasks for the project / branch if specified
    let taskFilter = {};
    if (projectId) taskFilter.projectName = new mongoose.Types.ObjectId(projectId);
    if (branchId) taskFilter.branchId = branchId;
    const canonicalTasks = await Task.find(taskFilter).select("_id").lean();
    const taskIds = canonicalTasks.map(t => t._id);

    // 2. Completed tasks for this user on this day from UserTaskProgress
    const progressFilter = {
      userId: uId,
      status: "done"
    };
    if (taskIds.length > 0) {
      progressFilter.taskId = { $in: taskIds };
    }

    const allDoneProgress = await UserTaskProgress.find(progressFilter)
      .populate({
        path: "taskId",
        populate: [
          { path: "projectName", select: "name key" },
          { path: "assignee", select: "firstName lastName profileImage" }
        ]
      })
      .lean();

    const completedTasks = [];
    allDoneProgress.forEach(p => {
      let doneDate = p.completedAt || p.updatedAt;
      if (p.activityLogs && p.activityLogs.length > 0) {
        const doneLog = [...p.activityLogs].reverse().find(l => l.currentStatus === "done");
        if (doneLog && doneLog.date) {
          doneDate = doneLog.date;
        }
      }
      const doneStr = moment.utc(doneDate).format("YYYY-MM-DD");
      if (doneStr === dateStr && p.taskId) {
        completedTasks.push({
          _id: p.taskId._id,
          taskId: p.taskId.taskId,
          taskName: p.taskId.taskName,
          taskType: p.taskId.taskType,
          taskPriority: p.taskId.taskPriority,
          storyPoints: p.taskId.storyPoints || 0,
          estimatedHours: p.taskId.estimatedHours || 0,
          completedAt: doneDate,
          projectName: p.taskId.projectName,
          assignee: p.taskId.assignee
        });
      }
    });

    // 3. Revised tasks for this user on this day from UserTaskProgress, Task, DailyRevision, and FocusSession
    const revisedTasksMap = new Map();

    // From UserTaskProgress
    const revisionFilter = {
      userId: uId,
      "revisionLogs.0": { $exists: true }
    };
    if (taskIds.length > 0) {
      revisionFilter.taskId = { $in: taskIds };
    }

    const allRevisionProgress = await UserTaskProgress.find(revisionFilter)
      .populate({
        path: "taskId",
        populate: [
          { path: "projectName", select: "name key" },
          { path: "assignee", select: "firstName lastName profileImage" }
        ]
      })
      .lean();

    allRevisionProgress.forEach(p => {
      (p.revisionLogs || []).forEach(rl => {
        if (rl.revisionDate) {
          const revStr = moment.utc(rl.revisionDate).format("YYYY-MM-DD");
          if (revStr === dateStr && p.taskId) {
            const key = `${p.taskId._id}_${revStr}`;
            if (!revisedTasksMap.has(key)) {
              revisedTasksMap.set(key, {
                _id: p.taskId._id,
                taskId: p.taskId.taskId,
                taskName: p.taskId.taskName,
                taskType: p.taskId.taskType,
                notes: rl.notes,
                revisionDate: rl.revisionDate,
                projectName: p.taskId.projectName
              });
            }
          }
        }
      });
    });

    // From Task.revisionLogs
    const taskRevisionFilter = { "revisionLogs.0": { $exists: true } };
    if (taskIds.length > 0) {
      taskRevisionFilter._id = { $in: taskIds };
    }
    const allTaskRevisions = await Task.find(taskRevisionFilter)
      .populate("projectName", "name key")
      .lean();

    allTaskRevisions.forEach(t => {
      (t.revisionLogs || []).forEach(rl => {
        if (rl.revisionDate) {
          const revStr = moment.utc(rl.revisionDate).format("YYYY-MM-DD");
          if (revStr === dateStr) {
            const key = `${t._id}_${revStr}`;
            if (!revisedTasksMap.has(key)) {
              revisedTasksMap.set(key, {
                _id: t._id,
                taskId: t.taskId,
                taskName: t.taskName,
                taskType: t.taskType,
                notes: rl.notes,
                revisionDate: rl.revisionDate,
                projectName: t.projectName
              });
            }
          }
        }
      });
    });

    // From DailyRevision
    const dailyRev = await DailyRevision.findOne({ userId: uId, dateStr })
      .populate({
        path: "questions",
        populate: { path: "projectName", select: "name key" }
      })
      .populate({
        path: "questionLogs.taskId",
        populate: { path: "projectName", select: "name key" }
      })
      .lean();

    if (dailyRev) {
      (dailyRev.questionLogs || []).forEach(ql => {
        const t = ql.taskId;
        if (t && (!taskIds.length || taskIds.some(id => id.toString() === (t._id || t).toString()))) {
          const key = `${t._id || t}_${dateStr}`;
          if (!revisedTasksMap.has(key)) {
            revisedTasksMap.set(key, {
              _id: t._id,
              taskId: t.taskId,
              taskName: t.taskName,
              taskType: t.taskType || "Revision",
              notes: ql.notes || "Completed in Daily Revision Protocol",
              revisionDate: dailyRev.updatedAt || new Date(dateStr),
              projectName: t.projectName
            });
          }
        }
      });

      if (!dailyRev.questionLogs?.length && dailyRev.questions?.length) {
        dailyRev.questions.forEach(t => {
          if (t && (!taskIds.length || taskIds.some(id => id.toString() === (t._id || t).toString()))) {
            const key = `${t._id}_${dateStr}`;
            if (!revisedTasksMap.has(key)) {
              revisedTasksMap.set(key, {
                _id: t._id,
                taskId: t.taskId,
                taskName: t.taskName,
                taskType: t.taskType || "Revision",
                notes: "Daily Revision Question",
                revisionDate: dailyRev.updatedAt || new Date(dateStr),
                projectName: t.projectName
              });
            }
          }
        });
      }
    }

    const revisedTasks = Array.from(revisedTasksMap.values());

    // 4. Focus Sessions strictly for this user on this day
    const sessionFilter = { user: uId };
    if (taskIds.length > 0) {
      sessionFilter.task = { $in: taskIds };
    }
    const focusSessionsRaw = await FocusSession.find(sessionFilter)
      .populate({
        path: "task",
        select: "taskName taskId taskType projectName",
        populate: { path: "projectName", select: "name key" }
      })
      .lean();

    const focusSessions = focusSessionsRaw.filter(s => {
      const sDate = s.date || s.startTime;
      if (!sDate) return false;
      const sessionStr = moment.utc(sDate).format("YYYY-MM-DD");
      return sessionStr === dateStr;
    }).map(s => ({
      _id: s._id,
      durationMinutes: s.duration || 0,
      durationHours: Number(((s.duration || 0) / 60).toFixed(2)),
      startTime: s.startTime || s.date,
      type: s.type,
      task: s.task
    }));

    // 5. Daily Accountability logs for this day
    let accountabilityLogsCount = 0;
    if (!projectId) {
      const board = await DailyAccountability.findOne({ userId: uId }).lean();
      if (board) {
        (board.sections || []).forEach(sec => {
          (sec.rows || []).forEach(row => {
            if (row.date === dateStr) {
              accountabilityLogsCount++;
            }
          });
        });
      }
    }

    const totalFocusHours = Number(focusSessions.reduce((acc, s) => acc + s.durationHours, 0).toFixed(2));

    return {
      date: dateStr,
      completedTasks,
      revisedTasks,
      focusSessions,
      summary: {
        tasksCompleted: completedTasks.length,
        tasksRevised: revisedTasks.length,
        totalFocusHours,
        accountabilityLogsCount
      }
    };
  }

}

export default new AnalyticsService();

