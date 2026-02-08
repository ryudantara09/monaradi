import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Terrains.css';
import type { Terrain } from '../../core/models';

export function Terrains() {
    const [terrains, setTerrains] = useState<Terrain[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Load terrains
    useEffect(() => {
        const loadTerrains = async () => {
            if (typeof window !== 'undefined' && 'electronAPI' in window) {
                const data = await window.electronAPI.db.getTerrains();
                setTerrains(data);
            } else {
                // For web dev, load from localStorage
                const data = JSON.parse(localStorage.getItem('aradimon_terrains') || '[]');
                setTerrains(data);
            }
        };
        loadTerrains();

        // Also listen for storage events (updates from other tabs)
        const handleStorage = () => {
            const data = JSON.parse(localStorage.getItem('aradimon_terrains') || '[]');
            setTerrains(data);
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    const filteredTerrains = terrains.filter(terrain =>
        terrain.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        terrain.address?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="terrains-page animate-fade-in">
            <header className="page-header">
                <div className="page-header-left">
                    <h1 className="page-title">Terrains</h1>
                    <p className="page-subtitle">Gérez vos parcelles et propriétés foncières</p>
                </div>
                <div className="page-actions">
                    <Link to="/terrains/new" className="btn btn-primary">
                        <span>+ Ajouter Terrain</span>
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
                        placeholder="Rechercher terrains..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="toolbar-actions">
                    <div className="view-toggle">
                        <button
                            className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                            onClick={() => setViewMode('grid')}
                        >
                            ⊞
                        </button>
                        <button
                            className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                            onClick={() => setViewMode('list')}
                        >
                            ☰
                        </button>
                    </div>
                    <button className="btn btn-secondary">
                        <span>⚙ Filtrer</span>
                    </button>
                </div>
            </div>

            {/* Content */}
            {filteredTerrains.length === 0 ? (
                <div className="empty-state-large">
                    <div className="empty-icon">🗺️</div>
                    <h2 className="empty-title">Aucun terrain</h2>
                    <p className="empty-description">
                        Commencez par ajouter votre première parcelle ou propriété.
                    </p>
                    <Link to="/terrains/new" className="btn btn-primary btn-lg">
                        <span>+ Ajouter Premier Terrain</span>
                    </Link>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="terrains-grid">
                    {filteredTerrains.map((terrain) => (
                        <Link key={terrain.id} to={`/terrains/${terrain.id}`} className="terrain-card">
                            <div className="terrain-card-map">
                                <div className="map-placeholder">
                                    <span>🗺️</span>
                                </div>
                            </div>
                            <div className="terrain-card-content">
                                <h3 className="terrain-name">{terrain.name}</h3>
                                <p className="terrain-address">{terrain.address || 'Pas d\'adresse'}</p>
                                <div className="terrain-meta">
                                    {terrain.areaSize && (
                                        <span className="terrain-area">
                                            📐 {terrain.areaSize.toLocaleString()} {terrain.areaUnit}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="content-section">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Nom</th>
                                <th>Adresse</th>
                                <th>Surface</th>
                                <th>Coordonnées</th>
                                <th>Créé le</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTerrains.map((terrain) => (
                                <tr key={terrain.id}>
                                    <td>
                                        <Link to={`/terrains/${terrain.id}`} className="terrain-link">
                                            {terrain.name}
                                        </Link>
                                    </td>
                                    <td>{terrain.address || '—'}</td>
                                    <td>{terrain.areaSize ? `${terrain.areaSize.toLocaleString()} ${terrain.areaUnit}` : '—'}</td>
                                    <td>
                                        {terrain.latitude && terrain.longitude
                                            ? `${terrain.latitude.toFixed(4)}, ${terrain.longitude.toFixed(4)}`
                                            : '—'}
                                    </td>
                                    <td>{new Date(terrain.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
