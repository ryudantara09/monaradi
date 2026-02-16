<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { createDocument, uploadDocument } from '@/services/api';
import { Upload } from '@/lib/icons';

const router = useRouter();
const saving = ref(false);
const submitError = ref<string | null>(null);

const formData = ref({
  name: '',
  type: 'other',
  file: null as File | null,
});

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
    if (formData.value.file) {
      const payload = new FormData();
      payload.append('file', formData.value.file);
      payload.append('name', formData.value.name.trim() || formData.value.file.name);
      payload.append('type', formData.value.type);
      await uploadDocument(payload);
    } else {
      await createDocument({
        name: formData.value.name.trim(),
        type: formData.value.type,
      });
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
</style>