<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { fetchDocuments, updateDocument, deleteDocument, linkDocument, fetchTerrains, fetchCustomers, fetchParcels, fetchContracts } from '@/services/api';
import { Search, FolderOpen, LandPlot, User, FileText, Square, Pencil, Trash2, File, Plus, Grid3x3, List } from '@/lib/icons';

const router = useRouter();

const documents = ref<any[]>([]);
const searchQuery = ref('');
const viewMode = ref<'grid' | 'list'>('grid');
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

const terrains = ref<any[]>([]);
const customers = ref<any[]>([]);
const parcels = ref<any[]>([]);
const contracts = ref<any[]>([]);

const linkingDocumentId = ref<string | null>(null);
const linkSelection = ref({
  terrains: [] as string[],
  customers: [] as string[],
  parcels: [] as string[],
  contracts: [] as string[],
});
const linkSaving = ref(false);
const linkError = ref<string | null>(null);

onMounted(async () => {
  await Promise.all([loadDocuments(), loadEntitiesForLinking()]);
});

async function loadEntitiesForLinking() {
  try {
    const [terrainsData, customersData, parcelsData, contractsData] = await Promise.all([
      fetchTerrains(),
      fetchCustomers(),
      fetchParcels(),
      fetchContracts(),
    ]);

    terrains.value = terrainsData;
    customers.value = customersData;
    parcels.value = parcelsData;
    contracts.value = contractsData;
  } catch (error) {
    console.error('Erreur chargement des entités pour liaison:', error);
  }
}

async function loadDocuments() {
  loading.value = true;
  try {
    documents.value = await fetchDocuments();
  } catch (err) {
    console.error('Erreur chargement documents:', err);
  } finally {
    loading.value = false;
  }
}

const filteredDocuments = computed(() => {
  let docs = documents.value;

  if (selectedType.value !== 'ALL') {
    docs = docs.filter(d => d.type === selectedType.value);
  }

  const q = searchQuery.value.toLowerCase();
  if (q) {
    docs = docs.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.type?.toLowerCase().includes(q)
    );
  }
  return docs;
});

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
      if (t.terrain) links.push({ id: `t-${t.terrain.id}`, to: `/terrains/${t.terrain.id}`, name: t.terrain.name, type: 'terrain' });
    });
  }
  if (doc.customers?.length) {
    doc.customers.forEach((c: any) => {
      if (c.customer) links.push({ id: `c-${c.customer.id}`, to: `/clients/${c.customer.id}`, name: c.customer.name, type: 'customer' });
    });
  }
  if (doc.contracts?.length) {
    doc.contracts.forEach((c: any) => {
      if (c.contract) links.push({ id: `ct-${c.contract.id}`, to: `/contrats/${c.contract.id}`, name: c.contract.contractNumber || 'Contrat', type: 'contract' });
    });
  }
  if (doc.parcels?.length) {
    doc.parcels.forEach((p: any) => {
      if (p.parcel) links.push({ id: `p-${p.parcel.id}`, to: `/parcelles/${p.parcel.id}`, name: p.parcel.label, type: 'parcel' });
    });
  }

  return links;
}

function getVisibleLinkedEntities(doc: any, limit = 2) {
  return getLinkedEntities(doc).slice(0, limit);
}

function getHiddenLinkedEntitiesCount(doc: any, limit = 2) {
  return Math.max(getLinkedEntities(doc).length - limit, 0);
}

function openEdit(doc: any) {
  editingDocumentId.value = doc.id;
  editForm.value = {
    name: doc.name,
    type: doc.type || 'other',
  };
}

function openLink(doc: any) {
  linkingDocumentId.value = doc.id;
  linkError.value = null;
  linkSelection.value = {
    terrains: (doc.terrains || []).map((item: any) => item.terrainId).filter(Boolean),
    customers: (doc.customers || []).map((item: any) => item.customerId).filter(Boolean),
    parcels: (doc.parcels || []).map((item: any) => item.parcelId).filter(Boolean),
    contracts: (doc.contracts || []).map((item: any) => item.contractId).filter(Boolean),
  };
}

function closeLink() {
  linkingDocumentId.value = null;
  linkSaving.value = false;
  linkError.value = null;
}

function parseApiError(error: any, fallback: string): string {
  return error?.response?.data?.error || fallback;
}

