import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiState } from '../../../services/ui-state';
import { ProjectService } from '../../../services/project';
import { SupabaseService } from '../../../services/supabase.service';

@Component({
  selector: 'app-add-chapter-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './add-chapter-modal.html'
})
export class AddChapterModal {
  uiState = inject(UiState);
  projectService = inject(ProjectService);
  supabaseService = inject(SupabaseService);

  defaultChapters: string[] = [];

  constructor() {
    this.loadDefaultChapters();
  }

  async loadDefaultChapters() {
    try {
      const orgId = this.supabaseService.currentOrganizationId();
      const orgQuery = orgId 
        ? `organization_id.is.null,organization_id.eq.${orgId}`
        : `organization_id.is.null`;

      const { data, error } = await this.supabaseService.client
        .from('budget_categories')
        .select('name')
        .or(orgQuery)
        .order('sort_order');
      
      if (!error && data && data.length > 0) {
         this.defaultChapters = data.map(d => d.name);
      } else {
         // Fallback just in case
         this.defaultChapters = [
           'Preliminares', 'Movimiento de Tierras', 'Cimentación', 'Estructura', 
           'Hormigón Armado', 'Mampostería', 'Terminación de Superficies', 
           'Pisos y Revestimientos', 'Instalaciones Sanitarias', 'Instalaciones Eléctricas', 
           'Pintura', 'Puertas y Ventanas', 'Herrería y Metales', 'Techos y Aluzinc', 'Exteriores'
         ];
      }
    } catch (err) {
      console.error("Error loading default chapters", err);
    }
  }

  selectedChapters: string[] = [];
  newCustomChapter = '';

  closeModal() {
    this.uiState.isAddChapterModalOpen.set(false);
    this.uiState.activeLevelForChapterAdd.set(null);
    this.selectedChapters = [];
    this.newCustomChapter = '';
  }

  toggleChapter(chapter: string) {
    const idx = this.selectedChapters.indexOf(chapter);
    if (idx > -1) {
        this.selectedChapters.splice(idx, 1);
    } else {
        this.selectedChapters.push(chapter);
    }
  }

  addCustomChapter() {
    if (this.newCustomChapter.trim()) {
        const cap = this.newCustomChapter.trim().toUpperCase();
        if (!this.selectedChapters.includes(cap)) {
            this.selectedChapters.push(cap);
        }
        this.newCustomChapter = '';
    }
  }

  areAllSelected(): boolean {
    return this.defaultChapters.every(cap => this.selectedChapters.includes(cap));
  }

  toggleSelectAll() {
    if (this.areAllSelected()) {
      this.selectedChapters = this.selectedChapters.filter(cap => !this.defaultChapters.includes(cap));
    } else {
      for (const cap of this.defaultChapters) {
        if (!this.selectedChapters.includes(cap)) {
          this.selectedChapters.push(cap);
        }
      }
    }
  }

  async insertChapters() {
    const level = this.uiState.activeLevelForChapterAdd();
    if (!level || this.selectedChapters.length === 0) return;

    this.projectService.isSaving.set(true);

    let nextChapterNumber = (level.chapters?.length || 0) + 1;

    for (const capName of this.selectedChapters) {
      const { data: newChap } = await this.supabaseService.client
        .from('budget_chapters')
        .insert({
          budget_id: level.budget_id,
          level_id: level.id,
          chapter_number: nextChapterNumber,
          name: capName,
          sort_order: nextChapterNumber
        })
        .select()
        .single();
        
      if (newChap) {
        // Create 1 empty item per chapter
        const { error } = await this.supabaseService.client.from('budget_items').insert([{
          budget_id: level.budget_id,
          chapter_id: newChap.id,
          item_number: `${nextChapterNumber}.01`,
          description: '',
          quantity: 0,
          unit_price: 0,
          sort_order: 1
        }]);
        if (error) console.error(`Error creando item para capitulo ${capName}:`, error);
      }
      nextChapterNumber++;
    }

    this.projectService.isSaving.set(false);
    
    // Refresh the budget view
    await this.projectService.loadBudgetStructure(level.budget_id);
    
    this.closeModal();
  }
}
