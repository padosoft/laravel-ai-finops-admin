export type AdminUser = { name?: string; email?: string } | null;

export type Bootstrap = {
  apiBase: string;
  adminBase: string;
  csrfToken: string;
  appName: string;
  logoutUrl: string | null;
  user: AdminUser;
};

declare global {
  interface Window {
    AIFINOPS_ADMIN?: Bootstrap;
  }
}

export const config: Bootstrap = window.AIFINOPS_ADMIN ?? {
  apiBase: '/api/ai-finops',
  adminBase: '/admin/ai-finops',
  csrfToken: '',
  appName: 'AI FinOps',
  logoutUrl: '/logout',
  user: null,
};

/** Path portion of the admin base, used as the router basename. */
export function adminBasePath(): string {
  try {
    return new URL(config.adminBase, window.location.origin).pathname;
  } catch {
    return config.adminBase;
  }
}
