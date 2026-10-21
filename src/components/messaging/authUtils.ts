export const getAuthHeaders = (extra: Record<string, string> = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('chatze_auth_token') : null
  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}
