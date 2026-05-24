import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiState } from '../../../services/ui-state';
import { ConfigService } from '../../../services/config';

@Component({
  selector: 'app-logo-format-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './logo-format-modal.html',
  styleUrl: './logo-format-modal.css',
})
export class LogoFormatModal {
  uiState = inject(UiState);
  configService = inject(ConfigService);

  backToConfig() {
    this.uiState.isLogoFormatModalOpen.set(false);
    this.uiState.isConfigModalOpen.set(true);
  }

  confirm() {
    this.uiState.isLogoFormatModalOpen.set(false);
  }

  processFile(files: FileList | null) {
    if (files && files[0]) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.configService.logoConsolidadoBase64.set(e.target.result);
      };
      reader.readAsDataURL(files[0]);
    }
  }
}
