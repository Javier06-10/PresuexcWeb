import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface TramoEscalera {
  descripcion: string;
  huellas: number;
  ancho: number;
  cant: number;
}

@Component({
  selector: 'app-apu-escalera',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './apu-escalera.html',
})
export class ApuEscaleraComponent implements OnInit, OnChanges {
  @Input() apuParameters: any = {};
  @Output() parametersChange = new EventEmitter<any>();

  tramos      = signal<TramoEscalera[]>([]);
  huella_m    = signal<number>(0.28);
  contrahuella = signal<number>(0.175);
  tipoPeldano  = signal<string>('Hormigón armado');
  acabado      = signal<string>('Sin acabado');
  desperdicio  = signal<number>(5);

  areaNeta = computed(() =>
    this.tramos().reduce((s, t) => s + (t.huellas || 0) * (this.huella_m() || 0.28) * (t.ancho || 0) * (t.cant || 1), 0)
  );
  areaPresupuestada = computed(() => this.areaNeta() * (1 + (this.desperdicio() || 0) / 100));

  volumenNeto = computed(() =>
    this.tramos().reduce((s, t) => {
      const h = t.huellas || 0;
      const ancho = t.ancho || 0;
      const cant = t.cant || 1;
      const ch = this.contrahuella() || 0.175;
      const hu = this.huella_m() || 0.28;
      return s + (h * ancho * (hu * ch / 2) * cant);
    }, 0)
  );

  constructor() {
    effect(() => {
      this.parametersChange.emit({
        ...this.apuParameters,
        tramos: this.tramos(),
        huella_m: this.huella_m(),
        contrahuella: this.contrahuella(),
        tipoPeldano: this.tipoPeldano(),
        acabado: this.acabado(),
        desperdicio: this.desperdicio(),
        cantidad_calculada: this.areaPresupuestada(),
      });
    });
  }

  private _loadFromParams() {
    const p = this.apuParameters;
    if (p?.tramos?.length) this.tramos.set(p.tramos);
    else this.tramos.set([{ descripcion: 'Tramo principal', huellas: 12, ancho: 1.00, cant: 1 }]);
    if (p?.huella_m != null)      this.huella_m.set(p.huella_m);
    if (p?.contrahuella != null)  this.contrahuella.set(p.contrahuella);
    if (p?.tipoPeldano)           this.tipoPeldano.set(p.tipoPeldano);
    if (p?.acabado)               this.acabado.set(p.acabado);
    if (p?.desperdicio != null)   this.desperdicio.set(p.desperdicio);
  }

  ngOnInit() { this._loadFromParams(); }
  ngOnChanges(c: SimpleChanges) {
    if (c['apuParameters'] && !c['apuParameters'].firstChange) this._loadFromParams();
  }

  addTramo() {
    this.tramos.update(t => [...t, { descripcion: '', huellas: 12, ancho: 1.00, cant: 1 }]);
  }
  removeTramo(i: number) { this.tramos.update(t => t.filter((_, idx) => idx !== i)); }
  updateTramo(i: number, field: keyof TramoEscalera, val: any) {
    this.tramos.update(t => { const c = [...t]; (c[i] as any)[field] = val; return c; });
  }

  totalHuellas() { return this.tramos().reduce((s, t) => s + (t.huellas || 0) * (t.cant || 1), 0); }
}
