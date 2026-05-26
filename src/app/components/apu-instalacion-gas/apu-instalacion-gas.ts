import { Component, Input, Output, EventEmitter, signal, computed, effect, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface PuntoGas {
  descripcion: string;
  tipo: string;
  cantidad: number;
}

@Component({
  selector: 'app-apu-instalacion-gas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './apu-instalacion-gas.html',
  styles: [``]
})
export class ApuInstalacionGas implements OnInit, OnChanges {
  @Input() apuParameters: any;
  @Output() parametersChange = new EventEmitter<any>();

  readonly TIPOS = [
    'Cocina / Estufa',
    'Calentador de agua',
    'Secadora de ropa',
    'Calefacción central',
    'Chimenea a gas',
    'Parrilla / BBQ exterior',
    'Generador',
    'Industrial / Comercial',
  ];

  puntos = signal<PuntoGas[]>([
    { descripcion: 'Cocina', tipo: 'Cocina / Estufa', cantidad: 1 },
    { descripcion: 'Calentador', tipo: 'Calentador de agua', cantidad: 1 },
  ]);

  tipoGas           = signal('GLP - Gas licuado (tanque)');
  diametro          = signal('1/2"');
  incluye_regulador = signal(true);
  incluye_prueba    = signal(true);
  incluye_medidor   = signal(false);

  totalPuntos = computed(() =>
    this.puntos().reduce((s, p) => s + (p.cantidad || 0), 0)
  );

  puntosByTipo(tipo: string): number {
    return this.puntos().filter(p => p.tipo === tipo).reduce((s, p) => s + (p.cantidad || 0), 0);
  }

  tiposConPuntos = computed(() =>
    this.TIPOS.filter(t => this.puntosByTipo(t) > 0)
  );

  private _firstEmit = false;

  constructor() {
    effect(() => {
      const params = {
        puntos: this.puntos(),
        tipoGas: this.tipoGas(),
        diametro: this.diametro(),
        incluye_regulador: this.incluye_regulador(),
        incluye_prueba: this.incluye_prueba(),
        incluye_medidor: this.incluye_medidor(),
        cantidad_calculada: this.totalPuntos(),
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
    if (p.puntos)    this.puntos.set(p.puntos);
    if (p.tipoGas)   this.tipoGas.set(p.tipoGas);
    if (p.diametro)  this.diametro.set(p.diametro);
    if (p.incluye_regulador != null) this.incluye_regulador.set(p.incluye_regulador);
    if (p.incluye_prueba    != null) this.incluye_prueba.set(p.incluye_prueba);
    if (p.incluye_medidor   != null) this.incluye_medidor.set(p.incluye_medidor);
  }

  addPunto() {
    this.puntos.update(p => [...p, { descripcion: 'Punto gas', tipo: this.TIPOS[0], cantidad: 1 }]);
  }

  removePunto(i: number) {
    this.puntos.update(p => p.filter((_, idx) => idx !== i));
  }

  updatePunto(i: number, field: keyof PuntoGas, val: any) {
    this.puntos.update(p => p.map((x, idx) => idx === i ? { ...x, [field]: val } : x));
  }
}
