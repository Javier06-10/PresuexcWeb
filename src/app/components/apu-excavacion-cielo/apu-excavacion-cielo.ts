import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface TramoArea {
  descripcion: string;
  largo: number;
  ancho: number;
}

export interface ZonaIrregular {
  descripcion: string;
  area: number;
}

@Component({
  selector: 'app-apu-excavacion-cielo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './apu-excavacion-cielo.html',
  styleUrls: ['./apu-excavacion-cielo.css'],
})
export class ApuExcavacionCieloComponent implements OnInit, OnChanges {
  @Input() apuParameters: any = {};
  @Output() parametersChange = new EventEmitter<any>();

  // Area input mode
  modoArea  = signal<'dimensiones' | 'irregular'>('dimensiones');
  tramos    = signal<TramoArea[]>([]);
  zonasIrr  = signal<ZonaIrregular[]>([]);

  // Right panel — Profundidad, suelo y factores
  profundidad        = signal<number>(1.50);
  esponjamiento      = signal<number>(1.25);
  desperdicio        = signal<number>(5);
  clasificacionSuelo = signal<string>('Blando — tierra suelta');
  talud              = signal<string>('Sin talud (vertical)');
  terreno            = signal<string>('Plano (<5%)');
  disposicion        = signal<string>('Acopio en sitio');
  nivelFreatico      = signal<string>('No presente');

  // Método de ejecución
  metodoEjec       = signal<'mano_obra' | 'equipo'>('mano_obra');
  rendimiento      = signal<number>(25);
  peones           = signal<number>(2);
  ayudantesAcarreo = signal<number>(0);
  equipoSel        = signal<string>('excavadora');
  rendEquipo       = signal<number>(45);
  horasEfectivas   = signal<number>(8);
  operadores       = signal<number>(1);
  ayudantesObra    = signal<number>(2);
  diasAyudantes    = signal<number>(1);
  showTransporte   = signal<boolean>(false);

  // Agotamiento de agua (nivel freático)
  equipoBombeo     = signal<string>('centrifuga');
  capacidadGPM     = signal<number>(50);
  hrsBombeo        = signal<number>(8);
  diasBombeo       = signal<number>(0);

  readonly EQUIPOS: Record<string, { rend: number; hint: string }> = {
    excavadora:      { rend: 45, hint: 'Excavadora CAT 320: 35–55 M3E/hr' },
    retroexcavadora: { rend: 25, hint: 'Retroexcavadora JD 310: 18–35 M3E/hr' },
    minicargador:    { rend: 10, hint: 'Minicargador: 6–15 M3E/hr' },
    bulldozer:       { rend: 55, hint: 'Bulldozer D6/D7: 40–70 M3E/hr' },
    otro:            { rend: 30, hint: 'Ingresa el rendimiento del equipo' },
  };

  equipoHint = computed(() => this.EQUIPOS[this.equipoSel()]?.hint ?? '');

  onEquipoChange(val: string) {
    this.equipoSel.set(val);
    if (this.EQUIPOS[val]) this.rendEquipo.set(this.EQUIPOS[val].rend);
  }

  areaTotal = computed(() => {
    if (this.modoArea() === 'irregular') {
      return this.zonasIrr().reduce((s, z) => s + (z.area || 0), 0);
    }
    return this.tramos().reduce((s, t) => s + (t.largo || 0) * (t.ancho || 0), 0);
  });

  taludFactor = computed(() => {
    const t = this.talud();
    if (t === '1:1 (pronunciado)') return 0.20;
    if (t === '1:2 (moderado)')    return 0.12;
    if (t === '1:4 (suave)')       return 0.06;
    return 0;
  });

  volBanco         = computed(() => this.areaTotal() * (this.profundidad() || 0));
  volConTalud      = computed(() => this.volBanco() * (1 + this.taludFactor()));
  volEsponjado     = computed(() => this.volConTalud() * (this.esponjamiento() || 1));
  volPresupuestado = computed(() => this.volEsponjado() * (1 + (this.desperdicio() || 0) / 100));

  duracionCalc = computed(() => {
    const cap = (this.rendimiento() || 0) * (this.peones() || 0);
    return cap > 0 ? Math.ceil(this.volPresupuestado() / cap) : 0;
  });

  duracionEquipo = computed(() => {
    const capDia = (this.rendEquipo() || 0) * (this.horasEfectivas() || 0);
    return capDia > 0 ? Math.ceil(this.volPresupuestado() / capDia) : 0;
  });

  imp        = signal<number>(5);
  pu         = signal<number>(0);
  totalFinal = computed(() => this.pu() * this.volPresupuestado() * (1 + this.imp() / 100));

  nombre_presupuesto = computed(() => `Excavación a cielo abierto H=${this.profundidad().toFixed(2)}m`);

  setPu(e: Event) {
    const v = +(e.target as HTMLInputElement).value;
    if (!isNaN(v)) this.pu.set(v);
  }

