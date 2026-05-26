import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface PuntoElectrico {
  descripcion: string;
  tipo: string;
  cantidad: number;
}

@Component({
  selector: 'app-apu-instalacion-electrica',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './apu-instalacion-electrica.html',
})
export class ApuInstalacionElectricaComponent implements OnInit, OnChanges {
  @Input() apuParameters: any = {};
  @Output() parametersChange = new EventEmitter<any>();

  puntos         = signal<PuntoElectrico[]>([]);
  tipoInstalacion = signal<string>('110V residencial');
  calibre         = signal<string>('12 AWG');

  totalPuntos = computed(() => this.puntos().reduce((s, p) => s + (p.cantidad || 0), 0));

  readonly TIPOS = [
    'Tomacorriente simple 110V',
    'Tomacorriente doble 110V',
    'Tomacorriente 220V',
    'Apagador simple',
    'Apagador doble',
    'Apagador tres vías',
    'Luminaria / foco empotrado',
    'Luminaria de techo',
    'Punto de TV / cable',
    'Punto de datos / red',
    'Breaker / disyuntor',
    'Caja de distribución',
    'Salida especial (A/C)',
    'Timbre / intercomunicador',
  ];

  constructor() {
    effect(() => {
      this.parametersChange.emit({
        ...this.apuParameters,
        puntos: this.puntos(),
        tipoInstalacion: this.tipoInstalacion(),
        calibre: this.calibre(),
        cantidad_calculada: this.totalPuntos(),
      });
    });
  }

  private _loadFromParams() {
    const p = this.apuParameters;
    if (p?.puntos?.length) this.puntos.set(p.puntos);
    else this.puntos.set([
      { descripcion: 'Sala / comedor', tipo: 'Tomacorriente doble 110V', cantidad: 4 },
      { descripcion: 'Sala / comedor', tipo: 'Apagador simple', cantidad: 2 },
      { descripcion: 'Sala / comedor', tipo: 'Luminaria de techo', cantidad: 2 },
    ]);
    if (p?.tipoInstalacion) this.tipoInstalacion.set(p.tipoInstalacion);
    if (p?.calibre)         this.calibre.set(p.calibre);
  }

  ngOnInit() { this._loadFromParams(); }
  ngOnChanges(c: SimpleChanges) {
    if (c['apuParameters'] && !c['apuParameters'].firstChange) this._loadFromParams();
  }

  addPunto() {
    this.puntos.update(p => [...p, { descripcion: '', tipo: 'Tomacorriente doble 110V', cantidad: 1 }]);
  }
  removePunto(i: number) { this.puntos.update(p => p.filter((_, idx) => idx !== i)); }
  updatePunto(i: number, field: keyof PuntoElectrico, val: any) {
    this.puntos.update(p => { const c = [...p]; (c[i] as any)[field] = val; return c; });
  }

  puntosBy(tipo: string): number {
    return this.puntos()
      .filter(p => p.tipo === tipo)
      .reduce((s, p) => s + (p.cantidad || 0), 0);
  }
}
