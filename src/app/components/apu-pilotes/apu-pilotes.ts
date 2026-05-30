import { Component, Input, Output, EventEmitter, signal, computed, effect, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

const PESO: Record<number, number> = { 2.67: 0.384, 3: 0.557, 4: 0.996, 5: 1.560, 6: 2.250, 8: 3.975 };
const DIAMS = [2.67, 3, 4, 5, 6, 8];
const WASTE: Record<string, number> = { seco: 1.05, cam_rec: 1.08, cam_perd: 1.05, lodo: 1.15 };

interface ApuRow {
  no: number;
  desc: string;
  qty: number;
  unit: string;
  factor: number;
  puKey: string;
  costo: number;
  fuente: string;
}

@Component({
  selector: 'app-apu-pilotes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './apu-pilotes.html',
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

  nombre = signal('Pilotes de hormigón');
  activo = signal(true);
  showApu = signal(false);

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

  // APU specific
  apuUnit = signal<'ml' | 'und' | 'm3'>('ml');
  imp = signal(5);
  cuadrillaOn = signal(false);
  rend = signal(6);
  qOperador = signal(1);
  qAyudante = signal(3);
  qFierrero = signal(2);
  qCapataz = signal(1);

  precios = signal<Record<string, number>>({
    hormigon: 0, acero: 0, alambre: 0, camisa: 0, bentonita: 0, agua: 0,
    mo_jornal: 0, equipo_perforacion: 0, bomba_hormigon: 0, grua: 0,
    prefab: 0, acero_tubular: 0
  });

  setPrecio(k: string, e: Event) {
    const v = +(e.target as HTMLInputElement).value;
    if (!isNaN(v)) this.precios.update(p => ({ ...p, [k]: v }));
  }

  labelDiam(d: number): string {
    const map: Record<number,string> = { 2.67:'5/16"', 3:'3/8"', 4:'1/2"', 5:'5/8"', 6:'3/4"', 8:'1"' };
    return map[d] || `${d}`;
  }

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

  // Circular cross-section diagram
  sectionDiagram = computed(() => {
    const VW = 160, VH = 160, cx = VW / 2, cy = VH / 2;
    const D = Math.max(this.D(), 0.1);
    const r = 62;
    const recM = (this.rec() || 0) / 100;
    const recRatio = Math.min(recM / (D / 2), 0.3);
    const ir = r * (1 - recRatio);
    const n = Math.max(4, Math.min(this.nLong(), 20));
    const bars: {x: number, y: number}[] = Array.from({ length: n }, (_, i) => {
      const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
      return { x: cx + ir * Math.cos(angle), y: cy + ir * Math.sin(angle) };
    });
    return { cx, cy, r, ir, bars,
      labelD: (D * 100).toFixed(0) + ' cm',
      labelRec: this.rec() + ' cm rec.',
    };
  });

  svgZoom = signal<number>(1);
  onSvgWheel(e: WheelEvent) {
    e.preventDefault();
    this.svgZoom.update(z => Math.min(4, Math.max(0.3, +(z - e.deltaY * 0.001).toFixed(3))));
  }

  isInsitu = computed(() => ['perforado', 'helice', 'franki', 'micropilote'].includes(this.tipo()));
  isJaula = computed(() => this.tipo() !== 'acero');

  camisaMl = computed(() => (this.isInsitu() && (this.metodo() === 'cam_rec' || this.metodo() === 'cam_perd')) ? this.longTotal() : 0);
  aguaLodo = computed(() => (this.isInsitu() && this.metodo() === 'lodo') ? (Math.PI*this.D()*this.D()/4 * this.longTotal() * 1.1) : 0);
  bentonitaKg = computed(() => this.aguaLodo() * 50);

  apuData = computed(() => {
    const P = this.precios();
    const pr = (k: string) => P[k] || 0;
    
    const count = Math.max(this.apuUnit() === 'ml' ? this.longTotal() : (this.apuUnit() === 'm3' ? this.volTotal() : this.cant()), 0.0001);
    const N = this.cant();
    const lmlTot = this.longTotal();

    const eqHrTot = (this.apuUnit() === 'und') ? (N*(8/Math.max(this.rend(), 0.001))) : (lmlTot/Math.max(this.rend(), 0.001));

    const hormUnit = this.isInsitu() ? (this.volTotal()/count) : 0;
    const aceroUnit = this.isJaula() ? ((this.kgLong() + this.kgZun()) * N / count) : 0;
    const alambreUnit = this.isJaula() ? (aceroUnit * 0.05) : 0;
    const camisaUnit = this.camisaMl() / count;
    const benUnit = this.bentonitaKg() / count;
    const aguaUnit = this.aguaLodo() / count;
    const prefabUnit = N / count;
    const aceroSumUnit = lmlTot / count;
    const eqUnit = eqHrTot / count;

    let no = 1;
    const mk = (desc: string, qty: number, unit: string, factor: number, puKey: string, fuente: string): ApuRow => ({
      no: no++, desc, qty, unit, factor, puKey, costo: qty * factor * pr(puKey), fuente
    });

    const sec1: ApuRow[] = [];
    if (this.isInsitu()) sec1.push(mk(`Hormigón f'c ${this.fc()}`, hormUnit, 'M³', 1.10, 'hormigon', 'Hormigón'));
    else if (this.tipo() === 'prefab') sec1.push(mk(`Pilote prefabricado`, prefabUnit, 'UND', 1.07, 'prefab', 'Proveedor'));
    else if (this.tipo() === 'acero') sec1.push(mk(`Tubo / perfil acero`, aceroSumUnit, 'ML', 1.07, 'acero_tubular', 'Acero'));

    if (this.isJaula()) {
      sec1.push(mk('Acero de jaula', aceroUnit, 'KG', 1.07, 'acero', 'Acero'));
      sec1.push(mk('Alambre de amarre', alambreUnit, 'KG', 1.07, 'alambre', 'Materiales'));
    }
    if (camisaUnit > 0 && this.metodo() === 'cam_perd') sec1.push(mk('Camisa metálica perdida', camisaUnit, 'ML', 1.07, 'camisa', 'Acero'));
    if (benUnit > 0) {
      sec1.push(mk('Bentonita para lodo', benUnit, 'KG', 1.07, 'bentonita', 'Materiales'));
      sec1.push(mk('Agua para lodo', aguaUnit, 'M³', 1.10, 'agua', 'Materiales'));
    }
    const subI = sec1.reduce((s, r) => s + r.costo, 0);

    const sec2: ApuRow[] = [];
    if (this.cuadrillaOn()) {
      const div = count / N;
      if (this.qOperador() > 0) sec2.push(mk('Operador de equipo', this.qOperador()/div, 'JOR', 1.05, 'mo_jornal', 'M.O.'));
      if (this.qAyudante() > 0) sec2.push(mk('Ayudantes', this.qAyudante()/div, 'JOR', 1.05, 'mo_jornal', 'M.O.'));
      if (this.isJaula() && this.qFierrero() > 0) sec2.push(mk('Fierrero', this.qFierrero()/div, 'JOR', 1.05, 'mo_jornal', 'M.O.'));
      if (this.qCapataz() > 0) sec2.push(mk('Capataz', this.qCapataz()/div, 'JOR', 1.05, 'mo_jornal', 'M.O.'));
    } else {
      sec2.push(mk('Cuadrilla de pilotaje', 1.000, this.apuUnit().toUpperCase(), 1.05, 'mo_jornal', 'M.O.'));
      if (this.isJaula()) sec2.push(mk('M.O. armado jaula', aceroUnit, 'KG', 1.05, 'mo_jornal', 'M.O.'));
    }
    const subII = sec2.reduce((s, r) => s + r.costo, 0);

    const sec3: ApuRow[] = [];
    sec3.push(mk(this.isInsitu() ? 'Equipo de perforación' : 'Equipo de hincado', eqUnit, 'HR', 1.05, 'equipo_perforacion', 'Equipo'));
    if (this.tipo() === 'helice') sec3.push(mk('Bomba de hormigón', eqUnit, 'HR', 1.05, 'bomba_hormigon', 'Equipo'));
    if (this.isInsitu() && this.metodo() === 'cam_rec') sec3.push(mk('Oscilador / camisa', eqUnit, 'HR', 1.05, 'equipo_perforacion', 'Equipo'));
    if (this.isInsitu() && this.metodo() === 'lodo') sec3.push(mk('Planta de lodo', eqUnit, 'HR', 1.05, 'equipo_perforacion', 'Equipo'));
    sec3.push(mk('Grúa de servicio', eqUnit * 0.5, 'HR', 1.05, 'grua', 'Equipo'));
    const subIII = sec3.reduce((s, r) => s + r.costo, 0);

    const totalBase = subI + subII + subIII;
    const totalFinal = totalBase * (1 + (this.imp() || 0) / 100);
    return { sec1, sec2, sec3, subI, subII, subIII, totalBase, totalFinal };
  });

  constructor() {
    effect(() => {
      this.parametersChange.emit({
        nombre: this.nombre(), activo: this.activo(),
        tipo: this.tipo(), D: this.D(), L: this.L(), cant: this.cant(),
        fc: this.fc(), metodo: this.metodo(), sobre: this.sobre(), rec: this.rec(),
        ljaula: this.ljaula(), anclaje: this.anclaje(),
        along: this.along(), nLong: this.nLong(),
        azun: this.azun(), paso: this.paso(),
        descOn: this.descOn(), descCant: this.descCant(),
        pruebaOn: this.pruebaOn(), pruebaTipo: this.pruebaTipo(), pruebaCant: this.pruebaCant(),
        movilizaOn: this.movilizaOn(), movilizaCant: this.movilizaCant(),
        apuUnit: this.apuUnit(), imp: this.imp(), cuadrillaOn: this.cuadrillaOn(), rend: this.rend(),
        qOperador: this.qOperador(), qAyudante: this.qAyudante(), qFierrero: this.qFierrero(), qCapataz: this.qCapataz(),
        precios: this.precios(),
        cantidad_calculada: +this.longTotal().toFixed(2),
      });
    });
  }

  ngOnInit() { if (this.apuParameters) this._load(); }
  ngOnChanges(c: SimpleChanges) { if (c['apuParameters'] && !c['apuParameters'].firstChange) this._load(); }

  private _load() {
    const p = this.apuParameters; if (!p) return;
    if (p.nombre != null) this.nombre.set(p.nombre);
    if (p.activo != null) this.activo.set(p.activo);
    if (p.tipo    != null) this.tipo.set(p.tipo);
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
    if (p.descOn  != null) this.descOn.set(p.descOn === true || p.descOn === 'true');
    if (p.descCant != null) this.descCant.set(+p.descCant);
    if (p.pruebaOn != null) this.pruebaOn.set(p.pruebaOn === true || p.pruebaOn === 'true');
    if (p.pruebaTipo) this.pruebaTipo.set(p.pruebaTipo);
    if (p.pruebaCant != null) this.pruebaCant.set(+p.pruebaCant);
    if (p.movilizaOn != null) this.movilizaOn.set(p.movilizaOn === true || p.movilizaOn === 'true');
    if (p.movilizaCant != null) this.movilizaCant.set(+p.movilizaCant);
    if (p.apuUnit) this.apuUnit.set(p.apuUnit);
    if (p.imp != null) this.imp.set(p.imp);
    if (p.cuadrillaOn != null) this.cuadrillaOn.set(p.cuadrillaOn);
    if (p.rend != null) this.rend.set(p.rend);
    if (p.qOperador != null) this.qOperador.set(p.qOperador);
    if (p.qAyudante != null) this.qAyudante.set(p.qAyudante);
    if (p.qFierrero != null) this.qFierrero.set(p.qFierrero);
    if (p.qCapataz != null) this.qCapataz.set(p.qCapataz);
    if (p.precios) this.precios.set({ ...this.precios(), ...p.precios });
  }

  labelTipo(t: string) {
    const m: Record<string, string> = {
      perforado: 'Perforado', helice: 'Hélice continua', franki: 'Franki',
      micropilote: 'Micropilote', prefab: 'Prefabricado', acero: 'Perfil de acero',
    };
    return m[t] || t;
  }
}
