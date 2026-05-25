import { Component, inject, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogService } from '../../services/catalog.service';
import { ApuService } from '../../services/apu.service';
import { UiState } from '../../services/ui-state';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-catalog-view',
  imports: [CommonModule, FormsModule],
  templateUrl: './catalog-view.html'
})
export class CatalogViewComponent {
  catalogService = inject(CatalogService);
  apuService = inject(ApuService);
  uiState = inject(UiState);
  supabase = inject(SupabaseService);

  activeTab: 'materials' | 'labor' | 'equipment' | 'apus' = 'materials';
  viewMode: 'global' | 'my_org' = 'global';
  searchTerm = '';

  // APU category filtering
  apuCategories = signal<{id: string, name: string}[]>([]);
  selectedApuCategory = signal<string>('');

  constructor() {
    this.catalogService.loadCatalogs();
    this.apuService.loadApus();
    this.loadApuCategories();
  }

  async loadApuCategories() {
    try {
      const orgId = this.supabase.currentOrganizationId();
      const orgQuery = orgId
        ? `organization_id.is.null,organization_id.eq.${orgId}`
        : `organization_id.is.null`;

      const { data, error } = await this.supabase.client
        .from('apu_sections')
        .select('id, name')
        .or(orgQuery)
        .order('sort_order', { ascending: true });

      if (!error && data) {
        this.apuCategories.set(data);
      }
    } catch (err) {
      console.error('Error loading APU categories:', err);
    }
  }

  // Filtros en cliente
  filteredMaterials() {
    const term = this.searchTerm.toLowerCase();
    let list = this.catalogService.materials();
    if (this.viewMode === 'my_org') list = list.filter(m => m.organization_id);
    else list = list.filter(m => !m.organization_id);
    if (!term) return list;
    return list.filter(m => m.description?.toLowerCase().includes(term) || m.code?.toLowerCase().includes(term));
  }

  filteredLabor() {
    const term = this.searchTerm.toLowerCase();
    let list = this.catalogService.labor();
    if (this.viewMode === 'my_org') list = list.filter(l => l.organization_id);
    else list = list.filter(l => !l.organization_id);
    if (!term) return list;
    return list.filter(l => l.description?.toLowerCase().includes(term) || l.code?.toLowerCase().includes(term));
  }

  filteredEquipment() {
    const term = this.searchTerm.toLowerCase();
    let list = this.catalogService.equipment();
    if (this.viewMode === 'my_org') list = list.filter(e => e.organization_id);
    else list = list.filter(e => !e.organization_id);
    if (!term) return list;
    return list.filter(e => e.description?.toLowerCase().includes(term) || e.code?.toLowerCase().includes(term));
  }

  filteredApus() {
    const term = this.searchTerm.toLowerCase();
    const category = this.selectedApuCategory();
    let list = this.apuService.apus();
    if (this.viewMode === 'my_org') list = list.filter(a => a.organization_id);
    else list = list.filter(a => !a.organization_id);
    if (category) list = list.filter(a => a.section_id === category);
    if (!term) return list;
    return list.filter(a => a.name?.toLowerCase().includes(term) || a.code?.toLowerCase().includes(term));
  }

  // Variables para crear items
  isCreatingItem = signal(false);
  newItemName = '';
  newItemUnit = '';
  newItemPrice = 0;

  async createItem() {
    if (!this.newItemName) return;
    
    let created;
    if (this.activeTab === 'materials') {
        created = await this.catalogService.createMaterial(this.newItemName, this.newItemUnit, this.newItemPrice);
    } else if (this.activeTab === 'labor') {
        created = await this.catalogService.createLabor(this.newItemName, this.newItemUnit, this.newItemPrice);
    } else if (this.activeTab === 'equipment') {
        created = await this.catalogService.createEquipment(this.newItemName, this.newItemUnit, this.newItemPrice);
    }

    if (created) {
        this.isCreatingItem.set(false);
        this.resetNewItemForm();
    }
  }

  resetNewItemForm() {
    this.newItemName = '';
    this.newItemUnit = '';
    this.newItemPrice = 0;
  }

  // --- MÉTODOS DE EDICIÓN Y ELIMINACIÓN ---
  editingItemId = signal<string | null>(null);
  editItemName = '';
  editItemUnit = '';

  startEdit(item: any) {
    this.editingItemId.set(item.id);
    this.editItemName = item.description || item.name;
    this.editItemUnit = item.unit;
  }

  cancelEdit() {
    this.editingItemId.set(null);
    this.editItemName = '';
    this.editItemUnit = '';
  }

  async saveEdit(item: any) {
    if (!this.editItemName || !this.editItemUnit) return;
    
    if (this.activeTab === 'apus') {
      // Necesita apuService
      const success = await this.apuService.updateApu(item.id, this.editItemName, this.editItemUnit);
      if (success) this.cancelEdit();
      return;
    }

    let type: 'materials' | 'labor_activities' | 'equipment' = 'materials';
    if (this.activeTab === 'labor') type = 'labor_activities';
    else if (this.activeTab === 'equipment') type = 'equipment';

    const success = await this.catalogService.updateItem(type, item.id, this.editItemName, this.editItemUnit);
    if (success) {
      this.cancelEdit();
    }
  }

  async deleteItem(item: any) {
    const itemName = item.description || item.name;
    if (!confirm(`¿Estás seguro de que deseas eliminar "${itemName}"?`)) return;

    if (this.activeTab === 'apus') {
      await this.apuService.deleteApu(item.id);
      return;
    }

    let type: 'materials' | 'labor_activities' | 'equipment' = 'materials';
    if (this.activeTab === 'labor') type = 'labor_activities';
    else if (this.activeTab === 'equipment') type = 'equipment';

    await this.catalogService.deleteItem(type, item.id);
  }

  // Variables para crear APU rápido
  isCreatingApu = signal(false);
  newApuName = '';
  newApuUnit = 'M2';

  async createApu() {
      if (!this.newApuName) return;
      const created = await this.apuService.createApu(this.newApuName, this.newApuUnit);
      if (created) {
          this.isCreatingApu.set(false);
          this.newApuName = '';
          this.openApuEditor(created.id);
      }
  }

  openApuEditor(apuId: string) {
      this.uiState.activeApuId.set(apuId);
      this.uiState.isApuEditorOpen.set(true);
  }
}
