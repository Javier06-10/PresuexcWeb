import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface TramoCorrida  { descripcion: string; largo: number; ancho: number; profundidad: number; }
export interface ZapataRect    { descripcion: string; cantidad: number; largo: number; ancho: number; profundidad: number; }
export interface ZapataCirc    { descripcion: string; cantidad: number; diametro: number; profundidad: number; }
export interface PlateaRect    { descripcion: string; largo: number; ancho: number; profundidad: number; }
export interface PlateaCirc    { descripcion: string; diametro: number; profundidad: number; }

@Component({
  selector: 'app-apu-excavacion-cimientos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './apu-excavacion-cimientos.html',
  styleUrls: ['./apu-excavacion-cimientos.css'],
})
export class ApuExcavacionCimientosComponent implements OnInit, OnChanges {
  @Input() apuParameters: any = {};
  @Output() parametersChange = new EventEmitter<any>();

  tipoExcavacion = signal<string>('corrida'); // corrida | rect | circ | platea | platea-circ

  tramosCorrida = signal<TramoCorrida[]>([]);
  zapatRects    = signal<ZapataRect[]>([]);
  zapatCircs    = signal<ZapataCirc[]>([]);
  plateaRects   = signal<PlateaRect[]>([]);
  plateaCircs   = signal<PlateaCirc[]>([]);

  clasificacionSuelo = signal<string>('Blando — tierra suelta');
  disposicion        = signal<string>('acopio');
  nivelFreatico      = signal<string>('no');

  esponjamiento = signal<number>(1.25);
  desperdicio   = signal<number>(5);

  metodoEjec       = signal<'mano_obra' | 'equipo'>('mano_obra');
  modoCobro        = signal<string>('m3'); // hora | m3
  rendimientoPeon  = signal<number>(4);
  peones           = signal<number>(4);
  ayudantesAcarreo = signal<number>(1);
  equipoSel        = signal<string>('retroexcavadora');
  rendEquipo       = signal<number>(25);
  horasEfectivas   = signal<number>(8);
  operadores       = signal<number>(1);
  ayudantesObra    = signal<number>(2);
  showTransporte   = signal<boolean>(false);

  readonly EQUIPOS: Record<string, { rend: number; hint: string }> = {
    retroexcavadora: { rend: 25, hint: 'Retroexcavadora JD 310: 18–35 M3E/hr' },
    excavadora:      { rend: 45, hint: 'Excavadora CAT 320: 35–55 M3E/hr' },
    minicargador:    { rend: 10, hint: 'Minicargador / Bobcat: 6–15 M3E/hr' },
    otro:            { rend: 20, hint: 'Ingresa el rendimiento del equipo' },
  };

  equipoHint = computed(() => this.EQUIPOS[this.equipoSel()]?.hint ?? '');

  onEquipoChange(val: string) {
    this.equipoSel.set(val);
    if (this.EQUIPOS[val]) this.rendEquipo.set(this.EQUIPOS[val].rend);
  }

  imp = signal<number>(5);
  pu  = signal<number>(0);

  showAvanzado = signal<boolean>(false);

  volBanco = computed(() => {
    const tipo = this.tipoExcavacion();
    if (tipo === 'corrida')
      return this.tramosCorrida().reduce((s, t) => s + (t.largo||0)*(t.ancho||0)*(t.profundidad||0), 0);
    if (tipo === 'rect')
      return this.zapatRects().reduce((s, z) => s + (z.cantidad||0)*(z.largo||0)*(z.ancho||0)*(z.profundidad||0), 0);
    if (tipo === 'circ')
      return this.zapatCircs().reduce((s, z) => s + (z.cantidad||0)*Math.PI*Math.pow((z.diametro||0)/2,2)*(z.profundidad||0), 0);
    if (tipo === 'platea')
      return this.plateaRects().reduce((s, p) => s + (p.largo||0)*(p.ancho||0)*(p.profundidad||0), 0);
    if (tipo === 'platea-circ')
      return this.plateaCircs().reduce((s, p) => s + Math.PI*Math.pow((p.diametro||0)/2,2)*(p.profundidad||0), 0);
    return 0;
  });

