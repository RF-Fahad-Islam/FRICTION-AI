<script setup>
import { ref, onMounted, watch } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { GraphChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { getCategoryLabel, getCategoryColor, CATEGORIES } from '../../logic/categorizer.js'

use([CanvasRenderer, GraphChart, TitleComponent, TooltipComponent, LegendComponent])

const props = defineProps({
  visits: {
    type: Array,
    default: () => []
  }
})

const option = ref(null)

function processData() {
  const nodes = []
  const links = []
  const categories = {}

  // Root node
  nodes.push({
    id: 'root',
    name: 'You',
    symbolSize: 40,
    itemStyle: { color: '#6C5CE7' },
    category: 0
  })

  // Process categories and their domains
  props.visits.forEach(v => {
    const cat = v.category || CATEGORIES.UNKNOWN
    if (!categories[cat]) {
      categories[cat] = new Set()
      const color = getCategoryColor(cat)
      nodes.push({
        id: `cat_${cat}`,
        name: getCategoryLabel(cat),
        symbolSize: 30,
        itemStyle: { color: color },
        category: 1
      })
      links.push({
        source: 'root',
        target: `cat_${cat}`
      })
    }
    
    // Extract domain to avoid huge graphs
    let domain = v.url
    try {
      domain = new URL(v.url).hostname
    } catch(e) {}
    
    categories[cat].add(domain)
  })

  // Add domain nodes
  Object.keys(categories).forEach(cat => {
    Array.from(categories[cat]).forEach(domain => {
      // Create unique ID to avoid collisions
      const nodeId = `domain_${cat}_${domain}`
      nodes.push({
        id: nodeId,
        name: domain,
        symbolSize: 15,
        itemStyle: { color: '#A0A0C8' },
        category: 2
      })
      links.push({
        source: `cat_${cat}`,
        target: nodeId
      })
    })
  })

  option.value = {
    tooltip: {
      formatter: '{b}'
    },
    animationDurationUpdate: 1500,
    animationEasingUpdate: 'quinticInOut',
    series: [
      {
        type: 'graph',
        layout: 'force',
        force: {
          repulsion: 200,
          edgeLength: [50, 100],
          gravity: 0.1
        },
        roam: true,
        label: {
          show: true,
          position: 'right',
          formatter: '{b}',
          color: '#F0F0FF'
        },
        lineStyle: {
          color: 'source',
          curveness: 0.3
        },
        emphasis: {
          focus: 'adjacency',
          lineStyle: {
            width: 5
          }
        },
        data: nodes,
        links: links
      }
    ]
  }
}

watch(() => props.visits, processData, { deep: true })
onMounted(processData)
</script>

<template>
  <div class="glass-card p-6 h-full flex flex-col">
    <h2 class="text-lg font-semibold text-text-primary mb-4">Attention Mind Map</h2>
    <div class="flex-1 min-h-[400px]">
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
