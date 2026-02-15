<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { fetchContract, deleteContract } from '@/services/api';
import { FileText, Trash2, Hash, Calendar, User, Phone, Users, LandPlot, Image, File, XCircle } from '@/lib/icons';

const route = useRoute();
const router = useRouter();
const contract = ref<any>(null);
const loading = ref(true);

onMounted(async () => {
  const id = route.params.id as string;
  try {
    contract.value = await fetchContract(id);
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
              <span class="info-value">{{ formatDate(contract.startDate) }}</span>
            </div>
          </div>
        </div>

        <!-- Buyer -->
        <div class="detail-section">
          <h2 class="section-title">Acheteur</h2>
          <template v-if="contract.parties && contract.parties.length > 0">
            <div class="related-items">
              <RouterLink
                v-for="(party, i) in contract.parties"
                :key="i"
                :to="`/clients/${party.customerId}`"
                class="related-item"
              >
                <User class="h-4 w-4" :stroke-width="1.5" />
                <div style="flex:1">
                  <div style="font-weight:600">{{ party.customer?.name || '—' }}</div>
                  <div v-if="party.customer?.phone" style="font-size:0.8125rem;color:var(--color-text-muted)">
                    <Phone class="h-3.5 w-3.5 inline" :stroke-width="1.5" /> {{ party.customer.phone }}
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

        <!-- Terrain -->
        <div class="detail-section">
          <h2 class="section-title">Terrain vendu</h2>
          <template v-if="contract.terrains && contract.terrains.length > 0">
            <div class="related-items">
              <RouterLink
                v-for="(ct, i) in contract.terrains"
                :key="i"
                :to="`/terrains/${ct.terrainId}`"
                class="related-item"
              >
                <LandPlot class="h-4 w-4" :stroke-width="1.5" />
                <div style="flex:1">
                  <div style="font-weight:600">{{ ct.terrain?.name || '—' }}</div>
                  <div v-if="ct.terrain?.address" style="font-size:0.8125rem;color:var(--color-text-muted)">
                    {{ ct.terrain.address }}
                  </div>
                </div>
              </RouterLink>
            </div>
          </template>
          <div v-else class="related-items-empty">
            <LandPlot class="h-8 w-8 text-muted-foreground" :stroke-width="1.5" />
            <p>Aucun terrain lié</p>
          </div>
        </div>

        <!-- Documents & Images -->
        <div class="detail-section">
          <h2 class="section-title">Documents & Images</h2>
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
  </div>
</template>
