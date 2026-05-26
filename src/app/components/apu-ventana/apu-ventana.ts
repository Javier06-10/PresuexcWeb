import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ItemVentana {
  descripcion: string;
  ancho: number;
  alto: number;
  cant: number;
  tipo: string;
}

@Component({
  selector: 'app-apu-ventana',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './apu-ventana.html',
})
export class ApuVentanaComponent implements OnInit, OnChanges {
  @Input() apuParameters: any = {};
  @Output() parametersChange = new EventEmitter<any>();

  items         = signal<ItemVentana[]>([]);
  conPersiana   = signal<boolean>(false);
  conMosquitero = signal<boolean>(false);

  totalUnidades = computed(() => this.items().reduce((s, i) => s + (i.cant||1), 0));
  totalArea     = computed(() => this.items().reduce((s, i) => s + (i.ancho||0)*(i.alto||0)*(i.cant||1), 0));

  constructor() {
    effect(() => {
      this.parametersChange.emit({
        ...this.apuParameters,
        items: this.items(),
        conPersiana: this.conPersiana(), conMosquitero: this.conMosquitero(),
        cantidad_calculada: this.totalArea(),
      });
    });
  }

  private _loadFromParams() {
    const p = this.apuParameters;
    if (p?.items?.length) this.items.set(p.items);
    else this.items.set([{ descripcion: 'Ventana sala', ancho: 1.20, alto: 1.00, cant: 1, tipo: 'Aluminio + vidrio 6mm' }]);
    if (p?.conPersiana   != null) this.conPersiana.set(p.conPersiana);
    if (p?.conMosquitero != null) this.conMosquitero.set(p.conMosquitero);
  }

  ngOnInit() { this._loadFromParams(); }
  ngOnChanges(changes: SimpleChanges) {
    if (changes['apuParameters'] && !changes['apuParameters'].firstChange) this._loadFromParams();
  }

  addItem()             { this.items.update(t => [...t, { descripcion: '', ancho: 1.20, alto: 1.00, cant: 1, tipo: 'Aluminio + vidrio 6mm' }]); }
  removeItem(i: number) { this.items.update(t => t.filter((_, idx) => idx !== i)); }
  updateItem(i: number, field: keyof ItemVentana, val: any) {
    this.items.update(t => { const c = [...t]; (c[i] as any)[field] = val; return c; });
  }
}
