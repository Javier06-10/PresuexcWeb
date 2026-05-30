import { Component, Input, Output, EventEmitter, signal, computed, effect, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface PuntoSanitario {
  descripcion: string;
  tipo: string;
  cantidad: number;
}

@Component({
  selector: 'app-apu-instalacion-sanitaria',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './apu-instalacion-sanitaria.html',

})
export class ApuInstalacionSanitaria implements OnInit, OnChanges {
  @Input() apuParameters: any;
  @Output() parametersChange = new EventEmitter<any>();

  readonly TIPOS = [
    'Agua potable fría',
    'Agua caliente',
    'Desagüe / Aguas servidas',
    'Aguas lluvias / Pluviales',
    'Ventilación sanitaria',
    'Rociador / Incendio',
    'Gas doméstico',
    'Riego / Jardín',
  ];

  puntos = signal<PuntoSanitario[]>([
    { descripcion: 'Puntos cocina', tipo: 'Agua potable fría', cantidad: 2 },
    { descripcion: 'Puntos baño principal', tipo: 'Agua potable fría', cantidad: 3 },
    { descripcion: 'Desagüe cocina', tipo: 'Desagüe / Aguas servidas', cantidad: 2 },
  ]);

  tipoTuberia        = signal('PVC');
  diametro           = signal('1/2"');
  incluye_accesorios = signal(true);
  incluye_mano_obra  = signal(true);

  totalPuntos = computed(() =>
    this.puntos().reduce((s, p) => s + (p.cantidad || 0), 0)
  );

  puntosByTipo(tipo: string): number {
    return this.puntos()
      .filter(p => p.tipo === tipo)
      .reduce((s, p) => s + (p.cantidad || 0), 0);
  }

  tiposConPuntos = computed(() =>
    this.TIPOS.filter(t => this.puntosByTipo(t) > 0)
  );

  constructor() {
    effect(() => {
      this.parametersChange.emit({
        puntos: this.puntos(),
        tipoTuberia: this.tipoTuberia(),
        diametro: this.diametro(),
        incluye_accesorios: this.incluye_accesorios(),
        incluye_mano_obra: this.incluye_mano_obra(),
        cantidad_calculada: this.totalPuntos(),
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
    if (p.puntos)      this.puntos.set(p.puntos);
    if (p.tipoTuberia) this.tipoTuberia.set(p.tipoTuberia);
    if (p.diametro)    this.diametro.set(p.diametro);
    if (p.incluye_accesorios != null) this.incluye_accesorios.set(p.incluye_accesorios);
    if (p.incluye_mano_obra  != null) this.incluye_mano_obra.set(p.incluye_mano_obra);
  }

  addPunto() {
    this.puntos.update(p => [...p, { descripcion: 'Puntos nuevos', tipo: this.TIPOS[0], cantidad: 1 }]);
  }

  removePunto(i: number) {
    this.puntos.update(p => p.filter((_, idx) => idx !== i));
  }

  updatePunto(i: number, field: keyof PuntoSanitario, val: any) {
    this.puntos.update(p => p.map((x, idx) => idx === i ? { ...x, [field]: val } : x));
  }
}
