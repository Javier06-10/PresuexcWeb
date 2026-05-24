import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiState } from '../../../services/ui-state';
import { ConfigService } from '../../../services/config';

@Component({
  selector: 'app-measures-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './measures-modal.html',
  styleUrl: './measures-modal.css',
})
export class MeasuresModal {
  uiState = inject(UiState);
  configService = inject(ConfigService);

  backToConfig() {
    this.uiState.isMeasuresModalOpen.set(false);
    this.uiState.isConfigModalOpen.set(true);
  }
}
