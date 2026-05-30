import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

const PESO: Record<number, number> = { 2.67: 0.384, 3: 0.557, 4: 0.996, 5: 1.560, 6: 2.250, 8: 3.975, 9: 5.06, 10: 6.404, 11: 7.907 };
const DIAMS = [2.67, 3, 4, 5, 6, 8, 9, 10, 11];
const DOSIF: Record<number, {cem: number, arena: number, grava: number}> = {
  210: {cem: 7.0, arena: 0.54, grava: 0.85},
  250: {cem: 8.0, arena: 0.50, grava: 0.80},
  280: {cem: 9.0, arena: 0.48, grava: 0.76},
  350: {cem: 11.0, arena: 0.44, grava: 0.72},
};

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

export interface Tramo {
  descripcion: string;
  largo: number; // Para columna esto es la Altura (H), para viga es Largo (L)
  cant: number;
}

@Component({
  selector: 'app-apu-hormigon-colviga',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './apu-hormigon-colviga.html',
})
export class ApuHormigonColvigaComponent implements OnInit, OnChanges {
  @Input() apuParameters: any = {};
  @Output() parametersChange = new EventEmitter<any>();

  readonly diams   = DIAMS;
  readonly fcs     = [210, 250, 280, 350];
  readonly lbarras = [6.10, 9.15, 12.0];
  readonly Math    = Math;

  // UI State
  isEditing = signal(false);
  cvShape = signal<'rect'|'circ'|'tee'|'ibeam'>('rect');
  cvKind = signal<'columna'|'viga'>('columna');

  nombre = signal('Columna o Viga');
  activo = signal(true);
  showApu = signal(false);

  tramos = signal<Tramo[]>([{ descripcion: 'Elemento principal', largo: 3.0, cant: 1 }]);
  
  // Geometria General
  B = signal(0.20);
  H = signal(0.40);
  D = signal(0.40); // circular
  bf = signal(0.40); bw = signal(0.20); Hs = signal(0.40); // T o I

  desperdicio = signal<number>(10);
  tipoVaciado = signal<string>('In situ 1:2:3');
  fc          = signal<number>(210);

  modoArmado = signal<'simple' | 'tramos'>('simple'); // 'simple' o 'tramos' (avanzado)

  // Acero Longitudinal (4 capas simples)
  al1 = signal<number>(4); cv1 = signal<number>(4);
  al2 = signal<number>(0); cv2 = signal<number>(0);
  al3 = signal<number>(0); cv3 = signal<number>(0);
  al4 = signal<number>(0); cv4 = signal<number>(0);

  // Recubrimiento y Gancho
  rec = signal<number>(3); // en cm
  lg  = signal<number>(8); // en cm
  lbarra = signal<number>(6.10);

  // Acero Transversal (Estribos)
  at    = signal<number>(3); // diametro estribo
  sep1  = signal<number>(15); // separacion simple

  // Modo avanzado estribos
  sep1av = signal<number>(10); lz1 = signal<number>(0.50);
  sep2av = signal<number>(20);
  sep3av = signal<number>(10); lz3 = signal<number>(0.50);

  // Encofrado
  encMetodo = signal<'madera' | 'tierra' | 'sin'>('madera');
  encofModo = signal<'englobado'|'desglosado'>('englobado');
  encofM2PU = signal<number>(250); // PU manual cuando es englobado

  // Encofrado Desglosado
  madTipo = signal<'plywood' | 'tabla'>('plywood');
  madEsp = signal('0.75');
  madRefuerzo = signal<'si' | 'no'>('si');
  madSepc = signal(0.60);
  madUsos = signal(3);
  madDesp = signal(15);

  imp           = signal<number>(5);
  cuadrillaOn   = signal<boolean>(false);
  qConcretero   = signal<number>(2);
  qFierrero     = signal<number>(2);
  qCarpintero   = signal<number>(1);
  qCapataz      = signal<number>(1);

  precios = signal<Record<string, number>>({
    acero: 0, alambre: 0, cemento: 0, arena: 0, grava: 0, agua: 0,
    hormigon: 0, encofrado: 0,
    mo_kg: 0, mo_m2: 0, mo_und: 0, jornal: 0,
    mezcladora: 0, vibrador: 0,
    plywood: 0, tabla: 0, cuarton: 0
  });

  setPrecio(k: string, e: Event) {
    const v = +(e.target as HTMLInputElement).value;
    if (!isNaN(v)) this.precios.update(p => ({ ...p, [k]: v }));
  }