  volEsponjado     = computed(() => this.volBanco() * (this.esponjamiento() || 1));
  volPresupuestado = computed(() => this.volEsponjado() * (1 + (this.desperdicio() || 0) / 100));

  duracionCalc = computed(() => {
    if (this.metodoEjec() === 'equipo') {
      const capDia = (this.rendEquipo() || 0) * (this.horasEfectivas() || 0);
      return capDia > 0 ? Math.ceil(this.volPresupuestado() / capDia) : 0;
    }
    const cap = (this.rendimientoPeon() || 0) * (this.peones() || 0);
    return cap > 0 ? Math.ceil(this.volPresupuestado() / cap) : 0;
  });

  totalFinal = computed(() => this.pu() * this.volPresupuestado() * (1 + this.imp() / 100));

  nombre_presupuesto = computed(() => 'Excavación de cimientos');

  setPu(e: Event) {
    const v = +(e.target as HTMLInputElement).value;
    if (!isNaN(v)) this.pu.set(v);
  }

  constructor() {
    effect(() => {
      this.parametersChange.emit({
        ...this.apuParameters,
        tipoExcavacion: this.tipoExcavacion(),
        tramosCorrida: this.tramosCorrida(), zapatRects: this.zapatRects(),
        zapatCircs: this.zapatCircs(), plateaRects: this.plateaRects(), plateaCircs: this.plateaCircs(),
        clasificacionSuelo: this.clasificacionSuelo(), disposicion: this.disposicion(), nivelFreatico: this.nivelFreatico(),
        esponjamiento: this.esponjamiento(), desperdicio: this.desperdicio(),
        metodoEjec: this.metodoEjec(), modoCobro: this.modoCobro(), rendimientoPeon: this.rendimientoPeon(),
        peones: this.peones(), ayudantesAcarreo: this.ayudantesAcarreo(),
        equipoSel: this.equipoSel(), rendEquipo: this.rendEquipo(),
        horasEfectivas: this.horasEfectivas(), operadores: this.operadores(), ayudantesObra: this.ayudantesObra(),
        imp: this.imp(), pu: this.pu(),
        cantidad_calculada: this.volPresupuestado(),
        nombre_presupuesto: this.nombre_presupuesto(),
      });
    });
  }

  private _load() {
    const p = this.apuParameters;
    if (!p) return;
    if (p.tipoExcavacion) this.tipoExcavacion.set(p.tipoExcavacion);
    if (p.tramosCorrida?.length) this.tramosCorrida.set(p.tramosCorrida);
    else this.tramosCorrida.set([{ descripcion: 'Eje A', largo: 0, ancho: 0.60, profundidad: 0.80 }]);
    if (p.zapatRects?.length) this.zapatRects.set(p.zapatRects);
    else this.zapatRects.set([{ descripcion: '', cantidad: 1, largo: 0, ancho: 0, profundidad: 0.80 }]);
    if (p.zapatCircs?.length) this.zapatCircs.set(p.zapatCircs);
    else this.zapatCircs.set([{ descripcion: '', cantidad: 1, diametro: 0, profundidad: 0.80 }]);
    if (p.plateaRects?.length) this.plateaRects.set(p.plateaRects);
    else this.plateaRects.set([{ descripcion: '', largo: 0, ancho: 0, profundidad: 0.40 }]);
    if (p.plateaCircs?.length) this.plateaCircs.set(p.plateaCircs);
    else this.plateaCircs.set([{ descripcion: '', diametro: 0, profundidad: 0.40 }]);
    if (p.clasificacionSuelo)      this.clasificacionSuelo.set(p.clasificacionSuelo);
    if (p.disposicion)             this.disposicion.set(p.disposicion);
    if (p.nivelFreatico)           this.nivelFreatico.set(p.nivelFreatico);
    if (p.esponjamiento  != null)  this.esponjamiento.set(p.esponjamiento);
    if (p.desperdicio    != null)  this.desperdicio.set(p.desperdicio);
    if (p.metodoEjec)              this.metodoEjec.set(p.metodoEjec);
    if (p.modoCobro)               this.modoCobro.set(p.modoCobro);
    if (p.rendimientoPeon != null) this.rendimientoPeon.set(p.rendimientoPeon);
    if (p.peones         != null)  this.peones.set(p.peones);
    if (p.ayudantesAcarreo != null) this.ayudantesAcarreo.set(p.ayudantesAcarreo);
    if (p.equipoSel) {
      const e = p.equipoSel;
      const validKeys = Object.keys(this.EQUIPOS);
      const norm = validKeys.includes(e) ? e
        : e.toLowerCase().includes('retro') ? 'retroexcavadora'
        : e.toLowerCase().includes('minicarg') || e.toLowerCase().includes('bobcat') ? 'minicargador'
        : e.toLowerCase().includes('excavadora') || e.toLowerCase().includes('cat') ? 'excavadora'
        : 'retroexcavadora';
      this.equipoSel.set(norm);
    }
    if (p.rendEquipo     != null)  this.rendEquipo.set(p.rendEquipo);
    if (p.horasEfectivas != null)  this.horasEfectivas.set(p.horasEfectivas);
    if (p.operadores     != null)  this.operadores.set(p.operadores);
    if (p.ayudantesObra  != null)  this.ayudantesObra.set(p.ayudantesObra);
    if (p.imp != null) this.imp.set(p.imp);
    if (p.pu  != null) this.pu.set(p.pu);
  }

