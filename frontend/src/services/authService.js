import { request, tokenStorage } from './apiClient'

const USER_KEY = 'vt_user'

function saveSession({ access_token, user }) {
  tokenStorage.set(access_token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  return user
}

export const authService = {
  register: (name, email, password) =>
    request('/users', { method: 'POST', body: { name, email, password } }).then(saveSession),

  login: (email, password) => request('/login', { method: 'POST', body: { email, password } }).then(saveSession),

  getUser: (id) => request(`/users/${id}`),

  loadSession() {
    try {
      return tokenStorage.get() ? JSON.parse(localStorage.getItem(USER_KEY)) : null
    } catch {
      return null
    }
  },

  clearSession() {
    tokenStorage.clear()
    localStorage.removeItem(USER_KEY)
  },
}
