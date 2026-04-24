<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'

use([CanvasRenderer, PieChart, TitleComponent, TooltipComponent, LegendComponent])

const option = ref(null)

const REASON_LABELS = {
  procrastinating: 'Procrastinating',
  mood_off: 'Mood is Off',
  boredom: 'Just Boredom',
  break: 'Planned Break',
  learning: 'Actually Learning'
}

function loadData() {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get(['sf_scroll_reasons'], (data) => {
      const reasonsList = data.sf_scroll_reasons || []
      const counts = {}
      
      reasonsList.forEach(r => {
        counts[r.reason] = (counts[r.reason] || 0) + 1
      })
      
      const chartData = Object.keys(counts).map(key => ({
        name: REASON_LABELS[key] || key,
        value: counts[key]
      }))
      
      if (chartData.length === 0) {
        chartData.push({ name: 'No data yet', value: 1 })
      }

      option.value = {
        tooltip: {
          trigger: 'item',
          backgroundColor: '#1A1A3A',
          borderColor: 'rgba(108,92,231,0.3)',
          textStyle: { color: '#F0F0FF' }
        },
        legend: {
          top: 'bottom',
          textStyle: { color: '#A0A0C8' }
        },
        series: [
          {
            name: 'Scrolling Reason',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#0A0A1A',
              borderWidth: 2
            },
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 20,
                fontWeight: 'bold',
                color: '#fff'
              }
            },
            labelLine: {
              show: false
            },
            data: chartData
          }
        ]
      }
    })
  }
}

let interval
onMounted(() => {
  loadData()
  interval = setInterval(loadData, 5000)
})

onUnmounted(() => {
  clearInterval(interval)
})
</script>

<template>
  <div class="glass-card p-6 h-full flex flex-col">
    <h2 class="text-lg font-semibold text-text-primary mb-4">Why You Scroll</h2>
    <div class="flex-1 min-h-[300px]">
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
