import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface AparatoSanitario {
  descripcion: string;
  tipo: string;
  cantidad: number;
}

@Component({
  selector: 'app-apu-aparato-sanitario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './apu-aparato-sanitario.html',
})
export class ApuAparatoSanitarioComponent implements OnInit, OnChanges {
  @Input() apuParameters: any = {};
  @Output() parametersChange = new EventEmitter<any>();

  aparatos  = signal<AparatoSanitario[]>([]);
  incluye_accesorios = signal<boolean>(true);
  incluye_mano_obra  = signal<boolean>(true);

  totalUnidades = computed(() => this.aparatos().reduce((s, a) => s + (a.cantidad || 0), 0));

  readonly TIPOS = [
    'Inodoro / sanitario',
    'Lavabo / lavamanos',
    'Ducha / regadera',
    'Tina de baño',
    'Bidet',
    'Urinario',
    'Fregadero de cocina',
    'Lavaplatos / lavavajillas',
    'Lavandería / pila',
    'Trampa de piso',
    'Llave de paso',
    'Calentador de agua',
  ];

  constructor() {
    effect(() => {
      this.parametersChange.emit({
        ...this.apuParameters,
        aparatos: this.aparatos(),
        incluye_accesorios: this.incluye_accesorios(),
        incluye_mano_obra: this.incluye_mano_obra(),
        cantidad_calculada: this.totalUnidades(),
      });
    });
  }

  private _loadFromParams() {
    const p = this.apuParameters;
    if (p?.aparatos?.length) this.aparatos.set(p.aparatos);
    else this.aparatos.set([
      { descripcion: 'Baño principal', tipo: 'Inodoro / sanitario', cantidad: 1 },
      { descripcion: 'Baño principal', tipo: 'Lavabo / lavamanos', cantidad: 1 },
      { descripcion: 'Baño principal', tipo: 'Ducha / regadera', cantidad: 1 },
    ]);
    if (p?.incluye_accesorios != null) this.incluye_accesorios.set(p.incluye_accesorios);
    if (p?.incluye_mano_obra != null)  this.incluye_mano_obra.set(p.incluye_mano_obra);
  }

  ngOnInit() { this._loadFromParams(); }
  ngOnChanges(c: SimpleChanges) {
    if (c['apuParameters'] && !c['apuParameters'].firstChange) this._loadFromParams();
  }

  addAparato() {
    this.aparatos.update(a => [...a, { descripcion: '', tipo: 'Inodoro / sanitario', cantidad: 1 }]);
  }
  removeAparato(i: number) { this.aparatos.update(a => a.filter((_, idx) => idx !== i)); }
  updateAparato(i: number, field: keyof AparatoSanitario, val: any) {
    this.aparatos.update(a => { const c = [...a]; (c[i] as any)[field] = val; return c; });
  }
}
