<script setup lang="ts">
import { useParcelsStore } from '@/stores/parcels';
import { AlertCircle, Eye } from '@/lib/icons';
import { Badge } from '@/components/ui/badge';

const parcelsStore = useParcelsStore();

function formatTND(value: number) {
  return value.toLocaleString('fr-FR', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }) + ' TND';
}

function selectParcel(id: string) {
  parcelsStore.selectParcel(id);
}

const statusVariant: Record<string, "success" | "destructive" | "default" | "secondary" | "outline" | "warning" | "info"> = {
  AVAILABLE: 'success',
  SOLD: 'destructive',
  RESERVED: 'warning',
};

const statusLabels: Record<string, string> = {
  AVAILABLE: 'Disponible',
  SOLD: 'Vendu',
  RESERVED: 'Réservé',
};
</script>

<template>
  <div class="bg-card rounded-2xl overflow-hidden border border-border shadow-sm mt-6">
    <div class="p-6 border-b border-border flex items-center justify-between bg-card">
      <div>
        <h3 class="text-lg font-semibold text-foreground tracking-tight">Répertoire des Parcelles</h3>
        <p class="text-sm text-muted-foreground mt-1">Liste complète des lots et disponibilités</p>
      </div>
      <div class="text-sm font-medium px-3 py-1 rounded-full bg-muted text-muted-foreground border border-border">
        {{ parcelsStore.parcels.length }} enregistrements
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
            <th class="px-6 py-4">Libellé</th>
            <th class="px-6 py-4">Statut</th>
            <th class="px-6 py-4">Propriétaire</th>
            <th class="px-6 py-4 text-right">Surface (m²)</th>
            <th class="px-6 py-4 text-right">Prix</th>
            <th class="px-6 py-4"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          <tr 
            v-for="parcel in parcelsStore.parcels" 
            :key="parcel.id" 
            class="hover:bg-muted/40 transition-colors cursor-pointer group"
            @click="selectParcel(parcel.id)"
          >
            <td class="px-6 py-4 font-medium text-foreground">
              {{ parcel.label }}
              <div class="text-xs text-muted-foreground mt-0.5 font-normal">Lot #{{ parcel.id.substring(0, 4) }}</div>
            </td>
            <td class="px-6 py-4">
              <Badge :variant="statusVariant[parcel.status] || 'default'" class="px-2.5 py-1">
                {{ statusLabels[parcel.status] || parcel.status }}
              </Badge>
            </td>
            <td class="px-6 py-4 text-sm text-muted-foreground">
              <div v-if="parcel.ownerName" class="flex items-center gap-2">
                <div class="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                  {{ parcel.ownerName.substring(0, 1).toUpperCase() }}
                </div>
                <span class="text-foreground">{{ parcel.ownerName }}</span>
              </div>
              <span v-else class="text-muted-foreground italic">-</span>
            </td>
            <td class="px-6 py-4 text-right font-mono text-sm text-foreground">
              {{ Math.round(parcel.areaSqm).toLocaleString() }}
            </td>
            <td class="px-6 py-4 text-right font-mono text-sm font-medium text-foreground">
              {{ formatTND(parcel.totalPrice) }}
            </td>
            <td class="px-6 py-4 text-right">
              <button 
                class="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground hover:text-primary transition-all rounded-full hover:bg-primary/10"
                @click.stop="selectParcel(parcel.id)"
              >
                <Eye class="h-4 w-4" />
              </button>
            </td>
          </tr>
          <tr v-if="parcelsStore.parcels.length === 0">
            <td colspan="6" class="px-6 py-12 text-center text-muted-foreground">
              <div class="flex flex-col items-center justify-center gap-3">
                <AlertCircle class="h-10 w-10 text-muted-foreground/50" />
                <p>Aucune parcelle trouvée</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
