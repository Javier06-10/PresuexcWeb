import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiState } from '../../../services/ui-state';
import { ProjectService } from '../../../services/project';
import { ApuService } from '../../../services/apu.service';
import { SupabaseService } from '../../../services/supabase.service';
import { CatalogService } from '../../../services/catalog.service';

@Component({
  selector: 'app-item-options-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './item-options-modal.html'
})
export class ItemOptionsModal {
  uiState = inject(UiState);
  projectService = inject(ProjectService);
  apuService = inject(ApuService);
  supabaseService = inject(SupabaseService);
  catalogService = inject(CatalogService);

  isCreatingApuMode = false;
  newApuName = '';
  newApuUnit = 'UND';

  availableUnits = computed(() => {
    const units = new Set<string>(['UND', 'M2', 'M3', 'ML', 'PA', 'GLB', 'KG', 'QQ', 'GL', 'P2', 'GAL', 'MES', 'DIA', 'HR']);
    
    this.catalogService.materials().forEach(m => { if (m.unit) units.add(m.unit.toUpperCase()) });
    this.catalogService.labor().forEach(l => { if (l.unit) units.add(l.unit.toUpperCase()) });
    this.catalogService.equipment().forEach(e => { if (e.unit) units.add(e.unit.toUpperCase()) });
    
    return Array.from(units).sort();
  });

  openCatalog() {
    this.uiState.isItemOptionsModalOpen.set(false);
    this.uiState.catalogPickerDefaultTab.set('apus');
    this.uiState.isCatalogPickerOpen.set(true);
  }

  openApuEditor() {
    const item = this.uiState.activeBudgetItemForOptions();
    this.newApuName = item?.description || '';
    this.newApuUnit = item?.unit || 'UND';
    this.isCreatingApuMode = true;
  }

  async confirmCreateApu() {
    if (!this.newApuName.trim()) {
        alert("El nombre es requerido");
        return;
    }

    const item = this.uiState.activeBudgetItemForOptions();
    
    this.projectService.isSaving.set(true);
    // Create the APU template in the DB
    const finalUnit = this.newApuUnit ? this.newApuUnit.trim().toUpperCase() : 'UND';
    const created = await this.apuService.createApu(this.newApuName, finalUnit);
    this.projectService.isSaving.set(false);
    
    if (created) {
      this.uiState.isItemOptionsModalOpen.set(false);
      this.isCreatingApuMode = false;
      
      // Update the budget item to point to this new APU
      if (item) {
        item.description = created.name;
        item.unit = created.unit;
        item.unit_price = 0;
        item.total = 0;
        item.apu_template_id = created.id;
        
        this.projectService.updateTotal();
        
        // Background DB update
        this.supabaseService.client.from('budget_items').update({
            description: item.description,
            unit: item.unit,
            unit_price: item.unit_price,
            apu_template_id: item.apu_template_id
        }).eq('id', item.id).then(async () => {
            // Call RPC to snapshot the APU
            await this.supabaseService.client.rpc('recalculate_budget_item', { p_item_id: item.id });
            const { data: updatedDbItem } = await this.supabaseService.client.from('budget_items').select('*').eq('id', item.id).single();
            if (updatedDbItem) {
                item.unit_price = updatedDbItem.unit_price;
                item.total = updatedDbItem.total;
                item.apu_snapshot = updatedDbItem.apu_snapshot;
                this.projectService.updateTotal();
            }
        });
      } else {
        // Create new item inside the active chapter
        const chapter = this.uiState.activeChapterForPicker();
        if (chapter) {
            if (!chapter.items) chapter.items = [];
            const newItem = {
                id: crypto.randomUUID(),
                budget_id: chapter.budget_id,
                chapter_id: chapter.id,
                item_number: `${chapter.chapter_number}.0${chapter.items.length + 1}`,
                description: created.name,
                quantity: 1,
                unit: created.unit,
                unit_price: 0,
                total: 0,
                sort_order: chapter.items.length + 1,
                apu_template_id: created.id
            };
            
            chapter.items.push(newItem as any);
            this.projectService.updateTotal();
            
            const dbPayload = {
                id: newItem.id,
                budget_id: newItem.budget_id,
                chapter_id: newItem.chapter_id,
                item_number: newItem.item_number,
                description: newItem.description,
                quantity: newItem.quantity,
                unit: newItem.unit,
                unit_price: newItem.unit_price,
                sort_order: newItem.sort_order,
                apu_template_id: newItem.apu_template_id
            };
            
            this.supabaseService.client.from('budget_items').insert([dbPayload]).then(async (res: any) => {
                if (res.error) {
                    console.error("Error inserting APU item:", res.error);
                } else {
                    await this.supabaseService.client.rpc('recalculate_budget_item', { p_item_id: newItem.id });
                    const { data: updatedDbItem } = await this.supabaseService.client.from('budget_items').select('*').eq('id', newItem.id).single();
                    if (updatedDbItem) {
                        const localItem = chapter.items!.find((i: any) => i.id === newItem.id);
                        if (localItem) {
                            localItem.unit_price = updatedDbItem.unit_price;
                            localItem.total = updatedDbItem.total;
                            localItem.apu_snapshot = updatedDbItem.apu_snapshot;
                            this.projectService.updateTotal();
                        }
                    }
                }
            });
        }
      }

      this.uiState.activeApuId.set(created.id);
      this.uiState.isApuEditorOpen.set(true);
    } else {
      alert("Error al crear el APU.");
    }
  }

  closeModal() {
    this.uiState.isItemOptionsModalOpen.set(false);
    this.uiState.activeBudgetItemForOptions.set(null);
    this.uiState.activeChapterForPicker.set(null);
    this.isCreatingApuMode = false;
  }
}
