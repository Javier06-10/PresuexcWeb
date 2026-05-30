import { Component, Input, Output, EventEmitter, signal, computed, effect, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface TramoRevestimiento {
  descripcion: string;
  largo: number;
  alto: number;
  cant: number;
}

@Component({
  selector: 'app-apu-revestimiento',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './apu-revestimiento.html',

})
export class ApuRevestimiento implements OnInit, OnChanges {
  @Input() apuParameters: any;
  @Output() parametersChange = new EventEmitter<any>();

  tramos = signal<TramoRevestimiento[]>([
    { descripcion: 'Paredes baño', largo: 2.40, alto: 2.40, cant: 1 }
  ]);

  tipoMaterial  = signal('Cerámica nacional');
  formato       = signal('30x60 cm');
  desperdicio   = signal(10);
  con_fragua    = signal(true);
  con_masilla   = signal(true);

  areaNeta = computed(() =>
    this.tramos().reduce((s, t) => s + (t.largo||0)*(t.alto||0)*(t.cant||1), 0)
  );

  areaPresupuestada = computed(() =>
    this.areaNeta() * (1 + (this.desperdicio()||0) / 100)
  );

  constructor() {
    effect(() => {
      this.parametersChange.emit({
        tramos: this.tramos(),
        tipoMaterial: this.tipoMaterial(),
        formato: this.formato(),
        desperdicio: this.desperdicio(),
        con_fragua: this.con_fragua(),
        con_masilla: this.con_masilla(),
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
    if (p.tipoMaterial) this.tipoMaterial.set(p.tipoMaterial);
    if (p.formato)      this.formato.set(p.formato);
    if (p.desperdicio != null) this.desperdicio.set(p.desperdicio);
    if (p.con_fragua  != null) this.con_fragua.set(p.con_fragua);
    if (p.con_masilla != null) this.con_masilla.set(p.con_masilla);
  }

  addTramo() {
    this.tramos.update(t => [...t, { descripcion: 'Área', largo: 0, alto: 0, cant: 1 }]);
  }

  removeTramo(i: number) {
    this.tramos.update(t => t.filter((_, idx) => idx !== i));
  }

  updateTramo(i: number, field: keyof TramoRevestimiento, val: any) {
    this.tramos.update(t => t.map((x, idx) => idx === i ? { ...x, [field]: val } : x));
  }
}
