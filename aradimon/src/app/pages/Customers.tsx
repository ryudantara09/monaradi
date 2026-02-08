import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Customers.css';
import type { Customer } from '../../core/models';

export function Customers() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'individual' | 'legal_entity'>('all');

    // Load customers
    useEffect(() => {
        const loadCustomers = async () => {
            if (typeof window !== 'undefined' && 'electronAPI' in window) {
                const data = await window.electronAPI.db.getCustomers();
                setCustomers(data);
            } else {
                const data = JSON.parse(localStorage.getItem('aradimon_customers') || '[]');
                setCustomers(data);
            }
        };
        loadCustomers();

        const handleStorage = () => {
            const data = JSON.parse(localStorage.getItem('aradimon_customers') || '[]');
            setCustomers(data);
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    const filteredCustomers = customers.filter(customer => {
        const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            customer.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'all' || customer.type === filterType;
        return matchesSearch && matchesType;
    });

    const individualCount = customers.filter(c => c.type === 'individual').length;
    const legalCount = customers.filter(c => c.type === 'legal_entity').length;

    return (
        <div className="customers-page animate-fade-in">
            <header className="page-header">
                <div className="page-header-left">
                    <h1 className="page-title">Clients</h1>
                    <p className="page-subtitle">Gérer les particuliers et les entités juridiques</p>
                </div>
                <div className="page-actions">
                    <Link to="/customers/new" className="btn btn-primary">
                        <span>+ Ajouter Client</span>
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
                        placeholder="Rechercher clients..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="toolbar-actions">
                    <div className="filter-tabs">
                        <button
                            className={`filter-tab ${filterType === 'all' ? 'active' : ''}`}
                            onClick={() => setFilterType('all')}
                        >
                            Tout ({customers.length})
                        </button>
                        <button
                            className={`filter-tab ${filterType === 'individual' ? 'active' : ''}`}
                            onClick={() => setFilterType('individual')}
                        >
                            👤 Particuliers ({individualCount})
                        </button>
                        <button
                            className={`filter-tab ${filterType === 'legal_entity' ? 'active' : ''}`}
                            onClick={() => setFilterType('legal_entity')}
                        >
                            🏢 Entités ({legalCount})
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            {filteredCustomers.length === 0 ? (
                <div className="empty-state-large">
                    <div className="empty-icon">👥</div>
                    <h2 className="empty-title">Aucun client</h2>
                    <p className="empty-description">
                        Ajoutez des particuliers ou des entités juridiques pour gérer vos relations clients.
                    </p>
                    <Link to="/customers/new" className="btn btn-primary btn-lg">
                        <span>+ Ajouter Premier Client</span>
                    </Link>
                </div>
            ) : (
                <div className="customers-grid">
                    {filteredCustomers.map((customer) => (
                        <Link key={customer.id} to={`/customers/${customer.id}`} className="customer-card">
                            <div className="customer-avatar">
                                {customer.type === 'individual' ? '👤' : '🏢'}
                            </div>
                            <div className="customer-info">
                                <h3 className="customer-name">{customer.name}</h3>
                                <p className="customer-type">
                                    {customer.type === 'individual' ? 'Particulier' : 'Personne Morale'}
                                </p>
                                {customer.email && (
                                    <p className="customer-contact">📧 {customer.email}</p>
                                )}
                                {customer.phone && (
                                    <p className="customer-contact">📞 {customer.phone}</p>
                                )}
                            </div>
                            <div className="customer-stats">
                                <div className="mini-stat">
                                    <span className="mini-stat-value">0</span>
                                    <span className="mini-stat-label">Contrats</span>
                                </div>
                                <div className="mini-stat">
                                    <span className="mini-stat-value">0</span>
                                    <span className="mini-stat-label">Terrains</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
