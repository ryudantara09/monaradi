import { ref, type Ref } from 'vue';

export function useAsyncState<T>(
  promiseFactory: () => Promise<T>, 
  initialState: T
) {
  const state: Ref<T> = ref(initialState) as Ref<T>;
  const isLoading = ref(false);
  const error = ref<Error | null>(null);

  async function execute() {
    isLoading.value = true;
    error.value = null;
    try {
      const data = await promiseFactory();
      state.value = data;
      return data;
    } catch (e) {
      error.value = e as Error;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    state,
    isLoading,
    error,
    execute
  };
}
