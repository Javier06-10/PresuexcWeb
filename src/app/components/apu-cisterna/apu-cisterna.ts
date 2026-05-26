import { Component, Input, Output, EventEmitter, signal, computed, effect, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface UnidadCisterna {
  descripcion: string;
  largo: number;
  ancho: number;
  profundidad: number;
  cant: number;
}

@Component({
  selector: 'app-apu-cisterna',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './apu-cisterna.html',
  styles: [``]
})
export class ApuCisterna implements OnInit, OnChanges {
  @Input() apuParameters: any;
  @Output() parametersChange = new EventEmitter<any>();

  cisternas = signal<UnidadCisterna[]>([
    { descripcion: 'Cisterna principal', largo: 3.00, ancho: 2.00, profundidad: 1.50, cant: 1 }
  ]);

  tipoMaterial          = signal('Hormigón armado f\'c=210');
  con_tapa              = signal(true);
  con_impermeabilizacion = signal(true);
  con_bomba             = signal(false);

  volumenTotal = computed(() =>
    this.cisternas().reduce((s, c) => s + (c.largo||0)*(c.ancho||0)*(c.profundidad||0)*(c.cant||1), 0)
  );

  totalUnidades = computed(() =>
    this.cisternas().reduce((s, c) => s + (c.cant||1), 0)
  );

  private _firstEmit = false;

  constructor() {
    effect(() => {
      const params = {
        cisternas: this.cisternas(),
        tipoMaterial: this.tipoMaterial(),
        con_tapa: this.con_tapa(),
        con_impermeabilizacion: this.con_impermeabilizacion(),
        con_bomba: this.con_bomba(),
        cantidad_calculada: +this.volumenTotal().toFixed(3),
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
    if (p.cisternas)     this.cisternas.set(p.cisternas);
    if (p.tipoMaterial)  this.tipoMaterial.set(p.tipoMaterial);
    if (p.con_tapa != null)               this.con_tapa.set(p.con_tapa);
    if (p.con_impermeabilizacion != null) this.con_impermeabilizacion.set(p.con_impermeabilizacion);
    if (p.con_bomba != null)              this.con_bomba.set(p.con_bomba);
  }

  addCisterna() {
    this.cisternas.update(c => [...c, { descripcion: 'Cisterna', largo: 0, ancho: 0, profundidad: 0, cant: 1 }]);
  }

  removeCisterna(i: number) {
    this.cisternas.update(c => c.filter((_, idx) => idx !== i));
  }

  updateCisterna(i: number, field: keyof UnidadCisterna, val: any) {
    this.cisternas.update(c => c.map((x, idx) => idx === i ? { ...x, [field]: val } : x));
  }
}
