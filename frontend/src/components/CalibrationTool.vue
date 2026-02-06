<script setup lang="ts">
import { ref, computed } from 'vue';
import { useCalibrationStore } from '@/stores/calibration';

const props = defineProps<{
  startPoint: [number, number];
  endPoint: [number, number];
}>();

const emit = defineEmits<{
  (e: 'confirm', distanceMeters: number): void;
  (e: 'cancel'): void;
}>();

const calibrationStore = useCalibrationStore();
const distanceInput = ref('');

const isValid = computed(() => {
  const num = parseFloat(distanceInput.value);
  return !isNaN(num) && num > 0;
});

function handleConfirm() {
  if (isValid.value) {
    emit('confirm', parseFloat(distanceInput.value));
  }
}
</script>

<template>
  <div class="bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-700">
    <h3 class="text-lg font-semibold text-slate-100 mb-4">
      Set Reference Scale
    </h3>

    <p class="text-sm text-slate-400 mb-4">
      You've drawn a reference line. Enter the real-world distance this line represents:
    </p>

    <div class="flex gap-3 items-center mb-6">
      <input
        v-model="distanceInput"
        type="number"
        step="0.1"
        min="0.1"
        placeholder="e.g., 50"
        class="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        @keyup.enter="handleConfirm"
      />
      <span class="text-slate-300 font-medium">meters</span>
    </div>

    <div class="flex gap-3">
      <button
        class="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-medium transition-colors"
        @click="$emit('cancel')"
      >
        Cancel
      </button>
      <button
        :disabled="!isValid"
        class="flex-1 px-4 py-2.5 bg-primary hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        @click="handleConfirm"
      >
        Confirm Scale
      </button>
    </div>

    <p v-if="calibrationStore.isCalibrated" class="mt-4 text-sm text-green-400">
      ✓ Scale factor: {{ calibrationStore.scaleFactor?.toFixed(2) }} px/m
    </p>
  </div>
</template>
