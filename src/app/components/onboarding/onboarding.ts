import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-onboarding',
  imports: [CommonModule, FormsModule],
  templateUrl: './onboarding.html'
})
export class OnboardingComponent {
  supabaseService = inject(SupabaseService);

  orgName = '';
  loading = false;
  errorMsg = '';

  async createOrg() {
    if (!this.orgName.trim()) return;
    
    this.loading = true;
    this.errorMsg = '';
    
    // Generamos un slug simple
    const slug = this.orgName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    try {
      console.log('Llamando RPC create_organization con:', this.orgName, slug);
      const { data, error } = await this.supabaseService.createOrganization(this.orgName, slug);
      
      if (error) {
        console.error('Error de Supabase:', error);
        throw error;
      }
      
      console.log('Organización creada exitosamente, UUID:', data);
      
      // Si la RPC devuelve el ID, lo seteamos directamente
      if (data) {
        this.supabaseService.currentOrganizationId.set(data as string);
      } else {
        // Fallback: buscar en la base de datos
        const user = this.supabaseService.currentUser();
        if (user) {
          await this.supabaseService.fetchUserOrganization(user.id);
        }
      }
    } catch (err: any) {
      console.error('Catch error:', err);
      // Validamos si es el error de duplicidad de Slug (código 23505 o el texto del mensaje)
      if (err.code === '23505' || err.message?.includes('organizations_slug_key')) {
        this.errorMsg = "Ya existe una empresa registrada con ese nombre. Por favor, intenta agregar algo más (ej. 'SRL', la ciudad o tus iniciales).";
      } else {
        this.errorMsg = err.message || "Ocurrió un error al crear la empresa";
      }
    } finally {
      this.loading = false;
    }
  }
}
