<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useParcelsStore } from '@/stores/parcels';
import { useCalibrationStore } from '@/stores/calibration';
import type { ParcelStatus, PaymentStatus } from '@/types';
import { Save, Trash2 } from '@/lib/icons';
import { updateParcel as updateParcelAPI, deleteParcel as deleteParcelAPI } from '@/services/api';

const parcelsStore = useParcelsStore();
const calibrationStore = useCalibrationStore();

const isOpen = computed(() => parcelsStore.selectedParcel !== null);
const parcel = computed(() => parcelsStore.selectedParcel);

// Form state
const form = ref({
  label: '',
  ownerName: '',
  status: 'AVAILABLE' as ParcelStatus,
  pricePerSqm: 0,
  amountPaid: 0,
});

// Track if form has unsaved changes
const hasChanges = ref(false);
const saveMessage = ref<string | null>(null);

// Sync form with selected parcel
watch(parcel, (p) => {
  if (p) {
    form.value = {
      label: p.label,
      ownerName: p.ownerName || '',
      status: p.status,
      pricePerSqm: p.pricePerSqm,
      amountPaid: p.amountPaid || 0,
    };
    hasChanges.value = false;
    saveMessage.value = null;
  }
}, { immediate: true });

// Track form changes
function markChanged() {
  hasChanges.value = true;
  saveMessage.value = null;
}

const totalPrice = computed(() => {
  if (!parcel.value) return 0;
  return parcel.value.areaSqm * form.value.pricePerSqm;
});

const remainingAmount = computed(() => {
  return totalPrice.value - form.value.amountPaid;
});

const paymentStatusComputed = computed((): PaymentStatus => {
  if (form.value.amountPaid >= totalPrice.value && totalPrice.value > 0) {
    return 'PAID';
  } else if (form.value.amountPaid > 0) {
    return 'PARTIAL';
  }
  return 'UNPAID';
});

const paymentStatusLabel = computed(() => {
  switch (paymentStatusComputed.value) {
    case 'PAID': return 'Payé';
    case 'PARTIAL': return 'Partiel';
    case 'UNPAID': return 'Non payé';
  }
});

const paymentStatusColor = computed(() => {
  switch (paymentStatusComputed.value) {
    case 'PAID': return 'text-green-400 bg-green-400/20 border-green-500/30';
    case 'PARTIAL': return 'text-amber-400 bg-amber-400/20 border-amber-500/30';
    case 'UNPAID': return 'text-red-400 bg-red-400/20 border-red-500/30';
  }
});

async function handleSave() {
  if (!parcel.value) return;

  try {
    // Save to database via API
    const updatedParcel = await updateParcelAPI(parcel.value.id, {
      label: form.value.label,
      ownerName: form.value.ownerName || null,
      status: form.value.status,
      pricePerSqm: form.value.pricePerSqm,
      amountPaid: form.value.amountPaid,
      geometry: parcel.value.geometry,
      areaSqm: parcel.value.areaSqm,
    });

    // Update local store with the response from the server
    parcelsStore.updateParcel(parcel.value.id, {
      ...updatedParcel,
      geometry: typeof updatedParcel.geometry === 'string'
        ? JSON.parse(updatedParcel.geometry)
        : updatedParcel.geometry
    });

    hasChanges.value = false;
    saveMessage.value = 'Modifications enregistrées !';

    // Clear save message after 2 seconds
    setTimeout(() => {
      saveMessage.value = null;
    }, 2000);
  } catch (error) {
    console.error('Error saving parcel:', error);
    saveMessage.value = 'Erreur lors de la sauvegarde';
    setTimeout(() => {
      saveMessage.value = null;
    }, 3000);
  }
}

async function handleDelete() {
  if (!parcel.value) return;
  if (confirm('Êtes-vous sûr de vouloir supprimer cette parcelle ?')) {
    try {
      await deleteParcelAPI(parcel.value.id);
      parcelsStore.deleteParcel(parcel.value.id);
    } catch (error) {
      console.error('Error deleting parcel:', error);
      alert('Erreur lors de la suppression de la parcelle');
    }
  }
}

function handleClose() {
  if (hasChanges.value) {
    if (!confirm('Vous avez des modifications non enregistrées. Voulez-vous fermer ?')) {
      return;
    }
  }
  parcelsStore.selectParcel(null);
}

const statusOptions: { value: ParcelStatus; label: string; color: string }[] = [
  { value: 'AVAILABLE', label: 'Disponible', color: 'bg-available' },
  { value: 'SOLD', label: 'Vendue', color: 'bg-sold' },
];

const _paymentOptions: { value: PaymentStatus; label: string }[] = [
  { value: 'UNPAID', label: 'Non payé' },
  { value: 'PARTIAL', label: 'Partiel' },
  { value: 'PAID', label: 'Payé' },
];
void _paymentOptions;
</script>

