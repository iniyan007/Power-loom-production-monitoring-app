import axios from "axios";
import { API_URL } from "../config/apiConfig";

export const api = axios.create({
  baseURL: API_URL
});

api.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.authorization = token;
  return req;
});
