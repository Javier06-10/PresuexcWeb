import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiState } from '../../../services/ui-state';
import { ConfigService, BARRAS_POR_DEFECTO, LONGITUDES_POR_DEFECTO } from '../../../services/config';

@Component({
  selector: 'app-steel-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './steel-modal.html',
  styleUrl: './steel-modal.css',
})
export class SteelModal {
  uiState = inject(UiState);
  configService = inject(ConfigService);

  activeTab = signal<'pres' | 'pesos' | 'solapes' | 'longitudes'>('pres');
  activeSolapeElement = signal<string>('CIMENTACIONES');
  newLength = 0;

  backToConfig() {
    this.uiState.isSteelModalOpen.set(false);
    this.uiState.isConfigModalOpen.set(true);
  }

  setFormat(fmt: 'n_num' | 'mm' | 'pulg') {
    this.configService.formatoActualGlobal.set(fmt);
  }

  setWeightUnit(event: Event) {
    const unit = (event.target as HTMLSelectElement).value as 'kg_m' | 'lb_ft';
    this.configService.unidadPesoActual.set(unit);
  }

  restoreDefaultWeights() {
    this.configService.listadoBarras.set(JSON.parse(JSON.stringify(BARRAS_POR_DEFECTO)));
  }

  openNewBar() {
    this.uiState.isSteelModalOpen.set(false);
    this.uiState.isNewBarModalOpen.set(true);
  }

  async confirm() {
    await this.configService.saveSteelConfig();
    this.uiState.isSteelModalOpen.set(false);
  }

  addNewLength() {
    if (this.newLength > 0) {
      this.configService.longitudesBarras.update(lengths => [...lengths, { m: this.newLength }]);
      this.newLength = 0;
    }
  }

  removeLength(index: number) {
    this.configService.longitudesBarras.update(lengths => {
      const newLengths = [...lengths];
      newLengths.splice(index, 1);
      return newLengths;
    });
  }

  restoreDefaultLengths() {
    this.configService.longitudesBarras.set(JSON.parse(JSON.stringify(LONGITUDES_POR_DEFECTO)));
  }

  getSolape(barId: string): number {
    const s = this.configService.solapesBarras().find(x => x.steel_bar_id === barId && x.structural_element === this.activeSolapeElement());
    return s ? Math.round(s.splice_length_m * 100) : 30;
  }

  updateSolape(barId: string, event: Event) {
     const input = event.target as HTMLInputElement;
     const cmValue = Number(input.value);
     const element = this.activeSolapeElement();
     
     this.configService.solapesBarras.update(splices => {
        const idx = splices.findIndex(x => x.steel_bar_id === barId && x.structural_element === element);
        const mValue = cmValue / 100;
        
        if (idx >= 0) {
           const newArr = [...splices];
           newArr[idx] = { ...newArr[idx], splice_length_m: mValue };
           return newArr;
        } else {
           return [...splices, { steel_bar_id: barId, structural_element: element, splice_length_m: mValue }];
        }
     });
  }
}
