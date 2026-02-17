<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { Loader } from '@googlemaps/js-api-loader';
import { Button } from '@/components/ui/button';

interface Props {
  latitude?: number;
  longitude?: number;
  zoom?: number;
}

const props = withDefaults(defineProps<Props>(), {
  latitude: 33.5731,
  longitude: -7.5898,
  zoom: 15,
});

const mapContainer = ref<HTMLDivElement | null>(null);
const searchInput = ref<HTMLInputElement | null>(null);
const map = ref<google.maps.Map | null>(null);
const mapType = ref<'roadmap' | 'satellite' | 'hybrid'>('roadmap');
const isLoading = ref(true);
const loadError = ref<string | null>(null);
const searchQuery = ref('');
const searchMarker = ref<google.maps.Marker | null>(null);

const initMap = async () => {
  try {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      throw new Error('Google Maps API key is not configured');
    }

    console.log('Loading Google Maps...');
    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places'],
    });

    await loader.load();
    console.log('Google Maps loaded successfully');

    if (mapContainer.value) {
      console.log('Creating map at coordinates:', props.latitude, props.longitude);
      map.value = new google.maps.Map(mapContainer.value, {
        center: { lat: props.latitude, lng: props.longitude },
        zoom: props.zoom,
        mapTypeId: mapType.value,
        mapTypeControl: false,
        fullscreenControl: true,
        streetViewControl: false,
        zoomControl: true,
      });

      console.log('Map created successfully');

      // Initialize Places Autocomplete
      if (searchInput.value) {
        const autocomplete = new google.maps.places.Autocomplete(searchInput.value, {
          fields: ['geometry', 'name', 'formatted_address'],
        });

        autocomplete.bindTo('bounds', map.value);

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (!place.geometry || !place.geometry.location) {
            console.error('No location found for this place');
            return;
          }

          if (map.value) {
            map.value.setCenter(place.geometry.location);
            map.value.setZoom(17);

            // Remove existing marker if any
            if (searchMarker.value) {
              searchMarker.value.setMap(null);
            }

            // Add a new marker
            searchMarker.value = new google.maps.Marker({
              position: place.geometry.location,
              map: map.value,
              animation: google.maps.Animation.DROP,
            });
          }
        });
      }

      isLoading.value = false;
    } else {
      throw new Error('Map container not found');
    }
  } catch (error: any) {
    console.error('Error loading Google Maps:', error);
    loadError.value = error?.message || 'Failed to load map';
    isLoading.value = false;
  }
};

const setMapType = (type: 'roadmap' | 'satellite' | 'hybrid') => {
  mapType.value = type;
  if (map.value) {
    map.value.setMapTypeId(type);
  }
};

const handleManualSearch = () => {
  if (!searchQuery.value.trim() || !map.value) return;

  const query = searchQuery.value.trim();

  // Remove existing marker if any
  if (searchMarker.value) {
    searchMarker.value.setMap(null);
  }

  // Check if input is coordinates (lat, lng)
  const coordPattern = /^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/;
  const coordMatch = query.match(coordPattern);

  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lng = parseFloat(coordMatch[2]);

    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      const location = new google.maps.LatLng(lat, lng);
      map.value.setCenter(location);
      map.value.setZoom(17);

      searchMarker.value = new google.maps.Marker({
        position: location,
        map: map.value,
        animation: google.maps.Animation.DROP,
      });
      return;
    }
  }

  // Otherwise use Geocoder for address/city search
  const geocoder = new google.maps.Geocoder();
  geocoder.geocode({ address: query }, (results, status) => {
    if (status === 'OK' && results && results[0] && map.value) {
      map.value.setCenter(results[0].geometry.location);
      map.value.setZoom(15);

      searchMarker.value = new google.maps.Marker({
        position: results[0].geometry.location,
        map: map.value,
        animation: google.maps.Animation.DROP,
      });
    } else {
      console.error('Geocode failed:', status);
    }
  });
};