  labelDiam(d: number): string {
    const map: Record<number,string> = { 2.67:'5/16"', 3:'3/8"', 4:'1/2"', 5:'5/8"', 6:'3/4"', 8:'1"', 9:'1 1/8"', 10:'1 1/4"', 11:'1 3/8"' };
    return map[d] || `${d}`;
  }

  cvPick(shape: 'rect'|'circ'|'tee'|'ibeam') {
    this.cvShape.set(shape);
    // Auto-scroll logic if needed
  }

  cvPickKind(kind: 'columna'|'viga') {
    this.cvKind.set(kind);
    this.isEditing.set(true);
    if (kind === 'viga') this.nombre.set('Viga de Hormigón Armado');
    else this.nombre.set('Columna de Hormigón Armado');
  }

  cvBackToPick() {
    this.isEditing.set(false);
  }

  addTramo() {
    this.tramos.update(t => [...t, { descripcion: 'Tramo', largo: 3.0, cant: 1 }]);
  }
  removeTramo(i: number) {
    this.tramos.update(t => {
      const arr = [...t]; arr.splice(i, 1); return arr;
    });
  }
  updateTramo(i: number, field: keyof Tramo, value: any) {
    this.tramos.update(t => {
      const arr = [...t];
      arr[i] = { ...arr[i], [field]: value };
      return arr;
    });
  }

  // === CALCULOS ===
  longTotal = computed(() => this.tramos().reduce((s, t) => s + (t.largo||0), 0));
  
  areaSec = computed(() => {
    const s = this.cvShape();
    if (s === 'rect') return (this.B()||0) * (this.H()||0);
    if (s === 'circ') return Math.PI * Math.pow((this.D()||0)/2, 2);
    if (s === 'tee') return (this.bf()||0)*0.10 + (this.bw()||0)*((this.Hs()||0)-0.10); // aprox
    if (s === 'ibeam') return (this.bf()||0)*0.20 + (this.bw()||0)*((this.Hs()||0)-0.20);
    return 0;
  });

  volumenNeto = computed(() => {
    const A = this.areaSec();
    return this.tramos().reduce((s, t) => s + A * (t.largo||0) * (t.cant||1), 0);
  });

  volumenPresupuestado = computed(() => this.volumenNeto() * (1 + (this.desperdicio()||0) / 100));

  private traslape = (d: number) => 50 * (d / 8) * 0.0254;

  private calcKgLong(al: number, cv: number) {
    const peso = PESO[al] || 0;
    if (!al || !cv || !peso) return 0;
    const tsl = this.traslape(al);
    return this.tramos().reduce((s, t) => s + (t.cant||1) * cv * ((t.largo||0) + tsl) * peso, 0);
  }

  kgLong1 = computed(() => this.calcKgLong(this.al1(), this.cv1()));
  kgLong2 = computed(() => this.calcKgLong(this.al2(), this.cv2()));
  kgLong3 = computed(() => this.calcKgLong(this.al3(), this.cv3()));
  kgLong4 = computed(() => this.calcKgLong(this.al4(), this.cv4()));

  kgEst = computed(() => {
    const recM = (this.rec()||0) / 100;
    const s = this.cvShape();
    let perEst = 0;
    if (s === 'rect') {
      const bEf = Math.max(0, (this.B()||0) - 2*recM);
      const hEf = Math.max(0, (this.H()||0) - 2*recM);
      perEst = 2*(bEf + hEf) + 0.16; // ganchos
    } else if (s === 'circ') {
      const dEf = Math.max(0, (this.D()||0) - 2*recM);
      perEst = Math.PI * dEf + 0.16;
    } else {
      const bEf = Math.max(0, (this.bf()||0) - 2*recM);
      const hEf = Math.max(0, (this.Hs()||0) - 2*recM);
      perEst = 2*(bEf + hEf) + 0.16;
    }

    const peso = PESO[this.at()] || 0;
    
    return this.tramos().reduce((sTotal, t) => {
      const L = t.largo || 0;
      let nEst = 0;
      if (this.modoArmado() === 'simple' || this.cvKind() === 'columna') {
         nEst = Math.ceil(L * 100 / Math.max(1, this.sep1())) + 1;
      } else {
         const lz1v = this.lz1(), lz3v = this.lz3();
         const lz2v = Math.max(0, L - lz1v - lz3v);
         nEst = Math.ceil(lz1v*100 / Math.max(1, this.sep1av()))
              + Math.ceil(lz2v*100 / Math.max(1, this.sep2av()))
              + Math.ceil(lz3v*100 / Math.max(1, this.sep3av())) + 1;
      }
      return sTotal + (t.cant||1) * nEst * perEst * peso;
    }, 0);
  });

