import { Component, inject, signal } from '@angular/core';
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

  email = signal('');
  password = signal('');
  loading = signal(false);
  errorMsg = signal('');

  isRegisterMode = signal(false);
  isRecoveryMode = signal(false);

  toggleMode() {
    this.isRegisterMode.set(!this.isRegisterMode());
    this.isRecoveryMode.set(false);
    this.errorMsg.set('');
  }

  toggleRecoveryMode() {
    this.isRecoveryMode.set(true);
    this.isRegisterMode.set(false);
    this.errorMsg.set('');
  }

  backToLogin() {
    this.isRecoveryMode.set(false);
    this.isRegisterMode.set(false);
    this.errorMsg.set('');
  }

  async handleAuth() {
    this.loading.set(true);
    this.errorMsg.set('');
    try {
      if (this.isRecoveryMode()) {
        const { error } = await this.supabaseService.resetPassword(this.email());
        if (error) throw error;
        alert("Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.");
        this.backToLogin();
      } else if (this.isRegisterMode()) {
        const { error } = await this.supabaseService.signUpWithPassword(this.email(), this.password());
        if (error) throw error;
        alert("Registro exitoso. Revisa tu correo o inicia sesión ahora.");
        this.isRegisterMode.set(false);
      } else {
        const { error } = await this.supabaseService.signInWithPassword(this.email(), this.password());
        if (error) throw error;
      }
    } catch (err: any) {
      this.errorMsg.set(err.message || "Ocurrió un error en la autenticación");
    } finally {
      this.loading.set(false);
    }
  }
}
