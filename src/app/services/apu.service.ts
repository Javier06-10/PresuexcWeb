import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface ApuTemplate {
  id: string;
  organization_id?: string;
  section_id?: string;
  code?: string;
  name: string;
  description_detail?: string;
  unit: string;
  type: 'static' | 'parametric';
  suggested_chapter?: string;
  base_quantity?: number;
  volume_analysis?: number;
  volume_unit?: string;
  subtotal?: number;
  itbis?: number;
  total_unit?: number;
  parameters?: any;
  formulas?: any;
  parametric_outputs?: any;
  source?: string;
  is_active?: boolean;
  notes?: string;
  items?: ApuItem[];
}

export interface ApuItem {
  id: string;
  apu_id: string;
  sort_order?: number;
  group_name: 'materials' | 'labor' | 'equipment' | 'other';
  resource_type: 'material' | 'labor_category' | 'labor_activity' | 'equipment' | 'apu' | 'subcontract' | 'free';
  material_id?: string;
  labor_category_id?: string;
  labor_activity_id?: string;
  equipment_id?: string;
  sub_apu_id?: string;
  description?: string;
  quantity: number;
  unit?: string;
  unit_price?: number;
  itbis_unit?: number;
  waste_factor?: number;
  subtotal?: number;
  subtotal_itbis?: number;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApuService {
  supabase = inject(SupabaseService);

  apus = signal<ApuTemplate[]>([]);
  isLoading = signal(false);

  constructor() {}

  async loadApus() {
    this.isLoading.set(true);
    try {
      const orgId = this.supabase.currentOrganizationId();
      
      const orgQuery = orgId 
        ? `organization_id.is.null,organization_id.eq.${orgId}`
        : `organization_id.is.null`;

      const { data, error } = await this.supabase.client
        .from('apu_templates')
        .select(`
            *,
            items:apu_items!apu_id(*)
        `)
        .or(orgQuery)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      this.apus.set(data || []);
    } catch (err) {
      console.error('Error loading APUs:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  async createApu(name: string, unit: string) {
    try {
      const orgId = this.supabase.currentOrganizationId();

      const newApu = {
        organization_id: orgId || null,
        name,
        unit,
        type: 'static',
        total_unit: 0,
        parameters: [],
        formulas: [],
        parametric_outputs: []
      };

      const { data, error } = await this.supabase.client
        .from('apu_templates')
        .insert([newApu])
        .select()
        .single();

      if (error) throw error;
      
      this.apus.update(curr => [...curr, { ...data, items: [] }]);
      return data as ApuTemplate;
    } catch (err: any) {
      console.error('Error creating APU:', err);
      alert('Error creating APU: ' + (err.message || JSON.stringify(err)));
      return null;
    }
  }

  async addApuItem(apuId: string, itemData: any) {
    try {
      const { data, error } = await this.supabase.client
        .from('apu_items')
        .insert([itemData])
        .select()
        .single();
      
      if (error) throw error;

      // Actualizar estado local
      this.apus.update(curr => {
        return curr.map(apu => {
          if (apu.id === apuId) {
            return {
              ...apu,
              items: [...(apu.items || []), data]
            };
          }
          return apu;
        });
      });

      this.recalculateApuTotal(apuId);
      return data;
    } catch (err) {
      console.error('Error adding APU item:', err);
      return null;
    }
  }

  async removeApuItem(apuId: string, itemId: string) {
      try {
          const { error } = await this.supabase.client
              .from('apu_items')
              .delete()
              .eq('id', itemId);
              
          if (error) throw error;

          this.apus.update(curr => {
              return curr.map(apu => {
                  if (apu.id === apuId) {
                      return {
                          ...apu,
                          items: (apu.items || []).filter(i => i.id !== itemId)
                      }
                  }
                  return apu;
              });
          });
          
          this.recalculateApuTotal(apuId);
      } catch (err) {
          console.error('Error removing APU item:', err);
      }
  }

  async recalculateApuTotal(apuId: string) {
      const apu = this.apus().find(a => a.id === apuId);
      if (!apu) return;

      const total = (apu.items || []).reduce((acc, item) => {
          return acc + ((item.quantity || 0) * (item.unit_price || 0));
      }, 0);

      try {
          const { error } = await this.supabase.client
              .from('apu_templates')
              .update({ total_unit: total })
              .eq('id', apuId);
              
          if (error) throw error;

          this.apus.update(curr => {
              return curr.map(a => {
                  if (a.id === apuId) return { ...a, total_unit: total };
                  return a;
              })
          });
      } catch (err) {
          console.error("Error updating APU total:", err);
      }
  }

  async updateApu(id: string, name: string, unit: string) {
    try {
      const { error } = await this.supabase.client
        .from('apu_templates')
        .update({ name, unit })
        .eq('id', id);

      if (error) throw error;

      this.apus.update(curr => curr.map(a => a.id === id ? { ...a, name, unit } : a));
      return true;
    } catch (err: any) {
      console.error('Error updating APU:', err);
      alert('Error updating APU: ' + (err.message || JSON.stringify(err)));
      return false;
    }
  }

  async deleteApu(id: string) {
    try {
      const { error } = await this.supabase.client
        .from('apu_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      this.apus.update(curr => curr.filter(a => a.id !== id));
      return true;
    } catch (err: any) {
      console.error('Error deleting APU:', err);
      alert('Error deleting APU: ' + (err.message || JSON.stringify(err)));
      return false;
    }
  }
}
