import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiState } from '../../../services/ui-state';
import { ConfigService } from '../../../services/config';

@Component({
  selector: 'app-prices-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './prices-modal.html',
  styleUrl: './prices-modal.css',
})
export class PricesModal {
  uiState = inject(UiState);
  configService = inject(ConfigService);

  activeType = signal<'MAT' | 'MO' | 'JOR'>('MAT');
  activeCategory = signal<string>('');

  backToConfig() {
    this.uiState.isPricesModalOpen.set(false);
    this.uiState.isConfigModalOpen.set(true);
  }

  confirm() {
    this.uiState.isPricesModalOpen.set(false);
  }

  setType(type: 'MAT' | 'MO' | 'JOR') {
    this.activeType.set(type);
  }

  addCategory() {
    // Pendiente de implementar junto con la lógica de base de datos local
    console.log("Añadir categoría en tipo", this.activeType());
  }

  addRow() {
    // Pendiente de implementar
    console.log("Añadir fila en tipo", this.activeType(), "categoría", this.activeCategory());
  }
}
