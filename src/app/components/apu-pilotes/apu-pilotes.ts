import { Component, Input, Output, EventEmitter, signal, computed, effect, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

const PESO: Record<number, number> = { 2.67: 0.384, 3: 0.557, 4: 0.996, 5: 1.560, 6: 2.250, 8: 3.975 };
const DIAMS = [2.67, 3, 4, 5, 6, 8];
const WASTE: Record<string, number> = { seco: 1.05, cam_rec: 1.08, cam_perd: 1.05, lodo: 1.15 };

@Component({
  selector: 'app-apu-pilotes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './apu-pilotes.html',
  styles: [`
    .vbtn { border:1px solid var(--gray-border); background:var(--gray-3); color:var(--gray-muted); border-radius:4px; padding:3px 7px; font-size:11px; cursor:pointer; font-weight:600; }
    .vbtn.sel { background:var(--brand); color:#fff; border-color:var(--brand); }
    .tipo-btn { border:1px solid var(--gray-border); background:var(--gray-3); color:var(--gray-muted); border-radius:6px; padding:5px 10px; font-size:11px; cursor:pointer; font-weight:600; white-space:nowrap; }
    .tipo-btn.sel { background:var(--brand); color:#fff; border-color:var(--brand); }
  `]
})
export class ApuPilotes implements OnInit, OnChanges {
  @Input() apuParameters: any;
  @Output() parametersChange = new EventEmitter<any>();

  readonly diams = DIAMS;
  readonly tipos = ['perforado', 'helice', 'franki', 'micropilote', 'prefab', 'acero'];
  readonly metodos = [
    { key: 'seco',     label: 'En seco (+5%)' },
    { key: 'cam_rec',  label: 'Camisa recup. (+8%)' },
    { key: 'cam_perd', label: 'Camisa perdida (+5%)' },
    { key: 'lodo',     label: 'Lodo bentonita (+15%)' },
  ];

  tipo    = signal('perforado');
  D       = signal(0.40);
  L       = signal(8.00);
  cant    = signal(1);
  fc      = signal(250);
  metodo  = signal('seco');
  sobre   = signal(0.20);
  rec     = signal(7);
  ljaula  = signal(7.00);
  anclaje = signal(0.50);

  // Longitudinal steel
  along = signal(8);
  nLong = signal(6);

  // Stirrups
  azun = signal(6);
  paso = signal(20);

  // Complementarias
  descOn    = signal(false); descCant    = signal(1);
  pruebaOn  = signal(false); pruebaTipo  = signal('estática'); pruebaCant = signal(1);
  movilizaOn = signal(false); movilizaCant = signal(1);

  // Computed
  volTeoUnit = computed(() => Math.PI * this.D() * this.D() / 4 * this.L());
  wasteFactor = computed(() => WASTE[this.metodo()] || 1.05);
  volPresUnit = computed(() => this.volTeoUnit() * this.wasteFactor());
  volTotal    = computed(() => this.volPresUnit() * this.cant());

  nucleo    = computed(() => Math.max(0.01, this.D() - 2 * (this.rec() / 100)));
  vueltas   = computed(() => (this.ljaula() * 100) / Math.max(1, this.paso()));
  kgLong    = computed(() => this.nLong() * (this.L() + this.anclaje()) * (PESO[this.along()] || 0));
  kgZun     = computed(() => this.vueltas() * Math.PI * this.nucleo() * (PESO[this.azun()] || 0));
  kgTotal   = computed(() => (this.kgLong() + this.kgZun()) * this.cant());

  longTotal   = computed(() => this.L() * this.cant());

  private _firstEmit = false;

  constructor() {
    effect(() => {
      const p = {
        tipo: this.tipo(), D: this.D(), L: this.L(), cant: this.cant(),
        fc: this.fc(), metodo: this.metodo(), sobre: this.sobre(), rec: this.rec(),
        ljaula: this.ljaula(), anclaje: this.anclaje(),
        along: this.along(), nLong: this.nLong(),
        azun: this.azun(), paso: this.paso(),
        descOn: this.descOn(), descCant: this.descCant(),
        pruebaOn: this.pruebaOn(), pruebaTipo: this.pruebaTipo(), pruebaCant: this.pruebaCant(),
        movilizaOn: this.movilizaOn(), movilizaCant: this.movilizaCant(),
        cantidad_calculada: +this.longTotal().toFixed(2),
      };
      if (!this._firstEmit) { this._firstEmit = true; return; }
      this.parametersChange.emit(p);
    });
  }

  ngOnInit() { if (this.apuParameters) this._load(); }
  ngOnChanges(c: SimpleChanges) { if (c['apuParameters'] && !c['apuParameters'].firstChange) this._load(); }

  private _load() {
    const p = this.apuParameters; if (!p) return;
    if (p.tipo)    this.tipo.set(p.tipo);
    if (p.D       != null) this.D.set(p.D);
    if (p.L       != null) this.L.set(p.L);
    if (p.cant    != null) this.cant.set(p.cant);
    if (p.fc      != null) this.fc.set(p.fc);
    if (p.metodo) this.metodo.set(p.metodo);
    if (p.sobre   != null) this.sobre.set(p.sobre);
    if (p.rec     != null) this.rec.set(p.rec);
    if (p.ljaula  != null) this.ljaula.set(p.ljaula);
    if (p.anclaje != null) this.anclaje.set(p.anclaje);
    if (p.along   != null) this.along.set(p.along);
    if (p.nLong   != null) this.nLong.set(p.nLong);
    if (p.azun    != null) this.azun.set(p.azun);
    if (p.paso    != null) this.paso.set(p.paso);
    if (p.descOn  != null) this.descOn.set(p.descOn);
    if (p.descCant != null) this.descCant.set(p.descCant);
    if (p.pruebaOn != null) this.pruebaOn.set(p.pruebaOn);
    if (p.pruebaTipo) this.pruebaTipo.set(p.pruebaTipo);
    if (p.pruebaCant != null) this.pruebaCant.set(p.pruebaCant);
    if (p.movilizaOn != null) this.movilizaOn.set(p.movilizaOn);
    if (p.movilizaCant != null) this.movilizaCant.set(p.movilizaCant);
  }

  labelDiam(d: number) { return d === 2.67 ? '¼"' : d === 3 ? '3/8"' : d === 4 ? '½"' : d === 5 ? '⅝"' : d === 6 ? '¾"' : '1"'; }
  labelTipo(t: string) {
    const m: Record<string, string> = {
      perforado: 'Perforado', helice: 'Hélice continua', franki: 'Franki',
      micropilote: 'Micropilote', prefab: 'Prefabricado', acero: 'Perfil de acero',
    };
    return m[t] || t;
  }
}
