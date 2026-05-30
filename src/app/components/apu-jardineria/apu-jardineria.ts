import { Component, Input, Output, EventEmitter, signal, computed, effect, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface AreaVerde {
  descripcion: string;
  largo: number;
  ancho: number;
  cant: number;
}

@Component({
  selector: 'app-apu-jardineria',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './apu-jardineria.html',

})
export class ApuJardineria implements OnInit, OnChanges {
  @Input() apuParameters: any;
  @Output() parametersChange = new EventEmitter<any>();

  areas = signal<AreaVerde[]>([
    { descripcion: 'Jardín frontal', largo: 5.00, ancho: 3.00, cant: 1 }
  ]);

  tipoVegetacion    = signal('Césped natural');
  incluye_riego     = signal(false);
  incluye_bordillo  = signal(true);
  incluye_tierra    = signal(true);
  incluye_plantas   = signal(false);

  areaNeta = computed(() =>
    this.areas().reduce((s, a) => s + (a.largo||0)*(a.ancho||0)*(a.cant||1), 0)
  );

  constructor() {
    effect(() => {
      this.parametersChange.emit({
        areas: this.areas(),
        tipoVegetacion: this.tipoVegetacion(),
        incluye_riego: this.incluye_riego(),
        incluye_bordillo: this.incluye_bordillo(),
        incluye_tierra: this.incluye_tierra(),
        incluye_plantas: this.incluye_plantas(),
        cantidad_calculada: +this.areaNeta().toFixed(2),
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
    if (p.areas)          this.areas.set(p.areas);
    if (p.tipoVegetacion) this.tipoVegetacion.set(p.tipoVegetacion);
    if (p.incluye_riego    != null) this.incluye_riego.set(p.incluye_riego);
    if (p.incluye_bordillo != null) this.incluye_bordillo.set(p.incluye_bordillo);
    if (p.incluye_tierra   != null) this.incluye_tierra.set(p.incluye_tierra);
    if (p.incluye_plantas  != null) this.incluye_plantas.set(p.incluye_plantas);
  }

  addArea() {
    this.areas.update(a => [...a, { descripcion: 'Área verde', largo: 0, ancho: 0, cant: 1 }]);
  }

  removeArea(i: number) {
    this.areas.update(a => a.filter((_, idx) => idx !== i));
  }

  updateArea(i: number, field: keyof AreaVerde, val: any) {
    this.areas.update(a => a.map((x, idx) => idx === i ? { ...x, [field]: val } : x));
  }
}
