<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { fetchParcel, deleteParcel, fetchDocuments, linkDocument } from '@/services/api';
import { FileText } from '@/lib/icons';

const route = useRoute();
const router = useRouter();
const parcel = ref<any>(null);
const loading = ref(true);
const availableDocuments = ref<any[]>([]);
const selectedDocumentIds = ref<string[]>([]);
const linkingDocuments = ref(false);
const linkDocumentsError = ref<string | null>(null);
const showLinkDocumentsModal = ref(false);

onMounted(async () => {
  const id = route.params.id as string;
  try {
    const [loadedParcel, docs] = await Promise.all([
      fetchParcel(id),
      fetchDocuments(),
    ]);
    parcel.value = loadedParcel;
    availableDocuments.value = docs;
  } catch (err) {
    console.error('Erreur chargement parcelle:', err);
  } finally {
    loading.value = false;
  }
});

async function handleDelete() {
  if (!confirm('Supprimer cette parcelle ?')) return;
  try {
    await deleteParcel(parcel.value.id);
    router.go(-1); // Go back
  } catch (err) {
    console.error('Erreur suppression parcelle:', err);
    alert('Erreur lors de la suppression de la parcelle');
  }
}

function formatTND(val: number) {
  return (val || val === 0) ? val.toLocaleString('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + ' TND' : '—';
}

function statusLabel(status: string) {
  if (status === 'SOLD') return 'Vendue';
  if (status === 'RESERVED') return 'Réservée';
  return 'Disponible';
}

function paymentLabel(status?: string) {
  if (status === 'PAID') return 'Payé';
  if (status === 'PARTIAL') return 'Partiel';
  return 'Non payé';
}

function paymentBadgeClass(status?: string) {
  if (status === 'PAID') return 'badge-paid';
  if (status === 'PARTIAL') return 'badge-partial';
  return 'badge-unpaid';
}

function statusBadgeClass(status: string) {
  if (status === 'SOLD') return 'badge-sold';
  if (status === 'RESERVED') return 'badge-reserved';
  return 'badge-available';
}

function formatDate(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const linkableDocuments = computed(() => {
  const linkedIds = new Set((parcel.value?.documents || []).map((item: any) => item.documentId));
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
  if (!parcel.value?.id) return;
  if (selectedDocumentIds.value.length === 0) {
    linkDocumentsError.value = 'Sélectionnez au moins un document à lier.';
    return;
  }

  linkingDocuments.value = true;
  linkDocumentsError.value = null;
  try {
    await Promise.all(
      selectedDocumentIds.value.map((documentId) => linkDocument(documentId, 'parcel', parcel.value.id))
    );

    const [updatedParcel, docs] = await Promise.all([
      fetchParcel(parcel.value.id),
      fetchDocuments(),
    ]);
    parcel.value = updatedParcel;
    availableDocuments.value = docs;
    selectedDocumentIds.value = [];
    showLinkDocumentsModal.value = false;
  } catch (error) {
    console.error('Erreur liaison documents parcelle:', error);
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
</script>

<template>
  <div v-if="loading" class="loading-state">
    <div class="loading-spinner" />
    <p>Chargement de la parcelle...</p>
  </div>

  <div v-else-if="!parcel" class="empty-state">Parcelle introuvable</div>

  <div v-else class="animate-fade-in detail-page">
    <header class="page-header">
      <div class="page-header-left">
        <RouterLink to="/terrains" class="back-link">← Retour</RouterLink>
        <h1 class="page-title">{{ parcel.label }}</h1>
        <div class="header-badges">
          <span class="badge" :class="statusBadgeClass(parcel.status)">
            {{ statusLabel(parcel.status) }}
          </span>
          <span class="badge" :class="paymentBadgeClass(parcel.paymentStatus)">
            Paiement: {{ paymentLabel(parcel.paymentStatus) }}
          </span>
        </div>
      </div>
      <div class="page-actions">
        <RouterLink
          v-if="parcel"
          :to="{ path: '/documents/nouveau', query: { parcelId: parcel.id } }"
          class="btn btn-secondary"
        >
          <FileText class="h-3.5 w-3.5" :stroke-width="1.5" />
          Nouveau document
        </RouterLink>
        <button class="btn btn-secondary" @click="openLinkDocumentsModal">
          <FileText class="h-3.5 w-3.5" :stroke-width="1.5" />
          Lier documents
        </button>
        <button @click="handleDelete" class="btn btn-danger">Supprimer</button>
      </div>
    </header>

    <section class="summary-grid">
      <article class="summary-card">
        <h2 class="card-title">Valorisation</h2>
        <div class="info-list">
          <div class="info-row">
            <span class="label">Surface</span>
            <span class="value">{{ Number(parcel.areaSqm || 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 }) }} m²</span>
          </div>
          <div class="info-row">
            <span class="label">Prix / m²</span>
            <span class="value">{{ formatTND(parcel.pricePerSqm) }}</span>
          </div>
          <div class="info-row">
            <span class="label">Prix Total</span>
            <span class="value value-strong">{{ formatTND(parcel.totalPrice) }}</span>
          </div>
          <div class="info-row">
            <span class="label">Montant payé</span>
            <span class="value">{{ formatTND(parcel.amountPaid) }}</span>
          </div>
          <div class="info-row">
            <span class="label">Reste à payer</span>
            <span class="value" :class="Number(parcel.totalPrice || 0) - Number(parcel.amountPaid || 0) > 0 ? 'text-warning' : 'text-success'">
              {{ formatTND(Math.max(Number(parcel.totalPrice || 0) - Number(parcel.amountPaid || 0), 0)) }}
            </span>
          </div>
        </div>
      </article>

      <article class="summary-card">
        <h2 class="card-title">Relations</h2>
        <div class="info-list">
          <div class="info-row">
            <span class="label">Terrain</span>
            <span class="value">
              <RouterLink v-if="parcel.terrain" :to="`/terrains/${parcel.terrain.id}`" class="link">
                {{ parcel.terrain.name }}
              </RouterLink>
              <span v-else>—</span>
            </span>
          </div>
          <div class="info-row">
            <span class="label">Client / Propriétaire</span>
            <span class="value">
              <RouterLink v-if="parcel.customer" :to="`/clients/${parcel.customer.id}`" class="link">
                {{ parcel.customer.name }}
              </RouterLink>
              <span v-else>{{ parcel.ownerName || '—' }}</span>
            </span>
          </div>
          <div class="info-row">
            <span class="label">Contrat</span>
            <span class="value">
              <RouterLink v-if="parcel.contract" :to="`/contrats/${parcel.contract.id}`" class="link">
                {{ parcel.contract.contractNumber || `#${parcel.contract.id.slice(0, 8)}` }}
              </RouterLink>
              <span v-else>—</span>
            </span>
          </div>
          <div class="info-row">
            <span class="label">Créée le</span>
            <span class="value">{{ formatDate(parcel.createdAt) }}</span>
          </div>
        </div>
      </article>

      <article class="summary-card">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:var(--space-md);margin-bottom:var(--space-sm)">
          <h2 class="card-title" style="margin-bottom:0">Documents</h2>
          <RouterLink
            :to="{ path: '/documents/nouveau', query: { parcelId: parcel.id } }"
            class="btn btn-secondary btn-sm"
          >
            <FileText class="h-3.5 w-3.5" :stroke-width="1.5" />
            Ajouter document
          </RouterLink>
        </div>

        <div class="info-list compact-doc-list" v-if="parcel.documents && parcel.documents.length > 0">
          <div v-for="pd in parcel.documents" :key="pd.documentId" class="info-row">
            <span class="label">{{ pd.document?.name || 'Document' }}</span>
            <span class="value" style="font-size:0.8125rem">
              {{ pd.document?.type || 'autre' }}
            </span>
          </div>
        </div>
        <p v-else style="color:var(--color-text-muted);font-size:0.875rem;margin:0">
          Aucun document associé
        </p>
      </article>
    </section>

    <Teleport to="body">
      <div v-if="showLinkDocumentsModal" class="modal-overlay" @click.self="closeLinkDocumentsModal">
        <div class="modal-container">
          <div class="modal-header">
            <h2 class="modal-title"><FileText class="h-4 w-4" :stroke-width="1.5" /> Lier des documents</h2>
            <button class="modal-close" @click="closeLinkDocumentsModal">✕</button>
          </div>
          <div class="modal-body">
            <p style="margin:0;color:var(--muted-foreground);font-size:0.875rem;">
              Sélectionnez les documents existants à lier à cette parcelle.
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
.detail-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: var(--space-lg);
}

.summary-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
}

.card-title {
  font-size: 1.05rem;
  font-weight: 600;
  margin-bottom: var(--space-sm);
  color: var(--color-text-primary);
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.compact-doc-list {
  max-height: 260px;
  overflow: auto;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-sm) 0;
  border-bottom: 1px solid var(--color-border);
}

.info-row:last-child {
  border-bottom: none;
}

.label {
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.value {
  font-weight: 600;
  color: var(--color-text-primary);
}

.value-strong {
  font-size: 1.05rem;
}

.link {
  color: var(--color-primary);
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}

.header-badges {
  display: flex;
  gap: var(--space-xs);
  flex-wrap: wrap;
}

.badge {
  padding: 0.2rem 0.65rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-available {
  background-color: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.badge-sold {
  background-color: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.badge-reserved {
  background-color: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.badge-paid {
  background-color: rgba(16, 185, 129, 0.16);
  color: #10b981;
}

.badge-partial {
  background-color: rgba(245, 158, 11, 0.16);
  color: #f59e0b;
}

.badge-unpaid {
  background-color: rgba(107, 114, 128, 0.22);
  color: #6b7280;
}

.text-warning {
  color: #f59e0b;
}

.text-success {
  color: #10b981;
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
