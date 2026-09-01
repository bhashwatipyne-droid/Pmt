import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const authHeaders = (userId) => (userId ? { "X-User-Id": userId } : {});

export const getUsers = () => axios.get(`${API}/users`).then((r) => r.data);

export const getOptions = () => axios.get(`${API}/config/options`).then((r) => r.data);

export const getWorkItems = (userId, params) =>
  axios.get(`${API}/work-items`, { headers: authHeaders(userId), params }).then((r) => r.data);

export const createWorkItem = (userId, payload) =>
  axios.post(`${API}/work-items`, payload, { headers: authHeaders(userId) }).then((r) => r.data);

export const updateWorkItem = (userId, id, payload) =>
  axios.patch(`${API}/work-items/${id}`, payload, { headers: authHeaders(userId) }).then((r) => r.data);

export const deleteWorkItem = (userId, id) =>
  axios.delete(`${API}/work-items/${id}`, { headers: authHeaders(userId) }).then((r) => r.data);
