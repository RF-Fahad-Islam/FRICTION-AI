<script setup>
import Button from './ui/button/Button.vue'
</script>

<template>
  <header class="fixed top-0 left-0 right-0 z-50 transition-all duration-300 backdrop-blur-md bg-white/70 border-b border-gray-100 shadow-sm">
    <div class="container mx-auto px-6 h-20 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl">
          S
        </div>
        <span class="text-2xl font-bold font-serif tracking-tight text-gray-900">Study Friction AI</span>
      </div>
      <nav class="hidden md:flex items-center gap-8">
        <a href="#how-it-works" class="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">How it Works</a>
        <a href="#features" class="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Features</a>
        <Button size="sm" class="rounded-full bg-black text-white hover:bg-gray-800 px-6">Get Started</Button>
      </nav>
    </div>
  </header>
</template>
