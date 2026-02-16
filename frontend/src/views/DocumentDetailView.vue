<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { deleteDocument, fetchDocument } from '@/services/api';
import { File, FileText, Download, Eye, Trash2, LandPlot, User, Square, AlertCircle } from '@/lib/icons';

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const documentItem = ref<any | null>(null);
const textPreview = ref('');
const textPreviewLoading = ref(false);
const textPreviewError = ref<string | null>(null);

onMounted(async () => {
  await loadDocument();
});

watch(
  () => route.params.id,
  async () => {
    await loadDocument();
  }
);

async function loadDocument() {
  loading.value = true;
  textPreview.value = '';
  textPreviewError.value = null;

  try {
    documentItem.value = await fetchDocument(route.params.id as string);
    await loadTextPreviewIfNeeded();
  } catch (error) {
    console.error('Erreur chargement document:', error);
    documentItem.value = null;
  } finally {
    loading.value = false;
  }
}

function formatDate(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatSize(bytes?: number): string {
  if (!bytes) return '—';
  const k = 1024;
  const sizes = ['B', 'Ko', 'Mo', 'Go'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

const typeLabel = computed(() => {
  const docType = documentItem.value?.type;
  if (docType === 'terrain_image') return 'Image Terrain';
  if (docType === 'satellite') return 'Image Satellite';
  if (docType === 'contract') return 'Contrat';
  if (docType === 'identity') return 'Identité';
  return docType || 'Autre';
});

function getExtension(value?: string): string {
  if (!value) return '';
  const clean = value.split('?')[0] || '';
  const dotIndex = clean.lastIndexOf('.');
  return dotIndex >= 0 ? clean.slice(dotIndex + 1).toLowerCase() : '';
}

const localFileUrl = computed(() => {
  const filePath: string | undefined = documentItem.value?.filePath;
  if (!filePath) return '';
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath;

  const normalizedPath = filePath.replace(/\\/g, '/');
  const uploadsIndex = normalizedPath.indexOf('/uploads/');
  if (uploadsIndex >= 0) return normalizedPath.slice(uploadsIndex);
  if (normalizedPath.startsWith('uploads/')) return `/${normalizedPath}`;
  if (normalizedPath.startsWith('/uploads/')) return normalizedPath;
  return `/${normalizedPath}`;
});

const googleDrivePreviewUrl = computed(() => {
  const googleDriveId: string | undefined = documentItem.value?.googleDriveId;
  if (!googleDriveId) return '';
  return `https://drive.google.com/file/d/${googleDriveId}/preview`;
});

const googleDriveOpenUrl = computed(() => {
  const googleDriveId: string | undefined = documentItem.value?.googleDriveId;
  if (!googleDriveId) return '';
  return `https://drive.google.com/file/d/${googleDriveId}/view`;
});

const downloadUrl = computed(() => {
  if (!documentItem.value?.id) return '';
  return `/api/documents/${documentItem.value.id}/download`;
});

const previewUrl = computed(() => {
  if (googleDrivePreviewUrl.value) return googleDrivePreviewUrl.value;
  if (localFileUrl.value) return localFileUrl.value;
  return downloadUrl.value;
});

const mimeType = computed(() => (documentItem.value?.mimeType || '').toLowerCase());
const extension = computed(() => getExtension(documentItem.value?.name || documentItem.value?.filePath));

const previewKind = computed<'image' | 'pdf' | 'video' | 'audio' | 'text' | 'iframe' | 'none'>(() => {
  if (!previewUrl.value) return 'none';

  if (googleDrivePreviewUrl.value) return 'iframe';

  if (mimeType.value.startsWith('image/')) return 'image';
  if (mimeType.value === 'application/pdf') return 'pdf';
  if (mimeType.value.startsWith('video/')) return 'video';
  if (mimeType.value.startsWith('audio/')) return 'audio';
  if (mimeType.value.startsWith('text/')) return 'text';
  if (['application/json', 'application/xml'].includes(mimeType.value)) return 'text';

  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(extension.value)) return 'image';
  if (extension.value === 'pdf') return 'pdf';
  if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(extension.value)) return 'video';
  if (['mp3', 'wav', 'ogg', 'm4a'].includes(extension.value)) return 'audio';
  if (['txt', 'md', 'csv', 'json', 'xml', 'log'].includes(extension.value)) return 'text';

  return 'none';
});

const linkedEntities = computed(() => {
  if (!documentItem.value) return [];
  const links: Array<{ id: string; to: string; name: string; type: 'terrain' | 'customer' | 'contract' | 'parcel' }> = [];

  if (documentItem.value.terrains?.length) {
    documentItem.value.terrains.forEach((item: any) => {
      if (!item.terrain) return;
      links.push({
        id: `t-${item.terrain.id}`,
        to: `/terrains/${item.terrain.id}`,
        name: item.terrain.name,
        type: 'terrain',
      });
    });
  }

  if (documentItem.value.customers?.length) {
    documentItem.value.customers.forEach((item: any) => {
      if (!item.customer) return;
      links.push({
        id: `c-${item.customer.id}`,
        to: `/clients/${item.customer.id}`,
        name: item.customer.name,
        type: 'customer',
      });
    });
  }

  if (documentItem.value.contracts?.length) {
    documentItem.value.contracts.forEach((item: any) => {
      if (!item.contract) return;
      links.push({
        id: `ct-${item.contract.id}`,
        to: `/contrats/${item.contract.id}`,
        name: item.contract.contractNumber || `Contrat ${item.contract.id.slice(0, 8)}`,
        type: 'contract',
      });
    });
  }

  if (documentItem.value.parcels?.length) {
    documentItem.value.parcels.forEach((item: any) => {
      if (!item.parcel) return;
      links.push({
        id: `p-${item.parcel.id}`,
        to: `/parcelles/${item.parcel.id}`,
        name: item.parcel.label,
        type: 'parcel',
      });
    });
  }

  return links;
});

async function loadTextPreviewIfNeeded() {
  if (previewKind.value !== 'text' || !localFileUrl.value) return;

  textPreviewLoading.value = true;
  textPreviewError.value = null;
  try {
    const response = await fetch(localFileUrl.value);
    if (!response.ok) {
      throw new Error('Réponse invalide');
    }
    textPreview.value = await response.text();
  } catch (error) {
    console.error('Erreur prévisualisation texte:', error);
    textPreviewError.value = 'Impossible de charger le contenu texte.';
  } finally {
    textPreviewLoading.value = false;
  }
}

async function handleDelete() {
  if (!documentItem.value?.id) return;
  if (!confirm(`Supprimer le document "${documentItem.value.name}" ?`)) return;

  try {
    await deleteDocument(documentItem.value.id);
    router.push('/documents');
  } catch (error) {
    console.error('Erreur suppression document:', error);
    alert('Erreur lors de la suppression du document');
  }
}
</script>

<template>
  <div v-if="loading" class="loading-state">
    <div class="loading-spinner" />
    <p>Chargement du document...</p>
  </div>

  <div v-else-if="!documentItem" class="empty-state">Document introuvable</div>

  <div v-else class="animate-fade-in detail-page">
    <header class="page-header">
      <div class="page-header-left">
        <RouterLink to="/documents" class="back-link">← Retour aux Documents</RouterLink>
        <h1 class="page-title">{{ documentItem.name }}</h1>
        <p class="page-subtitle">{{ typeLabel }}</p>
      </div>
      <div class="page-actions">
        <a
          v-if="googleDriveOpenUrl"
          :href="googleDriveOpenUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn-secondary"
        >
          <Eye class="h-3.5 w-3.5" :stroke-width="1.5" />
          Ouvrir dans Drive
        </a>
        <a
          v-if="downloadUrl"
          :href="downloadUrl"
          class="btn btn-secondary"
        >
          <Download class="h-3.5 w-3.5" :stroke-width="1.5" />
          Télécharger
        </a>
        <button @click="handleDelete" class="btn btn-danger">
          <Trash2 class="h-3.5 w-3.5" :stroke-width="1.5" />
          Supprimer
        </button>
      </div>
    </header>

    <section class="summary-grid">
      <article class="summary-card">
        <h2 class="card-title">Informations</h2>
        <div class="info-list">
          <div class="info-row">
            <span class="label">Type</span>
            <span class="value">{{ typeLabel }}</span>
          </div>
          <div class="info-row">
            <span class="label">Taille</span>
            <span class="value">{{ formatSize(documentItem.sizeBytes) }}</span>
          </div>
          <div class="info-row">
            <span class="label">Format</span>
            <span class="value">{{ documentItem.mimeType || extension || '—' }}</span>
          </div>
          <div class="info-row">
            <span class="label">Ajouté le</span>
            <span class="value">{{ formatDate(documentItem.createdAt || documentItem.uploadedAt) }}</span>
          </div>
          <div class="info-row">
            <span class="label">Source</span>
            <span class="value">{{ documentItem.googleDriveId ? 'Google Drive' : documentItem.filePath ? 'Fichier local' : 'Métadonnées' }}</span>
          </div>
        </div>
      </article>

      <article class="summary-card">
        <h2 class="card-title">Entités liées</h2>
        <div v-if="linkedEntities.length > 0" class="linked-list">
          <RouterLink
            v-for="link in linkedEntities"
            :key="link.id"
            :to="link.to"
            class="link-chip"
          >
            <component
              :is="link.type === 'terrain' ? LandPlot : link.type === 'customer' ? User : link.type === 'contract' ? FileText : Square"
              class="h-3.5 w-3.5"
              :stroke-width="1.5"
            />
            {{ link.name }}
          </RouterLink>
        </div>
        <p v-else class="empty-inline">Aucune entité liée.</p>
      </article>
    </section>

    <section class="content-section">
      <div class="section-header">
        <h2 class="section-title">Prévisualisation</h2>
      </div>

      <div class="preview-frame">
        <img
          v-if="previewKind === 'image'"
          :src="previewUrl"
          :alt="documentItem.name"
          class="preview-image"
        />

        <iframe
          v-else-if="previewKind === 'pdf' || previewKind === 'iframe'"
          :src="previewUrl"
          class="preview-embed"
          title="Prévisualisation du document"
        />

        <video
          v-else-if="previewKind === 'video'"
          :src="previewUrl"
          controls
          class="preview-media"
        />

        <audio
          v-else-if="previewKind === 'audio'"
          :src="previewUrl"
          controls
          class="preview-audio"
        />

        <div v-else-if="previewKind === 'text'" class="preview-text-wrap">
          <div v-if="textPreviewLoading" class="loading-state" style="padding: var(--space-md);">
            <div class="loading-spinner" />
            <p>Chargement du contenu texte...</p>
          </div>
          <div v-else-if="textPreviewError" class="preview-fallback">
            <AlertCircle class="h-5 w-5" :stroke-width="1.5" />
            <p>{{ textPreviewError }}</p>
            <a :href="downloadUrl" class="btn btn-secondary btn-sm">
              <Download class="h-3.5 w-3.5" :stroke-width="1.5" />
              Télécharger
            </a>
          </div>
          <pre v-else class="preview-text">{{ textPreview }}</pre>
        </div>

        <div v-else class="preview-fallback">
          <File class="h-8 w-8" :stroke-width="1.5" />
          <p>Prévisualisation non supportée pour ce type de document.</p>
          <a :href="downloadUrl" class="btn btn-secondary btn-sm">
            <Download class="h-3.5 w-3.5" :stroke-width="1.5" />
            Télécharger le fichier
          </a>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.detail-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.summary-grid {
  display: grid;
  gap: var(--space-md);
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.summary-card {
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--card);
  padding: var(--space-md);
}

.card-title {
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0 0 var(--space-sm) 0;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  gap: var(--space-sm);
}

.label {
  color: var(--muted-foreground);
  font-size: 0.875rem;
}

.value {
  font-size: 0.875rem;
  color: var(--foreground);
  text-align: right;
  font-weight: 500;
}

.content-section {
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--card);
  padding: var(--space-md);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  margin-bottom: var(--space-sm);
}

