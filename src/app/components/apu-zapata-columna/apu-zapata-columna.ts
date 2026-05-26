import { Component, Input, Output, EventEmitter, signal, computed, effect, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

const PESO: Record<number, number> = { 2.67: 0.384, 3: 0.557, 4: 0.996, 5: 1.560, 6: 2.250, 8: 3.975 };
const DIAMS = [2.67, 3, 4, 5, 6, 8];

@Component({
  selector: 'app-apu-zapata-columna',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './apu-zapata-columna.html',
  styles: [`
    .vbtn { border:1px solid var(--gray-border); background:var(--gray-3); color:var(--gray-muted); border-radius:4px; padding:3px 7px; font-size:11px; cursor:pointer; font-weight:600; }
    .vbtn.sel { background:var(--brand); color:#fff; border-color:var(--brand); }
  `]
})
export class ApuZapataColumna implements OnInit, OnChanges {
  @Input() apuParameters: any;
  @Output() parametersChange = new EventEmitter<any>();

  readonly diams = DIAMS;

  L    = signal(1.60);
  B    = signal(1.60);
  H    = signal(0.40);
  cant = signal(1);
  fc   = signal(210);
  rec  = signal(7);
  desp = signal(5);

  // Parrilla inferior
  diam_l = signal(8); sep_l = signal(15);
  diam_b = signal(8); sep_b = signal(15);
  gancho = signal(10);
  doble  = signal(false);

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

  // Geometry
  nBarsL = computed(() => Math.round(((this.B() * 100 - 2 * this.rec()) / Math.max(1, this.sep_l()))) + 1);
  nBarsB = computed(() => Math.round(((this.L() * 100 - 2 * this.rec()) / Math.max(1, this.sep_b()))) + 1);
  lBarL  = computed(() => this.L() - 2 * this.rec() / 100 + 2 * (this.gancho() / 100));
  lBarB  = computed(() => this.B() - 2 * this.rec() / 100 + 2 * (this.gancho() / 100));

  kgParrillaInf = computed(() =>
    this.nBarsL() * this.lBarL() * (PESO[this.diam_l()] || 0) +
    this.nBarsB() * this.lBarB() * (PESO[this.diam_b()] || 0)
  );
  kgParrillaSup = computed(() => this.doble() ? this.kgParrillaInf() : 0);

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

  encofrado = computed(() => {
    const m = this.encMetodo();
    if (m === 'sin') return 0;
    const sides = 2 * (this.L() + this.B()) * this.H() * this.cant();
    if (m === 'tierra') return sides / 2;
    return sides;
  });

  private _firstEmit = false;

  constructor() {
    effect(() => {
      const p = {
        L: this.L(), B: this.B(), H: this.H(), cant: this.cant(),
        fc: this.fc(), rec: this.rec(), desp: this.desp(),
        diam_l: this.diam_l(), sep_l: this.sep_l(),
        diam_b: this.diam_b(), sep_b: this.sep_b(),
        gancho: this.gancho(), doble: this.doble(),
        arrOn: this.arrOn(), arr: this.arr(), narr: this.narr(), proy: this.proy(), patilla: this.patilla(),
        pedOn: this.pedOn(), pedA: this.pedA(), pedB: this.pedB(), pedH: this.pedH(),
        pedVar: this.pedVar(), pedVarCant: this.pedVarCant(), pedEstb: this.pedEstb(), pedSep: this.pedSep(),
        encMetodo: this.encMetodo(),
        cantidad_calculada: +this.volTotal().toFixed(3),
      };
      if (!this._firstEmit) { this._firstEmit = true; return; }
      this.parametersChange.emit(p);
    });
  }

  ngOnInit() { if (this.apuParameters) this._load(); }
  ngOnChanges(c: SimpleChanges) { if (c['apuParameters'] && !c['apuParameters'].firstChange) this._load(); }

  private _load() {
    const p = this.apuParameters; if (!p) return;
    if (p.L    != null) this.L.set(p.L);
    if (p.B    != null) this.B.set(p.B);
    if (p.H    != null) this.H.set(p.H);
    if (p.cant != null) this.cant.set(p.cant);
    if (p.fc   != null) this.fc.set(p.fc);
    if (p.rec  != null) this.rec.set(p.rec);
    if (p.desp != null) this.desp.set(p.desp);
    if (p.diam_l != null) this.diam_l.set(p.diam_l); if (p.sep_l != null) this.sep_l.set(p.sep_l);
    if (p.diam_b != null) this.diam_b.set(p.diam_b); if (p.sep_b != null) this.sep_b.set(p.sep_b);
    if (p.gancho != null) this.gancho.set(p.gancho);
    if (p.doble  != null) this.doble.set(p.doble);
    if (p.arrOn  != null) this.arrOn.set(p.arrOn);
    if (p.arr    != null) this.arr.set(p.arr);
    if (p.narr   != null) this.narr.set(p.narr);
    if (p.proy   != null) this.proy.set(p.proy);
    if (p.patilla != null) this.patilla.set(p.patilla);
    if (p.pedOn  != null) this.pedOn.set(p.pedOn);
    if (p.pedA   != null) this.pedA.set(p.pedA);
    if (p.pedB   != null) this.pedB.set(p.pedB);
    if (p.pedH   != null) this.pedH.set(p.pedH);
    if (p.pedVar     != null) this.pedVar.set(p.pedVar);
    if (p.pedVarCant != null) this.pedVarCant.set(p.pedVarCant);
    if (p.pedEstb    != null) this.pedEstb.set(p.pedEstb);
    if (p.pedSep     != null) this.pedSep.set(p.pedSep);
    if (p.encMetodo) this.encMetodo.set(p.encMetodo);
  }

  labelDiam(d: number) { return d === 2.67 ? '¼"' : d === 3 ? '3/8"' : d === 4 ? '½"' : d === 5 ? '⅝"' : d === 6 ? '¾"' : '1"'; }
}
