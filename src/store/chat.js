import { ref } from 'vue'

const socket = ref(null)
const messages = ref([])
const onlineUsers = ref([])
const userId = ref('')       // logged-in user
const receiverId = ref('')   // selected chat partner

export function useChat() {

  async function fetchOnlineUsers() {
    try {
      const res = await fetch('http://localhost:8080/api/online_users')
      const data = await res.json()
      onlineUsers.value = data  // ✅ assigning to ref triggers reactivity
    } catch (err) {
      console.error('Failed to fetch online users', err)
    }
  }

  function startOnlineUsersPolling() {
    // poll every 3 seconds
    setInterval(fetchOnlineUsers, 3000)
  }

  function connect(id) {
    if (socket.value) return
    userId.value = id

    socket.value = new WebSocket(`ws://localhost:8080/ws?user_id=${id}`)

    socket.value.onopen = () => {
      console.log('✅ WebSocket connected')
      // Start polling for online users after connection
      startOnlineUsersPolling()
    }

    socket.value.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        messages.value.push({ 
          sender: msg.sender_id, 
          receiver: msg.receiver_id,
          text: msg.content 
        })
      } catch {
        messages.value.push({ sender: 'server', receiver: userId.value, text: event.data })
      }
    }

    socket.value.onclose = () => {
      console.log('⚠️ WebSocket closed, reconnecting...')
      socket.value = null
      setTimeout(() => connect(id), 2000)
    }

    socket.value.onerror = (err) => console.error('❌ WebSocket error:', err)
  }

  function sendMessage(content) {
    if (!receiverId.value) return alert('Select a user to send message')
    if (!socket.value || socket.value.readyState !== WebSocket.OPEN) return

    const msg = {
      sender_id: userId.value,
      receiver_id: receiverId.value,
      content,
    }

    socket.value.send(JSON.stringify(msg))
    messages.value.push({ 
      sender: userId.value, 
      receiver: receiverId.value, 
      text: content 
    })
  }

  return {
    userId,
    receiverId,
    messages,
    onlineUsers,
    fetchOnlineUsers,
    connect,
    sendMessage
  }
}