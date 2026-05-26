import { Injectable, signal, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { showError } from '../utils/alert.util';

export interface CatalogMaterial {
  id: string;
  organization_id: string | null;
  category_id: string | null;
  code: string;
  name: string;
  description: string;
  unit: string;
  unit_price: number;
  price_without_itbis: number;
  price_with_itbis: number;
  has_itbis: boolean;
  supplier_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface CatalogLabor {
  id: string;
  organization_id: string | null;
  category_id: string | null;
  code: string;
  name: string;
  description: string;
  unit: string;
  unit_price: number; // calculated from composition
  composition: any;
  notes: string | null;
  created_at: string;
}

export interface CatalogEquipment {
  id: string;
  organization_id: string | null;
  code: string;
  name: string;
  description: string;
  unit: string;
  hourly_rate: number;
  maintenance_rate: number;
  fuel_rate: number;
  total_without_itbis: number;
  notes: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  supabaseService = inject(SupabaseService);

  materials = signal<CatalogMaterial[]>([]);
  labor = signal<CatalogLabor[]>([]);
  equipment = signal<CatalogEquipment[]>([]);
  units = signal<{code: string}[]>([]);

  isLoading = signal<boolean>(false);

  async loadCatalogs() {
    this.isLoading.set(true);

    try {
      const orgId = this.supabaseService.currentOrganizationId();
      
      // Si tenemos orgId, buscamos los globales (null) Y los de la empresa.
      // Si no tenemos orgId, SOLO buscamos los globales (null).
      const orgQuery = orgId 
        ? `organization_id.is.null,organization_id.eq.${orgId}`
        : `organization_id.is.null`;
      
      const [matRes, labRes, eqRes, unitsRes] = await Promise.all([
        this.supabaseService.client
          .from('materials')
          .select('*')
          .or(orgQuery)
          .order('description', { ascending: true }),
          
        this.supabaseService.client
          .from('labor_activities')
          .select('*')
          .or(orgQuery)
          .order('description', { ascending: true }),
          
        this.supabaseService.client
          .from('equipment')
          .select('*')
          .or(orgQuery)
          .order('description', { ascending: true }),

        this.supabaseService.client
          .from('units')
          .select('code')
          .order('code', { ascending: true })
      ]);

      const matIds = matRes.data ? matRes.data.map(m => m.id) : [];
      const labIds = labRes.data ? labRes.data.map(l => l.id) : [];
      const eqIds = eqRes.data ? eqRes.data.map(e => e.id) : [];
      if (unitsRes.data) this.units.set(unitsRes.data as {code: string}[]);

      const today = new Date().toISOString().slice(0,10);

      let matPrices: any[] = [];
      let labPrices: any[] = [];
      let eqPrices: any[] = [];

      try {
        const [pMat, pLab, pEq] = await Promise.all([
          this.supabaseService.client.rpc('resolve_prices_bulk', {
            p_resource_type: 'material', p_resource_ids: matIds, p_organization_id: orgId || null, p_region_code: null, p_date: today
          }),
          this.supabaseService.client.rpc('resolve_prices_bulk', {
            p_resource_type: 'labor_activity', p_resource_ids: labIds, p_organization_id: orgId || null, p_region_code: null, p_date: today
          }),
          this.supabaseService.client.rpc('resolve_prices_bulk', {
            p_resource_type: 'equipment', p_resource_ids: eqIds, p_organization_id: orgId || null, p_region_code: null, p_date: today
          })
        ]);
        matPrices = pMat.data || [];
        labPrices = pLab.data || [];
        eqPrices = pEq.data || [];
      } catch (err) {
        console.error("Error loading bulk prices:", err);
      }

      if (matRes.data) {
        const mapped = matRes.data.map(m => {
          const priceObj = matPrices.find(p => p.resource_id === m.id);
          return {
            ...m,
            price_without_itbis: priceObj ? priceObj.price_without_tax : 0,
            price_with_itbis: priceObj ? priceObj.price_with_tax : 0
          };
        });
        this.materials.set(mapped as any);
      }

      if (labRes.data) {
        const mapped = labRes.data.map(l => {
          const priceObj = labPrices.find(p => p.resource_id === l.id);
          return {
            ...l,
            unit_price: priceObj ? priceObj.price_without_tax : 0
          };
        });
        this.labor.set(mapped as any);
      }

      if (eqRes.data) {
        const mapped = eqRes.data.map(e => {
          const priceObj = eqPrices.find(p => p.resource_id === e.id);
          return {
            ...e,
            total_without_itbis: priceObj ? priceObj.price_without_tax : 0
          };
        });
        this.equipment.set(mapped as any);
      }

    } catch (err) {
      console.error('Error cargando catálogos:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  async createMaterial(description: string, unit: string, price: number) {
    const orgId = this.supabaseService.currentOrganizationId();
    if (!orgId) return null;
    
    const newItem = {
      organization_id: orgId,
      description,
      unit
    };

    const { data, error } = await this.supabaseService.client
      .from('materials')
      .insert([newItem])
      .select()
      .single();

    if (error) {
      console.error('Error creating material:', error);
      showError(error.message, 'Error al crear material');
      return null;
    }
    
    // We add price_without_itbis to match our UI
    const mapped = { ...data, price_without_itbis: price, price_with_itbis: price * 1.18 };
    this.materials.update(list => [...list, mapped as any]);
    return mapped;
  }

  async createLabor(description: string, unit: string, price: number) {
    const orgId = this.supabaseService.currentOrganizationId();
    if (!orgId) return null;
    
    const newItem = {
      organization_id: orgId,
      description,
      unit
    };

    const { data, error } = await this.supabaseService.client
      .from('labor_activities')
      .insert([newItem])
      .select()
      .single();

    if (error) {
      console.error('Error creating labor:', error);
      showError(error.message, 'Error al crear mano de obra');
      return null;
    }
    
    // Since unit_price is calculated, we mock it locally
    const mapped = { ...data, unit_price: price };
    this.labor.update(list => [...list, mapped as any]);
    return mapped;
  }

  async createEquipment(description: string, unit: string, price: number) {
    const orgId = this.supabaseService.currentOrganizationId();
    if (!orgId) return null;
    
    const newItem = {
      organization_id: orgId,
      description,
      unit
    };

    const { data, error } = await this.supabaseService.client
      .from('equipment')
      .insert([newItem])
      .select()
      .single();

    if (error) {
      console.error('Error creating equipment:', error);
      showError(error.message, 'Error al crear equipo');
      return null;
    }
    
    const mapped = { ...data, total_without_itbis: price };
    this.equipment.update(list => [...list, mapped as any]);
    return mapped;
  }

  async updateItem(type: 'materials' | 'labor_activities' | 'equipment', id: string, description: string, unit: string) {
    const { error } = await this.supabaseService.client
      .from(type)
      .update({ description, unit })
      .eq('id', id);

    if (error) {
      console.error(`Error updating ${type}:`, error);
      showError(error.message, 'Error al actualizar');
      return false;
    }

    // Actualizamos localmente
    if (type === 'materials') {
      this.materials.update(list => list.map(m => m.id === id ? { ...m, description, unit } : m));
    } else if (type === 'labor_activities') {
      this.labor.update(list => list.map(l => l.id === id ? { ...l, description, unit } : l));
    } else if (type === 'equipment') {
      this.equipment.update(list => list.map(e => e.id === id ? { ...e, description, unit } : e));
    }
    return true;
  }

  async deleteItem(type: 'materials' | 'labor_activities' | 'equipment', id: string) {
    const { error } = await this.supabaseService.client
      .from(type)
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting ${type}:`, error);
      showError(error.message, 'Error al eliminar');
      return false;
    }

    // Removemos localmente
    if (type === 'materials') {
      this.materials.update(list => list.filter(m => m.id !== id));
    } else if (type === 'labor_activities') {
      this.labor.update(list => list.filter(l => l.id !== id));
    } else if (type === 'equipment') {
      this.equipment.update(list => list.filter(e => e.id !== id));
    }
    return true;
  }
}
