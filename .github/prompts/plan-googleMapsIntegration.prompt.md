# Google Maps Integration Plan

### Phase 1: Interactive Map Foundation
- [ ] **Satellite & Hybrid Views**: Users can toggle between standard roadmap, satellite imagery (for real-world context), and hybrid labels.
- [ ] **Smart Location Search**: A search bar allows users to find locations by address, city, or coordinates.
- [ ] **"Locate Me" Button**: A single click centers the map on the user's current GPS position.
- [ ] **Fullscreen Mode**: Users can expand the map to the full screen for a better drawing experience.
- [ ] **Dynamic Zoom**: The map automatically zooms to fit all drawn items whenever a Terrain or Parcel is opened.

### Phase 2: Drawing & Editing Tools
- [ ] **Polygon Drawing Tool**: Users can draw precise shapes for Terrains and Parcels by clicking points on the map.
- [ ] **Drag-to-Edit**: Users can select an existing shape and drag its corners to adjust boundaries.
- [ ] **Undo/Redo Actions**: Users can easily undo the last point added or change made during drawing.
- [ ] **Measurement Display**: As the user draws, the map shows real-time edge lengths (in meters) and total area.
- [ ] **Point-Update**: The user can update points by clicking and dragging them, while keeping it connected to the rest of the shape.

### Phase 3: Terrain & Parcel Management
- [ ] **Terrain Pinning**: Users can drop a pin to set the official "Center Point" of a Terrain for quick navigation.
- [ ] **Terrain Boundary Definition**: Users can draw a master boundary polygon that defines the full extent of a Terrain.
- [ ] **Parcel Sub-division**: Users can draw multiple Parcel polygons inside a Terrain boundary.
- [ ] **Shape Validation**: The system prevents users from drawing self-intersecting shapes or invalid geometry.
- [ ] **Coordinate Inspector**: Users can click any point or corner to see its exact GPS coordinates (Latitude/Longitude).
- [ ] **Shape Export**: the shape is the mapped directly to the terrain/parcelle and is shown as a document in their detail pages.

### Phase 4: User Experience (UX) Polish
- [ ] **Hover Effects**: Parcels highlight and show a summary tooltip (e.g., Name, ID) when the mouse hovers over them.
- [ ] **Interactive Selection**: Clicking a shape on the map selects the corresponding item in the side list (and vice-versa).
- [ ] **Custom Styling**: Terrains and Parcels have distinct colors/strokes to differentiate them clearly.
- [ ] **Loading States**: Smooth skeletons or spinners appear while map tiles or data are loading.
- [ ] **Context Menu**: Right-clicking the map offers quick actions like "Create Parcel Here" or "Paste Coordinates".
