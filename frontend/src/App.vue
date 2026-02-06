<script setup lang="ts">
import { ref, computed } from 'vue';
import { useParcelsStore } from '@/stores/parcels';
import { useCalibrationStore } from '@/stores/calibration';
import ImageUploader from '@/components/ImageUploader.vue';
import ImageCanvas from '@/components/ImageCanvas.vue';
import CalibrationTool from '@/components/CalibrationTool.vue';
import ParcelSidePanel from '@/components/ParcelSidePanel.vue';
import ParcelTable from '@/components/ParcelTable.vue';

const parcelsStore = useParcelsStore();
const calibrationStore = useCalibrationStore();

// App state
const imageDataUrl = ref<string | null>(null);
const mode = ref<'view' | 'calibrate' | 'draw'>('view');
const showCalibrationDialog = ref(false);
const pendingCalibration = ref<{ startPoint: [number, number]; endPoint: [number, number] } | null>(null);
const isDetecting = ref(false);

function handleImageUpload(data: { file: File; dataUrl: string }) {
  imageDataUrl.value = data.dataUrl;
  mode.value = 'view';
}

function startCalibration() {
  mode.value = 'calibrate';
  showCalibrationDialog.value = false;
}

function handleCalibrationComplete(data: { startPoint: [number, number]; endPoint: [number, number] }) {
  pendingCalibration.value = data;
  showCalibrationDialog.value = true;
  mode.value = 'view';
}

function confirmCalibration(distanceMeters: number) {
  if (pendingCalibration.value) {
    calibrationStore.setCalibration({
      startPoint: pendingCalibration.value.startPoint,
      endPoint: pendingCalibration.value.endPoint,
      distanceMeters,
    });
    
    // Recalculate all parcel areas with the new scale factor
    if (calibrationStore.scaleFactor) {
      parcelsStore.recalculateAllAreas(calibrationStore.scaleFactor, {
        width: calibrationStore.imageWidth,
        height: calibrationStore.imageHeight
      });
    }
  }
  showCalibrationDialog.value = false;
  pendingCalibration.value = null;
}

function cancelCalibration() {
  showCalibrationDialog.value = false;
  pendingCalibration.value = null;
}

function startDrawing() {
  mode.value = 'draw';
}

function handlePolygonComplete(points: [number, number][]) {
  parcelsStore.createParcel(
    points, 
    calibrationStore.scaleFactor, 
    undefined,
    {
      width: calibrationStore.imageWidth,
      height: calibrationStore.imageHeight
    }
  );
  mode.value = 'view';
}

async function detectBoundaries() {
  if (!imageDataUrl.value) return;
  
  isDetecting.value = true;
  
  try {
    const response = await fetch('/api/detect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: imageDataUrl.value }),
    });
    
    const data = await response.json();
    
    if (data.error) {
      alert(data.message || data.error);
      return;
    }
    
    if (data.polygons && Array.isArray(data.polygons)) {
      for (const polygon of data.polygons) {
        if (polygon.length >= 3) {
          parcelsStore.createParcel(
            polygon, 
            calibrationStore.scaleFactor,
            undefined,
            {
              width: calibrationStore.imageWidth,
              height: calibrationStore.imageHeight
            }
          );
        }
      }
    }
  } catch (error) {
    console.error('Detection failed:', error);
    alert('Failed to detect boundaries. Please try again.');
  } finally {
    isDetecting.value = false;
  }
}

function clearAll() {
  if (confirm('Clear all parcels?')) {
    parcelsStore.clearParcels();
  }
}

const hasImage = computed(() => imageDataUrl.value !== null);
</script>

