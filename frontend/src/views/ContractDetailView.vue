<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { fetchContract, deleteContract, fetchDocuments, linkDocument } from '@/services/api';
import { FileText, Trash2, Hash, Calendar, User, Phone, Users, LandPlot, Image, File, XCircle } from '@/lib/icons';

const route = useRoute();
const router = useRouter();
const contract = ref<any>(null);
const loading = ref(true);
const availableDocuments = ref<any[]>([]);
const selectedDocumentIds = ref<string[]>([]);
const linkingDocuments = ref(false);
const linkDocumentsError = ref<string | null>(null);
const showLinkDocumentsModal = ref(false);

onMounted(async () => {
  const id = route.params.id as string;
  try {
    const [loadedContract, docs] = await Promise.all([
      fetchContract(id),
      fetchDocuments(),
    ]);
    contract.value = loadedContract;
    availableDocuments.value = docs;
  } catch (err) {
    console.error('Erreur chargement contrat:', err);
  } finally {
    loading.value = false;
  }
});

async function handleDelete() {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce contrat de vente ?')) return;
  try {
    await deleteContract(contract.value!.id);
    router.push('/contrats');
  } catch (err) {
    console.error('Erreur suppression contrat:', err);
    alert('Erreur lors de la suppression du contrat');
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

const linkableDocuments = computed(() => {
  const linkedIds = new Set((contract.value?.documents || []).map((item: any) => item.documentId));
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
  if (!contract.value?.id) return;
  if (selectedDocumentIds.value.length === 0) {
    linkDocumentsError.value = 'Sélectionnez au moins un document à lier.';
    return;
  }

  linkingDocuments.value = true;
  linkDocumentsError.value = null;
  try {
    await Promise.all(
      selectedDocumentIds.value.map((documentId) => linkDocument(documentId, 'contract', contract.value.id))
    );

    const [updatedContract, docs] = await Promise.all([
      fetchContract(contract.value.id),
      fetchDocuments(),
    ]);
    contract.value = updatedContract;
    availableDocuments.value = docs;
    selectedDocumentIds.value = [];
    showLinkDocumentsModal.value = false;
  } catch (error) {
    console.error('Erreur liaison documents contrat:', error);
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
  <div class="animate-fade-in">
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner" />
      <p>Chargement du contrat...</p>
    </div>

    <template v-else-if="contract">
      <header class="page-header">
        <div class="page-header-left">
          <RouterLink to="/contrats" class="back-link">← Retour aux Contrats</RouterLink>
          <h1 class="page-title">
            <FileText class="h-5 w-5 inline" :stroke-width="1.5" />
            Contrat de Vente {{ contract.contractNumber || '' }}
          </h1>
          <p class="page-subtitle">
            Enregistré le {{ formatDate(contract.createdAt) }}
          </p>
        </div>
        <div class="page-actions">
          <RouterLink
            v-if="contract"
            :to="{ path: '/documents/nouveau', query: { contractId: contract.id } }"
            class="btn btn-secondary"
          >
            <FileText class="h-3.5 w-3.5" :stroke-width="1.5" />
            Nouveau document
          </RouterLink>
          <button class="btn btn-danger" @click="handleDelete"><Trash2 class="h-3.5 w-3.5" :stroke-width="1.5" /> Supprimer</button>
        </div>
      </header>

      <div class="detail-content">
        <!-- Contract Info -->
        <div class="detail-section">
          <h2 class="section-title">Détails de la vente</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label"><Hash class="h-3.5 w-3.5 inline" :stroke-width="1.5" /> N° contrat</span>
              <span class="info-value">{{ contract.contractNumber || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label"><Calendar class="h-3.5 w-3.5 inline" :stroke-width="1.5" /> Date de vente</span>
              <span class="info-value">{{ formatDate(contract.createdAt) }}</span>
            </div>
          </div>
        </div>

        <!-- Buyer -->
        <div class="detail-section">
          <h2 class="section-title">Acheteur</h2>
          <template v-if="contract.customer">
            <div class="related-items">
              <RouterLink
                :to="`/clients/${contract.customer.id}`"
                class="related-item"
              >
                <User class="h-4 w-4" :stroke-width="1.5" />
                <div style="flex:1">
                  <div style="font-weight:600">{{ contract.customer.name || '—' }}</div>
                  <div v-if="contract.customer.phone" style="font-size:0.8125rem;color:var(--color-text-muted)">
                    <Phone class="h-3.5 w-3.5 inline" :stroke-width="1.5" /> {{ contract.customer.phone }}
                  </div>
                </div>
              </RouterLink>
            </div>
          </template>
          <div v-else class="related-items-empty">
            <Users class="h-8 w-8 text-muted-foreground" :stroke-width="1.5" />
            <p>Aucun acheteur lié</p>
          </div>
        </div>

        <!-- Parcels -->
        <div class="detail-section">
          <h2 class="section-title">Parcelles vendues</h2>
          <template v-if="contract.parcels && contract.parcels.length > 0">
            <div class="related-items">
              <div
                v-for="parcel in contract.parcels"
                :key="parcel.id"
                class="related-item"
              >
                <RouterLink
                  :to="`/parcelles/${parcel.id}`"
                  class="related-item"
                >
                <LandPlot class="h-4 w-4" :stroke-width="1.5" />
                <div style="flex:1">
                  <div style="font-weight:600">{{ parcel.label || '—' }}</div>
                  <div v-if="parcel.terrain" style="font-size:0.8125rem;color:var(--color-text-muted)">
                    Terrain: {{ parcel.terrain.name }}
                  </div>
                  <div v-if="parcel.areaSqm" style="font-size:0.8125rem;color:var(--color-text-muted)">
                    Surface: {{ parcel.areaSqm.toFixed(2) }} m²
                  </div>
                </div>
                </RouterLink>
              </div>
            </div>
          </template>
          <div v-else class="related-items-empty">
            <LandPlot class="h-8 w-8 text-muted-foreground" :stroke-width="1.5" />
            <p>Aucune parcelle liée</p>
          </div>
        </div>

        <!-- Documents & Images -->
        <div class="detail-section">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:var(--space-md);margin-bottom:var(--space-sm)">
            <h2 class="section-title" style="margin-bottom:0">Documents & Images</h2>
            <RouterLink
              :to="{ path: '/documents/nouveau', query: { contractId: contract.id } }"
              class="btn btn-secondary btn-sm"
            >
              <FileText class="h-3.5 w-3.5" :stroke-width="1.5" />
              Ajouter document
            </RouterLink>
          </div>
          <template v-if="contract.documents && contract.documents.length > 0">
            <div class="related-items">
              <div
                v-for="cd in contract.documents"
                :key="cd.documentId"
                class="related-item"
                style="cursor:default"
              >
                <component :is="cd.document?.mimeType?.startsWith('image/') ? Image : File" class="h-4 w-4" :stroke-width="1.5" />
                <div style="flex:1">
                  <div style="font-weight:600">{{ cd.document?.name || 'Document' }}</div>
                  <div style="font-size:0.8125rem;color:var(--color-text-muted)">
                    {{ cd.document?.type || 'autre' }}
                    <template v-if="cd.document?.sizeBytes">
                      — {{ (cd.document.sizeBytes / 1024).toFixed(1) }} Ko
                    </template>
                  </div>
                </div>
                <a
                  v-if="cd.document?.googleDriveId"
                  :href="`https://drive.google.com/file/d/${cd.document.googleDriveId}/view`"
                  target="_blank"
                  class="btn btn-secondary btn-sm"
                  @click.stop
                >
                  Ouvrir ↗
                </a>
              </div>
            </div>
          </template>
          <div v-else class="related-items-empty">
            <File class="h-8 w-8 text-muted-foreground" :stroke-width="1.5" />
            <p>Aucun document associé</p>
          </div>

          <div style="display:flex;justify-content:flex-end;margin-top:var(--space-md)">
            <button class="btn btn-secondary btn-sm" @click="openLinkDocumentsModal">
              Lier documents
            </button>
          </div>
        </div>

        <!-- Notes -->
        <div v-if="contract.notes" class="detail-section">
          <h2 class="section-title">Notes</h2>
          <p style="color:var(--color-text-secondary);font-size:0.9375rem;white-space:pre-wrap">
            {{ contract.notes }}
          </p>
        </div>

        <!-- Meta -->
        <div class="detail-meta">
          <span>Créé le : {{ new Date(contract.createdAt).toLocaleString('fr-FR') }}</span>
        </div>
      </div>
    </template>

    <div v-else class="empty-state">
      <span class="empty-state-icon"><XCircle class="h-12 w-12 text-destructive" :stroke-width="1.5" /></span>
      <p class="empty-state-title">Contrat introuvable</p>
      <RouterLink to="/contrats" class="btn btn-primary">Retour aux Contrats</RouterLink>
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
              Sélectionnez les documents existants à lier à ce contrat.
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
