<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useParcelsStore } from '@/stores/parcels';
import { useCalibrationStore } from '@/stores/calibration';
import type { ParcelStatus, PaymentStatus } from '@/types';

const parcelsStore = useParcelsStore();
const calibrationStore = useCalibrationStore();

const isOpen = computed(() => parcelsStore.selectedParcel !== null);
const parcel = computed(() => parcelsStore.selectedParcel);

// Form state
const form = ref({
  label: '',
  ownerName: '',
  status: 'AVAILABLE' as ParcelStatus,
  paymentStatus: 'UNPAID' as PaymentStatus,
  pricePerSqm: 0,
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
      paymentStatus: p.paymentStatus,
      pricePerSqm: p.pricePerSqm,
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

function handleSave() {
  if (!parcel.value) return;
  
  parcelsStore.updateParcel(parcel.value.id, {
    label: form.value.label,
    ownerName: form.value.ownerName || null,
    status: form.value.status,
    paymentStatus: form.value.paymentStatus,
    pricePerSqm: form.value.pricePerSqm,
  });
  
  hasChanges.value = false;
  saveMessage.value = 'Changes saved!';
  
  // Clear save message after 2 seconds
  setTimeout(() => {
    saveMessage.value = null;
  }, 2000);
}

function handleDelete() {
  if (!parcel.value) return;
  if (confirm('Are you sure you want to delete this parcel?')) {
    parcelsStore.deleteParcel(parcel.value.id);
  }
}

function handleClose() {
  if (hasChanges.value) {
    if (!confirm('You have unsaved changes. Are you sure you want to close?')) {
      return;
    }
  }
  parcelsStore.selectParcel(null);
}

const statusOptions: { value: ParcelStatus; label: string; color: string }[] = [
  { value: 'AVAILABLE', label: 'Available', color: 'bg-available' },
  { value: 'RESERVED', label: 'Reserved', color: 'bg-reserved' },
  { value: 'SOLD', label: 'Sold', color: 'bg-sold' },
];

const paymentOptions: { value: PaymentStatus; label: string }[] = [
  { value: 'UNPAID', label: 'Unpaid' },
  { value: 'PARTIAL', label: 'Partial' },
  { value: 'PAID', label: 'Paid' },
];
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
        <h2 class="text-xl font-semibold text-slate-100">Parcel Details</h2>
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
          <label class="block text-sm font-medium text-slate-400 mb-1.5">Label</label>
          <input
            v-model="form.label"
            type="text"
            class="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
            @input="markChanged"
          />
        </div>

        <!-- Owner Name -->
        <div>
          <label class="block text-sm font-medium text-slate-400 mb-1.5">Owner Name</label>
          <input
            v-model="form.ownerName"
            type="text"
            placeholder="Enter owner name"
            class="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary"
            @input="markChanged"
          />
        </div>

        <!-- Status -->
        <div>
          <label class="block text-sm font-medium text-slate-400 mb-1.5">Status</label>
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

        <!-- Payment Status -->
        <div>
          <label class="block text-sm font-medium text-slate-400 mb-1.5">Payment Status</label>
          <select
            v-model="form.paymentStatus"
            class="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
            @change="markChanged"
          >
            <option v-for="option in paymentOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>

        <!-- Divider -->
        <hr class="border-slate-700" />

        <!-- Area (Read-only) -->
        <div>
          <label class="block text-sm font-medium text-slate-400 mb-1.5">Area</label>
          <div class="px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-300">
            {{ parcel.areaSqm.toFixed(2) }} m²
            <span v-if="!calibrationStore.isCalibrated" class="text-amber-400 text-xs ml-2">
              (Calibrate for accuracy)
            </span>
          </div>
        </div>

        <!-- Price per sqm -->
        <div>
          <label class="block text-sm font-medium text-slate-400 mb-1.5">Price per m²</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
            <input
              v-model.number="form.pricePerSqm"
              type="number"
              min="0"
              step="0.01"
              class="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
              @input="markChanged"
            />
          </div>
        </div>

        <!-- Total Price (Auto-calculated) -->
        <div>
          <label class="block text-sm font-medium text-slate-400 mb-1.5">Total Price</label>
          <div class="px-3 py-3 bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/30 rounded-lg">
            <span class="text-2xl font-bold text-primary">
              ${{ totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
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
          {{ hasChanges ? '💾 Save Changes' : 'No Changes' }}
        </button>
        
        <!-- Delete Button -->
        <button
          class="w-full px-4 py-2.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg font-medium transition-colors"
          @click="handleDelete"
        >
          🗑️ Delete Parcel
        </button>
      </div>
    </div>
  </Transition>
</template>
