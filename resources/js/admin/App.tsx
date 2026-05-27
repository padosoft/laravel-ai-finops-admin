import { Routes, Route } from 'react-router-dom';
import { AppShell } from './layout/AppShell';
import { Dashboard } from './features/Dashboard';
import { Usage } from './features/Usage';
import { Trace } from './features/Trace';
import { Budgets } from './features/Budgets';
import { Policies } from './features/Policies';
import { Approvals } from './features/Approvals';
import { Pricing } from './features/Pricing';
import { Chargeback } from './features/Chargeback';
import { Alerts } from './features/Alerts';
import { Forecast } from './features/Forecast';
import { Routing } from './features/Routing';
import { WhatIf } from './features/WhatIf';
import { PriceWatch } from './features/PriceWatch';
import { Credits } from './features/Credits';
import { Placeholder } from './features/Placeholder';
import { NAV } from './layout/nav';

// Screens implemented so far; the rest fall back to Placeholder until built.
const IMPLEMENTED = new Set([
  'usage', 'trace', 'budgets', 'policies', 'approvals', 'pricing', 'chargeback', 'alerts',
  'forecast', 'routing', 'whatif', 'price-watch', 'credits',
]);

const ALL_ITEMS = NAV.flatMap((s) => s.items);

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Dashboard />} />
        <Route path="usage" element={<Usage />} />
        <Route path="trace" element={<Trace />} />
        <Route path="budgets" element={<Budgets />} />
        <Route path="policies" element={<Policies />} />
        <Route path="approvals" element={<Approvals />} />
        <Route path="pricing" element={<Pricing />} />
        <Route path="chargeback" element={<Chargeback />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="forecast" element={<Forecast />} />
        <Route path="routing" element={<Routing />} />
        <Route path="whatif" element={<WhatIf />} />
        <Route path="price-watch" element={<PriceWatch />} />
        <Route path="credits" element={<Credits />} />
        {ALL_ITEMS.filter((it) => it.to !== '/' && !IMPLEMENTED.has(it.id)).map((it) => (
          <Route key={it.id} path={it.to.replace(/^\//, '')} element={<Placeholder title={it.label} />} />
        ))}
        <Route path="*" element={<Placeholder title="Not found" />} />
      </Route>
    </Routes>
  );
}
