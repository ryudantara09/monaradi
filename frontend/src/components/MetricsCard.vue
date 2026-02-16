<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  title: string;
  value: string | number;
  icon: object;
  trend?: number; // percentage
  status?: 'success' | 'warning' | 'critical' | 'info';
  progress?: number; // 0-100
}>();

// Helper to determine color classes based on status
const statusClass = computed(() => {
  switch (props.status) {
    case 'success': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    case 'warning': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/20';
    case 'info': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    default: return 'text-primary bg-primary/10 border-primary/20'; // Default uses primary
  }
});

const progressBgClass = computed(() => {
   switch (props.status) {
    case 'success': return 'bg-emerald-500';
    case 'warning': return 'bg-amber-500';
    case 'critical': return 'bg-red-500';
    case 'info': return 'bg-blue-500';
    default: return 'bg-primary'; 
  }
});

</script>

<template>
  <div class="relative bg-card border border-border rounded-2xl px-4 py-3 overflow-hidden transition-all duration-200 hover:border-primary/50 hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] group h-full flex flex-col justify-between">
    <div class="flex justify-between items-start mb-2">
      <div>
        <p class="text-sm font-medium text-muted-foreground uppercase tracking-wide">{{ title }}</p>
        <h4 class="text text-foreground mt-1 tracking-tight">{{ value }}</h4>
      </div>
      <div 
        class="h-8 w-8 rounded-lg flex items-center justify-center transition-colors border"
        :class="[statusClass]"
      >
        <component :is="icon" class="h-3.5 w-3.5" />
      </div>
    </div>
    
    <div v-if="typeof progress === 'number'" class="w-full bg-muted/30 rounded-full h-1 mt-auto overflow-hidden">
      <div 
        class="h-full rounded-full transition-all duration-500 ease-out" 
        :class="progressBgClass" 
        :style="{ width: `${progress}%` }"
      ></div>
    </div>
    
    <div v-if="trend !== undefined" class="mt-2 flex items-center gap-2 text-xs font-medium">
      <div 
        class="px-2 py-0.5 rounded-full flex items-center gap-1"
        :class="trend > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'"
      >
        <component :is="trend > 0 ? 'TrendingUp' : 'TrendingDown'" class="h-3 w-3" />
        <span>{{ Math.abs(trend) }}%</span>
      </div>
    </div>
  </div>
</template>
