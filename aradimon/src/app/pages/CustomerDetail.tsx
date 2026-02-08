import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './DetailPage.css';
import type { Customer } from '../../core/models';

export function CustomerDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<Customer>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!id) return;

        const loadCustomer = async () => {
            if (typeof window !== 'undefined' && 'electronAPI' in window) {
                const data = await window.electronAPI.db.getCustomer(id) as Customer;
                setCustomer(data);
                setFormData(data);
            } else {
                const customers = JSON.parse(localStorage.getItem('aradimon_customers') || '[]') as Customer[];
                const found = customers.find(c => c.id === id);
                if (found) {
                    setCustomer(found);
                    setFormData(found);
                }
            }
        };
        loadCustomer();
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!customer) return;
        setSaving(true);

        try {
            const updated = {
                ...customer,
                ...formData,
                updatedAt: new Date().toISOString(),
            };

            if (typeof window !== 'undefined' && 'electronAPI' in window) {
                await window.electronAPI.db.updateCustomer(id!, updated);
            } else {
                const customers = JSON.parse(localStorage.getItem('aradimon_customers') || '[]') as Customer[];
                const index = customers.findIndex(c => c.id === id);
                if (index !== -1) {
                    customers[index] = updated;
                    localStorage.setItem('aradimon_customers', JSON.stringify(customers));
                }
            }

            setCustomer(updated);
            setIsEditing(false);
        } catch (error) {
            console.error('Error saving customer:', error);
            alert('Erreur lors de l\'enregistrement du client');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) return;

        try {
            if (typeof window !== 'undefined' && 'electronAPI' in window) {
                await window.electronAPI.db.deleteCustomer(id!);
            } else {
                const customers = JSON.parse(localStorage.getItem('aradimon_customers') || '[]') as Customer[];
                const filtered = customers.filter(c => c.id !== id);
                localStorage.setItem('aradimon_customers', JSON.stringify(filtered));
            }
            navigate('/customers');
        } catch (error) {
            console.error('Error deleting customer:', error);
            alert('Erreur lors de la suppression du client');
        }
    };

    if (!customer) {
        return (
            <div className="detail-page animate-fade-in">
                <div className="loading-state">
                    <span className="loading-icon">⏳</span>
                    <p>Chargement du client...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="detail-page animate-fade-in">
            <header className="page-header">
                <div className="page-header-left">
                    <Link to="/customers" className="back-link">← Retour aux Clients</Link>
                    <h1 className="page-title">
                        <span className="entity-icon">{customer.type === 'individual' ? '👤' : '🏢'}</span>
                        {customer.name}
                    </h1>
                    <p className="page-subtitle">
                        {customer.type === 'individual' ? 'Particulier' : 'Personne Morale'}
                    </p>
                </div>
                <div className="page-actions">
                    {isEditing ? (
                        <>
                            <button className="btn btn-secondary" onClick={() => { setIsEditing(false); setFormData(customer); }}>
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
                    <h2 className="section-title">Informations de contact</h2>

                    {isEditing ? (
                        <div className="edit-form">
                            <div className="form-group">
                                <label className="form-label">Nom</label>
                                <input
                                    type="text"
                                    name="name"
                                    className="input"
                                    value={formData.name || ''}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        className="input"
                                        value={formData.email || ''}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Téléphone</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        className="input"
                                        value={formData.phone || ''}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Adresse</label>
                                <input
                                    type="text"
                                    name="address"
                                    className="input"
                                    value={formData.address || ''}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="info-grid">
                            <div className="info-item">
                                <span className="info-label">📧 Email</span>
                                <span className="info-value">{customer.email || '—'}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">📞 Téléphone</span>
                                <span className="info-value">{customer.phone || '—'}</span>
                            </div>
                            <div className="info-item full-width">
                                <span className="info-label">📍 Adresse</span>
                                <span className="info-value">{customer.address || '—'}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="detail-section">
                    <h2 className="section-title">Identification</h2>

                    {isEditing ? (
                        <div className="edit-form">
                            {customer.type === 'individual' ? (
                                <div className="form-group">
                                    <label className="form-label">Numéro d'identité</label>
                                    <input
                                        type="text"
                                        name="idNumber"
                                        className="input"
                                        value={formData.idNumber || ''}
                                        onChange={handleChange}
                                    />
                                </div>
                            ) : (
                                <div className="form-group">
                                    <label className="form-label">Matricule Fiscale</label>
                                    <input
                                        type="text"
                                        name="legalRegNumber"
                                        className="input"
                                        value={formData.legalRegNumber || ''}
                                        onChange={handleChange}
                                    />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="info-grid">
                            {customer.type === 'individual' ? (
                                <div className="info-item">
                                    <span className="info-label">🪪 Numéro d'identité</span>
                                    <span className="info-value">{customer.idNumber || '—'}</span>
                                </div>
                            ) : (
                                <div className="info-item">
                                    <span className="info-label">🏛️ Matricule Fiscale</span>
                                    <span className="info-value">{customer.legalRegNumber || '—'}</span>
                                </div>
                            )}
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
                                    placeholder="Notes supplémentaires..."
                                />
                            </div>
                        </div>
                    ) : (
                        <p className="notes-content">{customer.notes || 'Pas de notes'}</p>
                    )}
                </div>

                <div className="detail-section">
                    <h2 className="section-title">Éléments associés</h2>
                    <div className="related-items-empty">
                        <span>📋</span>
                        <p>Aucun terrain ou contrat associé pour le moment</p>
                        <Link to="/contracts/new" className="btn btn-secondary btn-sm">
                            + Créer Contrat
                        </Link>
                    </div>
                </div>

                <div className="detail-meta">
                    <span>Créé le : {new Date(customer.createdAt).toLocaleString()}</span>
                    <span>Mis à jour le : {new Date(customer.updatedAt).toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
}
