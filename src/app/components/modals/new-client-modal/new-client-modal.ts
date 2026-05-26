import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiState } from '../../../services/ui-state';
import { ClientService } from '../../../services/client.service';
import { showError, showWarning } from '../../../utils/alert.util';

@Component({
  selector: 'app-new-client-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './new-client-modal.html'
})
export class NewClientModal {
  uiState = inject(UiState);
  clientService = inject(ClientService);

  name = '';
  email = '';
  phone = '';
  isSaving = false;

  closeModal() {
    this.uiState.isNewClientModalOpen.set(false);
    this.name = '';
    this.email = '';
    this.phone = '';
  }

  async save() {
    if (!this.name.trim()) {
      showWarning("Por favor, ingresa el nombre del cliente.");
      return;
    }

    this.isSaving = true;
    try {
      const result = await this.clientService.createClient(
        this.name.trim(),
        this.email.trim(),
        this.phone.trim()
      );

      if (result) {
        this.closeModal();
      } else {
        showError("Error al crear el cliente.");
      }
    } catch (err: any) {
      console.error(err);
      showError(err.message, 'Ocurrió un error');
    } finally {
      this.isSaving = false;
    }
  }
}
