import Api from "../axiosConfig";

export const DashbordApi = {
  getAllData: () => Api.post(`mdashboard/user-Statistics`),
  projectStats: () => Api.post(`mdashboard/project-Statistics`),
  teamStats: () => Api.post(`mdashboard/team-Statistics`),
  taskDeliverables: (payload) =>
    Api.post(`mdashboard/task-deliverable`, payload),
  developerTaskDetails: () => Api.post("/mdashboard/developer-Statistics"),
};
