import { Routes, Route } from 'react-router-dom';
import { AppShell } from './layout/AppShell';
import { Dashboard } from './features/Dashboard';
import { Diagnostics } from './features/Diagnostics';
import { Usage } from './features/Usage';
import { Trace } from './features/Trace';
import { Pricing } from './features/Pricing';
import { Budgets } from './features/Budgets';
import { Policies } from './features/Policies';
import { Approvals } from './features/Approvals';
import { Chargeback } from './features/Chargeback';
import { Alerts } from './features/Alerts';
import { Forecast } from './features/Forecast';
import { Routing } from './features/Routing';
import { WhatIf } from './features/WhatIf';
import { PriceWatch } from './features/PriceWatch';
import { Credits } from './features/Credits';
import { Copilot } from './features/Copilot';
import { Footprint } from './features/Footprint';
import { Settings } from './features/Settings';
import { Placeholder } from './features/Placeholder';

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Dashboard />} />
        <Route path="diagnostics" element={<Diagnostics />} />
        <Route path="usage" element={<Usage />} />
        <Route path="trace" element={<Trace />} />
        <Route path="pricing" element={<Pricing />} />
        <Route path="budgets" element={<Budgets />} />
        <Route path="policies" element={<Policies />} />
        <Route path="approvals" element={<Approvals />} />
        <Route path="chargeback" element={<Chargeback />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="forecast" element={<Forecast />} />
        <Route path="routing" element={<Routing />} />
        <Route path="whatif" element={<WhatIf />} />
        <Route path="price-watch" element={<PriceWatch />} />
        <Route path="credits" element={<Credits />} />
        <Route path="copilot" element={<Copilot />} />
        <Route path="footprint" element={<Footprint />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Placeholder title="Not found" />} />
      </Route>
    </Routes>
  );
}
