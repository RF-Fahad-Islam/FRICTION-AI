<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { GraphChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { getCategoryLabel, getCategoryColor, CATEGORIES } from '../../logic/categorizer.js'
import * as storage from '../../storage/storageAdapter.js'
import { KEYS } from '../../storage/storageAdapter.js'

use([CanvasRenderer, GraphChart, TitleComponent, TooltipComponent, LegendComponent])

const props = defineProps({
  visits: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['reclassify'])

const option = ref(null)
const selectedNode = ref(null)
const showReclassifyModal = ref(false)
const reclassifyCategory = ref('')
const reclassifyDomain = ref('')

const categoryOptions = Object.values(CATEGORIES)

function processData() {
  const nodes = []
  const links = []
  const categories = {}
  const categoryCounts = {}
  const domainData = {}

  props.visits.forEach((v, idx) => {
    const cat = v.category || CATEGORIES.UNKNOWN
    if (!categories[cat]) {
      categories[cat] = new Set()
      categoryCounts[cat] = 0
      const color = getCategoryColor(cat)
      nodes.push({
        id: `cat_${cat}`,
        name: getCategoryLabel(cat),
        symbolSize: Math.max(25, Math.min(50, categoryCounts[cat] ? Math.sqrt(categoryCounts[cat]) * 8 : 25)),
        itemStyle: { 
          color: color,
          borderColor: '#fff',
          borderWidth: 2
        },
        category: 1,
        rawCategory: cat
      })
      links.push({
        source: 'root',
        target: `cat_${cat}`,
        lineStyle: { color: color, opacity: 0.5 }
      })
    }
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
    
    let domain = v.url
    try {
      domain = new URL(v.url).hostname
    } catch(e) {}
    
    if (!domainData[domain]) {
      domainData[domain] = { visits: [], categories: new Set(), count: 0 }
    }
    domainData[domain].visits.push(idx)
    domainData[domain].categories.add(cat)
    domainData[domain].count++
  })

  nodes.push({
    id: 'root',
    name: 'You',
    symbolSize: 50,
    itemStyle: { color: '#6C5CE7', borderColor: '#fff', borderWidth: 3 },
    category: 0
  })

  Object.keys(domainData).slice(0, 15).forEach(domain => {
    const data = domainData[domain]
    const dominantCat = [...data.categories][0]
    const color = getCategoryColor(dominantCat)
    const count = data.count
    
    nodes.push({
      id: `domain_${domain.replace(/\./g, '_')}`,
      name: domain.split('.')[0].slice(0, 12),
      fullDomain: domain,
      symbolSize: Math.max(12, Math.min(35, count * 4)),
      itemStyle: { 
        color: color,
        borderColor: color,
        borderWidth: 1,
        opacity: 0.8
      },
      category: 2,
      rawCategory: dominantCat,
      visitCount: count,
      visitIndices: data.visits,
      isDomain: true
    })
    links.push({
      source: `cat_${dominantCat}`,
      target: `domain_${domain.replace(/\./g, '_')}`,
      lineStyle: { color: color, opacity: 0.3, width: 1 }
    })
  })

  option.value = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(15, 15, 25, 0.95)',
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      textStyle: { color: '#fff', fontSize: 12 },
      formatter: (params) => {
        const data = params.data
        if (!data) return ''
        if (data.isDomain) {
          return `<div style="padding:4px">
            <div style="font-weight:bold;margin-bottom:4px">${data.fullDomain}</div>
            <div>Category: ${getCategoryLabel(data.rawCategory)}</div>
            <div>Visits: ${data.visitCount}</div>
            <div style="margin-top:6px;color:#6C5CE7">Click to reclassify</div>
          </div>`
        }
        if (data.category === 1) {
          return `<div style="padding:4px">
            <div style="font-weight:bold">${data.name}</div>
            <div>${categoryCounts[data.rawCategory] || 0} visits</div>
          </div>`
        }
        return data.name
      }
    },
    animationDurationUpdate: 1500,
    animationEasingUpdate: 'quinticInOut',
    series: [
      {
        type: 'graph',
        layout: 'force',
        force: {
          repulsion: 300,
          edgeLength: [80, 150],
          gravity: 0.2,
          layoutAnimation: true
        },
        roam: true,
        zoom: 1.2,
        draggable: true,
        symbolKeepAspect: true,
        selectedMode: 'single',
        select: {
          itemStyle: {
            borderColor: '#6C5CE7',
            borderWidth: 4,
            shadowBlur: 20,
            shadowColor: '#6C5CE7'
          }
        },
        label: {
          show: true,
          position: 'right',
          distance: 8,
          formatter: '{b}',
          color: '#E0E0F0',
          fontSize: 10,
          fontWeight: 500
        },
        lineStyle: {
          color: 'source',
          curveness: 0.25,
          width: 1.5
        },
        emphasis: {
          focus: 'adjacency',
          scale: true,
          label: { show: true },
          lineStyle: {
            width: 4,
            opacity: 0.8
          }
        },
        edgeSymbol: ['circle', 'arrow'],
        edgeSymbolSize: [4, 8],
        data: nodes,
        links: links
      }
    ]
  }
}

