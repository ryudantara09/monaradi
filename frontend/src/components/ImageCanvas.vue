<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useParcelsStore } from '@/stores/parcels';
import { useCalibrationStore } from '@/stores/calibration';
import { isPointInPolygon, findClosestVertex, calculateDistance, findClosestEdge } from '@/utils/geometry';
import ParcelPolygon from './ParcelPolygon.vue';
import type { Parcel } from '@/types';

const props = defineProps<{
  imageSrc: string;
  mode: 'view' | 'calibrate' | 'draw';
}>();

const emit = defineEmits<{
  (e: 'calibrationComplete', data: { startPoint: [number, number]; endPoint: [number, number] }): void;
  (e: 'polygonComplete', points: [number, number][]): void;
}>();

const parcelsStore = useParcelsStore();
const calibrationStore = useCalibrationStore();

const containerRef = ref<HTMLDivElement | null>(null);
const imageRef = ref<HTMLImageElement | null>(null);
const svgRef = ref<SVGSVGElement | null>(null);

const imageLoaded = ref(false);
const containerWidth = ref(0);
const containerHeight = ref(0);
let dimensionRetryCount = 0;
const MAX_DIMENSION_RETRIES = 10;

// Calibration state
const calibrationStart = ref<[number, number] | null>(null);
const calibrationEnd = ref<[number, number] | null>(null);

// Drawing state
const drawingPoints = ref<[number, number][]>([]);
const hoveredEdge = ref<{ index: number; point: [number, number] } | null>(null);

// Mouse tracking state
const currentMousePos = ref<[number, number] | null>(null);

// Dragging state for vertex editing
const isDragging = ref(false);
const justFinishedDragging = ref(false);
const draggingParcelId = ref<string | null>(null);
const draggingVertexIndex = ref<number | null>(null);

// Convert mouse event to normalized coordinates
function getMousePosition(e: MouseEvent): [number, number] | null {
  if (!svgRef.value) return null;
  
  const rect = svgRef.value.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width;
  const y = (e.clientY - rect.top) / rect.height;
  
  return [Math.max(0, Math.min(1, x)), Math.max(0, Math.min(1, y))];
}

// Check if point is near the first drawing point (for polygon closing)
function isNearFirstPoint(pos: [number, number]): boolean {
  if (drawingPoints.value.length < 3) return false;
  const firstPoint = drawingPoints.value[0]!;
  const distance = calculateDistance(pos, firstPoint);
  return distance < 0.03; // Threshold for closing
}

function handleMouseDown(e: MouseEvent) {
  const pos = getMousePosition(e);
  if (!pos) return;

  // Check if clicking on a vertex of the selected parcel to start dragging
  if (props.mode === 'view' && parcelsStore.selectedParcel) {
    const vertexIndex = findClosestVertex(pos, parcelsStore.selectedParcel.geometry, 0.025);
    if (vertexIndex !== null) {
      isDragging.value = true;
      draggingParcelId.value = parcelsStore.selectedParcel.id;
      draggingVertexIndex.value = vertexIndex;
      e.preventDefault();
      e.stopPropagation();
      return;
    }
  }
}

function handleMouseUp(e: MouseEvent) {
  if (isDragging.value) {
    isDragging.value = false;
    draggingParcelId.value = null;
    draggingVertexIndex.value = null;
    
    // Prevent immediate click processing (fixes dragging causing deselection)
    justFinishedDragging.value = true;
    setTimeout(() => {
      justFinishedDragging.value = false;
    }, 50);

    e.preventDefault();
    e.stopPropagation();
  }
}

function handleMouseMove(e: MouseEvent) {
  const pos = getMousePosition(e);
  if (!pos) return;
  
  currentMousePos.value = pos;

  // Handle vertex dragging
  if (isDragging.value && draggingParcelId.value !== null && draggingVertexIndex.value !== null) {
    const parcel = parcelsStore.parcels.find(p => p.id === draggingParcelId.value);
    if (parcel) {
      const newGeometry = [...parcel.geometry];
      newGeometry[draggingVertexIndex.value] = pos;
      parcelsStore.updateParcel(
        parcel.id, 
        { geometry: newGeometry }, 
        calibrationStore.scaleFactor,
        {
          width: calibrationStore.imageWidth,
          height: calibrationStore.imageHeight
        }
      );
    }
    e.preventDefault();
    e.stopPropagation();
    return;
  }

  // Handle edge detection for inserting points
  if (props.mode === 'view' && parcelsStore.selectedParcel && !isDragging.value) {
    const edge = findClosestEdge(pos, parcelsStore.selectedParcel.geometry, 0.015);
    if (edge) {
      hoveredEdge.value = { index: edge.index, point: edge.point };
    } else {
      hoveredEdge.value = null;
    }
  } else {
    hoveredEdge.value = null;
  }
}

