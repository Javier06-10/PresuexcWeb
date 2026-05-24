import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;
  
  currentUser = signal<User | null>(null);
  currentSession = signal<Session | null>(null);
  
  // Guardaremos la organización actual en un signal (asumiendo que el user pertenece a una)
  currentOrganizationId = signal<string | null>(null);

  isInitialized = signal<boolean>(false);

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
    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.currentSession.set(session);
      this.currentUser.set(session?.user ?? null);
      if (session?.user) {
        this.fetchUserOrganization(session.user.id);
      } else {
        this.currentOrganizationId.set(null);
      }
    });
  }

  get client() {
    return this.supabase;
  }

  async fetchUserOrganization(userId: string) {
    // Intento 1: buscar directamente en org_members
    const { data, error } = await this.supabase
      .from('org_members')
      .select('organization_id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    if (data) {
      this.currentOrganizationId.set(data.organization_id);
      return;
    }

    if (error) {
      console.warn('org_members query falló, intentando RPC get_my_organizations...', error.message);
    }

    // Intento 2: usar el RPC get_my_organizations
    try {
      const { data: orgs, error: rpcError } = await this.supabase.rpc('get_my_organizations');
      if (orgs && orgs.length > 0) {
        // Buscar la default, o la primera
        const defaultOrg = orgs.find((o: any) => o.is_default) || orgs[0];
        this.currentOrganizationId.set(defaultOrg.organization_id);
        return;
      }
      if (rpcError) {
        console.warn('RPC get_my_organizations falló:', rpcError.message);
      }
    } catch (e) {
      console.warn('Excepción en get_my_organizations:', e);
    }

    // Intento 3: buscar en user_profiles.default_organization_id
    try {
      const { data: profile } = await this.supabase
        .from('user_profiles')
        .select('default_organization_id')
        .eq('id', userId)
        .single();

      if (profile?.default_organization_id) {
        this.currentOrganizationId.set(profile.default_organization_id);
        return;
      }
    } catch (e) {
      console.warn('user_profiles fallback falló:', e);
    }

    // Si ningún método funcionó, el usuario no tiene org → se mostrará onboarding
    console.warn('Usuario sin organización detectada.');
  }

  async signIn(email: string) {
    return this.supabase.auth.signInWithOtp({ email });
  }
  
  async signInWithPassword(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({ email, password });
  }

  async signUpWithPassword(email: string, password: string) {
    return this.supabase.auth.signUp({ email, password });
  }

  async createOrganization(name: string, slug: string, country: string = 'DO', planCode: string = 'free', taxId: string = '', industry: string = 'constructora') {
    return this.supabase.rpc('create_organization', {
      p_name: name,
      p_slug: slug,
      p_country: country,
      p_plan_code: planCode,
      p_tax_id: taxId,
      p_industry: industry
    });
  }

  async signOut() {
    return this.supabase.auth.signOut();
  }
}
