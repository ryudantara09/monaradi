npm run build

> frontend@0.0.0 build
> vue-tsc -b && vite build

src/components/ParcelSidePanel.vue:90:7 - error TS6133: 'paymentOptions' is declared but its value is never read.

90 const paymentOptions: { value: PaymentStatus; label: string }[] = [
         ~~~~~~~~~~~~~~

src/views/CustomerDetailView.vue:129:10 - error TS6133: 'paymentLabel' is declared but its value is never read.

129 function paymentLabel(status: string): string {
             ~~~~~~~~~~~~

src/views/TerrainDetailView.vue:472:28 - error TS2339: Property 'paymentLabel' does not exist on type '{ loading: boolean; terrain: any; isEditing: boolean; cancelEdit: () => void; handleSave: () => Promise<void>; saving: boolean; startEdit: () => void; handleDelete: () => Promise<void>; ... 42 more ...; $router: Router; }'.

472                         {{ paymentLabel(parcel.paymentStatus) }}
                               ~~~~~~~~~~~~


Found 3 errors.