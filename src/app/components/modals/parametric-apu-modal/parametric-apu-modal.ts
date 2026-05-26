import { Component, inject, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiState } from '../../../services/ui-state';
import { ProjectService } from '../../../services/project';
import { SupabaseService } from '../../../services/supabase.service';
import { showError } from '../../../utils/alert.util';

@Component({
  selector: 'app-parametric-apu-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './parametric-apu-modal.html'
})
export class ParametricApuModal {
  uiState = inject(UiState);
  projectService = inject(ProjectService);
  supabase = inject(SupabaseService);

  isInserting = signal(false);
  paramDropdownOptions = signal<Record<string, any[]>>({});

  // Valores actuales de los parámetros (se inicializan con los defaults del APU)
  paramValues = signal<Record<string, number | string>>({});

  constructor() {
    // Cuando cambia el APU activo, reinicializar los parámetros con sus defaults
    effect(() => {
      const apu = this.uiState.activeParametricApu();
      if (apu?.parameters) {
        const defaults: Record<string, number | string> = {};
        for (const p of apu.parameters) {
          defaults[p.key] = p.default ?? 0;
        }
        this.paramValues.set(defaults);
        this.loadParamDropdowns(apu.parameters);
      }
    });
  }

  // Cuando el modal abre, inicializar los valores por defecto
  get apu() { return this.uiState.activeParametricApu(); }

  // Computed: el APU activo con parámetros
  parameters = computed<{key: string, label: string, default: number, unit: string, ref_table?: string, ref_label_field?: string, ref_value_field?: string}[]>(() => {
    return this.apu?.parameters || [];
  });

  async loadParamDropdowns(params: any[]) {
    const options: Record<string, any[]> = {};

    for (const param of params) {
      if (param.ref_table) {
        try {
          const { data, error } = await this.supabase.client
            .from(param.ref_table)
            .select('*')
            .order('sort_order', { ascending: true });

          if (!error && data) {
            options[param.key] = data;
          }
        } catch (err) {
          console.error(`Error loading options for ${param.key}:`, err);
        }
      }
    }

    this.paramDropdownOptions.set(options);
  }