  kgTotal   = computed(() => this.kgLong1() + this.kgLong2() + this.kgLong3() + this.kgLong4() + this.kgEst());
  kgAlambre = computed(() => this.kgTotal() * 0.05);

  // === SVG SECCIÓN TRANSVERSAL ===
  readonly fcPsi: Record<number,number> = { 210:2986, 250:3556, 280:3983, 350:4978 };

  cvSvgScale = computed(() => {
    const s = this.cvShape();
    const dim = s === 'rect' ? Math.max(this.B(), this.H(), 0.1) : Math.max(this.D(), 0.1);
    return Math.min(150 / dim, 1500);
  });

  cvBarPts = computed((): {x:number;y:number;c:string;label:string}[] => {
    const sc = this.cvSvgScale();
    const CX = 110, CY = 110;
    const recPx = Math.max((this.rec() / 100) * sc, 4);
    const BR = 4;
    const pts: {x:number;y:number;c:string;label:string}[] = [];

    if (this.cvShape() === 'circ') {
      const rEf = Math.max((this.D() / 2) * sc - recPx - BR, 5);
      const N = Math.max(this.cv1(), 0);
      for (let i = 0; i < N; i++) {
        const a = (2 * Math.PI * i / Math.max(N, 1)) - Math.PI / 2;
        pts.push({ x: CX + rEf * Math.cos(a), y: CY + rEf * Math.sin(a), c: '#185fa5', label: '' });
      }
    } else {
      const hw = this.B() * sc / 2, hh = this.H() * sc / 2;
      const lft = CX - hw + recPx + BR, rgt = CX + hw - recPx - BR;
      const top = CY - hh + recPx + BR, btm = CY + hh - recPx - BR;
      const n1 = Math.max(this.cv1(), 0);
      for (let i = 0; i < n1; i++) {
        const x = n1 > 1 ? lft + (rgt - lft) * i / (n1 - 1) : (lft + rgt) / 2;
        pts.push({ x, y: top, c: '#185fa5', label: i === 0 ? 'Sup' : '' });
      }
      const n2 = Math.max(this.cv2(), 0);
      for (let i = 0; i < n2; i++) {
        const x = n2 > 1 ? lft + (rgt - lft) * i / (n2 - 1) : (lft + rgt) / 2;
        pts.push({ x, y: btm, c: '#d85a30', label: i === 0 ? 'Inf' : '' });
      }
      const n3 = Math.max(this.cv3(), 0);
      const nL = Math.ceil(n3 / 2), nR = Math.floor(n3 / 2);
      for (let i = 0; i < nL; i++) {
        const y = top + (btm - top) * (i + 1) / (nL + 1);
        pts.push({ x: lft, y, c: '#9a7b1e', label: '' });
      }
      for (let i = 0; i < nR; i++) {
        const y = top + (btm - top) * (i + 1) / (nR + 1);
        pts.push({ x: rgt, y, c: '#9a7b1e', label: '' });
      }
      const n4 = Math.max(this.cv4(), 0);
      for (let i = 0; i < n4; i++) {
        const x = n4 > 1 ? lft + (rgt - lft) * (i + 1) / (n4 + 1) : (lft + rgt) / 2;
        const y = i % 2 === 0 ? top + (btm - top) / 3 : top + 2 * (btm - top) / 3;
        pts.push({ x, y, c: '#8B4513', label: '' });
      }
    }
    return pts;
  });

  perimetroEnc = computed(() => {
    const s = this.cvShape();
    if (s === 'rect') return 2 * ((this.B()||0) + (this.H()||0));
    if (s === 'circ') return Math.PI * (this.D()||0);
    if (s === 'tee') return 2 * ((this.bf()||0) + (this.Hs()||0));
    return 2 * ((this.bf()||0) + (this.Hs()||0));
  });

  encofradoM2 = computed(() => {
    if (this.encMetodo() === 'sin') return 0;
    const P = this.perimetroEnc();
    return this.tramos().reduce((s, t) => s + P * (t.largo||0) * (t.cant||1), 0);
  });

  madTablas = computed(() => {
    if (this.encMetodo() !== 'madera' || this.encofModo() !== 'desglosado') return 0;
    const area = this.encofradoM2() * (1 + this.madDesp() / 100);
    const m2Tablero = 2.972896; // 4x8 pies
    return Math.ceil(area / m2Tablero);
  });

