<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { fetchCustomer, updateCustomer, deleteCustomer, fetchDocuments, linkDocument } from '@/services/api';
import type { Customer } from '@/types';
import { User, Building2, Square, DollarSign, LandPlot, Mail, Phone, MapPin, Pencil, Trash2, FileText, XCircle } from '@/lib/icons';

const route = useRoute();
const router = useRouter();
const customer = ref<any>(null);
const isEditing = ref(false);
const saving = ref(false);
const loading = ref(true);
const availableDocuments = ref<any[]>([]);
const selectedDocumentIds = ref<string[]>([]);
const linkingDocuments = ref(false);
const linkDocumentsError = ref<string | null>(null);
const showLinkDocumentsModal = ref(false);

const formData = ref<Partial<Customer>>({});

onMounted(async () => {
  const id = route.params.id as string;
  try {
    const [loadedCustomer, docs] = await Promise.all([
      fetchCustomer(id),
      fetchDocuments(),
    ]);
    customer.value = loadedCustomer;
    availableDocuments.value = docs;
    formData.value = { ...customer.value };
  } catch (err) {
    console.error('Erreur chargement client:', err);
  } finally {
    loading.value = false;
  }
});

function startEdit() {
  formData.value = { ...customer.value };
  isEditing.value = true;
}

function cancelEdit() {
  formData.value = { ...customer.value };
  isEditing.value = false;
}

async function handleSave() {
  if (!customer.value) return;
  saving.value = true;
  try {
    const updated = await updateCustomer(customer.value.id, {
      type: formData.value.type,
      name: formData.value.name,
      email: formData.value.email,
      phone: formData.value.phone,
      address: formData.value.address,
      idNumber: formData.value.idNumber,
      legalRegNumber: formData.value.legalRegNumber,
      notes: formData.value.notes,
    });
    customer.value = { ...customer.value, ...updated };
    isEditing.value = false;
  } catch (err) {
    console.error('Erreur mise à jour client:', err);
    alert('Erreur lors de la mise à jour du client');
  } finally {
    saving.value = false;
  }
}

async function handleDelete() {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) return;
  try {
    await deleteCustomer(customer.value!.id);
    router.push('/clients');
  } catch (err) {
    console.error('Erreur suppression client:', err);
    alert('Erreur lors de la suppression du client');
  }
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatPrice(price: number | null | undefined): string {
  if (!price && price !== 0) return '—';
  return price.toLocaleString('fr-FR', { style: 'currency', currency: 'TND', maximumFractionDigits: 0 });
}

// Computed stats for parcels
const totalParcels = computed(() => customer.value?.purchasedParcels?.length || 0);
const totalInvestment = computed(() => {
  if (!customer.value?.purchasedParcels) return 0;
  return customer.value.purchasedParcels.reduce((sum: number, p: any) => sum + (p.totalPrice || 0), 0);
});

