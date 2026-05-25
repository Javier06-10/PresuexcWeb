import { Injectable, signal, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export const BARRAS_POR_DEFECTO = [
    { id: 3,  n: '#3',  pulg: '3/8"',   mm: '9.5 mm',  peso_kg: 0.56,  peso_lb: 0.38 },
    { id: 4,  n: '#4',  pulg: '1/2"',   mm: '12.7 mm', peso_kg: 0.99,  peso_lb: 0.67 },
    { id: 5,  n: '#5',  pulg: '5/8"',   mm: '15.9 mm', peso_kg: 1.55,  peso_lb: 1.04 },
    { id: 6,  n: '#6',  pulg: '3/4"',   mm: '19.1 mm', peso_kg: 2.24,  peso_lb: 1.50 },
    { id: 8,  n: '#8',  pulg: '1"',     mm: '25.4 mm', peso_kg: 3.97,  peso_lb: 2.67 },
    { id: 10, n: '#10', pulg: '1-1/4"', mm: '31.8 mm', peso_kg: 6.23,  peso_lb: 4.18 },
    { id: 12, n: '#12', pulg: '1-1/2"', mm: '38.1 mm', peso_kg: 8.94,  peso_lb: 6.01 }
];

export const LONGITUDES_POR_DEFECTO = [
    { m: 6.10 },
    { m: 7.62 },
    { m: 9.15 },
    { m: 10.67 },
    { m: 12.20 }
];

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  supabase = inject(SupabaseService);

  formatoActualGlobal = signal<'n_num' | 'mm' | 'pulg'>('n_num');
  unidadPesoActual = signal<'kg_m' | 'lb_ft'>('kg_m');
  monedaGlobal = signal<string>('RD$');
  metodoCalculoHormigon = signal<'fuller' | 'aci' | 'empirico'>('fuller');
  hormigonesSuministrados = signal<{ id?: string, resistencia: number, precio: number }[]>([
    { resistencia: 180, precio: 6500 },
    { resistencia: 210, precio: 7200 },
    { resistencia: 280, precio: 8000 }
  ]);
  fullerDosificaciones = signal<{ id?: string, nombre: string, cemento: number, arena: number, grava: number }[]>([]);
  empiricoDosificaciones = signal<{ id?: string, nombre: string, metraje: number, unidad: string, cemento: number, arena: number, grava: number }[]>([]);
  
  colorFilaTitConsolidado = signal<string>('#8C4F2B');
  colorFilaSubConsolidado = signal<string>('#3A3838');
  logoConsolidadoBase64 = signal<string>('');
  fuenteConsolidadaPresupuesto = signal<string>('Arial');

  listadoBarras = signal<any[]>([...BARRAS_POR_DEFECTO]);
  longitudesBarras = signal<any[]>(JSON.parse(JSON.stringify(LONGITUDES_POR_DEFECTO)));
  solapesBarras = signal<any[]>([]);

  constructor() {
    this.loadSteelConfig();
    this.loadOrgSettings();
  }

  async loadSteelConfig() {
    try {
      const orgId = this.supabase.currentOrganizationId();
      const orgQuery = orgId 
        ? `organization_id.is.null,organization_id.eq.${orgId}`
        : `organization_id.is.null`;

      const [barsRes, lengthsRes, splicesRes] = await Promise.all([
        this.supabase.client.from('steel_bars').select('*').order('sort_order'),
        this.supabase.client.from('steel_bar_lengths').select('*').or(orgQuery).order('sort_order'),
        this.supabase.client.from('steel_bar_splices').select('*').or(orgQuery)
      ]);

      if (!barsRes.error && barsRes.data && barsRes.data.length > 0) {
        const mappedBars = barsRes.data.map(b => ({
           ...b,
           id: b.id,
           n: b.n_num || '',
           pulg: b.diam_label || '',
           mm: (b.diam_mm || 0) + ' mm',
           peso_kg: b.kg_por_m || 0,
           peso_lb: b.peso_lb_m || ((b.kg_por_m || 0) * 2.20462),
           area_cm2: b.area_cm2 || 0
        }));
        this.listadoBarras.set(mappedBars);
      }

      if (!lengthsRes.error && lengthsRes.data && lengthsRes.data.length > 0) {
        const mappedLengths = lengthsRes.data.map(l => ({
           id: l.id,
           m: l.length_m
        }));
        this.longitudesBarras.set(mappedLengths);
      }

      if (!splicesRes.error && splicesRes.data) {
        this.solapesBarras.set(splicesRes.data);
      }
    } catch (err) {
      console.error("Error loading steel config", err);
    }
  }

  async saveSteelConfig() {
    try {
      const orgId = this.supabase.currentOrganizationId();

      const barsToUpsert = this.listadoBarras().map((b, i) => {
         const toSave = { ...b };
         toSave.kg_por_m = b.peso_kg;
         toSave.peso_lb_m = b.peso_lb;
         toSave.sort_order = i;
         delete toSave.n;
         delete toSave.pulg;
         delete toSave.mm;
         delete toSave.peso_kg;
         delete toSave.peso_lb;
         return toSave;
      });

      const lengthsToUpsert = this.longitudesBarras().map((l, i) => {
         const obj: any = { length_m: l.m, sort_order: i };
         if (l.id) obj.id = l.id;
         if (orgId) obj.organization_id = orgId;
         return obj;
      });

      const splicesToUpsert = this.solapesBarras().map(s => {
         const obj: any = {
            structural_element: s.structural_element,
            steel_bar_id: s.steel_bar_id,
            splice_length_m: s.splice_length_m
         };
         if (s.id) obj.id = s.id;
         if (orgId) obj.organization_id = orgId;
         return obj;
      });

      const promises: PromiseLike<any>[] = [];
      if (barsToUpsert.length > 0) promises.push(this.supabase.client.from('steel_bars').upsert(barsToUpsert, { onConflict: 'id' }));

      if (lengthsToUpsert.length > 0) promises.push(this.supabase.client.from('steel_bar_lengths').upsert(lengthsToUpsert, { onConflict: 'id' }));

      // Delete removed lengths
      const lengthsQuery = orgId
        ? `organization_id.is.null,organization_id.eq.${orgId}`
        : `organization_id.is.null`;
      const existingLengths = await this.supabase.client.from('steel_bar_lengths').select('id').or(lengthsQuery);
      if (existingLengths.data) {
        const currentLengthIds = lengthsToUpsert.map(l => l.id).filter(id => !!id);
        const lengthsToDelete = existingLengths.data.map(l => l.id).filter(id => !currentLengthIds.includes(id));
        if (lengthsToDelete.length > 0) {
            promises.push(this.supabase.client.from('steel_bar_lengths').delete().in('id', lengthsToDelete));
        }
      }

      if (splicesToUpsert.length > 0) promises.push(this.supabase.client.from('steel_bar_splices').upsert(splicesToUpsert, { onConflict: 'id' }));

      await Promise.all(promises);
      await this.loadSteelConfig();
    } catch (err) {
      console.error("Error saving steel config", err);
    }
  }

  async loadOrgSettings() {
    try {
      const orgId = this.supabase.currentOrganizationId();
      if (!orgId) return;

      const { data, error } = await this.supabase.client
        .from('org_settings')
        .select('*')
        .eq('organization_id', orgId)
        .single();

      if (!error && data) {
        if (data.color_tit_consolidado) this.colorFilaTitConsolidado.set(data.color_tit_consolidado);
        if (data.color_sub_consolidado) this.colorFilaSubConsolidado.set(data.color_sub_consolidado);
        if (data.logo_base64) this.logoConsolidadoBase64.set(data.logo_base64);
        if (data.font_name) this.fuenteConsolidadaPresupuesto.set(data.font_name);
        if (data.moneda) this.monedaGlobal.set(data.moneda);
        if (data.formato_acero) this.formatoActualGlobal.set(data.formato_acero);
        if (data.metodo_hormigon) this.metodoCalculoHormigon.set(data.metodo_hormigon);
      }
    } catch (err) {
      console.debug("No org_settings found or error loading", err);
    }
  }

  async saveOrgSettings() {
    try {
      const orgId = this.supabase.currentOrganizationId();
      if (!orgId) return;

      const settings = {
        organization_id: orgId,
        color_tit_consolidado: this.colorFilaTitConsolidado(),
        color_sub_consolidado: this.colorFilaSubConsolidado(),
        logo_base64: this.logoConsolidadoBase64(),
        font_name: this.fuenteConsolidadaPresupuesto(),
        moneda: this.monedaGlobal(),
        formato_acero: this.formatoActualGlobal(),
        metodo_hormigon: this.metodoCalculoHormigon()
      };

      const { error } = await this.supabase.client
        .from('org_settings')
        .upsert(settings, { onConflict: 'organization_id' });

      if (error) throw error;
    } catch (err) {
      console.error("Error saving org settings", err);
    }
  }
}
