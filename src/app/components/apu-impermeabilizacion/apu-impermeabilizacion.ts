import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface TramoImper {
  descripcion: string;
  largo: number;
  ancho: number;
  cant: number;
}

@Component({
  selector: 'app-apu-impermeabilizacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './apu-impermeabilizacion.html',
})
export class ApuImpermeabilizacionComponent implements OnInit, OnChanges {
  @Input() apuParameters: any = {};
  @Output() parametersChange = new EventEmitter<any>();

  tramos        = signal<TramoImper[]>([]);
  tipoMembrana  = signal<string>('Membrana asfáltica 3mm');
  capas         = signal<number>(1);
  alturaRodapie = signal<number>(0.20);
  desperdicio   = signal<number>(10);

  areaHorizontal   = computed(() => this.tramos().reduce((s, t) => s + (t.largo||0)*(t.ancho||0)*(t.cant||1), 0));
  areaRodapie      = computed(() => this.tramos().reduce((s, t) => s + 2*((t.largo||0)+(t.ancho||0))*(this.alturaRodapie()||0)*(t.cant||1), 0));
  areaNeta         = computed(() => this.areaHorizontal() + this.areaRodapie());
  areaPresupuestada = computed(() => this.areaNeta() * (this.capas()||1) * (1 + (this.desperdicio()||0)/100));

  constructor() {
    effect(() => {
      this.parametersChange.emit({
        ...this.apuParameters,
        tramos: this.tramos(),
        tipoMembrana: this.tipoMembrana(), capas: this.capas(),
        alturaRodapie: this.alturaRodapie(), desperdicio: this.desperdicio(),
        cantidad_calculada: this.areaPresupuestada(),
      });
    });
  }

  private _loadFromParams() {
    const p = this.apuParameters;
    if (p?.tramos?.length) this.tramos.set(p.tramos);
    else this.tramos.set([{ descripcion: 'Terraza / azotea', largo: 0, ancho: 0, cant: 1 }]);
    if (p?.tipoMembrana)           this.tipoMembrana.set(p.tipoMembrana);
    if (p?.capas         != null) this.capas.set(p.capas);
    if (p?.alturaRodapie != null) this.alturaRodapie.set(p.alturaRodapie);
    if (p?.desperdicio   != null) this.desperdicio.set(p.desperdicio);
  }

  ngOnInit() { this._loadFromParams(); }
  ngOnChanges(changes: SimpleChanges) {
    if (changes['apuParameters'] && !changes['apuParameters'].firstChange) this._loadFromParams();
  }

  addTramo()             { this.tramos.update(t => [...t, { descripcion: '', largo: 0, ancho: 0, cant: 1 }]); }
  removeTramo(i: number) { this.tramos.update(t => t.filter((_, idx) => idx !== i)); }
  updateTramo(i: number, field: keyof TramoImper, val: any) {
    this.tramos.update(t => { const c = [...t]; (c[i] as any)[field] = val; return c; });
  }
}
