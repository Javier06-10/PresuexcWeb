import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiState } from '../../../services/ui-state';
import { ConfigService } from '../../../services/config';
import { CatalogService } from '../../../services/catalog.service';

type TabType = 'MAT' | 'MO' | 'JOR';
const TABLE_MAP: Record<TabType, 'materials' | 'labor_activities' | 'equipment'> = {
  MAT: 'materials',
  MO: 'labor_activities',
  JOR: 'equipment',
};

@Component({
  selector: 'app-prices-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './prices-modal.html',
  styleUrl: './prices-modal.css',
})
export class PricesModal {
  uiState = inject(UiState);
  configService = inject(ConfigService);
  catalogService = inject(CatalogService);

  activeType = signal<TabType>('MAT');
  searchQuery = signal('');

  private baseList = computed(() => {
    const t = this.activeType();
    if (t === 'MAT') return this.catalogService.materials() as any[];
    if (t === 'MO')  return this.catalogService.labor() as any[];
    return this.catalogService.equipment() as any[];
  });

  private filtered = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const list = this.baseList();
    if (!q) return list;
    return list.filter(i =>
      (i.description || '').toLowerCase().includes(q) ||
      (i.code || '').toLowerCase().includes(q)
    );
  });

  orgItems    = computed(() => this.filtered().filter(i =>  !!i.organization_id));
  globalItems = computed(() => this.filtered().filter(i => !i.organization_id));

  getPrice(item: any): number {
    const t = this.activeType();
    if (t === 'MAT') return item.price_without_itbis ?? 0;
    if (t === 'MO')  return item.unit_price ?? 0;
    return item.total_without_itbis ?? 0;
  }

  editingId  = signal<string | null>(null);
  editBuffer = { description: '', unit: '' };

  startEdit(item: any) {
    this.editingId.set(item.id);
    this.editBuffer = { description: item.description || '', unit: item.unit || '' };
  }
  cancelEdit() { this.editingId.set(null); }

  saving = signal(false);
  async saveEdit(item: any) {
    this.saving.set(true);
    await this.catalogService.updateItem(TABLE_MAP[this.activeType()], item.id, this.editBuffer.description, this.editBuffer.unit);
    this.saving.set(false);
    this.editingId.set(null);
  }

  async deleteItem(item: any) {
    if (!confirm(`¿Eliminar "${item.description}"?`)) return;
    await this.catalogService.deleteItem(TABLE_MAP[this.activeType()], item.id);
  }

  showAddForm    = signal(false);
  newDescription = '';
  newUnit        = '';
  newPrice       = 0;

  async addItem() {
    const desc = this.newDescription.trim();
    if (!desc) return;
    this.saving.set(true);
    const t = this.activeType();
    if (t === 'MAT') await this.catalogService.createMaterial(desc, this.newUnit, this.newPrice);
    else if (t === 'MO') await this.catalogService.createLabor(desc, this.newUnit, this.newPrice);
    else await this.catalogService.createEquipment(desc, this.newUnit, this.newPrice);
    this.saving.set(false);
    this.newDescription = '';
    this.newUnit  = '';
    this.newPrice = 0;
    this.showAddForm.set(false);
  }

  setType(type: TabType) {
    this.activeType.set(type);
    this.showAddForm.set(false);
    this.editingId.set(null);
    this.searchQuery.set('');
  }

  constructor() {
    effect(() => {
      if (this.uiState.activeView() === 'prices') {
        this.catalogService.loadCatalogs();
        this.searchQuery.set('');
        this.showAddForm.set(false);
        this.editingId.set(null);
      }
    });
  }
}