<template>
  <div class="min-h-screen bg-slate-900 text-slate-100">
    <!-- Header -->
    <header class="bg-slate-800 border-b border-slate-700 px-6 py-4">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <div>
            <h1 class="text-xl font-bold text-slate-100">Land Parcel Manager</h1>
            <p class="text-xs text-slate-400">AI-powered boundary detection & management</p>
          </div>
        </div>

        <div v-if="hasImage" class="flex items-center gap-3">
          <button
            class="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors"
            :class="{ 'ring-2 ring-primary': mode === 'calibrate' }"
            @click="startCalibration"
          >
            📏 Calibrate
          </button>
          <button
            class="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors"
            :class="{ 'ring-2 ring-primary': mode === 'draw' }"
            @click="startDrawing"
          >
            ✏️ Draw Parcel
          </button>
          <button
            class="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            :disabled="isDetecting"
            @click="detectBoundaries"
          >
            {{ isDetecting ? '🔄 Detecting...' : '🤖 Auto-Detect' }}
          </button>
          <button
            class="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm font-medium transition-colors"
            @click="clearAll"
          >
            Clear All
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto p-6">
      <template v-if="!hasImage">
        <div class="max-w-2xl mx-auto mt-12">
          <div class="text-center mb-8">
            <h2 class="text-3xl font-bold mb-2">Upload Land Survey Image</h2>
            <p class="text-slate-400">
              Upload a satellite image or hand-drawn map to get started
            </p>
          </div>
          <ImageUploader @upload="handleImageUpload" />
        </div>
      </template>

      <template v-else>
        <div class="flex gap-6">
          <!-- Canvas Area -->
          <div class="flex-1">
            <div class="aspect-[4/3] bg-slate-800 rounded-xl overflow-hidden shadow-xl">
              <ImageCanvas
                :image-src="imageDataUrl!"
                :mode="mode"
                @calibration-complete="handleCalibrationComplete"
                @polygon-complete="handlePolygonComplete"
              />
            </div>

            <!-- Stats Bar -->
            <div class="mt-4 flex gap-4">
              <div class="flex-1 bg-slate-800 rounded-lg p-4">
                <p class="text-sm text-slate-400">Total Parcels</p>
                <p class="text-2xl font-bold text-slate-100">{{ parcelsStore.parcels.length }}</p>
              </div>
              <div class="flex-1 bg-slate-800 rounded-lg p-4">
                <p class="text-sm text-slate-400">Available</p>
                <p class="text-2xl font-bold text-available">
                  {{ parcelsStore.parcels.filter(p => p.status === 'AVAILABLE').length }}
                </p>
              </div>
              <div class="flex-1 bg-slate-800 rounded-lg p-4">
                <p class="text-sm text-slate-400">Reserved</p>
                <p class="text-2xl font-bold text-reserved">
                  {{ parcelsStore.parcels.filter(p => p.status === 'RESERVED').length }}
                </p>
              </div>
              <div class="flex-1 bg-slate-800 rounded-lg p-4">
                <p class="text-sm text-slate-400">Sold</p>
                <p class="text-2xl font-bold text-sold">
                  {{ parcelsStore.parcels.filter(p => p.status === 'SOLD').length }}
                </p>
              </div>
              <div class="flex-1 bg-slate-800 rounded-lg p-4">
                <p class="text-sm text-slate-400">Scale</p>
                <p class="text-2xl font-bold" :class="calibrationStore.isCalibrated ? 'text-green-400' : 'text-amber-400'">
                  {{ calibrationStore.isCalibrated ? `${calibrationStore.scaleFactor?.toFixed(1)} px/m` : 'Not set' }}
                </p>
              </div>
            </div>
            <ParcelTable />
          </div>
        </div>
      </template>
    </main>

    <!-- Side Panel -->
    <ParcelSidePanel />

    <!-- Calibration Dialog Modal -->
    <Teleport to="body">
      <div
        v-if="showCalibrationDialog && pendingCalibration"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      >
        <CalibrationTool
          :start-point="pendingCalibration.startPoint"
          :end-point="pendingCalibration.endPoint"
          @confirm="confirmCalibration"
          @cancel="cancelCalibration"
        />
      </div>
    </Teleport>
  </div>
</template>
