import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

interface NavItem {
    path: string;
    label: string;
    icon: string;
}

const navItems: NavItem[] = [
    { path: '/', label: 'Tableau de bord', icon: '🏠' },
    { path: '/terrains', label: 'Terrains', icon: '🗺️' },
    { path: '/customers', label: 'Clients', icon: '👥' },
    { path: '/contracts', label: 'Contrats', icon: '📜' },
    { path: '/transactions', label: 'Transactions', icon: '💰' },
    { path: '/documents', label: 'Documents', icon: '📁' },
];

export function Sidebar() {
    const [isOpen, setIsOpen] = useState(false);

    const toggleSidebar = () => setIsOpen(!isOpen);
    const closeSidebar = () => setIsOpen(false);

    return (
        <>
            {/* Mobile Menu Toggle Button */}
            <button
                className="sidebar-toggle"
                onClick={toggleSidebar}
                aria-label="Basculer le menu de navigation"
            >
                <span className="hamburger-icon">{isOpen ? '✕' : '☰'}</span>
            </button>

            {/* Overlay for mobile */}
            {isOpen && <div className="sidebar-overlay" onClick={closeSidebar} />}

            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <span className="logo-icon">🏔️</span>
                        <span className="logo-text">Aradimon</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `sidebar-nav-item ${isActive ? 'active' : ''}`
                            }
                            onClick={closeSidebar}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <NavLink to="/settings" className="sidebar-nav-item settings-link" onClick={closeSidebar}>
                        <span className="nav-icon">⚙️</span>
                        <span className="nav-label">Paramètres</span>
                    </NavLink>

                    <div className="sync-status">
                        <span className="sync-icon">☁️</span>
                        <span className="sync-text">Google Drive Connecté</span>
                    </div>
                </div>
            </aside>
        </>
    );
}
