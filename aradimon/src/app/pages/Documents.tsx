import { useState } from 'react';
import './Documents.css';
import type { Document } from '../../core/models';

const documents: Document[] = [];

type DocType = 'all' | 'contract_photo' | 'legal_doc' | 'satellite_image' | 'pdf' | 'other';
type LinkStatus = 'all' | 'linked' | 'unlinked';

const docTypeIcons: Record<string, string> = {
    contract_photo: '📷',
    legal_doc: '📄',
    satellite_image: '🛰️',
    pdf: '📑',
    other: '📎',
};

const docTypeLabels: Record<string, string> = {
    contract_photo: 'Photo Contrat',
    legal_doc: 'Doc Légal',
    satellite_image: 'Image Satellite',
    pdf: 'PDF',
    other: 'Autre',
};

export function Documents() {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<DocType>('all');
    const [filterLink, setFilterLink] = useState<LinkStatus>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const filteredDocuments = documents.filter(doc => {
        const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'all' || doc.type === filterType;
        const matchesLink = filterLink === 'all' ||
            (filterLink === 'linked' ? doc.isLinked : !doc.isLinked);
        return matchesSearch && matchesType && matchesLink;
    });

    const unlinkedCount = documents.filter(d => !d.isLinked).length;

    return (
        <div className="documents-page animate-fade-in">
            <header className="page-header">
                <div className="page-header-left">
                    <h1 className="page-title">Documents</h1>
                    <p className="page-subtitle">Synchronisé avec Google Drive • {documents.length} au total</p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-secondary">
                        <span>🔄 Synchroniser</span>
                    </button>
                </div>
            </header>

            {/* Alert for unlinked documents */}
            {unlinkedCount > 0 && (
                <div className="alert alert-warning">
                    <span className="alert-icon">⚠️</span>
                    <span className="alert-text">
                        {unlinkedCount} document{unlinkedCount > 1 ? 's' : ''} non lié{unlinkedCount > 1 ? 's' : ''} à un terrain, client ou contrat
                    </span>
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setFilterLink('unlinked')}
                    >
                        Voir non liés
                    </button>
                </div>
            )}

            {/* Toolbar */}
            <div className="page-toolbar">
                <div className="search-wrapper">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        className="input search-input"
                        placeholder="Rechercher documents..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="toolbar-actions">
                    <div className="filter-tabs">
                        <button
                            className={`filter-tab ${filterLink === 'all' ? 'active' : ''}`}
                            onClick={() => setFilterLink('all')}
                        >
                            Tout
                        </button>
                        <button
                            className={`filter-tab ${filterLink === 'linked' ? 'active' : ''}`}
                            onClick={() => setFilterLink('linked')}
                        >
                            ✓ Liés
                        </button>
                        <button
                            className={`filter-tab ${filterLink === 'unlinked' ? 'active' : ''}`}
                            onClick={() => setFilterLink('unlinked')}
                        >
                            ○ Non liés
                        </button>
                    </div>

                    <select
                        className="input select-filter"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as DocType)}
                    >
                        <option value="all">Tous types</option>
                        <option value="contract_photo">📷 Photos</option>
                        <option value="legal_doc">📄 Docs Légaux</option>
                        <option value="satellite_image">🛰️ Satellite</option>
                        <option value="pdf">📑 PDFs</option>
                        <option value="other">📎 Autre</option>
                    </select>

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
                </div>
            </div>

            {/* Content */}
            {filteredDocuments.length === 0 ? (
                <div className="empty-state-large">
                    <div className="empty-icon">📁</div>
                    <h2 className="empty-title">Aucun document</h2>
                    <p className="empty-description">
                        Téléchargez des documents dans votre dossier Google Drive et synchronisez-les ici.
                    </p>
                    <button className="btn btn-primary btn-lg">
                        <span>🔄 Synchroniser depuis Google Drive</span>
                    </button>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="documents-grid">
                    {filteredDocuments.map((doc) => (
                        <div key={doc.id} className={`document-card ${doc.isLinked ? '' : 'unlinked'}`}>
                            <div className="doc-preview">
                                {doc.thumbnailUrl ? (
                                    <img src={doc.thumbnailUrl} alt={doc.name} className="doc-thumbnail" />
                                ) : (
                                    <span className="doc-icon">{docTypeIcons[doc.type] || '📄'}</span>
                                )}
                            </div>
                            <div className="doc-info">
                                <h3 className="doc-name" title={doc.name}>{doc.name}</h3>
                                <div className="doc-meta">
                                    <span className="doc-type">{docTypeLabels[doc.type] || doc.type}</span>
                                    {doc.sizeBytes && (
                                        <span className="doc-size">
                                            {(doc.sizeBytes / 1024).toFixed(1)} KB
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="doc-actions">
                                {!doc.isLinked && (
                                    <button className="btn btn-secondary btn-sm">Lier</button>
                                )}
                                <button className="btn btn-icon">⋮</button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="content-section">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Nom</th>
                                <th>Type</th>
                                <th>Taille</th>
                                <th>Téléchargé</th>
                                <th>Statut</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDocuments.map((doc) => (
                                <tr key={doc.id}>
                                    <td className="doc-name-cell">
                                        <span className="doc-icon-small">{docTypeIcons[doc.type] || '📄'}</span>
                                        <span>{doc.name}</span>
                                    </td>
                                    <td className="capitalize">{docTypeLabels[doc.type] || doc.type}</td>
                                    <td>{doc.sizeBytes ? `${(doc.sizeBytes / 1024).toFixed(1)} KB` : '—'}</td>
                                    <td>{doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : '—'}</td>
                                    <td>
                                        <span className={`badge ${doc.isLinked ? 'badge-success' : 'badge-warning'}`}>
                                            {doc.isLinked ? 'Lié' : 'Non lié'}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="btn btn-secondary btn-sm">
                                            {doc.isLinked ? 'Voir' : 'Lier'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
