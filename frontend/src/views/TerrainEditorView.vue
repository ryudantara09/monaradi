<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import { useParcelsStore } from '@/stores/parcels';
import { useCalibrationStore } from '@/stores/calibration';
import ImageUploader from '@/components/ImageUploader.vue';
import ImageCanvas from '@/components/ImageCanvas.vue';
import CalibrationTool from '@/components/CalibrationTool.vue';
import ParcelSidePanel from '@/components/ParcelSidePanel.vue';
import { fetchTerrain, fetchDocuments, linkDocument, createParcel, updateParcel, deleteParcel, uploadDocument } from '@/services/api';

const route = useRoute();
const parcelsStore = useParcelsStore();
const calibrationStore = useCalibrationStore();

const terrain = ref<any>(null);
const imageDataUrl = ref<string | null>(null);
const backgroundDocumentId = ref<string | null>(null);
const unlinkedDocs = ref<any[]>([]);
const loading = ref(true);
const saving = ref(false);

const mode = ref<'view' | 'calibrate' | 'draw'>('view');
const isDetecting = ref(false);
const showCalibrationDialog = ref(false);
const pendingCalibration = ref<{ startPoint: [number, number]; endPoint: [number, number] } | null>(null);

onMounted(async () => {
  const id = route.params.id as string;
  try {
    const [t, docs] = await Promise.all([
      fetchTerrain(id),
      fetchDocuments({ linked: false })
    ]);
    terrain.value = t;
    unlinkedDocs.value = docs;

    if (t.parcels) {
      const parsedParcels = t.parcels.map((p: any) => ({
        ...p,
        geometry: typeof p.geometry === 'string' ? JSON.parse(p.geometry) : p.geometry
      }));
      parcelsStore.setParcels(parsedParcels);
    }

    const imageDoc = t.documents?.find((d: any) => 
      d.document?.mimeType?.startsWith('image/') || 
      d.document?.type === 'satellite_image'
    );
    
    if (imageDoc) {
      if (imageDoc.document.fileData) {
         imageDataUrl.value = `data:${imageDoc.document.mimeType};base64,${imageDoc.document.fileData}`;
      } else if (imageDoc.document.googleDriveId) {
        imageDataUrl.value = imageDoc.document.thumbnailUrl || null;
      }
      backgroundDocumentId.value = imageDoc.documentId;
    }

  } catch (err) {
    console.error('Erreur chargement terrain:', err);
  } finally {
    loading.value = false;
  }
});

async function useDocumentAsMap(doc: any) {
  try {
    await linkDocument(doc.id, 'terrain', terrain.value.id);
    unlinkedDocs.value = unlinkedDocs.value.filter(d => d.id !== doc.id);
    
    const t = await fetchTerrain(terrain.value.id);
    terrain.value = t;
    
    const imageDoc = t.documents?.find((d: any) => d.documentId === doc.id);
    if (imageDoc && imageDoc.document.fileData) {
        imageDataUrl.value = `data:${imageDoc.document.mimeType};base64,${imageDoc.document.fileData}`;
        backgroundDocumentId.value = doc.id;
    }
  } catch (err) {
    console.error('Erreur liaison document:', err);
    alert('Erreur lors de la liaison du document');
  }
}

async function handleImageUpload(data: { file: File; dataUrl: string }) {
  imageDataUrl.value = data.dataUrl;
  loading.value = true;
  try {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('terrainId', terrain.value.id);
    formData.append('type', 'satellite_image');
    formData.append('storeInDb', 'true');
    
    const doc = await uploadDocument(formData);
    backgroundDocumentId.value = doc.id;
    
    const t = await fetchTerrain(terrain.value.id);
    terrain.value = t;
  } catch (err) {
    console.error('Upload error', err);
    alert('Erreur lors de l\'upload');
  } finally {
    loading.value = false;
  }
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
    calibrationStore.scaleFactor || 1,
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
    if (data.polygons && Array.isArray(data.polygons)) {
       for (const polygon of data.polygons) {
         if (polygon.length >= 3) {
            parcelsStore.createParcel(polygon, calibrationStore.scaleFactor || 1);
         }
       }
    }
  } catch (error) {
    console.error('Detection error', error);
    alert('Erreur détection');
  } finally {
    isDetecting.value = false;
  }
}

