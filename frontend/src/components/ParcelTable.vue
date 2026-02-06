<script setup lang="ts">
import { useParcelsStore } from '@/stores/parcels';
import { useCalibrationStore } from '@/stores/calibration';
import type { Parcel } from '@/types';

const parcelsStore = useParcelsStore();
const calibrationStore = useCalibrationStore();

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

function selectParcel(id: string) {
  parcelsStore.selectParcel(id);
}

const statusColors: Record<string, string> = {
  AVAILABLE: 'bg-green-500/20 text-green-400 border-green-500/30',
  RESERVED: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  SOLD: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const paymentColors: Record<string, string> = {
  UNPAID: 'text-slate-400',
  PARTIAL: 'text-amber-400',
  PAID: 'text-green-400',
};
</script>

<template>
  <div class="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-xl mt-6">
    <div class="p-4 border-b border-slate-700 flex items-center justify-between">
      <h3 class="text-lg font-semibold text-slate-100">Parcels Directory</h3>
      <div class="text-sm text-slate-400">
        {{ parcelsStore.parcels.length }} total
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-slate-900/50 text-xs font-medium text-slate-400 uppercase tracking-wider">
            <th class="px-6 py-3 border-b border-slate-700">Label</th>
            <th class="px-6 py-3 border-b border-slate-700">Status</th>
            <th class="px-6 py-3 border-b border-slate-700">Owner</th>
            <th class="px-6 py-3 border-b border-slate-700 text-right">Area (m²)</th>
            <th class="px-6 py-3 border-b border-slate-700 text-right">Price</th>
            <th class="px-6 py-3 border-b border-slate-700 text-center">Payment</th>
            <th class="px-6 py-3 border-b border-slate-700"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-700">
          <tr 
            v-for="parcel in parcelsStore.parcels" 
            :key="parcel.id"
            class="group transition-colors cursor-pointer hover:bg-slate-700/50"
            :class="{ 'bg-primary/10 hover:bg-primary/20': parcelsStore.selectedParcelId === parcel.id }"
            @click="selectParcel(parcel.id)"
          >
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="font-medium text-slate-200">{{ parcel.label }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span 
                class="px-2.5 py-1 rounded-full text-xs font-medium border"
                :class="statusColors[parcel.status]"
              >
                {{ parcel.status.charAt(0) + parcel.status.slice(1).toLowerCase() }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-slate-300">{{ parcel.ownerName || '-' }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-slate-300 font-mono">
              {{ parcel.areaSqm.toFixed(2) }}
              <span v-if="!calibrationStore.isCalibrated" class="text-amber-500 ml-1" title="Not calibrated">⚠️</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right font-medium text-slate-200">
              {{ formatCurrency(parcel.totalPrice) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-center">
               <span 
                class="text-xs font-medium"
                :class="paymentColors[parcel.paymentStatus]"
              >
                {{ parcel.paymentStatus }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                class="text-primary hover:text-blue-400"
                @click.stop="selectParcel(parcel.id)"
              >
                View
              </button>
            </td>
          </tr>
          
          <tr v-if="parcelsStore.parcels.length === 0">
            <td colspan="7" class="px-6 py-12 text-center text-slate-500">
              No parcels found. Draw or auto-detect parcels to see them here.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
