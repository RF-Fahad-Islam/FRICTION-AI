<script setup>
import { BarChart3, PieChart, TrendingUp } from 'lucide-vue-next'
</script>

<template>
  <div class="w-64 h-80 rounded-2xl border-[6px] border-gray-900 bg-white shadow-2xl flex flex-col p-4 font-sans overflow-hidden">
    <div class="flex items-center justify-between mb-4">
      <h4 class="text-[10px] font-bold text-gray-900 uppercase tracking-wider">Focus Vitals</h4>
      <TrendingUp class="w-3 h-3 text-green-500" />
    </div>

    <!-- Score Card -->
    <div class="bg-blue-50 rounded-xl p-3 mb-4 flex items-center justify-between">
      <div>
        <div class="text-[8px] text-blue-600 font-medium">Focus Score</div>
        <div class="text-xl font-bold text-blue-900">84</div>
      </div>
      <div class="w-10 h-10 rounded-full border-4 border-blue-200 border-t-blue-600 flex items-center justify-center">
        <span class="text-[8px] font-bold">84%</span>
      </div>
    </div>

    <!-- Mini Chart -->
    <div class="flex-1 flex flex-col gap-2">
      <div class="text-[8px] font-bold text-gray-400">BRAINROT INTENSITY</div>
      <div class="flex-1 flex items-end gap-1 px-1">
        <div v-for="h in [20, 40, 30, 80, 60, 40, 20, 10]" :key="h"
             class="flex-1 bg-purple-200 rounded-t-sm hover:bg-purple-500 transition-colors"
             :style="{ height: h + '%' }"></div>
      </div>
    </div>

    <!-- Categories -->
    <div class="mt-4 flex flex-col gap-2">
      <div class="flex justify-between items-center text-[8px]">
        <div class="flex items-center gap-1">
          <div class="w-2 h-2 rounded-full bg-green-500"></div>
          <span class="text-gray-600">Productivity</span>
        </div>
        <span class="font-bold">65%</span>
      </div>
      <div class="flex justify-between items-center text-[8px]">
        <div class="flex items-center gap-1">
          <div class="w-2 h-2 rounded-full bg-red-500"></div>
          <span class="text-gray-600">Brainrot</span>
        </div>
        <span class="font-bold">25%</span>
      </div>
    </div>
  </div>
</template>
