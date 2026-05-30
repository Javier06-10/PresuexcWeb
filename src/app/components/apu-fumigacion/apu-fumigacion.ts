import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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

  // Área
  modoArea    = signal<'dim' | 'm2'>('dim');
  largo       = signal<number>(12);
  ancho       = signal<number>(10);
  areaDirecta = signal<number>(120);
  unidadCobro = signal<string>('m2'); // m2 | pa | pie2

  // Producto
  tipoProducto  = signal<string>('frasco'); // frasco | litro | galon
  nFrascos      = signal<number>(1);
  litros        = signal<number>(4);
  galones       = signal<number>(1);
  factorDilucion = signal<number>(4);

  // Bomba
  tipoBomba = signal<string>('manual4');
  capBomba  = signal<number>(15);
  rendBomba = signal<number>(40);

  // MO
  fumigadores = signal<number>(1);
  ayudantes   = signal<number>(1);
  impMO       = signal<number>(5);
  impMat      = signal<number>(5);

  imp = signal<number>(5);
  pu  = signal<number>(0);

  setPu(e: Event) {
    const v = +(e.target as HTMLInputElement).value;
    if (!isNaN(v)) this.pu.set(v);
  }

  // ── Computeds ─────────────────────────────────────────────────────────────

  areaTotal = computed(() => {
    if (this.modoArea() === 'm2') return this.areaDirecta() || 0;
    return (this.largo() || 0) * (this.ancho() || 0);
  });

  nBombas = computed(() => {
    const r = this.rendBomba();
    return r > 0 ? Math.ceil(this.areaTotal() / r) : 0;
  });

  productLitros = computed(() => {
    const tp = this.tipoProducto();
    if (tp === 'litro')  return this.litros() || 0;
    if (tp === 'galon')  return (this.galones() || 0) * 3.785;
    return this.nFrascos() || 0; // 1 frasco ≈ 1 L of concentrate
  });

  solucionTotal = computed(() => this.productLitros() * (1 + (this.factorDilucion() || 1)));

  cantidad = computed(() => {
    const u = this.unidadCobro();
    if (u === 'pie2') return this.areaTotal() * 10.764;
    if (u === 'pa')   return 1;
    return this.areaTotal();
  });

  unidDisplay = computed(() => {
    const u = this.unidadCobro();
    if (u === 'pie2') return 'pie²';
    if (u === 'pa')   return 'P.A.';
    return 'm²';
  });

  nombre_presupuesto = computed(() => 'Fumigación anticomején y control de plagas');

  totalFinal = computed(() => this.pu() * this.cantidad() * (1 + this.imp() / 100));

  constructor() {
    effect(() => {
      this.parametersChange.emit({
        ...this.apuParameters,
        modoArea: this.modoArea(), largo: this.largo(), ancho: this.ancho(),
        areaDirecta: this.areaDirecta(), unidadCobro: this.unidadCobro(),
        tipoProducto: this.tipoProducto(), nFrascos: this.nFrascos(),
        litros: this.litros(), galones: this.galones(), factorDilucion: this.factorDilucion(),
        tipoBomba: this.tipoBomba(), capBomba: this.capBomba(), rendBomba: this.rendBomba(),
        fumigadores: this.fumigadores(), ayudantes: this.ayudantes(),
        impMO: this.impMO(), impMat: this.impMat(), imp: this.imp(), pu: this.pu(),
        cantidad_calculada: this.cantidad(),
        nombre_presupuesto: this.nombre_presupuesto(),
      });
    });
  }

  private _load() {
    const p = this.apuParameters;
    if (!p) return;
    if (p.modoArea)           this.modoArea.set(p.modoArea);
    if (p.largo       != null) this.largo.set(p.largo);
    if (p.ancho       != null) this.ancho.set(p.ancho);
    if (p.areaDirecta != null) this.areaDirecta.set(p.areaDirecta);
    if (p.unidadCobro)        this.unidadCobro.set(p.unidadCobro);
    if (p.tipoProducto)       this.tipoProducto.set(p.tipoProducto);
    if (p.nFrascos    != null) this.nFrascos.set(p.nFrascos);
    if (p.litros      != null) this.litros.set(p.litros);
    if (p.galones     != null) this.galones.set(p.galones);
    if (p.factorDilucion != null) this.factorDilucion.set(p.factorDilucion);
    if (p.tipoBomba)          this.tipoBomba.set(p.tipoBomba);
    if (p.capBomba    != null) this.capBomba.set(p.capBomba);
    if (p.rendBomba   != null) this.rendBomba.set(p.rendBomba);
    if (p.fumigadores != null) this.fumigadores.set(p.fumigadores);
    if (p.ayudantes   != null) this.ayudantes.set(p.ayudantes);
    if (p.impMO       != null) this.impMO.set(p.impMO);
    if (p.impMat      != null) this.impMat.set(p.impMat);
    if (p.imp         != null) this.imp.set(p.imp);
    if (p.pu          != null) this.pu.set(p.pu);
  }

  ngOnInit()    { this._load(); }
  ngOnChanges(changes: SimpleChanges) {
    if (changes['apuParameters'] && !changes['apuParameters'].firstChange) this._load();
  }

  onTipoBombaChange() {
    const presets: Record<string, number> = {
      manual2: 7.5, manual3: 11, manual4: 15, manual5: 19, mochila20: 20, motorizada: 37
    };
    const cap = presets[this.tipoBomba()];
    if (cap) this.capBomba.set(cap);
  }
}