function toggleLinkSelection(bucket: 'terrains' | 'customers' | 'parcels' | 'contracts', id: string, checked: boolean) {
  if (checked) {
    if (!linkSelection.value[bucket].includes(id)) {
      linkSelection.value[bucket].push(id);
    }
    return;
  }

  linkSelection.value[bucket] = linkSelection.value[bucket].filter((itemId) => itemId !== id);
}

function isLinkChecked(bucket: 'terrains' | 'customers' | 'parcels' | 'contracts', id: string): boolean {
  return linkSelection.value[bucket].includes(id);
}

async function saveLink() {
  if (!linkingDocumentId.value) return;

  const selectedCount =
    linkSelection.value.terrains.length +
    linkSelection.value.customers.length +
    linkSelection.value.parcels.length +
    linkSelection.value.contracts.length;

  if (selectedCount === 0) {
    linkError.value = 'Veuillez sélectionner au moins une entité.';
    return;
  }

  linkSaving.value = true;
  linkError.value = null;
  try {
    const jobs: Promise<void>[] = [];

    for (const terrainId of linkSelection.value.terrains) {
      jobs.push(linkDocument(linkingDocumentId.value, 'terrain', terrainId));
    }
    for (const customerId of linkSelection.value.customers) {
      jobs.push(linkDocument(linkingDocumentId.value, 'customer', customerId));
    }
    for (const parcelId of linkSelection.value.parcels) {
      jobs.push(linkDocument(linkingDocumentId.value, 'parcel', parcelId));
    }
    for (const contractId of linkSelection.value.contracts) {
      jobs.push(linkDocument(linkingDocumentId.value, 'contract', contractId));
    }

    await Promise.all(jobs);
    await loadDocuments();
    closeLink();
  } catch (error) {
    console.error('Erreur liaison document:', error);
    linkError.value = parseApiError(error, 'Erreur lors de la liaison du document.');
  } finally {
    linkSaving.value = false;
  }
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

function openDocumentDetail(documentId: string) {
  router.push(`/documents/${documentId}`);
}
</script>

<template>
  <div class="animate-fade-in">
    <header class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">Documents</h1>
        <p class="page-subtitle">Gestion centralisée de tous les fichiers</p>
      </div>
      <div class="page-header-right">
        <RouterLink to="/documents/nouveau" class="btn btn-primary">
          <Plus class="h-4 w-4" :stroke-width="1.5" />
          Nouveau document
        </RouterLink>
      </div>
    </header>

    <!-- Toolbar -->
    <div class="page-toolbar">
      <div class="search-wrapper">
        <Search class="search-icon h-4 w-4" :stroke-width="1.5" />
        <input
          type="text"
          class="input search-input"
          placeholder="Rechercher documents..."
          v-model="searchQuery"
        />
      </div>

      <div class="toolbar-actions" style="gap: 0.5rem; overflow-x: auto;">
        <div class="view-toggle">
          <button
            class="toggle-btn"
            :class="{ active: viewMode === 'grid' }"
            @click="viewMode = 'grid'"
          >
            <Grid3x3 class="h-4 w-4" :stroke-width="1.5" />
          </button>
          <button
            class="toggle-btn"
            :class="{ active: viewMode === 'list' }"
            @click="viewMode = 'list'"
          >
            <List class="h-4 w-4" :stroke-width="1.5" />
          </button>
        </div>
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
      <FolderOpen class="h-12 w-12 mb-4 text-muted-foreground opacity-50" :stroke-width="1.5" />
      <h2 class="empty-state-title">Aucun document trouvé</h2>
      <p class="empty-state-text">Commencez par ajouter ou uploader un document.</p>
      <RouterLink to="/documents/nouveau" class="btn btn-primary">
        <Plus class="h-4 w-4" :stroke-width="1.5" />
        Nouveau document
      </RouterLink>
    </div>

    <!-- Grid View -->
    <div v-else-if="viewMode === 'grid'" class="documents-grid">
      <div
        v-for="doc in filteredDocuments"
        :key="doc.id"
        class="document-card"
        role="button"
        tabindex="0"
        @click="openDocumentDetail(doc.id)"
        @keydown.enter="openDocumentDetail(doc.id)"
        @keydown.space.prevent="openDocumentDetail(doc.id)"
      >
        <div class="document-preview">
          <File class="h-10 w-10 text-muted-foreground" :stroke-width="1.5" />
        </div>

        <div class="document-info">
            <h3 class="document-name" :title="doc.name">{{ doc.name }}</h3>
            <div class="document-meta">
                <span>{{ doc.type || 'Autre' }}</span>
                <span>-</span>
                <span>{{ formatSize(doc.sizeBytes) }}</span>
            </div>
             <div class="document-date">
                Ajouté le {{ formatDate(doc.createdAt) }}
            </div>

             <!-- Linked Entities -->
            <div class="document-links" v-if="getLinkedEntities(doc).length > 0">
              <div v-for="link in getVisibleLinkedEntities(doc)" :key="link.id" class="document-link-item">
                <RouterLink :to="link.to" class="link-tag" :title="link.name" @click.stop>
                  <component
                    :is="link.type === 'terrain' ? LandPlot : link.type === 'customer' ? User : link.type === 'contract' ? FileText : Square"
                    class="h-3 w-3"
                    :stroke-width="1.5"
                  />
                  {{ link.name }}
                </RouterLink>
              </div>
              <span v-if="getHiddenLinkedEntitiesCount(doc) > 0" class="links-more">
                +{{ getHiddenLinkedEntitiesCount(doc) }}
              </span>
            </div>
        </div>

        <div class="document-actions" @click.stop>
             <div style="display:flex; gap:0.5rem; margin-bottom: 0.5rem;">
                <button class="btn btn-secondary btn-sm" @click.stop="openLink(doc)" title="Lier">
                  Lier
                </button>
                <button class="btn btn-secondary btn-sm" @click.stop="openEdit(doc)" title="Modifier">
                  <Pencil class="h-3.5 w-3.5" :stroke-width="1.5" />
                </button>
                <button class="btn btn-danger btn-sm" @click.stop="deleteDoc(doc)" title="Supprimer">
                  <Trash2 class="h-3.5 w-3.5" :stroke-width="1.5" />
                </button>
             </div>
        </div>
      </div>
    </div>

    <div v-else class="content-section">
      <table class="table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Type</th>
            <th>Taille</th>
            <th>Liens</th>
            <th>Ajouté le</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="doc in filteredDocuments" :key="doc.id">
            <td>
              <RouterLink :to="`/documents/${doc.id}`" class="table-link" style="font-weight:600">
                {{ doc.name }}
              </RouterLink>
            </td>
            <td>{{ doc.type || 'Autre' }}</td>
            <td>{{ formatSize(doc.sizeBytes) }}</td>
            <td>{{ getLinkedEntities(doc).length }}</td>
            <td>{{ formatDate(doc.createdAt) }}</td>
            <td>
              <div style="display:flex;align-items:center;gap:0.35rem;flex-wrap:wrap;">
                <button class="btn btn-secondary btn-sm" @click="openLink(doc)">Lier</button>
                <button class="btn btn-secondary btn-sm" @click="openEdit(doc)">
                  <Pencil class="h-3.5 w-3.5" :stroke-width="1.5" />
                </button>
                <button class="btn btn-danger btn-sm" @click="deleteDoc(doc)">
                  <Trash2 class="h-3.5 w-3.5" :stroke-width="1.5" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- EDIT MODAL -->
    <Teleport to="body">
      <div v-if="linkingDocumentId" class="modal-overlay" @click.self="closeLink">
        <div class="modal-container">
          <div class="modal-header">
            <h2 class="modal-title">Lier document</h2>
            <button class="modal-close" @click="closeLink">x</button>
          </div>
          <div class="modal-body">
            <p style="margin:0;color:var(--muted-foreground);font-size:0.875rem;">
              Sélectionnez les entités à lier. Les catégories sont séparées pour faciliter la sélection.
            </p>

            <div class="entity-groups">
              <div class="entity-group">
                <h3 class="entity-group-title">Terrains</h3>
                <div class="entity-list" v-if="terrains.length > 0">
                  <label v-for="terrain in terrains" :key="terrain.id" class="entity-item">
                    <input
                      type="checkbox"
                      :checked="isLinkChecked('terrains', terrain.id)"
                      @change="toggleLinkSelection('terrains', terrain.id, ($event.target as HTMLInputElement).checked)"
                    />
                    <span>{{ terrain.name }}</span>
                  </label>
                </div>
                <p v-else class="entity-empty">Aucun terrain disponible.</p>
              </div>

              <div class="entity-group">
                <h3 class="entity-group-title">Clients</h3>
                <div class="entity-list" v-if="customers.length > 0">
                  <label v-for="customer in customers" :key="customer.id" class="entity-item">
                    <input
                      type="checkbox"
                      :checked="isLinkChecked('customers', customer.id)"
                      @change="toggleLinkSelection('customers', customer.id, ($event.target as HTMLInputElement).checked)"
                    />
                    <span>{{ customer.name }}</span>
                  </label>
                </div>
                <p v-else class="entity-empty">Aucun client disponible.</p>
              </div>

              <div class="entity-group">
                <h3 class="entity-group-title">Parcelles</h3>
                <div class="entity-list" v-if="parcels.length > 0">
                  <label v-for="parcel in parcels" :key="parcel.id" class="entity-item">
                    <input
                      type="checkbox"
                      :checked="isLinkChecked('parcels', parcel.id)"
                      @change="toggleLinkSelection('parcels', parcel.id, ($event.target as HTMLInputElement).checked)"
                    />
                    <span>{{ parcel.label }}</span>
                  </label>
                </div>
                <p v-else class="entity-empty">Aucune parcelle disponible.</p>
              </div>

              <div class="entity-group">
                <h3 class="entity-group-title">Contrats</h3>
                <div class="entity-list" v-if="contracts.length > 0">
                  <label v-for="contract in contracts" :key="contract.id" class="entity-item">
                    <input
                      type="checkbox"
                      :checked="isLinkChecked('contracts', contract.id)"
                      @change="toggleLinkSelection('contracts', contract.id, ($event.target as HTMLInputElement).checked)"
                    />
                    <span>{{ contract.contractNumber || `Contrat ${contract.id.slice(0, 8)}` }}</span>
                  </label>
                </div>
                <p v-else class="entity-empty">Aucun contrat disponible.</p>
              </div>
            </div>

            <div
              v-if="linkError"
              style="padding:var(--space-sm) var(--space-md);border:1px solid rgba(239,68,68,0.4);background:rgba(239,68,68,0.08);border-radius:var(--radius-md);color:#ef4444;font-size:0.875rem;white-space:pre-wrap;"
            >
              {{ linkError }}
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeLink">Annuler</button>
            <button class="btn btn-primary" @click="saveLink" :disabled="linkSaving">
              {{ linkSaving ? 'Liaison...' : 'Lier' }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="editingDocumentId" class="modal-overlay" @click.self="closeEdit">
        <div class="modal-container">
          <div class="modal-header">
            <h2 class="modal-title">Modifier Document</h2>
            <button class="modal-close" @click="closeEdit">x</button>
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
  background: var(--secondary);
  border: 1px solid var(--border);
  color: var(--muted-foreground);
  padding: 0.5rem 1rem;
  border-radius: 999px;
  font-size: 0.875rem;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.filter-chip:hover {
  background: var(--muted);
  color: var(--foreground);
}

.filter-chip.active {
  background: var(--primary);
  border-color: var(--primary);
  color: var(--primary-foreground);
}

.documents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.document-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
  cursor: pointer;
}

.document-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  border-color: var(--primary);
}