const clearSearchMarker = () => {
  console.log('ESC pressed - Clearing search marker...');
  console.log('searchMarker.value:', searchMarker.value);

  if (searchMarker.value) {
    console.log('Marker found, removing from map');
    try {
      searchMarker.value.setMap(null);
      searchMarker.value = null;
      console.log('Marker removed successfully');
    } catch (error) {
      console.error('Error removing marker:', error);
    }
  } else {
    console.log('No marker to remove');
  }

  searchQuery.value = '';
  if (searchInput.value) {
    searchInput.value.blur();
  }
};

watch(
  () => [props.latitude, props.longitude],
  ([newLat, newLng]) => {
    if (map.value && newLat && newLng) {
      map.value.setCenter({ lat: newLat, lng: newLng });
    }
  }
);

let escKeyHandler: ((event: KeyboardEvent) => void) | null = null;

onMounted(() => {
  initMap();

  // Add global ESC key listener
  escKeyHandler = (event: KeyboardEvent) => {
    if (event.key === 'Escape' || event.keyCode === 27) {
      clearSearchMarker();
    }
  };

  document.addEventListener('keydown', escKeyHandler);
});

onUnmounted(() => {
  if (escKeyHandler) {
    document.removeEventListener('keydown', escKeyHandler);
  }
});
</script>

<template>
  <div class="map-wrapper">
    <div v-if="isLoading && !loadError" class="loading-overlay">
      <div class="loading-text">Chargement de la carte...</div>
    </div>

    <div v-if="loadError" class="error-overlay">
      <div class="error-text">
        <strong>Erreur de chargement:</strong>
        <p>{{ loadError }}</p>
        <p style="font-size: 0.75rem; margin-top: 0.5rem;">Vérifiez la console pour plus de détails.</p>
      </div>
    </div>

    <div ref="mapContainer" class="map-container" />

    <!-- Search Bar -->
    <div v-if="!loadError && !isLoading" class="search-container">
      <input
        ref="searchInput"
        v-model="searchQuery"
        type="text"
        class="search-input"
        placeholder="Rechercher une adresse, ville ou coordonnées..."
        @keyup.enter="handleManualSearch"
        @keyup.esc="clearSearchMarker"
      />
    </div>

    <div v-if="!loadError && !isLoading" class="map-controls">
      <Button
        :variant="mapType === 'roadmap' ? 'default' : 'outline'"
        size="sm"
        @click="setMapType('roadmap')"
      >
        Plan
      </Button>
      <Button
        :variant="mapType === 'satellite' ? 'default' : 'outline'"
        size="sm"
        @click="setMapType('satellite')"
      >
        Satellite
      </Button>
      <Button
        :variant="mapType === 'hybrid' ? 'default' : 'outline'"
        size="sm"
        @click="setMapType('hybrid')"
      >
        Hybride
      </Button>
    </div>
  </div>
</template>

<style scoped>
.map-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 500px;
}

.map-container {
  width: 100%;
  height: 100%;
  min-height: 500px;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-secondary);
  z-index: 10;
}

.loading-text {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.error-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-secondary);
  z-index: 10;
  padding: 2rem;
}

.error-text {
  text-align: center;
  color: #ef4444;
  font-size: 0.875rem;
}

.error-text strong {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 1rem;
}

.map-controls {
  position: absolute;
  top: 1rem;
  left: 1rem;
  display: flex;
  gap: 0.5rem;
  background: var(--color-bg-secondary);
  padding: 0.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 999;
}

/* Override for dark theme if needed */
.map-container :deep(*) {
  color-scheme: light;
}

.search-container {
  position: absolute;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 400px;
  z-index: 999;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  border: none;
  border-radius: 0.5rem;
  background: white;
  color: #1a1f2e;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  outline: none;
  transition: box-shadow 0.2s;
}

.search-input::placeholder {
  color: #6b7280;
}

.search-input:focus {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

/* Autocomplete dropdown styling */
.search-input + .pac-container {
  margin-top: 0.25rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  font-family: inherit;
}
</style>
