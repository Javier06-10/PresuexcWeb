import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-apu-barrera-vapor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './apu-barrera-vapor.html',
  styleUrls: ['./apu-barrera-vapor.css'],
})
export class ApuBarreraVaporComponent implements OnInit, OnChanges {
  @Input() apuParameters: any = {};
  @Output() parametersChange = new EventEmitter<any>();

  // Membrana
  unidadPresupuesto = signal<string>('m2');       // m2 | ml | pie2 | pl
  tipoMembrana      = signal<string>('polietileno'); // polietileno | bituminosa | pvc | otro
  calibre           = signal<string>('6mil');
  imp               = signal<number>(5);

  // Rollo
  unidRollo   = signal<string>('m2');   // m2 | ml | pie2 | pl
  rolloLargo  = signal<number>(30);
  rolloAncho  = signal<number>(2);

  // Proyecto
  projLargo = signal<number>(12);
  projAncho = signal<number>(10);

  // MO
  modoCobroMO    = signal<string>('jornal'); // jornal | m2 | ml
  rendMO         = signal<number>(50);
  precioPorM2    = signal<number>(0);
  precioPorML    = signal<number>(0);
  showAvanzado   = signal<boolean>(false);
  instaladores   = signal<number>(2);
  ayudantes      = signal<number>(1);

  pu = signal<number>(0);

  setPu(e: Event) {
    const v = +(e.target as HTMLInputElement).value;
    if (!isNaN(v)) this.pu.set(v);
  }

  // ── Computeds ─────────────────────────────────────────────────────────────

  rendimientoRollo = computed(() => {
    const u  = this.unidRollo();
    const ll = this.rolloLargo() || 0;
    const la = this.rolloAncho() || 0;
    if (u === 'ml' || u === 'pl') return ll;         // linear units — no width
    return ll * la;                                   // area units
  });

  areaTotalM2 = computed(() => (this.projLargo() || 0) * (this.projAncho() || 0));

  areaPresupuestada = computed(() => this.areaTotalM2() * (1 + (this.imp() || 0) / 100));

  rollosExactos = computed(() => {
    const rend = this.rendimientoRollo();
    return rend > 0 ? this.areaPresupuestada() / rend : 0;
  });

  rollosAComprar = computed(() => Math.ceil(this.rollosExactos()));

  cantidad = computed(() => {
    const u = this.unidadPresupuesto();
    const a = this.areaPresupuestada();
    if (u === 'pie2') return a * 10.764;
    if (u === 'ml' || u === 'pl') return this.projLargo() + this.projAncho(); // simplified linear
    return a;
  });

  unidDisplay = computed(() => {
    const u = this.unidadPresupuesto();
    if (u === 'pie2') return 'pie²';
    if (u === 'ml')   return 'ml';
    if (u === 'pl')   return 'pl';
    return 'm²';
  });

  duracionMO = computed(() => {
    const rend = this.rendMO() || 0;
    return rend > 0 ? Math.ceil(this.areaTotalM2() / rend) : 0;
  });

  nombre_presupuesto = computed(() => 'Suministro e instalación de barrera de vapor');

  totalFinal = computed(() => this.pu() * this.cantidad());

  constructor() {
    effect(() => {
      this.parametersChange.emit({
        ...this.apuParameters,
        unidadPresupuesto: this.unidadPresupuesto(), tipoMembrana: this.tipoMembrana(),
        calibre: this.calibre(), imp: this.imp(),
        unidRollo: this.unidRollo(), rolloLargo: this.rolloLargo(), rolloAncho: this.rolloAncho(),
        projLargo: this.projLargo(), projAncho: this.projAncho(),
        modoCobroMO: this.modoCobroMO(), rendMO: this.rendMO(),
        precioPorM2: this.precioPorM2(), precioPorML: this.precioPorML(),
        showAvanzado: this.showAvanzado(), instaladores: this.instaladores(), ayudantes: this.ayudantes(),
        pu: this.pu(),
        cantidad_calculada: this.cantidad(),
        nombre_presupuesto: this.nombre_presupuesto(),
      });
    });
  }

  private _load() {
    const p = this.apuParameters;
    if (!p) return;
    if (p.unidadPresupuesto)      this.unidadPresupuesto.set(p.unidadPresupuesto);
    if (p.tipoMembrana)           this.tipoMembrana.set(p.tipoMembrana);
    if (p.calibre)                this.calibre.set(p.calibre);
    if (p.imp           != null)  this.imp.set(p.imp);
    if (p.unidRollo)              this.unidRollo.set(p.unidRollo);
    if (p.rolloLargo    != null)  this.rolloLargo.set(p.rolloLargo);
    if (p.rolloAncho    != null)  this.rolloAncho.set(p.rolloAncho);
    if (p.projLargo     != null)  this.projLargo.set(p.projLargo);
    if (p.projAncho     != null)  this.projAncho.set(p.projAncho);
    if (p.modoCobroMO)            this.modoCobroMO.set(p.modoCobroMO);
    if (p.rendMO        != null)  this.rendMO.set(p.rendMO);
    if (p.precioPorM2   != null)  this.precioPorM2.set(p.precioPorM2);
    if (p.precioPorML   != null)  this.precioPorML.set(p.precioPorML);
    if (p.showAvanzado  != null)  this.showAvanzado.set(p.showAvanzado);
    if (p.instaladores  != null)  this.instaladores.set(p.instaladores);
    if (p.ayudantes     != null)  this.ayudantes.set(p.ayudantes);
    if (p.pu            != null)  this.pu.set(p.pu);
  }

  ngOnInit()    { this._load(); }
  ngOnChanges(changes: SimpleChanges) {
    if (changes['apuParameters'] && !changes['apuParameters'].firstChange) this._load();
  }
}
