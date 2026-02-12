<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import { useParcelsStore } from '@/stores/parcels';
import { useCalibrationStore } from '@/stores/calibration';
import ImageUploader from '@/components/ImageUploader.vue';
import ImageCanvas from '@/components/ImageCanvas.vue';
import CalibrationTool from '@/components/CalibrationTool.vue';
import ParcelTable from '@/components/ParcelTable.vue';
import ParcelSidePanel from '@/components/ParcelSidePanel.vue';

const route = useRoute();
const parcelsStore = useParcelsStore();
const calibrationStore = useCalibrationStore();

const imageDataUrl = ref<string | null>(null);
const mode = ref<'view' | 'calibrate' | 'draw'>('view');
const isDetecting = ref(false);
const showCalibrationDialog = ref(false);
const pendingCalibration = ref<{ startPoint: [number, number]; endPoint: [number, number] } | null>(null);

const projectId = computed(() => route.params.id as string | undefined);
const isNew = computed(() => !projectId.value || route.name === 'project-new');

onMounted(() => {
  if (projectId.value && projectId.value !== 'nouveau') {
    // Load existing project data if needed
  }
});

function handleImageUpload(data: { file: File; dataUrl: string }) {
  imageDataUrl.value = data.dataUrl;
}

function startCalibration() {
  mode.value = mode.value === 'calibrate' ? 'view' : 'calibrate';
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
  mode.value = mode.value === 'draw' ? 'view' : 'draw';
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
    console.error('Échec de la détection:', error);
    alert('Échec de la détection des limites. Veuillez réessayer.');
  } finally {
    isDetecting.value = false;
  }
}

function clearAll() {
  if (confirm('Effacer toutes les parcelles ?')) {
    parcelsStore.clearParcels();
  }
}

const hasImage = computed(() => imageDataUrl.value !== null);
const totalParcels = computed(() => parcelsStore.parcels.length);
const availableCount = computed(() => parcelsStore.parcels.filter(p => p.status === 'AVAILABLE').length);
const soldCount = computed(() => parcelsStore.parcels.filter(p => p.status === 'SOLD').length);
</script>

<template>
  <div class="animate-fade-in">
    <header class="page-header">
      <div class="page-header-left">
        <RouterLink to="/projets" class="back-link">← Retour aux Projets</RouterLink>
        <h1 class="page-title">
          <span>📐</span>
          {{ isNew ? 'Nouveau Projet' : 'Éditeur de Projet' }}
        </h1>
        <p class="page-subtitle">
          Importez une image et tracez vos parcelles
        </p>
      </div>
      <div v-if="hasImage" class="page-actions">
        <button
          class="btn btn-secondary"
          :class="{ active: mode === 'calibrate' }"
          @click="startCalibration"
        >
          📏 Calibrer
        </button>
        <button
          class="btn btn-secondary"
          :class="{ active: mode === 'draw' }"
          @click="startDrawing"
        >
          ✏️ Dessiner
        </button>
        <button
          class="btn btn-accent"
          :disabled="isDetecting"
          @click="detectBoundaries"
        >
          {{ isDetecting ? '🔄 Détection...' : '🤖 Auto-Détecter' }}
        </button>
        <button
          class="btn btn-danger"
          @click="clearAll"
        >
          🗑️ Effacer
        </button>
      </div>
    </header>

    <!-- Image Upload -->
    <template v-if="!hasImage">
      <div style="max-width:700px;margin:var(--space-2xl) auto 0">
        <div style="text-align:center;margin-bottom:var(--space-lg)">
          <h2 style="font-size:1.5rem;font-weight:700;margin-bottom:var(--space-xs)">
            Importer une image cadastrale
          </h2>
          <p style="color:var(--color-text-muted)">
            Importez une image satellite ou un plan cadastral pour commencer
          </p>
        </div>
        <ImageUploader @upload="handleImageUpload" />
      </div>
    </template>

    <!-- Canvas + Work Area -->
    <template v-else>
      <div style="display:flex;gap:var(--space-lg)">
        <!-- Canvas Area -->
        <div style="flex:1">
          <div class="canvas-container">
            <ImageCanvas
              :image-src="imageDataUrl!"
              :mode="mode"
              @calibration-complete="handleCalibrationComplete"
              @polygon-complete="handlePolygonComplete"
            />
          </div>

          <!-- Stats Bar -->
          <div class="stats-grid" style="margin-top:var(--space-md)">
            <div class="stat-card">
              <div class="stat-icon terrain">📐</div>
              <div class="stat-content">
                <span class="stat-value">{{ totalParcels }}</span>
                <span class="stat-label">Parcelles</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon" style="background:rgba(16,185,129,0.15);color:#10b981">✅</div>
              <div class="stat-content">
                <span class="stat-value">{{ availableCount }}</span>
                <span class="stat-label">Disponibles</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon" style="background:rgba(239,68,68,0.15);color:#ef4444">🔒</div>
              <div class="stat-content">
                <span class="stat-value">{{ soldCount }}</span>
                <span class="stat-label">Vendues</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon" :style="{ background: calibrationStore.isCalibrated ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: calibrationStore.isCalibrated ? '#10b981' : '#f59e0b' }">
                {{ calibrationStore.isCalibrated ? '✅' : '⚠️' }}
              </div>
              <div class="stat-content">
                <span class="stat-value">
                  {{ calibrationStore.isCalibrated ? `${calibrationStore.scaleFactor?.toFixed(1)} px/m` : 'Non' }}
                </span>
                <span class="stat-label">Échelle</span>
              </div>
            </div>
          </div>

          <!-- Parcel Table -->
          <ParcelTable />
        </div>
      </div>
    </template>

    <!-- Side Panel -->
    <ParcelSidePanel />

    <!-- Calibration Dialog Modal -->
    <Teleport to="body">
      <div
        v-if="showCalibrationDialog && pendingCalibration"
        class="modal-overlay"
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

<style scoped>
.canvas-container {
  aspect-ratio: 4 / 3;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.btn.active {
  border-color: var(--color-accent-primary);
  background: rgba(79, 158, 255, 0.15);
  color: var(--color-accent-primary);
}

.btn-accent {
  background: linear-gradient(135deg, #7c3aed, #3b82f6);
  color: white;
  border: none;
}

.btn-accent:hover:not(:disabled) {
  background: linear-gradient(135deg, #6d28d9, #2563eb);
}

.btn-accent:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
