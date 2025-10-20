<template>
  <div class="flex h-full min-h-0">
    <!-- Online Users Sidebar -->
    <div class="w-80 border-r border-gray-200 bg-gray-50 flex flex-col h-full">
      <div class="p-4 border-b border-gray-200 bg-white flex-shrink-0">
        <h4 class="text-lg font-bold text-gray-800 flex items-center">
          <span class="mr-2">👥</span>
          Online Users
          <span class="ml-auto bg-blue-500 text-white text-xs px-2 py-1 rounded-full">{{ onlineUsers.length }}</span>
        </h4>
      </div>
      <div class="flex-1 overflow-y-auto p-3">
        <div v-if="onlineUsers.length === 0" class="text-center text-gray-400 mt-8">
          <p>No users online</p>
        </div>
        <div 
          v-for="user in onlineUsers" 
          :key="user.id" 
          @click="setReceiver(user)" 
          :class="[
            'cursor-pointer p-3 rounded-lg mb-2 transition-all duration-200 flex items-center',
            user.id === receiverId 
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105' 
              : 'bg-white hover:bg-gray-100 text-gray-800 hover:shadow-md'
          ]"
        >
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold mr-3">
            {{ (user.name || user.id).charAt(0).toUpperCase() }}
          </div>
          <div class="flex-1">
            <div class="font-semibold">{{ user.name || user.id }}</div>
            <div class="text-xs text-gray-500 capitalize">{{ user.role }}</div>
            <div v-if="user.id === receiverId" class="text-xs opacity-90">✓ Selected</div>
          </div>
          <div class="w-2 h-2 bg-green-400 rounded-full"></div>
        </div>
      </div>
    </div>

    <!-- Chat Area -->
    <div class="flex-1 grid grid-rows-[auto_1fr_auto] h-full">
      <!-- Chat Header -->
      <div v-if="receiverId && selectedUser" class="p-4 border-b border-gray-200 bg-white flex items-center">
        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold mr-3">
          {{ (selectedUser.name || selectedUser.id).charAt(0).toUpperCase() }}
        </div>
        <div>
          <div class="font-semibold text-gray-800">{{ selectedUser.name || selectedUser.id }}</div>
          <div class="text-xs text-green-500">● Online • {{ selectedUser.role }}</div>
        </div>
      </div>
      <div v-else class="p-4 border-b border-gray-200 bg-white">
        <div class="text-gray-500 text-center">Select a user to start chatting</div>
      </div>

      <!-- Messages Area -->
      <div class="overflow-y-auto p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-0" ref="messagesContainer">
        <div v-if="filteredMessages.length === 0" class="flex items-center justify-center h-full min-h-[300px]">
          <div class="text-center text-gray-400">
            <div class="text-6xl mb-4">💬</div>
            <p class="text-lg">No messages yet</p>
            <p class="text-sm">Start the conversation!</p>
          </div>
        </div>
        <div v-else class="space-y-3 pb-4">
          <div 
            v-for="(msg, i) in filteredMessages" 
            :key="msg.id || i" 
            :class="['flex', String(msg.sender) === String(userId) ? 'justify-end' : 'justify-start']"
          >
            <div 
              :class="[
                'max-w-md px-4 py-3 rounded-2xl shadow-md relative',
                String(msg.sender) === String(userId) 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-none' 
                  : 'bg-white text-gray-800 rounded-bl-none border'
              ]"
            >
              <div class="text-sm break-words mb-1">
                {{ msg.text }}
              </div>
              <div 
                :class="[
                  'text-xs opacity-75 text-right',
                  String(msg.sender) === String(userId) ? 'text-blue-100' : 'text-gray-500'
                ]"
              >
                {{ formatTime(msg.timestamp) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Message Input -->
      <div class="p-4 bg-white border-t border-gray-200">
        <form @submit.prevent="sendMessage" class="flex items-center space-x-3">
          <input 
            v-model="input" 
            type="text" 
            placeholder="Type a message..." 
            class="flex-1 py-3 px-4 border-2 border-gray-300 rounded-full focus:outline-none focus:border-blue-500 transition-all" 
          />
          <button 
            type="submit" 
            :disabled="!input.trim() || !receiverId"
            :class="[
              'px-6 py-3 rounded-full font-semibold transition-all transform',
              input.trim() && receiverId
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 hover:scale-105 shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            ]"
          >
            Send 📤
          </button>
        </form>
        <div v-if="!receiverId" class="text-xs text-red-500 mt-2 ml-4">
          Please select a user first
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, computed } from 'vue'
import { useChat } from '../store/chat'

const { messages, sendMessage: sendMsg, userId, onlineUsers, receiverId, selectUser } = useChat()
const input = ref('')
const messagesContainer = ref(null)
const selectedUser = ref(null)

// Filter messages to show only the conversation with the selected user
const filteredMessages = computed(() => {
  if (!receiverId.value) return []
  return messages.value.filter(msg => {
    // Show messages where:
    // 1. I sent to the receiver
    // 2. Receiver sent to me
    // Convert to strings to ensure proper comparison
    const msgSender = String(msg.sender)
    const msgReceiver = String(msg.receiver)
    const currentUserId = String(userId.value)
    const selectedReceiverId = String(receiverId.value)
    
    return (
      (msgSender === currentUserId && msgReceiver === selectedReceiverId) ||
      (msgSender === selectedReceiverId && msgReceiver === currentUserId)
    )
  })
})

function sendMessage() {
  if (!input.value.trim()) return
  sendMsg(input.value)
  input.value = ''
  // Ensure we scroll to bottom after sending with a small delay
  nextTick(() => {
    setTimeout(() => {
      scrollToBottom()
    }, 50)
  })
}

async function setReceiver(user) {
  selectedUser.value = user // Store the selected user object
  await selectUser(user.id) // Pass user ID to selectUser function
}

function formatTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  // If less than 1 minute ago
  if (diff < 60000) {
    return 'now'
  }
  
  // If today, show time only
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  
  // If this week, show day and time
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })
  }
  
  // Otherwise show date and time
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// Smooth scroll to bottom function
function scrollToBottom() {
  nextTick(() => {
    const el = messagesContainer.value
    if (el) {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: 'smooth'
      })
    }
  })
}

// Auto-scroll to bottom when messages change
watch(filteredMessages, (newMessages, oldMessages) => {
  // Always scroll to bottom when messages change
  // This ensures new messages are always visible
  nextTick(() => {
    scrollToBottom()
  })
}, { deep: true, immediate: true })

// Also scroll when receiver changes
watch(receiverId, () => {
  scrollToBottom()
})
</script>