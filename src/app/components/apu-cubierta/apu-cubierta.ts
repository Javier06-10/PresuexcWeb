import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface TramoCubierta {
  descripcion: string;
  largo: number;
  ancho: number;
  cant: number;
}

@Component({
  selector: 'app-apu-cubierta',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './apu-cubierta.html',
})
export class ApuCubiertaComponent implements OnInit, OnChanges {
  @Input() apuParameters: any = {};
  @Output() parametersChange = new EventEmitter<any>();

  tramos       = signal<TramoCubierta[]>([]);
  tipoCubierta = signal<string>('Zinc corrugado cal. 26');
  pendientePct = signal<number>(20);
  traslape     = signal<number>(15);
  desperdicio  = signal<number>(8);

  areaEnPlanta     = computed(() => this.tramos().reduce((s, t) => s + (t.largo||0)*(t.ancho||0)*(t.cant||1), 0));
  factorPendiente  = computed(() => 1 / Math.cos(Math.atan((this.pendientePct()||0)/100)));
  areaInclinada    = computed(() => this.areaEnPlanta() * this.factorPendiente());
  areaPresupuestada = computed(() => this.areaInclinada() * (1 + (this.traslape()||0)/100) * (1 + (this.desperdicio()||0)/100));

  constructor() {
    effect(() => {
      this.parametersChange.emit({
        ...this.apuParameters,
        tramos: this.tramos(),
        tipoCubierta: this.tipoCubierta(), pendientePct: this.pendientePct(),
        traslape: this.traslape(), desperdicio: this.desperdicio(),
        cantidad_calculada: this.areaPresupuestada(),
      });
    });
  }

  private _loadFromParams() {
    const p = this.apuParameters;
    if (p?.tramos?.length) this.tramos.set(p.tramos);
    else this.tramos.set([{ descripcion: 'Cubierta principal', largo: 0, ancho: 0, cant: 1 }]);
    if (p?.tipoCubierta)           this.tipoCubierta.set(p.tipoCubierta);
    if (p?.pendientePct != null)  this.pendientePct.set(p.pendientePct);
    if (p?.traslape     != null)  this.traslape.set(p.traslape);
    if (p?.desperdicio  != null)  this.desperdicio.set(p.desperdicio);
  }

  ngOnInit() { this._loadFromParams(); }
  ngOnChanges(changes: SimpleChanges) {
    if (changes['apuParameters'] && !changes['apuParameters'].firstChange) this._loadFromParams();
  }

  addTramo()             { this.tramos.update(t => [...t, { descripcion: '', largo: 0, ancho: 0, cant: 1 }]); }
  removeTramo(i: number) { this.tramos.update(t => t.filter((_, idx) => idx !== i)); }
  updateTramo(i: number, field: keyof TramoCubierta, val: any) {
    this.tramos.update(t => { const c = [...t]; (c[i] as any)[field] = val; return c; });
  }
}
