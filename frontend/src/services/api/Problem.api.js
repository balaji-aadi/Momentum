import Api from "../axiosConfig";

export const ProblemApi = {
  // Problem APIs
  getProblems: (params) => Api.get("/problem", { params }),
  getProblemByIdOrSlug: (identifier) => Api.get(`/problem/${identifier}`),
  createProblem: (payload) => Api.post("/problem", payload),
  updateProblem: (id, payload) => Api.put(`/problem/${id}`, payload),
  archiveProblem: (id) => Api.delete(`/problem/${id}`),
  checkSlugAvailability: (slug) => Api.get("/problem/check-slug", { params: { slug } }),

  // Meta APIs
  getCompanies: () => Api.get("/problem/meta/companies"),
  createCompany: (payload) => Api.post("/problem/meta/companies", payload),
  deleteCompany: (id) => Api.delete(`/problem/meta/companies/${id}`),

  getTopics: () => Api.get("/problem/meta/topics"),
  createTopic: (payload) => Api.post("/problem/meta/topics", payload),
  deleteTopic: (id) => Api.delete(`/problem/meta/topics/${id}`),

  getPatterns: () => Api.get("/problem/meta/patterns"),
  createPattern: (payload) => Api.post("/problem/meta/patterns", payload),
  deletePattern: (id) => Api.delete(`/problem/meta/patterns/${id}`),

  getLanguages: () => Api.get("/problem/meta/languages"),
  createLanguage: (payload) => Api.post("/problem/meta/languages", payload),

  seedDefaults: () => Api.post("/problem/meta/seed-defaults")
};
