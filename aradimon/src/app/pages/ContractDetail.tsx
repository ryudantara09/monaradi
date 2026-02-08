import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './DetailPage.css';
import type { Contract } from '../../core/models';

const statusColors: Record<string, string> = {
    draft: 'badge',
    active: 'badge badge-success',
    expired: 'badge badge-warning',
    cancelled: 'badge badge-danger',
};

const typeLabels: Record<string, string> = {
    ownership: 'Propriété',
    sale: 'Vente',
    purchase: 'Achat',
    lease: 'Location',
    other: 'Autre',
};

const statusLabels: Record<string, string> = {
    draft: 'Brouillon',
    active: 'Actif',
    expired: 'Expiré',
    cancelled: 'Annulé',
};

export function ContractDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [contract, setContract] = useState<Contract | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<Contract>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!id) return;

        const loadContract = async () => {
            if (typeof window !== 'undefined' && 'electronAPI' in window) {
                const data = await window.electronAPI.db.getContract(id) as Contract;
                setContract(data);
                setFormData(data);
            } else {
                const contracts = JSON.parse(localStorage.getItem('aradimon_contracts') || '[]') as Contract[];
                const found = contracts.find(c => c.id === id);
                if (found) {
                    setContract(found);
                    setFormData(found);
                }
            }
        };
        loadContract();
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!contract) return;
        setSaving(true);

        try {
            const updated = {
                ...contract,
                ...formData,
                updatedAt: new Date().toISOString(),
            };

            if (typeof window !== 'undefined' && 'electronAPI' in window) {
                await window.electronAPI.db.updateContract(id!, updated);
            } else {
                const contracts = JSON.parse(localStorage.getItem('aradimon_contracts') || '[]') as Contract[];
                const index = contracts.findIndex(c => c.id === id);
                if (index !== -1) {
                    contracts[index] = updated;
                    localStorage.setItem('aradimon_contracts', JSON.stringify(contracts));
                }
            }

            setContract(updated);
            setIsEditing(false);
        } catch (error) {
            console.error('Error saving contract:', error);
            alert('Erreur lors de l\'enregistrement du contrat');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce contrat ?')) return;

        try {
            if (typeof window !== 'undefined' && 'electronAPI' in window) {
                await window.electronAPI.db.deleteContract(id!);
            } else {
                const contracts = JSON.parse(localStorage.getItem('aradimon_contracts') || '[]') as Contract[];
                const filtered = contracts.filter(c => c.id !== id);
                localStorage.setItem('aradimon_contracts', JSON.stringify(filtered));
            }
            navigate('/contracts');
        } catch (error) {
            console.error('Error deleting contract:', error);
            alert('Erreur lors de la suppression du contrat');
        }
    };

    if (!contract) {
        return (
            <div className="detail-page animate-fade-in">
                <div className="loading-state">
                    <span className="loading-icon">⏳</span>
                    <p>Chargement du contrat...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="detail-page animate-fade-in">
            <header className="page-header">
                <div className="page-header-left">
                    <Link to="/contracts" className="back-link">← Retour aux Contrats</Link>
                    <h1 className="page-title">
                        <span className="entity-icon">📜</span>
                        {contract.contractNumber || 'Contrat'}
                    </h1>
                    <p className="page-subtitle">
                        <span className={statusColors[contract.status]}>{statusLabels[contract.status]}</span>
                        <span style={{ marginLeft: '0.5rem' }}>{typeLabels[contract.type]}</span>
                    </p>
                </div>
                <div className="page-actions">
                    {isEditing ? (
                        <>
                            <button className="btn btn-secondary" onClick={() => { setIsEditing(false); setFormData(contract); }}>
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
                    <h2 className="section-title">Détails du contrat</h2>

                    {isEditing ? (
                        <div className="edit-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Numéro de contrat</label>
                                    <input
                                        type="text"
                                        name="contractNumber"
                                        className="input"
                                        value={formData.contractNumber || ''}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Type</label>
                                    <select
                                        name="type"
                                        className="input"
                                        value={formData.type || 'ownership'}
                                        onChange={handleChange}
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
                                <label className="form-label">Statut</label>
                                <select
                                    name="status"
                                    className="input"
                                    value={formData.status || 'draft'}
                                    onChange={handleChange}
                                >
                                    <option value="draft">Brouillon</option>
                                    <option value="active">Actif</option>
                                    <option value="expired">Expiré</option>
                                    <option value="cancelled">Annulé</option>
                                </select>
                            </div>
                        </div>
                    ) : (
                        <div className="info-grid">
                            <div className="info-item">
                                <span className="info-label">📋 Numéro de contrat</span>
                                <span className="info-value">{contract.contractNumber || '—'}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">📂 Type</span>
                                <span className="info-value" style={{ textTransform: 'capitalize' }}>{typeLabels[contract.type]}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">📊 Statut</span>
                                <span className={statusColors[contract.status]}>{statusLabels[contract.status]}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="detail-section">
                    <h2 className="section-title">Dates</h2>

                    {isEditing ? (
                        <div className="edit-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Date de début</label>
                                    <input
                                        type="date"
                                        name="startDate"
                                        className="input"
                                        value={formData.startDate || ''}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Date de fin</label>
                                    <input
                                        type="date"
                                        name="endDate"
                                        className="input"
                                        value={formData.endDate || ''}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="info-grid">
                            <div className="info-item">
                                <span className="info-label">📅 Date de début</span>
                                <span className="info-value">
                                    {contract.startDate ? new Date(contract.startDate).toLocaleDateString() : '—'}
                                </span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">📅 Date de fin</span>
                                <span className="info-value">
                                    {contract.endDate ? new Date(contract.endDate).toLocaleDateString() : '—'}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="detail-section">
                    <h2 className="section-title">Termes & Notes</h2>

                    {isEditing ? (
                        <div className="edit-form">
                            <div className="form-group">
                                <label className="form-label">Termes du contrat</label>
                                <textarea
                                    name="terms"
                                    className="input textarea"
                                    value={formData.terms || ''}
                                    onChange={handleChange}
                                    rows={4}
                                    placeholder="Termes et conditions clés..."
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Notes</label>
                                <textarea
                                    name="notes"
                                    className="input textarea"
                                    value={formData.notes || ''}
                                    onChange={handleChange}
                                    rows={3}
                                    placeholder="Notes supplémentaires..."
                                />
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="info-item full-width" style={{ marginBottom: '1rem' }}>
                                <span className="info-label">📋 Termes</span>
                                <p className="notes-content">{contract.terms || 'Aucun terme spécifié'}</p>
                            </div>
                            <div className="info-item full-width">
                                <span className="info-label">📝 Notes</span>
                                <p className="notes-content">{contract.notes || 'Pas de notes'}</p>
                            </div>
                        </>
                    )}
                </div>

                <div className="detail-section">
                    <h2 className="section-title">Parties & Terrains associés</h2>

                    {/* Display Terrains */}
                    <div className="relations-subsection">
                        <h3 className="subsection-title">Terrains ({(contract as any).terrains?.length || 0})</h3>
                        {((contract as any).terrains && (contract as any).terrains.length > 0) ? (
                            <div className="related-items-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
                                {(contract as any).terrains.map((t: any) => (
                                    <Link key={t.id} to={`/terrains/${t.id}`} className="related-item-card" style={{ display: 'flex', alignItems: 'center', padding: '10px', background: 'var(--bg-secondary)', borderRadius: '8px', textDecoration: 'none', color: 'inherit' }}>
                                        <span className="related-icon" style={{ fontSize: '1.5rem', marginRight: '10px' }}>🗺️</span>
                                        <div className="related-info">
                                            <div className="related-name" style={{ fontWeight: 'bold' }}>{t.name}</div>
                                            <div className="related-sub" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t.address}</div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="no-items-text">Aucun terrain lié</p>
                        )}
                    </div>

                    {/* Display Parties */}
                    <div className="relations-subsection" style={{ marginTop: '1.5rem' }}>
                        <h3 className="subsection-title">Parties Prenantes ({(contract as any).parties?.length || 0})</h3>
                        {((contract as any).parties && (contract as any).parties.length > 0) ? (
                            <div className="related-items-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
                                {(contract as any).parties.map((p: any) => (
                                    <Link key={p.id} to={`/customers/${p.id}`} className="related-item-card" style={{ display: 'flex', alignItems: 'center', padding: '10px', background: 'var(--bg-secondary)', borderRadius: '8px', textDecoration: 'none', color: 'inherit' }}>
                                        <span className="related-icon" style={{ fontSize: '1.5rem', marginRight: '10px' }}>👤</span>
                                        <div className="related-info">
                                            <div className="related-name" style={{ fontWeight: 'bold' }}>{p.name} ({p.role})</div>
                                            <div className="related-sub" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{p.email}</div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="no-items-text">Aucune partie liée</p>
                        )}
                    </div>
                </div>

                <div className="detail-meta">
                    <span>Créé le : {new Date(contract.createdAt).toLocaleString()}</span>
                    <span>Mis à jour le : {new Date(contract.updatedAt).toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
}
