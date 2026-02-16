import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'monaradi-theme-mode';

export function useThemeMode() {
  const mode = ref<ThemeMode>('system');
  const systemPrefersDark = ref(false);

  let mediaQuery: MediaQueryList | null = null;

  const resolvedMode = computed<'light' | 'dark'>(() => {
    if (mode.value === 'system') {
      return systemPrefersDark.value ? 'dark' : 'light';
    }

    return mode.value;
  });

  function applyMode() {
    const rootElement = document.documentElement;
    const isDark = resolvedMode.value === 'dark';

    rootElement.classList.toggle('dark', isDark);
    rootElement.style.colorScheme = isDark ? 'dark' : 'light';
  }

  function setMode(nextMode: ThemeMode) {
    mode.value = nextMode;
  }

  onMounted(() => {
    const storedMode = localStorage.getItem(STORAGE_KEY);

    if (storedMode === 'light' || storedMode === 'dark' || storedMode === 'system') {
      mode.value = storedMode;
    }

    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    systemPrefersDark.value = mediaQuery.matches;

    applyMode();
  });

  watch(mode, (nextMode) => {
    localStorage.setItem(STORAGE_KEY, nextMode);
    applyMode();
  });

  function onSystemThemeChange(event: MediaQueryListEvent) {
    systemPrefersDark.value = event.matches;

    if (mode.value === 'system') {
      applyMode();
    }
  }

  onMounted(() => {
    if (!mediaQuery) {
      return;
    }

    mediaQuery.addEventListener('change', onSystemThemeChange);
  });

  onUnmounted(() => {
    if (!mediaQuery) {
      return;
    }

    mediaQuery.removeEventListener('change', onSystemThemeChange);
  });

  return {
    mode,
    resolvedMode,
    setMode,
  };
}