function handleChartClick(params) {
  if (!params.data) return
  const node = params.data
  
  if (node.isDomain) {
    selectedNode.value = node
    reclassifyDomain.value = node.fullDomain
    reclassifyCategory.value = node.rawCategory
    showReclassifyModal.value = true
  }
}

async function applyReclassify() {
  if (!reclassifyDomain.value || !reclassifyCategory.value) return
  
  const visits = storage.get(KEYS.VISITS, [])
  let updated = false
  
  visits.forEach((v, idx) => {
    if (!v || !v.url) return
    try {
      const domain = new URL(v.url).hostname
      if (domain === reclassifyDomain.value || domain.endsWith('.' + reclassifyDomain.value)) {
        visits[idx] = { ...v, category: reclassifyCategory.value, source: 'manual', confidence: 1.0 }
        updated = true
      }
    } catch(e) {}
  })
  
  if (updated) {
    storage.set(KEYS.VISITS, visits)
    emit('reclassify', { domain: reclassifyDomain.value, category: reclassifyCategory.value })
  }
  
  showReclassifyModal.value = false
  selectedNode.value = null
}

watch(() => props.visits, processData, { deep: true })
onMounted(processData)
</script>

<template>
  <div class="glass-card p-6 h-full flex flex-col relative">
    <h2 class="text-lg font-semibold text-text-primary mb-2">Interactive Mind Map</h2>
    <p class="text-xs text-text-muted mb-4">Click a domain node to reclassify • Drag to rearrange • Scroll to zoom</p>
    <div class="flex-1 min-h-[400px]">
      <v-chart class="chart" :option="option" autoresize @click="handleChartClick" />
    </div>
    
    <!-- Reclassify Modal -->
    <div v-if="showReclassifyModal" class="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div class="bg-surface-800 border border-white/10 rounded-xl p-6 w-72 shadow-2xl">
        <h3 class="font-semibold text-text-primary mb-4">Reclassify Domain</h3>
        <p class="text-sm text-text-muted mb-2">{{ reclassifyDomain }}</p>
        
        <div class="space-y-2 mb-4">
          <button 
            v-for="cat in categoryOptions" 
            :key="cat"
            @click="reclassifyCategory = cat"
            class="w-full p-2 rounded-lg text-left text-sm transition-all flex items-center gap-2"
            :class="reclassifyCategory === cat 
              ? 'bg-primary/30 border-primary text-primary-light' 
              : 'bg-white/5 border-white/10 text-text-secondary hover:bg-white/10'"
          >
            <span class="w-3 h-3 rounded-full" :style="{ backgroundColor: getCategoryColor(cat) }"></span>
            {{ getCategoryLabel(cat) }}
          </button>
        </div>
        
        <div class="flex gap-2">
          <button 
            @click="showReclassifyModal = false"
            class="flex-1 px-3 py-2 rounded-lg text-sm bg-white/5 hover:bg-white/10 text-text-secondary"
          >
            Cancel
          </button>
          <button 
            @click="applyReclassify"
            class="flex-1 px-3 py-2 rounded-lg text-sm bg-primary hover:bg-primary-dark text-white"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chart {
  width: 100%;
  height: 100%;
}
</style>