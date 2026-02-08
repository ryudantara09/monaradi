import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import './Forms.css';
import type { Contract } from '../../core/models';

export function TransactionForm() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        type: 'sale' as 'sale' | 'purchase',
        transactionDate: new Date().toISOString().split('T')[0],
        price: '',
        currency: 'TND',
        notes: '',
        contractId: '',
    });
    const [saving, setSaving] = useState(false);
    const [contracts, setContracts] = useState<Contract[]>([]);

    useEffect(() => {
        const loadContracts = async () => {
            if (typeof window !== 'undefined' && 'electronAPI' in window) {
                const data = await window.electronAPI.db.getContracts() as Contract[];
                setContracts(data);
            } else {
                setContracts(JSON.parse(localStorage.getItem('aradimon_contracts') || '[]'));
            }
        };
        loadContracts();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const transaction = {
                id: uuidv4(),
                contractId: formData.contractId || null,
                type: formData.type,
                transactionDate: formData.transactionDate,
                price: parseFloat(formData.price),
                currency: formData.currency,
                notes: formData.notes || null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            if (typeof window !== 'undefined' && 'electronAPI' in window) {
                await window.electronAPI.db.createTransaction(transaction);
            } else {
                const transactions = JSON.parse(localStorage.getItem('aradimon_transactions') || '[]');
                transactions.push(transaction);
                localStorage.setItem('aradimon_transactions', JSON.stringify(transactions));
            }

            navigate('/transactions');
        } catch (error) {
            console.error('Error creating transaction:', error);
            alert('Erreur lors de la création de la transaction');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="form-page animate-fade-in">
            <header className="page-header">
                <div className="page-header-left">
                    <h1 className="page-title">Enregistrer une transaction</h1>
                    <p className="page-subtitle">Enregistrer une transaction de vente ou d'achat</p>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="entity-form">
                <div className="form-section">
                    <h2 className="form-section-title">Type de transaction</h2>

                    <div className="type-selector">
                        <button
                            type="button"
                            className={`type-option ${formData.type === 'sale' ? 'active' : ''}`}
                            onClick={() => setFormData(prev => ({ ...prev, type: 'sale' }))}
                        >
                            <span className="type-icon">🏷️</span>
                            <span className="type-label">Vente</span>
                            <span className="type-desc">Vente de terrain/propriété</span>
                        </button>
                        <button
                            type="button"
                            className={`type-option ${formData.type === 'purchase' ? 'active' : ''}`}
                            onClick={() => setFormData(prev => ({ ...prev, type: 'purchase' }))}
                        >
                            <span className="type-icon">🛒</span>
                            <span className="type-label">Achat</span>
                            <span className="type-desc">Achat de terrain/propriété</span>
                        </button>
                    </div>
                </div>

                <div className="form-section">
                    <h2 className="form-section-title">Détails de la transaction</h2>

                    <div className="form-group">
                        <label className="form-label" htmlFor="contractId">Contrat lié (Optionnel)</label>
                        <select
                            id="contractId"
                            name="contractId"
                            className="input"
                            value={formData.contractId}
                            onChange={handleChange}
                        >
                            <option value="">-- Aucun contrat sélectionné --</option>
                            {contracts.map(contract => (
                                <option key={contract.id} value={contract.id}>
                                    {contract.contractNumber || 'Sans Numéro'} - {contract.type} ({new Date(contract.createdAt).toLocaleDateString()})
                                </option>
                            ))}
                        </select>
                        <div className="help-text">Lier cette transaction à un contrat existant pour associer automatiquement le terrain et les parties.</div>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="transactionDate">Date de transaction *</label>
                        <input
                            type="date"
                            id="transactionDate"
                            name="transactionDate"
                            className="input"
                            value={formData.transactionDate}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group" style={{ flex: 2 }}>
                            <label className="form-label" htmlFor="price">Prix *</label>
                            <input
                                type="number"
                                id="price"
                                name="price"
                                className="input"
                                value={formData.price}
                                onChange={handleChange}
                                placeholder="ex : 150000"
                                step="0.01"
                                min="0"
                                required
                            />
                        </div>

                        <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label" htmlFor="currency">Devise</label>
                            <select
                                id="currency"
                                name="currency"
                                className="input"
                                value={formData.currency}
                                onChange={handleChange}
                            >
                                <option value="TND">TND (TND)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="USD">USD ($)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <h2 className="form-section-title">Informations supplémentaires</h2>

                    <div className="form-group">
                        <label className="form-label" htmlFor="notes">Notes</label>
                        <textarea
                            id="notes"
                            name="notes"
                            className="input textarea"
                            value={formData.notes}
                            onChange={handleChange}
                            placeholder="Détails du paiement, conditions, etc."
                            rows={4}
                        />
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => navigate('/transactions')}>
                        Annuler
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Enregistrement...' : '+ Enregistrer Transaction'}
                    </button>
                </div>
            </form>
        </div>
    );
}
