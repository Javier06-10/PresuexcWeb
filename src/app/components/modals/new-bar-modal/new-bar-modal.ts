import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiState } from '../../../services/ui-state';
import { ConfigService } from '../../../services/config';

@Component({
  selector: 'app-new-bar-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './new-bar-modal.html',
  styleUrl: './new-bar-modal.css',
})
export class NewBarModal {
  uiState = inject(UiState);
  configService = inject(ConfigService);

  nombreBarra = signal<string>('');
  pesoBarra = signal<number | null>(null);

  close() {
    this.uiState.isNewBarModalOpen.set(false);
    this.uiState.isSteelModalOpen.set(true); // Return to steel modal
  }

  confirm() {
    if (this.nombreBarra() && this.pesoBarra() !== null) {
      const bars = this.configService.listadoBarras();
      // Simple parse to infer values
      const val = this.nombreBarra();
      const n = val.includes('#') ? val : '#' + val;
      
      const newBar = {
        id: Math.max(0, ...bars.map(b => b.id)) + 1,
        n: n,
        mm: this.nombreBarra(),
        pulg: this.nombreBarra(),
        peso_kg: this.configService.unidadPesoActual() === 'kg_m' ? this.pesoBarra()! : 0,
        peso_lb: this.configService.unidadPesoActual() === 'lb_ft' ? this.pesoBarra()! : 0,
        solapes: { CIMENTACIONES: 0, COLUMNAS: 0, VIGAS: 0, LOSA: 0, LOSA_ALIGERADA: 0, MAMPOSTERIA: 0, FORMALETAS: 0 }
      } as any;

      this.configService.listadoBarras.set([...bars, newBar]);
      
      // Reset
      this.nombreBarra.set('');
      this.pesoBarra.set(null);
      
      this.close();
    }
  }
}
