import { ref } from 'vue'
import { useAuth } from './auth'

const socket = ref(null)
const messages = ref([])
const onlineUsers = ref([])
const userId = ref('')       // logged-in user
const receiverId = ref('')   // selected chat partner
const connected = ref(false)
const pollingInterval = ref(null)

// Go messaging service URL
const WS_URL = 'ws://localhost:8080/ws'
const API_BASE_URL = 'http://localhost:8080/api'

export function useChat() {
  const { accessToken, authenticatedFetch } = useAuth()

  async function fetchOnlineUsers() {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/online_users`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch online users')
      }
      
      const data = await response.json()
      
      // Debug logging
      console.log('Current userId:', userId.value, typeof userId.value)
      console.log('Online users from API:', data)
      
      // Filter out the current logged-in user from the list
      // Convert both to strings for comparison to handle type differences
      onlineUsers.value = (data || []).filter(user => {
        const isCurrentUser = user.id.toString() === userId.value.toString()
        console.log(`User ${user.id} (${typeof user.id}) === ${userId.value} (${typeof userId.value})? ${isCurrentUser}`)
        return !isCurrentUser
      })
    } catch (err) {
      console.error('Failed to fetch online users:', err)
      onlineUsers.value = []
    }
  }

  async function fetchMessages(withUserId) {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/messages?with=${withUserId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages')
      }
      
      const data = await response.json()
      
      // Convert API response to our message format
      const formattedMessages = (data || []).map(msg => ({
        sender: msg.sender_id,
        receiver: msg.receiver_id,
        text: msg.content,
        timestamp: msg.created_at,
        id: msg.id
      }))
      
      // Replace messages for this conversation
      messages.value = messages.value.filter(msg => 
        !((msg.sender === userId.value && msg.receiver === withUserId) ||
          (msg.sender === withUserId && msg.receiver === userId.value))
      )
      
      messages.value.push(...formattedMessages)
      
    } catch (err) {
      console.error('Failed to fetch messages:', err)
    }
  }

  function startOnlineUsersPolling() {
    // Clear existing interval
    if (pollingInterval.value) {
      clearInterval(pollingInterval.value)
    }
    
    // Poll every 5 seconds
    pollingInterval.value = setInterval(fetchOnlineUsers, 5000)
    
    // Fetch immediately
    fetchOnlineUsers()
  }

  function stopOnlineUsersPolling() {
    if (pollingInterval.value) {
      clearInterval(pollingInterval.value)
      pollingInterval.value = null
    }
  }

  async function connect(id) {
    if (socket.value || !accessToken.value) return
    
    userId.value = id.toString()

    try {
      // Connect to WebSocket with JWT token
      socket.value = new WebSocket(`${WS_URL}?token=${accessToken.value}`)

      socket.value.onopen = () => {
        console.log('✅ WebSocket connected with JWT authentication')
        connected.value = true
        startOnlineUsersPolling()
      }

      socket.value.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          // Handle different message types
          if (data.type === 'delivery') {
            // Message delivery confirmation
            console.log('Message delivered:', data)
            return
          }
          
          // Regular message
          const msg = {
            sender: data.sender_id,
            receiver: data.receiver_id,
            text: data.content,
            timestamp: data.created_at || new Date().toISOString(),
            id: data.id
          }
          
          // Check if this message already exists (to prevent duplicates from local optimistic updates)
          const existingMessage = messages.value.find(m => 
            m.sender === msg.sender && 
            m.receiver === msg.receiver && 
            m.text === msg.text &&
            (m.id === msg.id || (m.id && m.id.toString().startsWith('temp-')))
          )
          
          if (!existingMessage) {
            messages.value.push(msg)
          } else if (existingMessage.id && existingMessage.id.toString().startsWith('temp-')) {
            // Replace temporary message with the real one from server
            const index = messages.value.indexOf(existingMessage)
            if (index !== -1) {
              messages.value[index] = msg
            }
          }
          
        } catch (err) {
          console.error('Error parsing WebSocket message:', err)
          // Fallback for plain text messages
          messages.value.push({ 
            sender: 'system', 
            receiver: userId.value, 
            text: event.data,
            timestamp: new Date().toISOString()
          })
        }
      }

      socket.value.onclose = (event) => {
        console.log('⚠️ WebSocket closed:', event.code, event.reason)
        connected.value = false
        socket.value = null
        stopOnlineUsersPolling()
        
        // Reconnect if not a normal closure and we still have a token
        if (event.code !== 1000 && accessToken.value) {
          console.log('Attempting to reconnect in 3 seconds...')
          setTimeout(() => connect(id), 3000)
        }
      }

      socket.value.onerror = (err) => {
        console.error('❌ WebSocket error:', err)
        connected.value = false
      }

    } catch (err) {
      console.error('Failed to connect to WebSocket:', err)
      connected.value = false
    }
  }

  async function disconnect() {
    stopOnlineUsersPolling()
    
    if (socket.value) {
      socket.value.close(1000, 'User logout') // Normal closure
      socket.value = null
    }
    
    connected.value = false
    messages.value = []
    onlineUsers.value = []
    userId.value = ''
    receiverId.value = ''
  }

  function sendMessage(content) {
    if (!receiverId.value) {
      alert('Select a user to send message')
      return
    }
    
    if (!socket.value || socket.value.readyState !== WebSocket.OPEN) {
      alert('Not connected to chat server')
      return
    }

    const msg = {
      sender_id: userId.value.toString(),
      receiver_id: receiverId.value.toString(),
      content: content.trim(),
    }

    try {
      socket.value.send(JSON.stringify(msg))
      
      // Add message to local state immediately for better UX
      messages.value.push({ 
        sender: userId.value, 
        receiver: receiverId.value, 
        text: content.trim(),
        timestamp: new Date().toISOString(),
        id: 'temp-' + Date.now() // Temporary ID
      })
      
    } catch (err) {
      console.error('Failed to send message:', err)
      alert('Failed to send message')
    }
  }

  // Send message via REST API (alternative to WebSocket)
  async function sendMessageViaAPI(content) {
    if (!receiverId.value) {
      alert('Select a user to send message')
      return
    }

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/send_message`, {
        method: 'POST',
        body: JSON.stringify({
          receiver_id: receiverId.value.toString(),
          content: content.trim()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()
      console.log('Message sent via API:', data)
      
    } catch (err) {
      console.error('Failed to send message via API:', err)
      alert('Failed to send message')
    }
  }

  // Load message history when selecting a user
  async function selectUser(userId) {
    receiverId.value = userId.toString()
    await fetchMessages(userId.toString())
  }

  return {
    // State
    userId,
    receiverId,
    messages,
    onlineUsers,
    connected,
    
    // Methods
    connect,
    disconnect,
    sendMessage,
    sendMessageViaAPI,
    fetchOnlineUsers,
    fetchMessages,
    selectUser
  }
}