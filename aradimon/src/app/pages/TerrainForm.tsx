import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import './Forms.css';

export function TerrainForm() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        latitude: '',
        longitude: '',
        mapReference: '',
        areaSize: '',
        areaUnit: 'sqm',
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
            const terrain = {
                id: uuidv4(),
                name: formData.name,
                address: formData.address || null,
                latitude: formData.latitude ? parseFloat(formData.latitude) : null,
                longitude: formData.longitude ? parseFloat(formData.longitude) : null,
                mapReference: formData.mapReference || null,
                areaSize: formData.areaSize ? parseFloat(formData.areaSize) : null,
                areaUnit: formData.areaUnit,
                notes: formData.notes || null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            if (typeof window !== 'undefined' && 'electronAPI' in window) {
                await window.electronAPI.db.createTerrain(terrain);
            } else {
                // For web dev, store in localStorage temporarily
                const terrains = JSON.parse(localStorage.getItem('aradimon_terrains') || '[]');
                terrains.push(terrain);
                localStorage.setItem('aradimon_terrains', JSON.stringify(terrains));
            }

            navigate('/terrains');
        } catch (error) {
            console.error('Error creating terrain:', error);
            alert('Erreur lors de la création du terrain');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="form-page animate-fade-in">
            <header className="page-header">
                <div className="page-header-left">
                    <h1 className="page-title">Ajouter un nouveau terrain</h1>
                    <p className="page-subtitle">Créer une nouvelle entrée de parcelle de terrain</p>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="entity-form">
                <div className="form-section">
                    <h2 className="form-section-title">Informations de base</h2>

                    <div className="form-group">
                        <label className="form-label" htmlFor="name">Nom *</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            className="input"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="ex : Parcelle Nord"
                            required
                        />
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
                            placeholder="Adresse complète ou description du lieu"
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label" htmlFor="areaSize">Surface</label>
                            <input
                                type="number"
                                id="areaSize"
                                name="areaSize"
                                className="input"
                                value={formData.areaSize}
                                onChange={handleChange}
                                placeholder="ex : 5000"
                                step="0.01"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="areaUnit">Unité</label>
                            <select
                                id="areaUnit"
                                name="areaUnit"
                                className="input"
                                value={formData.areaUnit}
                                onChange={handleChange}
                            >
                                <option value="sqm">Mètres Carrés (m²)</option>
                                <option value="sqft">Pieds Carrés (ft²)</option>
                                <option value="hectare">Hectares</option>
                                <option value="acre">Acres</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <h2 className="form-section-title">Détails de l'emplacement</h2>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label" htmlFor="latitude">Latitude</label>
                            <input
                                type="number"
                                id="latitude"
                                name="latitude"
                                className="input"
                                value={formData.latitude}
                                onChange={handleChange}
                                placeholder="ex : 34.0522"
                                step="0.0001"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="longitude">Longitude</label>
                            <input
                                type="number"
                                id="longitude"
                                name="longitude"
                                className="input"
                                value={formData.longitude}
                                onChange={handleChange}
                                placeholder="ex : -118.2437"
                                step="0.0001"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="mapReference">Référence cartographique</label>
                        <input
                            type="text"
                            id="mapReference"
                            name="mapReference"
                            className="input"
                            value={formData.mapReference}
                            onChange={handleChange}
                            placeholder="Référence cadastrale ou ID de carte"
                        />
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
                            placeholder="Notes supplémentaires sur ce terrain..."
                            rows={4}
                        />
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => navigate('/terrains')}>
                        Annuler
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Enregistrement...' : '+ Créer Terrain'}
                    </button>
                </div>
            </form>
        </div>
    );
}
