import { request } from './apiClient'

export const notificationService = {
  list: () => request('/notifications'),
  readAll: () => request('/notifications/read', { method: 'POST' }),
}
