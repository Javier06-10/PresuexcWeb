import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogService } from '../../services/catalog.service';
import { ApuService } from '../../services/apu.service';
import { UiState } from '../../services/ui-state';

@Component({
  selector: 'app-catalog-view',
  imports: [CommonModule, FormsModule],
  templateUrl: './catalog-view.html'
})
export class CatalogViewComponent {
  catalogService = inject(CatalogService);
  apuService = inject(ApuService);
  uiState = inject(UiState);
  
  activeTab: 'materials' | 'labor' | 'equipment' | 'apus' = 'materials';
  searchTerm = '';

  constructor() {
    this.catalogService.loadCatalogs();
    this.apuService.loadApus();
  }

  // Filtros en cliente por ahora
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
    return list.filter(a => a.name?.toLowerCase().includes(term) || a.code?.toLowerCase().includes(term));
  });

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