function handleClick(e: MouseEvent) {
  // Don't process click if we just finished dragging
  if (isDragging.value || justFinishedDragging.value) return;

  const pos = getMousePosition(e);
  if (!pos) return;

  if (props.mode === 'calibrate') {
    if (!calibrationStart.value) {
      calibrationStart.value = pos;
    } else if (!calibrationEnd.value) {
      calibrationEnd.value = pos;
      emit('calibrationComplete', {
        startPoint: calibrationStart.value,
        endPoint: calibrationEnd.value,
      });
    }
  } else if (props.mode === 'draw') {
    // Check if clicking near first point to close polygon
    if (isNearFirstPoint(pos)) {
      emit('polygonComplete', [...drawingPoints.value]);
      drawingPoints.value = [];
    } else {
      drawingPoints.value.push(pos);
    }
  } else if (props.mode === 'view') {
    // Check if clicking on an edge to insert point
    if (hoveredEdge.value && parcelsStore.selectedParcel) {
      const newGeometry = [...parcelsStore.selectedParcel.geometry];
      // Insert after index (at index + 1)
      newGeometry.splice(hoveredEdge.value.index + 1, 0, hoveredEdge.value.point);
      
      parcelsStore.updateParcel(
        parcelsStore.selectedParcel.id,
        { geometry: newGeometry },
        calibrationStore.scaleFactor,
        { width: calibrationStore.imageWidth, height: calibrationStore.imageHeight }
      );
      
      // Clear hovered edge preventing immediate re-click issues
      hoveredEdge.value = null;
      return; 
    }

    // Check if clicked on a parcel
    let clickedParcel: Parcel | null = null;
    for (const parcel of parcelsStore.parcels) {
      if (isPointInPolygon(pos, parcel.geometry)) {
        clickedParcel = parcel;
        break;
      }
    }
    
    if (clickedParcel) {
      parcelsStore.selectParcel(clickedParcel.id);
    } else {
      parcelsStore.selectParcel(null);
    }
  }
}

function handleRightClick(e: MouseEvent) {
  if (props.mode === 'draw') {
    // Remove last point
    drawingPoints.value.pop();
  } else if (props.mode === 'view' && parcelsStore.selectedParcel) {
    const pos = getMousePosition(e);
    if (!pos) return;
    
    // Check if clicking on a vertex to remove it
    const vertexIndex = findClosestVertex(pos, parcelsStore.selectedParcel.geometry, 0.025);
    
    if (vertexIndex !== null && parcelsStore.selectedParcel.geometry.length > 3) {
      const newGeometry = [...parcelsStore.selectedParcel.geometry];
      newGeometry.splice(vertexIndex, 1);
      
      parcelsStore.updateParcel(
        parcelsStore.selectedParcel.id,
        { geometry: newGeometry },
        calibrationStore.scaleFactor,
        { width: calibrationStore.imageWidth, height: calibrationStore.imageHeight }
      );
    }
  }
}

function handleDoubleClick() {
  if (props.mode === 'draw' && drawingPoints.value.length >= 3) {
    emit('polygonComplete', [...drawingPoints.value]);
    drawingPoints.value = [];
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    if (props.mode === 'calibrate') {
      calibrationStart.value = null;
      calibrationEnd.value = null;
    } else if (props.mode === 'draw') {
      drawingPoints.value = [];
    }
  } else if (e.key === 'Enter' && props.mode === 'draw' && drawingPoints.value.length >= 3) {
    emit('polygonComplete', [...drawingPoints.value]);
    drawingPoints.value = [];
  }
}

function onImageLoad() {
  imageLoaded.value = true;
  if (imageRef.value) {
    calibrationStore.setImageDimensions(
      imageRef.value.naturalWidth,
      imageRef.value.naturalHeight
    );
  }
  updateDimensions();
}

const imgStyle = ref({
  top: '0px',
  left: '0px',
  width: '100%',
  height: '100%'
});

