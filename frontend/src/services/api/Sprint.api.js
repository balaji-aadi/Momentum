import Api from "../axiosConfig";

export const SprintApi = {
  createSprint: async (payload) => {
    return await Api.post("/sprint/create", payload);
  },
  getSprintsByProject: async (projectId) => {
    return await Api.get(`/sprint/project/${projectId}`);
  },
  updateSprint: async (sprintId, payload) => {
    return await Api.put(`/sprint/${sprintId}`, payload);
  },
  deleteSprint: async (sprintId) => {
    return await Api.delete(`/sprint/${sprintId}`);
  },
};
