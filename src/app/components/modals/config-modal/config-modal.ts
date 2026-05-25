import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiState } from '../../../services/ui-state';
import { ConfigService } from '../../../services/config';

@Component({
  selector: 'app-config-modal',
  imports: [CommonModule],
  templateUrl: './config-modal.html',
  styleUrl: './config-modal.css',
})
export class ConfigModal {
  uiState = inject(UiState);
  configService = inject(ConfigService);

  closeModal() {
    this.configService.saveOrgSettings();
    this.uiState.isConfigModalOpen.set(false);
  }

  openLogoFormat() {
    this.uiState.isConfigModalOpen.set(false);
    this.uiState.isLogoFormatModalOpen.set(true);
  }

  openProfile() {
    this.uiState.isProfileModalOpen.set(true);
    this.closeModal();
  }

  openMeasures() {
    this.uiState.isConfigModalOpen.set(false);
    this.uiState.isMeasuresModalOpen.set(true);
  }

  openSteel() {
    this.uiState.isConfigModalOpen.set(false);
    this.uiState.isSteelModalOpen.set(true);
  }

  openConcrete() {
    this.uiState.isConfigModalOpen.set(false);
    this.uiState.isConcreteModalOpen.set(true);
  }

  openPrices() {
    this.uiState.isConfigModalOpen.set(false);
    this.uiState.activeView.set('catalogs');
  }
}
