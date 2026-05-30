import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface TramoSimple { descripcion: string; longitud: number; }

@Component({
  selector: 'app-apu-charrancha',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './apu-charrancha.html',
  styleUrls: ['./apu-charrancha.css'],
})
export class ApuCharranchaComponent implements OnInit, OnChanges {
  @Input() apuParameters: any = {};
  @Output() parametersChange = new EventEmitter<any>();

  tipoReplanteo = signal<string>('simple'); // simple | ejes | estacion
  modoSimple    = signal<'corrida' | 'tramos'>('corrida');

  unidMadera = signal<string>('pie_metro'); // pie_metro | metro_pie | metro | pie
  unidCobro  = signal<string>('pa');        // pa | m2 | ml
  imp        = signal<number>(5);

  // Dimensiones
  longFrontal    = signal<number>(12);
  longLateral    = signal<number>(20);
  areaVivienda   = signal<number>(0);
  horasEfectivas = signal<number>(8);

  // Charrancha params
  resguardo   = signal<number>(0.60);
  distEstacas = signal<number>(1.50);
  longMadera  = signal<number>(12);

  // Tramos (simple/tramos mode)
  tramosSimple = signal<TramoSimple[]>([]);

  // Ejes y columnas
  nEjesX      = signal<number>(4);
  nEjesY      = signal<number>(3);
  instrumento = signal<string>('nivel');

  // Estación total
  nPuntos        = signal<number>(20);
  rendimientoPts = signal<number>(8);

  // Cuadrilla avanzada
  showAvanzado = signal<boolean>(false);
  moCuadrilla  = signal<number>(1);
  topografo    = signal<number>(0);
  cadenero     = signal<number>(0);
  ayudante     = signal<number>(0);

  // Precio
  pu = signal<number>(0);

  setPu(e: Event) {
    const v = +(e.target as HTMLInputElement).value;
    if (!isNaN(v)) this.pu.set(v);
  }

  // ── Computeds ─────────────────────────────────────────────────────────────

  perimetroCharrancha = computed(() => {
    const tipo = this.tipoReplanteo();
    const res  = this.resguardo();
    if (tipo === 'simple' && this.modoSimple() === 'tramos')
      return this.tramosSimple().reduce((s, t) => s + (t.longitud || 0), 0);
    if (tipo === 'estacion')
      return 2 * (this.longFrontal() + this.longLateral());
    return 2 * (this.longFrontal() + this.longLateral()) + 8 * res;
  });

  longtotalTramos = computed(() => this.tramosSimple().reduce((s, t) => s + (t.longitud || 0), 0));

  nIntersecciones = computed(() => this.nEjesX() * this.nEjesY());

  cantidad = computed(() => {
    const c = this.unidCobro();
    if (c === 'm2') return this.areaVivienda();
    if (c === 'ml') return this.perimetroCharrancha();
    return 1.0;
  });

  unidDisplay = computed(() => {
    const c = this.unidCobro();
    if (c === 'm2') return 'M²';
    if (c === 'ml') return 'ML';
    return 'P.A.';
  });

  madera = computed((): number | null => {
    if (this.tipoReplanteo() === 'estacion') return null;
    const perim    = this.perimetroCharrancha();
    const factor   = 1 + this.imp() / 100;
    const lm       = this.longMadera() || 1;
    const isPie    = this.unidMadera().startsWith('pie');
    const lmMetros = isPie ? lm * 0.3048 : lm;
    const piezas   = Math.ceil(perim / lmMetros * factor);
    return isPie ? piezas * lm : piezas * lm;
  });

  maderaLabel = computed(() => this.unidMadera().startsWith('pie') ? 'pies' : 'metros');

  estacas = computed(() => {
    const factor = 1 + this.imp() / 100;
    const tipo   = this.tipoReplanteo();
    if (tipo === 'estacion') return Math.round(this.nPuntos() * 2 * factor);
    if (tipo === 'ejes')     return Math.round((this.nEjesX() + this.nEjesY()) * 2 * factor);
    const dist = this.distEstacas() || 1;
    return Math.ceil(this.perimetroCharrancha() / dist * factor) * 2;
  });

  diasTotal = computed(() => {
    if (this.tipoReplanteo() !== 'estacion') return 0;
    const rend = this.rendimientoPts();
    const hrs  = this.horasEfectivas();
    return rend > 0 && hrs > 0 ? Math.ceil(this.nPuntos() / (rend * hrs)) : 0;
  });

