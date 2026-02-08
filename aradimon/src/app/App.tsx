import { createHashRouter, RouterProvider } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Terrains } from './pages/Terrains';
import { TerrainForm } from './pages/TerrainForm';
import { TerrainDetail } from './pages/TerrainDetail';
import { Customers } from './pages/Customers';
import { CustomerForm } from './pages/CustomerForm';
import { CustomerDetail } from './pages/CustomerDetail';
import { Contracts } from './pages/Contracts';
import { ContractForm } from './pages/ContractForm';
import { ContractDetail } from './pages/ContractDetail';
import { Transactions } from './pages/Transactions';
import { TransactionForm } from './pages/TransactionForm';
import { TransactionDetail } from './pages/TransactionDetail';
import { Documents } from './pages/Documents';
import { Settings } from './pages/Settings';
import './styles/index.css';

// Use hash router for Electron compatibility
const router = createHashRouter([
    {
        path: '/',
        element: <Layout />,
        children: [
            { index: true, element: <Dashboard /> },
            { path: 'terrains', element: <Terrains /> },
            { path: 'terrains/new', element: <TerrainForm /> },
            { path: 'terrains/:id', element: <TerrainDetail /> },
            { path: 'customers', element: <Customers /> },
            { path: 'customers/new', element: <CustomerForm /> },
            { path: 'customers/:id', element: <CustomerDetail /> },
            { path: 'contracts', element: <Contracts /> },
            { path: 'contracts/new', element: <ContractForm /> },
            { path: 'contracts/:id', element: <ContractDetail /> },
            { path: 'transactions', element: <Transactions /> },
            { path: 'transactions/new', element: <TransactionForm /> },
            { path: 'transactions/:id', element: <TransactionDetail /> },
            { path: 'documents', element: <Documents /> },
            { path: 'settings', element: <Settings /> },
        ],
    },
]);

export function App() {
    return <RouterProvider router={router} />;
}
