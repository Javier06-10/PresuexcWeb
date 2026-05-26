import { Component, inject, signal, computed } from '@angular/core';
import { showDeleteConfirm } from '../../utils/alert.util';
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

  sidebarCollapsed = signal(false);

  activeFilter = signal<'all' | 'active' | 'archived'>('all');
  selectedClientId = signal<string | null>(null);
  searchQuery = signal<string>('');

  filteredProjects = computed(() => {
    let projects = this.projectService.listadoProyectos();

    if (this.activeFilter() === 'active') {
      projects = projects.filter(p => p.status?.toLowerCase() === 'active');
    } else if (this.activeFilter() === 'archived') {
      projects = projects.filter(p => p.status?.toLowerCase() !== 'active');
    }

    const clientId = this.selectedClientId();
    if (clientId === 'none') {
      projects = projects.filter(p => !p.client_id);
    } else if (clientId) {
      projects = projects.filter(p => p.client_id === clientId);
    }

    const q = this.searchQuery().trim().toLowerCase();
    if (q) {
      projects = projects.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.code?.toLowerCase().includes(q)
      );
    }
    return projects;
  });

  activeCount = computed(() =>
    this.projectService.listadoProyectos().filter(p => p.status?.toLowerCase() === 'active').length
  );

  archivedCount = computed(() =>
    this.projectService.listadoProyectos().filter(p => p.status?.toLowerCase() !== 'active').length
  );

  clientsWithProjects = computed(() => {
    const projects = this.projectService.listadoProyectos();
    const ids = [...new Set(projects.map(p => p.client_id).filter((id): id is string => !!id))];
    return ids.map(id => ({
      id,
      name: this.clientService.getClientName(id),
      count: projects.filter(p => p.client_id === id).length
    })).sort((a, b) => a.name.localeCompare(b.name));
  });

  noClientCount = computed(() =>
    this.projectService.listadoProyectos().filter(p => !p.client_id).length
  );

  constructor() {
    this.clientService.loadClients();
  }

  setFilter(filter: 'all' | 'active' | 'archived') {
    this.activeFilter.set(filter);
    this.selectedClientId.set(null);
  }

  setClientFilter(clientId: string | null) {
    this.selectedClientId.set(clientId);
    this.activeFilter.set('all');
  }

  openNewProjectModal() {
    this.uiState.isNewProjectModalOpen.set(true);
  }

  async openBudget(project: any) {
    await this.projectService.setActiveProject(project);
    this.uiState.activeView.set('budget');
    if (this.projectService.activeBudgetLevels().length === 0) {
      this.uiState.isBudgetInitModalOpen.set(true);
    }
  }

  async deleteProject(event: Event, project: any) {
    event.stopPropagation();
    if (await showDeleteConfirm(`¿Deseas eliminar el proyecto "${project.name}" de forma permanente?`)) {
      await this.projectService.deleteProject(project.id);
    }
  }
}
