import { Component, Input, Output, EventEmitter, signal, computed, effect, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface TramoPiso {
  descripcion: string;
  largo: number;
  ancho: number;
  cant: number;
}

@Component({
  selector: 'app-apu-piso-flotante',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './apu-piso-flotante.html',

})
export class ApuPisoFlotante implements OnInit, OnChanges {
  @Input() apuParameters: any;
  @Output() parametersChange = new EventEmitter<any>();

  tramos = signal<TramoPiso[]>([
    { descripcion: 'Sala / Comedor', largo: 5.00, ancho: 4.00, cant: 1 }
  ]);

  tipoMaterial = signal('Laminado AC4 8mm');
  acabado      = signal('Roble natural');
  desperdicio  = signal(10);
  con_subpiso  = signal(true);
  con_rodapie  = signal(true);

  areaNeta = computed(() =>
    this.tramos().reduce((s, t) => s + (t.largo||0)*(t.ancho||0)*(t.cant||1), 0)
  );

  areaPresupuestada = computed(() =>
    this.areaNeta() * (1 + (this.desperdicio()||0) / 100)
  );

  constructor() {
    effect(() => {
      this.parametersChange.emit({
        tramos: this.tramos(),
        tipoMaterial: this.tipoMaterial(),
        acabado: this.acabado(),
        desperdicio: this.desperdicio(),
        con_subpiso: this.con_subpiso(),
        con_rodapie: this.con_rodapie(),
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
    if (p.acabado)      this.acabado.set(p.acabado);
    if (p.desperdicio != null) this.desperdicio.set(p.desperdicio);
    if (p.con_subpiso != null) this.con_subpiso.set(p.con_subpiso);
    if (p.con_rodapie != null) this.con_rodapie.set(p.con_rodapie);
  }

  addTramo() {
    this.tramos.update(t => [...t, { descripcion: 'Ambiente', largo: 0, ancho: 0, cant: 1 }]);
  }

  removeTramo(i: number) {
    this.tramos.update(t => t.filter((_, idx) => idx !== i));
  }

  updateTramo(i: number, field: keyof TramoPiso, val: any) {
    this.tramos.update(t => t.map((x, idx) => idx === i ? { ...x, [field]: val } : x));
  }
}