const customerContracts = computed(() => {
  const directContracts = customer.value?.contracts || [];
  const contractsFromParcels = (customer.value?.purchasedParcels || [])
    .filter((p: any) => p.contract)
    .map((p: any) => p.contract);

  const merged = [...directContracts, ...contractsFromParcels];
  const uniqueMap = new Map<string, any>();
  for (const contract of merged) {
    if (!contract?.id) continue;
    if (!uniqueMap.has(contract.id)) {
      uniqueMap.set(contract.id, contract);
    }
  }

  return Array.from(uniqueMap.values()).sort((a, b) =>
    new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
});

// Group parcels by terrain
const parcelsByTerrain = computed(() => {
  if (!customer.value?.purchasedParcels) return [];
  const terrainMap = new Map<string, { terrain: any; parcels: any[] }>();
  for (const p of customer.value.purchasedParcels) {
    const terrainKey = p.terrain?.id || 'unknown';
    if (!terrainMap.has(terrainKey)) {
      terrainMap.set(terrainKey, {
        terrain: p.terrain || { id: 'unknown', name: 'Terrain inconnu' },
        parcels: [],
      });
    }
    terrainMap.get(terrainKey)!.parcels.push(p);
  }
  return Array.from(terrainMap.values());
});

const linkableDocuments = computed(() => {
  const linkedIds = new Set((customer.value?.documents || []).map((item: any) => item.documentId));
  return availableDocuments.value.filter((doc: any) => !linkedIds.has(doc.id));
});

function toggleDocumentSelection(documentId: string, checked: boolean) {
  if (checked) {
    if (!selectedDocumentIds.value.includes(documentId)) {
      selectedDocumentIds.value.push(documentId);
    }
    return;
  }

  selectedDocumentIds.value = selectedDocumentIds.value.filter((id) => id !== documentId);
}

function parseLinkError(error: any, fallback: string): string {
  return error?.response?.data?.error || fallback;
}

async function handleLinkSelectedDocuments() {
  if (!customer.value?.id) return;
  if (selectedDocumentIds.value.length === 0) {
    linkDocumentsError.value = 'Sélectionnez au moins un document à lier.';
    return;
  }

  linkingDocuments.value = true;
  linkDocumentsError.value = null;
  try {
    await Promise.all(
      selectedDocumentIds.value.map((documentId) => linkDocument(documentId, 'customer', customer.value.id))
    );

    const [updatedCustomer, docs] = await Promise.all([
      fetchCustomer(customer.value.id),
      fetchDocuments(),
    ]);
    customer.value = updatedCustomer;
    availableDocuments.value = docs;
    selectedDocumentIds.value = [];
    closeLinkDocumentsModal();
  } catch (error) {
    console.error('Erreur liaison documents client:', error);
    linkDocumentsError.value = parseLinkError(error, 'Erreur lors de la liaison des documents.');
  } finally {
    linkingDocuments.value = false;
  }
}

function openLinkDocumentsModal() {
  linkDocumentsError.value = null;
  showLinkDocumentsModal.value = true;
}

function closeLinkDocumentsModal() {
  showLinkDocumentsModal.value = false;
  linkDocumentsError.value = null;
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    AVAILABLE: 'Disponible',
    SOLD: 'Vendue',
    RESERVED: 'Réservée',
  };
  return labels[status] || status;
}

function statusColor(status: string): string {
  const colors: Record<string, string> = {
    AVAILABLE: '#10b981',
    SOLD: '#ef4444',
    RESERVED: '#f59e0b',
  };
  return colors[status] || '#6b7280';
}
</script>

