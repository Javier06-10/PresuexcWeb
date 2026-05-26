import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface TramoLosa {
  descripcion: string;
  largo: number;
  ancho: number;
  espesor: number;
  cant: number;
}

@Component({
  selector: 'app-apu-hormigon-losa',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './apu-hormigon-losa.html',
})
export class ApuHormigonLosaComponent implements OnInit, OnChanges {
  @Input() apuParameters: any = {};
  @Output() parametersChange = new EventEmitter<any>();

  tramos      = signal<TramoLosa[]>([]);
  desperdicio = signal<number>(5);
  tipoLosa    = signal<string>('Maciza');
  aceroKgM3   = signal<number>(60);

  areaNeta             = computed(() => this.tramos().reduce((s, t) => s + (t.largo||0)*(t.ancho||0)*(t.cant||1), 0));
  volumenNeto          = computed(() => this.tramos().reduce((s, t) => s + (t.largo||0)*(t.ancho||0)*(t.espesor||0)*(t.cant||1), 0));
  volumenPresupuestado = computed(() => this.volumenNeto() * (1 + (this.desperdicio()||0)/100));

  constructor() {
    effect(() => {
      this.parametersChange.emit({
        ...this.apuParameters,
        tramos: this.tramos(), desperdicio: this.desperdicio(),
        tipoLosa: this.tipoLosa(), aceroKgM3: this.aceroKgM3(),
        cantidad_calculada: this.volumenPresupuestado(),
      });
    });
  }

  private _loadFromParams() {
    const p = this.apuParameters;
    if (p?.tramos?.length) this.tramos.set(p.tramos);
    else this.tramos.set([{ descripcion: 'Losa planta baja', largo: 0, ancho: 0, espesor: 0.15, cant: 1 }]);
    if (p?.desperdicio != null) this.desperdicio.set(p.desperdicio);
    if (p?.tipoLosa)             this.tipoLosa.set(p.tipoLosa);
    if (p?.aceroKgM3   != null) this.aceroKgM3.set(p.aceroKgM3);
  }

  ngOnInit() { this._loadFromParams(); }
  ngOnChanges(changes: SimpleChanges) {
    if (changes['apuParameters'] && !changes['apuParameters'].firstChange) this._loadFromParams();
  }

  addTramo()             { this.tramos.update(t => [...t, { descripcion: '', largo: 0, ancho: 0, espesor: 0.15, cant: 1 }]); }
  removeTramo(i: number) { this.tramos.update(t => t.filter((_, idx) => idx !== i)); }
  updateTramo(i: number, field: keyof TramoLosa, val: any) {
    this.tramos.update(t => { const c = [...t]; (c[i] as any)[field] = val; return c; });
  }
}
