export type NavItem = { id: string; to: string; icon: string; label: string; badge?: number };
export type NavSection = { section: string; items: NavItem[] };

export const NAV: NavSection[] = [
  {
    section: 'Overview',
    items: [
      { id: 'dashboard', to: '/', icon: 'gauge', label: 'Dashboard' },
      { id: 'diagnostics', to: '/diagnostics', icon: 'activity', label: 'Diagnostics' },
    ],
  },
  {
    section: 'Consumption',
    items: [
      { id: 'usage', to: '/usage', icon: 'list', label: 'Usage Explorer' },
      { id: 'trace', to: '/trace', icon: 'flame', label: 'Call / Trace' },
      { id: 'pricing', to: '/pricing', icon: 'tag', label: 'Pricing' },
    ],
  },
  {
    section: 'Governance',
    items: [
      { id: 'budgets', to: '/budgets', icon: 'wallet', label: 'Budgets' },
      { id: 'policies', to: '/policies', icon: 'shield', label: 'Policies' },
      { id: 'approvals', to: '/approvals', icon: 'check-circle', label: 'Approvals' },
      { id: 'chargeback', to: '/chargeback', icon: 'banknote', label: 'Chargeback' },
      { id: 'alerts', to: '/alerts', icon: 'bell', label: 'Alerts' },
    ],
  },
  {
    section: 'Intelligence',
    items: [
      { id: 'forecast', to: '/forecast', icon: 'trending-up', label: 'Forecast & Anomalies' },
      { id: 'routing', to: '/routing', icon: 'route', label: 'Cost-aware Routing' },
      { id: 'whatif', to: '/whatif', icon: 'beaker', label: 'What-if Simulator' },
      { id: 'price-watch', to: '/price-watch', icon: 'eye', label: 'Price Watcher' },
      { id: 'credits', to: '/credits', icon: 'gift', label: 'Credit Pools' },
      { id: 'copilot', to: '/copilot', icon: 'sparkles', label: 'FinOps Copilot' },
      { id: 'footprint', to: '/footprint', icon: 'leaf', label: 'CO₂ / ESG' },
    ],
  },
  {
    section: 'System',
    items: [{ id: 'settings', to: '/settings', icon: 'settings', label: 'Settings' }],
  },
];
