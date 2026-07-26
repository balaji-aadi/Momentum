import Api from "../axiosConfig";

export const AnalyticsApi = {
  getPersonalStats: (params) => Api.get("analytics/personal-stats", { params }),
  getTeamStats: (params) => Api.get("analytics/team-stats", { params }),
  getProjectHealth: (params) => Api.get("analytics/project-health", { params }),
  getMemberStats: (userId, params) => Api.get(`analytics/member-stats/${userId}`, { params }),
  getDayDetails: (params) => Api.get("analytics/day-details", { params }),
  syncData: () => Api.post("analytics/sync"),
};
