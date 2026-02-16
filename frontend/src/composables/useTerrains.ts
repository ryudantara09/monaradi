import { ref } from 'vue';
import { fetchTerrains, createTerrain } from '@/services/api';
import type { Terrain } from '@/types';
import { useAsyncState } from './useAsyncState';

export function useTerrains() {
  const terrains = ref<Terrain[]>([]);
  
  const { 
    isLoading: isLoadingList, 
    error: listError, 
    execute: loadTerrains 
  } = useAsyncState(async () => {
    const data = await fetchTerrains();
    terrains.value = data;
    return data;
  }, [] as Terrain[]);

  const isCreating = ref(false);
  const createError = ref<Error | null>(null);

  const addTerrain = async (payload: Partial<Terrain>) => {
    isCreating.value = true;
    createError.value = null;
    try {
      const newTerrain = await createTerrain(payload);
      terrains.value.push(newTerrain);
      return newTerrain;
    } catch (e) {
      createError.value = e as Error;
      throw e;
    } finally {
      isCreating.value = false;
    }
  };
    
  // We can add delete/update similarly

  return {
    terrains, // reactive state
    isLoading: isLoadingList,
    error: listError,
    loadTerrains,
    addTerrain,
    isCreating,
    createError
  };
}
