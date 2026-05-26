import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface TramoAcera {
  descripcion: string;
  largo: number;
  ancho: number;
  cant: number;
}

@Component({
  selector: 'app-apu-acera',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './apu-acera.html',
})
export class ApuAceraComponent implements OnInit, OnChanges {
  @Input() apuParameters: any = {};
  @Output() parametersChange = new EventEmitter<any>();

  tramos      = signal<TramoAcera[]>([]);
  espesor     = signal<number>(0.10);
  tipoMezcla  = signal<string>('Hormigón 210 kg/cm²');
  conMalla    = signal<boolean>(true);
  desperdicio = signal<number>(5);

  areaNeta          = computed(() => this.tramos().reduce((s, t) => s + (t.largo||0)*(t.ancho||0)*(t.cant||1), 0));
  volumenNeto       = computed(() => this.areaNeta() * (this.espesor() || 0));
  areaPresupuestada = computed(() => this.areaNeta() * (1 + (this.desperdicio()||0)/100));
  volPresupuestado  = computed(() => this.volumenNeto() * (1 + (this.desperdicio()||0)/100));

  constructor() {
    effect(() => {
      this.parametersChange.emit({
        ...this.apuParameters,
        tramos: this.tramos(),
        espesor: this.espesor(),
        tipoMezcla: this.tipoMezcla(),
        conMalla: this.conMalla(),
        desperdicio: this.desperdicio(),
        cantidad_calculada: this.areaPresupuestada(),
      });
    });
  }

  private _loadFromParams() {
    const p = this.apuParameters;
    if (p?.tramos?.length) this.tramos.set(p.tramos);
    else this.tramos.set([{ descripcion: 'Acera frontal', largo: 0, ancho: 0, cant: 1 }]);
    if (p?.espesor != null)    this.espesor.set(p.espesor);
    if (p?.tipoMezcla)         this.tipoMezcla.set(p.tipoMezcla);
    if (p?.conMalla != null)   this.conMalla.set(p.conMalla);
    if (p?.desperdicio != null) this.desperdicio.set(p.desperdicio);
  }

  ngOnInit() { this._loadFromParams(); }
  ngOnChanges(c: SimpleChanges) {
    if (c['apuParameters'] && !c['apuParameters'].firstChange) this._loadFromParams();
  }

  addTramo() {
    this.tramos.update(t => [...t, { descripcion: '', largo: 0, ancho: 0, cant: 1 }]);
  }
  removeTramo(i: number) { this.tramos.update(t => t.filter((_, idx) => idx !== i)); }
  updateTramo(i: number, field: keyof TramoAcera, val: any) {
    this.tramos.update(t => { const c = [...t]; (c[i] as any)[field] = val; return c; });
  }
}
