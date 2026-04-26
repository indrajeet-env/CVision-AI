import React, { useState } from 'react';
import { Outlet, Link, NavLink, useNavigate } from 'react-router';
import { useAuth } from '../../auth/hooks/useAuth';
import './layout.scss';

const Layout = () => {
    const { user, handleLogout } = useAuth();
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const onLogout = async () => {
        await handleLogout();
        setDropdownOpen(false);
        navigate('/login');
    };

    return (
        <div className="app-layout">
            <header className="top-navbar">
                <div className="navbar-left">
                    <Link to="/" className="brand-logo">
                        <img src="/cvision-logo.png" alt="CVision Icon" className="brand-icon" />
                        <span className="brand-name">CVision</span>
                    </Link>
                </div>
                <div className="navbar-right">
                    {user ? (
                        <div className="user-profile">
                            <div className="avatar" onClick={() => setDropdownOpen(!dropdownOpen)}>
                                {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                            </div>
                            {dropdownOpen && (
                                <div className="dropdown-menu">
                                    <div className="user-details">
                                        <p className="user-name">{user.username}</p>
                                        <p className="user-email">{user.email}</p>
                                    </div>
                                    <div className="dropdown-divider"></div>
                                    <button onClick={onLogout} className="logout-btn">Logout</button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="auth-links">
                            <NavLink to="/login" className={({ isActive }) => `nav-link ${isActive ? 'nav-link--active' : ''}`}>Login</NavLink>
                            <NavLink to="/register" className={({ isActive }) => `nav-link nav-link--primary ${isActive ? 'nav-link--active-primary' : ''}`}>Sign Up</NavLink>
                        </div>
                    )}
                </div>
            </header>
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
