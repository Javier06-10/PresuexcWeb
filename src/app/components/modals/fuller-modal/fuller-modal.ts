import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiState } from '../../../services/ui-state';
import { ConfigService } from '../../../services/config';

@Component({
  selector: 'app-fuller-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './fuller-modal.html'
})
export class FullerModal {
  uiState = inject(UiState);
  configService = inject(ConfigService);

  nombre: string = '';
  cemento: number | null = null;
  arena: number | null = null;
  grava: number | null = null;

  addFullerConfig() {
    if (this.nombre.trim() && this.cemento && this.arena && this.grava) {
      this.configService.fullerDosificaciones.update(list => [
        ...list,
        { nombre: this.nombre.trim(), cemento: this.cemento!, arena: this.arena!, grava: this.grava! }
      ]);
      this.nombre = '';
      this.cemento = null;
      this.arena = null;
      this.grava = null;
    }
  }

  removeFullerConfig(index: number) {
    this.configService.fullerDosificaciones.update(list => {
      const newList = [...list];
      newList.splice(index, 1);
      return newList;
    });
  }

  closeModal() {
    this.uiState.isFullerModalOpen.set(false);
  }

  save() {
    // Guardar si es necesario
    this.uiState.isFullerModalOpen.set(false);
  }
}
