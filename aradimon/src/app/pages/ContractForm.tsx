import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import './Forms.css';
import type { Terrain, Customer } from '../../core/models';

export function ContractForm() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        contractNumber: '',
        type: 'ownership' as 'ownership' | 'sale' | 'purchase' | 'lease' | 'other',
        status: 'draft' as 'draft' | 'active' | 'expired' | 'cancelled',
        startDate: '',
        endDate: '',
        terms: '',
        notes: '',
    });
    const [saving, setSaving] = useState(false);

    // Relations state
    const [availableTerrains, setAvailableTerrains] = useState<Terrain[]>([]);
    const [availableCustomers, setAvailableCustomers] = useState<Customer[]>([]);
    const [selectedTerrains, setSelectedTerrains] = useState<string[]>([]);
    const [parties, setParties] = useState<{ customerId: string; role: string }[]>([]);

    useEffect(() => {
        const loadData = async () => {
            if (typeof window !== 'undefined' && 'electronAPI' in window) {
                const terrains = await window.electronAPI.db.getTerrains() as Terrain[];
                const customers = await window.electronAPI.db.getCustomers() as Customer[];
                setAvailableTerrains(terrains);
                setAvailableCustomers(customers);
            } else {
                setAvailableTerrains(JSON.parse(localStorage.getItem('aradimon_terrains') || '[]'));
                setAvailableCustomers(JSON.parse(localStorage.getItem('aradimon_customers') || '[]'));
            }
        };
        loadData();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleTerrainChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const options = e.target.options;
        const selected: string[] = [];
        for (let i = 0; i < options.length; i++) {
            if (options[i].selected) {
                selected.push(options[i].value);
            }
        }
        setSelectedTerrains(selected);
    };

    const addParty = () => {
        if (availableCustomers.length === 0) return;
        setParties(prev => [...prev, { customerId: availableCustomers[0].id, role: 'owner' }]);
    };

    const updateParty = (index: number, field: 'customerId' | 'role', value: string) => {
        setParties(prev => {
            const newParties = [...prev];
            newParties[index] = { ...newParties[index], [field]: value };
            return newParties;
        });
    };

    const removeParty = (index: number) => {
        setParties(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const contract = {
                id: uuidv4(),
                contractNumber: formData.contractNumber || null,
                type: formData.type,
                status: formData.status,
                startDate: formData.startDate || null,
                endDate: formData.endDate || null,
                terms: formData.terms || null,
                notes: formData.notes || null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                // Validation relations
                terrains: selectedTerrains,
                parties: parties,
            };

            if (typeof window !== 'undefined' && 'electronAPI' in window) {
                await window.electronAPI.db.createContract(contract);
            } else {
                const contracts = JSON.parse(localStorage.getItem('aradimon_contracts') || '[]');
                contracts.push(contract);
                localStorage.setItem('aradimon_contracts', JSON.stringify(contracts));
                // Note: LocalStorage relation updates skipped for brevity in dev mode mock
            }

            navigate('/contracts');
        } catch (error) {
            console.error('Error creating contract:', error);
            alert('Erreur lors de la création du contrat');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="form-page animate-fade-in">
            <header className="page-header">
                <div className="page-header-left">
                    <h1 className="page-title">Créer un nouveau contrat</h1>
                    <p className="page-subtitle">Définir les contrats de propriété, vente, achat ou location</p>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="entity-form">
                <div className="form-section">
                    <h2 className="form-section-title">Détails du contrat</h2>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label" htmlFor="contractNumber">Numéro de contrat</label>
                            <input
                                type="text"
                                id="contractNumber"
                                name="contractNumber"
                                className="input"
                                value={formData.contractNumber}
                                onChange={handleChange}
                                placeholder="ex : CTR-2024-001"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="type">Type de contrat *</label>
                            <select
                                id="type"
                                name="type"
                                className="input"
                                value={formData.type}
                                onChange={handleChange}
                                required
                            >
                                <option value="ownership">Propriété</option>
                                <option value="sale">Vente</option>
                                <option value="purchase">Achat</option>
                                <option value="lease">Location</option>
                                <option value="other">Autre</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="status">Statut</label>
                        <select
                            id="status"
                            name="status"
                            className="input"
                            value={formData.status}
                            onChange={handleChange}
                        >
                            <option value="draft">Brouillon</option>
                            <option value="active">Actif</option>
                            <option value="expired">Expiré</option>
                            <option value="cancelled">Annulé</option>
                        </select>
                    </div>
                </div>

                <div className="form-section">
                    <h2 className="form-section-title">Relations</h2>

                    <div className="form-group">
                        <label className="form-label" htmlFor="terrains">Terrains liés (Ctrl+Clic pour plusieurs)</label>
                        <select
                            id="terrains"
                            name="terrains"
                            className="input"
                            multiple
                            value={selectedTerrains}
                            onChange={handleTerrainChange}
                            size={4}
                        >
                            {availableTerrains.map(terrain => (
                                <option key={terrain.id} value={terrain.id}>
                                    {terrain.name} {terrain.address ? `- ${terrain.address}` : ''}
                                </option>
                            ))}
                        </select>
                        <div className="help-text">Sélectionnez les terrains concernés par ce contrat.</div>
                    </div>

                    <div className="form-group">
                        <div className="flex-row-between">
                            <label className="form-label">Parties prenantes</label>
                            <button type="button" className="btn btn-secondary btn-sm" onClick={addParty}>
                                + Ajouter Partie
                            </button>
                        </div>

                        {parties.length === 0 ? (
                            <p className="no-items-text">Aucune partie ajoutée</p>
                        ) : (
                            <div className="parties-list">
                                {parties.map((party, index) => (
                                    <div key={index} className="party-row" style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <select
                                            className="input"
                                            value={party.customerId}
                                            onChange={(e) => updateParty(index, 'customerId', e.target.value)}
                                            style={{ flex: 2 }}
                                        >
                                            {availableCustomers.map(customer => (
                                                <option key={customer.id} value={customer.id}>
                                                    {customer.name}
                                                </option>
                                            ))}
                                        </select>
                                        <select
                                            className="input"
                                            value={party.role}
                                            onChange={(e) => updateParty(index, 'role', e.target.value)}
                                            style={{ flex: 1 }}
                                        >
                                            <option value="owner">Propriétaire</option>
                                            <option value="buyer">Acheteur</option>
                                            <option value="seller">Vendeur</option>
                                            <option value="lessor">Bailleur</option>
                                            <option value="lessee">Locataire</option>
                                            <option value="party">Autre</option>
                                        </select>
                                        <button
                                            type="button"
                                            className="btn btn-danger btn-icon"
                                            onClick={() => removeParty(index)}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="form-section">
                    <h2 className="form-section-title">Dates</h2>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label" htmlFor="startDate">Date de début</label>
                            <input
                                type="date"
                                id="startDate"
                                name="startDate"
                                className="input"
                                value={formData.startDate}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="endDate">Date de fin</label>
                            <input
                                type="date"
                                id="endDate"
                                name="endDate"
                                className="input"
                                value={formData.endDate}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <h2 className="form-section-title">Termes & Notes</h2>

                    <div className="form-group">
                        <label className="form-label" htmlFor="terms">Termes du contrat</label>
                        <textarea
                            id="terms"
                            name="terms"
                            className="input textarea"
                            value={formData.terms}
                            onChange={handleChange}
                            placeholder="Termes et conditions clés..."
                            rows={4}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="notes">Notes</label>
                        <textarea
                            id="notes"
                            name="notes"
                            className="input textarea"
                            value={formData.notes}
                            onChange={handleChange}
                            placeholder="Notes supplémentaires..."
                            rows={3}
                        />
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => navigate('/contracts')}>
                        Annuler
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Enregistrement...' : '+ Créer Contrat'}
                    </button>
                </div>
            </form>
        </div>
    );
}
