<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { createCustomer } from '@/services/api';

const router = useRouter();
const saving = ref(false);

const formData = ref({
  type: 'individual' as 'individual',
  name: '',
  email: '',
  phone: '',
  address: '',
  idNumber: '',
  notes: '',
});

async function handleSubmit() {
  if (!formData.value.name.trim()) return;
  saving.value = true;

  try {
    await createCustomer({
      type: 'individual',
      name: formData.value.name,
      email: formData.value.email || undefined,
      phone: formData.value.phone || undefined,
      address: formData.value.address || undefined,
      idNumber: formData.value.idNumber || undefined,
      notes: formData.value.notes || undefined,
    });
    router.push('/clients');
  } catch (error) {
    console.error('Erreur création client:', error);
    alert('Erreur lors de la création du client');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="animate-fade-in">
    <header class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">Ajouter un nouveau client</h1>
        <p class="page-subtitle">Enregistrer un nouveau client particulier</p>
      </div>
    </header>

    <form @submit.prevent="handleSubmit" style="display:flex;flex-direction:column;gap:var(--space-lg);max-width:800px">
      <!-- Basic Info -->
      <div class="form-section">
        <h2 class="form-section-title">Informations personnelles</h2>

        <div class="form-group">
          <label class="form-label" for="name">
            Nom Complet *
          </label>
          <input
            type="text"
            id="name"
            class="input"
            v-model="formData.name"
            placeholder="ex : Mohamed Ben Ali"
            required
          />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="email">Email</label>
            <input
              type="email"
              id="email"
              class="input"
              v-model="formData.email"
              placeholder="email@exemple.com"
            />
          </div>
          <div class="form-group">
            <label class="form-label" for="phone">Téléphone</label>
            <input
              type="tel"
              id="phone"
              class="input"
              v-model="formData.phone"
              placeholder="+216 12 345 678"
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="address">Adresse</label>
          <input
            type="text"
            id="address"
            class="input"
            v-model="formData.address"
            placeholder="Adresse complète"
          />
        </div>
      </div>

      <!-- Identification -->
      <div class="form-section">
        <h2 class="form-section-title">Identification</h2>

        <div class="form-group">
          <label class="form-label" for="idNumber">Numéro d'identité (CIN)</label>
          <input
            type="text"
            id="idNumber"
            class="input"
            v-model="formData.idNumber"
            placeholder="CIN, Passeport, etc."
          />
        </div>
      </div>

      <!-- Notes -->
      <div class="form-section">
        <h2 class="form-section-title">Informations supplémentaires</h2>
        <div class="form-group">
          <label class="form-label" for="notes">Notes</label>
          <textarea
            id="notes"
            class="input textarea"
            v-model="formData.notes"
            placeholder="Notes supplémentaires..."
            rows="4"
          />
        </div>
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-secondary" @click="router.push('/clients')">
          Annuler
        </button>
        <button type="submit" class="btn btn-primary" :disabled="saving">
          {{ saving ? 'Enregistrement...' : '+ Créer Client' }}
        </button>
      </div>
    </form>
  </div>
</template>
