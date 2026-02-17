import Api from "../axiosConfig";

export const TestApi = {
  // getAllTestcase: () => Api.get("test/get-all-tests"),
  createTestcase: (payload) => Api.post("testtask/create-testtask", payload),
  updateTask: (id, payload) =>
    Api.put(`testtask/update-testtask/${id}`, payload),
  taskLogs: (id, payload) =>
    Api.patch(`testtask/update-testtask-log/${id}`, payload),
  getAllTesting: (filter) => Api.post("/testtask/get-all-testtasks", filter),
  testing: (id) => Api.get(`/testtask/get-testtasks/${id}`),
  testCaseDashboard: (payload) =>
    Api.post(`/tdashboard/test-Statistics`, payload),

  // bug apis
  getAllBugs: (filter) => Api.post("/bug/get-all-bugs", filter),
  bugs: (id) => Api.get(`/bug/get-bug/${id}`),
  createBug: (payload) => Api.post("bug/create-bug", payload),
  updateBug: (id, payload) => Api.put(`/bug/update-bug/${id}`, payload),
  bugLogs: (id, payload) => Api.patch(`/bug/update-bug-log/${id}`, payload),
  bugDashboard: (payload) => Api.post(`/tdashboard/bug-Statistics`, payload),
};
