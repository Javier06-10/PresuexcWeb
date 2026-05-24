import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectService } from '../../services/project';
import { ConfigService } from '../../services/config';
import { UiState } from '../../services/ui-state';
import { ClientService } from '../../services/client.service';

@Component({
  selector: 'app-project-list',
  imports: [CommonModule],
  templateUrl: './project-list.html',
  styleUrl: './project-list.css',
})
export class ProjectList {
  projectService = inject(ProjectService);
  configService = inject(ConfigService);
  uiState = inject(UiState);
  clientService = inject(ClientService);

  constructor() {
    this.clientService.loadClients();
  }

  openNewProjectModal() {
    this.uiState.isNewProjectModalOpen.set(true);
  }

  async openBudget(project: any) {
    await this.projectService.setActiveProject(project);
    this.uiState.activeView.set('budget');
    // Si el presupuesto quedó sin niveles, abrir el wizard de inicialización
    if (this.projectService.activeBudgetLevels().length === 0) {
      this.uiState.isBudgetInitModalOpen.set(true);
    }
  }
}
