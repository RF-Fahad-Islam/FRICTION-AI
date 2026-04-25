<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useActivityStore } from '../stores/activityStore.js'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const activityStore = useActivityStore()
const canvasRef = ref(null)
let chartInstance = null

const sessionsData = computed(() => {
  return activityStore.sessions || []
})

function renderChart() {
  if (!canvasRef.value) return
  if (chartInstance) chartInstance.destroy()

  const sessions = sessionsData.value
  if (!sessions || sessions.length === 0) return

  // Group sessions by hour for the last 24 hours
  const now = new Date()
  const hourlyData = {}
  const hourlyBrainrot = {}
  
  for (let i = 23; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 3600 * 1000)
    const hourKey = `${d.getHours()}:00`
    hourlyData[hourKey] = 0
    hourlyBrainrot[hourKey] = 0
  }

  sessions.forEach(s => {
    const d = new Date(s.startTime)
    const hourKey = `${d.getHours()}:00`
    if (hourlyData[hourKey] !== undefined) {
      if (s.isBrainrot) {
        hourlyBrainrot[hourKey] += s.duration || 0
      } else {
        hourlyData[hourKey] += s.duration || 0
      }
    }
  })

  const labels = Object.keys(hourlyData)
  const focusMinutes = Object.values(hourlyData).map(s => Math.round(s / 60))
  const brainrotMinutes = Object.values(hourlyBrainrot).map(s => Math.round(s / 60))

  const ctx = canvasRef.value.getContext('2d')
  
  const focusGradient = ctx.createLinearGradient(0, 0, 0, 300)
  focusGradient.addColorStop(0, 'rgba(108, 92, 231, 0.5)')
  focusGradient.addColorStop(1, 'rgba(108, 92, 231, 0.05)')
  
  const brainrotGradient = ctx.createLinearGradient(0, 0, 0, 300)
  brainrotGradient.addColorStop(0, 'rgba(255, 107, 107, 0.5)')
  brainrotGradient.addColorStop(1, 'rgba(255, 107, 107, 0.05)')

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Focus Time',
          data: focusMinutes,
          borderColor: '#6C5CE7',
          backgroundColor: focusGradient,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#6C5CE7',
          borderWidth: 2,
        },
        {
          label: 'Brainrot Time',
          data: brainrotMinutes,
          borderColor: '#FF6B6B',
          backgroundColor: brainrotGradient,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#FF6B6B',
          borderWidth: 2,
          borderDash: [5, 5],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'top',
          labels: { 
            color: '#A0A0C8', 
            font: { size: 12, weight: '600' }, 
            usePointStyle: true, 
            padding: 20,
          },
        },
        tooltip: {
          backgroundColor: '#12122A',
          titleColor: '#F0F0FF',
          bodyColor: '#A0A0C8',
          borderColor: 'rgba(108,92,231,0.3)',
          borderWidth: 1,
          cornerRadius: 12,
          padding: 12,
          displayColors: true,
          callbacks: {
            label: function(context) {
              return context.dataset.label + ': ' + context.parsed.y + ' min'
            }
          }
        },
      },
      scales: {
        y: {
          min: 0, 
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: { 
            color: '#6868A0', 
            font: { size: 11 },
            callback: function(value) {
              return value + 'm'
            }
          },
        },
        x: {
          grid: { display: false },
          ticks: { color: '#6868A0', font: { size: 10 } },
        },
      },
    },
  })
}

onMounted(() => {
  activityStore.fetchStats()
  renderChart()
})

watch(sessionsData, renderChart, { deep: true })
</script>

<template>
  <div class="glass-card p-6 h-full flex flex-col">
    <h2 class="text-lg font-semibold text-text-primary mb-2">Sessions Timeline</h2>
    <p class="text-xs text-text-muted mb-4">Hourly focus vs brainrot from session data</p>
    <div class="flex-1 min-h-[280px]">
      <canvas ref="canvasRef"></canvas>
    </div>
  </div>
</template>