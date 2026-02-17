import Api from "../axiosConfig";

export const UserApi = {
  users: (payload) => Api.post("user/get-all-user", payload),
  getAllTesters: () => Api.get("/testtask/get-all-testers "),
  singleUser: (userId) => Api.get(`user/get-user-by-id/${userId}`),
  updateUser: (userId, payload) =>
    Api.put(`user/update-user/${userId}`, payload),
  saveFcmToken: (payload) => Api.post(`user/create-fcm-token`, payload),
};
