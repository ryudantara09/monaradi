import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            name: 'dashboard',
            component: () => import('@/views/DashboardView.vue'),
        },
        {
            path: '/terrains',
            name: 'terrains',
            component: () => import('@/views/TerrainsView.vue'),
        },
        {
            path: '/terrains/nouveau',
            name: 'terrain-new',
            component: () => import('@/views/TerrainFormView.vue'),
        },
        {
            path: '/terrains/:id/edit-visual',
            name: 'terrain-editor-visual',
            component: () => import('@/views/TerrainEditorView.vue'),
        },
        {
            path: '/terrains/:id',
            name: 'terrain-detail',
            component: () => import('@/views/TerrainDetailView.vue'),
        },
        {
            path: '/clients',
            name: 'customers',
            component: () => import('@/views/CustomersView.vue'),
        },
        {
            path: '/clients/nouveau',
            name: 'customer-new',
            component: () => import('@/views/CustomerFormView.vue'),
        },
        {
            path: '/clients/:id',
            name: 'customer-detail',
            component: () => import('@/views/CustomerDetailView.vue'),
        },
        {
            path: '/contrats',
            name: 'contracts',
            component: () => import('@/views/ContractsView.vue'),
        },
        {
            path: '/contrats/nouveau',
            name: 'contract-new',
            component: () => import('@/views/ContractFormView.vue'),
        },
        {
            path: '/contrats/:id',
            name: 'contract-detail',
            component: () => import('@/views/ContractDetailView.vue'),
        },
        {
            path: '/parcelles',
            name: 'parcels',
            component: () => import('@/views/ParcelsView.vue'),
        },
        {
            path: '/parcelles/:id',
            name: 'parcel-detail',
            component: () => import('@/views/ParcelDetailView.vue'),
        },
        {
            path: '/documents',
            name: 'documents',
            component: () => import('@/views/DocumentsView.vue'),
        },
        // Redirect old /projets routes to /terrains
        {
            path: '/projets',
            redirect: '/terrains',
        },
        {
            path: '/projets/:id',
            redirect: to => `/terrains/${to.params.id}`,
        },
    ],
});

export default router;
