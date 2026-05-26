import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogService } from '../../../services/catalog.service';
import { UiState } from '../../../services/ui-state';
import { ProjectService } from '../../../services/project';
import { SupabaseService } from '../../../services/supabase.service';
import { ApuService } from '../../../services/apu.service';
import { showError, showWarning } from '../../../utils/alert.util';

@Component({
  selector: 'app-catalog-picker-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './catalog-picker-modal.html'
})
export class CatalogPickerModal {
  catalogService = inject(CatalogService);
  uiState = inject(UiState);
  projectService = inject(ProjectService);
  supabaseService = inject(SupabaseService);
  apuService = inject(ApuService);
  
  get activeTab() {
    return this.uiState.catalogPickerDefaultTab();
  }
  
  set activeTab(val: 'materials' | 'labor' | 'equipment' | 'apus') {
    this.uiState.catalogPickerDefaultTab.set(val);
  }

  searchTerm = '';
  selectedItems = signal<{item: any, type: 'material'|'labor'|'equipment'|'apu'}[]>([]);

  constructor() {
    this.catalogService.loadCatalogs();
    this.apuService.loadApus();
  }

  toggleSelection(item: any, type: 'material'|'labor'|'equipment'|'apu') {
    this.selectedItems.update((list: any[]) => {
      const exists = list.find((x: any) => x.item.id === item.id);
      if (exists) return list.filter((x: any) => x.item.id !== item.id);
      return [...list, {item, type}];
    });
  }

  isSelected(item: any) {
    return this.selectedItems().some((x: any) => x.item.id === item.id);
  }

  async insertSelectedItems() {
    const items = this.selectedItems();
    if (items.length === 0) return;
    
    // Si estamos reemplazando, solo tomamos el primero
    if (this.uiState.activeBudgetItemForOptions()) {
        await this.insertItem(items[0].item, items[0].type);
        return;
    }

    // Insertar secuencialmente
    for (const sel of items) {
        await this.insertItem(sel.item, sel.type, false);
    }
    
    this.closeModal();
  }

  filteredMaterials = computed(() => {
    const term = this.searchTerm.toLowerCase();
    const list = this.catalogService.materials();
    if (!term) return list;
    return list.filter(m => m.description?.toLowerCase().includes(term) || m.code?.toLowerCase().includes(term));
  });

  filteredLabor = computed(() => {
    const term = this.searchTerm.toLowerCase();
    const list = this.catalogService.labor();
    if (!term) return list;
    return list.filter(l => l.description?.toLowerCase().includes(term) || l.code?.toLowerCase().includes(term));
  });

  filteredEquipment = computed(() => {
    const term = this.searchTerm.toLowerCase();
    const list = this.catalogService.equipment();
    if (!term) return list;
    return list.filter(e => e.description?.toLowerCase().includes(term) || e.code?.toLowerCase().includes(term));
  });

  filteredApus = computed(() => {
    const term = this.searchTerm.toLowerCase();
    const list = this.apuService.apus();
    if (!term) return list;
    // APUs sí tienen name en lugar de description en tu base de datos
    return list.filter(a => a.name?.toLowerCase().includes(term) || a.code?.toLowerCase().includes(term));
  });

  closeModal() {
    this.uiState.isCatalogPickerOpen.set(false);
    this.searchTerm = '';
    this.selectedItems.set([]);
  }

