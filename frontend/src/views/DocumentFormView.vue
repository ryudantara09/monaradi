<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  createDocument,
  uploadDocument,
  fetchTerrains,
  fetchCustomers,
  fetchParcels,
  fetchContracts,
  linkDocument,
} from '@/services/api';
import { Upload } from '@/lib/icons';

interface SelectOption {
  id: string;
  label: string;
}

interface SelectedEntities {
  terrains: string[];
  customers: string[];
  parcels: string[];
  contracts: string[];
}

const route = useRoute();
const router = useRouter();
const saving = ref(false);
const submitError = ref<string | null>(null);
const loadingEntities = ref(true);

const terrains = ref<SelectOption[]>([]);
const customers = ref<SelectOption[]>([]);
const parcels = ref<SelectOption[]>([]);
const contracts = ref<SelectOption[]>([]);

const formData = ref({
  name: '',
  type: 'other',
  file: null as File | null,
});

const selectedEntities = ref<SelectedEntities>({
  terrains: [],
  customers: [],
  parcels: [],
  contracts: [],
});

onMounted(async () => {
  await loadEntities();
  applyRoutePreselection();
});

async function loadEntities() {
  loadingEntities.value = true;
  try {
    const [terrainsData, customersData, parcelsData, contractsData] = await Promise.all([
      fetchTerrains(),
      fetchCustomers(),
      fetchParcels(),
      fetchContracts(),
    ]);

    terrains.value = terrainsData.map((terrain: any) => ({
      id: terrain.id,
      label: terrain.name,
    }));

    customers.value = customersData.map((customer: any) => ({
      id: customer.id,
      label: customer.name,
    }));

    parcels.value = parcelsData.map((parcel: any) => ({
      id: parcel.id,
      label: parcel.label,
    }));

    contracts.value = contractsData.map((contract: any) => ({
      id: contract.id,
      label: contract.contractNumber || `Contrat ${contract.id.slice(0, 8)}`,
    }));
  } catch (error) {
    console.error('Erreur chargement entités:', error);
  } finally {
    loadingEntities.value = false;
  }
}

function getRouteQueryValue(key: string): string | null {
  const queryValue = route.query[key];
  if (Array.isArray(queryValue)) {
    return queryValue[0] || null;
  }
  return typeof queryValue === 'string' ? queryValue : null;
}

function addSelectedUnique(bucket: keyof SelectedEntities, id: string | null) {
  if (!id) return;
  if (!selectedEntities.value[bucket].includes(id)) {
    selectedEntities.value[bucket].push(id);
  }
}

function applyRoutePreselection() {
  addSelectedUnique('terrains', getRouteQueryValue('terrainId'));
  addSelectedUnique('customers', getRouteQueryValue('customerId'));
  addSelectedUnique('parcels', getRouteQueryValue('parcelId'));
  addSelectedUnique('contracts', getRouteQueryValue('contractId'));
}

function toggleSelection(bucket: keyof SelectedEntities, id: string, checked: boolean) {
  if (checked) {
    addSelectedUnique(bucket, id);
    return;
  }

  selectedEntities.value[bucket] = selectedEntities.value[bucket].filter((itemId) => itemId !== id);
}

function isChecked(bucket: keyof SelectedEntities, id: string): boolean {
  return selectedEntities.value[bucket].includes(id);
}

async function linkCreatedDocument(documentId: string) {
  const jobs: Promise<void>[] = [];

  for (const terrainId of selectedEntities.value.terrains) {
    jobs.push(linkDocument(documentId, 'terrain', terrainId));
  }
  for (const customerId of selectedEntities.value.customers) {
    jobs.push(linkDocument(documentId, 'customer', customerId));
  }
  for (const parcelId of selectedEntities.value.parcels) {
    jobs.push(linkDocument(documentId, 'parcel', parcelId));
  }
  for (const contractId of selectedEntities.value.contracts) {
    jobs.push(linkDocument(documentId, 'contract', contractId));
  }

  if (jobs.length > 0) {
    await Promise.all(jobs);
  }
}

function parseApiError(error: any, fallback: string): string {
  return error?.response?.data?.error || fallback;
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0] || null;
  formData.value.file = file;
  if (file && !formData.value.name.trim()) {
    formData.value.name = file.name;
  }
}

