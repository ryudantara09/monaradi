<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { fetchDocuments, updateDocument, deleteDocument } from '@/services/api';

const documents = ref<any[]>([]);
const searchQuery = ref('');
const selectedType = ref<string>('ALL');
const loading = ref(true);

const documentTypes = [
  { value: 'ALL', label: 'Tous' },
  { value: 'terrain_image', label: 'Images Terrain' },
  { value: 'satellite', label: 'Satellites' },
  { value: 'contract', label: 'Contrats' },
  { value: 'identity', label: 'Identité (ID)' },
  { value: 'other', label: 'Autres' },
];

const editingDocumentId = ref<string | null>(null);
const editForm = ref({ name: '', type: 'other' });
const editSaving = ref(false);

onMounted(async () => {
  await loadDocuments();
});

async function loadDocuments() {
  loading.value = true;
  try {
    // We fetch all and filter locally for now
    documents.value = await fetchDocuments();
  } catch (err) {
    console.error('Erreur chargement documents:', err);
  } finally {
    loading.value = false;
  }
}

const filteredDocuments = computed(() => {
  let docs = documents.value;
  
  // Filter by type
  if (selectedType.value !== 'ALL') {
    docs = docs.filter(d => d.type === selectedType.value);
  }

  // Filter by search
  const q = searchQuery.value.toLowerCase();
  if (q) {
    docs = docs.filter(d => 
      d.name.toLowerCase().includes(q) ||
      d.type?.toLowerCase().includes(q)
    );
  }
  return docs;
});

function getFileIcon(mimeType: string): string {
  if (mimeType?.startsWith('image/')) return '🖼️';
  if (mimeType?.includes('pdf')) return '📕';
  return '📄';
}

function formatSize(bytes: number): string {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'Ko', 'Mo', 'Go'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR');
}

function getLinkedEntities(doc: any) {
  const links: any[] = [];
  
  if (doc.terrains?.length) {
    doc.terrains.forEach((t: any) => {
      if (t.terrain) links.push({ id: `t-${t.terrain.id}`, to: `/terrains/${t.terrain.id}`, name: t.terrain.name, icon: '🗺️' });
    });
  }
  if (doc.customers?.length) {
    doc.customers.forEach((c: any) => {
      if (c.customer) links.push({ id: `c-${c.customer.id}`, to: `/clients/${c.customer.id}`, name: c.customer.name, icon: '👤' });
    });
  }
  if (doc.contracts?.length) {
    doc.contracts.forEach((c: any) => {
      if (c.contract) links.push({ id: `ct-${c.contract.id}`, to: `/contrats/${c.contract.id}`, name: c.contract.contractNumber || 'Contrat', icon: '📜' });
    });
  }
  if (doc.parcels?.length) {
    doc.parcels.forEach((p: any) => {
      if (p.parcel) links.push({ id: `p-${p.parcel.id}`, to: `/terrains/${p.parcel.terrainId}`, name: p.parcel.label, icon: '📐' });
    });
  }
  
  return links;
}

function openEdit(doc: any) {
  editingDocumentId.value = doc.id;
  editForm.value = {
    name: doc.name,
    type: doc.type || 'other',
  };
}

function closeEdit() {
  editingDocumentId.value = null;
}

async function saveEdit() {
  if (!editingDocumentId.value) return;
  editSaving.value = true;
  try {
    await updateDocument(editingDocumentId.value, {
      name: editForm.value.name,
      type: editForm.value.type,
    });
    await loadDocuments();
    closeEdit();
  } catch (err) {
    console.error('Erreur update document:', err);
    alert('Erreur lors de la mise à jour');
  } finally {
    editSaving.value = false;
  }
}

async function deleteDoc(doc: any) {
  if (!confirm(`Supprimer le document "${doc.name}" ?`)) return;
  try {
    await deleteDocument(doc.id);
    await loadDocuments();
  } catch (err) {
    console.error('Erreur suppression document:', err);
    alert('Erreur lors de la suppression');
  }
}
</script>

