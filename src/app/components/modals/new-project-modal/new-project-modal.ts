import { Component, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiState } from '../../../services/ui-state';
import { ProjectService, Project } from '../../../services/project';
import { ClientService } from '../../../services/client.service';

@Component({
  selector: 'app-new-project-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './new-project-modal.html',
  styleUrl: './new-project-modal.css',
})
export class NewProjectModal {
  uiState = inject(UiState);
  projectService = inject(ProjectService);
  clientService = inject(ClientService);

  nCotizacion = '';
  cliente = '';
  proyecto = '';
  vencimiento = 20;
  profesional = '';
  niveles = 1;
  client_id = '';

  constructor() {
    this.clientService.loadClients();
    effect(() => {
      if (this.uiState.isNewProjectModalOpen()) {
        this.resetForm();
      }
    });
  }

  resetForm() {
    // Temp placeholder for cotizacion until we fetch a sequence from DB
    this.nCotizacion = '001';
    this.cliente = '';
    this.proyecto = '';
    this.vencimiento = 20;
    this.profesional = '';
    this.niveles = 1;
    this.client_id = '';
  }

  closeModal() {
    this.uiState.isNewProjectModalOpen.set(false);
  }

  openNewClientModal() {
    this.uiState.isNewClientModalOpen.set(true);
  }

  async save() {
    if (!this.proyecto.trim()) {
      alert("Por favor, completa el Nombre del Proyecto.");
      return;
    }
    const newProjectData: Partial<Project> = {
      code: this.nCotizacion || '001',
      client_id: this.client_id || undefined,
      name: this.proyecto.trim(),
      number_of_levels: this.niveles || 1,
    };
    
    try {
      const createdProject = await this.projectService.createProject(newProjectData);
      if (createdProject) {
        this.closeModal();
        this.projectService.setActiveProject(createdProject);
        // Open the Initialization Wizard for this new project
        this.uiState.isBudgetInitModalOpen.set(true);
      } else {
        alert("Error al crear el proyecto en Supabase (Null devuelto).");
      }
    } catch (err: any) {
      console.error("Error al guardar proyecto:", err);
      alert("Error de BD: " + err.message);
    }
  }
}
