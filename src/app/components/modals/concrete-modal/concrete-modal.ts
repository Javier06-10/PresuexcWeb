import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiState } from '../../../services/ui-state';
import { ConfigService } from '../../../services/config';

@Component({
  selector: 'app-concrete-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './concrete-modal.html'
})
export class ConcreteModal {
  uiState = inject(UiState);
  configService = inject(ConfigService);

  newReadyMixResistencia: number | null = null;
  newReadyMixPrecio: number | null = null;

  backToConfig() {
    this.uiState.isConcreteModalOpen.set(false);
    this.uiState.isConfigModalOpen.set(true);
  }

  setMethod(method: 'fuller' | 'aci' | 'empirico') {
    this.configService.metodoCalculoHormigon.set(method);
  }

  openFullerModal() {
    this.uiState.isFullerModalOpen.set(true);
  }

  openEmpiricoModal() {
    this.uiState.isEmpiricoModalOpen.set(true);
  }

  addReadyMix() {
    if (this.newReadyMixResistencia && this.newReadyMixPrecio) {
      this.configService.hormigonesSuministrados.update(list => [
        ...list, 
        { resistencia: this.newReadyMixResistencia!, precio: this.newReadyMixPrecio! }
      ]);
      this.newReadyMixResistencia = null;
      this.newReadyMixPrecio = null;
    }
  }

  removeReadyMix(index: number) {
    this.configService.hormigonesSuministrados.update(list => {
      const newList = [...list];
      newList.splice(index, 1);
      return newList;
    });
  }

  closeModal() {
    this.uiState.isConcreteModalOpen.set(false);
  }

  confirm() {
    // In the future: save to DB if needed
    this.uiState.isConcreteModalOpen.set(false);
  }
}
