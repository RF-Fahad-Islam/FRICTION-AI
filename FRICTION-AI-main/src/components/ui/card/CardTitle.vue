<script setup>
import { cn } from '@/lib/utils'
const props = defineProps({ class: String })
</script>
<template>
  <h3 :class="cn('text-2xl font-semibold leading-none tracking-tight font-serif', props.class)">
    <slot />
  </h3>
</template>
