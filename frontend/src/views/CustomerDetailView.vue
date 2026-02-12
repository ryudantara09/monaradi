<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { fetchCustomer, updateCustomer, deleteCustomer } from '@/services/api';
import type { Customer } from '@/types';

const route = useRoute();
const router = useRouter();
const customer = ref<any>(null);
const isEditing = ref(false);
const saving = ref(false);
const loading = ref(true);

const formData = ref<Partial<Customer>>({});

onMounted(async () => {
  const id = route.params.id as string;
  try {
    customer.value = await fetchCustomer(id);
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

function paymentLabel(status: string): string {
  const labels: Record<string, string> = {
    UNPAID: 'Non payé',
    PARTIAL: 'Partiel',
    PAID: 'Payé',
  };
  return labels[status] || status;
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
            <span>{{ customer.type === 'individual' ? '👤' : '🏢' }}</span>
            {{ customer.name }}
          </h1>
          <p class="page-subtitle">
            Client
          </p>
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

      <!-- Stats bar -->
      <div class="stats-grid" style="margin-bottom: var(--space-lg)">
        <div class="stat-card">
          <div class="stat-icon terrain">📐</div>
          <div class="stat-content">
            <span class="stat-value">{{ totalParcels }}</span>
            <span class="stat-label">Parcelles achetées</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(99,102,241,0.15);color:#6366f1">💰</div>
          <div class="stat-content">
            <span class="stat-value">{{ formatPrice(totalInvestment) }}</span>
            <span class="stat-label">Investissement total</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(16,185,129,0.15);color:#10b981">🗺️</div>
          <div class="stat-content">
            <span class="stat-value">{{ parcelsByTerrain.length }}</span>
            <span class="stat-label">Terrains</span>
          </div>
        </div>
      </div>

      <div class="detail-content">
        <!-- Contact Info -->
        <div class="detail-section">
          <h2 class="section-title">Coordonnées</h2>
          <template v-if="isEditing">
            <div style="display:flex;flex-direction:column;gap:var(--space-md)">
              <div class="form-group">
                <label class="form-label">Nom</label>
                <input type="text" class="input" v-model="formData.name" />
              </div>
              <div class="form-row">
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
            </div>
          </template>
          <template v-else>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">📧 Email</span>
                <span class="info-value">{{ customer.email || '—' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">📞 Téléphone</span>
                <span class="info-value">{{ customer.phone || '—' }}</span>
              </div>
              <div class="info-item full-width">
                <span class="info-label">📍 Adresse</span>
                <span class="info-value">{{ customer.address || '—' }}</span>
              </div>
            </div>
          </template>
        </div>

        <!-- Identification -->
        <div class="detail-section">
          <h2 class="section-title">Identification</h2>
          <template v-if="isEditing">
            <div style="display:flex;flex-direction:column;gap:var(--space-md)">
              <div class="form-group">
                <label class="form-label">
                  Numéro d'identité (CIN)
                </label>
                <input
                  type="text"
                  class="input"
                  v-model="formData.idNumber"
                />
              </div>
            </div>
          </template>
          <template v-else>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">🆔 N° Identité (CIN)</span>
                <span class="info-value">
                  {{ customer.idNumber || '—' }}
                </span>
              </div>
            </div>
          </template>
        </div>

        <!-- ============================================ -->
        <!-- PURCHASED PARCELS -->
        <!-- ============================================ -->
        <div class="detail-section">
          <h2 class="section-title">Parcelles achetées</h2>
          <template v-if="totalParcels > 0">
            <!-- Group by terrain -->
            <div v-for="group in parcelsByTerrain" :key="group.terrain.id" style="margin-bottom: var(--space-lg);">
              <div style="display: flex; align-items: center; gap: var(--space-sm); margin-bottom: var(--space-sm);">
                <span style="font-size: 1.1rem;">🗺️</span>
                <RouterLink
                  v-if="group.terrain.id !== 'unknown'"
                  :to="`/terrains/${group.terrain.id}`"
                  class="table-link"
                  style="font-weight: 600; font-size: 0.9375rem;"
                >
                  {{ group.terrain.name }}
                </RouterLink>
                <span v-else style="font-weight: 600; font-size: 0.9375rem; color: var(--color-text-muted);">
                  {{ group.terrain.name }}
                </span>
                <span class="status-badge" style="background: rgba(99,102,241,0.15); color: #6366f1;">
                  {{ group.parcels.length }} parcelle{{ group.parcels.length > 1 ? 's' : '' }}
                </span>
              </div>
              <div class="content-section">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Surface (m²)</th>
                      <th>Prix/m²</th>
                      <th>Prix Total</th>
                      <th>Statut</th>
                      <th>Paiement</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="parcel in group.parcels" :key="parcel.id">
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
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </template>
          <div v-else class="related-items-empty">
            <span>📐</span>
            <p>Ce client n'a acheté aucune parcelle pour le moment</p>
          </div>
        </div>

        <!-- Contracts -->
        <div class="detail-section">
          <h2 class="section-title">Contrats associés</h2>
          <template v-if="customer.contractParties && customer.contractParties.length > 0">
            <div class="related-items">
              <RouterLink
                v-for="cp in customer.contractParties"
                :key="cp.contractId"
                :to="`/contrats/${cp.contractId}`"
                class="related-item"
              >
                <span>📜</span>
                <div style="flex:1">
                  <div style="font-weight:600">
                    Contrat {{ cp.contract?.contractNumber || `#${cp.contractId.slice(0, 8)}` }}
                  </div>
                  <div style="font-size:0.8125rem;color:var(--color-text-muted)">
                    {{ cp.role === 'buyer' ? 'Acheteur' : (cp.role === 'seller' ? 'Vendeur' : cp.role) }}
                    — {{ formatDate(cp.contract?.startDate) }}
                    <template v-if="cp.contract?.terrains?.length">
                      — Terrain: {{ cp.contract.terrains[0]?.terrain?.name || '—' }}
                    </template>
                  </div>
                </div>
              </RouterLink>
            </div>
          </template>
          <div v-else class="related-items-empty">
            <span>📜</span>
            <p>Aucun contrat associé pour le moment</p>
            <RouterLink to="/contrats/nouveau" class="btn btn-secondary btn-sm">
              + Créer Contrat
            </RouterLink>
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
      <span class="empty-state-icon">❌</span>
      <p class="empty-state-title">Client introuvable</p>
      <RouterLink to="/clients" class="btn btn-primary">Retour aux Clients</RouterLink>
    </div>
  </div>
</template>
