You have this list of layout updates that I want you to implement

Prepare the full tasks list of each of the layout updates
Then we will work on them one by one. 
After validating a feature we should commit with clear commit messages
Once a layout is done you should update the layout list and check the implemented layout (this sould be done with my confirmation)
The objective is to minimize the scrolling of the user

Execution workflow (strict):
- Implement one feature block at a time
- Validate visually/functionally with your confirmation
- Commit only after validation with clear commit message
- Update this checklist after each validated block

1. [ ] Terrains Details view layout (implemented, pending your validation)
    1.1 [ ] Top actions: Add button with dropdown (Parcelle / Client / Contrat / Document) (implemented, pending validation)
        1.1.1 [ ] Add dropdown trigger in the header action area (implemented)
        1.1.2 [ ] Open modal from each dropdown choice (implemented)
        1.1.3 [ ] Keep modal layout aligned with existing entity form views (implemented)
        1.1.4 [ ] Auto-link created entity to current terrain when model allows (implemented)
        1.1.5 [ ] Refresh terrain detail data after successful create (implemented)
    1.2 [ ] Top actions: Link button with checkbox modal (removed by request)
        1.2.1 [ ] Add link trigger in header action area (removed)
        1.2.2 [ ] Build grouped checkbox lists (parcelles / clients / contrats / documents) (removed)
        1.2.3 [ ] Pre-check already linked items (removed)
        1.2.4 [ ] Save selected links and refresh terrain details (removed)
    1.3 [ ] Informations de base section in one row (implemented, pending validation)
        1.3.1 [ ] Convert info cards to single-row responsive layout on desktop (implemented)
        1.3.2 [ ] Keep readable stacked layout on small screens (implemented)
    1.4 [ ] Parcelles / Acheteurs / Contrats / Documents in max 1-2 rows (implemented, pending validation)
        1.4.1 [ ] Re-layout sections into compact grid/cards to reduce vertical scroll (implemented)
        1.4.2 [ ] Keep actions visible without long page travel (implemented)
    1.5 [ ] Move Coordonnées into Informations de base section (implemented, pending validation)
        1.5.1 [ ] Integrate latitude/longitude display in base info (implemented)
        1.5.2 [ ] Integrate latitude/longitude edit fields in base form (implemented)
        1.5.3 [ ] Remove standalone Coordonnées block (implemented)
    1.6 [ ] Validation + commit (after your confirmation)
        1.6.1 [ ] Validate UX and data-linking behavior
        1.6.2 [ ] Commit with clear message for Terrain Details layout update
2. [ ] Follow the same style and strategy for all the other entities pages
    2.1 [ ] Contracts detail page
    2.2 [ ] Customers detail page
    2.3 [ ] Parcels detail page
    2.4 [ ] Documents detail page
    2.5 [ ] Validate and commit each page update separately
