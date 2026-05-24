import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiState } from '../../../services/ui-state';
import { ClientService } from '../../../services/client.service';

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
      alert("Por favor, ingresa el nombre del cliente.");
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
        alert("Error al crear el cliente.");
      }
    } catch (err: any) {
      console.error(err);
      alert("Ocurrió un error: " + err.message);
    } finally {
      this.isSaving = false;
    }
  }
}