  madCuartones = computed(() => {
    if (this.encMetodo() !== 'madera' || this.encofModo() !== 'desglosado' || this.madRefuerzo() === 'no') return 0;
    const sumP = this.tramos().reduce((s, t) => s + this.perimetroEnc() * (t.cant||1), 0);
    const cpc = Math.ceil(sumP / this.madSepc());
    return Math.ceil(cpc * (1 + this.madDesp() / 100));
  });

  dosifPorM3 = computed(() => DOSIF[this.fc()] || DOSIF[210]);

  apuData = computed(() => {
    const V = this.volumenPresupuestado();
    if (V <= 0) return null;
    const P = this.precios();
    const pr = (k: string) => P[k] || 0;
    const isInsitu = this.tipoVaciado().startsWith('In situ');
    const encOn = this.encMetodo() === 'madera';
    const encDesglosado = encOn && this.encofModo() === 'desglosado';

    const kgL1v = this.al1() && this.cv1() ? this.kgLong1() / V : 0;
    const kgL2v = this.al2() && this.cv2() ? this.kgLong2() / V : 0;
    const kgL3v = this.al3() && this.cv3() ? this.kgLong3() / V : 0;
    const kgL4v = this.al4() && this.cv4() ? this.kgLong4() / V : 0;
    const kgEv  = this.kgEst() / V;
    const kgAv  = this.kgAlambre() / V;
    const kgTv  = this.kgTotal() / V;
    const encM2v = this.encofradoM2() / V;

    let no = 1;
    const mk = (desc: string, qty: number, unit: string, factor: number, puKey: string, fuente: string, puManual?: number): ApuRow => ({
      no: no++, desc, qty, unit, factor, puKey, costo: qty * factor * (puManual !== undefined ? puManual : pr(puKey)), fuente
    });

    const sec1: ApuRow[] = [];
    if (kgL1v > 0) sec1.push(mk(`Ac. ${this.labelDiam(this.al1())} Long.1`, kgL1v, 'KG', 1.07, 'acero', 'Acero'));
    if (kgL2v > 0) sec1.push(mk(`Ac. ${this.labelDiam(this.al2())} Long.2`, kgL2v, 'KG', 1.07, 'acero', 'Acero'));
    if (kgL3v > 0) sec1.push(mk(`Ac. ${this.labelDiam(this.al3())} Long.3`, kgL3v, 'KG', 1.07, 'acero', 'Acero'));
    if (kgL4v > 0) sec1.push(mk(`Ac. ${this.labelDiam(this.al4())} Long.4`, kgL4v, 'KG', 1.07, 'acero', 'Acero'));
    sec1.push(mk(`Estribo ${this.labelDiam(this.at())}`, kgEv, 'KG', 1.07, 'acero', 'Acero'));
    sec1.push(mk('Alambre de amarre', kgAv, 'KG', 1.07, 'alambre', 'Materiales'));
    
    if (isInsitu) {
      const d = this.dosifPorM3();
      sec1.push(mk(`Cemento (f'c ${this.fc()})`, d.cem, 'SACO', 1.10, 'cemento', 'Materiales'));
      sec1.push(mk('Arena',  d.arena, 'M³', 1.10, 'arena', 'Materiales'));
      sec1.push(mk('Grava',  d.grava, 'M³', 1.10, 'grava', 'Materiales'));
      sec1.push(mk('Agua',   185,     'LTS', 1.10, 'agua',  'Materiales'));
    } else {
      sec1.push(mk(`Hormigón premezclado f'c ${this.fc()}`, 1.00, 'M³', 1.05, 'hormigon', 'Materiales'));
    }

    if (encOn) {
      if (encDesglosado) {
         sec1.push(mk(`Madera ${this.madTipo()}`, this.madTablas()/V, 'UND', 1.0, this.madTipo(), 'Encofrado'));
         if (this.madRefuerzo()==='si') sec1.push(mk('Cuartones de refuerzo', this.madCuartones()/V, 'UND', 1.0, 'cuarton', 'Encofrado'));
      } else {
         sec1.push(mk('Encofrado (suministro, clavos, desmoldeante)', encM2v, 'M²', 1.0, 'encofrado', 'Encofrado', this.encofM2PU()));
      }
    }
    const subI = sec1.reduce((s, r) => s + r.costo, 0);

    const sec2: ApuRow[] = [];
    if (!this.cuadrillaOn()) {
      sec2.push(mk('Colocación de acero', kgTv, 'KG', 1.05, 'mo_kg', 'M.O.'));
      if (encOn) sec2.push(mk('Armado de encofrado', encM2v, 'M²', 1.05, 'mo_m2', 'M.O.'));
      sec2.push(mk('Vaciado de hormigón', 1.00, 'M³', 1.05, 'mo_und', 'M.O.'));
    } else {
      sec2.push(mk('Concretero', this.qConcretero() / V, 'JOR', 1.00, 'jornal', 'M.O.'));
      sec2.push(mk('Fierrero', this.qFierrero() / V, 'JOR', 1.00, 'jornal', 'M.O.'));
      if (encOn) sec2.push(mk('Carpintero', this.qCarpintero() / V, 'JOR', 1.00, 'jornal', 'M.O.'));
      sec2.push(mk('Capataz', this.qCapataz() / V, 'JOR', 1.00, 'jornal', 'M.O.'));
    }
    const subII = sec2.reduce((s, r) => s + r.costo, 0);

    const sec3: ApuRow[] = [];
    if (isInsitu) {
      sec3.push(mk('Mezcladora', 1 / 12, 'HR', 1.00, 'mezcladora', 'Equipo'));
      sec3.push(mk('Vibrador', 1 / 12, 'HR', 1.00, 'vibrador', 'Equipo'));
    }
    const subIII = sec3.reduce((s, r) => s + r.costo, 0);

    const totalBase  = subI + subII + subIII;
    const totalFinal = totalBase * (1 + (this.imp() || 0) / 100);
    return { sec1, sec2, sec3, subI, subII, subIII, totalBase, totalFinal };
  });

