<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useActivityStore } from '../stores/activityStore.js'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, TitleComponent } from 'echarts/components'
import VChart from 'vue-echarts'

use([CanvasRenderer, BarChart, GridComponent, TooltipComponent, TitleComponent])

const activityStore = useActivityStore()
const option = ref(null)

function updateChart() {
  const hourly = activityStore.hourlyReels || {}
  const now = new Date()
  
  // Last 24 hours
  const labels = []
  const data = []
  
  for (let i = 23; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 3600 * 1000)
    const year = d.getFullYear()
    const month = (d.getMonth() + 1).toString().padStart(2, '0')
    const day = d.getDate().toString().padStart(2, '0')
    const hour = d.getHours().toString().padStart(2, '0')
    const key = `${year}-${month}-${day}-${hour}`
    
    labels.push(`${hour}:00`)
    data.push(hourly[key] || 0)
  }

  option.value = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: '#1A1A3A',
      borderColor: 'rgba(108,92,231,0.3)',
      textStyle: { color: '#F0F0FF' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: labels,
      axisLabel: { color: '#6868A0', fontSize: 10, interval: 3 },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#6868A0' },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }
    },
    series: [{
      data: data,
      type: 'bar',
      itemStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: '#6C5CE7' },
            { offset: 1, color: '#00CEC9' }
          ]
        },
        borderRadius: [4, 4, 0, 0]
      },
      barWidth: '60%'
    }]
  }
}

watch(() => activityStore.hourlyReels, updateChart, { deep: true })

onMounted(() => {
  updateChart()
})
</script>

<template>
  <div class="glass-card p-6 h-full flex flex-col">
    <h2 class="text-lg font-semibold text-text-primary mb-2">Hourly Reel Addiction</h2>
    <p class="text-xs text-text-muted mb-4">Reel counts over the last 24 hours</p>
    <div class="flex-1 min-h-[250px]">
      <v-chart class="chart" :option="option" autoresize />
    </div>
  </div>
</template>

<style scoped>
.chart {
  width: 100%;
  height: 100%;
}
</style>