.section-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.preview-frame {
  background: var(--muted);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  min-height: 460px;
  overflow: hidden;
}

.preview-image,
.preview-embed,
.preview-media {
  width: 100%;
  height: min(70vh, 760px);
  display: block;
  border: 0;
  background: #000;
}

.preview-image {
  object-fit: contain;
  background: var(--muted);
}

.preview-audio {
  width: 100%;
  padding: var(--space-lg);
}

.preview-text-wrap {
  height: min(70vh, 760px);
  display: flex;
}

.preview-text {
  margin: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  padding: var(--space-md);
  font-size: 0.8125rem;
  line-height: 1.6;
  color: var(--foreground);
  background: transparent;
  white-space: pre-wrap;
  word-break: break-word;
}

.preview-fallback {
  min-height: 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  color: var(--muted-foreground);
  text-align: center;
  padding: var(--space-lg);
}

.linked-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.link-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  text-decoration: none;
  color: var(--foreground);
  border: 1px solid var(--border);
  background: var(--secondary);
  border-radius: 999px;
  padding: 0.35rem 0.65rem;
  font-size: 0.8rem;
}

.link-chip:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.empty-inline {
  margin: 0;
  color: var(--muted-foreground);
  font-size: 0.875rem;
}

@media (max-width: 900px) {
  .preview-image,
  .preview-embed,
  .preview-media,
  .preview-text-wrap {
    height: min(65vh, 560px);
  }
}
</style>
