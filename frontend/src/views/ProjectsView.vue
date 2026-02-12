<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { RouterLink } from 'vue-router';

interface ProjectItem {
  id: string;
  name: string;
  imagePath?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    parcels: number;
  };
}

const projects = ref<ProjectItem[]>([]);
const loading = ref(true);

onMounted(async () => {
  try {
    // Projects don't have a dedicated API route yet - use the terrains endpoint
    // or a local store. For now we'll try fetching from API and fallback gracefully.
    const response = await fetch('/api/terrains');
    if (response.ok) {
      const data = await response.json();
      // Map terrains as "projects" for now - each terrain is a project context
      projects.value = data.map((t: any) => ({
        id: t.id,
        name: t.name,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        _count: { parcels: t.parcels?.length || 0 },
      }));
    }
  } catch (err) {
    console.error('Erreur chargement projets:', err);
  } finally {
    loading.value = false;
  }
});

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR');
}
</script>

<template>
  <div class="animate-fade-in">
    <header class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">Projets</h1>
        <p class="page-subtitle">Éditeur de parcelles avec détection par image</p>
      </div>
      <div class="page-actions">
        <RouterLink to="/projets/nouveau" class="btn btn-primary">
          + Nouveau Projet
        </RouterLink>
      </div>
    </header>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner" />
      <p>Chargement des projets...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="projects.length === 0" class="empty-state">
      <span class="empty-state-icon">📐</span>
      <h2 class="empty-state-title">Aucun projet</h2>
      <p class="empty-state-text">
        Importez une image satellite et tracez vos parcelles directement dessus.
      </p>
      <RouterLink to="/projets/nouveau" class="btn btn-primary btn-lg">
        + Créer Premier Projet
      </RouterLink>
    </div>

    <!-- Grid -->
    <div v-else class="entity-grid">
      <RouterLink
        v-for="project in projects"
        :key="project.id"
        :to="`/projets/${project.id}`"
        class="entity-card"
      >
        <div class="entity-card-header">
          <div class="entity-card-avatar">📐</div>
          <div class="entity-card-info">
            <div class="entity-card-name">{{ project.name }}</div>
            <div class="entity-card-sub">Créé le {{ formatDate(project.createdAt) }}</div>
          </div>
        </div>
        <div class="entity-card-stats">
          <div class="mini-stat">
            <span class="mini-stat-value">{{ project._count?.parcels || 0 }}</span>
            <span class="mini-stat-label">Parcelles</span>
          </div>
        </div>
      </RouterLink>
    </div>
  </div>
</template>
