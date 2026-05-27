import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../lib/icons';

function applyTheme(theme: string) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('finops-theme', theme);
}

export function Topbar({ crumbs }: { crumbs: { label: string; to?: string }[] }) {
  const [theme, setTheme] = useState<string>(
    () => localStorage.getItem('finops-theme') || document.documentElement.getAttribute('data-theme') || 'dark',
  );

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
  };

  return (
    <>
      <div className="crumbs">
        {crumbs.map((c, i) => (
          <span key={i}>
            {i > 0 && <span className="sep">/</span>}
            {c.to ? <Link to={c.to}>{c.label}</Link> : <b>{c.label}</b>}
          </span>
        ))}
      </div>
      <div className="tb-spacer" />
      <div className="live-pill">
        <span className="pulse" />
        <span>LIVE</span>
      </div>
      <button className="iconbtn" title="Toggle theme" onClick={toggle} aria-label="Toggle theme">
        <Icon name={theme === 'dark' ? 'moon' : 'sun'} />
      </button>
      <button className="iconbtn" title="Notifications" aria-label="Notifications">
        <Icon name="bell" />
        <span className="dot" />
      </button>
    </>
  );
}
