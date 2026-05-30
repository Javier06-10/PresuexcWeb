import { Component, Input, Output, EventEmitter, signal, computed, effect, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface TramoDesbanque {
  descripcion: string;
  largo: number;
  ancho: number;
  cant: number;
}

@Component({
  selector: 'app-apu-desbanque',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './apu-desbanque.html',

})
export class ApuDesbanque implements OnInit, OnChanges {
  @Input() apuParameters: any;
  @Output() parametersChange = new EventEmitter<any>();

  tramos = signal<TramoDesbanque[]>([
    { descripcion: 'Área total del lote', largo: 15.00, ancho: 10.00, cant: 1 }
  ]);

  profundidadMedia  = signal(0.20);
  tipoSuelo         = signal('Suelo normal / arcilloso');
  incluye_acarreo   = signal(true);
  incluye_compactacion = signal(false);
  desperdicio       = signal(0);

  areaNeta = computed(() =>
    this.tramos().reduce((s, t) => s + (t.largo||0)*(t.ancho||0)*(t.cant||1), 0)
  );

  volumenMaterial = computed(() =>
    this.areaNeta() * (this.profundidadMedia() || 0)
  );

  areaPresupuestada = computed(() =>
    this.areaNeta() * (1 + (this.desperdicio()||0) / 100)
  );

  constructor() {
    effect(() => {
      this.parametersChange.emit({
        tramos: this.tramos(),
        profundidadMedia: this.profundidadMedia(),
        tipoSuelo: this.tipoSuelo(),
        incluye_acarreo: this.incluye_acarreo(),
        incluye_compactacion: this.incluye_compactacion(),
        desperdicio: this.desperdicio(),
        cantidad_calculada: +this.areaPresupuestada().toFixed(2),
      });
    });
  }

  ngOnInit() { if (this.apuParameters) this._loadFromParams(); }

  ngOnChanges(c: SimpleChanges) {
    if (c['apuParameters'] && !c['apuParameters'].firstChange) this._loadFromParams();
  }

  private _loadFromParams() {
    const p = this.apuParameters;
    if (!p) return;
    if (p.tramos)       this.tramos.set(p.tramos);
    if (p.tipoSuelo)    this.tipoSuelo.set(p.tipoSuelo);
    if (p.profundidadMedia    != null) this.profundidadMedia.set(p.profundidadMedia);
    if (p.incluye_acarreo     != null) this.incluye_acarreo.set(p.incluye_acarreo);
    if (p.incluye_compactacion!= null) this.incluye_compactacion.set(p.incluye_compactacion);
    if (p.desperdicio         != null) this.desperdicio.set(p.desperdicio);
  }

  addTramo() {
    this.tramos.update(t => [...t, { descripcion: 'Área', largo: 0, ancho: 0, cant: 1 }]);
  }

  removeTramo(i: number) {
    this.tramos.update(t => t.filter((_, idx) => idx !== i));
  }

  updateTramo(i: number, field: keyof TramoDesbanque, val: any) {
    this.tramos.update(t => t.map((x, idx) => idx === i ? { ...x, [field]: val } : x));
  }
}
