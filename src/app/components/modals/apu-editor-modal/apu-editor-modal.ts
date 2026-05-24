import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiState } from '../../../services/ui-state';
import { ApuService, ApuItem, ApuTemplate } from '../../../services/apu.service';

@Component({
  selector: 'app-apu-editor-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './apu-editor-modal.html'
})
export class ApuEditorModal {
  uiState = inject(UiState);
  apuService = inject(ApuService);

  activeApu = computed<ApuTemplate | null>(() => {
    const id = this.uiState.activeApuId();
    if (!id) return null;
    return this.apuService.apus().find(a => a.id === id) || null;
  });

  closeModal() {
    this.uiState.closeAllModals();
  }

  openPicker(type: 'material' | 'labor' | 'equipment') {
    const tab = type === 'labor' ? 'labor' : (type === 'equipment' ? 'equipment' : 'materials');
    this.uiState.catalogPickerDefaultTab.set(tab);
    this.uiState.isCatalogPickerOpen.set(true);
  }

  getItems(type: 'material' | 'labor_activity' | 'equipment'): ApuItem[] {
    const apu = this.activeApu();
    if (!apu || !apu.items) return [];
    return apu.items.filter(i => i.resource_type === type);
  }

  getSubtotal(type: 'material' | 'labor_activity' | 'equipment'): number {
    return this.getItems(type).reduce((acc, item) => acc + (item.quantity * (item.unit_price || 0)), 0);
  }

  async updateItemQuantity(item: ApuItem) {
      if (!item.quantity || item.quantity < 0) item.quantity = 0;
      
      try {
          const { error } = await this.apuService.supabase.client
              .from('apu_items')
              .update({ quantity: item.quantity })
              .eq('id', item.id);
          
          if (error) throw error;
          
          // Actualizamos total local
          const apuId = this.uiState.activeApuId();
          if (apuId) {
              this.apuService.recalculateApuTotal(apuId);
          }
      } catch (err) {
          console.error("Error updating item quantity:", err);
      }
  }

  async removeItem(itemId: string) {
      const apuId = this.uiState.activeApuId();
      if (!apuId) return;
      await this.apuService.removeApuItem(apuId, itemId);
  }
}
