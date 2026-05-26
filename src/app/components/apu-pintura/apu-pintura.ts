import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface TramoPintura {
  descripcion: string;
  largo: number;
  alto: number;
  cant: number;
}

export interface VanoPintura {
  descripcion: string;
  ancho: number;
  alto: number;
  cant: number;
}

@Component({
  selector: 'app-apu-pintura',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './apu-pintura.html',
})
export class ApuPinturaComponent implements OnInit, OnChanges {
  @Input() apuParameters: any = {};
  @Output() parametersChange = new EventEmitter<any>();

  tramos      = signal<TramoPintura[]>([]);
  vanos       = signal<VanoPintura[]>([]);
  tipoPintura = signal<string>('Látex acrílico');
  manos       = signal<number>(2);
  conImprimante = signal<boolean>(true);
  desperdicio = signal<number>(5);

  areaBruta        = computed(() => this.tramos().reduce((s, t) => s + (t.largo||0)*(t.alto||0)*(t.cant||1), 0));
  areaVanos        = computed(() => this.vanos().reduce((s, v) => s + (v.ancho||0)*(v.alto||0)*(v.cant||1), 0));
  areaNeta         = computed(() => Math.max(0, this.areaBruta() - this.areaVanos()));
  areaPresupuestada = computed(() => this.areaNeta() * (1 + (this.desperdicio()||0)/100));
  areaTotal        = computed(() => this.areaPresupuestada() * (this.manos()||1));

  constructor() {
    effect(() => {
      this.parametersChange.emit({
        ...this.apuParameters,
        tramos: this.tramos(), vanos: this.vanos(),
        tipoPintura: this.tipoPintura(), manos: this.manos(),
        conImprimante: this.conImprimante(), desperdicio: this.desperdicio(),
        cantidad_calculada: this.areaPresupuestada(),
      });
    });
  }

  private _loadFromParams() {
    const p = this.apuParameters;
    if (p?.tramos?.length) this.tramos.set(p.tramos);
    else this.tramos.set([{ descripcion: 'Paredes interiores', largo: 0, alto: 0, cant: 1 }]);
    if (p?.vanos?.length)           this.vanos.set(p.vanos);
    else                            this.vanos.set([]);
    if (p?.tipoPintura)              this.tipoPintura.set(p.tipoPintura);
    if (p?.manos        != null)    this.manos.set(p.manos);
    if (p?.conImprimante != null)   this.conImprimante.set(p.conImprimante);
    if (p?.desperdicio  != null)    this.desperdicio.set(p.desperdicio);
  }

  ngOnInit() { this._loadFromParams(); }
  ngOnChanges(changes: SimpleChanges) {
    if (changes['apuParameters'] && !changes['apuParameters'].firstChange) this._loadFromParams();
  }

  addTramo()             { this.tramos.update(t => [...t, { descripcion: '', largo: 0, alto: 0, cant: 1 }]); }
  removeTramo(i: number) { this.tramos.update(t => t.filter((_, idx) => idx !== i)); }
  updateTramo(i: number, field: keyof TramoPintura, val: any) {
    this.tramos.update(t => { const c = [...t]; (c[i] as any)[field] = val; return c; });
  }

  addVano()             { this.vanos.update(v => [...v, { descripcion: 'Puerta/ventana', ancho: 0, alto: 0, cant: 1 }]); }
  removeVano(i: number) { this.vanos.update(v => v.filter((_, idx) => idx !== i)); }
  updateVano(i: number, field: keyof VanoPintura, val: any) {
    this.vanos.update(v => { const c = [...v]; (c[i] as any)[field] = val; return c; });
  }
}