async function handleSubmit() {
  submitError.value = null;

  if (!formData.value.file && !formData.value.name.trim()) {
    submitError.value = 'Le nom du document est requis si aucun fichier n\'est uploadé.';
    return;
  }

  saving.value = true;
  try {
    let createdDocument: any;

    if (formData.value.file) {
      const payload = new FormData();
      payload.append('file', formData.value.file);
      payload.append('name', formData.value.name.trim() || formData.value.file.name);
      payload.append('type', formData.value.type);
      createdDocument = await uploadDocument(payload);
    } else {
      createdDocument = await createDocument({
        name: formData.value.name.trim(),
        type: formData.value.type,
      });
    }

    if (createdDocument?.id) {
      await linkCreatedDocument(createdDocument.id);
    }

    router.push('/documents');
  } catch (error) {
    console.error('Erreur création document:', error);
    submitError.value = parseApiError(error, 'Erreur lors de la création du document.');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="animate-fade-in">
    <header class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">Nouveau document</h1>
        <p class="page-subtitle">Ajoutez un document avec ou sans fichier</p>
      </div>
    </header>

    <form @submit.prevent="handleSubmit" style="display:flex;flex-direction:column;gap:var(--space-lg);max-width:800px">
      <div class="form-section">
        <h2 class="form-section-title">Informations du document</h2>

        <div class="form-group">
          <label class="form-label">Fichier (optionnel)</label>
          <label class="upload-box">
            <Upload class="h-5 w-5" :stroke-width="1.5" />
            <span>{{ formData.file ? formData.file.name : 'Choisir un fichier à uploader' }}</span>
            <input type="file" class="sr-only" @change="handleFileChange" />
          </label>
        </div>

        <div class="form-group">
          <label class="form-label" for="name">Nom du document</label>
          <input
            id="name"
            type="text"
            class="input"
            v-model="formData.name"
            placeholder="Nom du document"
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="type">Type de document</label>
          <select id="type" class="input" v-model="formData.type">
            <option value="other">Autre</option>
            <option value="terrain_image">Image Terrain</option>
            <option value="satellite">Image Satellite</option>
            <option value="contract">Contrat</option>
            <option value="identity">Identité (ID)</option>
          </select>
        </div>

        <div
          v-if="submitError"
          style="margin-top:var(--space-sm);padding:var(--space-sm) var(--space-md);border:1px solid rgba(239,68,68,0.4);background:rgba(239,68,68,0.08);border-radius:var(--radius-md);color:#ef4444;font-size:0.875rem;white-space:pre-wrap;"
        >
          {{ submitError }}
        </div>
      </div>

      <div class="form-section">
        <h2 class="form-section-title">Lier à des entités</h2>
        <p style="color:var(--muted-foreground);margin:0 0 var(--space-md) 0;font-size:0.875rem;">
          Sélectionnez les entités liées à ce document. Les catégories sont séparées pour faciliter la sélection.
        </p>

        <div v-if="loadingEntities" class="loading-state" style="padding: var(--space-md) 0;">
          <div class="loading-spinner" />
          <p>Chargement des entités...</p>
        </div>

        <div v-else class="entity-groups">
          <div class="entity-group">
            <h3 class="entity-group-title">Terrains</h3>
            <div class="entity-list" v-if="terrains.length > 0">
              <label v-for="item in terrains" :key="item.id" class="entity-item">
                <input
                  type="checkbox"
                  :checked="isChecked('terrains', item.id)"
                  @change="toggleSelection('terrains', item.id, ($event.target as HTMLInputElement).checked)"
                />
                <span>{{ item.label }}</span>
              </label>
            </div>
            <p v-else class="entity-empty">Aucun terrain disponible.</p>
          </div>

          <div class="entity-group">
            <h3 class="entity-group-title">Clients</h3>
            <div class="entity-list" v-if="customers.length > 0">
              <label v-for="item in customers" :key="item.id" class="entity-item">
                <input
                  type="checkbox"
                  :checked="isChecked('customers', item.id)"
                  @change="toggleSelection('customers', item.id, ($event.target as HTMLInputElement).checked)"
                />
                <span>{{ item.label }}</span>
              </label>
            </div>
            <p v-else class="entity-empty">Aucun client disponible.</p>
          </div>

          <div class="entity-group">
            <h3 class="entity-group-title">Parcelles</h3>
            <div class="entity-list" v-if="parcels.length > 0">
              <label v-for="item in parcels" :key="item.id" class="entity-item">
                <input
                  type="checkbox"
                  :checked="isChecked('parcels', item.id)"
                  @change="toggleSelection('parcels', item.id, ($event.target as HTMLInputElement).checked)"
                />
                <span>{{ item.label }}</span>
              </label>
            </div>
            <p v-else class="entity-empty">Aucune parcelle disponible.</p>
          </div>

          <div class="entity-group">
            <h3 class="entity-group-title">Contrats</h3>
            <div class="entity-list" v-if="contracts.length > 0">
              <label v-for="item in contracts" :key="item.id" class="entity-item">
                <input
                  type="checkbox"
                  :checked="isChecked('contracts', item.id)"
                  @change="toggleSelection('contracts', item.id, ($event.target as HTMLInputElement).checked)"
                />
                <span>{{ item.label }}</span>
              </label>
            </div>
            <p v-else class="entity-empty">Aucun contrat disponible.</p>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-secondary" @click="router.push('/documents')">Annuler</button>
        <button type="submit" class="btn btn-primary" :disabled="saving">
          {{ saving ? 'Enregistrement...' : '+ Ajouter Document' }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.upload-box {
  border: 1px dashed var(--border);
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  color: var(--muted-foreground);
  transition: all 0.2s;
}

.upload-box:hover {
  border-color: var(--primary);
  color: var(--foreground);
  background: var(--muted);
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