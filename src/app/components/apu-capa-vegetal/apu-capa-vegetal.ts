import {
  Component, Input, Output, EventEmitter,
  OnInit, OnChanges, SimpleChanges,
  signal, computed, effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface Tramo {
  descripcion: string;
  largo: number;
  ancho: number;
}

export interface ZonaIrregular {
  descripcion: string;
  area: number;
}

@Component({
  selector: 'app-apu-capa-vegetal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './apu-capa-vegetal.html',
  styleUrls: ['./apu-capa-vegetal.css'],
})
export class ApuCapaVegetalComponent implements OnInit, OnChanges {
  @Input() apuParameters: any = {};
  @Output() parametersChange = new EventEmitter<any>();

  modoArea         = signal<'dimensiones' | 'irregular'>('dimensiones');
  tramos           = signal<Tramo[]>([]);
  zonasIrr         = signal<ZonaIrregular[]>([]);
  metodoEjec       = signal<'mano_obra' | 'equipo'>('mano_obra');

  profundidad      = signal<number>(0.20);
  esponjamiento    = signal<number>(1.30);
  desperdicio      = signal<number>(5);
  vegetacion       = signal<string>('1.00'); // numeric factor string
  terreno          = signal<string>('1.00'); // numeric factor string
  disposicion      = signal<string>('Acopio en sitio');
  rendimiento      = signal<number>(10);
  peones           = signal<number>(4);
  ayudantesAcarreo = signal<number>(0);

  // Equipo pesado
  equipoSel        = signal<string>('excavadora');
  rendEquipo       = signal<number>(45);
  horasEfectivas   = signal<number>(8);
  operadores       = signal<number>(1);
  ayudantesObra    = signal<number>(2);
  diasAyudantes    = signal<number>(1);
  showTransporte   = signal<boolean>(false);

  readonly EQUIPOS: Record<string, { rend: number; hint: string }> = {
    bulldozer:      { rend: 60, hint: 'Bulldozer D6/D7: 50–80 M3E/hr' },
    motoniveladora: { rend: 40, hint: 'Motoniveladora 140G: 30–55 M3E/hr' },
    minicargador:   { rend: 12, hint: 'Minicargador / Bobcat: 8–18 M3E/hr' },
    excavadora:     { rend: 45, hint: 'Excavadora CAT 320: 35–55 M3E/hr' },
    tractor:        { rend: 35, hint: 'Tractor agrícola: 25–45 M3E/hr' },
    otro:           { rend: 30, hint: 'Ingresa el rendimiento del equipo' },
  };

  equipoHint = computed(() => this.EQUIPOS[this.equipoSel()]?.hint ?? '');

  onEquipoChange(val: string) {
    this.equipoSel.set(val);
    if (this.EQUIPOS[val]) this.rendEquipo.set(this.EQUIPOS[val].rend);
  }

  alertaProfundidad = computed(() => this.profundidad() > 0.30);

  areaTotal = computed(() => {
    if (this.modoArea() === 'irregular') {
      return this.zonasIrr().reduce((s, z) => s + (z.area || 0), 0);
    }
    return this.tramos().reduce((s, t) => s + (t.largo || 0) * (t.ancho || 0), 0);
  });

  volumenBanco         = computed(() => this.areaTotal() * (this.profundidad() || 0));
  volumenEsponjado     = computed(() => this.volumenBanco() * (this.esponjamiento() || 1));
  volumenPresupuestado = computed(() => this.volumenEsponjado() * (1 + (this.desperdicio() || 0) / 100));

  rendEfectivo = computed(() => {
    const vegF = parseFloat(this.vegetacion()) || 1;
    const terF = parseFloat(this.terreno()) || 1;
    return (this.rendimiento() || 0) / (vegF * terF);
  });

  duracionCalc = computed(() => {
    const cap = this.rendEfectivo() * (this.peones() || 0);
    return cap > 0 ? Math.ceil(this.areaTotal() / cap) : 0;
  });

  duracionEquipo = computed(() => {
    const capDia = (this.rendEquipo() || 0) * (this.horasEfectivas() || 0);
    return capDia > 0 ? Math.ceil(this.volumenPresupuestado() / capDia) : 0;
  });

  imp        = signal<number>(5);
  pu         = signal<number>(0);
  totalFinal = computed(() => this.pu() * this.areaTotal() * (1 + this.imp() / 100));

  nombre_presupuesto = computed(() => {
    const e = this.profundidad().toFixed(2);
    return `Extracción de capa vegetal E=${e}m`;
  });

  setPu(e: Event) {
    const v = +(e.target as HTMLInputElement).value;
    if (!isNaN(v)) this.pu.set(v);
  }

  constructor() {
    effect(() => {
      this.parametersChange.emit({
        ...this.apuParameters,
        modoArea: this.modoArea(),
        tramos: this.tramos(),
        zonasIrr: this.zonasIrr(),
        metodoEjec: this.metodoEjec(),
        profundidad: this.profundidad(),
        esponjamiento: this.esponjamiento(),
        desperdicio: this.desperdicio(),
        vegetacion: this.vegetacion(),
        terreno: this.terreno(),
        disposicion: this.disposicion(),
        rendimiento: this.rendimiento(),
        peones: this.peones(),
        ayudantesAcarreo: this.ayudantesAcarreo(),
        equipoSel: this.equipoSel(),
        rendEquipo: this.rendEquipo(),
        horasEfectivas: this.horasEfectivas(),
        operadores: this.operadores(),
        ayudantesObra: this.ayudantesObra(),
        diasAyudantes: this.diasAyudantes(),
        imp: this.imp(),
        pu: this.pu(),
        cantidad_calculada: this.areaTotal(),
        nombre_presupuesto: this.nombre_presupuesto(),
      });
    });
  }

  private _loadFromParams() {
    const p = this.apuParameters;
    if (p?.modoArea)                     this.modoArea.set(p.modoArea);
    if (p?.tramos?.length)               this.tramos.set(p.tramos);
    else this.tramos.set([{ descripcion: 'Zona principal', largo: 0, ancho: 0 }]);
    if (p?.zonasIrr?.length)             this.zonasIrr.set(p.zonasIrr);
    else this.zonasIrr.set([{ descripcion: '', area: 0 }]);
    if (p?.metodoEjec)                   this.metodoEjec.set(p.metodoEjec);
    if (p?.profundidad      !== undefined) this.profundidad.set(p.profundidad);
    if (p?.esponjamiento    !== undefined) this.esponjamiento.set(p.esponjamiento);
    if (p?.desperdicio      !== undefined) this.desperdicio.set(p.desperdicio);
    if (p?.vegetacion)                    this.vegetacion.set(p.vegetacion);
    if (p?.terreno)                       this.terreno.set(p.terreno);
    if (p?.disposicion) {
      const d = p.disposicion;
      const norm = (d === 'acopio' || d === 'transporte' || d === 'reutilizar') ? d
        : d.toLowerCase().includes('transport') ? 'transporte'
        : d.toLowerCase().includes('reutiliz') ? 'reutilizar'
        : 'acopio';
      this.disposicion.set(norm);
    }
    if (p?.rendimiento      !== undefined) this.rendimiento.set(p.rendimiento);
    if (p?.peones           !== undefined) this.peones.set(p.peones);
    if (p?.ayudantesAcarreo !== undefined) this.ayudantesAcarreo.set(p.ayudantesAcarreo);
    if (p?.equipoSel) {
      const e = p.equipoSel;
      const validKeys = Object.keys(this.EQUIPOS);
      const norm = validKeys.includes(e) ? e
        : e.toLowerCase().includes('bulldozer') ? 'bulldozer'
        : e.toLowerCase().includes('motoni') ? 'motoniveladora'
        : e.toLowerCase().includes('minicarg') || e.toLowerCase().includes('bobcat') ? 'minicargador'
        : e.toLowerCase().includes('tractor') ? 'tractor'
        : e.toLowerCase().includes('excavadora') || e.toLowerCase().includes('cat') ? 'excavadora'
        : 'excavadora';
      this.equipoSel.set(norm);
    }
    if (p?.rendEquipo       !== undefined) this.rendEquipo.set(p.rendEquipo);
    if (p?.horasEfectivas   !== undefined) this.horasEfectivas.set(p.horasEfectivas);
    if (p?.operadores       !== undefined) this.operadores.set(p.operadores);
    if (p?.ayudantesObra    !== undefined) this.ayudantesObra.set(p.ayudantesObra);
    if (p?.diasAyudantes    !== undefined) this.diasAyudantes.set(p.diasAyudantes);
    if (p?.imp != null)  this.imp.set(p.imp);
    if (p?.pu  != null)  this.pu.set(p.pu);
  }

  ngOnInit() { this._loadFromParams(); }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['apuParameters'] && !changes['apuParameters'].firstChange) {
      this._loadFromParams();
    }
  }

  addTramo()              { this.tramos.update(t => [...t, { descripcion: '', largo: 0, ancho: 0 }]); }
  removeTramo(i: number)  { this.tramos.update(t => t.filter((_, idx) => idx !== i)); }
  updateTramo(i: number, field: keyof Tramo, value: any) {
    this.tramos.update(t => { const c = [...t]; (c[i] as any)[field] = value; return c; });
  }

  addZonaIrr()              { this.zonasIrr.update(z => [...z, { descripcion: '', area: 0 }]); }
  removeZonaIrr(i: number)  { this.zonasIrr.update(z => z.filter((_, idx) => idx !== i)); }
  updateZonaIrr(i: number, field: keyof ZonaIrregular, value: any) {
    this.zonasIrr.update(z => { const c = [...z]; (c[i] as any)[field] = value; return c; });
  }
}
