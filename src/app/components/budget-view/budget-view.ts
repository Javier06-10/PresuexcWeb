import { Component, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiState } from '../../services/ui-state';
import { ProjectService } from '../../services/project';
import { ConfigService } from '../../services/config';
import { ClientService } from '../../services/client.service';
import { ApuCapaVegetalComponent } from '../apu-capa-vegetal/apu-capa-vegetal';

@Component({
  selector: 'app-budget-view',
  imports: [CommonModule, FormsModule, ApuCapaVegetalComponent],
  templateUrl: './budget-view.html',
  styleUrl: './budget-view.css',
  providers: [DatePipe],
})
export class BudgetView {
  uiState = inject(UiState);
  projectService = inject(ProjectService);
  configService = inject(ConfigService);
  clientService = inject(ClientService);
  datePipe = inject(DatePipe);

  currentDate = this.datePipe.transform(new Date(), 'dd/MM/yyyy') || '';

  selectedBudgetItem = signal<any>(null);
  viewingApuDetails = signal<boolean>(false);
  showApuPanel = signal<boolean>(false);
  apuPositionValue = signal<'abajo' | 'lado'>('abajo');
  selectedApuTemplateValue = signal<any>(null);
  apuParameters = signal<Record<string, any>>({});

  selectItem(item: any, capId: string) {
    this.selectedBudgetItem.set(item);
  }

  selectResumen() {
    this.activeSidebarTabValue.set('resumen');
  }

  toggleChapter(capId: string) {
    const current = this.openChapters();
    if (current.includes(capId)) {
      this.openChapters.set(current.filter(id => id !== capId));
    } else {
      this.openChapters.set([...current, capId]);
    }
  }

  isChapterOpen(capId: string) {
    return this.openChapters().includes(capId);
  }

  toggleSidebar() {
    this.sidebarOpen.set(!this.sidebarOpen());
  }

  isSidebarOpen() {
    return this.sidebarOpen();
  }

  toggleApuPanel() {
    this.showApuPanel.set(!this.showApuPanel());
  }

  setApuPosition(pos: 'abajo' | 'lado') {
    this.apuPositionValue.set(pos);
  }

  apuPosition() {
    return this.apuPositionValue();
  }

  selectedApuTemplate() {
    return this.selectedApuTemplateValue();
  }

  parameters() {
    return [] as Array<{ label: string; unit: string; key: string; ref_table?: string; ref_value_field?: string; ref_label_field?: string; default?: any }>;
  }

  paramValues() {
    return this.apuParameters();
  }

  updateAllParams(params: Record<string, any>) {
    this.apuParameters.set(params);
  }

  getDropdownOptions(paramKey: string) {
    return [] as Array<any>;
  }

  getParamValue(key: string, defaultVal: any) {
    return this.apuParameters()[key] ?? defaultVal;
  }

  updateParam(key: string, value: any) {
    const current = this.apuParameters();
    this.apuParameters.set({ ...current, [key]: value });
  }

  syncItemName(newName: string) {
    const item = this.selectedBudgetItem();
    if (item) {
      item.description = newName;
    }
  }

  saveActiveItem() {
    this.projectService.saveBudgetManual();
  }

  totalApuItem() {
    return this.totalUnitarioApu() * this.calculatedQuantity();
  }

  activeSidebarTabValue = signal<'resumen' | 'item'>('resumen');
  openChapters = signal<string[]>([]);
  sidebarOpen = signal<boolean>(true);

  activeSidebarTab() {
    return this.activeSidebarTabValue();
  }

  activeProject() {
    return this.projectService.activeProject() as any;
  }

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

  totalUnitarioApu() {
    return 0;
  }

  imprevistosPct() {
    return this.projectService.activeBudget()?.contingency_rate || 5;
  }

  imprevistos() {
    return this.projectService.activeBudget()?.contingency_total || 0;
  }

  subtotalEq() {
    return 0;
  }

  calculatedQuantity() {
    return 0;
  }

  equiposRows() {
    return [];
  }

  manoObraRows() {
    return [];
  }

  materialesRows() {
    return [];
  }

  subtotalMat() {
    return 0;
  }

  subtotalMO() {
    return 0;
  }
}
