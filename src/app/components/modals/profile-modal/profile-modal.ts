import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiState } from '../../../services/ui-state';
import { SupabaseService } from '../../../services/supabase.service';

@Component({
  selector: 'app-profile-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-modal.html'
})
export class ProfileModal {
  uiState = inject(UiState);
  supabase = inject(SupabaseService);

  newPassword = '';
  confirmPassword = '';
  isSaving = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  get user() { return this.supabase.currentUser(); }

  closeModal() {
    this.uiState.isProfileModalOpen.set(false);
    this.newPassword = '';
    this.confirmPassword = '';
    this.successMessage.set('');
    this.errorMessage.set('');
  }

  async changePassword() {
    if (!this.newPassword || this.newPassword.length < 6) {
      this.errorMessage.set('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage.set('Las contraseñas no coinciden.');
      return;
    }
    this.isSaving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
    try {
      const { error } = await this.supabase.updatePassword(this.newPassword);
      if (error) {
        this.errorMessage.set('Error: ' + error.message);
      } else {
        this.successMessage.set('Contraseña actualizada exitosamente.');
        this.newPassword = '';
        this.confirmPassword = '';
      }
    } finally {
      this.isSaving.set(false);
    }
  }
}
