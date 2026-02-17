<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
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
const isLocating = ref(false);
const isFullscreen = ref(false);
const mapWrapper = ref<HTMLDivElement | null>(null);

// Drawing tools state
const drawingManager = ref<google.maps.drawing.DrawingManager | null>(null);
const currentPolygon = ref<google.maps.Polygon | null>(null);
const incompleteOverlay = ref<google.maps.Polygon | null>(null);
const isDrawing = ref(false);
const isUndoRedoing = ref(false); // Flag to prevent history saves during undo/redo
const drawingHistory = ref<google.maps.LatLng[][]>([]);
const historyIndex = ref(-1);
const measurements = ref<{ edges: number[]; area: number }>({ edges: [], area: 0 });

const initMap = async () => {
  try {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      throw new Error('Google Maps API key is not configured');
    }

    console.log('Loading Google Maps...');

    // Load Google Maps script dynamically
    if (!window.google || !window.google.maps) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,drawing,geometry&v=weekly`;
      script.async = true;
      script.defer = true;

      await new Promise<void>((resolve, reject) => {
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Google Maps script'));
        document.head.appendChild(script);
      });
    }

    console.log('Google Maps loaded successfully');

    if (mapContainer.value) {
      console.log('Creating map at coordinates:', props.latitude, props.longitude);
      map.value = new google.maps.Map(mapContainer.value, {
        center: { lat: props.latitude, lng: props.longitude },
        zoom: props.zoom,
        mapTypeId: mapType.value,
        mapTypeControl: true,
        fullscreenControl: false,
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

      // Initialize Drawing Manager
      initDrawingManager();

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

const locateMe = () => {
  if (!map.value || !navigator.geolocation) {
    alert('La géolocalisation n\'est pas supportée par votre navigateur');
    return;
  }

  isLocating.value = true;

  navigator.geolocation.getCurrentPosition(
    (position) => {
      if (map.value) {
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        map.value.setCenter(userLocation);
        map.value.setZoom(17);

        // Remove existing search marker if any
        if (searchMarker.value) {
          searchMarker.value.setMap(null);
        }

        // Add marker at user's location
        searchMarker.value = new google.maps.Marker({
          position: userLocation,
          map: map.value,
          animation: google.maps.Animation.DROP,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#4285F4',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
        });
      }
      isLocating.value = false;
    },
    (error) => {
      console.error('Geolocation error:', error);
      let message = 'Impossible d\'obtenir votre position';
      if (error.code === error.PERMISSION_DENIED) {
        message = 'Autorisation de localisation refusée';
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        message = 'Position non disponible';
      } else if (error.code === error.TIMEOUT) {
        message = 'Délai d\'attente dépassé';
      }
      alert(message);
      isLocating.value = false;
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }
  );
};

const toggleFullscreen = async () => {
  if (!mapWrapper.value) return;

  try {
    if (!document.fullscreenElement) {
      await mapWrapper.value.requestFullscreen();
      isFullscreen.value = true;
    } else {
      await document.exitFullscreen();
      isFullscreen.value = false;
    }
  } catch (error) {
    console.error('Fullscreen error:', error);
  }
};

// Listen for fullscreen changes (user presses ESC)
const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement;
};

// ===== PHASE 2: DRAWING & EDITING TOOLS =====
// KNOWN ISSUES:
// 1. Undo/Redo only works AFTER drawing is complete, not during drawing
// 2. Cancel button during drawing may not remove incomplete polygon in all cases
// 3. These are Google Maps API limitations with the DrawingManager

const initDrawingManager = () => {
  if (!map.value) return;

  drawingManager.value = new google.maps.drawing.DrawingManager({
    drawingMode: null,
    drawingControl: false,
    polygonOptions: {
      fillColor: '#FF6B35',
      fillOpacity: 0.3,
      strokeColor: '#FF6B35',
      strokeWeight: 2,
      editable: true,
      draggable: false,
    },
  });

  drawingManager.value.setMap(map.value);

  // Listen for overlay complete (fires during drawing)
  google.maps.event.addListener(
    drawingManager.value,
    'overlaycomplete',
    (event: any) => {
      if (event.type === 'polygon') {
        incompleteOverlay.value = event.overlay;
        console.log('Drawing overlay created (incomplete)');
      }
    }
  );

  // Listen for polygon complete
  google.maps.event.addListener(
    drawingManager.value,
    'polygoncomplete',
    (polygon: google.maps.Polygon) => {
      incompleteOverlay.value = null; // Clear incomplete reference
      handlePolygonComplete(polygon);
    }
  );
};

const handlePolygonComplete = (polygon: google.maps.Polygon) => {
  console.log('Polygon completed');

  // Remove previous polygon if exists
  if (currentPolygon.value) {
    console.log('Removing previous polygon');
    currentPolygon.value.setMap(null);
  }

  currentPolygon.value = polygon;
  isDrawing.value = false;

  // Explicitly ensure polygon is editable
  polygon.setEditable(true);
  polygon.setDraggable(false);

  console.log('Polygon editable:', polygon.getEditable());
  console.log('Polygon draggable:', polygon.getDraggable());

  // Stop drawing mode
  if (drawingManager.value) {
    drawingManager.value.setDrawingMode(null);
  }

  // Save to history
  saveToHistory();

  // Calculate measurements
  updateMeasurements();

  // Add listeners for vertex changes (drag-to-edit)
  const path = polygon.getPath();
  google.maps.event.addListener(path, 'set_at', () => {
    console.log('Vertex moved (set_at)');
    saveToHistory();
    updateMeasurements();
  });
  google.maps.event.addListener(path, 'insert_at', () => {
    console.log('Vertex added (insert_at)');
    saveToHistory();
    updateMeasurements();
  });
  google.maps.event.addListener(path, 'remove_at', () => {
    console.log('Vertex removed (remove_at)');
    saveToHistory();
    updateMeasurements();
  });

  // Add right-click listener on polygon to delete vertices
  google.maps.event.addListener(polygon, 'rightclick', (event: any) => {
    // Check if a vertex was clicked (has 'vertex' property)
    if (event.vertex !== undefined && event.vertex !== null) {
      console.log('Right-clicked vertex:', event.vertex);
      const path = polygon.getPath();

      // Only allow deletion if polygon has more than 3 vertices
      if (path.getLength() > 3) {
        console.log('Deleting vertex at index:', event.vertex);
        path.removeAt(event.vertex);
        // saveToHistory and updateMeasurements will be called by remove_at listener
      } else {
        console.log('Cannot delete vertex - polygon must have at least 3 vertices');
        alert('Un polygone doit avoir au moins 3 points');
      }
    }
  });

  console.log('Polygon setup complete with', path.getLength(), 'vertices');
};

const startDrawing = () => {
  if (!drawingManager.value) return;
  isDrawing.value = true;
  drawingManager.value.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
};

const stopDrawing = () => {
  console.log('Stopping drawing mode...');
  if (!drawingManager.value) return;

  isDrawing.value = false;
  drawingManager.value.setDrawingMode(null);

  // Remove incomplete overlay if it exists
  if (incompleteOverlay.value) {
    console.log('Removing incomplete overlay');
    incompleteOverlay.value.setMap(null);
    incompleteOverlay.value = null;
  }

  console.log('Drawing stopped');
};

const clearPolygon = () => {
  console.log('Clearing polygon...', currentPolygon.value);
  if (currentPolygon.value) {
    try {
      // Remove all listeners first
      google.maps.event.clearInstanceListeners(currentPolygon.value);
      google.maps.event.clearInstanceListeners(currentPolygon.value.getPath());
      // Remove from map
      currentPolygon.value.setMap(null);
      currentPolygon.value = null;
      console.log('Polygon removed successfully');
    } catch (error) {
      console.error('Error removing polygon:', error);
    }
  }
  drawingHistory.value = [];
  historyIndex.value = -1;
  measurements.value = { edges: [], area: 0 };
  console.log('Polygon state cleared');
};

const saveToHistory = () => {
  if (!currentPolygon.value || isUndoRedoing.value) {
    if (isUndoRedoing.value) {
      console.log('Skipping history save during undo/redo operation');
    }
    return;
  }

  const path = currentPolygon.value.getPath();
  const coords: google.maps.LatLng[] = [];

  for (let i = 0; i < path.getLength(); i++) {
    coords.push(path.getAt(i));
  }

  // Remove any future history if we're not at the end
  if (historyIndex.value < drawingHistory.value.length - 1) {
    drawingHistory.value = drawingHistory.value.slice(0, historyIndex.value + 1);
    console.log('Cleared future history');
  }

  drawingHistory.value.push(coords);
  historyIndex.value = drawingHistory.value.length - 1;

  console.log('History saved - total entries:', drawingHistory.value.length, 'current index:', historyIndex.value);
};

const undo = () => {
  console.log('Undo called - historyIndex:', historyIndex.value, 'history length:', drawingHistory.value.length);
  if (historyIndex.value <= 0 || !currentPolygon.value) {
    console.log('Cannot undo - at start of history or no polygon');
    return;
  }

  isUndoRedoing.value = true;
  historyIndex.value--;
  const coords = drawingHistory.value[historyIndex.value];
  currentPolygon.value.setPath(coords);
  updateMeasurements();
  isUndoRedoing.value = false;
  console.log('Undo completed - new historyIndex:', historyIndex.value);
};

const redo = () => {
  console.log('Redo called - historyIndex:', historyIndex.value, 'history length:', drawingHistory.value.length);
  if (historyIndex.value >= drawingHistory.value.length - 1 || !currentPolygon.value) {
    console.log('Cannot redo - at end of history or no polygon');
    return;
  }

  isUndoRedoing.value = true;
  historyIndex.value++;
  const coords = drawingHistory.value[historyIndex.value];
  currentPolygon.value.setPath(coords);
  updateMeasurements();
  isUndoRedoing.value = false;
  console.log('Redo completed - new historyIndex:', historyIndex.value);
};

const updateMeasurements = () => {
  if (!currentPolygon.value) {
    measurements.value = { edges: [], area: 0 };
    return;
  }

  const path = currentPolygon.value.getPath();
  const edges: number[] = [];

  for (let i = 0; i < path.getLength(); i++) {
    const start = path.getAt(i);
    const end = path.getAt((i + 1) % path.getLength());
    const distance = google.maps.geometry.spherical.computeDistanceBetween(start, end);
    edges.push(distance);
  }

  const area = google.maps.geometry.spherical.computeArea(path.getArray());

  measurements.value = { edges, area };
};

const canUndo = computed(() => historyIndex.value > 0);
const canRedo = computed(() => historyIndex.value < drawingHistory.value.length - 1);

const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${meters.toFixed(1)} m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
};

const formatArea = (sqMeters: number): string => {
  if (sqMeters < 10000) {
    return `${sqMeters.toFixed(2)} m²`;
  }
  return `${(sqMeters / 10000).toFixed(2)} ha`;
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

  // Add keyboard shortcuts for drawing tools
  const keyHandler = (event: KeyboardEvent) => {
    // Ctrl+Z or Cmd+Z (without Shift) = Undo
    if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
      console.log('Undo keyboard shortcut triggered');
      event.preventDefault();
      undo();
    }
    // Ctrl+Y or Cmd+Y or Ctrl+Shift+Z = Redo
    if ((event.ctrlKey || event.metaKey) && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
      console.log('Redo keyboard shortcut triggered');
      event.preventDefault();
      redo();
    }
  };

  document.addEventListener('keydown', keyHandler);
  document.addEventListener('fullscreenchange', handleFullscreenChange);

  // Store handler for cleanup
  escKeyHandler = keyHandler;
});

onUnmounted(() => {
  if (escKeyHandler) {
    document.removeEventListener('keydown', escKeyHandler);
  }
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
});
</script>

<template>
  <div ref="mapWrapper" class="map-wrapper">
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
      <Button
        variant="outline"
        size="sm"
        @click="locateMe"
        :disabled="isLocating"
        title="Me localiser"
      >
        <svg
          v-if="!isLocating"
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="10"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        <span v-else class="loading-spinner-small"></span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        @click="toggleFullscreen"
        :title="isFullscreen ? 'Quitter le plein écran' : 'Plein écran'"
      >
        <svg
          v-if="!isFullscreen"
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
        </svg>
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
        </svg>
      </Button>
    </div>

    <!-- Drawing Tools Panel -->
    <div v-if="!loadError && !isLoading" class="drawing-tools">
      <Button
        v-if="!isDrawing && !currentPolygon"
        variant="default"
        size="sm"
        @click="startDrawing"
        title="Dessiner un polygone"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M12 2 L2 7 L12 12 L22 7 L12 2 Z"/>
          <path d="M2 17 L12 22 L22 17"/>
          <path d="M2 12 L12 17 L22 12"/>
        </svg>
        Dessiner
      </Button>
      <Button
        v-if="isDrawing"
        variant="destructive"
        size="sm"
        @click="stopDrawing"
        title="Annuler le dessin"
      >
        Annuler
      </Button>
      <template v-if="currentPolygon">
        <Button
          variant="outline"
          size="sm"
          @click="undo"
          :disabled="!canUndo"
          title="Annuler (Ctrl+Z)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M3 7v6h6"/>
            <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/>
          </svg>
        </Button>
        <Button
          variant="outline"
          size="sm"
          @click="redo"
          :disabled="!canRedo"
          title="Refaire (Ctrl+Y)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M21 7v6h-6"/>
            <path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7"/>
          </svg>
        </Button>
        <Button
          variant="destructive"
          size="sm"
          @click="clearPolygon"
          title="Effacer le polygone"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M3 6h18"/>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
          </svg>
          Effacer
        </Button>
      </template>
    </div>

    <!-- Measurements Panel -->
    <div v-if="currentPolygon && measurements.area > 0" class="measurements-panel">
      <div class="measurement-item">
        <span class="measurement-label">Surface:</span>
        <span class="measurement-value">{{ formatArea(measurements.area) }}</span>
      </div>
      <div class="measurement-edges" v-if="measurements.edges.length > 0">
        <div class="measurement-label">Longueurs des côtés:</div>
        <div class="edge-list">
          <span v-for="(edge, idx) in measurements.edges" :key="idx" class="edge-item">
            Côté {{ idx + 1 }}: {{ formatDistance(edge) }}
          </span>
        </div>
      </div>
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

.map-wrapper:fullscreen {
  background: #000;
}

.map-wrapper:fullscreen .map-container {
  height: 100vh;
  min-height: 100vh;
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

.loading-spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.drawing-tools {
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  display: flex;
  gap: 0.5rem;
  background: var(--color-bg-secondary);
  padding: 0.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 999;
}

.measurements-panel {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: var(--color-bg-secondary);
  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 999;
  min-width: 250px;
  max-width: 350px;
}

.measurement-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--color-border);
}

.measurement-label {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  font-weight: 500;
}

.measurement-value {
  font-size: 1rem;
  color: var(--color-text-primary);
  font-weight: 700;
}

.measurement-edges {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border);
}

.edge-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-top: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
}

.edge-item {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  padding: 0.25rem;
  background: var(--color-bg-card);
  border-radius: 0.25rem;
}

</style>
