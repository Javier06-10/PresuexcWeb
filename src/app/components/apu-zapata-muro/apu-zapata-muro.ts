import { Component, Input, Output, EventEmitter, signal, computed, effect, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

const PESO: Record<number, number> = { 2.67: 0.384, 3: 0.557, 4: 0.996, 5: 1.560, 6: 2.250, 8: 3.975 };
const DIAMS = [2.67, 3, 4, 5, 6, 8];

interface TramoZM { descripcion: string; largo: number; }

interface ApuRow {
  no: number; desc: string; qty: number; unit: string;
  factor: number; puKey: string; costo: number; fuente: string;
}

const DOSIF: Record<number, { cem: number; arena: number; grava: number }> = {
  210: { cem: 7.0, arena: 0.54, grava: 0.85 },
  250: { cem: 8.0, arena: 0.50, grava: 0.80 },
  280: { cem: 9.0, arena: 0.48, grava: 0.76 },
  350: { cem: 11.0, arena: 0.44, grava: 0.72 },
};

@Component({
  selector: 'app-apu-zapata-muro',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './apu-zapata-muro.html',
})
export class ApuZapataMuro implements OnInit, OnChanges {
  @Input() apuParameters: any;
  @Output() parametersChange = new EventEmitter<any>();

  readonly diams = DIAMS;

  nombre = signal('Zapata corrida');
  activo = signal(true);
  showApu = signal(false);
  tipoZapata = signal<'corrida' | 'riostra' | null>(null);

  tramos = signal<TramoZM[]>([{ descripcion: 'Tramo principal', largo: 10.0 }]);
  b   = signal(45);
  h   = signal(30);
  fc  = signal(210);
  rec = signal(8);
  desp = signal(10);

  al1 = signal(8); cv1 = signal(2);
  al2 = signal(6); cv2 = signal(2);
  al3 = signal(0); cv3 = signal(0);
  lbarra = signal(6);

  at  = signal(6);
  sep = signal(20);
  lg  = signal(10);

  encMetodo = signal<'madera' | 'tierra' | 'sin'>('madera');
  encUnidad = signal<'m2' | 'ml'>('m2');
  encPrecio = signal(0);

  tipoHorm = signal<'obra' | 'premez'>('premez');
  propC = signal(1); propA = signal(2); propG = signal(3);

  madTipo = signal<'plywood' | 'tabla'>('plywood');
  madEsp = signal('0.75');
  madRefuerzo = signal<'si' | 'no'>('si');
  madSepc = signal(0.60);
  madUsos = signal(3);
  madDesp = signal(15);
  madDetalleOn = signal(false);

  showCuadrilla = signal(false);

  readonly diamsL1 = [2.67, 3, 4, 6, 8];
  readonly diamsL23 = [0, 2.67, 3, 4, 6];
  readonly diamsAt = [3, 4];
  readonly barraOpts = [
    { label: '20 pies — 6.10 m', val: 6.10 },
    { label: '30 pies — 9.15 m', val: 9.15 },
    { label: '12 m',             val: 12.0 },
  ];
  qConcretero = signal(2);
  qFierrero = signal(2);
  qCarpintero = signal(2);
  qCapataz = signal(1);

  // APU
  imp = signal(5);
  precios = signal<Record<string, number>>({
    acero: 0, alambre: 0, cemento: 0, arena: 0, grava: 0,
    hormigon_premez: 0, encofrado: 0, mo_concretero: 0,
    mo_fierrero: 0, mo_carpintero: 0, mo_capataz: 0,
    mezcladora: 0, vibrador: 0
  });

  longTotal = computed(() => this.tramos().reduce((s, t) => s + (t.largo || 0), 0));
  seccion   = computed(() => (this.b() / 100) * (this.h() / 100));
  volNeto   = computed(() => this.longTotal() * this.seccion());
  volPres   = computed(() => this.volNeto() * (1 + this.desp() / 100));

  kgLong1 = computed(() => this.cv1() * (PESO[this.al1()] || 0) * this.longTotal());
  kgLong2 = computed(() => this.cv2() * (PESO[this.al2()] || 0) * this.longTotal());
  kgLong3 = computed(() => this.cv3() * (PESO[this.al3()] || 0) * this.longTotal());

  labelDiam(d: number): string {
    const map: Record<number,string> = { 2.67:'5/16"', 3:'3/8"', 4:'1/2"', 5:'5/8"', 6:'3/4"', 8:'1"' };
    return map[d] || `${d}`;
  }

  setAl2(d: number) { this.al2.set(d); if (d === 0) this.cv2.set(0); }
  setAl3(d: number) { this.al3.set(d); if (d === 0) this.cv3.set(0); }

  addTramo() { this.tramos.update(t => [...t, { descripcion: '', largo: 0 }]); }
  removeTramo(idx: number) { this.tramos.update(t => t.filter((_, i) => i !== idx)); }
  updateTramo(idx: number, field: keyof TramoZM, val: any) {
    this.tramos.update(t => {
      const nw = [...t];
      nw[idx] = { ...nw[idx], [field]: val };
      return nw;
    });
  }

  anchoEf  = computed(() => Math.max(0, (this.b() - 2 * this.rec()) / 100));
  nEst     = computed(() => Math.ceil((this.longTotal() * 100) / Math.max(1, this.sep())) + 1);
  kgTransv = computed(() => this.nEst() * (this.anchoEf() + 2 * (this.lg() / 100)) * (PESO[this.at()] || 0));
  kgTotal  = computed(() => this.kgLong1() + this.kgLong2() + this.kgLong3() + this.kgTransv());

  sectionDiagram = computed(() => {
    const VW = 160, VH = 160, pad = 18;
    const B = Math.max(this.b() / 100, 0.05);
    const H = Math.max(this.h() / 100, 0.05);
    const maxSW = VW - 2 * pad, maxSH = VH - 2 * pad;
    const ar = B / H;
    let sw = maxSW, sh = maxSH;
    if (ar >= 1) sh = Math.min(maxSH, sw / ar); else sw = Math.min(maxSW, sh * ar);
    const sx = (VW - sw) / 2, sy = (VH - sh) / 2;
    const recM = (this.rec() || 0) / 100;
    const rpx  = Math.min(recM / Math.max(B, H) * Math.max(sw, sh), Math.min(sw, sh) * 0.28);
    const ix = sx + rpx, iy = sy + rpx;
    const iw = Math.max(sw - 2 * rpx, 6), ih = Math.max(sh - 2 * rpx, 6);
    const r = 5;
    return {
      sx, sy, sw, sh, ix, iy, iw, ih,
      labelB: this.b().toFixed(0) + ' cm',
      labelH: this.h().toFixed(0) + ' cm',
      bars1: this._barsLine(ix, iy + ih,           iw, Math.min(this.cv1() || 0, 12)),
      bars2: (this.cv2() > 0 && this.al2() > 0) ? this._barsLine(ix, iy + ih - 2*r, iw, Math.min(this.cv2(), 12)) : [],
      bars3: (this.cv3() > 0 && this.al3() > 0) ? this._barsLine(ix, iy + ih - 4*r, iw, Math.min(this.cv3(), 12)) : [],
    };
  });

  private _barsLine(ix: number, iy: number, iw: number, n: number): {x: number, y: number}[] {
    if (n <= 0) return [];
    if (n === 1) return [{ x: ix + iw / 2, y: iy }];
    return Array.from({ length: n }, (_, i) => ({ x: ix + (i / (n - 1)) * iw, y: iy }));
  }

  svgZoom = signal<number>(1);
  onSvgWheel(e: WheelEvent) {
    e.preventDefault();
    this.svgZoom.update(z => Math.min(4, Math.max(0.3, +(z - e.deltaY * 0.001).toFixed(3))));
  }

  encofrado = computed(() => {
    const m = this.encMetodo();
    const lt = this.longTotal(), ht = this.h() / 100;
    if (m === 'madera') return 2 * ht * lt;
    if (m === 'tierra') return ht * lt;
    return 0;
  });

  madTablas = computed(() => {
    if (this.encMetodo() !== 'madera') return 0;
    const area = this.encofrado() * (1 + this.madDesp() / 100);
    const m2Tablero = 2.972896; // 4x8 pies
    return Math.ceil(area / m2Tablero);
  });

  madCuartones = computed(() => {
    if (this.encMetodo() !== 'madera' || this.madRefuerzo() === 'no') return 0;
    const lt = this.longTotal();
    const caras = 2; // Zapata muro = 2 caras
    const cpc = Math.ceil(lt / this.madSepc()) + 1;
    return Math.ceil((cpc * caras) * (1 + this.madDesp() / 100));
  });

  apuData = computed(() => {
    const P = this.precios();
    const pr = (k: string) => P[k] || 0;
    const vol = this.volPres();
    const div = Math.max(vol, 0.0001);
    const kgAcero = this.kgTotal();
    const alambre = kgAcero * 0.05;
    const encM2 = this.encofrado();
    const isObra = this.tipoHorm() === 'obra';
    const dosif = DOSIF[this.fc()] ?? DOSIF[210];

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
    if (encM2 > 0) sec1.push(mk('Encofrado (mano+material)', encM2 / div, 'M²', 1.05, 'encofrado', 'Encofrado'));
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
        nombre: this.nombre(), activo: this.activo(),
        tramos: this.tramos(), b: this.b(), h: this.h(), fc: this.fc(),
        rec: this.rec(), desp: this.desp(),
        al1: this.al1(), cv1: this.cv1(), al2: this.al2(), cv2: this.cv2(),
        al3: this.al3(), cv3: this.cv3(), lbarra: this.lbarra(),
        at: this.at(), sep: this.sep(), lg: this.lg(),
        encMetodo: this.encMetodo(),
        tipoHorm: this.tipoHorm(), propC: this.propC(), propA: this.propA(), propG: this.propG(),
        madTipo: this.madTipo(), madEsp: this.madEsp(), madRefuerzo: this.madRefuerzo(), madSepc: this.madSepc(), madUsos: this.madUsos(), madDesp: this.madDesp(),
        qConcretero: this.qConcretero(), qFierrero: this.qFierrero(), qCarpintero: this.qCarpintero(), qCapataz: this.qCapataz(),
        imp: this.imp(), precios: this.precios(),
        cantidad_calculada: +this.volPres().toFixed(3),
      });
    });
  }

  ngOnInit() { if (this.apuParameters) this._load(); }
  ngOnChanges(c: SimpleChanges) { if (c['apuParameters'] && !c['apuParameters'].firstChange) this._load(); }

  private _load() {
    const p = this.apuParameters; if (!p) return;
    if (p.nombre != null) this.nombre.set(p.nombre);
    if (p.activo != null) this.activo.set(p.activo);
    if (p.tramos)    this.tramos.set(p.tramos);
    if (p.b    != null) this.b.set(p.b);
    if (p.h    != null) this.h.set(p.h);
    if (p.fc   != null) this.fc.set(p.fc);
    if (p.rec  != null) this.rec.set(p.rec);
    if (p.desp != null) this.desp.set(p.desp);
    if (p.al1  != null) this.al1.set(+p.al1);  if (p.cv1 != null) this.cv1.set(p.cv1);
    if (p.al2  != null) this.al2.set(+p.al2);  if (p.cv2 != null) this.cv2.set(p.cv2);
    if (p.al3  != null) this.al3.set(+p.al3);  if (p.cv3 != null) this.cv3.set(p.cv3);
    if (p.lbarra != null) this.lbarra.set(p.lbarra);
    if (p.at   != null) this.at.set(+p.at);
    if (p.sep  != null) this.sep.set(p.sep);
    if (p.lg   != null) this.lg.set(p.lg);
    if (p.encMetodo) this.encMetodo.set(p.encMetodo);

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
    if (p.precios != null) this.precios.set(p.precios);
  }


  setPrecio(k: string, e: Event) {
    const v = +(e.target as HTMLInputElement).value;
    if (!isNaN(v)) this.precios.update(p => ({ ...p, [k]: v }));
  }

  setDiam(sig: (v?: any) => any, v: number) { (sig as any).set(v); }


  toggleCuadrilla() { this.showCuadrilla.update(v => !v); }
}
