import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Transactions.css';
import type { Transaction } from '../../core/models';

type TransactionType = 'all' | 'sale' | 'purchase';

export function Transactions() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<TransactionType>('all');
    const [sortBy, setSortBy] = useState<'date' | 'price'>('date');

    // Load transactions
    useEffect(() => {
        const loadTransactions = async () => {
            let data: Transaction[] = [];
            if (typeof window !== 'undefined' && 'electronAPI' in window) {
                data = await window.electronAPI.db.getTransactions();
            } else {
                data = JSON.parse(localStorage.getItem('aradimon_transactions') || '[]') as Transaction[];
            }
            // Filter out invalid transactions (missing required fields)
            const validTransactions = data.filter(t =>
                t && t.id && t.type && t.transactionDate && typeof t.price === 'number'
            );
            setTransactions(validTransactions);
        };
        loadTransactions();

        const handleStorage = () => {
            const data = JSON.parse(localStorage.getItem('aradimon_transactions') || '[]');
            const validTransactions = data.filter((t: Transaction) =>
                t && t.id && t.type && t.transactionDate && typeof t.price === 'number'
            );
            setTransactions(validTransactions);
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    const filteredTransactions = transactions
        .filter(transaction => {
            const matchesSearch = !searchQuery || transaction.notes?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesType = filterType === 'all' || transaction.type === filterType;
            return matchesSearch && matchesType;
        })
        .sort((a, b) => {
            if (sortBy === 'date') {
                return new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime();
            }
            return (b.price || 0) - (a.price || 0);
        });

    const totalValue = filteredTransactions.reduce((sum, t) => sum + (t.price || 0), 0);
    const salesCount = transactions.filter(t => t.type === 'sale').length;
    const purchasesCount = transactions.filter(t => t.type === 'purchase').length;

    return (
        <div className="transactions-page animate-fade-in">
            <header className="page-header">
                <div className="page-header-left">
                    <h1 className="page-title">Transactions</h1>
                    <p className="page-subtitle">Suivi de toutes les transactions de vente et d'achat</p>
                </div>
                <div className="page-actions">
                    <Link to="/transactions/new" className="btn btn-primary">
                        <span>+ Enregistrer Transaction</span>
                    </Link>
                </div>
            </header>

            {/* Summary Stats */}
            <div className="transaction-summary">
                <div className="summary-card">
                    <span className="summary-icon">💵</span>
                    <div className="summary-content">
                        <span className="summary-value">{filteredTransactions.length}</span>
                        <span className="summary-label">Transactions Totales</span>
                    </div>
                </div>
                <div className="summary-card">
                    <span className="summary-icon">📈</span>
                    <div className="summary-content">
                        <span className="summary-value">{totalValue.toLocaleString(undefined, { minimumFractionDigits: 3 })} TND</span>
                        <span className="summary-label">Valeur Totale</span>
                    </div>
                </div>
                <div className="summary-card sale">
                    <span className="summary-icon">🏷️</span>
                    <div className="summary-content">
                        <span className="summary-value">{salesCount}</span>
                        <span className="summary-label">Ventes</span>
                    </div>
                </div>
                <div className="summary-card purchase">
                    <span className="summary-icon">🛒</span>
                    <div className="summary-content">
                        <span className="summary-value">{purchasesCount}</span>
                        <span className="summary-label">Achats</span>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="page-toolbar">
                <div className="search-wrapper">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        className="input search-input"
                        placeholder="Rechercher transactions..."
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
                            Tout
                        </button>
                        <button
                            className={`filter-tab ${filterType === 'sale' ? 'active' : ''}`}
                            onClick={() => setFilterType('sale')}
                        >
                            🏷️ Ventes
                        </button>
                        <button
                            className={`filter-tab ${filterType === 'purchase' ? 'active' : ''}`}
                            onClick={() => setFilterType('purchase')}
                        >
                            🛒 Achats
                        </button>
                    </div>

                    <select
                        className="input select-filter"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'date' | 'price')}
                    >
                        <option value="date">Trier par Date</option>
                        <option value="price">Trier par Prix</option>
                    </select>
                </div>
            </div>

            {/* Content */}
            {filteredTransactions.length === 0 ? (
                <div className="empty-state-large">
                    <div className="empty-icon">💰</div>
                    <h2 className="empty-title">Aucune transaction</h2>
                    <p className="empty-description">
                        Enregistrez votre première transaction de vente ou d'achat pour commencer le suivi.
                    </p>
                    <Link to="/transactions/new" className="btn btn-primary btn-lg">
                        <span>+ Enregistrez Première Transaction</span>
                    </Link>
                </div>
            ) : (
                <div className="transactions-list">
                    {filteredTransactions.map((transaction) => (
                        <Link
                            key={transaction.id}
                            to={`/transactions/${transaction.id}`}
                            className={`transaction-card ${transaction.type}`}
                        >
                            <div className="transaction-icon">
                                {transaction.type === 'sale' ? '🏷️' : '🛒'}
                            </div>
                            <div className="transaction-main">
                                <div className="transaction-header">
                                    <span className="transaction-type">{transaction.type === 'sale' ? 'Vente' : 'Achat'}</span>
                                    <span className="transaction-date">
                                        {new Date(transaction.transactionDate).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="transaction-price">
                                    {transaction.price.toLocaleString(undefined, { minimumFractionDigits: 3 })} TND
                                </div>
                                {transaction.notes && (
                                    <p className="transaction-notes">{transaction.notes}</p>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
