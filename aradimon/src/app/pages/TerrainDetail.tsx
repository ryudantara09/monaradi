import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './DetailPage.css';
import type { Terrain } from '../../core/models';

export function TerrainDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [terrain, setTerrain] = useState<Terrain | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<Terrain>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!id) return;

        const loadTerrain = async () => {
            if (typeof window !== 'undefined' && 'electronAPI' in window) {
                const data = await window.electronAPI.db.getTerrain(id) as Terrain;
                setTerrain(data);
                setFormData(data);
            } else {
                const terrains = JSON.parse(localStorage.getItem('aradimon_terrains') || '[]') as Terrain[];
                const found = terrains.find(t => t.id === id);
                if (found) {
                    setTerrain(found);
                    setFormData(found);
                }
            }
        };
        loadTerrain();
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? (value ? parseFloat(value) : null) : value
        }));
    };

    const handleSave = async () => {
        if (!terrain) return;
        setSaving(true);

        try {
            const updated = {
                ...terrain,
                ...formData,
                updatedAt: new Date().toISOString(),
            };

            if (typeof window !== 'undefined' && 'electronAPI' in window) {
                await window.electronAPI.db.updateTerrain(id!, updated);
            } else {
                const terrains = JSON.parse(localStorage.getItem('aradimon_terrains') || '[]') as Terrain[];
                const index = terrains.findIndex(t => t.id === id);
                if (index !== -1) {
                    terrains[index] = updated;
                    localStorage.setItem('aradimon_terrains', JSON.stringify(terrains));
                }
            }

            setTerrain(updated);
            setIsEditing(false);
        } catch (error) {
            console.error('Error saving terrain:', error);
            alert('Erreur lors de l\'enregistrement du terrain');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce terrain ?')) return;

        try {
            if (typeof window !== 'undefined' && 'electronAPI' in window) {
                await window.electronAPI.db.deleteTerrain(id!);
            } else {
                const terrains = JSON.parse(localStorage.getItem('aradimon_terrains') || '[]') as Terrain[];
                const filtered = terrains.filter(t => t.id !== id);
                localStorage.setItem('aradimon_terrains', JSON.stringify(filtered));
            }
            navigate('/terrains');
        } catch (error) {
            console.error('Error deleting terrain:', error);
            alert('Erreur lors de la suppression du terrain');
        }
    };

    if (!terrain) {
        return (
            <div className="detail-page animate-fade-in">
                <div className="loading-state">
                    <span className="loading-icon">⏳</span>
                    <p>Chargement du terrain...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="detail-page animate-fade-in">
            <header className="page-header">
                <div className="page-header-left">
                    <Link to="/terrains" className="back-link">← Retour aux Terrains</Link>
                    <h1 className="page-title">
                        <span className="entity-icon">🗺️</span>
                        {terrain.name}
                    </h1>
                    <p className="page-subtitle">
                        {terrain.address || 'Aucune adresse spécifiée'}
                    </p>
                </div>
                <div className="page-actions">
                    {isEditing ? (
                        <>
                            <button className="btn btn-secondary" onClick={() => { setIsEditing(false); setFormData(terrain); }}>
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
                    <h2 className="section-title">Informations de base</h2>

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
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Surface</label>
                                    <input
                                        type="number"
                                        name="areaSize"
                                        className="input"
                                        value={formData.areaSize || ''}
                                        onChange={handleChange}
                                        step="0.01"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Unité</label>
                                    <select
                                        name="areaUnit"
                                        className="input"
                                        value={formData.areaUnit || 'sqm'}
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
                    ) : (
                        <div className="info-grid">
                            <div className="info-item">
                                <span className="info-label">📐 Surface</span>
                                <span className="info-value">
                                    {terrain.areaSize ? `${terrain.areaSize.toLocaleString()} ${terrain.areaUnit}` : '—'}
                                </span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">🗺️ Référence cartographique</span>
                                <span className="info-value">{terrain.mapReference || '—'}</span>
                            </div>
                            <div className="info-item full-width">
                                <span className="info-label">📍 Adresse</span>
                                <span className="info-value">{terrain.address || '—'}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="detail-section">
                    <h2 className="section-title">Coordonnées de l'emplacement</h2>

                    {isEditing ? (
                        <div className="edit-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Latitude</label>
                                    <input
                                        type="number"
                                        name="latitude"
                                        className="input"
                                        value={formData.latitude || ''}
                                        onChange={handleChange}
                                        step="0.0001"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Longitude</label>
                                    <input
                                        type="number"
                                        name="longitude"
                                        className="input"
                                        value={formData.longitude || ''}
                                        onChange={handleChange}
                                        step="0.0001"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Référence cartographique</label>
                                <input
                                    type="text"
                                    name="mapReference"
                                    className="input"
                                    value={formData.mapReference || ''}
                                    onChange={handleChange}
                                    placeholder="Référence cadastrale ou ID de carte"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="info-grid">
                            <div className="info-item">
                                <span className="info-label">📍 Latitude</span>
                                <span className="info-value">{terrain.latitude ?? '—'}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">📍 Longitude</span>
                                <span className="info-value">{terrain.longitude ?? '—'}</span>
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
                                    placeholder="Notes supplémentaires..."
                                />
                            </div>
                        </div>
                    ) : (
                        <p className="notes-content">{terrain.notes || 'Pas de notes'}</p>
                    )}
                </div>

                <div className="detail-section">
                    <h2 className="section-title">Propriété & Contrats</h2>
                    <div className="related-items-empty">
                        <span>📋</span>
                        <p>Aucun dossier de propriété ou contrat lié pour le moment</p>
                        <Link to="/contracts/new" className="btn btn-secondary btn-sm">
                            + Créer Contrat
                        </Link>
                    </div>
                </div>

                <div className="detail-meta">
                    <span>Créé le : {new Date(terrain.createdAt).toLocaleString()}</span>
                    <span>Mis à jour le : {new Date(terrain.updatedAt).toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
}
