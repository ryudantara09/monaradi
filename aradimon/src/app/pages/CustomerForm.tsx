import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import './Forms.css';

export function CustomerForm() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        type: 'individual' as 'individual' | 'legal_entity',
        name: '',
        email: '',
        phone: '',
        address: '',
        idNumber: '',
        legalRegNumber: '',
        notes: '',
    });
    const [saving, setSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const customer = {
                id: uuidv4(),
                type: formData.type,
                name: formData.name,
                email: formData.email || null,
                phone: formData.phone || null,
                address: formData.address || null,
                idNumber: formData.idNumber || null,
                legalRegNumber: formData.legalRegNumber || null,
                notes: formData.notes || null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            if (typeof window !== 'undefined' && 'electronAPI' in window) {
                await window.electronAPI.db.createCustomer(customer);
            } else {
                const customers = JSON.parse(localStorage.getItem('aradimon_customers') || '[]');
                customers.push(customer);
                localStorage.setItem('aradimon_customers', JSON.stringify(customers));
            }

            navigate('/customers');
        } catch (error) {
            console.error('Error creating customer:', error);
            alert('Erreur lors de la création du client');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="form-page animate-fade-in">
            <header className="page-header">
                <div className="page-header-left">
                    <h1 className="page-title">Ajouter un nouveau client</h1>
                    <p className="page-subtitle">Créer un particulier ou une entité juridique</p>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="entity-form">
                <div className="form-section">
                    <h2 className="form-section-title">Type de client</h2>

                    <div className="type-selector">
                        <button
                            type="button"
                            className={`type-option ${formData.type === 'individual' ? 'active' : ''}`}
                            onClick={() => setFormData(prev => ({ ...prev, type: 'individual' }))}
                        >
                            <span className="type-icon">👤</span>
                            <span className="type-label">Particulier</span>
                        </button>
                        <button
                            type="button"
                            className={`type-option ${formData.type === 'legal_entity' ? 'active' : ''}`}
                            onClick={() => setFormData(prev => ({ ...prev, type: 'legal_entity' }))}
                        >
                            <span className="type-icon">🏢</span>
                            <span className="type-label">Personne Morale</span>
                        </button>
                    </div>
                </div>

                <div className="form-section">
                    <h2 className="form-section-title">Informations de base</h2>

                    <div className="form-group">
                        <label className="form-label" htmlFor="name">
                            {formData.type === 'individual' ? 'Nom Complet' : 'Raison Sociale'} *
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            className="input"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder={formData.type === 'individual' ? 'ex : Jean Dupont' : 'ex : Société Alpha'}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label" htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                className="input"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="email@exemple.com"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="phone">Téléphone</label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                className="input"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="+216 12 345 678"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="address">Adresse</label>
                        <input
                            type="text"
                            id="address"
                            name="address"
                            className="input"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Adresse complète"
                        />
                    </div>
                </div>

                <div className="form-section">
                    <h2 className="form-section-title">Identification</h2>

                    {formData.type === 'individual' ? (
                        <div className="form-group">
                            <label className="form-label" htmlFor="idNumber">Numéro d'identité</label>
                            <input
                                type="text"
                                id="idNumber"
                                name="idNumber"
                                className="input"
                                value={formData.idNumber}
                                onChange={handleChange}
                                placeholder="CIN, Passeport, etc."
                            />
                        </div>
                    ) : (
                        <div className="form-group">
                            <label className="form-label" htmlFor="legalRegNumber">Matricule Fiscale</label>
                            <input
                                type="text"
                                id="legalRegNumber"
                                name="legalRegNumber"
                                className="input"
                                value={formData.legalRegNumber}
                                onChange={handleChange}
                                placeholder="Numéro d'enregistrement de l'entreprise"
                            />
                        </div>
                    )}
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
                            placeholder="Notes supplémentaires..."
                            rows={4}
                        />
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => navigate('/customers')}>
                        Annuler
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Enregistrement...' : '+ Créer Client'}
                    </button>
                </div>
            </form>
        </div>
    );
}