  // Evaluador seguro de fórmulas con los parámetros actuales
  private evalFormula(formula: string | number, extraVars: Record<string, number> = {}): number {
    if (typeof formula === 'number') return formula;
    const numericParams: Record<string, number> = {};
    for (const [k, v] of Object.entries(this.paramValues())) {
      numericParams[k] = typeof v === 'number' ? v : 0;
    }
    const allVars = { ...numericParams, ...extraVars };
    const varNames = Object.keys(allVars);
    const varValues = Object.values(allVars);
    try {
      const safeFormula = (formula as string)
        .replace(/CEIL\(/gi, 'Math.ceil(')
        .replace(/FLOOR\(/gi, 'Math.floor(')
        .replace(/ROUND\(/gi, 'Math.round(')
        .replace(/SQRT\(/gi, 'Math.sqrt(')
        .replace(/ABS\(/gi, 'Math.abs(');
      const fn = new Function(...varNames, `return ${safeFormula};`);
      const result = fn(...varValues);
      return isNaN(result) || !isFinite(result) ? 0 : result;
    } catch {
      return 0;
    }
  }

  // Evalúa las formulas_calculo (para APUs de preliminares) y devuelve un mapa de variables derivadas
  private getDerivedVars(): Record<string, number> {
    const derived: Record<string, number> = {};
    const formulas = this.apu?.formulas;
    if (!formulas?.formulas_calculo) return derived;
    for (const [key, expr] of Object.entries(formulas.formulas_calculo)) {
      derived[key] = this.evalFormula(expr as string, derived);
    }
    return derived;
  }

  // --- Computed items para mostrar en la tabla preview ---

  materialesRows = computed(() => {
    const formulas = this.apu?.formulas;
    if (!formulas) return [];
    const items = formulas.materiales || formulas.suministro || [];
    const derived = this.getDerivedVars();
    const params = this.paramValues();
    const imprevistosPct = formulas.imprevistos_pct ?? 5;

    return items.map((m: any) => {
      let qty = 0;
      if (m.qty_formula) {
        qty = this.evalFormula(m.qty_formula, derived);
      } else if (m.qty_por_m3 !== undefined) {
        // Para estructuras, vol_m3 viene de los parámetros de dimensión
        const ancho = (params['ancho_m'] as number) ?? 0;
        const alto = ((params['alto_m'] as number) ?? (params['espesor_m'] as number)) ?? 0;
        const largo = (params['largo_m'] as number) ?? 1;
        const cant = (params['cantidad'] as number) ?? 1;
        const vol = ancho * alto * largo * cant;
        qty = m.qty_por_m3 * vol;
      } else if (m.qty !== undefined) {
        qty = this.evalFormula(m.qty, derived);
      }
      const factor = m.factor ?? 1;
      const price = m.price_ref ?? 0;
      const subtotal = qty * factor * price;
      return { description: m.description, unit: m.unit, qty: qty * factor, price, subtotal };
    });
  });

  manoObraRows = computed(() => {
    const formulas = this.apu?.formulas;
    if (!formulas) return [];
    const items = formulas.mano_obra || [];
    const derived = this.getDerivedVars();
    const params = this.paramValues();

    return items.map((m: any) => {
      let qty = 0;
      if (m.qty_formula) {
        qty = this.evalFormula(m.qty_formula, derived);
      } else if (m.qty_por_m3 !== undefined) {
        const ancho = (params['ancho_m'] as number) ?? 0;
        const alto = ((params['alto_m'] as number) ?? (params['espesor_m'] as number)) ?? 0;
        const largo = (params['largo_m'] as number) ?? 1;
        const cant = (params['cantidad'] as number) ?? 1;
        const vol = ancho * alto * largo * cant;
        qty = m.qty_por_m3 * vol;
      } else if (m.qty !== undefined) {
        qty = this.evalFormula(m.qty, derived);
      }
      const factor = m.factor ?? 1;
      const price = m.price_ref ?? 0;
      const subtotal = qty * factor * price;
      return { description: m.description, unit: m.unit, qty: qty * factor, price, subtotal };
    });
  });

  subtotalMat = computed(() => this.materialesRows().reduce((s: number, r: any) => s + r.subtotal, 0));
  subtotalMO = computed(() => this.manoObraRows().reduce((s: number, r: any) => s + r.subtotal, 0));
  imprevistosPct = computed(() => this.apu?.formulas?.imprevistos_pct ?? 5);
  imprevistos = computed(() => (this.subtotalMat() + this.subtotalMO()) * this.imprevistosPct() / 100);
  totalApu = computed(() => this.subtotalMat() + this.subtotalMO() + this.imprevistos());

  // Unidad de medida del APU (para mostrar en la vista)
  getUnitLabel(): string {
    const apu = this.apu;
    if (!apu) return '';
    const params = this.paramValues();
    // Para APUs de área, la unidad base es M2
    if (apu.unit?.toUpperCase().includes('M2') || apu.unit?.toUpperCase() === 'M2') {
      const area = (params['area_m2'] as number ?? (((params['ancho_m'] as number ?? 0) * (params['largo_m'] as number ?? 0))));
      return `${area.toFixed(2)} M2`;
    }
    if (apu.unit?.toUpperCase().includes('M3') || apu.unit?.toUpperCase() === 'M3') {
      const ancho = params['ancho_m'] as number ?? 0;
      const alto = (params['alto_m'] as number ?? params['espesor_m'] as number ?? 0);
      const largo = params['largo_m'] as number ?? 1;
      const cant = params['cantidad'] as number ?? 1;
      return `${(ancho * alto * largo * cant).toFixed(4)} M3`;
    }
    return apu.unit || 'UND';
  }

  onParamChange() {
    // Fuerza recompute de signals disparando un set
    this.paramValues.update(v => ({ ...v }));
  }

  getParamValue(key: string, fallback: number | string): number | string {
    const v = this.paramValues()[key];
    return v !== undefined ? v : fallback;
  }

  updateParam(key: string, value: string) {
    const num = parseFloat(value);
    this.paramValues.update(v => ({ ...v, [key]: isNaN(num) ? value : num }));
  }

  getDropdownOptions(paramKey: string): any[] {
    return this.paramDropdownOptions()[paramKey] || [];
  }

  getDropdownLabel(paramKey: string, value: string | number): string {
    const options = this.getDropdownOptions(paramKey);
    const param = this.parameters().find(p => p.key === paramKey);
    const labelField = param?.ref_label_field || 'label';
    const valueField = param?.ref_value_field || 'id';

    const option = options.find(o => o[valueField] === value || o.id === value);
    return option ? option[labelField] : String(value);
  }

  closeModal() {
    this.uiState.isParametricApuModalOpen.set(false);
    this.uiState.activeParametricApu.set(null);
    this.uiState.parametricTargetChapter.set(null);
    this.uiState.parametricTargetItem.set(null);
  }

  async confirm() {
    const apu = this.apu;
    const chapter = this.uiState.parametricTargetChapter();
    const existingItem = this.uiState.parametricTargetItem();
    if (!apu) return;

    this.isInserting.set(true);

    const calculatedPrice = this.totalApu();
    const params = this.paramValues();

    try {
      if (existingItem) {
        // Actualizar item existente
        existingItem.description = apu.name;
        existingItem.unit = apu.unit || 'UND';
        existingItem.unit_price = calculatedPrice;
        existingItem.total = calculatedPrice * existingItem.quantity;
        existingItem.apu_template_id = apu.id;
        existingItem.apu_parameters = params;

        this.projectService.updateTotal();

        await this.supabase.client.from('budget_items').update({
          description: existingItem.description,
          unit: existingItem.unit,
          unit_price: existingItem.unit_price,
          apu_template_id: existingItem.apu_template_id,
          apu_parameters: existingItem.apu_parameters
        }).eq('id', existingItem.id);

        // Llamar RPC para snapshot
        await this.supabase.client.rpc('recalculate_budget_item', { p_item_id: existingItem.id });
        const { data: fresh } = await this.supabase.client.from('budget_items').select('*').eq('id', existingItem.id).single();
        if (fresh) {
          existingItem.unit_price = fresh.unit_price || calculatedPrice;
          existingItem.total = fresh.total || calculatedPrice * existingItem.quantity;
          existingItem.apu_snapshot = fresh.apu_snapshot;
          this.projectService.updateTotal();
        }
      } else if (chapter) {
        // Nuevo item
        if (!chapter.items) chapter.items = [];
        const newItem: any = {
          id: crypto.randomUUID(),
          budget_id: chapter.budget_id,
          chapter_id: chapter.id,
          item_number: `${chapter.chapter_number}.0${chapter.items.length + 1}`,
          description: apu.name,
          quantity: 1,
          unit: apu.unit || 'UND',
          unit_price: calculatedPrice,
          total: calculatedPrice,
          sort_order: chapter.items.length + 1,
          apu_template_id: apu.id,
          apu_parameters: params
        };

        chapter.items.push(newItem);
        this.projectService.updateTotal();

        await this.supabase.client.from('budget_items').insert([{
          id: newItem.id,
          budget_id: newItem.budget_id,
          chapter_id: newItem.chapter_id,
          item_number: newItem.item_number,
          description: newItem.description,
          quantity: newItem.quantity,
          unit: newItem.unit,
          unit_price: newItem.unit_price,
          sort_order: newItem.sort_order,
          apu_template_id: newItem.apu_template_id,
          apu_parameters: newItem.apu_parameters
        }]);

        await this.supabase.client.rpc('recalculate_budget_item', { p_item_id: newItem.id });
        const { data: fresh } = await this.supabase.client.from('budget_items').select('*').eq('id', newItem.id).single();
        if (fresh) {
          const local = chapter.items.find((i: any) => i.id === newItem.id);
          if (local) {
            local.unit_price = fresh.unit_price || calculatedPrice;
            local.total = fresh.total || calculatedPrice;
            local.apu_snapshot = fresh.apu_snapshot;
            this.projectService.updateTotal();
          }
        }
      }

      this.closeModal();
    } catch (err) {
      console.error('Error insertando APU paramétrico:', err);
      showError(String(err), 'Error al insertar el APU');
    } finally {
      this.isInserting.set(false);
    }
  }
}