function updateDimensions() {
  if (!containerRef.value || !imageRef.value) {
    console.warn('[ImageCanvas] Refs not ready for dimension update');
    return;
  }

  const cw = containerRef.value.clientWidth;
  const ch = containerRef.value.clientHeight;
  const nw = imageRef.value.naturalWidth;
  const nh = imageRef.value.naturalHeight;
  
  // Log dimensions for debugging
  console.log('[ImageCanvas] Update dimensions:', { cw, ch, nw, nh });

  if (cw === 0 || ch === 0 || nw === 0 || nh === 0) {
    dimensionRetryCount++;
    if (dimensionRetryCount < MAX_DIMENSION_RETRIES) {
      console.warn('[ImageCanvas] Zero dimensions detected, retrying...', `(${dimensionRetryCount}/${MAX_DIMENSION_RETRIES})`);
      setTimeout(updateDimensions, 100);
    } else {
      console.error('[ImageCanvas] Max retries reached, dimensions still zero:', { cw, ch, nw, nh });
    }
    return;
  }

  // Reset retry count on success
  dimensionRetryCount = 0;
  
  containerWidth.value = cw;
  containerHeight.value = ch;
  
  // Calculate rendered image dimensions (simulating object-fit: contain)
  // Since we force w-full h-full on the img, object-fit scales it to fit the container
  const scale = Math.min(cw / nw, ch / nh);
  const rw = nw * scale;
  const rh = nh * scale;
  const top = (ch - rh) / 2;
  const left = (cw - rw) / 2;
  
  console.log('[ImageCanvas] Calculated style:', { scale, rw, rh, top, left });
  
  imgStyle.value = {
    top: `${top}px`,
    left: `${left}px`,
    width: `${rw}px`,
    height: `${rh}px`
  };
}

// Watch for mode changes to reset state
watch(() => props.mode, (newMode) => {
  if (newMode !== 'calibrate') {
    calibrationStart.value = null;
    calibrationEnd.value = null;
  }
  if (newMode !== 'draw') {
    drawingPoints.value = [];
  }
});

onMounted(() => {
  console.log('[ImageCanvas] Mounted');
  // Use ResizeObserver for more robust dimension tracking
  const resizeObserver = new ResizeObserver(() => {
    updateDimensions();
  });
  
  if (containerRef.value) {
    resizeObserver.observe(containerRef.value);
  }
  
  // Force update after a small delay to ensure rendering is complete
  setTimeout(updateDimensions, 50);
  setTimeout(updateDimensions, 500);
  
  window.addEventListener('keydown', handleKeydown);
  window.addEventListener('mouseup', handleMouseUp);
  
  // Cleanup
  onUnmounted(() => {
    resizeObserver.disconnect();
    window.removeEventListener('keydown', handleKeydown);
    window.removeEventListener('mouseup', handleMouseUp);
  });
});

// Live calibration line that follows cursor
const calibrationLinePath = computed(() => {
  if (!calibrationStart.value) return '';
  const end = calibrationEnd.value || currentMousePos.value || calibrationStart.value;
  return `M ${calibrationStart.value[0]} ${calibrationStart.value[1]} L ${end[0]} ${end[1]}`;
});

