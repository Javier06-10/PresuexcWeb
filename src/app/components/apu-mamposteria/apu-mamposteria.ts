import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface TramoMuro {
  descripcion: string;
  largo: number;
  altura: number;
  cant: number;
}

export interface VanoMuro {
  descripcion: string;
  ancho: number;
  altura: number;
  cant: number;
}

@Component({
  selector: 'app-apu-mamposteria',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './apu-mamposteria.html',
})
export class ApuMamposteriaComponent implements OnInit, OnChanges {
  @Input() apuParameters: any = {};
  @Output() parametersChange = new EventEmitter<any>();

  tramos      = signal<TramoMuro[]>([]);
  vanos       = signal<VanoMuro[]>([]);
  tipoBloque  = signal<string>('Bloque 15×20×40');
  mortero     = signal<number>(1.5);
  desperdicio = signal<number>(5);

  areaBruta        = computed(() => this.tramos().reduce((s, t) => s + (t.largo||0)*(t.altura||0)*(t.cant||1), 0));
  areaVanos        = computed(() => this.vanos().reduce((s, v) => s + (v.ancho||0)*(v.altura||0)*(v.cant||1), 0));
  areaNeta         = computed(() => Math.max(0, this.areaBruta() - this.areaVanos()));
  areaPresupuestada = computed(() => this.areaNeta() * (1 + (this.desperdicio()||0)/100));

  constructor() {
    effect(() => {
      this.parametersChange.emit({
        ...this.apuParameters,
        tramos: this.tramos(), vanos: this.vanos(),
        tipoBloque: this.tipoBloque(), mortero: this.mortero(), desperdicio: this.desperdicio(),
        cantidad_calculada: this.areaPresupuestada(),
      });
    });
  }

  private _loadFromParams() {
    const p = this.apuParameters;
    if (p?.tramos?.length) this.tramos.set(p.tramos);
    else this.tramos.set([{ descripcion: 'Muro exterior', largo: 0, altura: 0, cant: 1 }]);
    if (p?.vanos?.length) this.vanos.set(p.vanos);
    else this.vanos.set([]);
    if (p?.tipoBloque)            this.tipoBloque.set(p.tipoBloque);
    if (p?.mortero     != null)   this.mortero.set(p.mortero);
    if (p?.desperdicio != null)   this.desperdicio.set(p.desperdicio);
  }

  ngOnInit() { this._loadFromParams(); }
  ngOnChanges(changes: SimpleChanges) {
    if (changes['apuParameters'] && !changes['apuParameters'].firstChange) this._loadFromParams();
  }

  addTramo()             { this.tramos.update(t => [...t, { descripcion: '', largo: 0, altura: 0, cant: 1 }]); }
  removeTramo(i: number) { this.tramos.update(t => t.filter((_, idx) => idx !== i)); }
  updateTramo(i: number, field: keyof TramoMuro, val: any) {
    this.tramos.update(t => { const c = [...t]; (c[i] as any)[field] = val; return c; });
  }

  addVano()             { this.vanos.update(v => [...v, { descripcion: 'Ventana/puerta', ancho: 0, altura: 0, cant: 1 }]); }
  removeVano(i: number) { this.vanos.update(v => v.filter((_, idx) => idx !== i)); }
  updateVano(i: number, field: keyof VanoMuro, val: any) {
    this.vanos.update(v => { const c = [...v]; (c[i] as any)[field] = val; return c; });
  }
}
