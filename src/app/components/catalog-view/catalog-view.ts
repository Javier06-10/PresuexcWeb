import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogService } from '../../services/catalog.service';
import { ApuService } from '../../services/apu.service';
import { UiState } from '../../services/ui-state';
import { showDeleteConfirm } from '../../utils/alert.util';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-catalog-view',
  imports: [CommonModule, FormsModule],
  templateUrl: './catalog-view.html',
})
export class CatalogViewComponent {
  catalogService = inject(CatalogService);
  apuService = inject(ApuService);
  uiState = inject(UiState);
  supabase = inject(SupabaseService);

  searchTerm = signal('');

  orgApus = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const list = this.apuService.apus().filter(a => !!a.organization_id);
    if (!term) return list;
    return list.filter(a =>
      a.name?.toLowerCase().includes(term) || a.code?.toLowerCase().includes(term)
    );
  });

  globalApus = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const list = this.apuService.apus().filter(a => !a.organization_id);
    if (!term) return list;
    return list.filter(a =>
      a.name?.toLowerCase().includes(term) || a.code?.toLowerCase().includes(term)
    );
  });

  constructor() {
    this.apuService.loadApus();
    this.catalogService.loadCatalogs();
  }

  // Crear APU
  isCreating = signal(false);
  newName = '';
  newUnit = 'M2';

  async createApu() {
    if (!this.newName.trim()) return;
    const created = await this.apuService.createApu(this.newName.trim(), this.newUnit);
    if (created) {
      this.isCreating.set(false);
      this.newName = '';
      this.openApuEditor(created.id);
    }
  }

  // Edición inline de nombre/unidad
  editingId = signal<string | null>(null);
  editName = '';
  editUnit = '';

  startEdit(item: any) {
    this.editingId.set(item.id);
    this.editName = item.name || '';
    this.editUnit = item.unit || '';
  }

  cancelEdit() { this.editingId.set(null); }

  async saveEdit(item: any) {
    if (!this.editName.trim()) return;
    await this.apuService.updateApu(item.id, this.editName.trim(), this.editUnit);
    this.editingId.set(null);
  }

  async deleteApu(item: any) {
    if (!await showDeleteConfirm(`¿Eliminar APU "${item.name}"?`)) return;
    await this.apuService.deleteApu(item.id);
  }

  openApuEditor(apuId: string) {
    this.uiState.activeApuId.set(apuId);
    this.uiState.isApuEditorOpen.set(true);
  }
}
