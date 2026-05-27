import { Routes, Route } from 'react-router-dom';
import { AppShell } from './layout/AppShell';
import { Dashboard } from './features/Dashboard';
import { Placeholder } from './features/Placeholder';
import { NAV } from './layout/nav';

const ALL_ITEMS = NAV.flatMap((s) => s.items);

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Dashboard />} />
        {ALL_ITEMS.filter((it) => it.to !== '/').map((it) => (
          <Route key={it.id} path={it.to.replace(/^\//, '')} element={<Placeholder title={it.label} />} />
        ))}
        <Route path="*" element={<Placeholder title="Not found" />} />
      </Route>
    </Routes>
  );
}
