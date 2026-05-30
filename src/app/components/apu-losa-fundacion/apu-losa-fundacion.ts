import { Component, Input, Output, EventEmitter, signal, computed, effect, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

const PESO: Record<number, number> = { 2.67: 0.384, 3: 0.557, 4: 0.996, 5: 1.560, 6: 2.250, 8: 3.975 };
const DIAMS = [2.67, 3, 4, 5, 6, 8];

interface TramoLF { descripcion: string; largo: number; ancho: number; cant: number; }

@Component({
  selector: 'app-apu-losa-fundacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './apu-losa-fundacion.html',
  styles: [`
    .vbtn { border:1px solid var(--gray-border); background:var(--gray-3); color:var(--gray-muted); border-radius:4px; padding:3px 7px; font-size:11px; cursor:pointer; font-weight:600; }
    .vbtn.sel { background:var(--brand); color:#fff; border-color:var(--brand); }
  `]
})
export class ApuLosaFundacion implements OnInit, OnChanges {
  @Input() apuParameters: any;
  @Output() parametersChange = new EventEmitter<any>();

  readonly diams = DIAMS;

  tramos = signal<TramoLF[]>([{ descripcion: 'Platea principal', largo: 10.0, ancho: 8.0, cant: 1 }]);
  espesor = signal(20);
  fc      = signal(210);
  rec     = signal(7);
  desp    = signal(5);

  // Parrilla inferior
  dxi = signal(8); sxi = signal(15);
  dyi = signal(8); syi = signal(15);

  // Parrilla superior (malla doble)
  doble = signal(false);
  dxs   = signal(8); sxs = signal(20);
  dys   = signal(8); sys = signal(20);

  // Burros/silletas
  burros  = signal(true);
  dBurro  = signal(6);
  sBurroX = signal(80);
  sBurroY = signal(80);

  // Hormigón
  tipoVaciado = signal<'insitu' | 'premez'>('insitu');

  // Encofrado perimetral
  encOn = signal(true);
  encMetodoLf = signal<'madera' | 'tierra'>('madera');

  areaNeta  = computed(() => this.tramos().reduce((s, t) => s + (t.largo || 0) * (t.ancho || 0) * (t.cant || 1), 0));
  perimetro = computed(() => this.tramos().reduce((s, t) => s + 2 * ((t.largo || 0) + (t.ancho || 0)) * (t.cant || 1), 0));
  volNeto   = computed(() => this.areaNeta() * (this.espesor() / 100));
  volPres   = computed(() => this.volNeto() * (1 + this.desp() / 100));

  // kg/m² steel using area-based formula: bars/m * PESO * area
  kgInfX = computed(() => this.areaNeta() * (PESO[this.dxi()] || 0) * (100 / Math.max(1, this.sxi())));
  kgInfY = computed(() => this.areaNeta() * (PESO[this.dyi()] || 0) * (100 / Math.max(1, this.syi())));
  kgSupX = computed(() => this.doble() ? this.areaNeta() * (PESO[this.dxs()] || 0) * (100 / Math.max(1, this.sxs())) : 0);
  kgSupY = computed(() => this.doble() ? this.areaNeta() * (PESO[this.dys()] || 0) * (100 / Math.max(1, this.sys())) : 0);

  kgBurros = computed(() => {
    if (!this.burros() || !this.doble()) return 0;
    const nBurros = (this.areaNeta() / ((this.sBurroX() / 100) * (this.sBurroY() / 100)));
    const hBurro = (this.espesor() - 2 * this.rec()) / 100 * 1.2; // ~20% hook extra
    return nBurros * hBurro * (PESO[this.dBurro()] || 0);
  });

  kgTotal = computed(() => this.kgInfX() + this.kgInfY() + this.kgSupX() + this.kgSupY() + this.kgBurros());

  encofrado = computed(() => this.encOn() ? this.perimetro() * (this.espesor() / 100) : 0);

  private _firstEmit = false;

  constructor() {
    effect(() => {
      const p = {
        tramos: this.tramos(), espesor: this.espesor(), fc: this.fc(),
        rec: this.rec(), desp: this.desp(),
        dxi: this.dxi(), sxi: this.sxi(), dyi: this.dyi(), syi: this.syi(),
        doble: this.doble(),
        dxs: this.dxs(), sxs: this.sxs(), dys: this.dys(), sys: this.sys(),
        burros: this.burros(), dBurro: this.dBurro(), sBurroX: this.sBurroX(), sBurroY: this.sBurroY(),
        encOn: this.encOn(),
        tipoVaciado: this.tipoVaciado(),
        encMetodoLf: this.encMetodoLf(),
        cantidad_calculada: +this.volPres().toFixed(3),
      };
      if (!this._firstEmit) { this._firstEmit = true; return; }
      this.parametersChange.emit(p);
    });
  }

  ngOnInit() { if (this.apuParameters) this._load(); }
  ngOnChanges(c: SimpleChanges) { if (c['apuParameters'] && !c['apuParameters'].firstChange) this._load(); }

  private _load() {
    const p = this.apuParameters; if (!p) return;
    if (p.tramos)  this.tramos.set(p.tramos);
    if (p.espesor != null) this.espesor.set(+p.espesor);
    if (p.fc      != null) this.fc.set(p.fc);
    if (p.rec     != null) this.rec.set(p.rec);
    if (p.desp    != null) this.desp.set(p.desp);
    if (p.dxi != null) this.dxi.set(+p.dxi); if (p.sxi != null) this.sxi.set(+p.sxi);
    if (p.dyi != null) this.dyi.set(+p.dyi); if (p.syi != null) this.syi.set(+p.syi);
    if (p.doble != null) this.doble.set(p.doble === true || p.doble === 'true');
    if (p.dxs != null) this.dxs.set(+p.dxs); if (p.sxs != null) this.sxs.set(+p.sxs);
    if (p.dys != null) this.dys.set(+p.dys); if (p.sys != null) this.sys.set(+p.sys);
    if (p.burros  != null) this.burros.set(p.burros === true || p.burros === 'true');
    if (p.dBurro  != null) this.dBurro.set(+p.dBurro);
    if (p.sBurroX != null) this.sBurroX.set(+p.sBurroX);
    if (p.sBurroY != null) this.sBurroY.set(+p.sBurroY);
    
    
    if (p.encOn       != null) this.encOn.set(p.encOn === true || p.encOn === 'true');
    if (p.tipoVaciado) this.tipoVaciado.set(p.tipoVaciado);
    if (p.encMetodoLf) this.encMetodoLf.set(p.encMetodoLf);
  }

  addTramo() { this.tramos.update(t => [...t, { descripcion: 'Zona', largo: 0, ancho: 0, cant: 1 }]); }
  removeTramo(i: number) { this.tramos.update(t => t.filter((_, idx) => idx !== i)); }
  updateTramo(i: number, field: keyof TramoLF, val: any) {
    this.tramos.update(t => t.map((x, idx) => idx === i ? { ...x, [field]: val } : x));
  }

  labelDiam(d: number) { return d === 2.67 ? '¼"' : d === 3 ? '3/8"' : d === 4 ? '½"' : d === 5 ? '⅝"' : d === 6 ? '¾"' : '1"'; }
}
