import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface TramoRelleno { descripcion: string; largo: number; ancho: number; espesor: number; }
export interface ZonaM2       { descripcion: string; area: number; espesor: number; }

@Component({
  selector: 'app-apu-relleno',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './apu-relleno.html',
  styleUrls: ['./apu-relleno.css'],
})
export class ApuRellenoComponent implements OnInit, OnChanges {
  @Input() apuParameters: any = {};
  @Output() parametersChange = new EventEmitter<any>();

  tipoRelleno = signal<string>('capas'); // capas | libre | selecto
  modoArea    = signal<'dim' | 'm2'>('dim');

  tramos   = signal<TramoRelleno[]>([]);
  zonasM2  = signal<ZonaM2[]>([]);

  tipoMaterial       = signal<string>('propio');
  factorCompactacion = signal<number>(1.20);
  desperdicio        = signal<number>(5);

  espCapas           = signal<number>(0.20);
  equipoCompactacion = signal<string>('manual');
  pasadas            = signal<number>(4);

  metodoEjec       = signal<'mano_obra' | 'equipo'>('mano_obra');
  rendimientoPeon  = signal<number>(6);
  peones           = signal<number>(4);
  ayudantes        = signal<number>(0);
  equipoSel        = signal<string>('minicargador');
  rendEquipo       = signal<number>(30);
  horasEfectivas   = signal<number>(8);
  operadores       = signal<number>(1);
  ayudantesObra    = signal<number>(2);

  readonly EQUIPOS: Record<string, { rend: number; hint: string }> = {
    minicargador:   { rend: 30, hint: 'Minicargador / Bobcat: 20–40 M3E/hr' },
    bulldozer:      { rend: 55, hint: 'Bulldozer D6/D7: 40–70 M3E/hr' },
    motoniveladora: { rend: 40, hint: 'Motoniveladora 140G: 30–55 M3E/hr' },
    otro:           { rend: 25, hint: 'Ingresa el rendimiento del equipo' },
  };

  equipoHint = computed(() => this.EQUIPOS[this.equipoSel()]?.hint ?? '');

  onEquipoChange(val: string) {
    this.equipoSel.set(val);
    if (this.EQUIPOS[val]) this.rendEquipo.set(this.EQUIPOS[val].rend);
  }

  imp = signal<number>(5);
  pu  = signal<number>(0);

  areaTotal = computed(() => {
    if (this.modoArea() === 'm2')
      return this.zonasM2().reduce((s, z) => s + (z.area || 0), 0);
    return this.tramos().reduce((s, t) => s + (t.largo || 0) * (t.ancho || 0), 0);
  });

  volCompactado = computed(() => {
    if (this.modoArea() === 'm2')
      return this.zonasM2().reduce((s, z) => s + (z.area || 0) * (z.espesor || 0), 0);
    return this.tramos().reduce((s, t) => s + (t.largo || 0) * (t.ancho || 0) * (t.espesor || 0), 0);
  });

  volSuelto        = computed(() => this.volCompactado() * (this.factorCompactacion() || 1));
  volPresupuestado = computed(() => this.volSuelto() * (1 + (this.desperdicio() || 0) / 100));

  numCapas = computed(() => {
    const area = this.areaTotal();
    const avgEsp = area > 0 ? this.volCompactado() / area : 0;
    const esp = this.espCapas();
    return esp > 0 ? Math.ceil(avgEsp / esp) : 0;
  });

  duracionCalc = computed(() => {
    if (this.metodoEjec() === 'equipo') {
      const capDia = (this.rendEquipo() || 0) * (this.horasEfectivas() || 0);
      return capDia > 0 ? Math.ceil(this.volPresupuestado() / capDia) : 0;
    }
    const cap = (this.rendimientoPeon() || 0) * (this.peones() || 0);
    return cap > 0 ? Math.ceil(this.volPresupuestado() / cap) : 0;
  });

  totalFinal = computed(() => this.pu() * this.volPresupuestado() * (1 + this.imp() / 100));

  nombre_presupuesto = computed(() => 'Relleno de material');

  setPu(e: Event) {
    const v = +(e.target as HTMLInputElement).value;
    if (!isNaN(v)) this.pu.set(v);
  }

