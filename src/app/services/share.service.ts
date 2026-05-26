import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class ShareService {
  private supabase = inject(SupabaseService);

  isGenerating = signal(false);
  shareToken = signal<string | null>(null);

  shareUrl(): string | null {
    const token = this.shareToken();
    if (!token) return null;
    return `${window.location.origin}/?share=${token}`;
  }

  async generateShareLink(budgetId: string): Promise<string | null> {
    this.isGenerating.set(true);
    try {
      const { data, error } = await this.supabase.client
        .from('budget_shares')
        .insert({ budget_id: budgetId })
        .select('token')
        .single();

      if (error || !data) {
        console.error('[ShareService] Error generating share token:', error);
        return null;
      }
      this.shareToken.set(data.token);
      return data.token;
    } finally {
      this.isGenerating.set(false);
    }
  }

  async revokeShareLink(budgetId: string): Promise<void> {
    await this.supabase.client
      .from('budget_shares')
      .delete()
      .eq('budget_id', budgetId);
    this.shareToken.set(null);
  }

  async loadExistingToken(budgetId: string): Promise<void> {
    const { data } = await this.supabase.client
      .from('budget_shares')
      .select('token')
      .eq('budget_id', budgetId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    this.shareToken.set(data?.token ?? null);
  }

  clearToken() {
    this.shareToken.set(null);
  }
}
