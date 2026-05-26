import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface TramoExcavacion {
  descripcion: string;
  largo: number;
  ancho: number;
  profundidad: number;
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

  tramos        = signal<TramoExcavacion[]>([]);
  tipoSuelo     = signal<string>('Suelo natural suelto');
  esponjamiento = signal<number>(1.25);
  desperdicio   = signal<number>(5);
  pendiente     = signal<string>('Talud 1:1 (45°)');
  disposicion   = signal<string>('Desalojo al perímetro');
  rendimiento   = signal<number>(25);
  peones        = signal<number>(2);
  operador      = signal<number>(1);

  volumenNeto          = computed(() => this.tramos().reduce((s, t) => s + (t.largo||0)*(t.ancho||0)*(t.profundidad||0), 0));
  volumenEsponjado     = computed(() => this.volumenNeto() * (this.esponjamiento()||1));
  volumenPresupuestado = computed(() => this.volumenEsponjado() * (1 + (this.desperdicio()||0)/100));
  duracionCalc         = computed(() => { const r = this.rendimiento(); return r ? Math.ceil(this.volumenPresupuestado()/r) : 0; });

  constructor() {
    effect(() => {
      this.parametersChange.emit({
        ...this.apuParameters,
        tramos: this.tramos(), tipoSuelo: this.tipoSuelo(),
        esponjamiento: this.esponjamiento(), desperdicio: this.desperdicio(),
        pendiente: this.pendiente(), disposicion: this.disposicion(),
        rendimiento: this.rendimiento(), peones: this.peones(), operador: this.operador(),
        cantidad_calculada: this.volumenPresupuestado(),
      });
    });
  }

  private _loadFromParams() {
    const p = this.apuParameters;
    if (p?.tramos?.length) this.tramos.set(p.tramos);
    else this.tramos.set([{ descripcion: 'Corte principal', largo: 0, ancho: 0, profundidad: 0 }]);
    if (p?.tipoSuelo)            this.tipoSuelo.set(p.tipoSuelo);
    if (p?.esponjamiento != null) this.esponjamiento.set(p.esponjamiento);
    if (p?.desperdicio   != null) this.desperdicio.set(p.desperdicio);
    if (p?.pendiente)            this.pendiente.set(p.pendiente);
    if (p?.disposicion)          this.disposicion.set(p.disposicion);
    if (p?.rendimiento   != null) this.rendimiento.set(p.rendimiento);
    if (p?.peones        != null) this.peones.set(p.peones);
    if (p?.operador      != null) this.operador.set(p.operador);
  }

  ngOnInit() { this._loadFromParams(); }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['apuParameters'] && !changes['apuParameters'].firstChange) {
      this._loadFromParams();
    }
  }

  addTramo()              { this.tramos.update(t => [...t, { descripcion:'', largo:0, ancho:0, profundidad:0 }]); }
  removeTramo(i: number)  { this.tramos.update(t => t.filter((_,idx) => idx !== i)); }
  updateTramo(i: number, field: keyof TramoExcavacion, val: any) {
    this.tramos.update(t => { const c=[...t]; (c[i] as any)[field]=val; return c; });
  }
}
