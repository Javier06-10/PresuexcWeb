import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface TramoCeramica {
  descripcion: string;
  largo: number;
  ancho: number;
  cant: number;
}

export interface VanoCeramica {
  descripcion: string;
  largo: number;
  ancho: number;
  cant: number;
}

@Component({
  selector: 'app-apu-ceramica',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './apu-ceramica.html',
})
export class ApuCeramicaComponent implements OnInit, OnChanges {
  @Input() apuParameters: any = {};
  @Output() parametersChange = new EventEmitter<any>();

  tramos      = signal<TramoCeramica[]>([]);
  vanos       = signal<VanoCeramica[]>([]);
  formato     = signal<string>('60×60 cm');
  tipoPegante = signal<string>('Pegante flexible');
  desperdicio = signal<number>(10);

  areaBruta        = computed(() => this.tramos().reduce((s, t) => s + (t.largo||0)*(t.ancho||0)*(t.cant||1), 0));
  areaVanos        = computed(() => this.vanos().reduce((s, v) => s + (v.largo||0)*(v.ancho||0)*(v.cant||1), 0));
  areaNeta         = computed(() => Math.max(0, this.areaBruta() - this.areaVanos()));
  areaPresupuestada = computed(() => this.areaNeta() * (1 + (this.desperdicio()||0)/100));

  constructor() {
    effect(() => {
      this.parametersChange.emit({
        ...this.apuParameters,
        tramos: this.tramos(), vanos: this.vanos(),
        formato: this.formato(), tipoPegante: this.tipoPegante(), desperdicio: this.desperdicio(),
        cantidad_calculada: this.areaPresupuestada(),
      });
    });
  }

  private _loadFromParams() {
    const p = this.apuParameters;
    if (p?.tramos?.length) this.tramos.set(p.tramos);
    else this.tramos.set([{ descripcion: 'Piso sala/comedor', largo: 0, ancho: 0, cant: 1 }]);
    if (p?.vanos?.length)         this.vanos.set(p.vanos);
    else                          this.vanos.set([]);
    if (p?.formato)                this.formato.set(p.formato);
    if (p?.tipoPegante)            this.tipoPegante.set(p.tipoPegante);
    if (p?.desperdicio != null)   this.desperdicio.set(p.desperdicio);
  }

  ngOnInit() { this._loadFromParams(); }
  ngOnChanges(changes: SimpleChanges) {
    if (changes['apuParameters'] && !changes['apuParameters'].firstChange) this._loadFromParams();
  }

  addTramo()             { this.tramos.update(t => [...t, { descripcion: '', largo: 0, ancho: 0, cant: 1 }]); }
  removeTramo(i: number) { this.tramos.update(t => t.filter((_, idx) => idx !== i)); }
  updateTramo(i: number, field: keyof TramoCeramica, val: any) {
    this.tramos.update(t => { const c = [...t]; (c[i] as any)[field] = val; return c; });
  }

  addVano()             { this.vanos.update(v => [...v, { descripcion: 'Sin cerámica', largo: 0, ancho: 0, cant: 1 }]); }
  removeVano(i: number) { this.vanos.update(v => v.filter((_, idx) => idx !== i)); }
  updateVano(i: number, field: keyof VanoCeramica, val: any) {
    this.vanos.update(v => { const c = [...v]; (c[i] as any)[field] = val; return c; });
  }
}