  ngOnInit() { this._load(); }
  ngOnChanges(changes: SimpleChanges) {
    if (changes['apuParameters'] && !changes['apuParameters'].firstChange) this._load();
  }

  // Corrida
  addTramoCorrida()              { this.tramosCorrida.update(t => [...t, { descripcion: '', largo: 0, ancho: 0.60, profundidad: 0.80 }]); }
  removeTramoCorrida(i: number)  { this.tramosCorrida.update(t => t.filter((_, idx) => idx !== i)); }
  updateTramoCorrida(i: number, field: keyof TramoCorrida, val: any) {
    this.tramosCorrida.update(t => { const c = [...t]; (c[i] as any)[field] = val; return c; });
  }
  longtotalCorrida = computed(() => this.tramosCorrida().reduce((s, t) => s + (t.largo || 0), 0));

  // Rect
  addZapataRect()              { this.zapatRects.update(z => [...z, { descripcion: '', cantidad: 1, largo: 0, ancho: 0, profundidad: 0.80 }]); }
  removeZapataRect(i: number)  { this.zapatRects.update(z => z.filter((_, idx) => idx !== i)); }
  updateZapataRect(i: number, field: keyof ZapataRect, val: any) {
    this.zapatRects.update(z => { const c = [...z]; (c[i] as any)[field] = val; return c; });
  }

  // Circ
  addZapataCirc()              { this.zapatCircs.update(z => [...z, { descripcion: '', cantidad: 1, diametro: 0, profundidad: 0.80 }]); }
  removeZapataCirc(i: number)  { this.zapatCircs.update(z => z.filter((_, idx) => idx !== i)); }
  updateZapataCirc(i: number, field: keyof ZapataCirc, val: any) {
    this.zapatCircs.update(z => { const c = [...z]; (c[i] as any)[field] = val; return c; });
  }

  // Platea rect
  addPlateaRect()              { this.plateaRects.update(p => [...p, { descripcion: '', largo: 0, ancho: 0, profundidad: 0.40 }]); }
  removePlateaRect(i: number)  { this.plateaRects.update(p => p.filter((_, idx) => idx !== i)); }
  updatePlateaRect(i: number, field: keyof PlateaRect, val: any) {
    this.plateaRects.update(p => { const c = [...p]; (c[i] as any)[field] = val; return c; });
  }

  // Platea circ
  addPlateaCirc()              { this.plateaCircs.update(p => [...p, { descripcion: '', diametro: 0, profundidad: 0.40 }]); }
  removePlateaCirc(i: number)  { this.plateaCircs.update(p => p.filter((_, idx) => idx !== i)); }
  updatePlateaCirc(i: number, field: keyof PlateaCirc, val: any) {
    this.plateaCircs.update(p => { const c = [...p]; (c[i] as any)[field] = val; return c; });
  }
}