async function saveAll() {
  saving.value = true;
  try {
    const currentParcels = parcelsStore.parcels;
    
    const freshTerrain = await fetchTerrain(terrain.value.id);
    const dbParcels = freshTerrain.parcels || [];
    const dbIds = new Set(dbParcels.map((p: any) => p.id));
    
    const currentIds = new Set(currentParcels.map(p => p.id));
    const toDelete = dbParcels.filter((p: any) => !currentIds.has(p.id));
    
    for (const p of toDelete) {
      await deleteParcel(p.id);
    }
    
    for (const p of currentParcels) {
      const payload: any = {
        label: p.label,
        ownerName: p.ownerName,
        status: p.status,
        paymentStatus: p.paymentStatus,
        areaSqm: p.areaSqm,
        pricePerSqm: p.pricePerSqm,
        totalPrice: p.totalPrice,
        geometry: JSON.stringify(p.geometry),
        terrainId: terrain.value.id,
        customerId: p.customerId
      };
      
      if (dbIds.has(p.id)) {
        await updateParcel(p.id, payload);
      } else {
        await createParcel(payload);
      }
    }
    
    const t = await fetchTerrain(terrain.value.id);
    terrain.value = t;
    if (t.parcels) {
       const parsed = t.parcels.map((p: any) => ({
        ...p,
        geometry: typeof p.geometry === 'string' ? JSON.parse(p.geometry) : p.geometry
      }));
      parcelsStore.setParcels(parsed);
    }
    alert('Modifications enregistrées avec succès !');
    
  } catch (err) {
    console.error('Erreur sauvegarde:', err);
    alert('Erreur lors de la sauvegarde');
  } finally {
    saving.value = false;
  }
}

const hasImage = computed(() => !!imageDataUrl.value);
</script>

<template>
  <div class="editor-layout">
    <header class="editor-header">
       <div style="display:flex;align-items:center;gap:1rem">
         <RouterLink :to="`/terrains/${route.params.id}`" class="back-link">← Retour</RouterLink>
         <h1 v-if="terrain">{{ terrain.name }} - Éditeur</h1>
       </div>
       <div class="actions">
          <button class="btn btn-primary" @click="saveAll" :disabled="saving">
            {{ saving ? 'Enregistrement...' : '💾 Enregistrer Tout' }}
          </button>
       </div>
    </header>

    <div class="editor-body">
      <aside class="sidebar-docs" v-if="!hasImage || unlinkedDocs.length > 0">
        <h3>📂 Documents en attente (Drive)</h3>
        <p class="sidebar-hint" v-if="!hasImage">
          Sélectionnez une image pour commencer
        </p>
        <div class="docs-list">
          <div v-for="doc in unlinkedDocs" :key="doc.id" class="doc-card">
            <div class="doc-icon">{{ doc.mimeType?.startsWith('image/') ? '🖼️' : '📄' }}</div>
            <div class="doc-info">
              <div class="doc-name">{{ doc.name }}</div>
              <div class="doc-meta">{{ (doc.sizeBytes / 1024).toFixed(0) }} KB</div>
            </div>
            <button class="btn btn-sm btn-secondary" @click="useDocumentAsMap(doc)">
              Utiliser
            </button>
          </div>
          <div v-if="unlinkedDocs.length === 0" class="empty-docs">
            Aucun document en attente
          </div>
        </div>
      </aside>

      <main class="editor-main">
        <template v-if="hasImage">
          <div class="toolbar">
             <button class="btn btn-secondary" :class="{ active: mode === 'calibrate' }" @click="startCalibration">📏 Calibrer</button>
             <button class="btn btn-secondary" :class="{ active: mode === 'draw' }" @click="startDrawing">✏️ Dessiner</button>
             <button class="btn btn-accent" :disabled="isDetecting" @click="detectBoundaries">
               {{ isDetecting ? '🔄...' : '🤖 Auto-Détecter' }}
             </button>
          </div>
          
          <div class="canvas-wrapper">
             <ImageCanvas
               :image-src="imageDataUrl!"
               :mode="mode"
               @calibration-complete="handleCalibrationComplete"
               @polygon-complete="handlePolygonComplete"
             />
          </div>
        </template>
        <template v-else>
           <div class="empty-canvas">
             <h2>Aucune image de fond</h2>
             <p>Veuillez sélectionner un document dans la liste de gauche ou importer une image.</p>
             <div style="margin-top:2rem;max-width:500px">
                <ImageUploader @upload="handleImageUpload" />
             </div>
           </div>
        </template>
      </main>

      <aside class="sidebar-parcels">
         <ParcelSidePanel />
      </aside>
    </div>

    <Teleport to="body">
       <div v-if="showCalibrationDialog && pendingCalibration" class="modal-overlay">
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
.editor-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
}
.editor-header {
  height: 60px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
}
.editor-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}
.sidebar-docs {
  width: 250px;
  border-right: 1px solid var(--color-border);
  padding: 1rem;
  overflow-y: auto;
  background: var(--color-bg-secondary);
}
.sidebar-parcels {
  width: 300px;
  border-left: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
}
.editor-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  background: #0f1115;
  overflow: auto;
}
.doc-card {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(255,255,255,0.05);
  border-radius: 8px;
  margin-bottom: 0.5rem;
}
.doc-info { flex: 1; min-width: 0; }
.doc-name { font-weight: 500; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.doc-meta { font-size: 0.75rem; color: var(--color-text-muted); }
.toolbar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.canvas-wrapper {
  flex: 1;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
  background: #000;
}
.empty-canvas {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
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
</style>
