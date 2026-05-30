import { Component, Input, Output, EventEmitter, signal, computed, effect, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

const PESO: Record<number, number> = { 2.67: 0.384, 3: 0.557, 4: 0.996, 5: 1.560, 6: 2.250, 8: 3.975 };
const DIAMS = [2.67, 3, 4, 5, 6, 8];

const DOSIF: Record<number, { cem: number; arena: number; grava: number }> = {
  210: { cem: 7.0, arena: 0.54, grava: 0.85 },
  250: { cem: 8.0, arena: 0.50, grava: 0.80 },
  280: { cem: 9.0, arena: 0.48, grava: 0.76 },
  350: { cem: 11.0, arena: 0.44, grava: 0.72 },
};

interface ApuRow {
  no: number; desc: string; qty: number; unit: string;
  factor: number; puKey: string; costo: number; fuente: string;
}

@Component({
  selector: 'app-apu-zapata-columna',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './apu-zapata-columna.html',
})
export class ApuZapataColumna implements OnInit, OnChanges {
  @Input() apuParameters: any;
  @Output() parametersChange = new EventEmitter<any>();

  readonly diams = DIAMS;

  nombre = signal('Zapata Aislada');
  activo = signal(true);
  showApu = signal(false);
  etiqueta = signal('Z-1');

  L    = signal(1.60);
  B    = signal(1.60);
  H    = signal(0.40);
  cant = signal(1);
  fc   = signal(210);
  rec  = signal(7);
  desp = signal(10);

  // Parrilla inferior
  diam_l = signal(8); sep_l = signal(15);
  diam_b = signal(8); sep_b = signal(15);
  gancho = signal(10);
  doble  = signal(false);

  // Parrilla superior independiente
  diam_spl = signal(4); sep_spl = signal(15);
  diam_spb = signal(4); sep_spb = signal(15);

  // Hormigón
  tipoHorm = signal<'obra' | 'premez'>('premez');
  propC = signal(1); propA = signal(2); propG = signal(3);

  // Arranque columna
  arrOn  = signal(true);
  arr    = signal(8);
  narr   = signal(4);
  proy   = signal(0.50);
  patilla = signal(10);

  // Pedestal
  pedOn      = signal(false);
  pedA       = signal(0.30);
  pedB       = signal(0.30);
  pedH       = signal(0.50);
  pedVar     = signal(8);
  pedVarCant = signal(4);
  pedEstb    = signal(6);
  pedSep     = signal(15);

  encMetodo = signal<'madera' | 'tierra' | 'sin'>('madera');

  // Encofrado madera
  madTipo = signal<'plywood' | 'tabla'>('plywood');
  madEsp = signal('0.75');
  madRefuerzo = signal<'si' | 'no'>('si');
  madSepc = signal(0.60);
  madUsos = signal(3);
  madDesp = signal(15);

  // Cuadrilla
  showCuadrilla = signal(false);
  qConcretero = signal(2);
  qFierrero = signal(2);
  qCarpintero = signal(2);
  qCapataz = signal(1);

  // APU
  imp = signal(5);
  precios = signal<Record<string, number>>({
    acero: 0, alambre: 0, cemento: 0, arena: 0, grava: 0,
    hormigon_premez: 0, encofrado_mat: 0, mo_concretero: 0,
    mo_fierrero: 0, mo_carpintero: 0, mo_capataz: 0,
    mezcladora: 0, vibrador: 0
  });

  setPrecio(k: string, e: Event) {
    const v = +(e.target as HTMLInputElement).value;
    if (!isNaN(v)) this.precios.update(p => ({ ...p, [k]: v }));
  }

  labelDiam(d: number): string {
    const map: Record<number,string> = { 2.67:'5/16"', 3:'3/8"', 4:'1/2"', 5:'5/8"', 6:'3/4"', 8:'1"' };
    return map[d] || `${d}`;
  }

  // Geometry
  nBarsL = computed(() => Math.round(((this.B() * 100 - 2 * this.rec()) / Math.max(1, this.sep_l()||1))) + 1);
  nBarsB = computed(() => Math.round(((this.L() * 100 - 2 * this.rec()) / Math.max(1, this.sep_b()||1))) + 1);
  lBarL  = computed(() => this.L() - 2 * this.rec() / 100 + 2 * (this.gancho() / 100));
  lBarB  = computed(() => this.B() - 2 * this.rec() / 100 + 2 * (this.gancho() / 100));

  nBarsSPL = computed(() => Math.round(((this.B() * 100 - 2 * this.rec()) / Math.max(1, this.sep_spl()||1))) + 1);
  nBarsSPB = computed(() => Math.round(((this.L() * 100 - 2 * this.rec()) / Math.max(1, this.sep_spb()||1))) + 1);

  kgParrillaInf = computed(() =>
    this.nBarsL() * this.lBarL() * (PESO[this.diam_l()] || 0) +
    this.nBarsB() * this.lBarB() * (PESO[this.diam_b()] || 0)
  );
  kgParrillaSup = computed(() => {
    if (!this.doble()) return 0;
    return this.nBarsSPL() * this.lBarL() * (PESO[this.diam_spl()] || 0) +
           this.nBarsSPB() * this.lBarB() * (PESO[this.diam_spb()] || 0);
  });

  kgArranque = computed(() => {
    if (!this.arrOn()) return 0;
    const lArr = this.H() + this.proy() + this.patilla() / 100;
    return this.narr() * lArr * (PESO[this.arr()] || 0);
  });

  volZapata  = computed(() => this.L() * this.B() * this.H());
  volPedestal = computed(() => this.pedOn() ? this.pedA() * this.pedB() * this.pedH() : 0);
  volNeto    = computed(() => (this.volZapata() + this.volPedestal()) * this.cant());
  volTotal   = computed(() => this.volNeto() * (1 + this.desp() / 100));

  kgPedVert  = computed(() => {
    if (!this.pedOn()) return 0;
    const lVar = this.pedH() + this.proy() + this.patilla() / 100;
    return this.pedVarCant() * lVar * (PESO[this.pedVar()] || 0);
  });
  kgPedEstb  = computed(() => {
    if (!this.pedOn()) return 0;
    const perim = 2 * (this.pedA() + this.pedB()) - 8 * this.rec() / 100;
    const nEstb = Math.ceil((this.pedH() * 100) / Math.max(1, this.pedSep())) + 1;
    return nEstb * perim * (PESO[this.pedEstb()] || 0);
  });

  kgTotal = computed(() =>
    (this.kgParrillaInf() + this.kgParrillaSup() + this.kgArranque() + this.kgPedVert() + this.kgPedEstb()) * this.cant()
  );

  // Top-view (plan) diagram
  planDiagram = computed(() => {
    const VW = 160, VH = 160, pad = 18;
    const LM = Math.max(this.L(), 0.2);
    const BM = Math.max(this.B(), 0.2);
    const maxSW = VW - 2 * pad, maxSH = VH - 2 * pad;
    const ar = LM / BM;
    let sw = maxSW, sh = maxSH;
    if (ar >= 1) sh = Math.min(maxSH, sw / ar); else sw = Math.min(maxSW, sh * ar);
    const sx = (VW - sw) / 2, sy = (VH - sh) / 2;
    const recPx = Math.min((this.rec() / 100) / Math.max(LM, BM) * Math.max(sw, sh), Math.min(sw, sh) * 0.2);

    const nL = Math.max(2, Math.min(this.nBarsL(), 12));
    const nB = Math.max(2, Math.min(this.nBarsB(), 12));
    const barsL: {x1: number, y1: number, x2: number, y2: number}[] = [];
    for (let i = 0; i < nL; i++) {
      const yPos = sy + recPx + (i / Math.max(nL - 1, 1)) * (sh - 2 * recPx);
      barsL.push({ x1: sx + recPx, y1: yPos, x2: sx + sw - recPx, y2: yPos });
    }
    const barsB: {x1: number, y1: number, x2: number, y2: number}[] = [];
    for (let i = 0; i < nB; i++) {
      const xPos = sx + recPx + (i / Math.max(nB - 1, 1)) * (sw - 2 * recPx);
      barsB.push({ x1: xPos, y1: sy + recPx, x2: xPos, y2: sy + sh - recPx });
    }
    const cx = sx + sw / 2, cy = sy + sh / 2;
    const colSize = Math.min(sw, sh) * 0.18;
    return { sx, sy, sw, sh, barsL, barsB,
      colX: cx - colSize / 2, colY: cy - colSize / 2, colW: colSize, colH: colSize,
      labelL: this.L().toFixed(2) + ' m',
      labelB: this.B().toFixed(2) + ' m',
    };
  });

  svgZoom = signal<number>(1);
  onSvgWheel(e: WheelEvent) {
    e.preventDefault();
    this.svgZoom.update(z => Math.min(4, Math.max(0.3, +(z - e.deltaY * 0.001).toFixed(3))));
  }

  encofrado = computed(() => {
    const m = this.encMetodo();
    if (m === 'sin') return 0;
    const sides = 2 * (this.L() + this.B()) * this.H() * this.cant();
    // En pedestal también se encofran las 4 caras del pedestal
    const sidesPed = this.pedOn() ? 2 * (this.pedA() + this.pedB()) * this.pedH() * this.cant() : 0;
    if (m === 'tierra') return sidesPed; // La zapata va contra tierra, pero el pedestal sí se encofra
    return sides + sidesPed;
  });

  madTablas = computed(() => {
    if (this.encMetodo() !== 'madera') return 0;
    const area = this.encofrado() * (1 + this.madDesp() / 100);
    const m2Tablero = 2.972896; // 4x8 pies
    return Math.ceil(area / m2Tablero);
  });

  madCuartones = computed(() => {
    if (this.encMetodo() !== 'madera' || this.madRefuerzo() === 'no') return 0;
    const perim = 2 * (this.L() + this.B());
    const cpc = Math.ceil(perim / this.madSepc()); // Cuartones rodeando
    const pedPerim = this.pedOn() ? 2 * (this.pedA() + this.pedB()) : 0;
    const cpcPed = this.pedOn() ? Math.ceil(pedPerim / this.madSepc()) : 0;
    return Math.ceil((cpc + cpcPed) * this.cant() * (1 + this.madDesp() / 100));
  });

  apuData = computed(() => {
    const P = this.precios();
    const pr = (k: string) => P[k] || 0;
    const vol = this.volTotal();
    const div = Math.max(vol, 0.0001);
    const kgAcero = this.kgTotal();
    const alambre = kgAcero * 0.05;
    const encM2 = this.encofrado();
    const isObra = this.tipoHorm() === 'obra';
    const dosif = DOSIF[this.fc()] || DOSIF[210];

    let no = 1;
    const mk = (desc: string, qty: number, unit: string, factor: number, puKey: string, fuente: string): ApuRow => ({
      no: no++, desc, qty, unit, factor, puKey, costo: qty * factor * pr(puKey), fuente
    });

    const sec1: ApuRow[] = [];
    sec1.push(mk('Acero de refuerzo', kgAcero / div, 'KG', 1.07, 'acero', 'Acero'));
    sec1.push(mk('Alambre picado (5%)', alambre / div, 'KG', 1.07, 'alambre', 'Materiales'));
    if (isObra) {
      sec1.push(mk('Cemento Portland', dosif.cem, 'Saco', 1.10, 'cemento', 'Materiales'));
      sec1.push(mk('Arena gruesa', dosif.arena, 'M³', 1.10, 'arena', 'Materiales'));
      sec1.push(mk('Grava 3/4"', dosif.grava, 'M³', 1.10, 'grava', 'Materiales'));
    } else {
      sec1.push(mk(`Hormigón premezclado f'c=${this.fc()} kg/cm²`, 1.00, 'M³', 1.10, 'hormigon_premez', 'Proveedor'));
    }
    if (encM2 > 0) sec1.push(mk('Encofrado (mano+material)', encM2 / div, 'M²', 1.05, 'encofrado_mat', 'Encofrado'));
    const subI = sec1.reduce((s, r) => s + r.costo, 0);

    const sec2: ApuRow[] = [];
    const useCuadrilla = this.showCuadrilla();
    if (useCuadrilla) {
      if (this.qConcretero() > 0) sec2.push(mk('Concretero', this.qConcretero() / div, 'Jornal', 1.05, 'mo_concretero', 'M.O.'));
      if (this.qFierrero() > 0) sec2.push(mk('Fierrero / armador', this.qFierrero() / div, 'Jornal', 1.05, 'mo_fierrero', 'M.O.'));
      if (encM2 > 0 && this.qCarpintero() > 0) sec2.push(mk('Carpintero encofrado', this.qCarpintero() / div, 'Jornal', 1.05, 'mo_carpintero', 'M.O.'));
      if (this.qCapataz() > 0) sec2.push(mk('Capataz', this.qCapataz() / div, 'Jornal', 1.05, 'mo_capataz', 'M.O.'));
    } else {
      sec2.push(mk('Colocación de hormigón', 1.00, 'UND', 1.05, 'mo_concretero', 'M.O.'));
      sec2.push(mk('M.O. acero (colocación y amarre)', kgAcero / div, 'KG', 1.05, 'mo_fierrero', 'M.O.'));
      if (encM2 > 0) sec2.push(mk('Encofrado a todo costo', encM2 / div, 'M²', 1.05, 'mo_carpintero', 'M.O.'));
    }
    const subII = sec2.reduce((s, r) => s + r.costo, 0);

    const sec3: ApuRow[] = [];
    if (isObra) {
      sec3.push(mk('Mezcladora de concreto (1/12 hr/m³)', 1 / 12, 'HR', 1.00, 'mezcladora', 'Equipo'));
      sec3.push(mk('Vibrador de concreto', 1 / 12, 'HR', 1.00, 'vibrador', 'Equipo'));
    }
    const subIII = sec3.reduce((s, r) => s + r.costo, 0);

    const totalBase = subI + subII + subIII;
    const totalFinal = totalBase * (1 + (this.imp() || 0) / 100);
    return { sec1, sec2, sec3, subI, subII, subIII, totalBase, totalFinal };
  });

  constructor() {
    effect(() => {
      this.parametersChange.emit({
        nombre: this.nombre(), activo: this.activo(), etiqueta: this.etiqueta(),
        L: this.L(), B: this.B(), H: this.H(), cant: this.cant(),
        fc: this.fc(), rec: this.rec(), desp: this.desp(),
        diam_l: this.diam_l(), sep_l: this.sep_l(),
        diam_b: this.diam_b(), sep_b: this.sep_b(),
        diam_spl: this.diam_spl(), sep_spl: this.sep_spl(),
        diam_spb: this.diam_spb(), sep_spb: this.sep_spb(),
        gancho: this.gancho(), doble: this.doble(),
        arrOn: this.arrOn(), arr: this.arr(), narr: this.narr(), proy: this.proy(), patilla: this.patilla(),
        pedOn: this.pedOn(), pedA: this.pedA(), pedB: this.pedB(), pedH: this.pedH(),
        pedVar: this.pedVar(), pedVarCant: this.pedVarCant(), pedEstb: this.pedEstb(), pedSep: this.pedSep(),
        encMetodo: this.encMetodo(),
        tipoHorm: this.tipoHorm(), propC: this.propC(), propA: this.propA(), propG: this.propG(),
        madTipo: this.madTipo(), madEsp: this.madEsp(), madRefuerzo: this.madRefuerzo(), madSepc: this.madSepc(), madUsos: this.madUsos(), madDesp: this.madDesp(),
        qConcretero: this.qConcretero(), qFierrero: this.qFierrero(), qCarpintero: this.qCarpintero(), qCapataz: this.qCapataz(),
        imp: this.imp(), precios: this.precios(),
        cantidad_calculada: +this.volTotal().toFixed(3),
      });
    });
  }

  ngOnInit() { if (this.apuParameters) this._load(); }
  ngOnChanges(c: SimpleChanges) { if (c['apuParameters'] && !c['apuParameters'].firstChange) this._load(); }

  private _load() {
    const p = this.apuParameters; if (!p) return;
    if (p.nombre != null) this.nombre.set(p.nombre);
    if (p.activo != null) this.activo.set(p.activo);
    if (p.etiqueta != null) this.etiqueta.set(p.etiqueta);
    if (p.L    != null) this.L.set(p.L);
    if (p.B    != null) this.B.set(p.B);
    if (p.H    != null) this.H.set(p.H);
    if (p.cant != null) this.cant.set(p.cant);
    if (p.fc   != null) this.fc.set(p.fc);
    if (p.rec  != null) this.rec.set(p.rec);
    if (p.desp != null) this.desp.set(p.desp);
    if (p.diam_l != null) this.diam_l.set(+p.diam_l); if (p.sep_l != null) this.sep_l.set(+p.sep_l);
    if (p.diam_b != null) this.diam_b.set(+p.diam_b); if (p.sep_b != null) this.sep_b.set(+p.sep_b);
    if (p.gancho != null) this.gancho.set(+p.gancho);
    if (p.doble  != null) this.doble.set(p.doble === true || p.doble === 'true');
    if (p.arrOn  != null) this.arrOn.set(p.arrOn === true || p.arrOn === 'true');
    if (p.arr    != null) this.arr.set(+p.arr);
    if (p.narr   != null) this.narr.set(+p.narr);
    if (p.proy   != null) this.proy.set(+p.proy);
    if (p.patilla != null) this.patilla.set(+p.patilla);
    if (p.pedOn  != null) this.pedOn.set(p.pedOn === true || p.pedOn === 'true');
    if (p.pedA   != null) this.pedA.set(+p.pedA);
    if (p.pedB   != null) this.pedB.set(+p.pedB);
    if (p.pedH   != null) this.pedH.set(+p.pedH);
    if (p.pedVar     != null) this.pedVar.set(+p.pedVar);
    if (p.pedVarCant != null) this.pedVarCant.set(+p.pedVarCant);
    if (p.pedEstb    != null) this.pedEstb.set(+p.pedEstb);
    if (p.pedSep     != null) this.pedSep.set(+p.pedSep);
    if (p.encMetodo) this.encMetodo.set(p.encMetodo);
  
    if (p.diam_spl != null) this.diam_spl.set(+p.diam_spl); if (p.sep_spl != null) this.sep_spl.set(+p.sep_spl);
    if (p.diam_spb != null) this.diam_spb.set(+p.diam_spb); if (p.sep_spb != null) this.sep_spb.set(+p.sep_spb);

    if (p.tipoHorm) this.tipoHorm.set(p.tipoHorm);
    if (p.propC != null) this.propC.set(p.propC);
    if (p.propA != null) this.propA.set(p.propA);
    if (p.propG != null) this.propG.set(p.propG);

    if (p.madTipo) this.madTipo.set(p.madTipo);
    if (p.madEsp) this.madEsp.set(p.madEsp);
    if (p.madRefuerzo) this.madRefuerzo.set(p.madRefuerzo);
    if (p.madSepc != null) this.madSepc.set(p.madSepc);
    if (p.madUsos != null) this.madUsos.set(p.madUsos);
    if (p.madDesp != null) this.madDesp.set(p.madDesp);

    if (p.qConcretero != null) this.qConcretero.set(p.qConcretero);
    if (p.qFierrero != null) this.qFierrero.set(p.qFierrero);
    if (p.qCarpintero != null) this.qCarpintero.set(p.qCarpintero);
    if (p.qCapataz != null) this.qCapataz.set(p.qCapataz);
    if (p.imp != null) this.imp.set(p.imp);
    if (p.precios) this.precios.set({ ...this.precios(), ...p.precios });
  }
  toggleCuadrilla() { this.showCuadrilla.update(v => !v); }
}
