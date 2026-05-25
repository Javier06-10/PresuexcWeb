import { Injectable, signal, inject } from '@angular/core';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { UiState } from './ui-state';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient;

  currentUser = signal<User | null>(null);
  currentSession = signal<Session | null>(null);

  // Guardaremos la organización actual en un signal (asumiendo que el user pertenece a una)
  currentOrganizationId = signal<string | null>(null);

  isInitialized = signal<boolean>(false);
  isFetchingOrganization = signal<boolean>(false);
  uiState = inject(UiState);

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

    // Initial check
    this.supabase.auth.getSession().then(async ({ data: { session } }) => {
      this.currentSession.set(session);
      this.currentUser.set(session?.user ?? null);
      if (session?.user) {
        await this.fetchUserOrganization(session.user.id);
      }
      this.isInitialized.set(true);
    });

    // Listen to auth changes
    this.supabase.auth.onAuthStateChange((event, session) => {
      this.currentSession.set(session);
      this.currentUser.set(session?.user ?? null);
      if (session?.user) {
        this.fetchUserOrganization(session.user.id);
      } else {
        this.currentOrganizationId.set(null);
      }

      if (event === 'PASSWORD_RECOVERY') {
        // Open the reset password modal when recovery is triggered
        this.uiState.isResetPasswordModalOpen.set(true);
      }
    });
  }

  get client() {
    return this.supabase;
  }

  async fetchUserOrganization(userId: string) {
    this.isFetchingOrganization.set(true);
    try {
      const [membersRes, rpcRes, profileRes] = await Promise.all([
        this.supabase
          .from('org_members')
          .select('organization_id')
          .eq('user_id', userId)
          .limit(1)
          .maybeSingle(),
        this.supabase.rpc('get_my_organizations'),
        this.supabase
          .from('user_profiles')
          .select('default_organization_id')
          .eq('id', userId)
          .maybeSingle(),
      ]);

      if (membersRes.data) {
        this.currentOrganizationId.set(membersRes.data.organization_id);
        return;
      }

      if (rpcRes.data && rpcRes.data.length > 0) {
        const defaultOrg = rpcRes.data.find((o: any) => o.is_default) || rpcRes.data[0];
        this.currentOrganizationId.set(defaultOrg.organization_id);
        return;
      }

      if (profileRes.data?.default_organization_id) {
        this.currentOrganizationId.set(profileRes.data.default_organization_id);
        return;
      }

      // Si ningún método funcionó, el usuario no tiene org → se mostrará onboarding
      console.warn('Usuario sin organización detectada.');
    } catch (e) {
      console.warn('Error fetching organization:', e);
    } finally {
      this.isFetchingOrganization.set(false);
    }
  }

  async signIn(email: string) {
    return this.supabase.auth.signInWithOtp({ email });
  }

  async signInWithPassword(email: string, password: string) {
    try {
      const result = await this.supabase.auth.signInWithPassword({ email, password });

      if (!result.error && result.data.user) {
        // Wait a brief moment for auth state to update
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      return result;
    } catch (err: any) {
      console.error('Sign in error:', err);
      return { error: err, data: { user: null, session: null } };
    }
  }

  async signUpWithPassword(email: string, password: string) {
    return this.supabase.auth.signUp({ email, password });
  }

  async resetPassword(email: string) {
    return this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
  }

  async updatePassword(password: string) {
    return this.supabase.auth.updateUser({ password });
  }

  async createOrganization(
    name: string,
    slug: string,
    country: string = 'DO',
    planCode: string = 'free',
    taxId: string = '',
    industry: string = 'constructora',
  ) {
    return this.supabase.rpc('create_organization', {
      p_name: name,
      p_slug: slug,
      p_country: country,
      p_plan_code: planCode,
      p_tax_id: taxId,
      p_industry: industry,
    });
  }

  async signOut() {
    return this.supabase.auth.signOut();
  }
}
