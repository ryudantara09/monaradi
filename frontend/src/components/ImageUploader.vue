<script setup lang="ts">
import { ref } from 'vue';

const emit = defineEmits<{
  (e: 'upload', data: { file: File; dataUrl: string }): void;
}>();

const isDragging = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

function handleDragOver(e: DragEvent) {
  e.preventDefault();
  isDragging.value = true;
}

function handleDragLeave() {
  isDragging.value = false;
}

function handleDrop(e: DragEvent) {
  e.preventDefault();
  isDragging.value = false;
  
  const files = e.dataTransfer?.files;
  if (files && files.length > 0 && files[0]) {
    processFile(files[0]);
  }
}

function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    processFile(file);
  }
}

function processFile(file: File) {
  if (!file.type.match(/^image\/(png|jpe?g)$/)) {
    alert('Please upload a PNG or JPG image');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target?.result as string;
    emit('upload', { file, dataUrl });
  };
  reader.readAsDataURL(file);
}

function triggerFileInput() {
  fileInput.value?.click();
}
</script>

<template>
  <div
    class="relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 cursor-pointer"
    :class="[
      isDragging
        ? 'border-primary bg-primary/10 scale-[1.02]'
        : 'border-slate-600 hover:border-slate-500 hover:bg-slate-800/50',
    ]"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
    @click="triggerFileInput"
  >
    <input
      ref="fileInput"
      type="file"
      accept="image/png,image/jpeg,image/jpg"
      class="hidden"
      @change="handleFileSelect"
    />

    <div class="flex flex-col items-center gap-4">
      <div
        class="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"
      >
        <svg
          class="w-10 h-10 text-primary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
      </div>

      <div>
        <p class="text-lg font-medium text-slate-200">
          Drop your land survey image here
        </p>
        <p class="text-sm text-slate-400 mt-1">
          or click to browse • PNG, JPG up to 50MB
        </p>
      </div>
    </div>
  </div>
</template>
