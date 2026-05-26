import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface TramoContrapiso {
  descripcion: string;
  largo: number;
  ancho: number;
  cant: number;
}

@Component({
  selector: 'app-apu-contrapiso',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './apu-contrapiso.html',
})
export class ApuContrapisoComponent implements OnInit, OnChanges {
  @Input() apuParameters: any = {};
  @Output() parametersChange = new EventEmitter<any>();

  tramos    = signal<TramoContrapiso[]>([]);
  espesor   = signal<number>(0.07);
  tipoMezcla = signal<string>('1:3 (cemento:arena)');
  conMalla  = signal<boolean>(false);
  desperdicio = signal<number>(5);

  areaNeta             = computed(() => this.tramos().reduce((s, t) => s + (t.largo||0)*(t.ancho||0)*(t.cant||1), 0));
  volumenNeto          = computed(() => this.areaNeta() * (this.espesor()||0));
  areaPresupuestada    = computed(() => this.areaNeta() * (1 + (this.desperdicio()||0)/100));
  volumenPresupuestado = computed(() => this.volumenNeto() * (1 + (this.desperdicio()||0)/100));

  constructor() {
    effect(() => {
      this.parametersChange.emit({
        ...this.apuParameters,
        tramos: this.tramos(), espesor: this.espesor(),
        tipoMezcla: this.tipoMezcla(), conMalla: this.conMalla(), desperdicio: this.desperdicio(),
        cantidad_calculada: this.areaPresupuestada(),
      });
    });
  }

  private _loadFromParams() {
    const p = this.apuParameters;
    if (p?.tramos?.length) this.tramos.set(p.tramos);
    else this.tramos.set([{ descripcion: 'Planta baja', largo: 0, ancho: 0, cant: 1 }]);
    if (p?.espesor     != null) this.espesor.set(p.espesor);
    if (p?.tipoMezcla)           this.tipoMezcla.set(p.tipoMezcla);
    if (p?.conMalla    != null) this.conMalla.set(p.conMalla);
    if (p?.desperdicio != null) this.desperdicio.set(p.desperdicio);
  }

  ngOnInit() { this._loadFromParams(); }
  ngOnChanges(changes: SimpleChanges) {
    if (changes['apuParameters'] && !changes['apuParameters'].firstChange) this._loadFromParams();
  }

  addTramo()             { this.tramos.update(t => [...t, { descripcion: '', largo: 0, ancho: 0, cant: 1 }]); }
  removeTramo(i: number) { this.tramos.update(t => t.filter((_, idx) => idx !== i)); }
  updateTramo(i: number, field: keyof TramoContrapiso, val: any) {
    this.tramos.update(t => { const c = [...t]; (c[i] as any)[field] = val; return c; });
  }
}
