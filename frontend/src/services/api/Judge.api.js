import axiosInstance from '../axiosConfig';

export const JudgeApi = {
  // Execute code against sample/custom testcases (Run API)
  runCode: (payload) => {
    return axiosInstance.post('/judge/run', payload);
  },
  // Evaluate submission against full testcase suite (Submit API)
  submitCode: (payload) => {
    return axiosInstance.post('/judge/submit', payload);
  }
};