  nombreDesc = computed(() => {
    const tipo = this.tipoReplanteo();
    if (tipo === 'simple')   return 'Charrancha y replanteo simple';
    if (tipo === 'ejes')     return 'Charrancha y replanteo de ejes y columnas';
    return 'Charrancha y replanteo con estación total';
  });

  nombre_presupuesto = computed(() => this.nombreDesc());

  totalFinal = computed(() => this.pu() > 0 ? this.pu() * this.cantidad() : 0);

  constructor() {
    effect(() => {
      this.parametersChange.emit({
        ...this.apuParameters,
        tipoReplanteo: this.tipoReplanteo(), modoSimple: this.modoSimple(),
        unidMadera: this.unidMadera(), unidCobro: this.unidCobro(), imp: this.imp(),
        longFrontal: this.longFrontal(), longLateral: this.longLateral(),
        areaVivienda: this.areaVivienda(), horasEfectivas: this.horasEfectivas(),
        resguardo: this.resguardo(), distEstacas: this.distEstacas(), longMadera: this.longMadera(),
        tramosSimple: this.tramosSimple(),
        nEjesX: this.nEjesX(), nEjesY: this.nEjesY(), instrumento: this.instrumento(),
        nPuntos: this.nPuntos(), rendimientoPts: this.rendimientoPts(),
        showAvanzado: this.showAvanzado(), moCuadrilla: this.moCuadrilla(),
        topografo: this.topografo(), cadenero: this.cadenero(), ayudante: this.ayudante(),
        pu: this.pu(),
        cantidad_calculada: this.cantidad(),
        nombre_presupuesto: this.nombre_presupuesto(),
      });
    });
  }

  private _load() {
    const p = this.apuParameters;
    if (!p) return;
    if (p.tipoReplanteo)        this.tipoReplanteo.set(p.tipoReplanteo);
    if (p.modoSimple)           this.modoSimple.set(p.modoSimple);
    if (p.unidMadera)           this.unidMadera.set(p.unidMadera);
    if (p.unidCobro)            this.unidCobro.set(p.unidCobro);
    if (p.imp            != null) this.imp.set(p.imp);
    if (p.longFrontal    != null) this.longFrontal.set(p.longFrontal);
    if (p.longLateral    != null) this.longLateral.set(p.longLateral);
    if (p.areaVivienda   != null) this.areaVivienda.set(p.areaVivienda);
    if (p.horasEfectivas != null) this.horasEfectivas.set(p.horasEfectivas);
    if (p.resguardo      != null) this.resguardo.set(p.resguardo);
    if (p.distEstacas    != null) this.distEstacas.set(p.distEstacas);
    if (p.longMadera     != null) this.longMadera.set(p.longMadera);
    if (p.tramosSimple?.length)   this.tramosSimple.set(p.tramosSimple);
    else this.tramosSimple.set([{ descripcion: 'Tramo A', longitud: 0 }]);
    if (p.nEjesX         != null) this.nEjesX.set(p.nEjesX);
    if (p.nEjesY         != null) this.nEjesY.set(p.nEjesY);
    if (p.instrumento)            this.instrumento.set(p.instrumento);
    if (p.nPuntos        != null) this.nPuntos.set(p.nPuntos);
    if (p.rendimientoPts != null) this.rendimientoPts.set(p.rendimientoPts);
    if (p.showAvanzado   != null) this.showAvanzado.set(p.showAvanzado);
    if (p.moCuadrilla    != null) this.moCuadrilla.set(p.moCuadrilla);
    if (p.topografo      != null) this.topografo.set(p.topografo);
    if (p.cadenero       != null) this.cadenero.set(p.cadenero);
    if (p.ayudante       != null) this.ayudante.set(p.ayudante);
    if (p.pu             != null) this.pu.set(p.pu);
  }

  ngOnInit()    { this._load(); }
  ngOnChanges(changes: SimpleChanges) {
    if (changes['apuParameters'] && !changes['apuParameters'].firstChange) this._load();
  }

  // Tramos simple
  addTramoSimple()              { this.tramosSimple.update(t => [...t, { descripcion: '', longitud: 0 }]); }
  removeTramoSimple(i: number)  { this.tramosSimple.update(t => t.filter((_, idx) => idx !== i)); }
  updateTramoSimple(i: number, field: keyof TramoSimple, val: any) {
    this.tramosSimple.update(t => { const c = [...t]; (c[i] as any)[field] = val; return c; });
  }
}
