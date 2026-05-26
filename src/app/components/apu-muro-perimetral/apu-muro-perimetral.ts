import { Component, Input, Output, EventEmitter, signal, computed, effect, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface TramoMuro {
  descripcion: string;
  largo: number;
  alto: number;
  cant: number;
}

@Component({
  selector: 'app-apu-muro-perimetral',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './apu-muro-perimetral.html',
  styles: [``]
})
export class ApuMuroPerimetral implements OnInit, OnChanges {
  @Input() apuParameters: any;
  @Output() parametersChange = new EventEmitter<any>();

  tramos = signal<TramoMuro[]>([
    { descripcion: 'Frente', largo: 10.00, alto: 2.00, cant: 1 }
  ]);

  tipoMaterial   = signal('Bloque de hormigón');
  espesor        = signal(0.15);
  con_cimentacion = signal(true);
  con_acabado    = signal(false);
  desperdicio    = signal(5);

  metrosLineales = computed(() =>
    this.tramos().reduce((s, t) => s + (t.largo||0)*(t.cant||1), 0)
  );

  areaTotal = computed(() =>
    this.tramos().reduce((s, t) => s + (t.largo||0)*(t.alto||0)*(t.cant||1), 0)
  );

  areaTotalPresupuestada = computed(() =>
    this.areaTotal() * (1 + (this.desperdicio()||0) / 100)
  );

  private _firstEmit = false;

  constructor() {
    effect(() => {
      const params = {
        tramos: this.tramos(),
        tipoMaterial: this.tipoMaterial(),
        espesor: this.espesor(),
        con_cimentacion: this.con_cimentacion(),
        con_acabado: this.con_acabado(),
        desperdicio: this.desperdicio(),
        cantidad_calculada: +this.metrosLineales().toFixed(2),
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
    if (p.tramos)       this.tramos.set(p.tramos);
    if (p.tipoMaterial) this.tipoMaterial.set(p.tipoMaterial);
    if (p.espesor != null)          this.espesor.set(p.espesor);
    if (p.con_cimentacion != null)  this.con_cimentacion.set(p.con_cimentacion);
    if (p.con_acabado != null)      this.con_acabado.set(p.con_acabado);
    if (p.desperdicio != null)      this.desperdicio.set(p.desperdicio);
  }

  addTramo() {
    this.tramos.update(t => [...t, { descripcion: 'Tramo', largo: 0, alto: 0, cant: 1 }]);
  }

  removeTramo(i: number) {
    this.tramos.update(t => t.filter((_, idx) => idx !== i));
  }

  updateTramo(i: number, field: keyof TramoMuro, val: any) {
    this.tramos.update(t => t.map((x, idx) => idx === i ? { ...x, [field]: val } : x));
  }
}
