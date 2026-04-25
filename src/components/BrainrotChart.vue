<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useActivityStore } from '../stores/activityStore.js'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const activityStore = useActivityStore()
const canvasRef = ref(null)
let chartInstance = null

const historyScores = ref([45, 62, 38, 71, 55, 30, 48])
const totalReels = ref(0)
const totalTime = ref(0)
const hourlyMetricsData = ref({})

function fetchHistory() {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get(['sf_history_scores', 'sf_reel_count', 'sf_reel_time', 'sf_hourly_metrics'], (data) => {
      if (data.sf_history_scores) {
        historyScores.value = data.sf_history_scores
      }
      totalReels.value = data.sf_reel_count || 0
      totalTime.value = data.sf_reel_time || 0
      hourlyMetricsData.value = data.sf_hourly_metrics || {}
      renderChart()
    })
  }
}

const focusScore = computed(() => {
  const today = historyScores.value[historyScores.value.length - 1] || 0
  return Math.max(0, 100 - today)
})

const brainrotScore = computed(() => {
  return historyScores.value[historyScores.value.length - 1] || 0
})

function renderChart() {
  if (!canvasRef.value) return
  if (chartInstance) chartInstance.destroy()

  const hourlyMetrics = hourlyMetricsData.value || {}
  const now = new Date()
  
  const labels = []
  const focusData = []
  const brainrotData = []
  
  for (let i = 23; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 3600 * 1000)
    const hour = d.getHours().toString().padStart(2, '0')
    const key = getHourlyKey(d)
    
    labels.push(`${hour}:00`)
    
    const metrics = hourlyMetrics[key] || { focusTime: 0, brainrotTime: 0 }
    const focusSeconds = metrics.focusTime || 0
    const brainrotSeconds = metrics.brainrotTime || 0
    
    focusData.push(Math.round(focusSeconds / 60))
    brainrotData.push(Math.round(brainrotSeconds / 60))
  }

  const ctx = canvasRef.value.getContext('2d')
  
  const focusGradient = ctx.createLinearGradient(0, 0, 0, 250)
  focusGradient.addColorStop(0, 'rgba(108, 92, 231, 0.4)')
  focusGradient.addColorStop(1, 'rgba(108, 92, 231, 0.02)')
  
  const brainrotGradient = ctx.createLinearGradient(0, 0, 0, 250)
  brainrotGradient.addColorStop(0, 'rgba(255, 107, 107, 0.3)')
  brainrotGradient.addColorStop(1, 'rgba(255, 107, 107, 0.02)')

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Focus Time',
          data: focusData,
          borderColor: '#6C5CE7',
          backgroundColor: focusGradient,
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: '#6C5CE7',
          pointBorderColor: '#0A0A1A',
          pointBorderWidth: 2,
          borderWidth: 2,
        },
        {
          label: 'Brainrot Time',
          data: brainrotData,
          borderColor: '#FF6B6B',
          backgroundColor: brainrotGradient,
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: '#FF6B6B',
          pointBorderColor: '#0A0A1A',
          pointBorderWidth: 2,
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
            pointStyle: 'circle',
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
          ticks: { color: '#6868A0', font: { size: 10 }, maxRotation: 0 },
        },
      },
    },
  })
}

function getHourlyKey(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hour = date.getHours().toString().padStart(2, '0');
  return `${year}-${month}-${day}-${hour}`;
}

onMounted(() => {
  fetchHistory()
  setInterval(fetchHistory, 3000)
})

watch(hourlyMetricsData, renderChart, { deep: true })
</script>

<template>
  <div class="glass-card p-6 relative overflow-hidden">
    <div class="absolute top-4 right-4 flex gap-4 z-10">
      <div class="text-center">
        <div class="text-[10px] text-text-muted uppercase tracking-wider">Focus</div>
        <div class="text-2xl font-bold text-primary-light">{{ focusScore }}%</div>
      </div>
      <div class="text-center">
        <div class="text-[10px] text-text-muted uppercase tracking-wider">Brainrot</div>
        <div class="text-2xl font-bold text-danger">{{ brainrotScore }}%</div>
      </div>
    </div>
    
    <h2 class="text-lg font-semibold text-text-primary mb-4">Hourly Focus vs Brainrot</h2>
    <div class="h-64">
      <canvas ref="canvasRef"></canvas>
    </div>
    
    <div class="flex justify-center gap-6 mt-2 text-xs text-text-muted">
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-primary"></span>
        <span>Focus Time (min)</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-danger"></span>
        <span>Brainrot Time (min)</span>
      </div>
    </div>
  </div>
</template>