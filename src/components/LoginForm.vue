<template>
  <div class="max-w-4xl w-full bg-white rounded-2xl shadow-2xl p-10">
    <div class="text-center mb-8">
      <h2 class="text-4xl font-bold text-gray-800 mb-2">💬 Welcome Back</h2>
      <p class="text-gray-500">Sign in to your account</p>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
      <p class="text-red-600 text-sm">{{ error }}</p>
    </div>

    <!-- Login Form -->
    <form @submit.prevent="handleLogin" class="space-y-6">
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
          Email Address
        </label>
        <input
          id="email"
          v-model="form.email"
          type="email"
          required
          class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-all"
          placeholder="Enter your email"
        />
      </div>

      <div>
        <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
          Password
        </label>
        <input
          id="password"
          v-model="form.password"
          type="password"
          required
          class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-all"
          placeholder="Enter your password"
        />
      </div>

      <button
        type="submit"
        :disabled="loading || !form.email || !form.password"
        :class="[
          'w-full py-3 rounded-lg font-semibold transition-all transform shadow-lg',
          loading || !form.email || !form.password
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 hover:scale-105'
        ]"
      >
        <span v-if="loading" class="flex items-center justify-center">
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Signing in...
        </span>
        <span v-else>Sign In</span>
      </button>
    </form>

    <!-- Switch to Register -->
    <div class="mt-8 text-center">
      <p class="text-gray-600">
        Don't have an account?
        <button
          @click="$emit('switch-to-register')"
          class="text-blue-600 hover:text-blue-700 font-semibold ml-1"
        >
          Sign up here
        </button>
      </p>
    </div>
  </div>
</template>

<script setup>
  import { ref, watch } from 'vue'
  import { useAuth } from '../store/auth'

  // Emits
  const emit = defineEmits(['login-success', 'switch-to-register'])

  // Auth composable
  const { login, loading, error, clearError } = useAuth()

  // Form data
  const form = ref({
    email: '',
    password: ''
  })

  // Clear error when form changes
  watch(form, () => {
    if (error.value) {
      clearError()
    }
  }, { deep: true })

  // Handle login
  async function handleLogin() {
    const result = await login(form.value.email, form.value.password)
    
    if (result.success) {
      emit('login-success')
      // Reset form
      form.value = {
        email: '',
        password: ''
      }
    }
  }
</script>