  sumArray = computed(() => { const d = this.apuData(); if (!d) return []; return [...d.sec1, ...d.sec2, ...d.sec3]; });

  sectionDiagram = computed(() => {
    // Generar un SVG basico de la seccion dependiendo del Shape
    // Se retorna info para el template
    return { type: this.cvShape() }; 
  });

  constructor() {
    effect(() => {
      this.parametersChange.emit({
        nombre: this.nombre(), activo: this.activo(), showApu: this.showApu(),
        cvShape: this.cvShape(), cvKind: this.cvKind(),
        tramos: this.tramos(),
        B: this.B(), H: this.H(), D: this.D(), bf: this.bf(), bw: this.bw(), Hs: this.Hs(),
        desperdicio: this.desperdicio(), tipoVaciado: this.tipoVaciado(), fc: this.fc(),
        modoArmado: this.modoArmado(),
        al1: this.al1(), cv1: this.cv1(), al2: this.al2(), cv2: this.cv2(),
        al3: this.al3(), cv3: this.cv3(), al4: this.al4(), cv4: this.cv4(),
        rec: this.rec(), at: this.at(), sep1: this.sep1(),
        sep1av: this.sep1av(), sep2av: this.sep2av(), sep3av: this.sep3av(),
        lz1: this.lz1(), lz3: this.lz3(),
        encMetodo: this.encMetodo(), encofModo: this.encofModo(), encofM2PU: this.encofM2PU(),
        imp: this.imp(), precios: this.precios(),
        cantidad_calculada: +this.volumenPresupuestado().toFixed(3),
        encofrado_m2: +this.encofradoM2().toFixed(2),
        acero_kg: +this.kgTotal().toFixed(1),
      });
    });
  }

  ngOnInit() { this._load(); }
  ngOnChanges(c: SimpleChanges) {
    if (c['apuParameters'] && !c['apuParameters'].firstChange) this._load();
  }
  
  private _load() {
    const p = this.apuParameters; if (!p) return;
    if (p.nombre != null) this.nombre.set(p.nombre);
    if (p.cvShape) this.cvShape.set(p.cvShape);
    if (p.cvKind) this.cvKind.set(p.cvKind);
    if (p.isEditing != null) this.isEditing.set(p.isEditing);
    if (p.tramos) this.tramos.set(p.tramos);
    if (p.B) this.B.set(p.B);
    if (p.H) this.H.set(p.H);
    if (p.D) this.D.set(p.D);
    if (p.bf) this.bf.set(p.bf);
    if (p.bw) this.bw.set(p.bw);
    if (p.Hs) this.Hs.set(p.Hs);
    if (p.desperdicio != null) this.desperdicio.set(p.desperdicio);
    if (p.fc) this.fc.set(p.fc);
  }
}
