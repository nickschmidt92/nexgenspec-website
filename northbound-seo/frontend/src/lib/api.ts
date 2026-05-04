import axios from 'axios'
import { auth } from './firebase'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
})

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser
  if (user) {
    const token = await user.getIdToken()
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api

export const projectsApi = {
  list: () => api.get('/projects').then((r) => r.data),
  get: (id: string) => api.get(`/projects/${id}`).then((r) => r.data),
  create: (data: unknown) => api.post('/projects', data).then((r) => r.data),
  update: (id: string, data: unknown) => api.patch(`/projects/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  getOverview: (id: string) => api.get(`/projects/${id}/overview`).then((r) => r.data),
}

export const auditsApi = {
  trigger: (projectId: string) => api.post(`/projects/${projectId}/audits`).then((r) => r.data),
  list: (projectId: string) => api.get(`/projects/${projectId}/audits`).then((r) => r.data),
  get: (id: string) => api.get(`/audits/${id}`).then((r) => r.data),
  getIssues: (id: string, params?: Record<string, string>) =>
    api.get(`/audits/${id}/issues`, { params }).then((r) => r.data),
  getIssueSummary: (id: string) => api.get(`/audits/${id}/issues/summary`).then((r) => r.data),
}

export const keywordsApi = {
  trigger: (projectId: string, data?: unknown) =>
    api.post(`/projects/${projectId}/keyword-research`, data).then((r) => r.data),
  list: (projectId: string) =>
    api.get(`/projects/${projectId}/keyword-research`).then((r) => r.data),
  get: (id: string) => api.get(`/keyword-research/${id}`).then((r) => r.data),
  getKeywords: (id: string, params?: Record<string, string>) =>
    api.get(`/keyword-research/${id}/keywords`, { params }).then((r) => r.data),
  getClusters: (id: string) => api.get(`/keyword-research/${id}/clusters`).then((r) => r.data),
}

export const competitorsApi = {
  add: (projectId: string, data: unknown) =>
    api.post(`/projects/${projectId}/competitors`, data).then((r) => r.data),
  list: (projectId: string) => api.get(`/projects/${projectId}/competitors`).then((r) => r.data),
  delete: (id: string) => api.delete(`/competitors/${id}`),
  triggerAnalysis: (projectId: string) =>
    api.post(`/projects/${projectId}/competitor-analysis`).then((r) => r.data),
  getAnalysis: (id: string) => api.get(`/competitor-analyses/${id}`).then((r) => r.data),
  getGaps: (id: string, params?: Record<string, string>) =>
    api.get(`/competitor-analyses/${id}/gaps`, { params }).then((r) => r.data),
}

export const contentApi = {
  trigger: (projectId: string) =>
    api.post(`/projects/${projectId}/content-plans`).then((r) => r.data),
  list: (projectId: string) =>
    api.get(`/projects/${projectId}/content-plans`).then((r) => r.data),
  get: (id: string) => api.get(`/content-plans/${id}`).then((r) => r.data),
  getItems: (id: string, params?: Record<string, string>) =>
    api.get(`/content-plans/${id}/items`, { params }).then((r) => r.data),
  updateItem: (id: string, data: unknown) =>
    api.patch(`/content-items/${id}`, data).then((r) => r.data),
}

export const actionsApi = {
  list: (projectId: string, params?: Record<string, string>) =>
    api.get(`/projects/${projectId}/actions`, { params }).then((r) => r.data),
  getSummary: (projectId: string) =>
    api.get(`/projects/${projectId}/actions/summary`).then((r) => r.data),
  update: (id: string, data: unknown) => api.patch(`/actions/${id}`, data).then((r) => r.data),
  regenerate: (projectId: string) =>
    api.post(`/projects/${projectId}/actions/regenerate`).then((r) => r.data),
}

export const authApi = {
  register: (data: unknown) => api.post('/auth/register', data).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
}

export const exportsApi = {
  create: (projectId: string, type: string) =>
    api.post(`/projects/${projectId}/exports`, { type }).then((r) => r.data),
  get: (id: string) => api.get(`/exports/${id}`).then((r) => r.data),
  list: (projectId: string) => api.get(`/projects/${projectId}/exports`).then((r) => r.data),
}
