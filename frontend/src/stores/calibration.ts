import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { RefLineData } from '@/types';

export const useCalibrationStore = defineStore('calibration', () => {
    const refLineData = ref<RefLineData | null>(null);
    const scaleFactor = ref<number | null>(null); // pixels per meter at original image size
    const imageWidth = ref<number>(0);
    const imageHeight = ref<number>(0);

    const isCalibrated = computed(() => scaleFactor.value !== null);

    function setImageDimensions(width: number, height: number) {
        imageWidth.value = width;
        imageHeight.value = height;
    }

    function setCalibration(data: RefLineData) {
        refLineData.value = data;

        // Calculate scale factor
        // Line length in normalized coordinates
        const dx = data.endPoint[0] - data.startPoint[0];
        const dy = data.endPoint[1] - data.startPoint[1];
        const normalizedLength = Math.sqrt(dx * dx + dy * dy);

        // Convert to pixels using average of width and height for scale
        const avgDimension = (imageWidth.value + imageHeight.value) / 2;
        const pixelLength = normalizedLength * avgDimension;

        // Scale factor = pixels / meters
        scaleFactor.value = pixelLength / data.distanceMeters;
    }

    function clearCalibration() {
        refLineData.value = null;
        scaleFactor.value = null;
    }

    return {
        refLineData,
        scaleFactor,
        imageWidth,
        imageHeight,
        isCalibrated,
        setImageDimensions,
        setCalibration,
        clearCalibration,
    };
});
