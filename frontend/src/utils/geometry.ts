/**
 * Geometry utilities for land parcel calculations
 * All coordinates are normalized (0.0 to 1.0)
 */

/**
 * Calculate polygon area using the Shoelace formula
 * Returns area in square meters when scaleFactor is provided
 */
export function calculatePolygonArea(
    polygon: [number, number][],
    scaleFactor: number,
    imageDimensions?: { width: number; height: number }
): number {
    if (polygon.length < 3) return 0;

    // Shoelace formula (works with normalized coordinates)
    let area = 0;
    const n = polygon.length;

    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        area += polygon[i]![0] * polygon[j]![1];
        area -= polygon[j]![0] * polygon[i]![1];
    }

    area = Math.abs(area) / 2;

    // Convert from normalized area to real area
    // Since coordinates are normalized, we need to scale by image dimensions
    // and then convert pixels to meters using scaleFactor
    if (imageDimensions) {
        // Area in pixels = normalized area * width * height
        const pixelArea = area * imageDimensions.width * imageDimensions.height;
        // Area in square meters = pixel area / (scaleFactor^2)
        return pixelArea / (scaleFactor * scaleFactor);
    }

    // Fallback: assume unit square mapping
    // This is a rough approximation
    const avgScale = scaleFactor;
    return area * avgScale * avgScale;
}

/**
 * Convert pixel coordinates to normalized coordinates (0.0 to 1.0)
 */
export function normalizeCoords(
    points: [number, number][],
    imageWidth: number,
    imageHeight: number
): [number, number][] {
    return points.map(([x, y]) => [x / imageWidth, y / imageHeight]);
}

/**
 * Convert normalized coordinates to pixel coordinates
 */
export function denormalizeCoords(
    points: [number, number][],
    imageWidth: number,
    imageHeight: number
): [number, number][] {
    return points.map(([x, y]) => [x * imageWidth, y * imageHeight]);
}

/**
 * Calculate the centroid of a polygon
 */
export function calculateCentroid(polygon: [number, number][]): [number, number] {
    if (polygon.length === 0) return [0, 0];

    let sumX = 0;
    let sumY = 0;

    for (const [x, y] of polygon) {
        sumX += x;
        sumY += y;
    }

    return [sumX / polygon.length, sumY / polygon.length];
}

/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
export function isPointInPolygon(
    point: [number, number],
    polygon: [number, number][]
): boolean {
    const [px, py] = point;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [xi, yi] = polygon[i]!;
        const [xj, yj] = polygon[j]!;

        if (((yi > py) !== (yj > py)) && (px < ((xj - xi) * (py - yi)) / (yj - yi) + xi)) {
            inside = !inside;
        }
    }

    return inside;
}

/**
 * Calculate distance between two points in normalized coordinates
 */
export function calculateDistance(
    p1: [number, number],
    p2: [number, number]
): number {
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Find the closest vertex in a polygon to a given point
 */
export function findClosestVertex(
    point: [number, number],
    polygon: [number, number][],
    threshold: number = 0.02
): number | null {
    let closestIndex: number | null = null;
    let closestDistance = threshold;

    for (let i = 0; i < polygon.length; i++) {
        const dist = calculateDistance(point, polygon[i]!);
        if (dist < closestDistance) {
            closestDistance = dist;
            closestIndex = i;
        }
    }

    return closestIndex;
}
