<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'
import VChart from 'vue-echarts'

use([CanvasRenderer, BarChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent])

const option = ref(null)

const BYPASS_LABELS = {
  productive: 'Productive Task',
  quick_check: 'Quick Check',
  add_time: 'Add 10 mins',
  take_break: 'Take a Break'
}

function loadData() {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get(['sf_block_logs'], (data) => {
      const logs = data.sf_block_logs || []
      
      // Group by domain and reason
      const byDomain = {}
      const byReason = {}
      const byHour = {}
      
      logs.forEach(log => {
        // Count by domain
        byDomain[log.domain] = (byDomain[log.domain] || 0) + 1
        
        // Count by reason
        const reason = log.reason || 'unknown'
        byReason[reason] = (byReason[reason] || 0) + 1
        
        // Count by hour
        if (log.timestamp) {
          const hour = new Date(log.timestamp).getHours()
          const hourKey = `${hour}:00`
          byHour[hourKey] = (byHour[hourKey] || 0) + 1
        }
      })
      
      // Get top domains
      const domainData = Object.keys(byDomain)
        .map(d => ({ name: d, value: byDomain[d] }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8)
      
      // Get reason breakdown
      const reasonData = Object.keys(byReason).map(r => ({
        name: BYPASS_LABELS[r] || r,
        value: byReason[r]
      }))
      
      option.value = {
        tooltip: {
          trigger: 'axis',
          backgroundColor: '#1A1A3A',
          borderColor: 'rgba(108,92,231,0.3)',
          textStyle: { color: '#F0F0FF' }
        },
        legend: {
          data: ['Bypasses by Domain', 'Bypasses by Reason'],
          textStyle: { color: '#A0A0C8' },
          top: 0
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          top: '15%',
          containLabel: true
        },
        xAxis: [
          {
            type: 'category',
            data: domainData.map(d => d.name),
            axisLabel: { color: '#A0A0C8', rotate: 45 },
            axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
          }
        ],
        yAxis: [
          {
            type: 'value',
            axisLabel: { color: '#A0A0C8' },
            axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
            splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }
          }
        ],
        series: [
          {
            name: 'Bypasses by Domain',
            type: 'bar',
            data: domainData.map(d => d.value),
            itemStyle: {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: '#6C5CE7' },
                  { offset: 1, color: '#A29BFE' }
                ]
              },
              borderRadius: [4, 4, 0, 0]
            }
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
    <h2 class="text-lg font-semibold text-text-primary mb-4">Block Bypasses</h2>
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