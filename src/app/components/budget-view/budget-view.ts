import { Component, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiState } from '../../services/ui-state';
import { ProjectService } from '../../services/project';
import { ConfigService } from '../../services/config';
import { ClientService } from '../../services/client.service';

@Component({
  selector: 'app-budget-view',
  imports: [CommonModule, FormsModule],
  templateUrl: './budget-view.html',
  styleUrl: './budget-view.css',
  providers: [DatePipe]
})
export class BudgetView {
  uiState = inject(UiState);
  projectService = inject(ProjectService);
  configService = inject(ConfigService);
  clientService = inject(ClientService);
  datePipe = inject(DatePipe);

  currentDate = this.datePipe.transform(new Date(), 'dd/MM/yyyy') || '';

  volverAlPanel() {
    this.uiState.activeView.set('projects');
    this.projectService.activeProject.set(null);
  }

  imprimir() {
    window.print();
  }

  cambiarLogoDirectoDesdeHoja(files: FileList | null) {
    if (files && files[0]) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.configService.logoConsolidadoBase64.set(e.target.result);
      };
      reader.readAsDataURL(files[0]);
    }
  }

  async saveBudget() {
    await this.projectService.saveBudgetManual();
    alert('Presupuesto guardado exitosamente.');
  }

  openItemOptions(cap: any, item: any) {
    if (!item.description || item.description.trim() === '') {
      this.uiState.activeChapterForPicker.set(cap);
      this.uiState.activeBudgetItemForOptions.set(item);
      this.uiState.isItemOptionsModalOpen.set(true);
    }
  }

  openItemOptionsForChapter(cap: any) {
    this.uiState.activeChapterForPicker.set(cap);
    this.uiState.activeBudgetItemForOptions.set(null);
    this.uiState.isItemOptionsModalOpen.set(true);
  }

  async addNewLevelAndOpenChapters() {
    const newLevel = await this.projectService.addLevel();
    if (newLevel) {
      this.uiState.activeLevelForChapterAdd.set(newLevel);
      this.uiState.isAddChapterModalOpen.set(true);
    }
  }
}
