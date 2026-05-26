import { Injectable, signal } from '@angular/core';

export type ViewType = 'projects' | 'budget' | 'catalogs' | 'prices';

@Injectable({
  providedIn: 'root'
})
export class UiState {
  activeView = signal<ViewType>('projects');
  
  isConfigModalOpen = signal(false);
  isMeasuresModalOpen = signal(false);
  isSteelModalOpen = signal(false);
  isConcreteModalOpen = signal(false);
  isFullerModalOpen = signal(false);
  isEmpiricoModalOpen = signal(false);
  isLogoFormatModalOpen = signal(false);
  isPricesModalOpen = signal(false);
  isNewBarModalOpen = signal(false);
  isNewProjectModalOpen = signal(false);
  isNewClientModalOpen = signal(false);
  isBudgetInitModalOpen = signal(false);
  isItemOptionsModalOpen = signal(false);
  isSidebarOpen = signal(true);
  isCatalogPickerOpen = signal(false);
  isApuEditorOpen = signal(false);
  
  catalogPickerDefaultTab = signal<'materials' | 'labor' | 'equipment' | 'apus'>('materials');
  
  activeApuId = signal<string | null>(null);
  
  // Usamos 'any' por simplicidad, pero idealmente sería un tipo BudgetChapter
  activeChapterForPicker = signal<any>(null);
  activeBudgetItemForOptions = signal<any>(null);

  isAddChapterModalOpen = signal(false);
  activeLevelForChapterAdd = signal<any>(null);

  // Modal de APU Paramétrico
  isParametricApuModalOpen = signal(false);
  activeParametricApu = signal<any>(null);
  // Capítulo e item destino para cuando se confirme el paramétrico
  parametricTargetChapter = signal<any>(null);
  parametricTargetItem = signal<any>(null);

  isResetPasswordModalOpen = signal(false);
  isProfileModalOpen = signal(false);

  closeAllModals() {
    this.isConfigModalOpen.set(false);
    this.isMeasuresModalOpen.set(false);
    this.isSteelModalOpen.set(false);
    this.isConcreteModalOpen.set(false);
    this.isFullerModalOpen.set(false);
    this.isEmpiricoModalOpen.set(false);
    this.isLogoFormatModalOpen.set(false);
    this.isPricesModalOpen.set(false);
    this.isNewBarModalOpen.set(false);
    this.isNewProjectModalOpen.set(false);
    this.isNewClientModalOpen.set(false);
    this.isBudgetInitModalOpen.set(false);
    this.isItemOptionsModalOpen.set(false);
    this.isCatalogPickerOpen.set(false);
    this.isApuEditorOpen.set(false);
    this.isAddChapterModalOpen.set(false);
    this.activeChapterForPicker.set(null);
    this.activeBudgetItemForOptions.set(null);
    this.activeApuId.set(null);
    this.isParametricApuModalOpen.set(false);
    this.activeParametricApu.set(null);
    this.parametricTargetChapter.set(null);
    this.parametricTargetItem.set(null);
    this.isResetPasswordModalOpen.set(false);
    this.isProfileModalOpen.set(false);
  }
}