  constructor() {
    effect(() => {
      this.parametersChange.emit({
        ...this.apuParameters,
        tipoRelleno: this.tipoRelleno(), modoArea: this.modoArea(),
        tramos: this.tramos(), zonasM2: this.zonasM2(),
        tipoMaterial: this.tipoMaterial(), factorCompactacion: this.factorCompactacion(),
        desperdicio: this.desperdicio(), espCapas: this.espCapas(),
        equipoCompactacion: this.equipoCompactacion(), pasadas: this.pasadas(),
        metodoEjec: this.metodoEjec(), rendimientoPeon: this.rendimientoPeon(),
        peones: this.peones(), ayudantes: this.ayudantes(),
        equipoSel: this.equipoSel(), rendEquipo: this.rendEquipo(),
        horasEfectivas: this.horasEfectivas(), operadores: this.operadores(),
        ayudantesObra: this.ayudantesObra(),
        imp: this.imp(), pu: this.pu(),
        cantidad_calculada: this.volPresupuestado(),
        nombre_presupuesto: this.nombre_presupuesto(),
      });
    });
  }

  private _load() {
    const p = this.apuParameters;
    if (!p) return;
    if (p.tipoRelleno)               this.tipoRelleno.set(p.tipoRelleno);
    if (p.modoArea)                  this.modoArea.set(p.modoArea);
    if (p.tramos?.length)            this.tramos.set(p.tramos);
    else this.tramos.set([{ descripcion: 'Zona de relleno', largo: 0, ancho: 0, espesor: 0.20 }]);
    if (p.zonasM2?.length)           this.zonasM2.set(p.zonasM2);
    else this.zonasM2.set([{ descripcion: '', area: 0, espesor: 0.20 }]);
    if (p.tipoMaterial)              this.tipoMaterial.set(p.tipoMaterial);
    if (p.factorCompactacion != null) this.factorCompactacion.set(p.factorCompactacion);
    if (p.desperdicio        != null) this.desperdicio.set(p.desperdicio);
    if (p.espCapas           != null) this.espCapas.set(p.espCapas);
    if (p.equipoCompactacion)        this.equipoCompactacion.set(p.equipoCompactacion);
    if (p.pasadas            != null) this.pasadas.set(p.pasadas);
    if (p.metodoEjec)                this.metodoEjec.set(p.metodoEjec);
    if (p.rendimientoPeon    != null) this.rendimientoPeon.set(p.rendimientoPeon);
    if (p.peones             != null) this.peones.set(p.peones);
    if (p.ayudantes          != null) this.ayudantes.set(p.ayudantes);
    if (p.equipoSel)                  this.equipoSel.set(p.equipoSel);
    if (p.rendEquipo         != null) this.rendEquipo.set(p.rendEquipo);
    if (p.horasEfectivas     != null) this.horasEfectivas.set(p.horasEfectivas);
    if (p.operadores         != null) this.operadores.set(p.operadores);
    if (p.ayudantesObra      != null) this.ayudantesObra.set(p.ayudantesObra);
    if (p.imp != null) this.imp.set(p.imp);
    if (p.pu  != null) this.pu.set(p.pu);
  }

  ngOnInit()    { this._load(); }
  ngOnChanges(changes: SimpleChanges) {
    if (changes['apuParameters'] && !changes['apuParameters'].firstChange) this._load();
  }

  // Tramos dim
  addTramo()              { this.tramos.update(t => [...t, { descripcion: '', largo: 0, ancho: 0, espesor: 0.20 }]); }
  removeTramo(i: number)  { this.tramos.update(t => t.filter((_, idx) => idx !== i)); }
  updateTramo(i: number, field: keyof TramoRelleno, val: any) {
    this.tramos.update(t => { const c = [...t]; (c[i] as any)[field] = val; return c; });
  }

  // Zonas m2
  addZona()              { this.zonasM2.update(z => [...z, { descripcion: '', area: 0, espesor: 0.20 }]); }
  removeZona(i: number)  { this.zonasM2.update(z => z.filter((_, idx) => idx !== i)); }
  updateZona(i: number, field: keyof ZonaM2, val: any) {
    this.zonasM2.update(z => { const c = [...z]; (c[i] as any)[field] = val; return c; });
  }
}