<template>
  <div class="animate-fade-in">
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner" />
      <p>Chargement du client...</p>
    </div>

    <template v-else-if="customer">
      <header class="page-header">
        <div class="page-header-left">
          <RouterLink to="/clients" class="back-link">← Retour aux Clients</RouterLink>
          <h1 class="page-title">
            <component :is="customer.type === 'individual' ? User : Building2" class="h-6 w-6 inline" :stroke-width="1.5" />
            {{ customer.name }}
          </h1>
          <p class="page-subtitle">
            Client
          </p>
        </div>
        <div class="page-actions">
          <RouterLink
            v-if="customer"
            :to="{ path: '/documents/nouveau', query: { customerId: customer.id } }"
            class="btn btn-secondary"
          >
            <FileText class="h-3.5 w-3.5" :stroke-width="1.5" />
            Nouveau document
          </RouterLink>
          <button class="btn btn-secondary" @click="openLinkDocumentsModal">
            <FileText class="h-3.5 w-3.5" :stroke-width="1.5" />
            Lier documents
          </button>
          <template v-if="isEditing">
            <button class="btn btn-secondary" @click="cancelEdit">Annuler</button>
            <button class="btn btn-primary" @click="handleSave" :disabled="saving">
              {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
            </button>
          </template>
          <template v-else>
            <button class="btn btn-secondary" @click="startEdit"><Pencil class="h-3.5 w-3.5" :stroke-width="1.5" /> Modifier</button>
            <button class="btn btn-danger" @click="handleDelete"><Trash2 class="h-3.5 w-3.5" :stroke-width="1.5" /> Supprimer</button>
          </template>
        </div>
      </header>

      <!-- Stats bar -->
      <div class="stats-grid" style="margin-bottom: var(--space-lg)">
        <div class="stat-card">
          <div class="stat-icon terrain"><Square class="h-5 w-5" :stroke-width="1.5" /></div>
          <div class="stat-content">
            <span class="stat-value">{{ totalParcels }}</span>
            <span class="stat-label">Parcelles achetées</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(99,102,241,0.15);color:#6366f1"><DollarSign class="h-5 w-5" :stroke-width="1.5" /></div>
          <div class="stat-content">
            <span class="stat-value">{{ formatPrice(totalInvestment) }}</span>
            <span class="stat-label">Investissement total</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(16,185,129,0.15);color:#10b981"><LandPlot class="h-5 w-5" :stroke-width="1.5" /></div>
          <div class="stat-content">
            <span class="stat-value">{{ parcelsByTerrain.length }}</span>
            <span class="stat-label">Terrains</span>
          </div>
        </div>
      </div>

      <div class="detail-content">
        <div class="detail-section">
          <h2 class="section-title">Informations de base</h2>
          <template v-if="isEditing">
            <div style="display:flex;flex-direction:column;gap:var(--space-md)">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Nom</label>
                  <input type="text" class="input" v-model="formData.name" />
                </div>
                <div class="form-group">
                  <label class="form-label">Email</label>
                  <input type="email" class="input" v-model="formData.email" />
                </div>
                <div class="form-group">
                  <label class="form-label">Téléphone</label>
                  <input type="tel" class="input" v-model="formData.phone" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Adresse</label>
                <input type="text" class="input" v-model="formData.address" />
              </div>
              <div class="form-group">
                <label class="form-label">Numéro d'identité (CIN)</label>
                <input type="text" class="input" v-model="formData.idNumber" />
              </div>
            </div>
          </template>
          <template v-else>
            <div class="info-grid base-info-grid">
              <div class="info-item">
                <span class="info-label"><Mail class="h-3.5 w-3.5 inline" :stroke-width="1.5" /> Email</span>
                <span class="info-value">{{ customer.email || '—' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label"><Phone class="h-3.5 w-3.5 inline" :stroke-width="1.5" /> Téléphone</span>
                <span class="info-value">{{ customer.phone || '—' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label"><FileText class="h-3.5 w-3.5 inline" :stroke-width="1.5" /> N° Identité (CIN)</span>
                <span class="info-value">{{ customer.idNumber || '—' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label"><MapPin class="h-3.5 w-3.5 inline" :stroke-width="1.5" /> Adresse</span>
                <span class="info-value">{{ customer.address || '—' }}</span>
              </div>
            </div>
          </template>
        </div>

        <div class="related-sections-grid">
          <div class="detail-section compact-section">
            <h2 class="section-title">Parcelles achetées</h2>
            <template v-if="totalParcels > 0">
              <div class="compact-scroll-panel" style="display:flex;flex-direction:column;gap:var(--space-md)">
                <div v-for="group in parcelsByTerrain" :key="group.terrain.id">
                  <div style="display:flex;align-items:center;gap:var(--space-sm);margin-bottom:var(--space-xs);">
                    <LandPlot class="h-4 w-4" :stroke-width="1.5" style="color: var(--muted-foreground)" />
                    <RouterLink
                      v-if="group.terrain.id !== 'unknown'"
                      :to="`/terrains/${group.terrain.id}`"
                      class="table-link"
                      style="font-weight:600;font-size:0.9375rem;"
                    >
                      {{ group.terrain.name }}
                    </RouterLink>
                    <span v-else style="font-weight:600;font-size:0.9375rem;color:var(--color-text-muted);">
                      {{ group.terrain.name }}
                    </span>
                  </div>

                  <div class="related-items">
                    <RouterLink
                      v-for="parcel in group.parcels"
                      :key="parcel.id"
                      :to="`/parcelles/${parcel.id}`"
                      class="related-item"
                    >
                      <Square class="h-4 w-4" :stroke-width="1.5" />
                      <div style="flex:1">
                        <div style="font-weight:600">{{ parcel.label }}</div>
                        <div style="font-size:0.8125rem;color:var(--color-text-muted)">
                          {{ parcel.areaSqm?.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) }} m²
                          — {{ formatPrice(parcel.totalPrice) }}
                        </div>
                      </div>
                      <span
                        class="status-badge"
                        :style="{
                          background: `${statusColor(parcel.status)}22`,
                          color: statusColor(parcel.status)
                        }"
                      >
                        {{ statusLabel(parcel.status) }}
                      </span>
                    </RouterLink>
                  </div>
                </div>
              </div>
            </template>
            <div v-else class="related-items-empty">
              <Square class="h-8 w-8 text-muted-foreground" :stroke-width="1.5" />
              <p>Ce client n'a acheté aucune parcelle pour le moment</p>
            </div>
          </div>

          <div class="detail-section compact-section">
            <h2 class="section-title">Contrats associés</h2>
            <template v-if="customerContracts.length > 0">
              <div class="related-items compact-scroll-panel">
                <RouterLink
                  v-for="contract in customerContracts"
                  :key="contract.id"
                  :to="`/contrats/${contract.id}`"
                  class="related-item"
                >
                  <FileText class="h-4 w-4" :stroke-width="1.5" />
                  <div style="flex:1">
                    <div style="font-weight:600">
                      Contrat {{ contract.contractNumber || `#${contract.id.slice(0, 8)}` }}
                    </div>
                    <div style="font-size:0.8125rem;color:var(--color-text-muted)">
                      Créé le {{ formatDate(contract.createdAt) }}
                      <template v-if="contract.parcels?.length">
                        — {{ contract.parcels.length }} parcelle{{ contract.parcels.length > 1 ? 's' : '' }}
                      </template>
                    </div>
                  </div>
                </RouterLink>
              </div>
            </template>
            <div v-else class="related-items-empty">
              <FileText class="h-8 w-8 text-muted-foreground" :stroke-width="1.5" />
              <p>Aucun contrat associé pour le moment</p>
              <RouterLink to="/contrats/nouveau" class="btn btn-secondary btn-sm">
                + Créer Contrat
              </RouterLink>
            </div>
          </div>

          <div class="detail-section compact-section">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:var(--space-md);margin-bottom:var(--space-sm)">
              <h2 class="section-title" style="margin-bottom:0">Documents</h2>
              <RouterLink
                :to="{ path: '/documents/nouveau', query: { customerId: customer.id } }"
                class="btn btn-secondary btn-sm"
              >
                <FileText class="h-3.5 w-3.5" :stroke-width="1.5" />
                Ajouter document
              </RouterLink>
            </div>

            <template v-if="customer.documents && customer.documents.length > 0">
              <div class="related-items compact-scroll-panel">
                <div
                  v-for="cd in customer.documents"
                  :key="cd.documentId"
                  class="related-item"
                  style="cursor:default"
                >
                  <FileText class="h-4 w-4" :stroke-width="1.5" />
                  <div style="flex:1">
                    <div style="font-weight:600">{{ cd.document?.name || 'Document' }}</div>
                    <div style="font-size:0.8125rem;color:var(--color-text-muted)">
                      {{ cd.document?.type || 'autre' }}
                      <template v-if="cd.document?.sizeBytes">
                        — {{ (cd.document.sizeBytes / 1024).toFixed(1) }} Ko
                      </template>
                    </div>
                  </div>
                </div>
              </div>
            </template>
            <div v-else class="related-items-empty">
              <FileText class="h-8 w-8 text-muted-foreground" :stroke-width="1.5" />
              <p>Aucun document associé</p>
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div class="detail-section">
          <h2 class="section-title">Notes</h2>
          <template v-if="isEditing">
            <div class="form-group">
              <textarea class="input textarea" v-model="formData.notes" rows="4" placeholder="Notes..." />
            </div>
          </template>
          <template v-else>
            <p style="color:var(--color-text-secondary);font-size:0.9375rem">
              {{ customer.notes || 'Pas de notes' }}
            </p>
          </template>
        </div>

        <!-- Meta -->
        <div class="detail-meta">
          <span>Client depuis : {{ new Date(customer.createdAt).toLocaleString('fr-FR') }}</span>
          <span>Mis à jour le : {{ new Date(customer.updatedAt).toLocaleString('fr-FR') }}</span>
        </div>
      </div>
    </template>

    <div v-else class="empty-state">
      <span class="empty-state-icon"><XCircle class="h-12 w-12 text-destructive" :stroke-width="1.5" /></span>
      <p class="empty-state-title">Client introuvable</p>
      <RouterLink to="/clients" class="btn btn-primary">Retour aux Clients</RouterLink>
    </div>

    <Teleport to="body">
      <div v-if="showLinkDocumentsModal" class="modal-overlay" @click.self="closeLinkDocumentsModal">
        <div class="modal-container">
          <div class="modal-header">
            <h2 class="modal-title"><FileText class="h-4 w-4" :stroke-width="1.5" /> Lier des documents</h2>
            <button class="modal-close" @click="closeLinkDocumentsModal">✕</button>
          </div>
          <div class="modal-body">
            <p style="margin:0;color:var(--muted-foreground);font-size:0.875rem;">
              Sélectionnez les documents existants à lier à ce client.
            </p>
            <div v-if="linkableDocuments.length > 0" style="display:flex;flex-direction:column;gap:0.35rem;max-height:300px;overflow:auto;border:1px solid var(--border);border-radius:var(--radius-md);padding:var(--space-sm);">
              <label v-for="doc in linkableDocuments" :key="doc.id" style="display:flex;align-items:center;gap:0.5rem;font-size:0.875rem;">
                <input
                  type="checkbox"
                  :checked="selectedDocumentIds.includes(doc.id)"
                  @change="toggleDocumentSelection(doc.id, ($event.target as HTMLInputElement).checked)"
                />
                <span>{{ doc.name }}</span>
              </label>
            </div>
            <p v-else style="margin:0;color:var(--muted-foreground);font-size:0.8125rem;">Aucun document disponible à lier.</p>

            <div v-if="linkDocumentsError" style="padding:var(--space-sm);border:1px solid rgba(239,68,68,0.4);background:rgba(239,68,68,0.08);border-radius:var(--radius-md);color:#ef4444;font-size:0.8125rem;">
              {{ linkDocumentsError }}
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeLinkDocumentsModal">Annuler</button>
            <button class="btn btn-primary" :disabled="linkingDocuments" @click="handleLinkSelectedDocuments">
              {{ linkingDocuments ? 'Liaison...' : 'Lier la sélection' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.base-info-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.related-sections-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-md);
}

.compact-section {
  min-height: 320px;
}

.compact-scroll-panel {
  max-height: 320px;
  overflow: auto;
}

@media (max-width: 1080px) {
  .related-sections-grid {
    grid-template-columns: 1fr;
  }

  .base-info-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .base-info-grid {
    grid-template-columns: 1fr;
  }
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  width: 90%;
  max-width: 760px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border);
}

.modal-title {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  color: var(--muted-foreground);
  font-size: 1.25rem;
  cursor: pointer;
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
</style>
