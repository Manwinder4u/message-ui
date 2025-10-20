<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
    
    <!-- Authentication Screen -->
    <div v-if="!isAuthenticated">
      <!-- Login Form -->
      <LoginForm 
        v-if="authMode === 'login'"
        @login-success="handleAuthSuccess"
        @switch-to-register="authMode = 'register'"
      />
      
      <!-- Register Form -->
      <RegisterForm 
        v-else
        @register-success="handleAuthSuccess"
        @switch-to-login="authMode = 'login'"
      />
    </div>

    <!-- Chat Screen -->
    <div v-else class="w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
      <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h3 class="text-2xl font-bold">💬 Chat App</h3>
          <p class="text-sm text-blue-100">
            Welcome, <span class="font-semibold">{{ user?.name || user?.email }}</span>
            <span class="ml-2 text-xs bg-blue-500 px-2 py-1 rounded-full">{{ user?.role }}</span>
          </p>
        </div>
        <div class="flex items-center space-x-4">
          <div class="flex items-center space-x-2">
            <span class="w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
            <span class="text-sm">Online</span>
          </div>
          <button
            @click="handleLogout"
            class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          >
            Logout
          </button>
        </div>
      </div>
      <div class="flex-1 min-h-0">
        <ChatWindow />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuth } from './store/auth'
import { useChat } from './store/chat'
import LoginForm from './components/LoginForm.vue'
import RegisterForm from './components/RegisterForm.vue'
import ChatWindow from './components/ChatWindow.vue'

// Auth composable
const { user, isAuthenticated, logout, initializeAuth } = useAuth()

// Chat composable
const { connect, disconnect, fetchOnlineUsers } = useChat()

// UI state
const authMode = ref('login') // 'login' or 'register'

// Handle successful authentication
async function handleAuthSuccess() {
  console.log('Authentication successful, user:', user.value)
  
  // Connect to chat with user ID from JWT
  if (user.value?.id) {
    await connect(user.value.id.toString())
    fetchOnlineUsers()
  }
}

// Handle logout
async function handleLogout() {
  await disconnect() // Disconnect from chat first
  await logout() // Then logout from auth
  authMode.value = 'login' // Reset to login form
}

// Initialize authentication on app start
onMounted(() => {
  initializeAuth()
  
  // If already authenticated, connect to chat
  if (isAuthenticated.value && user.value?.id) {
    handleAuthSuccess()
  }
})
</script>

<style scoped>
/* Removed styles to use Tailwind */
</style>