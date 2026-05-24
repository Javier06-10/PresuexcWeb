import { Component, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Header } from './components/header/header';
import { ProjectList } from './components/project-list/project-list';
import { BudgetView } from './components/budget-view/budget-view';
import { ConfigModal } from './components/modals/config-modal/config-modal';
import { FullerModal } from './components/modals/fuller-modal/fuller-modal';
import { EmpiricoModal } from './components/modals/empirico-modal/empirico-modal';
import { MeasuresModal } from './components/modals/measures-modal/measures-modal';
import { SteelModal } from './components/modals/steel-modal/steel-modal';
import { LogoFormatModal } from './components/modals/logo-format-modal/logo-format-modal';
import { PricesModal } from './components/modals/prices-modal/prices-modal';
import { NewBarModal } from './components/modals/new-bar-modal/new-bar-modal';
import { NewProjectModal } from './components/modals/new-project-modal/new-project-modal';
import { NewClientModal } from './components/modals/new-client-modal/new-client-modal';
import { BudgetInitModal } from './components/modals/budget-init-modal/budget-init-modal';
import { ItemOptionsModal } from './components/modals/item-options-modal/item-options-modal';
import { AddChapterModal } from './components/modals/add-chapter-modal/add-chapter-modal';
import { CatalogPickerModal } from './components/modals/catalog-picker-modal/catalog-picker-modal';
import { ApuEditorModal } from './components/modals/apu-editor-modal/apu-editor-modal';
import { ParametricApuModal } from './components/modals/parametric-apu-modal/parametric-apu-modal';
import { ConcreteModal } from './components/modals/concrete-modal/concrete-modal';
import { ErrorModalComponent } from './components/modals/error-modal/error-modal.component';
import { LoginComponent } from './components/login/login';
import { OnboardingComponent } from './components/onboarding/onboarding';
import { CatalogViewComponent } from './components/catalog-view/catalog-view';
import { SupabaseService } from './services/supabase.service';
import { UiState } from './services/ui-state';
import { ProjectService } from './services/project';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    Header,
    ProjectList,
    BudgetView,
    CatalogViewComponent,
    ConfigModal,
    MeasuresModal,
    SteelModal,
    FullerModal,
    EmpiricoModal,
    LogoFormatModal,
    PricesModal,
    NewBarModal,
    NewProjectModal,
    NewClientModal,
    BudgetInitModal,
    ItemOptionsModal,
    CatalogPickerModal,
    ApuEditorModal,
    ParametricApuModal,
    ConcreteModal,
    ErrorModalComponent,
    AddChapterModal,
    LoginComponent,
    OnboardingComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('presuxcel-web');
  supabase = inject(SupabaseService);
  uiState = inject(UiState);
  projectService = inject(ProjectService);

  constructor() {
    // Cuando el usuario tiene sesión y organización, cargar proyectos automáticamente
    effect(() => {
      const session = this.supabase.currentSession();
      const orgId = this.supabase.currentOrganizationId();
      if (session && orgId) {
        this.projectService.loadProjects();
      }
    });
  }
}