  async insertItem(item: any, type: 'material' | 'labor' | 'equipment' | 'apu', closeAfter = true) {
    // Caso especial: APU paramétrico → abrir modal de parámetros
    if (type === 'apu' && item.type === 'parametric' && !this.uiState.activeApuId()) {
      const chapter = this.uiState.activeChapterForPicker();
      const existingItem = this.uiState.activeBudgetItemForOptions();
      this.uiState.activeParametricApu.set(item);
      this.uiState.parametricTargetChapter.set(chapter);
      this.uiState.parametricTargetItem.set(existingItem || null);
      this.uiState.isParametricApuModalOpen.set(true);
      // Inicializar valores por defecto (el componente lo hace en su initParamValues)
      this.closeModal();
      return;
    }

    // Caso 1: Insertando dentro de un APU (Ingredientes)
    const activeApuId = this.uiState.activeApuId();
    if (activeApuId) {
        if (type === 'apu') {
            showWarning("No se pueden anidar APUs todavía.");
            return;
        }
        
        let price = 0;
        if (type === 'equipment') {
            price = item.total_without_itbis || 0;
        } else if (type === 'material') {
            price = item.price_without_itbis || 0;
        } else {
            price = item.unit_price || 0; // Labor
        }

        const apuItem = {
            apu_id: activeApuId,
            group_name: type === 'material' ? 'materials' : (type === 'equipment' ? 'equipment' : 'labor'),
            resource_type: type === 'labor' ? 'labor_activity' : type,
            material_id: type === 'material' ? item.id : null,
            labor_activity_id: type === 'labor' ? item.id : null,
            equipment_id: type === 'equipment' ? item.id : null,
            description: item.description,
            quantity: 1,
            waste_factor: 1.0,
            unit: item.unit,
            unit_price: price,
            subtotal: price * 1.0
        };

        await this.apuService.addApuItem(activeApuId, apuItem);
        if (closeAfter) this.closeModal();
        return;
    }

    // Caso 2: Insertando en un Presupuesto normal
    const chapter = this.uiState.activeChapterForPicker();
    if (!chapter) {
      showWarning("No hay un capítulo activo para insertar el insumo.");
      return;
    }

    if (!chapter.items) chapter.items = [];
    
    // Determinamos el precio
    let price = 0;
    if (type === 'equipment') {
        price = item.total_without_itbis || 0;
    } else if (type === 'material') {
        price = item.price_without_itbis || 0;
    } else if (type === 'apu') {
        price = item.total_unit || 0;
    } else {
        price = item.unit_price || 0; // Labor
    }

    const existingItem = this.uiState.activeBudgetItemForOptions();

    if (existingItem) {
        // Actualizamos el item existente localmente
        existingItem.description = type === 'apu' ? item.name : item.description;
        existingItem.unit = item.unit || 'UD';
        existingItem.unit_price = price;
        existingItem.total = price * existingItem.quantity;
        existingItem.resource_type = type === 'apu' ? 'apu' : type;
        existingItem.material_id = type === 'material' ? item.id : null;
        existingItem.labor_activity_id = type === 'labor' ? item.id : null;
        existingItem.equipment_id = type === 'equipment' ? item.id : null;
        existingItem.apu_template_id = type === 'apu' ? item.id : null;

        this.projectService.updateTotal();

        // Update DB
        try {
            await this.supabaseService.client.from('budget_items').update({
                description: existingItem.description,
                unit: existingItem.unit,
                unit_price: existingItem.unit_price,
                apu_template_id: existingItem.apu_template_id
            }).eq('id', existingItem.id);
            
            if (type === 'apu') {
                // Call RPC to recalculate and snapshot
                await this.supabaseService.client.rpc('recalculate_budget_item', { p_item_id: existingItem.id });
                // Refetch to get snapshot and real price
                const { data: updatedDbItem } = await this.supabaseService.client.from('budget_items').select('*').eq('id', existingItem.id).single();
                if (updatedDbItem) {
                    existingItem.unit_price = updatedDbItem.unit_price;
                    existingItem.total = updatedDbItem.total;
                    existingItem.apu_snapshot = updatedDbItem.apu_snapshot;
                    this.projectService.updateTotal();
                }
            }
            
            if (closeAfter) this.closeModal();
        } catch (err) {
            console.error("Error updating catalog item:", err);
            showError("Error al actualizar en la base de datos.");
        }
    } else {
        const newItem = {
          id: crypto.randomUUID(),
          budget_id: chapter.budget_id,
          chapter_id: chapter.id,
          item_number: `${chapter.chapter_number}.0${chapter.items.length + 1}`,
          description: type === 'apu' ? item.name : item.description,
          quantity: 1, // Por defecto 1
          unit: item.unit || 'UD',
          unit_price: price,
          total: price * 1,
          sort_order: chapter.items.length + 1,
          apu_template_id: type === 'apu' ? item.id : null
        };

        // En lugar de meterlo directo, lo clonamos sin campos adicionales para el insert
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

        chapter.items.push(newItem as any);
        this.projectService.updateTotal();

        // Insert into DB
        try {
            await this.supabaseService.client.from('budget_items').insert([dbPayload]);
            
            if (type === 'apu') {
                // Call RPC to recalculate and snapshot
                await this.supabaseService.client.rpc('recalculate_budget_item', { p_item_id: newItem.id });
                // Refetch to get snapshot and real price
                const { data: updatedDbItem } = await this.supabaseService.client.from('budget_items').select('*').eq('id', newItem.id).single();
                if (updatedDbItem) {
                    const localItem = chapter.items.find((i: any) => i.id === newItem.id);
                    if (localItem) {
                        localItem.unit_price = updatedDbItem.unit_price;
                        localItem.total = updatedDbItem.total;
                        localItem.apu_snapshot = updatedDbItem.apu_snapshot;
                        this.projectService.updateTotal();
                    }
                }
            }

            // Cerramos el modal si aplica
            if (closeAfter) this.closeModal();
        } catch (err) {
            console.error("Error inserting catalog item:", err);
            showError("Error al insertar en la base de datos.");
        }
    }
  }
}
