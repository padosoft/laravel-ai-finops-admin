import { NavLink } from 'react-router-dom';
import { NAV } from './nav';
import { Icon } from '../lib/icons';
import { config } from '../config';

export function Sidebar() {
  const initials = (config.user?.name ?? 'Admin')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <>
      <NavLink className="sb-brand" to="/">
        <span className="sb-mark">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </span>
        <div className="sb-brand-text">
          <b>{config.appName}</b>
          <small>v1.0.0 · padosoft</small>
        </div>
      </NavLink>

      <nav className="sb-nav">
        {NAV.map((sec) => (
          <div className="sb-section" key={sec.section}>
            <div className="sb-label">{sec.section}</div>
            {sec.items.map((it) => (
              <NavLink
                key={it.id}
                to={it.to}
                end={it.to === '/'}
                className={({ isActive }) => 'sb-item' + (isActive ? ' active' : '')}
              >
                <span className="icon">
                  <Icon name={it.icon} />
                </span>
                <span>{it.label}</span>
                {it.badge ? <span className="badge">{it.badge}</span> : null}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sb-foot">
        <div className="sb-user-chip">
          <div className="sb-avatar">{initials}</div>
          <div className="sb-user-info">
            <b>{config.user?.name ?? 'Admin'}</b>
            <small>Admin · Padosoft</small>
          </div>
        </div>
        {config.logoutUrl && (
          <a className="iconbtn" href={config.logoutUrl} title="Logout">
            <Icon name="log-out" />
          </a>
        )}
      </div>
    </>
  );
}
