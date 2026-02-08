import { useState } from 'react';
import './Settings.css';

export function Settings() {
    const [googleDriveConnected, setGoogleDriveConnected] = useState(false);
    const [watchFolder, setWatchFolder] = useState('');
    const [syncInterval, setSyncInterval] = useState('15');
    const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');

    const handleConnectDrive = async () => {
        // TODO: Implement Google Drive OAuth
        console.log('Connexion à Google Drive...');
    };

    return (
        <div className="settings-page animate-fade-in">
            <header className="page-header">
                <div className="page-header-left">
                    <h1 className="page-title">Paramètres</h1>
                    <p className="page-subtitle">Configurez vos préférences Aradimon</p>
                </div>
            </header>

            {/* Google Drive Section */}
            <section className="settings-section">
                <h2 className="section-title">
                    <span className="section-icon">☁️</span>
                    Intégration Google Drive
                </h2>

                <div className="settings-card">
                    <div className="setting-row">
                        <div className="setting-info">
                            <h3 className="setting-label">Statut de connexion</h3>
                            <p className="setting-description">
                                Connectez votre compte Google pour synchroniser les documents
                            </p>
                        </div>
                        <div className="setting-control">
                            {googleDriveConnected ? (
                                <div className="connection-status connected">
                                    <span className="status-dot"></span>
                                    <span>Connecté</span>
                                    <button className="btn btn-secondary">Déconnecter</button>
                                </div>
                            ) : (
                                <button className="btn btn-primary" onClick={handleConnectDrive}>
                                    <span>🔗 Connecter Google Drive</span>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="setting-row">
                        <div className="setting-info">
                            <h3 className="setting-label">Dossier surveillé</h3>
                            <p className="setting-description">
                                Dossier Google Drive à synchroniser
                            </p>
                        </div>
                        <div className="setting-control">
                            <input
                                type="text"
                                className="input"
                                placeholder="Sélectionnez un dossier..."
                                value={watchFolder}
                                onChange={(e) => setWatchFolder(e.target.value)}
                                disabled={!googleDriveConnected}
                            />
                            <button
                                className="btn btn-secondary"
                                disabled={!googleDriveConnected}
                            >
                                Parcourir
                            </button>
                        </div>
                    </div>

                    <div className="setting-row">
                        <div className="setting-info">
                            <h3 className="setting-label">Intervalle de synchronisation</h3>
                            <p className="setting-description">
                                Fréquence de vérification des nouveaux documents
                            </p>
                        </div>
                        <div className="setting-control">
                            <select
                                className="input"
                                value={syncInterval}
                                onChange={(e) => setSyncInterval(e.target.value)}
                                disabled={!googleDriveConnected}
                            >
                                <option value="5">Toutes les 5 minutes</option>
                                <option value="15">Toutes les 15 minutes</option>
                                <option value="30">Toutes les 30 minutes</option>
                                <option value="60">Toutes les heures</option>
                                <option value="manual">Manuel uniquement</option>
                            </select>
                        </div>
                    </div>
                </div>
            </section>

            {/* Appearance Section */}
            <section className="settings-section">
                <h2 className="section-title">
                    <span className="section-icon">🎨</span>
                    Apparence
                </h2>

                <div className="settings-card">
                    <div className="setting-row">
                        <div className="setting-info">
                            <h3 className="setting-label">Thème</h3>
                            <p className="setting-description">
                                Choisissez votre schéma de couleurs préféré
                            </p>
                        </div>
                        <div className="setting-control">
                            <div className="theme-options">
                                <button
                                    className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                                    onClick={() => setTheme('dark')}
                                >
                                    🌙 Sombre
                                </button>
                                <button
                                    className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                                    onClick={() => setTheme('light')}
                                >
                                    ☀️ Clair
                                </button>
                                <button
                                    className={`theme-option ${theme === 'system' ? 'active' : ''}`}
                                    onClick={() => setTheme('system')}
                                >
                                    💻 Système
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Data Section */}
            <section className="settings-section">
                <h2 className="section-title">
                    <span className="section-icon">💾</span>
                    Gestion des données
                </h2>

                <div className="settings-card">
                    <div className="setting-row">
                        <div className="setting-info">
                            <h3 className="setting-label">Exporter les données</h3>
                            <p className="setting-description">
                                Téléchargez toutes vos données au format JSON ou CSV
                            </p>
                        </div>
                        <div className="setting-control">
                            <button className="btn btn-secondary">Exporter JSON</button>
                            <button className="btn btn-secondary">Exporter CSV</button>
                        </div>
                    </div>

                    <div className="setting-row danger">
                        <div className="setting-info">
                            <h3 className="setting-label">Effacer toutes les données</h3>
                            <p className="setting-description">
                                Supprimer définitivement toutes les données locales. Cette action est irréversible.
                            </p>
                        </div>
                        <div className="setting-control">
                            <button className="btn btn-danger">Effacer les données</button>
                        </div>
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section className="settings-section">
                <h2 className="section-title">
                    <span className="section-icon">ℹ️</span>
                    À propos
                </h2>

                <div className="settings-card">
                    <div className="about-info">
                        <div className="app-logo">🏔️</div>
                        <div className="app-details">
                            <h3>Aradimon</h3>
                            <p>Version 1.0.0</p>
                            <p className="text-muted">Gestion de la propriété foncière</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
