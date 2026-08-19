import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { Note } from "../../models/note.model.js";
import axios from "axios";
import mongoose from "mongoose";

const noteController = {};

const checkIsAdmin = (user) => {
  return (
    user?.email === "balajiaadi2000@gmail.com" ||
    user?.userRole?.name?.toLowerCase() === "admin" ||
    user?.role === "admin" ||
    (user?.userRoles && user.userRoles.some(r => r.name?.toLowerCase() === "admin"))
  );
};

/**
 * Get all notes for the authenticated user or canonical task-linked notes
 */
noteController.getNotes = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { taskId, taskIds } = req.query;

  let query = {};

  if (taskId || taskIds) {
    const ids = [];
    if (taskId) ids.push(taskId);
    if (taskIds) {
      taskIds.split(',').forEach(id => ids.push(id.trim()));
    }
    const objectIds = ids.map(id => mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id);
    // Task-linked notes are canonical curriculum content shared with all authenticated users
    query.$or = [
      { taskId: { $in: objectIds } },
      { taskIds: { $in: objectIds } }
    ];
  } else {
    // Unlinked sticky notes are private to the user
    query.userId = userId;
  }

  const notes = await Note.find(query).sort({ updatedAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, notes, "Notes retrieved successfully")
  );
});

/**
 * Create a new sticky note
 * Non-admins can only create personal unlinked notes; task-linked notes require Admin role
 */
noteController.createNote = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const isAdmin = checkIsAdmin(req.user);
  const { content, imageUrl, color, position, size, isPinned, title, tags, taskId, taskIds } = req.body;

  const isTaskLinked = Boolean(taskId || (Array.isArray(taskIds) && taskIds.length > 0));
  if (isTaskLinked && !isAdmin) {
    throw new ApiError(403, "Forbidden: Only administrators can create canonical notes for tasks");
  }

  const newNote = await Note.create({
    userId,
    content: content || "",
    imageUrl: imageUrl || "",
    color: color || "#fef08a",
    position: position || { x: 100, y: 100 },
    size: size || { width: 250, height: 180 },
    isPinned: isPinned || false,
    title: title || "",
    tags: tags || [],
    taskId: taskId || null,
    taskIds: taskIds || []
  });

  return res.status(201).json(
    new ApiResponse(201, newNote, "Note created successfully")
  );
});

/**
 * Update an existing sticky note
 * Task-linked notes require Admin role; personal notes require owner or Admin
 */
noteController.updateNote = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const isAdmin = checkIsAdmin(req.user);
  const { id } = req.params;

  const note = await Note.findById(id);
  if (!note) {
    throw new ApiError(404, "Note not found");
  }

  const isTaskLinked = note.taskId || (Array.isArray(note.taskIds) && note.taskIds.length > 0);
  if (isTaskLinked && !isAdmin) {
    throw new ApiError(403, "Forbidden: Only administrators can update canonical notes");
  }

  if (!isTaskLinked && !isAdmin && note.userId.toString() !== userId.toString()) {
    throw new ApiError(403, "Forbidden: Unauthorized to update this personal note");
  }

  // Update properties if provided in body
  const fields = ["content", "imageUrl", "color", "position", "size", "isPinned", "title", "tags", "taskId", "taskIds"];
  fields.forEach(field => {
    if (req.body[field] !== undefined) {
      note[field] = req.body[field];
    }
  });

  await note.save();

  return res.status(200).json(
    new ApiResponse(200, note, "Note updated successfully")
  );
});

/**
 * Delete a sticky note
 * Task-linked notes require Admin role; personal notes require owner or Admin
 */
noteController.deleteNote = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const isAdmin = checkIsAdmin(req.user);
  const { id } = req.params;

  const note = await Note.findById(id);
  if (!note) {
    throw new ApiError(404, "Note not found");
  }

  const isTaskLinked = note.taskId || (Array.isArray(note.taskIds) && note.taskIds.length > 0);
  if (isTaskLinked && !isAdmin) {
    throw new ApiError(403, "Forbidden: Only administrators can delete canonical notes");
  }

  if (!isTaskLinked && !isAdmin && note.userId.toString() !== userId.toString()) {
    throw new ApiError(403, "Forbidden: Unauthorized to delete this personal note");
  }

  await Note.findByIdAndDelete(id);

  return res.status(200).json(
    new ApiResponse(200, null, "Note deleted successfully")
  );
});

/**
 * AI - Enhance an individual note (expand, summarize, checklist, clarify)
 */
noteController.aiEnhance = asyncHandler(async (req, res) => {
  const { content, action } = req.body;
  const apiKey = process.env.GROQ_API_KEY;

  if (!content) {
    throw new ApiError(400, "Content is required for AI enhancement");
  }
  if (!apiKey) {
    throw new ApiError(500, "Groq API key is not configured on backend server");
  }

  const prompt = `
Task: Rewrite the following note content according to the requested action: "${action || 'clarify'}".
Current Note Content: "${content}"

Requirements:
- If action is "expand", add detailed subtasks or context (maximum 60 words).
- If action is "summarize", write a punchy, ultra-concise summary (maximum 20 words).
- If action is "checklist", format it as a clean markdown todo list (e.g., "- [ ] Task item").
- If action is "clarify", improve grammar, styling, and professionalism.
- If action is "translate-hi", translate the English text into natural, accurate Hindi. Keep all HTML tags and structures (like <h3>, <p>, <ul>, <li>, <pre>, etc.) EXACTLY unchanged, only translating the human text content inside the tags.

Return ONLY the plain text of the updated note content. Do not write any introduction, explanation, markdown headers, or JSON wrapping. Just return the raw text/HTML.
`;

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      }
    );

    const rewrittenText = response.data?.choices?.[0]?.message?.content?.trim() || content;

    return res.status(200).json(
      new ApiResponse(200, { enhancedContent: rewrittenText }, "Content enhanced successfully")
    );
  } catch (error) {
    console.error("Groq Enhance Error:", error.response?.data || error.message);
    throw new ApiError(500, `AI enhancement failed: ${error.message}`);
  }
});

export default noteController;
