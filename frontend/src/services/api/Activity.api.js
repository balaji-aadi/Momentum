import Api from "../axiosConfig";

export const ActivityApi = {
  createActivity: (payload) => Api.post("/activity/create-activity", payload),
  updateActivity: (activityId, payload) =>
    Api.put(`/activity/update-activity/${activityId}`, payload),
  activityDone: (activityId) =>
    Api.patch(`/activity/completed-activity/${activityId}`),
  getAllActivity: (payload) =>
    Api.post("/activity/get-all-activities", payload),
  getSingleActivity: (activityId) =>
    Api.get(`/activity/get-activity/${activityId}`),
  deleteActivity: (activityId) =>
    Api.delete(`/activity/delete-activity/${activityId}`),
};
