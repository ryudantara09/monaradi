<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { fetchTerrain, updateTerrain, deleteTerrain, fetchCustomers, createParcel, updateParcel, deleteParcel } from '@/services/api';
import TerrainEditorView from '@/views/TerrainEditorView.vue';

const customers = ref<any[]>([]);

const route = useRoute();
const router = useRouter();
const currentTab = ref<'details' | 'visual' | 'documents'>('details');

const terrain = ref<any>(null);
const isEditing = ref(false);
const saving = ref(false);
const loading = ref(true);

const formData = ref<any>({});

// ========== PARCEL MODAL STATE ==========
const showParcelModal = ref(false);
const parcelSaving = ref(false);
const editingParcelId = ref<string | null>(null);
const parcelForm = ref({
  label: '',
  areaSqm: '' as string | number,
  pricePerSqm: '' as string | number,
  status: 'AVAILABLE',
  customerId: '',
  ownerName: '',
});

function openAddParcel() {
  editingParcelId.value = null;
  parcelForm.value = {
    label: '',
    areaSqm: '',
    pricePerSqm: '',
    status: 'AVAILABLE',
    customerId: '',
    ownerName: '',
  };
  showParcelModal.value = true;
}

function openEditParcel(parcel: any) {
  editingParcelId.value = parcel.id;
  parcelForm.value = {
    label: parcel.label || '',
    areaSqm: parcel.areaSqm || '',
    pricePerSqm: parcel.pricePerSqm || '',
    status: parcel.status || 'AVAILABLE',
    customerId: parcel.customerId || parcel.customer?.id || '',
    ownerName: parcel.ownerName || '',
  };
  showParcelModal.value = true;
}

function closeParcelModal() {
  showParcelModal.value = false;
  editingParcelId.value = null;
}

