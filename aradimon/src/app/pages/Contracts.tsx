import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Contracts.css';
import type { Contract } from '../../core/models';

type ContractStatus = 'all' | 'draft' | 'active' | 'expired' | 'cancelled';
type ContractType = 'all' | 'ownership' | 'sale' | 'purchase' | 'lease' | 'other';

const statusColors: Record<string, string> = {
    draft: 'badge',
    active: 'badge badge-success',
    expired: 'badge badge-warning',
    cancelled: 'badge badge-danger',
};

const statusLabels: Record<string, string> = {
    draft: 'Brouillon',
    active: 'Actif',
    expired: 'Expiré',
    cancelled: 'Annulé',
};

const typeLabels: Record<string, string> = {
    ownership: 'Propriété',
    sale: 'Vente',
    purchase: 'Achat',
    lease: 'Location',
    other: 'Autre',
};

export function Contracts() {
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<ContractStatus>('all');
    const [filterType, setFilterType] = useState<ContractType>('all');

    // Load contracts
    useEffect(() => {
        const loadContracts = async () => {
            if (typeof window !== 'undefined' && 'electronAPI' in window) {
                const data = await window.electronAPI.db.getContracts();
                setContracts(data);
            } else {
                const data = JSON.parse(localStorage.getItem('aradimon_contracts') || '[]');
                setContracts(data);
            }
        };
        loadContracts();

        const handleStorage = () => {
            const data = JSON.parse(localStorage.getItem('aradimon_contracts') || '[]');
            setContracts(data);
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    const filteredContracts = contracts.filter(contract => {
        const matchesSearch = contract.contractNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            contract.notes?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'all' || contract.status === filterStatus;
        const matchesType = filterType === 'all' || contract.type === filterType;
        return matchesSearch && matchesStatus && matchesType;
    });

    return (
        <div className="contracts-page animate-fade-in">
            <header className="page-header">
                <div className="page-header-left">
                    <h1 className="page-title">Contrats</h1>
                    <p className="page-subtitle">Gérez les contrats de propriété, vente, achat et location</p>
                </div>
                <div className="page-actions">
                    <Link to="/contracts/new" className="btn btn-primary">
                        <span>+ Nouveau Contrat</span>
                    </Link>
                </div>
            </header>

            {/* Toolbar */}
            <div className="page-toolbar">
                <div className="search-wrapper">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        className="input search-input"
                        placeholder="Rechercher contrats..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="toolbar-actions">
                    <select
                        className="input select-filter"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as ContractStatus)}
                    >
                        <option value="all">Tous statuts</option>
                        <option value="draft">Brouillon</option>
                        <option value="active">Actif</option>
                        <option value="expired">Expiré</option>
                        <option value="cancelled">Annulé</option>
                    </select>

                    <select
                        className="input select-filter"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as ContractType)}
                    >
                        <option value="all">Tous types</option>
                        <option value="ownership">Propriété</option>
                        <option value="sale">Vente</option>
                        <option value="purchase">Achat</option>
                        <option value="lease">Location</option>
                        <option value="other">Autre</option>
                    </select>
                </div>
            </div>

            {/* Content */}
            {filteredContracts.length === 0 ? (
                <div className="empty-state-large">
                    <div className="empty-icon">📜</div>
                    <h2 className="empty-title">Aucun contrat</h2>
                    <p className="empty-description">
                        Créez des contrats pour formaliser la propriété, les ventes, les achats et les locations.
                    </p>
                    <Link to="/contracts/new" className="btn btn-primary btn-lg">
                        <span>+ Créer Premier Contrat</span>
                    </Link>
                </div>
            ) : (
                <div className="content-section">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>N° Contrat</th>
                                <th>Type</th>
                                <th>Statut</th>
                                <th>Date Début</th>
                                <th>Date Fin</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredContracts.map((contract) => (
                                <tr key={contract.id}>
                                    <td>
                                        <Link to={`/contracts/${contract.id}`} className="contract-link">
                                            {contract.contractNumber || 'Sans Numéro'}
                                        </Link>
                                    </td>
                                    <td className="capitalize">{typeLabels[contract.type] || contract.type}</td>
                                    <td>
                                        <span className={statusColors[contract.status]}>
                                            {statusLabels[contract.status] || contract.status}
                                        </span>
                                    </td>
                                    <td>{contract.startDate ? new Date(contract.startDate).toLocaleDateString() : '—'}</td>
                                    <td>{contract.endDate ? new Date(contract.endDate).toLocaleDateString() : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
