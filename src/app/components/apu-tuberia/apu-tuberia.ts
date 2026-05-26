import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface TramoTuberia {
  descripcion: string;
  longitud: number;
  cant: number;
}

@Component({
  selector: 'app-apu-tuberia',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './apu-tuberia.html',
})
export class ApuTuberiaComponent implements OnInit, OnChanges {
  @Input() apuParameters: any = {};
  @Output() parametersChange = new EventEmitter<any>();

  tramos      = signal<TramoTuberia[]>([]);
  diametro    = signal<string>('1/2"');
  material    = signal<string>('PVC presión');
  desperdicio = signal<number>(5);

  longitudNeta         = computed(() => this.tramos().reduce((s, t) => s + (t.longitud||0)*(t.cant||1), 0));
  longitudPresupuestada = computed(() => this.longitudNeta() * (1 + (this.desperdicio()||0)/100));

  constructor() {
    effect(() => {
      this.parametersChange.emit({
        ...this.apuParameters,
        tramos: this.tramos(),
        diametro: this.diametro(), material: this.material(), desperdicio: this.desperdicio(),
        cantidad_calculada: this.longitudPresupuestada(),
      });
    });
  }

  private _loadFromParams() {
    const p = this.apuParameters;
    if (p?.tramos?.length) this.tramos.set(p.tramos);
    else this.tramos.set([{ descripcion: 'Tramo principal', longitud: 0, cant: 1 }]);
    if (p?.diametro)            this.diametro.set(p.diametro);
    if (p?.material)            this.material.set(p.material);
    if (p?.desperdicio != null) this.desperdicio.set(p.desperdicio);
  }

  ngOnInit() { this._loadFromParams(); }
  ngOnChanges(changes: SimpleChanges) {
    if (changes['apuParameters'] && !changes['apuParameters'].firstChange) this._loadFromParams();
  }

  addTramo()             { this.tramos.update(t => [...t, { descripcion: '', longitud: 0, cant: 1 }]); }
  removeTramo(i: number) { this.tramos.update(t => t.filter((_, idx) => idx !== i)); }
  updateTramo(i: number, field: keyof TramoTuberia, val: any) {
    this.tramos.update(t => { const c = [...t]; (c[i] as any)[field] = val; return c; });
  }
}
