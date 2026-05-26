import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiState } from '../../../services/ui-state';
import { SupabaseService } from '../../../services/supabase.service';

@Component({
  selector: 'app-reset-password-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-password-modal.html'
})
export class ResetPasswordModal {
  uiState = inject(UiState);
  supabase = inject(SupabaseService);

  newPassword = '';
  confirmPassword = '';
  isSaving = signal(false);
  isDone = signal(false);
  errorMessage = signal('');

  closeModal() {
    this.uiState.isResetPasswordModalOpen.set(false);
    this.newPassword = '';
    this.confirmPassword = '';
    this.errorMessage.set('');
    this.isDone.set(false);
  }

  async confirmReset() {
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
    try {
      const { error } = await this.supabase.updatePassword(this.newPassword);
      if (error) {
        this.errorMessage.set('Error: ' + error.message);
      } else {
        this.isDone.set(true);
      }
    } finally {
      this.isSaving.set(false);
    }
  }
}
