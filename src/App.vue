<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
    <!-- Login Screen -->
    <div v-if="!connected" class="max-w-md w-full bg-white rounded-2xl shadow-2xl p-10">
      <div class="text-center mb-8">
        <h2 class="text-4xl font-bold text-gray-800 mb-2">💬 Chat App</h2>
        <p class="text-gray-500">Connect and start messaging</p>
      </div>
      <input 
        v-model="userIdInput" 
        @keyup.enter="connectUser"
        class="w-full mb-6 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-all" 
        placeholder="Enter your user ID" 
      />
      <button 
        @click="connectUser" 
        class="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 font-semibold shadow-lg"
      >
        Connect
      </button>
    </div>

    <!-- Chat Screen -->
    <div v-else class="w-full max-w-6xl h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
      <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h3 class="text-2xl font-bold">💬 Chat App</h3>
          <p class="text-sm text-blue-100">Logged in as: <span class="font-semibold">{{ userId }}</span></p>
        </div>
        <div class="flex items-center space-x-2">
          <span class="w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
          <span class="text-sm">Online</span>
        </div>
      </div>
      <ChatWindow />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ChatWindow from './components/ChatWindow.vue'
import { useChat } from './store/chat'

const { userId, receiverId, fetchOnlineUsers, connect } = useChat()

const userIdInput = ref('')
const connected = ref(false)

function connectUser() {
  if (!userIdInput.value) return alert('Enter user ID')
  connect(userIdInput.value)
  connected.value = true
  fetchOnlineUsers()
}
</script>

<style scoped>
/* Removed styles to use Tailwind */
</style>