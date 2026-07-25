import { apiRequest } from './client';
import type { InvoiceStatus, MaintenanceInvoice } from './types';

export type InvoiceFilters = { status?: InvoiceStatus; flat_id?: string };

export type CreateInvoiceInput = {
  flat_id: string;
  period: string; // YYYY-MM
  amount: number;
  due_date?: string; // YYYY-MM-DD
};

export const maintenanceApi = {
  list: (filters: InvoiceFilters = {}) =>
    apiRequest<{ invoices: MaintenanceInvoice[] }>('/maintenance', { query: filters }),

  create: (input: CreateInvoiceInput) =>
    apiRequest<{ invoice: MaintenanceInvoice }>('/maintenance', { method: 'POST', body: input }),

  markPaid: (id: string) =>
    apiRequest<{ invoice: MaintenanceInvoice }>(`/maintenance/${id}/mark-paid`, { method: 'POST' }),
};
