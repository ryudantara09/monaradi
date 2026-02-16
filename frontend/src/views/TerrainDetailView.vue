<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { fetchTerrain, updateTerrain, deleteTerrain, fetchCustomers, createParcel, updateParcel, deleteParcel, createContract, fetchDocuments, linkDocument, createCustomer, createDocument, uploadDocument } from '@/services/api';
import TerrainEditorView from '@/views/TerrainEditorView.vue';
import { LandPlot, Square, User, Building2, Pencil, Trash2, FileText, MapPin, XCircle, AlertCircle, File, Plus } from '@/lib/icons';

const customers = ref<any[]>([]);

const route = useRoute();
const router = useRouter();
const currentTab = ref<'details' | 'visual' | 'documents'>('details');

const terrain = ref<any>(null);
const isEditing = ref(false);
const saving = ref(false);
const loading = ref(true);
const availableDocuments = ref<any[]>([]);
const selectedDocumentIds = ref<string[]>([]);
const linkingDocuments = ref(false);
const linkDocumentsError = ref<string | null>(null);
const showLinkDocumentsModal = ref(false);
const showAddMenu = ref(false);

type QuickCreateType = 'customer' | 'contract' | 'document';
const showQuickCreateModal = ref(false);
const quickCreateType = ref<QuickCreateType>('customer');
const quickCreateSaving = ref(false);
const quickCreateError = ref<string | null>(null);

const customerCreateForm = ref({
  name: '',
  email: '',
  phone: '',
  address: '',
  idNumber: '',
  notes: '',
});

const contractCreateForm = ref({
  contractNumber: '',
  customerId: '',
  notes: '',
  terms: '',
  saleAmount: '' as string | number,
  parcelIds: [] as string[],
});

const documentCreateForm = ref({
  name: '',
  type: 'other',
  file: null as File | null,
});

const formData = ref<any>({});

// ========== PARCEL MODAL STATE ==========
const showParcelModal = ref(false);
const parcelSaving = ref(false);
const editingParcelId = ref<string | null>(null);
const parcelModalError = ref<string | null>(null);
const parcelForm = ref({
  label: '',
  areaSqm: '' as string | number,
  pricePerSqm: '' as string | number,
  status: 'AVAILABLE',
  customerId: '',
  ownerName: '',
  contractNumber: '',
  contractTerms: '',
  contractNotes: '',
});

function parseApiError(error: any, fallback: string): string {
  return error?.response?.data?.error || fallback;
}

const contractEligibleParcels = computed(() => {
  if (!terrain.value?.parcels) return [];
  return terrain.value.parcels.filter((parcel: any) => parcel.status !== 'SOLD');
});

const contractSelectedParcelsTotal = computed(() => {
  if (!terrain.value?.parcels?.length || contractCreateForm.value.parcelIds.length === 0) return 0;
  return terrain.value.parcels
    .filter((parcel: any) => contractCreateForm.value.parcelIds.includes(parcel.id))
    .reduce((sum: number, parcel: any) => sum + (parcel.totalPrice || 0), 0);
});

function toggleAddMenu() {
  showAddMenu.value = !showAddMenu.value;
}

function closeAddMenu() {
  showAddMenu.value = false;
}

function openQuickCreateModal(type: QuickCreateType) {
  closeAddMenu();
  quickCreateType.value = type;
  quickCreateError.value = null;

  if (type === 'customer') {
    customerCreateForm.value = {
      name: '',
      email: '',
      phone: '',
      address: '',
      idNumber: '',
      notes: '',
    };
  }

  if (type === 'contract') {
    contractCreateForm.value = {
      contractNumber: '',
      customerId: '',
      notes: '',
      terms: '',
      saleAmount: '',
      parcelIds: [],
    };
  }

  if (type === 'document') {
    documentCreateForm.value = {
      name: '',
      type: 'other',
      file: null,
    };
  }

  showQuickCreateModal.value = true;
}

function closeQuickCreateModal() {
  showQuickCreateModal.value = false;
  quickCreateError.value = null;
  quickCreateSaving.value = false;
}

function toggleContractParcelSelection(parcelId: string, checked: boolean) {
  if (checked) {
    if (!contractCreateForm.value.parcelIds.includes(parcelId)) {
      contractCreateForm.value.parcelIds.push(parcelId);
    }
    return;
  }
  contractCreateForm.value.parcelIds = contractCreateForm.value.parcelIds.filter((id) => id !== parcelId);
}

function handleQuickDocumentFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0] || null;
  documentCreateForm.value.file = file;
  if (file && !documentCreateForm.value.name.trim()) {
    documentCreateForm.value.name = file.name;
  }
}