// Drawing path with line to cursor
const drawingPath = computed(() => {
  if (drawingPoints.value.length === 0) return '';
  return drawingPoints.value
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`)
    .join(' ');
});

// Line from last point to current cursor position
const previewLinePath = computed(() => {
  if (props.mode !== 'draw' || drawingPoints.value.length === 0 || !currentMousePos.value) return '';
  const lastPoint = drawingPoints.value[drawingPoints.value.length - 1]!;
  return `M ${lastPoint[0]} ${lastPoint[1]} L ${currentMousePos.value[0]} ${currentMousePos.value[1]}`;
});

// Check if near first point for closing indicator
const showCloseIndicator = computed(() => {
  if (props.mode !== 'draw' || drawingPoints.value.length < 3 || !currentMousePos.value) return false;
  return isNearFirstPoint(currentMousePos.value);
});
</script>

<template>
  <div
    ref="containerRef"
    class="relative w-full h-full bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center"
  >
    <!-- Land Image -->
    <img
      ref="imageRef"
      :src="imageSrc"
      alt="Land survey image"
      class="w-full h-full object-contain"
      @load="onImageLoad"
    />

    <!-- SVG Overlay -->
    <svg
      v-if="imageLoaded"
      ref="svgRef"
      class="absolute"
      :style="imgStyle"
      :class="{ 'cursor-crosshair': mode !== 'view', 'cursor-move': isDragging }"
      viewBox="0 0 1 1"
      preserveAspectRatio="none"
      @click="handleClick"
      @dblclick="handleDoubleClick"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @contextmenu.prevent="handleRightClick"
    >
      <!-- Existing parcels -->
      <ParcelPolygon
        v-for="parcel in parcelsStore.parcels"
        :key="parcel.id"
        :parcel="parcel"
        :is-selected="parcelsStore.selectedParcelId === parcel.id"
        class="transition-opacity"
        :class="{ 'pointer-events-none': mode === 'draw' }"
        @select="parcelsStore.selectParcel"
      />

      <!-- Edge insertion preview -->
      <circle
        v-if="hoveredEdge && mode === 'view'"
        :cx="hoveredEdge.point[0]"
        :cy="hoveredEdge.point[1]"
        r="0.012"
        fill="white"
        stroke="#3b82f6"
        stroke-width="0.003"
        class="cursor-pointer opacity-80 hover:opacity-100"
      />

      <!-- Calibration line with live preview -->
      <g v-if="mode === 'calibrate' && calibrationStart">
        <!-- Main calibration line -->
        <path
          :d="calibrationLinePath"
          fill="none"
          stroke="#3b82f6"
          stroke-width="0.006"
          :stroke-dasharray="calibrationEnd ? 'none' : '0.015 0.008'"
        />
        <!-- Glow effect for visibility -->
        <path
          :d="calibrationLinePath"
          fill="none"
          stroke="#60a5fa"
          stroke-width="0.015"
          opacity="0.3"
        />
        <!-- Start point -->
        <circle
          :cx="calibrationStart[0]"
          :cy="calibrationStart[1]"
          r="0.02"
          fill="#3b82f6"
          stroke="white"
          stroke-width="0.004"
        />
        <!-- End point / current cursor position -->
        <circle
          v-if="currentMousePos || calibrationEnd"
          :cx="(calibrationEnd || currentMousePos)![0]"
          :cy="(calibrationEnd || currentMousePos)![1]"
          r="0.02"
          :fill="calibrationEnd ? '#3b82f6' : '#60a5fa'"
          stroke="white"
          stroke-width="0.004"
          :opacity="calibrationEnd ? 1 : 0.7"
        />
      </g>

      <!-- Drawing preview -->
      <g v-if="mode === 'draw' && drawingPoints.length > 0">
        <!-- Filled polygon preview -->
        <path
          :d="drawingPath + (drawingPoints.length >= 3 ? ' Z' : '')"
          :fill="drawingPoints.length >= 3 ? 'rgba(59, 130, 246, 0.2)' : 'none'"
          stroke="#3b82f6"
          stroke-width="0.004"
        />
        <!-- Preview line to cursor -->
        <path
          v-if="previewLinePath"
          :d="previewLinePath"
          fill="none"
          stroke="#60a5fa"
          stroke-width="0.003"
          stroke-dasharray="0.01 0.005"
          opacity="0.7"
        />
        <!-- Line from cursor to first point when near closing -->
        <path
          v-if="showCloseIndicator && currentMousePos"
          :d="`M ${currentMousePos[0]} ${currentMousePos[1]} L ${drawingPoints[0]![0]} ${drawingPoints[0]![1]}`"
          fill="none"
          stroke="#22c55e"
          stroke-width="0.003"
          stroke-dasharray="0.01 0.005"
        />
        <!-- Vertex points -->
        <circle
          v-for="(point, index) in drawingPoints"
          :key="index"
          :cx="point[0]"
          :cy="point[1]"
          :r="index === 0 && showCloseIndicator ? 0.02 : 0.012"
          :fill="index === 0 && showCloseIndicator ? '#22c55e' : 'white'"
          :stroke="index === 0 && showCloseIndicator ? '#16a34a' : '#3b82f6'"
          stroke-width="0.003"
          :class="{ 'cursor-pointer': index === 0 && drawingPoints.length >= 3 }"
        />
      </g>
    </svg>

    <!-- Mode indicator -->
    <div
      v-if="mode !== 'view'"
      class="absolute top-4 left-4 px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm"
      :class="{
        'bg-blue-500/80 text-white': mode === 'calibrate',
        'bg-green-500/80 text-white': mode === 'draw',
      }"
    >
      <template v-if="mode === 'calibrate'">
        {{ !calibrationStart ? 'Click to set start point' : 'Click to set end point' }}
      </template>
      <template v-else-if="mode === 'draw'">
        {{ showCloseIndicator ? '✓ Click to close polygon' : (drawingPoints.length >= 3 ? 'Right-click to undo • Click near first point to close' : 'Right-click to undo • Click to add points') }}
      </template>
    </div>
  </div>
</template>
