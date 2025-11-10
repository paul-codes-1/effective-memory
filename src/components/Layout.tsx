import { PropsWithChildren } from 'react';
import { NavLink } from 'react-router-dom';

const Layout = ({ children }: PropsWithChildren) => {
  return (
    <div className="app-shell">
      <header style={{ background: '#0f172a', color: '#fff', padding: '1.5rem 3rem' }}>
        <div className="flex-between" style={{ alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0 }}>Local Contributors Dashboard</h1>
            <p style={{ margin: 0, color: '#cbd5f5' }}>Explore contributions, recipients, and trends</p>
          </div>
          <nav>
            <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : undefined)}>
              Overview
            </NavLink>
            <NavLink to="/contributors" className={({ isActive }) => (isActive ? 'active' : undefined)}>
              Contributors
            </NavLink>
            <NavLink to="/recipients" className={({ isActive }) => (isActive ? 'active' : undefined)}>
              Recipients
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="main-content">{children}</main>
      <footer style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8' }}>
        Data sourced from local filings · Built with React & Vite
      </footer>
    </div>
  );
};

export default Layout;
