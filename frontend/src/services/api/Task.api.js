import Api from "../axiosConfig";

export const TaskApi = {
  createTask: (payload) => Api.post("task/create-task", payload),
  updateTask: (id, payload) => Api.put(`task/update-task/${id}`, payload),
  taskLogs: (id, payload) => Api.patch(`/task/update-task-log/${id}`, payload),
  getAllTasks: (filter) => Api.post("task/get-all-tasks", filter),
  getDependencies: () => Api.post("task/get-alltask-free"),
  task: (id) => Api.get(`/task/get-tasks/${id}`),
  taskImport: (payload) => Api.post(`task/task-import`, payload),

};
