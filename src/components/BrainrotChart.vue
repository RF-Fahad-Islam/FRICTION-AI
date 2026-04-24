<script setup>
import { ref, onMounted, watch } from 'vue'
import { useProfileStore } from '../stores/profileStore.js'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const profileStore = useProfileStore()
const canvasRef = ref(null)
let chartInstance = null

function renderChart() {
  if (!canvasRef.value) return
  if (chartInstance) chartInstance.destroy()

  const scores = profileStore.profile?.history?.lastWeekScores || []
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].slice(0, Math.max(scores.length, 7))
  const data = scores.length > 0 ? scores : [45, 62, 38, 71, 55, 30, 48] // demo data if empty

  const ctx = canvasRef.value.getContext('2d')
  const gradient = ctx.createLinearGradient(0, 0, 0, 300)
  gradient.addColorStop(0, 'rgba(108, 92, 231, 0.3)')
  gradient.addColorStop(1, 'rgba(108, 92, 231, 0.01)')

  const focusData = data.map(d => Math.max(0, 100 - d))

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Focus Score',
          data: focusData,
          borderColor: '#6C5CE7',
          backgroundColor: gradient,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#6C5CE7',
          pointBorderColor: '#0A0A1A',
          pointBorderWidth: 2,
        },
        {
          label: 'Brainrot Score',
          data,
          borderColor: '#FF6B6B',
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#FF6B6B',
          pointBorderColor: '#0A0A1A',
          pointBorderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          min: 0, max: 100,
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: { color: '#6868A0', font: { size: 11 } },
        },
        x: {
          grid: { display: false },
          ticks: { color: '#6868A0', font: { size: 11 } },
        },
      },
      plugins: {
        legend: {
          labels: { color: '#A0A0C8', font: { size: 12 }, usePointStyle: true, pointStyle: 'circle' },
        },
        tooltip: {
          backgroundColor: '#1A1A3A',
          titleColor: '#F0F0FF',
          bodyColor: '#A0A0C8',
          borderColor: 'rgba(108,92,231,0.3)',
          borderWidth: 1,
          cornerRadius: 8,
          padding: 10,
        },
      },
    },
  })
}

onMounted(renderChart)
watch(() => profileStore.profile?.history?.lastWeekScores, renderChart, { deep: true })
</script>

<template>
  <div class="glass-card p-6">
    <h2 class="text-lg font-semibold text-text-primary mb-4">Focus vs Brainrot</h2>
    <div class="h-64">
      <canvas ref="canvasRef"></canvas>
    </div>
  </div>
</template>
