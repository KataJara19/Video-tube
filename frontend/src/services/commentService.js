import { request } from './apiClient'

export const commentService = {
  /** sort: 'top' (principales) | 'new' (más recientes) */
  list: (videoId, sort = 'top') => request(`/videos/${videoId}/comments?sort=${sort}`),
  create: (videoId, content, parentId) =>
    request(`/videos/${videoId}/comments`, { method: 'POST', body: { content, parent_id: parentId ?? null } }),
  replies: (commentId) => request(`/comments/${commentId}/replies`),
  react: (commentId, value) => request(`/comments/${commentId}/reaction`, { method: 'POST', body: { value } }),
}
