import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface TramoBarrera {
  descripcion: string;
  largo: number;
  ancho: number;
}

@Component({
  selector: 'app-apu-barrera-vapor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './apu-barrera-vapor.html',
  styleUrls: ['./apu-barrera-vapor.css'],
})
export class ApuBarreraVaporComponent implements OnInit, OnChanges {
  @Input() apuParameters: any = {};
  @Output() parametersChange = new EventEmitter<any>();

  tramos       = signal<TramoBarrera[]>([]);
  tipoMembrana = signal<string>('Polietileno 6 mil (150 μm)');
  solapamiento = signal<number>(15);
  alturaMuros  = signal<number>(0.30);
  desperdicio  = signal<number>(5);
  instaladores = signal<number>(2);
  ayudantes    = signal<number>(1);

  areaNeta      = computed(() => this.tramos().reduce((s, t) => s + (t.largo||0)*(t.ancho||0), 0));
  areaSolape    = computed(() => this.areaNeta() * (1 + (this.solapamiento()||0)/100));
  areaConMuros  = computed(() => {
    const perim = this.tramos().reduce((s, t) => s + 2*((t.largo||0)+(t.ancho||0)), 0);
    return this.areaSolape() + perim * (this.alturaMuros()||0);
  });
  areaPresupuestada = computed(() => this.areaConMuros() * (1 + (this.desperdicio()||0)/100));

  constructor() {
    effect(() => {
      this.parametersChange.emit({
        ...this.apuParameters,
        tramos: this.tramos(), tipoMembrana: this.tipoMembrana(),
        solapamiento: this.solapamiento(), alturaMuros: this.alturaMuros(), desperdicio: this.desperdicio(),
        instaladores: this.instaladores(), ayudantes: this.ayudantes(),
        cantidad_calculada: this.areaPresupuestada(),
      });
    });
  }

  private _loadFromParams() {
    const p = this.apuParameters;
    if (p?.tramos?.length) this.tramos.set(p.tramos);
    else this.tramos.set([{ descripcion: 'Losa / piso', largo: 0, ancho: 0 }]);
    if (p?.tipoMembrana)          this.tipoMembrana.set(p.tipoMembrana);
    if (p?.solapamiento  != null)  this.solapamiento.set(p.solapamiento);
    if (p?.alturaMuros   != null)  this.alturaMuros.set(p.alturaMuros);
    if (p?.desperdicio   != null)  this.desperdicio.set(p.desperdicio);
    if (p?.instaladores  != null)  this.instaladores.set(p.instaladores);
    if (p?.ayudantes     != null)  this.ayudantes.set(p.ayudantes);
  }

  ngOnInit() { this._loadFromParams(); }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['apuParameters'] && !changes['apuParameters'].firstChange) {
      this._loadFromParams();
    }
  }

  addTramo()              { this.tramos.update(t => [...t, { descripcion:'', largo:0, ancho:0 }]); }
  removeTramo(i: number)  { this.tramos.update(t => t.filter((_,idx) => idx !== i)); }
  updateTramo(i: number, field: keyof TramoBarrera, val: any) {
    this.tramos.update(t => { const c=[...t]; (c[i] as any)[field]=val; return c; });
  }
}