async function handleParcelSave() {
  if (!parcelForm.value.label.trim()) {
    alert('Le nom de la parcelle est requis');
    return;
  }
  parcelSaving.value = true;
  try {
    const area = Number(parcelForm.value.areaSqm) || 0;
    const price = Number(parcelForm.value.pricePerSqm) || 0;

    if (editingParcelId.value) {
      // UPDATE
      await updateParcel(editingParcelId.value, {
        label: parcelForm.value.label,
        areaSqm: area,
        pricePerSqm: price,
        status: parcelForm.value.status,
        customerId: parcelForm.value.customerId || null,
        ownerName: parcelForm.value.ownerName || null,
      });
    } else {
      // CREATE
      await createParcel({
        label: parcelForm.value.label,
        areaSqm: area,
        pricePerSqm: price,
        status: parcelForm.value.status,
        customerId: parcelForm.value.customerId || null,
        ownerName: parcelForm.value.ownerName || null,
        terrainId: terrain.value.id,
        geometry: [[0, 0]], // placeholder geometry
      });
    }
    // Reload terrain to get fresh data
    terrain.value = await fetchTerrain(terrain.value.id);
    closeParcelModal();
  } catch (err) {
    console.error('Erreur sauvegarde parcelle:', err);
    alert('Erreur lors de la sauvegarde de la parcelle');
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
    const [t, c] = await Promise.all([
      fetchTerrain(id),
      fetchCustomers(),
    ]);
    terrain.value = t;
    customers.value = c;
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
const totalParcels = computed(() => terrain.value?.parcels?.length || 0);
const soldParcels = computed(() => terrain.value?.parcels?.filter((p: any) => p.status === 'SOLD')?.length || 0);
const availableParcels = computed(() => terrain.value?.parcels?.filter((p: any) => p.status === 'AVAILABLE')?.length || 0);
const reservedParcels = computed(() => terrain.value?.parcels?.filter((p: any) => p.status === 'RESERVED')?.length || 0);
const totalRevenue = computed(() => {
  if (!terrain.value?.parcels) return 0;
  return terrain.value.parcels
    .filter((p: any) => p.status === 'SOLD')
    .reduce((sum: number, p: any) => sum + (p.totalPrice || 0), 0);
});

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
            <span>🗺️</span>
            {{ terrain.name }}
          </h1>
          <p class="page-subtitle">{{ terrain.address || 'Aucune adresse spécifiée' }}</p>
        </div>
        <div class="page-actions">
          <template v-if="isEditing">
            <button class="btn btn-secondary" @click="cancelEdit">Annuler</button>
            <button class="btn btn-primary" @click="handleSave" :disabled="saving">
              {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
            </button>
          </template>
          <template v-else>
            <button class="btn btn-secondary" @click="startEdit">✏️ Modifier</button>
            <button class="btn btn-danger" @click="handleDelete">🗑️ Supprimer</button>
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
          📝 Détails & Liste
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: currentTab === 'visual' }" 
          @click="currentTab = 'visual'"
        >
          📐 Plan & Carte
        </button>
      </div>

      <!-- Detail Tab Content -->
      <div v-if="currentTab === 'details'">
        <!-- Stats Bar -->
        <div class="stats-grid" style="margin-bottom: var(--space-lg)">
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
            <span class="stat-value">{{ availableParcels }}</span>
            <span class="stat-label">Disponibles</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(239,68,68,0.15);color:#ef4444">🔒</div>
          <div class="stat-content">
            <span class="stat-value">{{ soldParcels }}</span>
            <span class="stat-label">Vendues</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(245,158,11,0.15);color:#f59e0b">⏳</div>
          <div class="stat-content">
            <span class="stat-value">{{ reservedParcels }}</span>
            <span class="stat-label">Réservées</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(99,102,241,0.15);color:#6366f1">💰</div>
          <div class="stat-content">
            <span class="stat-value">{{ formatPrice(totalRevenue) }}</span>
            <span class="stat-label">Revenus</span>
          </div>
        </div>
      </div>

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
            </div>
          </template>
          <template v-else>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">📐 Surface</span>
                <span class="info-value">{{ formatArea(terrain) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">🗺️ Référence cadastrale</span>
                <span class="info-value">{{ terrain.mapReference || '—' }}</span>
              </div>
              <div class="info-item full-width">
                <span class="info-label">📍 Adresse</span>
                <span class="info-value">{{ terrain.address || '—' }}</span>
              </div>
            </div>
          </template>
        </div>

        <!-- Owner -->
        <div class="detail-section">
          <h2 class="section-title">Propriétaire du terrain</h2>
          <template v-if="isEditing">
            <div class="form-group">
              <select class="input" v-model="formData.ownerId">
                <option :value="null">— Aucun propriétaire —</option>
                <option value="">— Aucun propriétaire —</option>
                <option v-for="c in customers" :key="c.id" :value="c.id">
                  {{ c.name }}
                </option>
              </select>
            </div>
          </template>
          <template v-else>
            <div v-if="terrain.owner" class="related-items">
              <RouterLink :to="`/clients/${terrain.owner.id}`" class="related-item">
                <span>👤</span>
                <div style="flex:1">
                  <div style="font-weight:600">{{ terrain.owner.name }}</div>
                  <div v-if="terrain.owner.phone" style="font-size:0.8125rem;color:var(--color-text-muted)">
                    📞 {{ terrain.owner.phone }}
                  </div>
                </div>
              </RouterLink>
            </div>
            <div v-else class="related-items-empty">
              <span>👤</span>
              <p>Aucun propriétaire défini</p>
            </div>
          </template>
        </div>

        <!-- ============================================ -->
        <!-- PARCELS TABLE - Main Section -->
        <!-- ============================================ -->
        <div class="detail-section">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-sm)">
            <h2 class="section-title" style="margin-bottom:0">Parcelles du terrain</h2>
            <button class="btn btn-primary" @click="openAddParcel">
              + Ajouter Parcelle
            </button>
          </div>
          <template v-if="terrain.parcels && terrain.parcels.length > 0">
            <div class="content-section" style="margin-top: var(--space-sm);">
              <table class="table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Surface (m²)</th>
                    <th>Prix/m²</th>
                    <th>Prix Total</th>
                    <th>Statut</th>
                    <th>Paiement</th>
                    <th>Acheteur</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="parcel in terrain.parcels" :key="parcel.id">
                    <td style="font-weight: 600">{{ parcel.label }}</td>
                    <td>{{ parcel.areaSqm?.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) }}</td>
                    <td>{{ formatPrice(parcel.pricePerSqm) }}</td>
                    <td style="font-weight: 600">{{ formatPrice(parcel.totalPrice) }}</td>
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
                      <span
                        class="status-badge"
                        :style="{
                          background: parcel.paymentStatus === 'PAID' ? 'rgba(16,185,129,0.15)' : parcel.paymentStatus === 'PARTIAL' ? 'rgba(245,158,11,0.15)' : 'rgba(107,114,128,0.15)',
                          color: parcel.paymentStatus === 'PAID' ? '#10b981' : parcel.paymentStatus === 'PARTIAL' ? '#f59e0b' : '#6b7280'
                        }"
                      >
                        {{ paymentLabel(parcel.paymentStatus) }}
                      </span>
                    </td>
                    <td>
                      <RouterLink
                        v-if="parcel.customer"
                        :to="`/clients/${parcel.customer.id}`"
                        class="table-link"
                        style="display: flex; align-items: center; gap: 0.25rem;"
                      >
                        👤 {{ parcel.customer.name }}
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
                        >✏️</button>
                        <button
                          class="btn btn-danger btn-sm"
                          @click="handleDeleteParcel(parcel)"
                          title="Supprimer"
                        >🗑️</button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
          <div v-else class="related-items-empty">
            <span>📐</span>
            <p>Aucune parcelle définie pour ce terrain</p>
            <button class="btn btn-primary" @click="openAddParcel">+ Ajouter la première parcelle</button>
          </div>
        </div>

        <!-- ============================================ -->
        <!-- BUYERS LIST -->
        <!-- ============================================ -->
        <div class="detail-section" v-if="parcelBuyers.length > 0">
          <h2 class="section-title">Acheteurs de parcelles</h2>
          <div class="related-items">
            <RouterLink
              v-for="buyer in parcelBuyers"
              :key="buyer.customer.id"
              :to="`/clients/${buyer.customer.id}`"
              class="related-item"
            >
              <span>{{ buyer.customer.type === 'individual' ? '👤' : '🏢' }}</span>
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
        <div class="detail-section">
          <h2 class="section-title">Contrats de vente</h2>
          <template v-if="terrain.contracts && terrain.contracts.length > 0">
            <div class="related-items">
              <RouterLink
                v-for="ct in terrain.contracts"
                :key="ct.contractId"
                :to="`/contrats/${ct.contractId}`"
                class="related-item"
              >
                <span>📜</span>
                <div style="flex:1">
                  <div style="font-weight:600">
                    Contrat {{ ct.contract?.contractNumber || `#${ct.contractId.slice(0, 8)}` }}
                  </div>
                  <div style="font-size:0.8125rem;color:var(--color-text-muted)">
                    {{ formatDate(ct.contract?.startDate) }}
                    <template v-if="ct.contract?.parties?.length">
                      — Acheteur : {{ ct.contract.parties[0]?.customer?.name || '—' }}
                    </template>
                  </div>
                </div>
              </RouterLink>
            </div>
          </template>
          <div v-else class="related-items-empty">
            <span>📜</span>
            <p>Aucun contrat lié</p>
            <RouterLink to="/contrats/nouveau" class="btn btn-secondary btn-sm">
              + Créer un Contrat
            </RouterLink>
          </div>
        </div>

        <!-- Documents -->
        <div class="detail-section">
          <h2 class="section-title">Documents & Images</h2>
          <template v-if="terrain.documents && terrain.documents.length > 0">
            <div class="related-items">
              <div
                v-for="td in terrain.documents"
                :key="td.documentId"
                class="related-item"
                style="cursor:default"
              >
                <span>{{ td.document?.mimeType?.startsWith('image/') ? '🖼️' : '📄' }}</span>
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
            <span>📄</span>
            <p>Aucun document associé</p>
          </div>
        </div>

        <!-- Location -->
        <div class="detail-section">
          <h2 class="section-title">Coordonnées</h2>
          <template v-if="isEditing">
            <div style="display:flex;flex-direction:column;gap:var(--space-md)">
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
                <label class="form-label">Référence cartographique</label>
                <input type="text" class="input" v-model="formData.mapReference" />
              </div>
            </div>
          </template>
          <template v-else>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">📍 Latitude</span>
                <span class="info-value">{{ terrain.latitude ?? '—' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">📍 Longitude</span>
                <span class="info-value">{{ terrain.longitude ?? '—' }}</span>
              </div>
            </div>
          </template>
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
        </div>      </div> <!-- End details tab -->

      <!-- Visual Tab -->
      <div v-if="currentTab === 'visual'" style="margin-top:var(--space-md)">
         <TerrainEditorView :embedded="true" />      </div>
    </template>

    <div v-else class="empty-state">
      <span class="empty-state-icon">❌</span>
      <p class="empty-state-title">Terrain introuvable</p>
      <RouterLink to="/terrains" class="btn btn-primary">Retour aux Terrains</RouterLink>
    </div>

    <!-- ============================================ -->
    <!-- PARCEL ADD/EDIT MODAL -->
    <!-- ============================================ -->
    <Teleport to="body">
      <div v-if="showParcelModal" class="modal-overlay" @click.self="closeParcelModal">
        <div class="modal-container">
          <div class="modal-header">
            <h2 class="modal-title">
              {{ editingParcelId ? '✏️ Modifier la parcelle' : '+ Nouvelle parcelle' }}
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

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>
