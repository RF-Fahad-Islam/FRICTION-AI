<template>
  <div class="min-h-screen bg-surface-900 text-text-primary flex flex-col">
    <!-- Navigation -->
    <nav class="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-surface-800/50 backdrop-blur-md sticky top-0 z-50">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
          <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
        </div>
        <span class="text-xl font-bold tracking-tight">Study Friction</span>
      </div>
      <div class="flex items-center gap-6">
        <a href="#features" class="text-sm text-text-secondary hover:text-text-primary transition-colors">Features</a>
        <a href="#demo" class="text-sm text-text-secondary hover:text-text-primary transition-colors">Demo</a>
        <router-link to="/dashboard" class="px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition-all shadow-lg shadow-primary/25">
          Open Dashboard
        </router-link>
      </div>
    </nav>

    <!-- Hero Section -->
    <main class="flex-1 flex flex-col items-center justify-center text-center px-4 py-20">
      <div class="max-w-4xl mx-auto space-y-8 relative">
        <!-- Background glow -->
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 blur-[100px] rounded-full pointer-events-none"></div>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent/20 blur-[80px] rounded-full pointer-events-none"></div>

        <h1 class="text-5xl md:text-7xl font-extrabold tracking-tight relative z-10 leading-tight">
          Stop Doomscrolling.<br/>
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary">Build Deep Focus.</span>
        </h1>
        
        <p class="text-xl text-text-secondary max-w-2xl mx-auto relative z-10">
          An AI-powered Pomodoro OS that uses adaptive friction to reshape your attention, not just block websites.
        </p>

        <div class="flex items-center justify-center gap-4 pt-4 relative z-10">
          <router-link to="/dashboard" class="px-8 py-4 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold transition-all shadow-xl shadow-primary/25 text-lg flex items-center gap-2">
            Get Started
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
            </svg>
          </router-link>
          <a href="#demo" class="px-8 py-4 rounded-xl bg-surface-700 hover:bg-surface-600 border border-white/5 text-text-primary font-semibold transition-all text-lg">
            See how it works
          </a>
        </div>
      </div>

      <!-- Features Grid -->
      <div id="features" class="max-w-6xl mx-auto mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 px-4 w-full relative z-10">
        <!-- Feature 1 -->
        <div class="bg-surface-800 border border-white/5 rounded-2xl p-8 text-left hover:border-primary/30 transition-colors">
          <div class="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
            <svg class="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <h3 class="text-xl font-bold mb-3">Pomodoro OS</h3>
          <p class="text-text-secondary leading-relaxed">
            Integrated focus timers that actively track your behavior and score your sessions based on actual productivity.
          </p>
        </div>

        <!-- Feature 2 -->
        <div class="bg-surface-800 border border-white/5 rounded-2xl p-8 text-left hover:border-accent/30 transition-colors">
          <div class="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-6">
            <svg class="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <h3 class="text-xl font-bold mb-3">Adaptive Friction</h3>
          <p class="text-text-secondary leading-relaxed">
            Instead of hard blocks, we introduce scrolling resistance, cooldowns, and popups that adapt to your focus state.
          </p>
        </div>

        <!-- Feature 3 -->
        <div class="bg-surface-800 border border-white/5 rounded-2xl p-8 text-left hover:border-primary/30 transition-colors">
          <div class="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
            <svg class="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"/>
            </svg>
          </div>
          <h3 class="text-xl font-bold mb-3">AI Coaching</h3>
          <p class="text-text-secondary leading-relaxed">
            A built-in AI coach that learns your habits, classifies distractions, and personalizes your friction settings over time.
          </p>
        </div>
      </div>
      
      <!-- Demo Placeholder -->
      <div id="demo" class="max-w-5xl mx-auto mt-32 mb-20 w-full relative z-10">
        <div class="rounded-2xl border border-white/10 bg-surface-800/50 backdrop-blur aspect-video flex items-center justify-center overflow-hidden shadow-2xl">
          <div class="text-center p-8">
            <div class="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
               <svg class="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
               </svg>
            </div>
            <p class="text-text-secondary text-lg">Interactive Demo Flow</p>
            <p class="text-text-muted text-sm mt-2">1. Open Reels → 2. Friction triggers → 3. Coach adjusts settings</p>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="border-t border-white/5 py-8 text-center">
      <p class="text-text-muted text-sm">Study Friction AI MVP — Built for focus.</p>
    </footer>
  </div>
</template>
