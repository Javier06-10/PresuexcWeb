import { Component, Input, Output, EventEmitter, signal, computed, effect, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface TramoEstructura {
  descripcion: string;
  largo: number;
  ancho: number;
  cant: number;
}

@Component({
  selector: 'app-apu-estructura-metalica',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './apu-estructura-metalica.html',
  styles: [``]
})
export class ApuEstructuraMetalica implements OnInit, OnChanges {
  @Input() apuParameters: any;
  @Output() parametersChange = new EventEmitter<any>();

  tramos = signal<TramoEstructura[]>([
    { descripcion: 'Cubierta principal', largo: 12.00, ancho: 8.00, cant: 1 }
  ]);

  tipoEstructura  = signal('Cubierta metálica liviana');
  perfil          = signal('Correa galvanizada C150');
  cubierta        = signal('Zinc trapezoidal cal. 26');
  con_pintura     = signal(true);
  con_instalacion = signal(true);
  pendiente       = signal(15);

  areaTotal = computed(() =>
    this.tramos().reduce((s, t) => s + (t.largo||0)*(t.ancho||0)*(t.cant||1), 0)
  );

  areaInclinada = computed(() => {
    const angulo = (this.pendiente() || 0) * Math.PI / 180;
    return this.areaTotal() / Math.cos(angulo);
  });

  private _firstEmit = false;

  constructor() {
    effect(() => {
      const params = {
        tramos: this.tramos(),
        tipoEstructura: this.tipoEstructura(),
        perfil: this.perfil(),
        cubierta: this.cubierta(),
        con_pintura: this.con_pintura(),
        con_instalacion: this.con_instalacion(),
        pendiente: this.pendiente(),
        cantidad_calculada: +this.areaInclinada().toFixed(2),
      };
      if (!this._firstEmit) { this._firstEmit = true; return; }
      this.parametersChange.emit(params);
    });
  }

  ngOnInit() { if (this.apuParameters) this._loadFromParams(); }

  ngOnChanges(c: SimpleChanges) {
    if (c['apuParameters'] && !c['apuParameters'].firstChange) this._loadFromParams();
  }

  private _loadFromParams() {
    const p = this.apuParameters;
    if (!p) return;
    if (p.tramos)         this.tramos.set(p.tramos);
    if (p.tipoEstructura) this.tipoEstructura.set(p.tipoEstructura);
    if (p.perfil)         this.perfil.set(p.perfil);
    if (p.cubierta)       this.cubierta.set(p.cubierta);
    if (p.pendiente       != null) this.pendiente.set(p.pendiente);
    if (p.con_pintura     != null) this.con_pintura.set(p.con_pintura);
    if (p.con_instalacion != null) this.con_instalacion.set(p.con_instalacion);
  }

  addTramo() {
    this.tramos.update(t => [...t, { descripcion: 'Tramo', largo: 0, ancho: 0, cant: 1 }]);
  }

  removeTramo(i: number) {
    this.tramos.update(t => t.filter((_, idx) => idx !== i));
  }

  updateTramo(i: number, field: keyof TramoEstructura, val: any) {
    this.tramos.update(t => t.map((x, idx) => idx === i ? { ...x, [field]: val } : x));
  }
}
