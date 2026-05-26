import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface TramoCieloRaso {
  descripcion: string;
  largo: number;
  ancho: number;
  cant: number;
}

@Component({
  selector: 'app-apu-cielo-raso',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './apu-cielo-raso.html',
})
export class ApuCieloRasoComponent implements OnInit, OnChanges {
  @Input() apuParameters: any = {};
  @Output() parametersChange = new EventEmitter<any>();

  tramos      = signal<TramoCieloRaso[]>([]);
  tipoCielo   = signal<string>('Gypsum / Drywall');
  estructura  = signal<string>('Perfil galvanizado');
  desperdicio = signal<number>(10);

  areaNeta          = computed(() => this.tramos().reduce((s, t) => s + (t.largo||0)*(t.ancho||0)*(t.cant||1), 0));
  areaPresupuestada = computed(() => this.areaNeta() * (1 + (this.desperdicio()||0)/100));

  constructor() {
    effect(() => {
      this.parametersChange.emit({
        ...this.apuParameters,
        tramos: this.tramos(),
        tipoCielo: this.tipoCielo(), estructura: this.estructura(), desperdicio: this.desperdicio(),
        cantidad_calculada: this.areaPresupuestada(),
      });
    });
  }

  private _loadFromParams() {
    const p = this.apuParameters;
    if (p?.tramos?.length) this.tramos.set(p.tramos);
    else this.tramos.set([{ descripcion: 'Cielo raso planta baja', largo: 0, ancho: 0, cant: 1 }]);
    if (p?.tipoCielo)            this.tipoCielo.set(p.tipoCielo);
    if (p?.estructura)           this.estructura.set(p.estructura);
    if (p?.desperdicio != null) this.desperdicio.set(p.desperdicio);
  }

  ngOnInit() { this._loadFromParams(); }
  ngOnChanges(changes: SimpleChanges) {
    if (changes['apuParameters'] && !changes['apuParameters'].firstChange) this._loadFromParams();
  }

  addTramo()             { this.tramos.update(t => [...t, { descripcion: '', largo: 0, ancho: 0, cant: 1 }]); }
  removeTramo(i: number) { this.tramos.update(t => t.filter((_, idx) => idx !== i)); }
  updateTramo(i: number, field: keyof TramoCieloRaso, val: any) {
    this.tramos.update(t => { const c = [...t]; (c[i] as any)[field] = val; return c; });
  }
}
