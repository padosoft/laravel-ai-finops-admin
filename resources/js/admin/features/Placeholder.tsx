import { PageHead } from '../layout/AppShell';

/** Temporary screen for nav targets not yet implemented (built out in T3–T7). */
export function Placeholder({ title }: { title: string }) {
  return (
    <>
      <PageHead title={title} subtitle="Screen under construction" />
      <div className="card">
        <div className="card-body">
          <p style={{ color: 'var(--fg-2)' }}>This screen is being implemented.</p>
        </div>
      </div>
    </>
  );
}
