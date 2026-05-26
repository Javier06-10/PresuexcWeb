import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface TramoColumna {
  descripcion: string;
  ancho: number;
  fondo: number;
  altura: number;
  cant: number;
}

@Component({
  selector: 'app-apu-hormigon-columna',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './apu-hormigon-columna.html',
})
export class ApuHormigonColumnaComponent implements OnInit, OnChanges {
  @Input() apuParameters: any = {};
  @Output() parametersChange = new EventEmitter<any>();

  tramos      = signal<TramoColumna[]>([]);
  desperdicio = signal<number>(5);
  tipoVaciado = signal<string>('In situ');
  aceroKgM3   = signal<number>(120);

  volumenNeto          = computed(() => this.tramos().reduce((s, t) => s + (t.ancho||0)*(t.fondo||0)*(t.altura||0)*(t.cant||1), 0));
  volumenPresupuestado = computed(() => this.volumenNeto() * (1 + (this.desperdicio()||0)/100));
  encofradoM2          = computed(() => this.tramos().reduce((s, t) => s + 2*((t.ancho||0)+(t.fondo||0))*(t.altura||0)*(t.cant||1), 0));

  constructor() {
    effect(() => {
      this.parametersChange.emit({
        ...this.apuParameters,
        tramos: this.tramos(), desperdicio: this.desperdicio(),
        tipoVaciado: this.tipoVaciado(), aceroKgM3: this.aceroKgM3(),
        cantidad_calculada: this.volumenPresupuestado(),
      });
    });
  }

  private _loadFromParams() {
    const p = this.apuParameters;
    if (p?.tramos?.length) this.tramos.set(p.tramos);
    else this.tramos.set([{ descripcion: 'Columna principal', ancho: 0.20, fondo: 0.20, altura: 0, cant: 1 }]);
    if (p?.desperdicio  != null) this.desperdicio.set(p.desperdicio);
    if (p?.tipoVaciado)          this.tipoVaciado.set(p.tipoVaciado);
    if (p?.aceroKgM3    != null) this.aceroKgM3.set(p.aceroKgM3);
  }

  ngOnInit() { this._loadFromParams(); }
  ngOnChanges(changes: SimpleChanges) {
    if (changes['apuParameters'] && !changes['apuParameters'].firstChange) this._loadFromParams();
  }

  addTramo()             { this.tramos.update(t => [...t, { descripcion: '', ancho: 0.20, fondo: 0.20, altura: 0, cant: 1 }]); }
  removeTramo(i: number) { this.tramos.update(t => t.filter((_, idx) => idx !== i)); }
  updateTramo(i: number, field: keyof TramoColumna, val: any) {
    this.tramos.update(t => { const c = [...t]; (c[i] as any)[field] = val; return c; });
  }
}