<template>
  <Transition
    enter-active-class="transition-transform duration-300 ease-out"
    enter-from-class="translate-x-full"
    enter-to-class="translate-x-0"
    leave-active-class="transition-transform duration-300 ease-in"
    leave-from-class="translate-x-0"
    leave-to-class="translate-x-full"
  >
    <div
      v-if="isOpen && parcel"
      class="fixed right-0 top-0 h-full w-96 bg-slate-800 border-l border-slate-700 shadow-2xl overflow-y-auto z-50"
    >
      <!-- Header -->
      <div class="sticky top-0 bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
        <h2 class="text-xl font-semibold text-slate-100">Détails de la Parcelle</h2>
        <button
          class="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          @click="handleClose"
        >
          <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="p-4 space-y-6">
        <!-- Label -->
        <div>
          <label class="block text-sm font-medium text-slate-400 mb-1.5">Libellé</label>
          <input
            v-model="form.label"
            type="text"
            class="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
            @input="markChanged"
          />
        </div>

        <!-- Owner Name -->
        <div>
          <label class="block text-sm font-medium text-slate-400 mb-1.5">Nom du propriétaire</label>
          <input
            v-model="form.ownerName"
            type="text"
            placeholder="Nom du propriétaire"
            class="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary"
            @input="markChanged"
          />
        </div>

        <!-- Status -->
        <div>
          <label class="block text-sm font-medium text-slate-400 mb-1.5">Statut</label>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="option in statusOptions"
              :key="option.value"
              class="px-3 py-2 rounded-lg font-medium text-sm transition-all"
              :class="[
                form.status === option.value
                  ? `${option.color} text-white ring-2 ring-offset-2 ring-offset-slate-800`
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600',
              ]"
              @click="form.status = option.value; markChanged()"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <!-- Divider -->
        <hr class="border-slate-700" />

        <!-- Area (Read-only) -->
        <div>
          <label class="block text-sm font-medium text-slate-400 mb-1.5">Surface</label>
          <div class="px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-300">
            {{ parcel.areaSqm.toFixed(2) }} m²
            <span v-if="!calibrationStore.isCalibrated" class="text-amber-400 text-xs ml-2">
              (Calibrez pour plus de précision)
            </span>
          </div>
        </div>

        <!-- Price per sqm -->
        <div>
          <label class="block text-sm font-medium text-slate-400 mb-1.5">Prix par m²</label>
          <div class="relative">
            <input
              v-model.number="form.pricePerSqm"
              type="number"
              min="0"
              step="0.01"
              class="w-full px-3 pr-14 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
              @input="markChanged"
            />
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">TND</span>
          </div>
        </div>

        <!-- Prix Total -->
        <div>
          <label class="block text-sm font-medium text-slate-400 mb-1.5">Prix Total</label>
          <div class="px-3 py-3 bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/30 rounded-lg">
            <span class="text-2xl font-bold text-primary">
              {{ totalPrice.toLocaleString('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) }} TND
            </span>
          </div>
        </div>

        <!-- Divider -->
        <hr class="border-slate-700" />

        <!-- Amount Paid (Accompte) -->
        <div>
          <label class="block text-sm font-medium text-slate-400 mb-1.5">Montant Payé (Accompte)</label>
          <div class="relative">
            <input
              v-model.number="form.amountPaid"
              type="number"
              min="0"
              :max="totalPrice"
              step="0.001"
              class="w-full px-3 pr-14 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
              @input="markChanged"
            />
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">TND</span>
          </div>
        </div>

        <!-- Payment Status -->
        <div>
          <label class="block text-sm font-medium text-slate-400 mb-1.5">Statut de paiement</label>
          <div :class="`px-3 py-2 border rounded-lg text-center font-medium ${paymentStatusColor}`">
            {{ paymentStatusLabel }}
          </div>
        </div>

        <!-- Remaining Amount -->
        <div v-if="remainingAmount > 0">
          <label class="block text-sm font-medium text-slate-400 mb-1.5">Montant Restant</label>
          <div class="px-3 py-2 bg-amber-600/20 border border-amber-500/30 rounded-lg">
            <span class="text-xl font-bold text-amber-400">
              {{ remainingAmount.toLocaleString('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) }} TND
            </span>
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="sticky bottom-0 bg-slate-800 border-t border-slate-700 p-4 space-y-3">
        <!-- Save Message -->
        <div
          v-if="saveMessage"
          class="px-3 py-2 bg-green-600/20 border border-green-500/30 rounded-lg text-green-400 text-sm text-center"
        >
          ✓ {{ saveMessage }}
        </div>
        
        <!-- Unsaved Changes Indicator -->
        <div
          v-if="hasChanges"
          class="px-3 py-2 bg-amber-600/20 border border-amber-500/30 rounded-lg text-amber-400 text-sm text-center"
        >
          You have unsaved changes
        </div>
        
        <!-- Save Button -->
        <button
          class="w-full px-4 py-2.5 rounded-lg font-medium transition-all"
          :class="hasChanges 
            ? 'bg-primary hover:bg-blue-600 text-white shadow-lg shadow-primary/25' 
            : 'bg-slate-700 text-slate-400 cursor-not-allowed'"
          :disabled="!hasChanges"
          @click="handleSave"
        >
          <Save v-if="hasChanges" class="h-3.5 w-3.5" :stroke-width="1.5" /> {{ hasChanges ? 'Enregistrer' : 'Pas de modifications' }}
        </button>
        
        <!-- Delete Button -->
        <button
          class="w-full px-4 py-2.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg font-medium transition-colors"
          @click="handleDelete"
        >
          <Trash2 class="h-3.5 w-3.5" :stroke-width="1.5" /> Supprimer la Parcelle
        </button>
      </div>
    </div>
  </Transition>
</template>
