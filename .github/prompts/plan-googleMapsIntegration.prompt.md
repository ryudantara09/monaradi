# Google Maps Integration Plan

## Architecture Decision: Single Map Instance
**IMPORTANT**: To minimize Google Maps API costs (stay within $200/month free tier), the map will be loaded ONCE in a dedicated section, NOT embedded in individual terrain/parcel detail pages. The map will be placed in a separate section accessible from the sidebar, allowing users to view and manage all terrains/parcels on a single map instance.

### Phase 1: Interactive Map Foundation
- [x] **Satellite & Hybrid Views**: Users can toggle between standard roadmap, satellite imagery (for real-world context), and hybrid labels.
- [x] **Smart Location Search**: A search bar allows users to find locations by address, city, or coordinates. <!-- TODO: ESC key to clear marker not working - needs investigation -->
- [x] **"Locate Me" Button**: A single click centers the map on the user's current GPS position.
- [x] **Fullscreen Mode**: Users can expand the map to the full screen for a better drawing experience.

### Phase 2: Drawing & Editing Tools
- [x] **Polygon Drawing Tool**: Users can draw precise shapes for Terrains and Parcels by clicking points on the map.
- [x] **Drag-to-Edit**: Users can select an existing shape and drag its corners to adjust boundaries.
- [-] **Undo/Redo Actions**: Users can easily undo the last point added or change made during drawing. <!-- ISSUE: Only works AFTER drawing is complete, not during drawing. Google Maps API limitation. -->
- [x] **Measurement Display**: As the user draws, the map shows real-time edge lengths (in meters) and total area.
- [x] **Point-Update**: The user can update points by clicking and dragging them, while keeping it connected to the rest of the shape.
- [x] **Delete Polygon**: Delete button removes the entire polygon from the map.
- [x] **Delete Specific Point**: Right-click on any vertex to delete it (minimum 3 vertices required).
- [-] **Cancel Drawing**: A cancel button allows users to exit drawing mode and discard the current shape. <!-- INCOMPLETE: Does not remove incomplete polygon. -->

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
