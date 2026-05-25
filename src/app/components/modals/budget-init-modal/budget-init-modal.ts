import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiState } from '../../../services/ui-state';
import { ProjectService } from '../../../services/project';
import { SupabaseService } from '../../../services/supabase.service';

@Component({
  selector: 'app-budget-init-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './budget-init-modal.html'
})
export class BudgetInitModal {
  uiState = inject(UiState);
  projectService = inject(ProjectService);
  supabase = inject(SupabaseService);

  // States: 'typology', 'levels', or 'chapters'
  step = 'typology';

  selectedTypology = '';

  // Load budget categories from database
  budgetCategories = signal<string[]>([
    'Preliminares', 'Movimiento de Tierras', 'Cimentación', 'Estructura',
    'Hormigón Armado', 'Mampostería', 'Terminación de Superficies',
    'Pisos y Revestimientos', 'Instalaciones Sanitarias', 'Instalaciones Eléctricas',
    'Pintura', 'Puertas y Ventanas', 'Herrería y Metales', 'Techos y Aluzinc', 'Exteriores'
  ]);

  get defaultChapters() {
    return this.budgetCategories();
  }

  // Configured levels with their selected chapters
  levels: {name: string, order: number, chapters: string[], newCustomChapter: string}[] = [
    { name: 'Primer Nivel', order: 1, chapters: ['Preliminares'], newCustomChapter: '' }
  ];

  constructor() {
    this.loadBudgetCategories();
  }

  async loadBudgetCategories() {
    try {
      const orgId = this.supabase.currentOrganizationId();
      const orgQuery = orgId
        ? `organization_id.is.null,organization_id.eq.${orgId}`
        : `organization_id.is.null`;

      const { data, error } = await this.supabase.client
        .from('budget_categories')
        .select('name')
        .or(orgQuery)
        .order('sort_order', { ascending: true });

      if (!error && data && data.length > 0) {
        this.budgetCategories.set(data.map(d => d.name));
      }
    } catch (err) {
      console.error("Error loading budget categories", err);
    }
  }

  selectTypology(type: string) {
    this.selectedTypology = type;
  }

  nextStep() {
    if (this.step === 'typology') {
        this.step = 'levels';
    } else if (this.step === 'levels') {
        this.step = 'chapters';
    }
  }

  previousStep() {
    if (this.step === 'levels') {
        this.step = 'typology';
    } else if (this.step === 'chapters') {
        this.step = 'levels';
    }
  }

  addLevel() {
    this.levels.push({
      name: `Nivel ${this.levels.length + 1}`,
      order: this.levels.length + 1,
      chapters: ['Preliminares'],
      newCustomChapter: ''
    });
  }

  removeLevel(index: number) {
    if (this.levels.length > 1) {
      this.levels.splice(index, 1);
      // Reorder
      this.levels.forEach((l, i) => l.order = i + 1);
    }
  }

  toggleChapter(levelIndex: number, chapter: string) {
    const lvl = this.levels[levelIndex];
    const idx = lvl.chapters.indexOf(chapter);
    if (idx > -1) {
        lvl.chapters.splice(idx, 1);
    } else {
        lvl.chapters.push(chapter);
    }
  }

  addCustomChapter(levelIndex: number) {
    const lvl = this.levels[levelIndex];
    if (lvl.newCustomChapter.trim()) {
        const cap = lvl.newCustomChapter.trim().toUpperCase();
        if (!lvl.chapters.includes(cap)) {
            lvl.chapters.push(cap);
        }
        lvl.newCustomChapter = '';
    }
  }

  hasAllSelected(levelIndex: number): boolean {
    const lvl = this.levels[levelIndex];
    return this.defaultChapters.every(c => lvl.chapters.includes(c));
  }

  toggleAllForLevel(levelIndex: number) {
    const lvl = this.levels[levelIndex];
    if (this.hasAllSelected(levelIndex)) {
      // Deselect all defaults, keep customs if any
      lvl.chapters = lvl.chapters.filter(c => !this.defaultChapters.includes(c));
    } else {
      // Select all defaults
      const customs = lvl.chapters.filter(c => !this.defaultChapters.includes(c));
      lvl.chapters = [...this.defaultChapters, ...customs];
    }
  }

  hasAllSelectedGlobally(): boolean {
    return this.levels.every(lvl => this.defaultChapters.every(c => lvl.chapters.includes(c)));
  }

  toggleAllGlobally() {
    if (this.hasAllSelectedGlobally()) {
      // Deselect all globally
      this.levels.forEach(lvl => {
        lvl.chapters = lvl.chapters.filter(c => !this.defaultChapters.includes(c));
      });
    } else {
      // Select all globally
      this.levels.forEach(lvl => {
        const customs = lvl.chapters.filter(c => !this.defaultChapters.includes(c));
        lvl.chapters = [...this.defaultChapters, ...customs];
      });
    }
  }

  async generateBudget() {
    const budget = this.projectService.activeBudget();
    if (!budget) {
      alert("No hay un presupuesto activo.");
      return;
    }

    try {
      this.projectService.isSaving.set(true);
      await this.projectService.generateCustomStructure(budget.id, this.levels);
      await this.projectService.loadBudgetStructure(budget.id);
      
      this.uiState.isBudgetInitModalOpen.set(false);
      this.uiState.activeView.set('budget');
      
      // Reset for next time
      this.step = 'typology';
      this.selectedTypology = '';
      this.levels = [{ name: 'Primer Nivel', order: 1, chapters: ['Preliminares'], newCustomChapter: '' }];
    } catch (err) {
      console.error(err);
      alert("Error al generar estructura: " + String(err));
    } finally {
      this.projectService.isSaving.set(false);
    }
  }

  closeModal() {
    this.uiState.isBudgetInitModalOpen.set(false);
    this.step = 'typology';
    this.selectedTypology = '';
    this.levels = [{ name: 'Primer Nivel', order: 1, chapters: ['Preliminares'], newCustomChapter: '' }];
  }
}
