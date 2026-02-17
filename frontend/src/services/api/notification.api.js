import Api from "../axiosConfig";

export const NotificationApi = {
  getAllNotify: (payload) => Api.post(`/notify/get-all-notification`, payload),
  markAllAsRead: () => Api.put(`/notify/mark-all`),
  updateStatus: (id) => Api.put(`/notify/update-notification/${id}`),
};
