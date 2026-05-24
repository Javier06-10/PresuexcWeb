import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface Client {
  id: string;
  name: string;
  legal_name?: string;
  tax_id?: string;
  email?: string;
  phone?: string;
  is_active: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  supabase = inject(SupabaseService);

  clients = signal<Client[]>([]);
  isLoading = signal(false);

  constructor() {}

  async loadClients() {
    this.isLoading.set(true);
    try {
      const orgId = this.supabase.currentOrganizationId();
      if (!orgId) return;

      const { data, error } = await this.supabase.client
        .from('clients')
        .select('*')
        .eq('organization_id', orgId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      this.clients.set(data || []);
    } catch (err) {
      console.error('Error loading clients:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  getClientName(clientId: string | undefined): string {
    if (!clientId) return 'Sin cliente';
    const client = this.clients().find(c => c.id === clientId);
    return client ? client.name : 'Sin cliente';
  }

  async createClient(name: string, email?: string, phone?: string) {
    try {
      const orgId = this.supabase.currentOrganizationId();
      if (!orgId) return null;

      const { data, error } = await this.supabase.client
        .from('clients')
        .insert([{
            organization_id: orgId,
            name,
            email,
            phone
        }])
        .select()
        .single();

      if (error) throw error;
      this.clients.update(curr => [...curr, data]);
      return data;
    } catch (err) {
      console.error('Error creating client:', err);
      return null;
    }
  }
}
