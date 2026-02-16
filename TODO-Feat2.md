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

1. [x] Terrains Details view layout
    1.1 [x] Top actions: Add button with dropdown (Parcelle / Client / Contrat / Document)
        1.1.1 [x] Add dropdown trigger in the header action area
        1.1.2 [x] Open modal from each dropdown choice
        1.1.3 [x] Keep modal layout aligned with existing entity form views
        1.1.4 [x] Auto-link created entity to current terrain when model allows
        1.1.5 [x] Refresh terrain detail data after successful create
    1.2 [x] Top actions: Link button with checkbox modal (removed by request)
        1.2.1 [x] Add link trigger in header action area (removed)
        1.2.2 [x] Build grouped checkbox lists (parcelles / clients / contrats / documents) (removed)
        1.2.3 [x] Pre-check already linked items (removed)
        1.2.4 [x] Save selected links and refresh terrain details (removed)
    1.3 [x] Informations de base section in one row
        1.3.1 [x] Convert info cards to single-row responsive layout on desktop
        1.3.2 [x] Keep readable stacked layout on small screens
    1.4 [x] Parcelles / Acheteurs / Contrats / Documents in max 1-2 rows
        1.4.1 [x] Re-layout sections into compact grid/cards to reduce vertical scroll
        1.4.2 [x] Keep actions visible without long page travel
    1.5 [x] Move Coordonnées into Informations de base section
        1.5.1 [x] Integrate latitude/longitude display in base info
        1.5.2 [x] Integrate latitude/longitude edit fields in base form
        1.5.3 [x] Remove standalone Coordonnées block
    1.6 [x] Validation + commit
        1.6.1 [x] Validate UX and data-linking behavior
        1.6.2 [x] Commit with clear message for Terrain Details layout update
2. [ ] Follow the same style and strategy for all the other entities pages
    2.1 [x] Contracts detail page
    2.2 [ ] Customers detail page
    2.3 [ ] Parcels detail page
    2.4 [ ] Documents detail page
    2.5 [ ] Validate and commit each page update separately
        2.5.1 [x] Contracts detail page validated + committed
