import axios from "axios";
import { server } from "./config";

const instance = axios.create({
  baseURL: server,
});

instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token !== null) {
      config.headers["Authorization"] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;

    if (status === 401) {
      localStorage.removeItem("token");
    }
    if (status === 403) {
      console.error("Session Expired! Failed URL:", url);
      // localStorage.clear();

      if (window.__persistor) {
        window.__persistor.purge();
      }
      alert(`Your session has expired!! Failed Request: ${url}`);
      // window.location.reload();
    }

    return Promise.reject(error);
  }
);

export default instance;