  constructor() {
    effect(() => {
      this.parametersChange.emit({
        ...this.apuParameters,
        modoArea: this.modoArea(), tramos: this.tramos(), zonasIrr: this.zonasIrr(),
        profundidad: this.profundidad(), esponjamiento: this.esponjamiento(), desperdicio: this.desperdicio(),
        clasificacionSuelo: this.clasificacionSuelo(), talud: this.talud(),
        terreno: this.terreno(), disposicion: this.disposicion(), nivelFreatico: this.nivelFreatico(),
        metodoEjec: this.metodoEjec(),
        rendimiento: this.rendimiento(), peones: this.peones(), ayudantesAcarreo: this.ayudantesAcarreo(),
        equipoSel: this.equipoSel(), rendEquipo: this.rendEquipo(), horasEfectivas: this.horasEfectivas(),
        operadores: this.operadores(), ayudantesObra: this.ayudantesObra(), diasAyudantes: this.diasAyudantes(),
        equipoBombeo: this.equipoBombeo(), capacidadGPM: this.capacidadGPM(),
        hrsBombeo: this.hrsBombeo(), diasBombeo: this.diasBombeo(),
        imp: this.imp(), pu: this.pu(),
        cantidad_calculada: this.volPresupuestado(),
        nombre_presupuesto: this.nombre_presupuesto(),
      });
    });
  }

  private _loadFromParams() {
    const p = this.apuParameters;
    if (p?.modoArea)                     this.modoArea.set(p.modoArea);
    if (p?.tramos?.length)               this.tramos.set(p.tramos);
    else this.tramos.set([{ descripcion: 'Sector A', largo: 0, ancho: 0 }]);
    if (p?.zonasIrr?.length)             this.zonasIrr.set(p.zonasIrr);
    else this.zonasIrr.set([{ descripcion: '', area: 0 }]);
    if (p?.profundidad        != null)   this.profundidad.set(p.profundidad);
    if (p?.esponjamiento      != null)   this.esponjamiento.set(p.esponjamiento);
    if (p?.desperdicio        != null)   this.desperdicio.set(p.desperdicio);
    if (p?.clasificacionSuelo)           this.clasificacionSuelo.set(p.clasificacionSuelo);
    if (p?.talud)                        this.talud.set(p.talud);
    if (p?.terreno)                      this.terreno.set(p.terreno);
    if (p?.disposicion)                  this.disposicion.set(p.disposicion);
    if (p?.nivelFreatico) {
      const nf = p.nivelFreatico;
      this.nivelFreatico.set((nf === 'si' || nf === 'no') ? nf : (nf === 'No presente' ? 'no' : 'si'));
    }
    if (p?.metodoEjec)                   this.metodoEjec.set(p.metodoEjec);
    if (p?.rendimiento        != null)   this.rendimiento.set(p.rendimiento);
    if (p?.peones             != null)   this.peones.set(p.peones);
    if (p?.ayudantesAcarreo   != null)   this.ayudantesAcarreo.set(p.ayudantesAcarreo);
    if (p?.equipoSel) {
      const e = p.equipoSel;
      const validKeys = Object.keys(this.EQUIPOS);
      const norm = validKeys.includes(e) ? e
        : e.toLowerCase().includes('retro') ? 'retroexcavadora'
        : e.toLowerCase().includes('minicarg') || e.toLowerCase().includes('bobcat') ? 'minicargador'
        : e.toLowerCase().includes('bulldozer') ? 'bulldozer'
        : e.toLowerCase().includes('excavadora') || e.toLowerCase().includes('cat') ? 'excavadora'
        : 'excavadora';
      this.equipoSel.set(norm);
    }
    if (p?.rendEquipo         != null)   this.rendEquipo.set(p.rendEquipo);
    if (p?.horasEfectivas     != null)   this.horasEfectivas.set(p.horasEfectivas);
    if (p?.operadores         != null)   this.operadores.set(p.operadores);
    if (p?.ayudantesObra      != null)   this.ayudantesObra.set(p.ayudantesObra);
    if (p?.diasAyudantes      != null)   this.diasAyudantes.set(p.diasAyudantes);
    if (p?.equipoBombeo)                 this.equipoBombeo.set(p.equipoBombeo);
    if (p?.capacidadGPM       != null)   this.capacidadGPM.set(p.capacidadGPM);
    if (p?.hrsBombeo          != null)   this.hrsBombeo.set(p.hrsBombeo);
    if (p?.diasBombeo         != null)   this.diasBombeo.set(p.diasBombeo);
    if (p?.imp != null)                  this.imp.set(p.imp);
    if (p?.pu  != null)                  this.pu.set(p.pu);
  }

  ngOnInit() { this._loadFromParams(); }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['apuParameters'] && !changes['apuParameters'].firstChange) {
      this._loadFromParams();
    }
  }

  addTramo()              { this.tramos.update(t => [...t, { descripcion: '', largo: 0, ancho: 0 }]); }
  removeTramo(i: number)  { this.tramos.update(t => t.filter((_, idx) => idx !== i)); }
  updateTramo(i: number, field: keyof TramoArea, val: any) {
    this.tramos.update(t => { const c = [...t]; (c[i] as any)[field] = val; return c; });
  }

  addZonaIrr()              { this.zonasIrr.update(z => [...z, { descripcion: '', area: 0 }]); }
  removeZonaIrr(i: number)  { this.zonasIrr.update(z => z.filter((_, idx) => idx !== i)); }
  updateZonaIrr(i: number, field: keyof ZonaIrregular, val: any) {
    this.zonasIrr.update(z => { const c = [...z]; (c[i] as any)[field] = val; return c; });
  }
}
