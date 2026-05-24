import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html'
})
export class LoginComponent {
  supabaseService = inject(SupabaseService);

  email = '';
  password = '';
  loading = false;
  errorMsg = '';

  isRegisterMode = false;

  toggleMode() {
    this.isRegisterMode = !this.isRegisterMode;
    this.errorMsg = '';
  }

  async handleAuth() {
    this.loading = true;
    this.errorMsg = '';
    try {
      if (this.isRegisterMode) {
        const { error } = await this.supabaseService.signUpWithPassword(this.email, this.password);
        if (error) throw error;
        alert("Registro exitoso. Revisa tu correo o inicia sesión ahora.");
        this.isRegisterMode = false;
      } else {
        const { error } = await this.supabaseService.signInWithPassword(this.email, this.password);
        if (error) throw error;
      }
    } catch (err: any) {
      this.errorMsg = err.message || "Ocurrió un error en la autenticación";
    } finally {
      this.loading = false;
    }
  }
}
