<template>
  <div class="max-w-4xl w-full bg-white rounded-2xl shadow-2xl p-10">
    <div class="text-center mb-8">
      <h2 class="text-4xl font-bold text-gray-800 mb-2">🚀 Join Us</h2>
      <p class="text-gray-500">Create your account to start chatting</p>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
      <p class="text-red-600 text-sm">{{ error }}</p>
    </div>

    <!-- Register Form -->
    <form @submit.prevent="handleRegister" class="space-y-6">
      <!-- Row 1: Name and Email -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
            Full Name
          </label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            required
            class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-all"
            placeholder="Enter your full name"
          />
        </div>

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
      </div>

      <!-- Row 2: Password and Confirm Password -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            required
            minlength="6"
            class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-all"
            placeholder="Min 6 characters"
          />
        </div>

        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            v-model="form.confirmPassword"
            type="password"
            required
            class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-all"
            placeholder="Confirm password"
          />
        </div>
      </div>

      <!-- Password validation messages -->
      <div v-if="form.password && form.confirmPassword && form.password !== form.confirmPassword" 
           class="text-red-500 text-sm">
        Passwords do not match
      </div>

      <button
        type="submit"
        :disabled="loading || !isFormValid"
        :class="[
          'w-full py-3 rounded-lg font-semibold transition-all transform shadow-lg',
          loading || !isFormValid
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-green-500 to-blue-600 text-white hover:from-green-600 hover:to-blue-700 hover:scale-105'
        ]"
      >
        <span v-if="loading" class="flex items-center justify-center">
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Creating account...
        </span>
        <span v-else>Create Account</span>
      </button>
    </form>

    <!-- Switch to Login -->
    <div class="mt-8 text-center">
      <p class="text-gray-600">
        Already have an account?
        <button
          @click="$emit('switch-to-login')"
          class="text-blue-600 hover:text-blue-700 font-semibold ml-1"
        >
          Sign in here
        </button>
      </p>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed, watch } from 'vue'
  import { useAuth } from '../store/auth'

  // Emits
  const emit = defineEmits(['register-success', 'switch-to-login'])

  // Auth composable
  const { register, loading, error, clearError } = useAuth()

  // Form data
  const form = ref({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  // Form validation
  const isFormValid = computed(() => {
    return form.value.name &&
          form.value.email &&
          form.value.password &&
          form.value.confirmPassword &&
          form.value.password === form.value.confirmPassword &&
          form.value.password.length >= 6
  })

  // Clear error when form changes
  watch(form, () => {
    if (error.value) {
      clearError()
    }
  }, { deep: true })

  // Handle registration
  async function handleRegister() {
    if (form.value.password !== form.value.confirmPassword) {
      return
    }

    const result = await register(
      form.value.email,
      form.value.password,
      form.value.name
    )
    
    if (result.success) {
      emit('register-success')
      // Reset form
      form.value = {
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
      }
    }
  }
</script>
