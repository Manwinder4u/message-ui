<template>
  <div class="flex h-full">
    <!-- Online Users Sidebar -->
    <div class="w-80 border-r border-gray-200 bg-gray-50 flex flex-col">
      <div class="p-4 border-b border-gray-200 bg-white">
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
          :key="user" 
          @click="setReceiver(user)" 
          :class="[
            'cursor-pointer p-3 rounded-lg mb-2 transition-all duration-200 flex items-center',
            user === receiverId 
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105' 
              : 'bg-white hover:bg-gray-100 text-gray-800 hover:shadow-md'
          ]"
        >
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold mr-3">
            {{ user.charAt(0).toUpperCase() }}
          </div>
          <div class="flex-1">
            <div class="font-semibold">{{ user }}</div>
            <div v-if="user === receiverId" class="text-xs opacity-90">✓ Selected</div>
          </div>
          <div class="w-2 h-2 bg-green-400 rounded-full"></div>
        </div>
      </div>
    </div>

    <!-- Chat Area -->
    <div class="flex-1 flex flex-col">
      <!-- Chat Header -->
      <div v-if="receiverId" class="p-4 border-b border-gray-200 bg-white flex items-center">
        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold mr-3">
          {{ receiverId.charAt(0).toUpperCase() }}
        </div>
        <div>
          <div class="font-semibold text-gray-800">{{ receiverId }}</div>
          <div class="text-xs text-green-500">● Online</div>
        </div>
      </div>
      <div v-else class="p-4 border-b border-gray-200 bg-white">
        <div class="text-gray-500 text-center">Select a user to start chatting</div>
      </div>

      <!-- Messages Area -->
      <div class="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-gray-50 to-gray-100" ref="messagesContainer">
        <div v-if="filteredMessages.length === 0" class="flex items-center justify-center h-full">
          <div class="text-center text-gray-400">
            <div class="text-6xl mb-4">💬</div>
            <p class="text-lg">No messages yet</p>
            <p class="text-sm">Start the conversation!</p>
          </div>
        </div>
        <div v-else class="space-y-4">
          <div 
            v-for="(msg, i) in filteredMessages" 
            :key="i" 
            :class="['flex', msg.sender === userId ? 'justify-end' : 'justify-start']"
          >
            <div 
              :class="[
                'max-w-md px-4 py-3 rounded-2xl shadow-md',
                msg.sender === userId 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-none' 
                  : 'bg-white text-gray-800 rounded-bl-none'
              ]"
            >
              <div class="text-xs opacity-75 mb-1 font-semibold">
                {{ msg.sender }}
              </div>
              <div class="text-sm break-words">
                {{ msg.text }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Message Input -->
      <form class="p-4 bg-white border-t border-gray-200" @submit.prevent="sendMessage">
        <div class="flex items-center space-x-3">
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
        </div>
        <div v-if="!receiverId" class="text-xs text-red-500 mt-2 ml-4">
          Please select a user first
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
  import { ref, watch, nextTick, computed } from 'vue'
  import { useChat } from '../store/chat'

  const { messages, sendMessage: sendMsg, userId, onlineUsers, receiverId } = useChat()
  const input = ref('')
  const messagesContainer = ref(null)

  // Filter messages to show only the conversation with the selected user
  const filteredMessages = computed(() => {
    if (!receiverId.value) return []
    return messages.value.filter(msg => {
      // Show messages where:
      // 1. I sent to the receiver
      // 2. Receiver sent to me
      return (
        (msg.sender === userId.value && msg.receiver === receiverId.value) ||
        (msg.sender === receiverId.value && msg.receiver === userId.value)
      )
    })
  })

  function sendMessage() {
    if (!input.value.trim()) return
    sendMsg(input.value)
    input.value = ''
  }

  function setReceiver(user) {
    receiverId.value = user
  }

  watch(filteredMessages, () => {
    nextTick(() => {
      const el = messagesContainer.value
      if (el) el.scrollTop = el.scrollHeight
    })
  }, { deep: true })
</script>
