import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface TramoCloset {
  descripcion: string;
  ancho: number;
  alto: number;
  puertas: number;
  cant: number;
}

@Component({
  selector: 'app-apu-closet',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './apu-closet.html',
})
export class ApuClosetComponent implements OnInit, OnChanges {
  @Input() apuParameters: any = {};
  @Output() parametersChange = new EventEmitter<any>();

  tramos         = signal<TramoCloset[]>([]);
  tipoMaterial   = signal<string>('MDF enchapado 18mm');
  incluye_rieles = signal<boolean>(true);
  incluye_espejo = signal<boolean>(false);
  acabado        = signal<string>('Melamínico blanco');

  areaTotal    = computed(() => this.tramos().reduce((s, t) => s + (t.ancho||0)*(t.alto||0)*(t.cant||1), 0));
  totalClosets = computed(() => this.tramos().reduce((s, t) => s + (t.cant||1), 0));
  totalPuertas = computed(() => this.tramos().reduce((s, t) => s + (t.puertas||0)*(t.cant||1), 0));

  constructor() {
    effect(() => {
      this.parametersChange.emit({
        ...this.apuParameters,
        tramos: this.tramos(),
        tipoMaterial: this.tipoMaterial(),
        incluye_rieles: this.incluye_rieles(),
        incluye_espejo: this.incluye_espejo(),
        acabado: this.acabado(),
        cantidad_calculada: this.areaTotal(),
      });
    });
  }

  private _loadFromParams() {
    const p = this.apuParameters;
    if (p?.tramos?.length) this.tramos.set(p.tramos);
    else this.tramos.set([{ descripcion: 'Closet dormitorio principal', ancho: 2.40, alto: 2.40, puertas: 3, cant: 1 }]);
    if (p?.tipoMaterial)        this.tipoMaterial.set(p.tipoMaterial);
    if (p?.incluye_rieles != null) this.incluye_rieles.set(p.incluye_rieles);
    if (p?.incluye_espejo != null) this.incluye_espejo.set(p.incluye_espejo);
    if (p?.acabado)             this.acabado.set(p.acabado);
  }

  ngOnInit() { this._loadFromParams(); }
  ngOnChanges(c: SimpleChanges) {
    if (c['apuParameters'] && !c['apuParameters'].firstChange) this._loadFromParams();
  }

  addTramo() {
    this.tramos.update(t => [...t, { descripcion: '', ancho: 1.80, alto: 2.40, puertas: 2, cant: 1 }]);
  }
  removeTramo(i: number) { this.tramos.update(t => t.filter((_, idx) => idx !== i)); }
  updateTramo(i: number, field: keyof TramoCloset, val: any) {
    this.tramos.update(t => { const c = [...t]; (c[i] as any)[field] = val; return c; });
  }
}