async function handleQuickCreateSubmit() {
  if (!terrain.value?.id) return;
  quickCreateSaving.value = true;
  quickCreateError.value = null;

  try {
    if (quickCreateType.value === 'customer') {
      if (!customerCreateForm.value.name.trim()) {
        quickCreateError.value = 'Le nom du client est requis.';
        return;
      }

      await createCustomer({
        name: customerCreateForm.value.name.trim(),
        email: customerCreateForm.value.email || undefined,
        phone: customerCreateForm.value.phone || undefined,
        address: customerCreateForm.value.address || undefined,
        idNumber: customerCreateForm.value.idNumber || undefined,
        notes: customerCreateForm.value.notes || undefined,
      });

      customers.value = await fetchCustomers();
    }

    if (quickCreateType.value === 'contract') {
      if (!contractCreateForm.value.customerId) {
        quickCreateError.value = 'Sélectionnez un client.';
        return;
      }
      if (contractCreateForm.value.parcelIds.length === 0) {
        quickCreateError.value = 'Sélectionnez au moins une parcelle du terrain.';
        return;
      }

      await createContract({
        contractNumber: contractCreateForm.value.contractNumber || undefined,
        customerId: contractCreateForm.value.customerId,
        notes: contractCreateForm.value.notes || undefined,
        terms: contractCreateForm.value.terms || undefined,
        saleAmount: Number(contractCreateForm.value.saleAmount) || contractSelectedParcelsTotal.value,
        parcelIds: contractCreateForm.value.parcelIds,
      });
    }

    if (quickCreateType.value === 'document') {
      if (!documentCreateForm.value.file && !documentCreateForm.value.name.trim()) {
        quickCreateError.value = 'Le nom du document est requis si aucun fichier n\'est uploadé.';
        return;
      }

      if (documentCreateForm.value.file) {
        const payload = new FormData();
        payload.append('file', documentCreateForm.value.file);
        payload.append('name', documentCreateForm.value.name.trim() || documentCreateForm.value.file.name);
        payload.append('type', documentCreateForm.value.type);
        payload.append('terrainId', terrain.value.id);
        await uploadDocument(payload);
      } else {
        const createdDocument = await createDocument({
          name: documentCreateForm.value.name.trim(),
          type: documentCreateForm.value.type,
        });
        if (createdDocument?.id) {
          await linkDocument(createdDocument.id, 'terrain', terrain.value.id);
        }
      }
    }

    const [updatedTerrain, docs] = await Promise.all([
      fetchTerrain(terrain.value.id),
      fetchDocuments(),
    ]);
    terrain.value = updatedTerrain;
    availableDocuments.value = docs;
    closeQuickCreateModal();
  } catch (error) {
    console.error('Erreur création rapide:', error);
    quickCreateError.value = parseApiError(error, 'Erreur lors de la création.');
  } finally {
    quickCreateSaving.value = false;
  }
}

const shouldShowContractFields = computed(() => !!parcelForm.value.customerId);

function openAddParcel() {
  closeAddMenu();
  editingParcelId.value = null;
  parcelModalError.value = null;
  parcelForm.value = {
    label: '',
    areaSqm: '',
    pricePerSqm: '',
    status: 'AVAILABLE',
    customerId: '',
    ownerName: '',
    contractNumber: '',
    contractTerms: '',
    contractNotes: '',
  };
  showParcelModal.value = true;
}

function openEditParcel(parcel: any) {
  editingParcelId.value = parcel.id;
  parcelModalError.value = null;
  parcelForm.value = {
    label: parcel.label || '',
    areaSqm: parcel.areaSqm || '',
    pricePerSqm: parcel.pricePerSqm || '',
    status: parcel.status || 'AVAILABLE',
    customerId: parcel.customerId || parcel.customer?.id || '',
    ownerName: parcel.ownerName || '',
    contractNumber: parcel.contract?.contractNumber || '',
    contractTerms: parcel.contract?.terms || '',
    contractNotes: parcel.contract?.notes || '',
  };
  showParcelModal.value = true;
}

function closeParcelModal() {
  showParcelModal.value = false;
  editingParcelId.value = null;
  parcelModalError.value = null;
}

async function ensureContractForCustomer(customerId: string, saleAmount: number, currentParcel?: any): Promise<string> {
  if (currentParcel?.contractId && currentParcel.customerId === customerId) {
    return currentParcel.contractId;
  }

  const contract = await createContract({
    customerId,
    contractNumber: parcelForm.value.contractNumber || undefined,
    terms: parcelForm.value.contractTerms || undefined,
    notes: parcelForm.value.contractNotes || undefined,
    saleAmount,
    parcelIds: [],
  });

  return contract.id;
}

async function handleParcelSave() {
  parcelModalError.value = null;
  if (!parcelForm.value.label.trim()) {
    parcelModalError.value = 'Le nom de la parcelle est requis.';
    return;
  }

  if (parcelForm.value.status === 'SOLD' && !parcelForm.value.customerId) {
    parcelModalError.value = 'Une vente nécessite un acheteur et un contrat. Sélectionnez un acheteur.';
    return;
  }

  parcelSaving.value = true;
  try {
    const area = Number(parcelForm.value.areaSqm) || 0;
    const price = Number(parcelForm.value.pricePerSqm) || 0;
    const saleAmount = area * price;
    const selectedParcel = editingParcelId.value
      ? terrain.value?.parcels?.find((p: any) => p.id === editingParcelId.value)
      : null;

    let contractId: string | null = null;
    const hasBuyer = !!parcelForm.value.customerId;
    if (hasBuyer) {
      contractId = await ensureContractForCustomer(parcelForm.value.customerId, saleAmount, selectedParcel);
    }

    const finalStatus = hasBuyer ? 'SOLD' : 'AVAILABLE';

    const payload = {
      label: parcelForm.value.label,
      areaSqm: area,
      pricePerSqm: price,
      status: finalStatus,
      customerId: hasBuyer ? parcelForm.value.customerId : null,
      contractId,
      ownerName: parcelForm.value.ownerName || null,
    };

    if (editingParcelId.value) {
      // UPDATE
      await updateParcel(editingParcelId.value, payload);
    } else {
      // CREATE
      await createParcel({
        ...payload,
        terrainId: terrain.value.id,
        geometry: [[0, 0]], // placeholder geometry
      });
    }
    // Reload terrain to get fresh data
    terrain.value = await fetchTerrain(terrain.value.id);
    closeParcelModal();
  } catch (err) {
    const parsedMessage = parseApiError(err, 'Erreur lors de la sauvegarde de la parcelle.');
    console.error('Erreur sauvegarde parcelle:', {
      error: err,
      parcelId: editingParcelId.value,
      terrainId: terrain.value?.id,
      payload: { ...parcelForm.value },
      terrainArea: terrain.value?.areaSize,
      totalParcelsArea: totalParcelArea.value,
    });
    parcelModalError.value = parsedMessage;
  } finally {
    parcelSaving.value = false;
  }
}

