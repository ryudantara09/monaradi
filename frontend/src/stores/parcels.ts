import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Parcel } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { calculatePolygonArea } from '@/utils/geometry';

export interface ImageDimensions {
    width: number;
    height: number;
}

export const useParcelsStore = defineStore('parcels', () => {
    const parcels = ref<Parcel[]>([]);
    const selectedParcelId = ref<string | null>(null);
    const isLoading = ref(false);

    const selectedParcel = computed(() =>
        parcels.value.find((p) => p.id === selectedParcelId.value) || null
    );

    function selectParcel(id: string | null) {
        selectedParcelId.value = id;
    }

    function createParcel(
        geometry: [number, number][],
        scaleFactor: number | null,
        label?: string,
        imageDimensions?: ImageDimensions
    ): Parcel {
        const areaSqm = scaleFactor
            ? calculatePolygonArea(geometry, scaleFactor, imageDimensions)
            : 0;
        const parcel: Parcel = {
            id: uuidv4(),
            geometry,
            label: label || `Lot ${parcels.value.length + 1}`,
            ownerName: null,
            status: 'AVAILABLE',
            areaSqm,
            pricePerSqm: 0,
            totalPrice: 0,
        };
        parcels.value.push(parcel);
        return parcel;
    }

    function updateParcel(
        id: string,
        updates: Partial<Omit<Parcel, 'id' | 'totalPrice'>>,
        scaleFactor?: number | null,
        imageDimensions?: ImageDimensions
    ) {
        const index = parcels.value.findIndex((p: Parcel) => p.id === id);
        if (index !== -1) {
            const parcel = parcels.value[index]!;

            // If geometry is being updated and we have a scale factor, recalculate area
            let newAreaSqm = updates.areaSqm ?? parcel.areaSqm;
            if (updates.geometry && scaleFactor) {
                newAreaSqm = calculatePolygonArea(updates.geometry, scaleFactor, imageDimensions);
            }

            const updated: Parcel = {
                ...parcel,
                ...updates,
                areaSqm: newAreaSqm,
                totalPrice: newAreaSqm * (updates.pricePerSqm ?? parcel.pricePerSqm)
            };
            parcels.value[index] = updated;
        }
    }

    function recalculateAllAreas(scaleFactor: number, imageDimensions?: ImageDimensions) {
        for (let i = 0; i < parcels.value.length; i++) {
            const parcel = parcels.value[i]!;
            const newAreaSqm = calculatePolygonArea(parcel.geometry, scaleFactor, imageDimensions);
            parcels.value[i] = {
                ...parcel,
                areaSqm: newAreaSqm,
                totalPrice: newAreaSqm * parcel.pricePerSqm
            };
        }
    }

    function deleteParcel(id: string) {
        const index = parcels.value.findIndex((p: Parcel) => p.id === id);
        if (index !== -1) {
            parcels.value.splice(index, 1);
            if (selectedParcelId.value === id) {
                selectedParcelId.value = null;
            }
        }
    }

    function setParcels(newParcels: Parcel[]) {
        parcels.value = newParcels;
    }

    function clearParcels() {
        parcels.value = [];
        selectedParcelId.value = null;
    }

    return {
        parcels,
        selectedParcelId,
        selectedParcel,
        isLoading,
        selectParcel,
        createParcel,
        updateParcel,
        recalculateAllAreas,
        deleteParcel,
        setParcels,
        clearParcels,
    };
});
