import { request } from './apiClient'

// Suscripciones a canales
export const channelService = {
  subscribe: (channelId) => request(`/users/${channelId}/subscribe`, { method: 'POST' }),
  unsubscribe: (channelId) => request(`/users/${channelId}/subscribe`, { method: 'DELETE' }),
  mySubscriptions: () => request('/me/subscriptions'),
}