async function handleDeleteParcel(parcel: any) {
  if (!confirm(`Supprimer la parcelle "${parcel.label}" ?`)) return;
  try {
    await deleteParcel(parcel.id);
    terrain.value = await fetchTerrain(terrain.value.id);
  } catch (err) {
    console.error('Erreur suppression parcelle:', err);
    alert('Erreur lors de la suppression de la parcelle');
  }
}

// ========== TERRAIN LOGIC ==========
onMounted(async () => {
  const id = route.params.id as string;
  try {
    const [t, c, docs] = await Promise.all([
      fetchTerrain(id),
      fetchCustomers(),
      fetchDocuments(),
    ]);
    terrain.value = t;
    customers.value = c;
    availableDocuments.value = docs;
    formData.value = { ...terrain.value };
  } catch (err) {
    console.error('Erreur chargement terrain:', err);
  } finally {
    loading.value = false;
  }
});

function startEdit() {
  formData.value = { ...terrain.value };
  isEditing.value = true;
}

function cancelEdit() {
  formData.value = { ...terrain.value };
  isEditing.value = false;
}

async function handleSave() {
  if (!terrain.value) return;
  saving.value = true;
  try {
    const updated = await updateTerrain(terrain.value.id, {
      name: formData.value.name,
      address: formData.value.address,
      latitude: formData.value.latitude,
      longitude: formData.value.longitude,
      mapReference: formData.value.mapReference,
      areaSize: formData.value.areaSize,
      areaUnit: formData.value.areaUnit,
      notes: formData.value.notes,
      ownerId: formData.value.ownerId || null,
    } as any);
    terrain.value = { ...terrain.value, ...updated };
    isEditing.value = false;
  } catch (err) {
    console.error('Erreur mise à jour terrain:', err);
    alert('Erreur lors de l\'enregistrement du terrain');
  } finally {
    saving.value = false;
  }
}

async function handleDelete() {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce terrain ?')) return;
  try {
    await deleteTerrain(terrain.value!.id);
    router.push('/terrains');
  } catch (err) {
    console.error('Erreur suppression terrain:', err);
    alert('Erreur lors de la suppression du terrain');
  }
}

