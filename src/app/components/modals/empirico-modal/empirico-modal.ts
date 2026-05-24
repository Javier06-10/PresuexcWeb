import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiState } from '../../../services/ui-state';
import { ConfigService } from '../../../services/config';

@Component({
  selector: 'app-empirico-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './empirico-modal.html'
})
export class EmpiricoModal {
  uiState = inject(UiState);
  configService = inject(ConfigService);

  nombre: string = '';
  metraje: number = 1;
  unidad: string = 'm3';
  cemento: number | null = null;
  arena: number | null = null;
  grava: number | null = null;

  addEmpiricoConfig() {
    if (this.nombre.trim() && this.metraje && this.cemento && this.arena && this.grava) {
      this.configService.empiricoDosificaciones.update(list => [
        ...list,
        { 
          nombre: this.nombre.trim(), 
          metraje: this.metraje,
          unidad: this.unidad,
          cemento: this.cemento!, 
          arena: this.arena!, 
          grava: this.grava! 
        }
      ]);
      this.nombre = '';
      this.metraje = 1;
      this.cemento = null;
      this.arena = null;
      this.grava = null;
    }
  }

  removeEmpiricoConfig(index: number) {
    this.configService.empiricoDosificaciones.update(list => {
      const newList = [...list];
      newList.splice(index, 1);
      return newList;
    });
  }

  closeModal() {
    this.uiState.isEmpiricoModalOpen.set(false);
  }

  save() {
    this.uiState.isEmpiricoModalOpen.set(false);
  }
}
