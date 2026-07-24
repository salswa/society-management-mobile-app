import { createContext, useContext, useState, type ReactNode } from 'react';
import type { AdminPanelKind } from './AdminPanel';

type Ctx = {
  /** Which panel the drawer currently shows (Manage / Community). */
  panel: AdminPanelKind;
  /** Set the active panel (call right before opening the drawer). */
  openPanel: (kind: AdminPanelKind) => void;
};

const AdminDrawerContext = createContext<Ctx | null>(null);

export function AdminDrawerProvider({ children }: { children: ReactNode }) {
  const [panel, setPanel] = useState<AdminPanelKind>('manage');
  return (
    <AdminDrawerContext.Provider value={{ panel, openPanel: setPanel }}>
      {children}
    </AdminDrawerContext.Provider>
  );
}

export function useAdminDrawer(): Ctx {
  const ctx = useContext(AdminDrawerContext);
  if (!ctx) throw new Error('useAdminDrawer must be used within AdminDrawerProvider');
  return ctx;
}
