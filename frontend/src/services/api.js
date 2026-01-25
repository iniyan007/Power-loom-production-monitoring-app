import axios from "axios";

export const api = axios.create({
  baseURL: "https://power-loom-production-monitoring-app.onrender.com/api"
});

api.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.authorization = token;
  return req;
});