<template>
  <div class="animate-fade-in">
    <header class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">Documents</h1>
        <p class="page-subtitle">Gestion centralisée de tous les fichiers</p>
      </div>
    </header>

    <!-- Toolbar -->
    <div class="page-toolbar">
      <div class="search-wrapper">
        <span class="search-icon">🔍</span>
        <input
          type="text"
          class="input search-input"
          placeholder="Rechercher documents..."
          v-model="searchQuery"
        />
      </div>
      
      <div class="toolbar-actions" style="gap: var(--space-sm); overflow-x: auto;">
        <button
          v-for="type in documentTypes"
          :key="type.value"
          class="filter-chip"
          :class="{ active: selectedType === type.value }"
          @click="selectedType = type.value"
        >
          {{ type.label }}
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner" />
      <p>Chargement des documents...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredDocuments.length === 0" class="empty-state">
      <span class="empty-state-icon">📂</span>
      <h2 class="empty-state-title">Aucun document trouvé</h2>
      <p class="empty-state-text">Essayez de modifier vos filtres.</p>
    </div>

    <!-- Grid View -->
    <div v-else class="documents-grid">
      <div
        v-for="doc in filteredDocuments"
        :key="doc.id"
        class="document-card"
      >
        <div class="document-preview">
            <span class="document-icon">{{ getFileIcon(doc.mimeType) }}</span>
        </div>
        
        <div class="document-info">
            <h3 class="document-name" :title="doc.name">{{ doc.name }}</h3>
            <div class="document-meta">
                <span>{{ doc.type || 'Autre' }}</span>
                <span>•</span>
                <span>{{ formatSize(doc.sizeBytes) }}</span>
            </div>
             <div class="document-date">
                Ajouté le {{ formatDate(doc.createdAt) }}
            </div>
            
             <!-- Linked Entities -->
            <div class="document-links" v-if="getLinkedEntities(doc).length > 0">
              <div v-for="link in getLinkedEntities(doc)" :key="link.id" class="document-link-item">
                <RouterLink :to="link.to" class="link-tag" :title="link.name">
                  {{ link.icon }} {{ link.name }}
                </RouterLink>
              </div>
            </div>
        </div>
        
        <div class="document-actions">
             <div style="display:flex; gap:0.5rem; margin-bottom: 0.5rem;">
                <button class="btn btn-secondary btn-sm" @click="openEdit(doc)" title="Modifier">✏️</button>
                <button class="btn btn-danger btn-sm" @click="deleteDoc(doc)" title="Supprimer">🗑️</button>
             </div>
             <a
                  v-if="doc.googleDriveId"
                  :href="`https://drive.google.com/file/d/${doc.googleDriveId}/view`"
                  target="_blank"
                  class="btn btn-secondary btn-sm"
                  style="width: 100%; justify-content: center;"
                >
                  Ouvrir ↗
            </a>
            <span v-else style="font-size: 0.8em; color: var(--color-text-muted); text-align: center; display: block;">
                Local File
            </span>
        </div>
      </div>
    </div>
    
    <!-- EDIT MODAL -->
    <Teleport to="body">
      <div v-if="editingDocumentId" class="modal-overlay" @click.self="closeEdit">
        <div class="modal-container">
          <div class="modal-header">
            <h2 class="modal-title">Modifier Document</h2>
            <button class="modal-close" @click="closeEdit">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Nom du fichier</label>
              <input type="text" class="input" v-model="editForm.name" />
            </div>
            <div class="form-group">
              <label class="form-label">Type de document</label>
              <select class="input" v-model="editForm.type">
                <option value="other">Autre</option>
                <option value="terrain_image">Image Terrain</option>
                <option value="satellite">Image Satellite</option>
                <option value="contract">Contrat</option>
                <option value="identity">Identité (ID)</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeEdit">Annuler</button>
            <button class="btn btn-primary" @click="saveEdit" :disabled="editSaving">
              {{ editSaving ? 'Enregistrement...' : 'Enregistrer' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.filter-chip {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  padding: 0.5rem 1rem;
  border-radius: 999px;
  font-size: 0.875rem;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.filter-chip:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.filter-chip.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.documents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-md);
  padding: var(--space-md);
}

.document-card {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
}

.document-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  border-color: var(--color-primary);
}

.document-preview {
  height: 120px;
  background: var(--color-bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid var(--color-border);
}

.document-icon {
  font-size: 3rem;
}

.document-info {
  padding: var(--space-md);
  flex: 1;
}

.document-name {
  font-size: 0.9375rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.document-meta {
  display: flex;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-bottom: 0.5rem;
}

.document-date {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.document-actions {
  padding: var(--space-sm) var(--space-md);
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-tertiary);
}

.document-links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.5rem;
}

.link-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.375rem;
  background: rgba(var(--color-primary-rgb), 0.1);
  color: var(--color-primary);
  border-radius: 4px;
  font-size: 0.75rem;
  text-decoration: none;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.link-tag:hover {
  background: rgba(var(--color-primary-rgb), 0.2);
  text-decoration: underline;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.15s ease;
}

.modal-container {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  animation: slideUp 0.2s ease;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
}

.modal-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}
</style>
