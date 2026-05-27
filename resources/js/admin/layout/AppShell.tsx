import { Outlet } from 'react-router-dom';
import { config } from '../config';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppShell() {
  return (
    <div className="app">
      <aside className="sidebar">
        <Sidebar />
      </aside>
      <main className="main">
        <header className="topbar">
          <Topbar crumbs={[{ label: config.appName, to: '/' }]} />
        </header>
        <div className="content">
          <div className="page">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}

export function PageHead({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="page-head">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-sub">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}
