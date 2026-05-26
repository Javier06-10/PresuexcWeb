import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ZonaFumigacion {
  descripcion: string;
  largo: number;
  ancho: number;
}

@Component({
  selector: 'app-apu-fumigacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './apu-fumigacion.html',
  styleUrls: ['./apu-fumigacion.css'],
})
export class ApuFumigacionComponent implements OnInit, OnChanges {
  @Input() apuParameters: any = {};
  @Output() parametersChange = new EventEmitter<any>();

  zonas           = signal<ZonaFumigacion[]>([]);
  tipoTratamiento = signal<string>('Termitida preventiva');
  producto        = signal<string>('Clorpirifos emulsionable');
  dosis           = signal<number>(0.05);
  dilusion        = signal<number>(100);
  fumigadores     = signal<number>(2);
  ayudantes       = signal<number>(1);

  areaTotal       = computed(() => this.zonas().reduce((s, z) => s + (z.largo||0)*(z.ancho||0), 0));
  volumenProducto = computed(() => this.areaTotal() * (this.dosis()||0));
  volumenDiluido  = computed(() => this.volumenProducto() * (this.dilusion()||1));

  constructor() {
    effect(() => {
      this.parametersChange.emit({
        ...this.apuParameters,
        zonas: this.zonas(), tipoTratamiento: this.tipoTratamiento(),
        producto: this.producto(), dosis: this.dosis(), dilusion: this.dilusion(),
        fumigadores: this.fumigadores(), ayudantes: this.ayudantes(),
        cantidad_calculada: this.areaTotal(),
      });
    });
  }

  private _loadFromParams() {
    const p = this.apuParameters;
    if (p?.zonas?.length) this.zonas.set(p.zonas);
    else this.zonas.set([{ descripcion: 'Área de tratamiento', largo: 0, ancho: 0 }]);
    if (p?.tipoTratamiento)       this.tipoTratamiento.set(p.tipoTratamiento);
    if (p?.producto)              this.producto.set(p.producto);
    if (p?.dosis       != null)   this.dosis.set(p.dosis);
    if (p?.dilusion    != null)   this.dilusion.set(p.dilusion);
    if (p?.fumigadores != null)   this.fumigadores.set(p.fumigadores);
    if (p?.ayudantes   != null)   this.ayudantes.set(p.ayudantes);
  }

  ngOnInit() { this._loadFromParams(); }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['apuParameters'] && !changes['apuParameters'].firstChange) {
      this._loadFromParams();
    }
  }

  addZona()              { this.zonas.update(z => [...z, { descripcion:'', largo:0, ancho:0 }]); }
  removeZona(i: number)  { this.zonas.update(z => z.filter((_,idx) => idx !== i)); }
  updateZona(i: number, field: keyof ZonaFumigacion, val: any) {
    this.zonas.update(z => { const c=[...z]; (c[i] as any)[field]=val; return c; });
  }
}
