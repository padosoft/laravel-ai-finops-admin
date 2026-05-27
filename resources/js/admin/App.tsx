import { Routes, Route } from 'react-router-dom';
import { AppShell } from './layout/AppShell';
import { Dashboard } from './features/Dashboard';
import { Usage } from './features/Usage';
import { Trace } from './features/Trace';
import { Placeholder } from './features/Placeholder';
import { NAV } from './layout/nav';

// Screens implemented so far; the rest fall back to Placeholder until built.
const IMPLEMENTED = new Set(['usage', 'trace']);

const ALL_ITEMS = NAV.flatMap((s) => s.items);

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Dashboard />} />
        <Route path="usage" element={<Usage />} />
        <Route path="trace" element={<Trace />} />
        {ALL_ITEMS.filter((it) => it.to !== '/' && !IMPLEMENTED.has(it.id)).map((it) => (
          <Route key={it.id} path={it.to.replace(/^\//, '')} element={<Placeholder title={it.label} />} />
        ))}
        <Route path="*" element={<Placeholder title="Not found" />} />
      </Route>
    </Routes>
  );
}
