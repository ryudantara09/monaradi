import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

interface Stats {
    terrains: number;
    customers: number;
    contracts: number;
    documents: number;
}

interface Activity {
    id: string;
    type: 'terrain' | 'customer' | 'contract' | 'transaction';
    action: string;
    name: string;
    date: string;
}

export function Dashboard() {
    const [stats, setStats] = useState<Stats>({
        terrains: 0,
        customers: 0,
        contracts: 0,
        documents: 0,
    });
    const [activities, setActivities] = useState<Activity[]>([]);
    const [unlinkedDocs, setUnlinkedDocs] = useState(0);

    // Load stats from localStorage or electronAPI
    useEffect(() => {
        const loadData = async () => {
            if (typeof window !== 'undefined' && 'electronAPI' in window) {
                const data = await window.electronAPI.db.getStats();
                setStats(data);
            } else {
                // Load from localStorage for web dev
                const terrains = JSON.parse(localStorage.getItem('aradimon_terrains') || '[]');
                const customers = JSON.parse(localStorage.getItem('aradimon_customers') || '[]');
                const contracts = JSON.parse(localStorage.getItem('aradimon_contracts') || '[]');
                const documents = JSON.parse(localStorage.getItem('aradimon_documents') || '[]');

                setStats({
                    terrains: terrains.length,
                    customers: customers.length,
                    contracts: contracts.filter((c: { status: string }) => c.status === 'active').length,
                    documents: documents.length,
                });

                // Create recent activity from all entities
                const recentActivity: Activity[] = [
                    ...terrains.map((t: { id: string; name: string; createdAt: string }) => ({
                        id: t.id,
                        type: 'terrain' as const,
                        action: 'Terrain ajouté',
                        name: t.name,
                        date: t.createdAt,
                    })),
                    ...customers.map((c: { id: string; name: string; createdAt: string }) => ({
                        id: c.id,
                        type: 'customer' as const,
                        action: 'Client ajouté',
                        name: c.name,
                        date: c.createdAt,
                    })),
                    ...contracts.map((c: { id: string; contractNumber?: string; createdAt: string }) => ({
                        id: c.id,
                        type: 'contract' as const,
                        action: 'Contrat créé',
                        name: c.contractNumber || 'Contrat',
                        date: c.createdAt,
                    })),
                ];

                // Sort by date and take top 5
                recentActivity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setActivities(recentActivity.slice(0, 5));

                // Unlinked documents count
                const unlinked = documents.filter((d: { isLinked: boolean }) => !d.isLinked).length;
                setUnlinkedDocs(unlinked);
            }
        };

        loadData();

        // Listen for storage changes
        const handleStorage = () => loadData();
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'terrain': return '🗺️';
            case 'customer': return '👤';
            case 'contract': return '📜';
            case 'transaction': return '💰';
            default: return '📝';
        }
    };

    return (
        <div className="dashboard-page animate-fade-in">
            <header className="page-header">
                <div className="page-header-left">
                    <h1 className="page-title">Tableau de bord</h1>
                    <p className="page-subtitle">Aperçu de votre système de gestion foncière</p>
                </div>
                <div className="page-actions">
                    <Link to="/terrains/new" className="btn btn-primary">
                        <span>+ Ajout Rapide</span>
                    </Link>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">🗺️</div>
                    <div className="stat-content">
                        <span className="stat-value">{stats.terrains}</span>
                        <span className="stat-label">Terrains Totaux</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-content">
                        <span className="stat-value">{stats.customers}</span>
                        <span className="stat-label">Clients</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">📜</div>
                    <div className="stat-content">
                        <span className="stat-value">{stats.contracts}</span>
                        <span className="stat-label">Contrats Actifs</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">📁</div>
                    <div className="stat-content">
                        <span className="stat-value">{stats.documents}</span>
                        <span className="stat-label">Documents</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="dashboard-content">
                <div className="content-section">
                    <div className="section-header">
                        <h2 className="section-title">Activité Récente</h2>
                        <button className="btn btn-secondary btn-sm">Voir Tout</button>
                    </div>

                    <div className="activity-feed">
                        {activities.length === 0 ? (
                            <div className="empty-state">
                                <span className="empty-icon">📋</span>
                                <p className="empty-text">Aucune activité récente</p>
                                <p className="empty-subtext">Commencez par ajouter un terrain ou un client</p>
                            </div>
                        ) : (
                            activities.map((activity) => (
                                <div key={activity.id} className="activity-item">
                                    <span className="activity-icon">{getActivityIcon(activity.type)}</span>
                                    <div className="activity-content">
                                        <span className="activity-action">{activity.action}</span>
                                        <span className="activity-name">{activity.name}</span>
                                    </div>
                                    <span className="activity-time">
                                        {new Date(activity.date).toLocaleDateString()}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="side-content">
                    <div className="content-section">
                        <h2 className="section-title">Actions Rapides</h2>
                        <div className="quick-actions">
                            <Link to="/terrains/new" className="quick-action">
                                <span className="quick-action-icon">🗺️</span>
                                <span className="quick-action-label">Ajouter Terrain</span>
                            </Link>
                            <Link to="/customers/new" className="quick-action">
                                <span className="quick-action-icon">👤</span>
                                <span className="quick-action-label">Ajouter Client</span>
                            </Link>
                            <Link to="/contracts/new" className="quick-action">
                                <span className="quick-action-icon">📜</span>
                                <span className="quick-action-label">Nouveau Contrat</span>
                            </Link>
                            <Link to="/documents" className="quick-action">
                                <span className="quick-action-icon">🔄</span>
                                <span className="quick-action-label">Sync Drive</span>
                            </Link>
                        </div>
                    </div>

                    <div className="content-section">
                        <div className="section-header">
                            <h2 className="section-title">Documents non liés</h2>
                            <span className="badge">{unlinkedDocs} en attente</span>
                        </div>

                        {unlinkedDocs === 0 ? (
                            <div className="empty-state-mini">
                                <span className="empty-icon">✓</span>
                                <p className="empty-text">Tous les documents sont liés</p>
                            </div>
                        ) : (
                            <Link to="/documents" className="btn btn-secondary btn-block">
                                Voir non liés
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
