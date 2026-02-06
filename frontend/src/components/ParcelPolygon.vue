<script setup lang="ts">
import { computed } from 'vue';
import type { Parcel, ParcelStatus } from '@/types';

const props = defineProps<{
  parcel: Parcel;
  isSelected: boolean;
}>();

const emit = defineEmits<{
  (e: 'select', id: string): void;
  (e: 'updateVertex', data: { parcelId: string; vertexIndex: number; point: [number, number] }): void;
}>();

const statusColors: Record<ParcelStatus, { fill: string; stroke: string }> = {
  AVAILABLE: { fill: 'rgba(34, 197, 94, 0.3)', stroke: '#22c55e' },
  SOLD: { fill: 'rgba(239, 68, 68, 0.3)', stroke: '#ef4444' },
  RESERVED: { fill: 'rgba(234, 179, 8, 0.3)', stroke: '#eab308' },
};

const pathData = computed(() => {
  if (props.parcel.geometry.length < 3) return '';
  
  const points = props.parcel.geometry
    .map((point: [number, number], i: number) => `${i === 0 ? 'M' : 'L'} ${point[0]} ${point[1]}`)
    .join(' ');
  
  return `${points} Z`;
});

const colors = computed(() => statusColors[props.parcel.status] || statusColors.AVAILABLE);


function handleClick(e: MouseEvent) {
  if (!props.isSelected) {
    e.stopPropagation();
    emit('select', props.parcel.id);
  }
}
</script>

<template>
  <g class="parcel-polygon cursor-pointer" @click="handleClick">
    <!-- Main polygon fill -->
    <path
      :d="pathData"
      :fill="colors.fill"
      :stroke="colors.stroke"
      :stroke-width="isSelected ? 0.008 : 0.004"
      class="transition-all duration-200"
      :class="{ 'opacity-100': isSelected, 'opacity-80 hover:opacity-100': !isSelected }"
    />

    <!-- Vertex points (shown when selected) -->
    <template v-if="isSelected">
      <circle
        v-for="(point, index) in parcel.geometry"
        :key="index"
        :cx="point[0]"
        :cy="point[1]"
        r="0.012"
        fill="white"
        :stroke="colors.stroke"
        stroke-width="0.003"
        class="cursor-move hover:r-[0.015]"
      />
    </template>

    <!-- Label at centroid -->
    <text
      v-if="parcel.label"
      :x="parcel.geometry.reduce((sum: number, p: [number, number]) => sum + p[0], 0) / parcel.geometry.length"
      :y="parcel.geometry.reduce((sum: number, p: [number, number]) => sum + p[1], 0) / parcel.geometry.length"
      text-anchor="middle"
      dominant-baseline="middle"
      fill="white"
      font-size="0.03"
      font-weight="600"
      class="pointer-events-none select-none"
      style="text-shadow: 0 0.002px 0.004px rgba(0,0,0,0.8)"
    >
      {{ parcel.label }}
    </text>
  </g>
</template>

<style scoped>
.parcel-polygon:hover path {
  filter: brightness(1.1);
}
</style>
