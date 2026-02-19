import Api from "../axiosConfig";

export const ProjectApi = {

  // Project apis
  createProject: (payload) => Api.post("project/create-project", payload),
  updateProject: (id, payload) =>
    Api.put(`project/update-project/${id}`, payload),
  getAllProjects: (payload) => Api.post("project/get-all-projects", payload),
  getProjectById: (id) => Api.get(`/project/get-projects/${id}`),
  project: (id) => Api.get(`/project/get-projects/${id}`),

  // Milestone apis
  getAllmileStones: (projectId) => Api.get(`project/get-projects/${projectId}`),
  getmileStones: () => Api.post(`/milestone/find-all-milestone`),
  createMileStone: (projectId, payload) => Api.post(`milestone/create-milestone/${projectId}`, payload),
  updateMileStones: (milestoneId, payload) => Api.put(`milestone/update-milestone/${milestoneId}`, payload),
  deletemileStone: (milestoneId) => Api.delete(`milestone/delete-milestone/${milestoneId}`),
};
