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

  tramos        = signal<Tramo[]>([]);
  profundidad   = signal<number>(0.2);
  esponjamiento = signal<number>(1.3);
  desperdicio   = signal<number>(5);
  vegetacion    = signal<string>('Pasto / hierba');
  terreno       = signal<string>('Plano (<5%)');
  disposicion   = signal<string>('Acopio en sitio');
  rendimiento   = signal<number>(10);
  peones        = signal<number>(4);
  ayudantes     = signal<number>(0);
  duracion      = signal<number>(0);

  areaTotal = computed(() =>
    this.tramos().reduce((acc, t) => acc + (t.largo || 0) * (t.ancho || 0), 0)
  );
  volumenBanco = computed(() => this.areaTotal() * (this.profundidad() || 0));
  volumenEsponjado = computed(() => this.volumenBanco() * (this.esponjamiento() || 1));
  volumenPresupuestado = computed(() => this.volumenEsponjado() * (1 + (this.desperdicio() || 0) / 100));
  duracionCalc = computed(() => {
    const r = this.rendimiento(); return r ? Math.ceil(this.volumenPresupuestado() / r) : 0;
  });

  constructor() {
    effect(() => {
      this.parametersChange.emit({
        ...this.apuParameters,
        tramos: this.tramos(),
        profundidad: this.profundidad(),
        esponjamiento: this.esponjamiento(),
        desperdicio: this.desperdicio(),
        vegetacion: this.vegetacion(),
        terreno: this.terreno(),
        disposicion: this.disposicion(),
        rendimiento: this.rendimiento(),
        peones: this.peones(),
        ayudantes: this.ayudantes(),
        duracion: this.duracion(),
        cantidad_calculada: this.volumenPresupuestado(),
      });
    });
  }

  private _loadFromParams() {
    const p = this.apuParameters;
    if (p?.tramos?.length) this.tramos.set(p.tramos);
    else this.tramos.set([{ descripcion: 'Zona principal', largo: 0, ancho: 0 }]);
    if (p?.profundidad   !== undefined) this.profundidad.set(p.profundidad);
    if (p?.esponjamiento !== undefined) this.esponjamiento.set(p.esponjamiento);
    if (p?.desperdicio   !== undefined) this.desperdicio.set(p.desperdicio);
    if (p?.vegetacion)   this.vegetacion.set(p.vegetacion);
    if (p?.terreno)      this.terreno.set(p.terreno);
    if (p?.disposicion)  this.disposicion.set(p.disposicion);
    if (p?.rendimiento   !== undefined) this.rendimiento.set(p.rendimiento);
    if (p?.peones        !== undefined) this.peones.set(p.peones);
    if (p?.ayudantes     !== undefined) this.ayudantes.set(p.ayudantes);
    if (p?.duracion      !== undefined) this.duracion.set(p.duracion);
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
}