.document-preview {
  height: 84px;
  background: var(--muted);
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid var(--border);
}

.document-info {
  padding: 0.75rem;
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
  color: var(--muted-foreground);
  margin-bottom: 0.35rem;
}

.document-date {
  font-size: 0.75rem;
  color: var(--muted-foreground);
}

.document-actions {
  padding: 0.5rem 0.75rem;
  border-top: 1px solid var(--border);
  background: var(--muted);
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
  background: color-mix(in oklch, var(--primary), transparent 90%);
  color: var(--primary);
  border-radius: 4px;
  font-size: 0.75rem;
  text-decoration: none;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.link-tag:hover {
  background: color-mix(in oklch, var(--primary), transparent 80%);
  text-decoration: underline;
}

.links-more {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-size: 0.75rem;
  color: var(--muted-foreground);
  background: var(--muted);
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
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  width: 90%;
  max-width: 760px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.2s ease;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border);
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  color: var(--muted-foreground);
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
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.entity-groups {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--space-md);
}

.entity-group {
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-sm) var(--space-md);
  background: var(--card);
}

.entity-group-title {
  margin: 0 0 var(--space-sm) 0;
  font-size: 0.95rem;
  font-weight: 600;
}

.entity-list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  max-height: 220px;
  overflow: auto;
}

.entity-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.entity-empty {
  margin: 0;
  color: var(--muted-foreground);
  font-size: 0.8125rem;
}
</style>
