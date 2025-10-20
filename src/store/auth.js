import { ref, computed } from 'vue'

// Authentication state
const user = ref(null)
const accessToken = ref(localStorage.getItem('access_token'))
const refreshToken = ref(localStorage.getItem('refresh_token'))
const loading = ref(false)
const error = ref(null)

// API base URL for Rails backend
const API_BASE_URL = 'http://localhost:3000/api/v1'

export function useAuth() {
  
  // Computed properties
  const isAuthenticated = computed(() => !!accessToken.value && !!user.value)
  
  // Clear error when starting new operations
  function clearError() {
    error.value = null
  }
  
  // Store tokens and user data
  function setAuthData(data) {
    accessToken.value = data.access_token
    refreshToken.value = data.refresh_token
    user.value = data.user
    
    // Store in localStorage
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    localStorage.setItem('user', JSON.stringify(data.user))
  }
  
  // Clear authentication data
  function clearAuthData() {
    accessToken.value = null
    refreshToken.value = null
    user.value = null
    
    // Clear localStorage
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
  }
  
  // Login function
  async function login(email, password) {
    loading.value = true
    clearError()
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }
      
      setAuthData(data)
      return { success: true }
      
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }
  
  // Register function
  async function register(email, password, name) {
    loading.value = true
    clearError()
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.errors ? data.errors.join(', ') : 'Registration failed')
      }
      
      setAuthData(data)
      return { success: true }
      
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }
  
  // Refresh access token
  async function refreshAccessToken() {
    if (!refreshToken.value) {
      logout()
      return false
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken.value })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        logout()
        return false
      }
      
      accessToken.value = data.access_token
      refreshToken.value = data.refresh_token
      
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('refresh_token', data.refresh_token)
      
      return true
      
    } catch (err) {
      logout()
      return false
    }
  }
  
  // Logout function
  async function logout() {
    loading.value = true
    
    try {
      // Call logout endpoint to revoke refresh token
      if (refreshToken.value) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh_token: refreshToken.value })
        })
      }
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      clearAuthData()
      loading.value = false
    }
  }
  
  // Get current user info
  async function getCurrentUser() {
    if (!accessToken.value) return null
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken.value}`
        }
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          // Try to refresh token
          const refreshed = await refreshAccessToken()
          if (refreshed) {
            return getCurrentUser() // Retry with new token
          }
        }
        throw new Error('Failed to get user info')
      }
      
      const data = await response.json()
      user.value = data.user
      localStorage.setItem('user', JSON.stringify(data.user))
      
      return data.user
      
    } catch (err) {
      console.error('Get user error:', err)
      logout()
      return null
    }
  }
  
  // Initialize auth state from localStorage
  function initializeAuth() {
    const storedUser = localStorage.getItem('user')
    if (storedUser && accessToken.value) {
      try {
        user.value = JSON.parse(storedUser)
        // Verify token is still valid
        getCurrentUser()
      } catch (err) {
        clearAuthData()
      }
    }
  }
  
  // API helper with automatic token refresh
  async function authenticatedFetch(url, options = {}) {
    if (!accessToken.value) {
      throw new Error('No access token available')
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken.value}`,
      ...options.headers
    }
    
    let response = await fetch(url, {
      ...options,
      headers
    })
    
    // If unauthorized, try to refresh token
    if (response.status === 401) {
      const refreshed = await refreshAccessToken()
      if (refreshed) {
        // Retry with new token
        headers['Authorization'] = `Bearer ${accessToken.value}`
        response = await fetch(url, {
          ...options,
          headers
        })
      } else {
        logout()
        throw new Error('Authentication failed')
      }
    }
    
    return response
  }
  
  return {
    // State
    user,
    accessToken,
    refreshToken,
    loading,
    error,
    isAuthenticated,
    
    // Methods
    login,
    register,
    logout,
    getCurrentUser,
    refreshAccessToken,
    initializeAuth,
    authenticatedFetch,
    clearError
  }
}
