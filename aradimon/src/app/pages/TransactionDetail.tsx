import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './DetailPage.css';
import type { Transaction, Contract } from '../../core/models';

export function TransactionDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [linkedContract, setLinkedContract] = useState<Contract | null>(null);
    const [allContracts, setAllContracts] = useState<Contract[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<Transaction>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!id) return;

        const loadData = async () => {
            if (typeof window !== 'undefined' && 'electronAPI' in window) {
                const transData = await window.electronAPI.db.getTransaction(id) as Transaction;
                setTransaction(transData);
                setFormData(transData);

                // Load contracts for dropdown
                const contractsData = await window.electronAPI.db.getContracts() as Contract[];
                setAllContracts(contractsData);

                if (transData && transData.contractId) {
                    const contractData = await window.electronAPI.db.getContract(transData.contractId) as Contract;
                    setLinkedContract(contractData);
                }
            } else {
                const transactions = JSON.parse(localStorage.getItem('aradimon_transactions') || '[]') as Transaction[];
                const found = transactions.find(t => t.id === id);
                if (found) {
                    setTransaction(found);
                    setFormData(found);

                    const contracts = JSON.parse(localStorage.getItem('aradimon_contracts') || '[]') as Contract[];
                    setAllContracts(contracts);

                    if (found.contractId) {
                        const contract = contracts.find(c => c.id === found.contractId);
                        setLinkedContract(contract || null);
                    }
                }
            }
        };
        loadData();
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) : value
        }));
    };

    const handleSave = async () => {
        if (!transaction) return;
        setSaving(true);

        try {
            const updated = {
                ...transaction,
                ...formData,
                updatedAt: new Date().toISOString(),
            };

            if (typeof window !== 'undefined' && 'electronAPI' in window) {
                await window.electronAPI.db.updateTransaction(id!, updated);
                // Reload linked contract if changed
                if (updated.contractId && updated.contractId !== transaction.contractId) {
                    const contractData = await window.electronAPI.db.getContract(updated.contractId) as Contract;
                    setLinkedContract(contractData);
                } else if (!updated.contractId) {
                    setLinkedContract(null);
                }
            } else {
                const transactions = JSON.parse(localStorage.getItem('aradimon_transactions') || '[]') as Transaction[];
                const index = transactions.findIndex(t => t.id === id);
                if (index !== -1) {
                    transactions[index] = updated;
                    localStorage.setItem('aradimon_transactions', JSON.stringify(transactions));
                }
            }

            setTransaction(updated);
            setIsEditing(false);
        } catch (error) {
            console.error('Error saving transaction:', error);
            alert('Erreur lors de l\'enregistrement de la transaction');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette transaction ?')) return;

        try {
            if (typeof window !== 'undefined' && 'electronAPI' in window) {
                await window.electronAPI.db.deleteTransaction(id!);
            } else {
                const transactions = JSON.parse(localStorage.getItem('aradimon_transactions') || '[]') as Transaction[];
                const filtered = transactions.filter(t => t.id !== id);
                localStorage.setItem('aradimon_transactions', JSON.stringify(filtered));
            }
            navigate('/transactions');
        } catch (error) {
            console.error('Error deleting transaction:', error);
            alert('Erreur lors de la suppression de la transaction');
        }
    };

    if (!transaction) {
        return (
            <div className="detail-page animate-fade-in">
                <div className="loading-state">
                    <span className="loading-icon">⏳</span>
                    <p>Chargement de la transaction...</p>
                </div>
            </div>
        );
    }

    const formatCurrency = (amount: number, currency: string) => {
        const symbols: Record<string, string> = { TND: 'TND', USD: '$', EUR: '€' };
        return `${symbols[currency] || currency} ${amount.toLocaleString()}`;
    };

    return (
        <div className="detail-page animate-fade-in">
            <header className="page-header">
                <div className="page-header-left">
                    <Link to="/transactions" className="back-link">← Retour aux Transactions</Link>
                    <h1 className="page-title">
                        <span className="entity-icon">{transaction.type === 'sale' ? '🏷️' : '🛒'}</span>
                        Transaction de {transaction.type === 'sale' ? 'Vente' : 'Achat'}
                    </h1>
                    <p className="page-subtitle">
                        {formatCurrency(transaction.price, transaction.currency)}
                    </p>
                </div>
                <div className="page-actions">
                    {isEditing ? (
                        <>
                            <button className="btn btn-secondary" onClick={() => { setIsEditing(false); setFormData(transaction); }}>
                                Annuler
                            </button>
                            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                                {saving ? 'Enregistrement...' : 'Enregistrer'}
                            </button>
                        </>
                    ) : (
                        <>
                            <button className="btn btn-secondary" onClick={() => setIsEditing(true)}>
                                ✏️ Modifier
                            </button>
                            <button className="btn btn-danger" onClick={handleDelete}>
                                🗑️ Supprimer
                            </button>
                        </>
                    )}
                </div>
            </header>

            <div className="detail-content">
                <div className="detail-section">
                    <h2 className="section-title">Détails de la transaction</h2>

                    {isEditing ? (
                        <div className="edit-form">
                            <div className="form-group">
                                <label className="form-label">Type</label>
                                <select
                                    name="type"
                                    className="input"
                                    value={formData.type || 'sale'}
                                    onChange={handleChange}
                                >
                                    <option value="sale">Vente</option>
                                    <option value="purchase">Achat</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Date de transaction</label>
                                <input
                                    type="date"
                                    name="transactionDate"
                                    className="input"
                                    value={formData.transactionDate || ''}
                                    onChange={handleChange}
                                    maxLength={10}
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group" style={{ flex: 2 }}>
                                    <label className="form-label">Prix</label>
                                    <input
                                        type="number"
                                        name="price"
                                        className="input"
                                        value={formData.price || ''}
                                        onChange={handleChange}
                                        step="0.01"
                                        min="0"
                                    />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">Devise</label>
                                    <select
                                        name="currency"
                                        className="input"
                                        value={formData.currency || 'TND'}
                                        onChange={handleChange}
                                    >
                                        <option value="TND">TND (TND)</option>
                                        <option value="EUR">EUR (€)</option>
                                        <option value="USD">USD ($)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Contrat lié</label>
                                <select
                                    name="contractId"
                                    className="input"
                                    value={formData.contractId || ''}
                                    onChange={handleChange}
                                >
                                    <option value="">-- Aucun contrat --</option>
                                    {allContracts.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.contractNumber || 'Sans N°'} - {c.type}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    ) : (
                        <div className="info-grid">
                            <div className="info-item">
                                <span className="info-label">📊 Type</span>
                                <span className="info-value" style={{ textTransform: 'capitalize' }}>
                                    {transaction.type === 'sale' ? 'Vente' : 'Achat'}
                                </span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">📅 Date</span>
                                <span className="info-value">{new Date(transaction.transactionDate).toLocaleDateString()}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">💰 Montant</span>
                                <span className="info-value" style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-accent-primary)' }}>
                                    {formatCurrency(transaction.price, transaction.currency)}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="detail-section">
                    <h2 className="section-title">Notes</h2>

                    {isEditing ? (
                        <div className="edit-form">
                            <div className="form-group">
                                <textarea
                                    name="notes"
                                    className="input textarea"
                                    value={formData.notes || ''}
                                    onChange={handleChange}
                                    rows={4}
                                    placeholder="Détails du paiement, conditions, etc."
                                />
                            </div>
                        </div>
                    ) : (
                        <p className="notes-content">{transaction.notes || 'Pas de notes'}</p>
                    )}
                </div>

                <div className="detail-section">
                    <h2 className="section-title">Contrat lié</h2>
                    {linkedContract ? (
                        <Link to={`/contracts/${linkedContract.id}`} className="related-item-card" style={{ display: 'flex', alignItems: 'center', padding: '15px', background: 'var(--bg-secondary)', borderRadius: '8px', textDecoration: 'none', color: 'inherit' }}>
                            <span className="related-icon" style={{ fontSize: '2rem', marginRight: '15px' }}>📜</span>
                            <div className="related-info">
                                <div className="related-name" style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{linkedContract.contractNumber || 'Contrat Sans Numéro'}</div>
                                <div className="related-sub" style={{ color: 'var(--text-secondary)' }}>Type: {linkedContract.type} • Statut: {linkedContract.status}</div>
                            </div>
                            <div style={{ marginLeft: 'auto', opacity: 0.7 }}>➜</div>
                        </Link>
                    ) : (
                        <div className="related-items-empty">
                            <span>📜</span>
                            <p>Aucun contrat lié à cette transaction</p>
                            {!isEditing && (
                                <Link to="/contracts/new" className="btn btn-secondary btn-sm">
                                    + Lier un Contrat (Via création)
                                </Link>
                            )}
                        </div>
                    )}
                </div>

                <div className="detail-meta">
                    <span>Créé le : {new Date(transaction.createdAt).toLocaleString()}</span>
                    <span>Mis à jour le : {new Date(transaction.updatedAt).toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
}