function formatArea(t: any): string {
  if (!t.areaSize) return '—';
  const units: Record<string, string> = { sqm: 'm²', sqft: 'ft²', hectare: 'ha', acre: 'ac' };
  return `${t.areaSize.toLocaleString('fr-FR')} ${units[t.areaUnit] || t.areaUnit}`;
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

// Computed for parcel stats
const totalParcelArea = computed(() => {
  if (!terrain.value?.parcels) return 0;
  return terrain.value.parcels.reduce((sum: number, p: any) => sum + (Number(p.areaSqm) || 0), 0);
});
const availableTerrainArea = computed(() => {
  const terrainArea = Number(terrain.value?.areaSize) || 0;
  if (!terrainArea) return 0;
  return Math.max(terrainArea - totalParcelArea.value, 0);
});
const isTerrainAreaExceeded = computed(() => {
  const terrainArea = Number(terrain.value?.areaSize) || 0;
  if (!terrainArea) return false;
  return totalParcelArea.value > terrainArea;
});
const contractsFromParcels = computed(() => {
  if (!terrain.value?.parcels) return [];

  const contractMap = new Map<string, { id: string; contract: any; parcels: any[]; buyer: any }>();
  for (const parcel of terrain.value.parcels) {
    if (!parcel.contractId || !parcel.contract) continue;
    if (!contractMap.has(parcel.contractId)) {
      contractMap.set(parcel.contractId, {
        id: parcel.contractId,
        contract: parcel.contract,
        parcels: [],
        buyer: parcel.customer || null,
      });
    }
    contractMap.get(parcel.contractId)!.parcels.push(parcel);
  }

  return Array.from(contractMap.values()).sort((a, b) =>
    new Date(b.contract?.createdAt || 0).getTime() - new Date(a.contract?.createdAt || 0).getTime()
  );
});

const linkableDocuments = computed(() => {
  const linkedIds = new Set((terrain.value?.documents || []).map((item: any) => item.documentId));
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

async function handleLinkSelectedDocuments() {
  if (!terrain.value?.id) return;
  if (selectedDocumentIds.value.length === 0) {
    linkDocumentsError.value = 'Sélectionnez au moins un document à lier.';
    return;
  }

  linkingDocuments.value = true;
  linkDocumentsError.value = null;
  try {
    await Promise.all(
      selectedDocumentIds.value.map((documentId) => linkDocument(documentId, 'terrain', terrain.value.id))
    );

    const [updatedTerrain, docs] = await Promise.all([
      fetchTerrain(terrain.value.id),
      fetchDocuments(),
    ]);
    terrain.value = updatedTerrain;
    availableDocuments.value = docs;
    selectedDocumentIds.value = [];
    closeLinkDocumentsModal();
  } catch (error) {
    console.error('Erreur liaison documents terrain:', error);
    linkDocumentsError.value = parseApiError(error, 'Erreur lors de la liaison des documents.');
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

// Distinct buyers for this terrain
const parcelBuyers = computed(() => {
  if (!terrain.value?.parcels) return [];
  const buyerMap = new Map<string, { customer: any; parcels: any[] }>();
  for (const p of terrain.value.parcels) {
    if (p.customer) {
      if (!buyerMap.has(p.customer.id)) {
        buyerMap.set(p.customer.id, { customer: p.customer, parcels: [] });
      }
      buyerMap.get(p.customer.id)!.parcels.push(p);
    }
  }
  return Array.from(buyerMap.values());
});

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
    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner" />
      <p>Chargement du terrain...</p>
    </div>

    <template v-else-if="terrain">
      <header class="page-header">
        <div class="page-header-left">
          <RouterLink to="/terrains" class="back-link">← Retour aux Terrains</RouterLink>
          <h1 class="page-title">
            <span><LandPlot class="h-4 w-4 inline" :stroke-width="1.5" /></span>
            {{ terrain.name }}
          </h1>
          <p class="page-subtitle">{{ terrain.address || 'Aucune adresse spécifiée' }}</p>
        </div>
        <div class="page-actions">
          <div class="action-menu-wrap">
            <button class="btn btn-secondary" @click="toggleAddMenu">
              <Plus class="h-3.5 w-3.5" :stroke-width="1.5" />
              Ajouter
            </button>
            <div v-if="showAddMenu" class="action-menu">
              <button class="action-menu-item" @click="openAddParcel">Parcelle</button>
              <button class="action-menu-item" @click="openQuickCreateModal('customer')">Client</button>
              <button class="action-menu-item" @click="openQuickCreateModal('contract')">Contrat</button>
              <button class="action-menu-item" @click="openQuickCreateModal('document')">Document</button>
            </div>
          </div>
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

      <!-- Tabs -->
      <div class="page-tabs" style="margin-bottom:var(--space-lg); border-bottom:1px solid var(--color-border); display:flex; gap:var(--space-md)">
        <button
          class="tab-btn"
          :class="{ active: currentTab === 'details' }"
          @click="currentTab = 'details'"
        >
          Détails & Liste
        </button>
        <button
          class="tab-btn"
          :class="{ active: currentTab === 'visual' }"
          @click="currentTab = 'visual'"
        >
          Plan & Carte
        </button>
      </div>

      <!-- Detail Tab Content -->
      <div v-if="currentTab === 'details'">
      <div class="detail-content">
        <!-- Basic Info -->
        <div class="detail-section">
          <h2 class="section-title">Informations de base</h2>
          <template v-if="isEditing">
            <div style="display:flex;flex-direction:column;gap:var(--space-md)">
              <div class="form-group">
                <label class="form-label">Nom</label>
                <input type="text" class="input" v-model="formData.name" />
              </div>
              <div class="form-group">
                <label class="form-label">Adresse</label>
                <input type="text" class="input" v-model="formData.address" />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Surface</label>
                  <input type="number" class="input" v-model.number="formData.areaSize" step="0.01" />
                </div>
                <div class="form-group">
                  <label class="form-label">Unité</label>
                  <select class="input" v-model="formData.areaUnit">
                    <option value="sqm">Mètres Carrés (m²)</option>
                    <option value="sqft">Pieds Carrés (ft²)</option>
                    <option value="hectare">Hectares</option>
                    <option value="acre">Acres</option>
                  </select>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Latitude</label>
                  <input type="number" class="input" v-model.number="formData.latitude" step="0.0001" />
                </div>
                <div class="form-group">
                  <label class="form-label">Longitude</label>
                  <input type="number" class="input" v-model.number="formData.longitude" step="0.0001" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Référence cadastrale</label>
                <input type="text" class="input" v-model="formData.mapReference" />
              </div>
            </div>
          </template>
          <template v-else>
            <div class="info-grid base-info-grid">
              <div class="info-item">
                <span class="info-label"><Square class="h-4 w-4 inline" :stroke-width="1.5" /> Surface</span>
                <span class="info-value">{{ formatArea(terrain) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label"><AlertCircle class="h-4 w-4 inline" :stroke-width="1.5" /> Surface disponible</span>
                <span class="info-value" :style="{ color: isTerrainAreaExceeded ? '#ef4444' : 'var(--color-text-primary)' }">
                  {{ availableTerrainArea.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) }} m²
                </span>
              </div>
              <div class="info-item">
                <span class="info-label"><LandPlot class="h-4 w-4 inline" :stroke-width="1.5" /> Référence cadastrale</span>
                <span class="info-value">{{ terrain.mapReference || '—' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label"><MapPin class="h-3.5 w-3.5 inline" :stroke-width="1.5" /> Latitude</span>
                <span class="info-value">{{ terrain.latitude ?? '—' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label"><MapPin class="h-3.5 w-3.5 inline" :stroke-width="1.5" /> Longitude</span>
                <span class="info-value">{{ terrain.longitude ?? '—' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label"><MapPin class="h-3.5 w-3.5 inline" :stroke-width="1.5" /> Adresse</span>
                <span class="info-value">{{ terrain.address || '—' }}</span>
              </div>
              <div v-if="terrain.areaSize" class="info-item">
                <span class="info-label"><Square class="h-4 w-4 inline" :stroke-width="1.5" /> Répartition des surfaces</span>
                <span class="info-value" :style="{ color: isTerrainAreaExceeded ? '#ef4444' : 'var(--color-text-secondary)' }">
                  Parcelles : {{ totalParcelArea.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) }} m² / Terrain : {{ Number(terrain.areaSize).toLocaleString('fr-FR', { maximumFractionDigits: 2 }) }} m²
                </span>
              </div>
            </div>
            <div v-if="isTerrainAreaExceeded" style="margin-top:var(--space-sm);padding:var(--space-sm) var(--space-md);border:1px solid rgba(239,68,68,0.4);background:rgba(239,68,68,0.08);border-radius:var(--radius-md);color:#ef4444;font-size:0.9rem;">
              La somme des parcelles dépasse la surface du terrain. Ajustez les surfaces pour revenir dans la limite autorisée.
            </div>
          </template>
        </div>

        <!-- ============================================ -->
        <!-- PARCELS TABLE - Main Section -->
        <!-- ============================================ -->
        <div class="related-sections-grid">
        <div class="detail-section compact-section">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-sm)">
            <h2 class="section-title" style="margin-bottom:0">Parcelles du terrain</h2>
          </div>
          <template v-if="terrain.parcels && terrain.parcels.length > 0">
            <div class="content-section compact-scroll-panel" style="margin-top: var(--space-sm);">
              <table class="table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Surface (m²)</th>
                    <th>Statut</th>
                    <th>Acheteur</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="parcel in terrain.parcels" :key="parcel.id">
                    <td style="font-weight: 600">{{ parcel.label }}</td>
                    <td>{{ parcel.areaSqm?.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) }}</td>
                    <td>
                      <span
                        class="status-badge"
                        :style="{
                          background: `${statusColor(parcel.status)}22`,
                          color: statusColor(parcel.status)
                        }"
                      >
                        {{ statusLabel(parcel.status) }}
                      </span>
                    </td>
                    <td>
                      <RouterLink
                        v-if="parcel.customer"
                        :to="`/clients/${parcel.customer.id}`"
                        class="table-link"
                        style="display: flex; align-items: center; gap: 0.25rem;"
                      >
                        <User class="h-4 w-4 inline" :stroke-width="1.5" /> {{ parcel.customer.name }}
                      </RouterLink>
                      <span v-else-if="parcel.ownerName" style="color:var(--color-text-muted)">
                        {{ parcel.ownerName }}
                      </span>
                      <span v-else style="color:var(--color-text-muted)">—</span>
                    </td>
                    <td>
                      <div style="display:flex;gap:0.25rem">
                        <button
                          class="btn btn-secondary btn-sm"
                          @click="openEditParcel(parcel)"
                          title="Modifier"
                        ><Pencil class="h-3.5 w-3.5" :stroke-width="1.5" /></button>
                        <button
                          class="btn btn-danger btn-sm"
                          @click="handleDeleteParcel(parcel)"
                          title="Supprimer"
                        ><Trash2 class="h-3.5 w-3.5" :stroke-width="1.5" /></button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
          <div v-else class="related-items-empty">
            <span><Square class="h-4 w-4 inline" :stroke-width="1.5" /></span>
            <p>Aucune parcelle définie pour ce terrain</p>
            <button class="btn btn-primary" @click="openAddParcel">+ Ajouter la première parcelle</button>
          </div>
        </div>

        <!-- ============================================ -->
        <!-- BUYERS LIST -->
        <!-- ============================================ -->
        <div class="detail-section compact-section" v-if="parcelBuyers.length > 0">
          <h2 class="section-title">Acheteurs de parcelles</h2>
          <div class="related-items compact-scroll-panel">
            <RouterLink
              v-for="buyer in parcelBuyers"
              :key="buyer.customer.id"
              :to="`/clients/${buyer.customer.id}`"
              class="related-item"
            >
              <component :is="buyer.customer.type === 'individual' ? User : Building2" class="h-4 w-4 inline" :stroke-width="1.5" />
              <div style="flex:1">
                <div style="font-weight:600">{{ buyer.customer.name }}</div>
                <div style="font-size:0.8125rem;color:var(--color-text-muted)">
                  {{ buyer.parcels.length }} parcelle{{ buyer.parcels.length > 1 ? 's' : '' }} achetée{{ buyer.parcels.length > 1 ? 's' : '' }}
                  — Total: {{ formatPrice(buyer.parcels.reduce((sum: number, p: any) => sum + (p.totalPrice || 0), 0)) }}
                </div>
              </div>
            </RouterLink>
          </div>
        </div>

        <!-- Contracts -->
        <div class="detail-section compact-section">
          <h2 class="section-title">Contrats de vente</h2>
          <template v-if="contractsFromParcels.length > 0">
            <div class="related-items compact-scroll-panel">
              <RouterLink
                v-for="ct in contractsFromParcels"
                :key="ct.id"
                :to="`/contrats/${ct.id}`"
                class="related-item"
              >
                <span><FileText class="h-4 w-4 inline" :stroke-width="1.5" /></span>
                <div style="flex:1">
                  <div style="font-weight:600">
                    Contrat {{ ct.contract?.contractNumber || `#${ct.id.slice(0, 8)}` }}
                  </div>
                  <div style="font-size:0.8125rem;color:var(--color-text-muted)">
                    {{ formatDate(ct.contract?.createdAt) }}
                    — Acheteur : {{ ct.buyer?.name || ct.contract?.customer?.name || '—' }}
                    — {{ ct.parcels.length }} parcelle{{ ct.parcels.length > 1 ? 's' : '' }}
                  </div>
                </div>
              </RouterLink>
            </div>
          </template>
          <div v-else class="related-items-empty">
            <span><FileText class="h-4 w-4 inline" :stroke-width="1.5" /></span>
            <p>Aucun contrat lié</p>
            <RouterLink to="/contrats/nouveau" class="btn btn-secondary btn-sm">
              + Créer un Contrat
            </RouterLink>
          </div>
        </div>

        <!-- Documents -->
        <div class="detail-section compact-section">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:var(--space-md);margin-bottom:var(--space-sm)">
            <h2 class="section-title" style="margin-bottom:0">Documents & Images</h2>
            <div style="display:flex;align-items:center;gap:var(--space-sm)">
              <RouterLink
                :to="{ path: '/documents/nouveau', query: { terrainId: terrain.id } }"
                class="btn btn-secondary btn-sm"
              >
                <Plus class="h-3.5 w-3.5" :stroke-width="1.5" />
                Ajouter document
              </RouterLink>
              <button class="btn btn-secondary btn-sm" @click="openLinkDocumentsModal">
                Lier documents
              </button>
            </div>
          </div>
          <template v-if="terrain.documents && terrain.documents.length > 0">
            <div class="related-items compact-scroll-panel">
              <div
                v-for="td in terrain.documents"
                :key="td.documentId"
                class="related-item"
                style="cursor:default"
              >
                <File class="h-4 w-4 inline" :stroke-width="1.5" />
                <div style="flex:1">
                  <div style="font-weight:600">{{ td.document?.name || 'Document' }}</div>
                  <div style="font-size:0.8125rem;color:var(--color-text-muted)">
                    {{ td.document?.type || 'autre' }}
                    <template v-if="td.document?.sizeBytes">
                      — {{ (td.document.sizeBytes / 1024).toFixed(1) }} Ko
                    </template>
                  </div>
                </div>
                <a
                  v-if="td.document?.googleDriveId"
                  :href="`https://drive.google.com/file/d/${td.document.googleDriveId}/view`"
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
            <span><File class="h-4 w-4 inline" :stroke-width="1.5" /></span>
            <p>Aucun document associé</p>
          </div>

        </div>
        </div>

        <!-- Notes -->
        <div class="detail-section">
          <h2 class="section-title">Notes</h2>
          <template v-if="isEditing">
            <div class="form-group">
              <textarea class="input textarea" v-model="formData.notes" rows="4" placeholder="Notes supplémentaires..." />
            </div>
          </template>
          <template v-else>
            <p style="color:var(--color-text-secondary);font-size:0.9375rem;white-space:pre-wrap">
              {{ terrain.notes || 'Pas de notes' }}
            </p>
          </template>
        </div>

        <!-- Meta -->
        <div class="detail-meta">
          <span>Créé le : {{ new Date(terrain.createdAt).toLocaleString('fr-FR') }}</span>
          <span>Mis à jour le : {{ new Date(terrain.updatedAt).toLocaleString('fr-FR') }}</span>
        </div>
      </div>
      </div> <!-- End details tab -->

      <!-- Visual Tab -->
      <div v-if="currentTab === 'visual'" style="margin-top:var(--space-md)">
         <TerrainEditorView :embedded="true" />      </div>
    </template>

    <div v-else class="empty-state">
      <span class="empty-state-icon"><XCircle class="h-12 w-12 text-destructive" :stroke-width="1.5" /></span>
      <p class="empty-state-title">Terrain introuvable</p>
      <RouterLink to="/terrains" class="btn btn-primary">Retour aux Terrains</RouterLink>
    </div>

    <!-- ============================================ -->
    <!-- PARCEL ADD/EDIT MODAL -->
    <!-- ============================================ -->
    <Teleport to="body">
      <div v-if="showLinkDocumentsModal" class="modal-overlay" @click.self="closeLinkDocumentsModal">
        <div class="modal-container" style="max-width:760px;">
          <div class="modal-header">
            <h2 class="modal-title"><FileText class="h-4 w-4" :stroke-width="1.5" /> Lier des documents</h2>
            <button class="modal-close" @click="closeLinkDocumentsModal">✕</button>
          </div>
          <div class="modal-body">
            <p style="margin:0;color:var(--color-text-muted);font-size:0.875rem;">
              Sélectionnez les documents existants à lier à ce terrain.
            </p>
            <div v-if="linkableDocuments.length > 0" style="display:flex;flex-direction:column;gap:0.35rem;max-height:300px;overflow:auto;border:1px solid var(--color-border);border-radius:var(--radius-md);padding:var(--space-sm);">
              <label v-for="doc in linkableDocuments" :key="doc.id" style="display:flex;align-items:center;gap:0.5rem;font-size:0.875rem;">
                <input
                  type="checkbox"
                  :checked="selectedDocumentIds.includes(doc.id)"
                  @change="toggleDocumentSelection(doc.id, ($event.target as HTMLInputElement).checked)"
                />
                <span>{{ doc.name }}</span>
              </label>
            </div>
            <p v-else style="margin:0;color:var(--color-text-muted);font-size:0.8125rem;">Aucun document disponible à lier.</p>

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

      <div v-if="showQuickCreateModal" class="modal-overlay" @click.self="closeQuickCreateModal">
        <div class="modal-container" style="max-width:760px;">
          <div class="modal-header">
            <h2 class="modal-title">
              <template v-if="quickCreateType === 'customer'"><Plus class="h-3.5 w-3.5" :stroke-width="1.5" /> Nouveau client</template>
              <template v-else-if="quickCreateType === 'contract'"><Plus class="h-3.5 w-3.5" :stroke-width="1.5" /> Nouveau contrat</template>
              <template v-else><Plus class="h-3.5 w-3.5" :stroke-width="1.5" /> Nouveau document</template>
            </h2>
            <button class="modal-close" @click="closeQuickCreateModal">✕</button>
          </div>
          <div class="modal-body">
            <template v-if="quickCreateType === 'customer'">
              <div class="form-group">
                <label class="form-label">Nom complet *</label>
                <input type="text" class="input" v-model="customerCreateForm.name" placeholder="ex : Mohamed Ben Ali" autofocus />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Email</label>
                  <input type="email" class="input" v-model="customerCreateForm.email" placeholder="email@exemple.com" />
                </div>
                <div class="form-group">
                  <label class="form-label">Téléphone</label>
                  <input type="tel" class="input" v-model="customerCreateForm.phone" placeholder="+216 12 345 678" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Adresse</label>
                <input type="text" class="input" v-model="customerCreateForm.address" placeholder="Adresse complète" />
              </div>
              <div class="form-group">
                <label class="form-label">CIN / Identifiant</label>
                <input type="text" class="input" v-model="customerCreateForm.idNumber" placeholder="CIN, Passeport..." />
              </div>
              <div class="form-group">
                <label class="form-label">Notes</label>
                <textarea class="input textarea" v-model="customerCreateForm.notes" rows="3" />
              </div>
              <p style="margin:0;color:var(--color-text-muted);font-size:0.8125rem;">
                Le client sera disponible immédiatement pour la création de parcelles/contrats sur ce terrain.
              </p>
            </template>

            <template v-else-if="quickCreateType === 'contract'">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">N° contrat</label>
                  <input type="text" class="input" v-model="contractCreateForm.contractNumber" placeholder="CTR-2026-001" autofocus />
                </div>
                <div class="form-group">
                  <label class="form-label">Montant vente (TND)</label>
                  <input type="number" class="input" v-model="contractCreateForm.saleAmount" step="0.01" placeholder="Auto si vide" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Client *</label>
                <select class="input" v-model="contractCreateForm.customerId">
                  <option value="">Sélectionner un client</option>
                  <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Parcelles du terrain *</label>
                <div style="display:flex;flex-direction:column;gap:0.35rem;max-height:220px;overflow:auto;border:1px solid var(--color-border);border-radius:var(--radius-md);padding:var(--space-sm);">
                  <label v-for="parcel in contractEligibleParcels" :key="parcel.id" style="display:flex;align-items:center;gap:0.5rem;font-size:0.875rem;">
                    <input
                      type="checkbox"
                      :checked="contractCreateForm.parcelIds.includes(parcel.id)"
                      @change="toggleContractParcelSelection(parcel.id, ($event.target as HTMLInputElement).checked)"
                    />
                    <span>
                      {{ parcel.label }} — {{ formatPrice(parcel.totalPrice) }}
                    </span>
                  </label>
                  <p v-if="contractEligibleParcels.length === 0" style="margin:0;color:var(--color-text-muted);font-size:0.8125rem;">
                    Aucune parcelle disponible pour un nouveau contrat.
                  </p>
                </div>
                <p style="margin:var(--space-xs) 0 0 0;color:var(--color-text-muted);font-size:0.8125rem;">
                  Total sélectionné: {{ formatPrice(contractSelectedParcelsTotal) }}
                </p>
              </div>
              <div class="form-group">
                <label class="form-label">Conditions</label>
                <textarea class="input textarea" v-model="contractCreateForm.terms" rows="2" />
              </div>
              <div class="form-group">
                <label class="form-label">Notes</label>
                <textarea class="input textarea" v-model="contractCreateForm.notes" rows="2" />
              </div>
            </template>

            <template v-else>
              <div class="form-group">
                <label class="form-label">Fichier (optionnel)</label>
                <label class="upload-box">
                  <span>{{ documentCreateForm.file ? documentCreateForm.file.name : 'Choisir un fichier' }}</span>
                  <input type="file" class="sr-only" @change="handleQuickDocumentFileChange" />
                </label>
              </div>
              <div class="form-group">
                <label class="form-label">Nom du document</label>
                <input type="text" class="input" v-model="documentCreateForm.name" placeholder="Nom du document" autofocus />
              </div>
              <div class="form-group">
                <label class="form-label">Type</label>
                <select class="input" v-model="documentCreateForm.type">
                  <option value="other">Autre</option>
                  <option value="terrain_image">Image Terrain</option>
                  <option value="satellite">Image Satellite</option>
                  <option value="contract">Contrat</option>
                  <option value="identity">Identité (ID)</option>
                </select>
              </div>
              <p style="margin:0;color:var(--color-text-muted);font-size:0.8125rem;">
                Le document sera lié automatiquement à ce terrain.
              </p>
            </template>

            <div v-if="quickCreateError" style="padding:var(--space-sm);border:1px solid rgba(239,68,68,0.4);background:rgba(239,68,68,0.08);border-radius:var(--radius-md);color:#ef4444;font-size:0.8125rem;white-space:pre-wrap;">
              {{ quickCreateError }}
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeQuickCreateModal">Annuler</button>
            <button class="btn btn-primary" :disabled="quickCreateSaving" @click="handleQuickCreateSubmit">
              {{ quickCreateSaving ? 'Enregistrement...' : 'Créer' }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="showParcelModal" class="modal-overlay" @click.self="closeParcelModal">
        <div class="modal-container">
          <div class="modal-header">
            <h2 class="modal-title">
              <template v-if="editingParcelId"><Pencil class="h-3.5 w-3.5" :stroke-width="1.5" /> Modifier la parcelle</template>
              <template v-else><Plus class="h-3.5 w-3.5" :stroke-width="1.5" /> Nouvelle parcelle</template>
            </h2>
            <button class="modal-close" @click="closeParcelModal">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Nom de la parcelle *</label>
              <input
                type="text"
                class="input"
                v-model="parcelForm.label"
                placeholder="ex : Parcelle A1"
                autofocus
              />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Surface (m²)</label>
                <input
                  type="number"
                  class="input"
                  v-model="parcelForm.areaSqm"
                  step="0.01"
                  placeholder="0"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Prix / m² (TND)</label>
                <input
                  type="number"
                  class="input"
                  v-model="parcelForm.pricePerSqm"
                  step="0.01"
                  placeholder="0"
                />
              </div>
            </div>
            <div class="form-group" style="margin-top:var(--space-xs);">
              <div style="display:flex;justify-content:space-between;font-size:0.875rem;color:var(--color-text-muted);padding:var(--space-xs) 0;">
                <span>Prix total estimé :</span>
                <span style="font-weight:700;color:var(--color-text-primary)">
                  {{ formatPrice((Number(parcelForm.areaSqm) || 0) * (Number(parcelForm.pricePerSqm) || 0)) }}
                </span>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Statut</label>
                <select class="input" v-model="parcelForm.status">
                  <option value="AVAILABLE">Disponible</option>
                  <option value="SOLD">Vendue</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Acheteur (client)</label>
              <select class="input" v-model="parcelForm.customerId">
                <option value="">— Aucun acheteur —</option>
                <option v-for="c in customers" :key="c.id" :value="c.id">
                  {{ c.name }}
                </option>
              </select>
            </div>

            <div v-if="shouldShowContractFields" class="form-group" style="margin-top:var(--space-md);padding:var(--space-md);border:1px solid var(--color-border);border-radius:var(--radius-md);background:var(--color-bg-card)">
              <label class="form-label" style="margin-bottom:var(--space-sm)">Détails du contrat (vente)</label>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">N° contrat</label>
                  <input type="text" class="input" v-model="parcelForm.contractNumber" placeholder="ex: CTR-2026-001" />
                </div>
                <div class="form-group">
                  <label class="form-label">Montant estimé</label>
                  <input
                    type="text"
                    class="input"
                    :value="formatPrice((Number(parcelForm.areaSqm) || 0) * (Number(parcelForm.pricePerSqm) || 0))"
                    readonly
                  />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Conditions</label>
                <textarea class="input textarea" v-model="parcelForm.contractTerms" rows="2" placeholder="Conditions du contrat (optionnel)" />
              </div>
              <div class="form-group">
                <label class="form-label">Notes contrat</label>
                <textarea class="input textarea" v-model="parcelForm.contractNotes" rows="2" placeholder="Notes (optionnel)" />
              </div>
            </div>

            <div v-if="parcelModalError" style="margin-top:var(--space-sm);padding:var(--space-sm) var(--space-md);border:1px solid rgba(239,68,68,0.4);background:rgba(239,68,68,0.08);border-radius:var(--radius-md);color:#ef4444;font-size:0.875rem;white-space:pre-wrap;">
              {{ parcelModalError }}
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeParcelModal">Annuler</button>
            <button class="btn btn-primary" @click="handleParcelSave" :disabled="parcelSaving">
              {{ parcelSaving ? 'Enregistrement...' : (editingParcelId ? 'Mettre à jour' : 'Créer Parcelle') }}
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
  animation: fadeIn 0.15s ease;
}

.modal-container {
  background: var(--color-bg-secondary, #1a1f2e);
  border: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
  border-radius: 16px;
  width: 90%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  animation: slideUp 0.2s ease;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-lg, 1.5rem);
  border-bottom: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  color: var(--color-text-muted, #999);
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  transition: all 0.15s;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--color-text-primary, #fff);
}

.modal-body {
  padding: var(--space-lg, 1.5rem);
  display: flex;
  flex-direction: column;
  gap: var(--space-md, 1rem);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm, 0.5rem);
  padding: var(--space-lg, 1.5rem);
  border-top: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
}

.action-menu-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.page-actions {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.action-menu {
  position: absolute;
  top: calc(100% + 0.4rem);
  right: 0;
  min-width: 180px;
  display: flex;
  flex-direction: column;
  padding: 0.35rem;
  background: var(--color-bg-secondary, #1a1f2e);
  border: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
  border-radius: var(--radius-md);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
  z-index: 20;
}

.action-menu-item {
  border: none;
  background: transparent;
  color: var(--color-text-primary);
  text-align: left;
  font-size: 0.875rem;
  padding: 0.5rem 0.65rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.action-menu-item:hover {
  background: var(--color-bg-card, rgba(255, 255, 255, 0.06));
}

.base-info-grid {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.related-sections-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-md);
}

.compact-section {
  min-height: 360px;
}

.compact-scroll-panel {
  max-height: 320px;
  overflow: auto;
}

.upload-box {
  border: 1px dashed var(--border, var(--color-border));
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
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

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>
