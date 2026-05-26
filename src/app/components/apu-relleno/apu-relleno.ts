import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface TramoRelleno {
  descripcion: string;
  largo: number;
  ancho: number;
  espesor: number;
}

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

  tramos        = signal<TramoRelleno[]>([]);
  tipoMaterial  = signal<string>('Material selecto (zarandeado)');
  compactacion  = signal<number>(95);
  capas         = signal<number>(3);
  esponjamiento = signal<number>(1.2);
  desperdicio   = signal<number>(5);
  rendimiento   = signal<number>(30);
  operador      = signal<number>(1);
  peones        = signal<number>(2);

  volumenBruto      = computed(() => this.tramos().reduce((s, t) => s + (t.largo||0)*(t.ancho||0)*(t.espesor||0), 0));
  volumenCompactado = computed(() => this.volumenBruto() * (this.compactacion()||95)/100);
  materialNecesario = computed(() => this.volumenBruto() * (this.esponjamiento()||1) * (1 + (this.desperdicio()||0)/100));
  duracionCalc      = computed(() => { const r = this.rendimiento(); return r ? Math.ceil(this.volumenBruto()/r) : 0; });

  constructor() {
    effect(() => {
      this.parametersChange.emit({
        ...this.apuParameters,
        tramos: this.tramos(), tipoMaterial: this.tipoMaterial(),
        compactacion: this.compactacion(), capas: this.capas(),
        esponjamiento: this.esponjamiento(), desperdicio: this.desperdicio(),
        rendimiento: this.rendimiento(), operador: this.operador(), peones: this.peones(),
        cantidad_calculada: this.materialNecesario(),
      });
    });
  }

  private _loadFromParams() {
    const p = this.apuParameters;
    if (p?.tramos?.length) this.tramos.set(p.tramos);
    else this.tramos.set([{ descripcion: 'Zona de relleno', largo: 0, ancho: 0, espesor: 0.20 }]);
    if (p?.tipoMaterial)          this.tipoMaterial.set(p.tipoMaterial);
    if (p?.compactacion  != null)  this.compactacion.set(p.compactacion);
    if (p?.capas         != null)  this.capas.set(p.capas);
    if (p?.esponjamiento != null)  this.esponjamiento.set(p.esponjamiento);
    if (p?.desperdicio   != null)  this.desperdicio.set(p.desperdicio);
    if (p?.rendimiento   != null)  this.rendimiento.set(p.rendimiento);
    if (p?.operador      != null)  this.operador.set(p.operador);
    if (p?.peones        != null)  this.peones.set(p.peones);
  }

  ngOnInit() { this._loadFromParams(); }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['apuParameters'] && !changes['apuParameters'].firstChange) {
      this._loadFromParams();
    }
  }

  addTramo()              { this.tramos.update(t => [...t, { descripcion:'', largo:0, ancho:0, espesor:0.20 }]); }
  removeTramo(i: number)  { this.tramos.update(t => t.filter((_,idx) => idx !== i)); }
  updateTramo(i: number, field: keyof TramoRelleno, val: any) {
    this.tramos.update(t => { const c=[...t]; (c[i] as any)[field]=val; return c; });
  }
}
