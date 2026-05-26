import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ItemPuerta {
  descripcion: string;
  ancho: number;
  alto: number;
  cant: number;
  tipo: string;
}

@Component({
  selector: 'app-apu-puerta',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './apu-puerta.html',
})
export class ApuPuertaComponent implements OnInit, OnChanges {
  @Input() apuParameters: any = {};
  @Output() parametersChange = new EventEmitter<any>();

  items       = signal<ItemPuerta[]>([]);
  conMarco    = signal<boolean>(true);
  conCerrajeria = signal<boolean>(true);
  conPintura  = signal<boolean>(false);

  totalUnidades = computed(() => this.items().reduce((s, i) => s + (i.cant||1), 0));
  totalArea     = computed(() => this.items().reduce((s, i) => s + (i.ancho||0)*(i.alto||0)*(i.cant||1), 0));

  constructor() {
    effect(() => {
      this.parametersChange.emit({
        ...this.apuParameters,
        items: this.items(),
        conMarco: this.conMarco(), conCerrajeria: this.conCerrajeria(), conPintura: this.conPintura(),
        cantidad_calculada: this.totalUnidades(),
      });
    });
  }

  private _loadFromParams() {
    const p = this.apuParameters;
    if (p?.items?.length) this.items.set(p.items);
    else this.items.set([{ descripcion: 'Puerta principal', ancho: 0.90, alto: 2.10, cant: 1, tipo: 'Madera sólida' }]);
    if (p?.conMarco      != null) this.conMarco.set(p.conMarco);
    if (p?.conCerrajeria != null) this.conCerrajeria.set(p.conCerrajeria);
    if (p?.conPintura    != null) this.conPintura.set(p.conPintura);
  }

  ngOnInit() { this._loadFromParams(); }
  ngOnChanges(changes: SimpleChanges) {
    if (changes['apuParameters'] && !changes['apuParameters'].firstChange) this._loadFromParams();
  }

  addItem()             { this.items.update(t => [...t, { descripcion: '', ancho: 0.90, alto: 2.10, cant: 1, tipo: 'Madera sólida' }]); }
  removeItem(i: number) { this.items.update(t => t.filter((_, idx) => idx !== i)); }
  updateItem(i: number, field: keyof ItemPuerta, val: any) {
    this.items.update(t => { const c = [...t]; (c[i] as any)[field] = val; return c; });
  }
}
