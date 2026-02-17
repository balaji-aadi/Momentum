import Api from "../axiosConfig";

export const CommonApi = {
  uploadFile: (payload) => Api.post("file/upload-file", payload),
  getFile: (filename) => Api.get(`file/get-file/${filename}`),
};
