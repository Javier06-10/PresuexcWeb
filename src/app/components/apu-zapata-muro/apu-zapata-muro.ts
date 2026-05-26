import { Component, Input, Output, EventEmitter, signal, computed, effect, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

const PESO: Record<number, number> = { 2.67: 0.384, 3: 0.557, 4: 0.996, 5: 1.560, 6: 2.250, 8: 3.975 };
const DIAMS = [2.67, 3, 4, 5, 6, 8];

interface TramoZM { descripcion: string; largo: number; }

@Component({
  selector: 'app-apu-zapata-muro',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './apu-zapata-muro.html',
  styles: [`
    .vbtn { border:1px solid var(--gray-border); background:var(--gray-3); color:var(--gray-muted); border-radius:4px; padding:3px 7px; font-size:11px; cursor:pointer; font-weight:600; }
    .vbtn.sel { background:var(--brand); color:#fff; border-color:var(--brand); }
  `]
})
export class ApuZapataMuro implements OnInit, OnChanges {
  @Input() apuParameters: any;
  @Output() parametersChange = new EventEmitter<any>();

  readonly diams = DIAMS;

  tramos = signal<TramoZM[]>([{ descripcion: 'Tramo principal', largo: 10.0 }]);
  b   = signal(40);
  h   = signal(30);
  fc  = signal(210);
  rec = signal(5);
  desp = signal(5);

  al1 = signal(8); cv1 = signal(2);
  al2 = signal(6); cv2 = signal(2);
  al3 = signal(0); cv3 = signal(0);
  lbarra = signal(6);

  at  = signal(6);
  sep = signal(20);
  lg  = signal(10);

  encMetodo = signal<'madera' | 'tierra' | 'sin'>('madera');

  longTotal = computed(() => this.tramos().reduce((s, t) => s + (t.largo || 0), 0));
  seccion   = computed(() => (this.b() / 100) * (this.h() / 100));
  volNeto   = computed(() => this.longTotal() * this.seccion());
  volPres   = computed(() => this.volNeto() * (1 + this.desp() / 100));

  kgLong1 = computed(() => this.cv1() * (PESO[this.al1()] || 0) * this.longTotal());
  kgLong2 = computed(() => this.cv2() * (PESO[this.al2()] || 0) * this.longTotal());
  kgLong3 = computed(() => this.cv3() * (PESO[this.al3()] || 0) * this.longTotal());

  anchoEf  = computed(() => Math.max(0, (this.b() - 2 * this.rec()) / 100));
  nEst     = computed(() => Math.ceil((this.longTotal() * 100) / Math.max(1, this.sep())) + 1);
  kgTransv = computed(() => this.nEst() * (this.anchoEf() + 2 * (this.lg() / 100)) * (PESO[this.at()] || 0));
  kgTotal  = computed(() => this.kgLong1() + this.kgLong2() + this.kgLong3() + this.kgTransv());

  encofrado = computed(() => {
    const m = this.encMetodo();
    const lt = this.longTotal(), ht = this.h() / 100;
    if (m === 'madera') return 2 * ht * lt;
    if (m === 'tierra') return ht * lt;
    return 0;
  });

  private _firstEmit = false;

  constructor() {
    effect(() => {
      const p = {
        tramos: this.tramos(), b: this.b(), h: this.h(), fc: this.fc(),
        rec: this.rec(), desp: this.desp(),
        al1: this.al1(), cv1: this.cv1(), al2: this.al2(), cv2: this.cv2(),
        al3: this.al3(), cv3: this.cv3(), lbarra: this.lbarra(),
        at: this.at(), sep: this.sep(), lg: this.lg(),
        encMetodo: this.encMetodo(),
        cantidad_calculada: +this.volPres().toFixed(3),
      };
      if (!this._firstEmit) { this._firstEmit = true; return; }
      this.parametersChange.emit(p);
    });
  }

  ngOnInit() { if (this.apuParameters) this._load(); }
  ngOnChanges(c: SimpleChanges) { if (c['apuParameters'] && !c['apuParameters'].firstChange) this._load(); }

  private _load() {
    const p = this.apuParameters; if (!p) return;
    if (p.tramos)    this.tramos.set(p.tramos);
    if (p.b    != null) this.b.set(p.b);
    if (p.h    != null) this.h.set(p.h);
    if (p.fc   != null) this.fc.set(p.fc);
    if (p.rec  != null) this.rec.set(p.rec);
    if (p.desp != null) this.desp.set(p.desp);
    if (p.al1  != null) this.al1.set(p.al1);  if (p.cv1 != null) this.cv1.set(p.cv1);
    if (p.al2  != null) this.al2.set(p.al2);  if (p.cv2 != null) this.cv2.set(p.cv2);
    if (p.al3  != null) this.al3.set(p.al3);  if (p.cv3 != null) this.cv3.set(p.cv3);
    if (p.lbarra != null) this.lbarra.set(p.lbarra);
    if (p.at   != null) this.at.set(p.at);
    if (p.sep  != null) this.sep.set(p.sep);
    if (p.lg   != null) this.lg.set(p.lg);
    if (p.encMetodo) this.encMetodo.set(p.encMetodo);
  }

  addTramo()  { this.tramos.update(t => [...t, { descripcion: 'Tramo', largo: 0 }]); }
  removeTramo(i: number) { this.tramos.update(t => t.filter((_, idx) => idx !== i)); }
  updateTramo(i: number, field: keyof TramoZM, val: any) {
    this.tramos.update(t => t.map((x, idx) => idx === i ? { ...x, [field]: val } : x));
  }

  setDiam(sig: (v?: any) => any, v: number) { (sig as any).set(v); }
  labelDiam(d: number) { return d === 2.67 ? '¼"' : d === 3 ? '3/8"' : d === 4 ? '½"' : d === 5 ? '⅝"' : d === 6 ? '¾"' : '1"'; }
}
