import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface TramoLosa { id: number; largo: number; ancho: number; }
export interface MaderaEnc { id: number; tipo: string; ancho: number; largo: number; desp: number; custom: boolean; }

const PESO: Record<string, number> = { '2.67': 0.384, '3': 0.557, '4': 0.996, '5': 1.560, '6': 2.250, '8': 3.975 };

const MAD_CAT: Record<string, any> = {
  pino: { nombre: 'Pino (tablero)', kind: 'tablero', precio: 650, factor: 1.0 },
  ply: { nombre: 'Plywood', kind: 'tablero', precio: 1200, factor: 1.0 },
  local: { nombre: 'Madera local', kind: 'tablero', precio: 500, factor: 1.0 },
  cuarton: { nombre: 'Cuartón 2"×4"', kind: 'lineal', precio: 280, factor: 1.2 },
  regla: { nombre: 'Regla 1"×3"', kind: 'lineal', precio: 140, factor: 0.8 },
  alfajia: { nombre: 'Alfajía 2"×2"', kind: 'lineal', precio: 200, factor: 0.9 },
};

const DECK_CAT: Record<string, any> = {
  '1.5pulg': { peso: 7.5, peralte: 0.038 },
  '2pulg': { peso: 8.5, peralte: 0.051 },
  '3pulg': { peso: 10.2, peralte: 0.076 },
};

const MALLA_PESO: Record<string, number> = { d4: 1.07, d5: 1.55, d6: 2.23 };

const PERFIL_CAT: Record<string, any> = {
  'W8x10': { peso: 14.88 },
  'W10x12': { peso: 17.86 },
  'W12x16': { peso: 23.81 },
};

const PERNO_PESO: Record<string, number> = {
  '0.5': 0.10,
  '0.625': 0.15,
  '0.75': 0.23,
  '0.875': 0.30,
};

function mk(desc: string, qty: number, unit: string, factor: number, source: string, cat: string) {
  return { desc, qty, unit, factor, source, cat };
}

@Component({
  selector: 'app-apu-hormigon-losa',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './apu-hormigon-losa.html',
})
export class ApuHormigonLosaComponent implements OnInit, OnChanges {
  @Input() apuParameters: any = {};
  @Output() parametersChange = new EventEmitter<any>();

  readonly diams = ['2.67', '3', '4', '5', '6', '8'];
  labelDiam(d: string): string {
    const map: Record<string,string> = { '2.67':'5/16"', '3':'3/8"', '4':'1/2"', '5':'5/8"', '6':'3/4"', '8':'1"' };
    return map[d] || d;
  }
  madCat = MAD_CAT;

  readonly matAligeranteCat = [
    { key: 'foam',    nombre: 'Foam / EPS',         desc: 'Bloques de espuma rígida — el más usado en losas aligeradas.' },
    { key: 'bloque',  nombre: 'Bloque de hormigón', desc: 'Bloques huecos de hormigón prefabricado.' },
    { key: 'caseton', nombre: 'Casetón plástico',   desc: 'Moldes recuperables de plástico resistente.' },
  ];
  readonly perfilCat = Object.entries(PERFIL_CAT).map(([key, val]: [string, any]) => ({ key, peso: val.peso }));
  readonly deckCat = [
    { key: '1.5pulg', nombre: 'Losacero 1.5"', desc: 'Peralte 38 mm · 7.5 kg/m²', peso: 7.5 },
    { key: '2pulg',   nombre: 'Losacero 2"',   desc: 'Peralte 51 mm · 8.5 kg/m²', peso: 8.5 },
    { key: '3pulg',   nombre: 'Losacero 3"',   desc: 'Peralte 76 mm · 10.2 kg/m²', peso: 10.2 },
  ];

  matActivo = computed(() => this.matAligeranteCat.find(m => m.key === this.lavMatTipo()) ?? this.matAligeranteCat[0]);

  // Picker
  tipoLosa = signal<'nervada' | 'maciza' | 'losacero' | 'prefabricada' | null>(null);

  // ==================== NERVADA ====================
  lavEspesor = signal(0.20);
  lavArea = signal(20);
  lavAreaModo = signal<'directo' | 'tramos'>('directo');
  lavTramos = signal<TramoLosa[]>([]);
  
  lavViguetaModo = signal<'simple' | 'avanzado'>('simple');
  lavVxBase = signal(0.10); lavVyBase = signal(0.10);
  
  lavDat = signal('2.67'); lavSep = signal(20); lavEstf = signal('cerrado');
  lavNSupA = signal(2); lavDSupA = signal('3'); lavNSupB = signal(0); lavDSupB = signal('3');
  lavNMedA = signal(0); lavDMedA = signal('3'); lavNMedB = signal(0); lavDMedB = signal('3');
  lavNInfA = signal(2); lavDInfA = signal('3'); lavNInfB = signal(0); lavDInfB = signal('3');
  
  lavDatY = signal('2.67'); lavSepY = signal(20); lavEstfY = signal('cerrado');
  lavNSupAY = signal(2); lavDSupAY = signal('3'); lavNSupBY = signal(0); lavDSupBY = signal('3');
  lavNMedAY = signal(0); lavDMedAY = signal('3'); lavNMedBY = signal(0); lavDMedBY = signal('3');
  lavNInfAY = signal(2); lavDInfAY = signal('3'); lavNInfBY = signal(0); lavDInfBY = signal('3');

  lavMatTipo = signal('foam');
  lavFb = signal(40); lavFh = signal(20); lavFe = signal(15);
  lavMatModalOpen = signal(false);

  lavMalla = signal<'no'|'1capa'|'2capas'>('no'); lavMallaTipo = signal('d5');
  lavBarLosa = signal(false); lavDbl = signal('3'); lavBlSx = signal(20); lavBlSy = signal(20);
  
  lavLbarra = signal(6.10); lavAd = signal(false); lavDad = signal('3'); lavSad = signal(20); lavDistAd = signal(0.10);
  lavLg = signal(8); lavDespH = signal(10); lavImp = signal(5);

  lavEncMetodo = signal<'madera' | 'aluminio'>('madera');
  lavMadDetalleOn = signal(false);
  lavMadRows = signal<MaderaEnc[]>([]);
  lavAvOpen = signal(false);
  lavCuMaestro = signal(0.5); lavCuAlbanil = signal(2); lavCuAyudante = signal(3); lavCuCarpintero = signal(1.5); lavCuFactor = signal(1.05);

  // ==================== MACIZA ====================
  lmzEspesor = signal(0.12);
  lmzArea = signal(210);
  lmzAreaModo = signal<'directo' | 'tramos'>('directo');
  lmzTramos = signal<TramoLosa[]>([]);
  lmzDir = signal<'1'|'2'>('2'); lmzCamadas = signal<'1'|'2'>('1');
  
  lmzLbarra = signal(6.10); lmzLg = signal(15); lmzRec = signal(2.5); lmzDespH = signal(10); lmzImp = signal(5); lmzAd = signal(false);
  lmzDx = signal('3'); lmzSx = signal(20); lmzDy = signal('3'); lmzSy = signal(20);
  lmzDx2 = signal('3'); lmzSx2 = signal(20); lmzDy2 = signal('3'); lmzSy2 = signal(20);

  lmzDistAd = signal(25); lmzDadx = signal('3'); lmzSadx = signal(20); lmzDady = signal('3'); lmzSady = signal(20);
  lmzEx = signal(false); lmzExLargo = signal(25); lmzDexx = signal('3'); lmzSexx = signal(20); lmzDexy = signal('3'); lmzSexy = signal(20);

  lmzEncMetodo = signal<'madera' | 'aluminio'>('madera');
  lmzMadDetalleOn = signal(false);
  lmzMadRows = signal<MaderaEnc[]>([]);
  lmzAvOpen = signal(false);
  lmzCuMaestro = signal(0.5); lmzCuAlbanil = signal(2); lmzCuAyudante = signal(3); lmzCuCarpintero = signal(1.5); lmzCuFactor = signal(1.05);

  // ==================== LOSACERO ====================
  lctEspesorCapa = signal(0.06);
  lctArea = signal(150);
  lctAreaModo = signal<'directo' | 'tramos'>('directo');
  lctTramos = signal<TramoLosa[]>([]);
  
  lctDeckTipo = signal('2pulg'); lctDeckDesp = signal(5); lctDeckDir = signal('x'); lctDeckModalOpen = signal(false);
  lctPern = signal(true); lctPernD = signal('0.75'); lctPernL = signal(10); lctPernSep = signal(30);
  lctRefModo = signal<'malla'|'barras'|'mixto'>('malla'); 
  lctMallaTipo = signal('d5'); lctMallaCapas = signal(1); lctMallaTrasl = signal(10);
  lctCamadas = signal<'1'|'2'>('1');
  lctDbx = signal('3'); lctSbx = signal(20); lctDby = signal('3'); lctSby = signal(20);
  lctDbx2 = signal('3'); lctSbx2 = signal(20); lctDby2 = signal('3'); lctSby2 = signal(20);
  lctLg = signal(15);
  
  lctLbarra = signal(6.10); lctDespH = signal(10); lctImp = signal(5); lctAd = signal(false);
  lctVigasN = signal(2); lctVigasL = signal(5); lctVigasDesp = signal(5); lctPerfil = signal('W8x10'); lctPerfilModalOpen = signal(false);
  
  lctPuntDensidad = signal(0.8); lctPuntCosto = signal(15); lctPuntDias = signal(21);
  lctAvOpen = signal(false);
  lctCuMaestro = signal(0.5); lctCuSoldador = signal(1.5); lctCuAlbanil = signal(1); lctCuAyudante = signal(2); lctCuFactor = signal(1.05);

  // --- Computed para SVG reactivo de losacero ---
  lctDeckPeralte = computed(() => {
    const m: Record<string,number> = {'1.5pulg':0.038,'2pulg':0.051,'3pulg':0.076};
    return m[this.lctDeckTipo()] ?? 0.051;
  });
  lctDeckNombre = computed(() => this.deckCat.find(d => d.key === this.lctDeckTipo())?.nombre ?? 'Losacero 2"');
  lctDeckDesc = computed(() => this.deckCat.find(d => d.key === this.lctDeckTipo())?.desc ?? '');
  lctSvgHormH = computed(() => Math.max(Math.round(this.lctEspesorCapa() * 600), 15));
  lctSvgDeckH = computed(() => Math.max(Math.round(this.lctDeckPeralte() * 600), 16));
  lctSvgTotalH = computed(() => this.lctSvgHormH() + this.lctSvgDeckH());
  lctDeckPath = computed(() => {
    const y0 = this.lctSvgHormH(), yBot = this.lctSvgTotalH();
    const n = 7, period = 200 / n, ridgeW = period * 0.38, gap = (period - ridgeW) / 2;
    let d = `M 0 ${y0}`;
    for (let i = 0; i < n; i++) {
      const x = i * period;
      d += ` L ${+(x+gap).toFixed(1)} ${y0} L ${+(x+gap).toFixed(1)} ${yBot} L ${+(x+gap+ridgeW).toFixed(1)} ${yBot} L ${+(x+gap+ridgeW).toFixed(1)} ${y0}`;
    }
    return d + ` L 200 ${y0}`;
  });
  lctDeckFillPath = computed(() => `${this.lctDeckPath()} L 200 ${this.lctSvgTotalH()} L 0 ${this.lctSvgTotalH()} Z`);

  // ==================== PREFABRICADA ====================
  lpfArea = signal(120);
  lpfAreaModo = signal<'directo' | 'tramos'>('directo');
  lpfTramos = signal<TramoLosa[]>([]);
  lpfPanelAncho = signal(0.60);
  lpfPeralteTotal = signal(0.20);
  lpfPanelE = signal(0.14);
  lpfToppingE = signal(0.06);
  lpfToppingHorm = signal(210);
  lpfMalla = signal(true);
  lpfMallaTipo = signal('d5');
  lpfDespH = signal(5);
  lpfImp = signal(5);
  lpfAvOpen = signal(false);
  lpfCuMaestro = signal(0.3); lpfCuAlbanil = signal(1.5); lpfCuAyudante = signal(2); lpfCuFactor = signal(1.05);

  // COMPUTED
  calcLavArea = computed(() => this.lavAreaModo() === 'directo' ? this.lavArea() : this.lavTramos().reduce((s,t) => s + (t.largo*t.ancho), 0));
  lavResultados = computed(() => {
    const A = this.calcLavArea();
    const E = this.lavEspesor();
    const vxb = this.lavVxBase(); const vyb = this.lavVyBase();
    const fB = this.lavFb() / 100; const fH = this.lavFh() / 100; const fE = this.lavFe() / 100;
    const sep = Math.max(this.lavSep() / 100, 0.01);
    const Lg = this.lavLg() / 100;
    const desph = Math.max(this.lavDespH() / 100, 0) + 1;
    const imp = Math.max(this.lavImp() / 100, 0) + 1;
    
    const celdaX = vxb + fB; const celdaY = vyb + fH;
    const cantFoam = (celdaX > 0 && celdaY > 0) ? Math.floor(A / (celdaX * celdaY)) : 0;
    const volHorm = Math.max(A * E - cantFoam * fB * fH * fE, 0) * desph;
    
    const L = Math.sqrt(Math.max(A, 1));
    const nvX = celdaY > 0 ? Math.max(Math.floor(L / celdaY) + 1, 1) : 1;
    const nvY = celdaX > 0 ? Math.max(Math.floor(L / celdaX) + 1, 1) : 1;
    
    const trasl = (d: string) => 50 * (parseFloat(d) / 8) * 0.0254;
    const slotKg = (n: number, d: string, nVig: number) => n > 0 ? n * nVig * (L + trasl(d)) * (PESO[d] || 0) : 0;
    
    let kgLong = 0;
    if (this.lavViguetaModo() === 'avanzado') {
      kgLong += slotKg(this.lavNSupA(), this.lavDSupA(), nvX) + slotKg(this.lavNSupB(), this.lavDSupB(), nvX);
      kgLong += slotKg(this.lavNMedA(), this.lavDMedA(), nvX) + slotKg(this.lavNMedB(), this.lavDMedB(), nvX);
      kgLong += slotKg(this.lavNInfA(), this.lavDInfA(), nvX) + slotKg(this.lavNInfB(), this.lavDInfB(), nvX);
      kgLong += slotKg(this.lavNSupAY(), this.lavDSupAY(), nvY) + slotKg(this.lavNSupBY(), this.lavDSupBY(), nvY);
      kgLong += slotKg(this.lavNMedAY(), this.lavDMedAY(), nvY) + slotKg(this.lavNMedBY(), this.lavDMedBY(), nvY);
      kgLong += slotKg(this.lavNInfAY(), this.lavDInfAY(), nvY) + slotKg(this.lavNInfBY(), this.lavDInfBY(), nvY);
    } else {
      const nVig = nvX + nvY;
      kgLong += slotKg(this.lavNSupA(), this.lavDSupA(), nVig) + slotKg(this.lavNSupB(), this.lavDSupB(), nVig);
      kgLong += slotKg(this.lavNMedA(), this.lavDMedA(), nVig) + slotKg(this.lavNMedB(), this.lavDMedB(), nVig);
      kgLong += slotKg(this.lavNInfA(), this.lavDInfA(), nVig) + slotKg(this.lavNInfB(), this.lavDInfB(), nVig);
    }

    const calcPeri = (b:number, h:number, forma:string) => {
      const bC = Math.max(b - 2 * 0.02, 0.04); const hC = Math.max(h - 2 * 0.02, 0.04);
      return forma === 'libre' ? bC + 2 * hC + 2 * Lg : 2 * (bC + hC) + 2 * Lg;
    };
    
    let lt = 0, kgAt = 0;
    const nEstX = Math.floor(L / sep) + 1;
    if (this.lavViguetaModo() === 'avanzado') {
      const periX = calcPeri(vxb, fH, this.lavEstf());
      const ltX = periX * nEstX * nvX;
      kgAt += ltX * (PESO[this.lavDat()] || 0);
      const periY = calcPeri(vyb, fH, this.lavEstfY());
      const nEstY = Math.floor(L / Math.max(this.lavSepY()/100, 0.01)) + 1;
      const ltY = periY * nEstY * nvY;
      kgAt += ltY * (PESO[this.lavDatY()] || 0);
    } else {
      const periX = calcPeri(vxb, fH, this.lavEstf());
      lt = periX * nEstX * (nvX + nvY);
      kgAt = lt * (PESO[this.lavDat()] || 0);
    }

    const capasMalla = this.lavMalla() === '1capa' ? 1 : this.lavMalla() === '2capas' ? 2 : 0;
    const kgMalla = capasMalla > 0 ? A * (MALLA_PESO[this.lavMallaTipo()] || 1.55) * capasMalla : 0;
    
    let kgBarLosa = 0;
    if (this.lavBarLosa()) {
      const sly = Math.max(this.lavBlSy() / 100, 0.05); const slx = Math.max(this.lavBlSx() / 100, 0.05);
      const nBarX = Math.floor(L / sly) + 1; const nBarY = Math.floor(L / slx) + 1;
      kgBarLosa = (nBarX + nBarY) * (L + trasl(this.lavDbl())) * (PESO[this.lavDbl()] || 0);
    }
    
    let kgAd = 0;
    if (this.lavAd()) {
      const sad = Math.max(this.lavSad() / 100, 0.01);
      const nBar = Math.floor(L / sad) + 1;
      kgAd = 2 * nBar * (L + trasl(this.lavDad())) * (PESO[this.lavDad()] || 0);
    }

    const kgAcero = (kgLong + kgAt + kgBarLosa + kgAd) * 1.07 * imp;
    const kgTotalAcero = kgAcero + kgMalla * imp; // malla is separate
    const pesoPorM2Malla = MALLA_PESO[this.lavMallaTipo()] || 1.55;

    let encCosto = 0;
    if (this.lavEncMetodo() === 'madera') {
      this.lavMadRows().forEach(r => {
        const def = MAD_CAT[r.tipo] || MAD_CAT['pino'];
        const desp = Math.max(r.desp || 0, 0) / 100 + 1;
        let unidades = def.kind === 'tablero'
          ? Math.ceil((A * desp) / (r.ancho * 0.3048 * r.largo * 0.3048))
          : Math.ceil(A * (r.ancho || def.factor || 1) * desp);
        if (unidades < 0 || isNaN(unidades)) unidades = 0;
        encCosto += unidades * def.precio;
      });
    }

    const moJornales = (this.lavCuMaestro() + this.lavCuAlbanil() + this.lavCuAyudante() + this.lavCuCarpintero()) * Math.max(this.lavCuFactor(), 1);

    return { volHorm, cantFoam, kgAcero, kgMalla, pesoPorM2Malla, kgBarLosa, lt, encofrado: A, encCosto, moJornales };
  });

  calcLmzArea = computed(() => this.lmzAreaModo() === 'directo' ? this.lmzArea() : this.lmzTramos().reduce((s,t) => s + (t.largo*t.ancho), 0));
  lmzResultados = computed(() => {
    const A = this.calcLmzArea();
    const E = this.lmzEspesor();
    const L = Math.sqrt(Math.max(A, 1));
    const Lg = this.lmzLg() / 100;
    const desph = Math.max(this.lmzDespH() / 100, 0) + 1;
    const imp = Math.max(this.lmzImp() / 100, 0) + 1;
    const volHorm = A * E * desph;

    const trasl = (d: string) => 50 * (parseFloat(d) / 8) * 0.0254;
    
    const calcKg = (d: string, sCm: number) => {
      const s = Math.max(sCm / 100, 0.05);
      return (Math.floor(L / s) + 1) * (L + trasl(d) + 2 * Lg) * (PESO[d] || 0);
    };

    let kgX = calcKg(this.lmzDx(), this.lmzSx());
    let kgY = this.lmzDir() === '2' ? calcKg(this.lmzDy(), this.lmzSy()) : 0;
    let kgX2 = this.lmzCamadas() === '2' ? calcKg(this.lmzDx2(), this.lmzSx2()) : 0;
    let kgY2 = (this.lmzCamadas() === '2' && this.lmzDir() === '2') ? calcKg(this.lmzDy2(), this.lmzSy2()) : 0;

    let kgAdX = 0, kgAdY = 0;
    if (this.lmzAd()) {
      const tempLargo = (Math.max(this.lmzDistAd(), 5) / 100) * L;
      kgAdX = (Math.floor(L / Math.max(this.lmzSadx()/100, 0.05)) + 1) * 2 * (tempLargo + Lg) * (PESO[this.lmzDadx()] || 0);
      if (this.lmzDir() === '2') kgAdY = (Math.floor(L / Math.max(this.lmzSady()/100, 0.05)) + 1) * 2 * (tempLargo + Lg) * (PESO[this.lmzDady()] || 0);
    }
    
    let kgExX = 0, kgExY = 0;
    if (this.lmzEx()) {
      const exLargo = (Math.max(this.lmzExLargo(), 5) / 100) * L;
      kgExX = (Math.floor(L / Math.max(this.lmzSexx()/100, 0.05)) + 1) * 2 * (exLargo + Lg) * (PESO[this.lmzDexx()] || 0);
      if (this.lmzDir() === '2') kgExY = (Math.floor(L / Math.max(this.lmzSexy()/100, 0.05)) + 1) * 2 * (exLargo + Lg) * (PESO[this.lmzDexy()] || 0);
    }

    const kgAcero = (kgX + kgY + kgX2 + kgY2 + kgAdX + kgAdY + kgExX + kgExY) * 1.07 * imp;

    let encCosto = 0;
    if (this.lmzEncMetodo() === 'madera') {
      this.lmzMadRows().forEach(r => {
        const def = MAD_CAT[r.tipo] || MAD_CAT['pino'];
        const desp = Math.max(r.desp || 0, 0) / 100 + 1;
        let unidades = def.kind === 'tablero' 
          ? Math.ceil((A * desp) / (r.ancho * 0.3048 * r.largo * 0.3048))
          : Math.ceil(A * (r.ancho || def.factor || 1) * desp);
        if (unidades < 0 || isNaN(unidades)) unidades = 0;
        encCosto += unidades * def.precio;
      });
    }

    const moJornales = (this.lmzCuMaestro() + this.lmzCuAlbanil() + this.lmzCuAyudante() + this.lmzCuCarpintero()) * Math.max(this.lmzCuFactor(), 1);

    return { volHorm, kgAcero, encofrado: A, encCosto, moJornales };
  });

  calcLctArea = computed(() => this.lctAreaModo() === 'directo' ? this.lctArea() : this.lctTramos().reduce((s,t) => s + (t.largo*t.ancho), 0));
  lctResultados = computed(() => {
    const A = this.calcLctArea();
    const E = this.lctEspesorCapa();
    const L = Math.sqrt(Math.max(A, 1));
    const desph = Math.max(this.lctDespH() / 100, 0) + 1;
    const imp = Math.max(this.lctImp() / 100, 0) + 1;
    
    const deck = DECK_CAT[this.lctDeckTipo()] || DECK_CAT['2pulg'];
    const volHorm = A * (E + deck.peralte * 0.5) * desph;
    const kgDeck = A * (Math.max(this.lctDeckDesp() / 100, 0) + 1) * deck.peso;

    let kgMalla = 0;
    if (this.lctRefModo() === 'malla' || this.lctRefModo() === 'mixto') {
      const mTrasl = Math.max(this.lctMallaTrasl() / 100, 0) + 1;
      kgMalla = A * (MALLA_PESO[this.lctMallaTipo()] || 1.55) * this.lctMallaCapas() * mTrasl;
    }

    let kgBarras = 0;
    if (this.lctRefModo() === 'barras' || this.lctRefModo() === 'mixto') {
      const trasl = (d: string) => 50 * (parseFloat(d) / 8) * 0.0254;
      const Lg = this.lctLg() / 100;
      const calcKg = (d: string, sCm: number) => {
        const s = Math.max(sCm / 100, 0.05);
        return (Math.floor(L / s) + 1) * (L + trasl(d) + 2 * Lg) * (PESO[d] || 0);
      };
      let kgX = calcKg(this.lctDbx(), this.lctSbx());
      let kgY = calcKg(this.lctDby(), this.lctSby());
      let kgX2 = this.lctCamadas() === '2' ? calcKg(this.lctDbx2(), this.lctSbx2()) : 0;
      let kgY2 = this.lctCamadas() === '2' ? calcKg(this.lctDby2(), this.lctSby2()) : 0;
      kgBarras = (kgX + kgY + kgX2 + kgY2) * 1.07 * imp;
    }

    let nPernos = 0, kgPernos = 0;
    if (this.lctPern()) {
      const pSep = Math.max(this.lctPernSep() / 100, 0.05);
      nPernos = Math.ceil((this.lctVigasN() * this.lctVigasL()) / pSep);
      kgPernos = nPernos * (PERNO_PESO[this.lctPernD()] || 0.23) * (Math.max(this.lctPernL(), 5)/10);
    }

    const perfil = PERFIL_CAT[this.lctPerfil()] || PERFIL_CAT['W8x10'];
    const dspV = Math.max(this.lctVigasDesp() / 100, 0) + 1;
    const kgVigas = this.lctVigasN() * this.lctVigasL() * perfil.peso * dspV;

    const costoPuntales = Math.ceil(A * this.lctPuntDensidad()) * this.lctPuntCosto() * this.lctPuntDias();
    const moJornales = (this.lctCuMaestro() + this.lctCuSoldador() + this.lctCuAlbanil() + this.lctCuAyudante()) * Math.max(this.lctCuFactor(), 1);

    return { volHorm, kgDeck, kgMalla, kgBarras, nPernos, kgPernos, kgVigas, costoPuntales, moJornales };
  });

  volumenPresupuestado = computed(() => {
    const t = this.tipoLosa();
    if (t === 'nervada') return this.lavResultados().volHorm;
    if (t === 'maciza') return this.lmzResultados().volHorm;
    if (t === 'losacero') return this.lctResultados().volHorm;
    return 0;
  });

  calcLpfArea = computed(() => this.lpfAreaModo() === 'directo' ? this.lpfArea() : this.lpfTramos().reduce((s,t) => s + (t.largo*t.ancho), 0));
  lpfResultados = computed(() => {
    const A = this.calcLpfArea();
    const desph = 1 + this.lpfDespH() / 100;
    const volTopping = A * this.lpfToppingE() * desph;
    const kgMalla = this.lpfMalla() ? A * (MALLA_PESO[this.lpfMallaTipo()] || 1.55) * desph : 0;
    const nPaneles = Math.ceil(A / Math.max(this.lpfPanelAncho(), 0.01));
    const moJornales = (this.lpfCuMaestro() * 0.3 + this.lpfCuAlbanil() * 0.5 + this.lpfCuAyudante() * 0.3) * Math.sqrt(Math.max(A, 1)) / 8 * this.lpfCuFactor();
    return { volTopping, kgMalla, nPaneles, moJornales, area: A };
  });

  apuData = computed(() => {
    const t = this.tipoLosa();
    const vol = this.volumenPresupuestado() || 1;
    const div = vol;
    
    let sec1: any[] = [];
    let sec2: any[] = [];
    let sec3: any[] = [];

    if (t === 'nervada') {
      const r = this.lavResultados();
      if (r.kgAcero > 0) sec1.push(mk('Acero de refuerzo', r.kgAcero/div, 'KG', 1.00, 'acero', 'Acero'));
      if (r.kgMalla > 0) sec1.push(mk('Malla electrosoldada', r.kgMalla/div, 'KG', 1.00, 'malla', 'Acero'));
      if (r.cantFoam > 0) sec1.push(mk('Bloque Aligerante ('+this.lavMatTipo()+')', r.cantFoam/div, 'UD', 1.05, 'aligerante', 'Materiales'));
      if (r.encofrado > 0) sec1.push(mk('Encofrado ('+this.lavEncMetodo()+')', r.encofrado/div, 'M2', 1.15, 'encofrado', 'Maderera'));
      sec1.push(mk('Hormigón premezclado', 1.0, 'M3', 1.00, 'hormigon', 'Hormigonera'));
      sec1.push(mk('Alambre de amarre', (r.kgAcero/div)*0.05, 'KG', 1.00, 'alambre', 'Ferretería'));
      sec2.push(mk('Herramientas menores', 1.0, 'GL', 1.00, 'herramientas', 'Equipos'));
      sec3.push(mk('Cuadrilla hormigonado y armado', r.moJornales/div, 'JOR', 1.00, 'cuadrilla', 'Mano Obra'));
    } else if (t === 'maciza') {
      const r = this.lmzResultados();
      if (r.kgAcero > 0) sec1.push(mk('Acero de refuerzo', r.kgAcero/div, 'KG', 1.00, 'acero', 'Acero'));
      if (r.encofrado > 0) sec1.push(mk('Encofrado ('+this.lmzEncMetodo()+')', r.encofrado/div, 'M2', 1.15, 'encofrado', 'Maderera'));
      sec1.push(mk('Hormigón premezclado', 1.0, 'M3', 1.00, 'hormigon', 'Hormigonera'));
      sec1.push(mk('Alambre de amarre', (r.kgAcero/div)*0.05, 'KG', 1.00, 'alambre', 'Ferretería'));
      sec2.push(mk('Herramientas menores', 1.0, 'GL', 1.00, 'herramientas', 'Equipos'));
      sec3.push(mk('Cuadrilla hormigonado y armado', r.moJornales/div, 'JOR', 1.00, 'cuadrilla', 'Mano Obra'));
    } else if (t === 'losacero') {
      const r = this.lctResultados();
      if (r.kgDeck > 0) sec1.push(mk('Lámina Losacero ('+this.lctDeckTipo()+')', r.kgDeck/div, 'KG', 1.00, 'deck', 'Metales'));
      if (r.kgMalla > 0) sec1.push(mk('Malla electrosoldada', r.kgMalla/div, 'KG', 1.00, 'malla', 'Acero'));
      if (r.kgBarras > 0) sec1.push(mk('Acero de refuerzo adicional', r.kgBarras/div, 'KG', 1.00, 'acero', 'Acero'));
      if (r.nPernos > 0) sec1.push(mk('Pernos de cortante', r.nPernos/div, 'UD', 1.00, 'pernos', 'Ferretería'));
      if (r.kgVigas > 0) sec1.push(mk('Vigas metálicas ('+this.lctPerfil()+')', r.kgVigas/div, 'KG', 1.00, 'vigas', 'Metales'));
      sec1.push(mk('Hormigón premezclado', 1.0, 'M3', 1.00, 'hormigon', 'Hormigonera'));
      sec2.push(mk('Herramientas menores', 1.0, 'GL', 1.00, 'herramientas', 'Equipos'));
      if (r.costoPuntales > 0) sec2.push(mk('Alquiler de puntales', r.costoPuntales/div, 'GL', 1.00, 'puntales', 'Equipos'));
      sec3.push(mk('Cuadrilla losacero y hormigón', r.moJornales/div, 'JOR', 1.00, 'cuadrilla', 'Mano Obra'));
    } else if (t === 'prefabricada') {
      const r = this.lpfResultados();
      sec1.push(mk('Losa prefabricada / prelosa', r.area/div, 'M2', 1.02, 'panel', 'Prefabricados'));
      if (r.volTopping > 0) sec1.push(mk("Hormigón de topping f'c " + this.lpfToppingHorm(), r.volTopping/div, 'M3', 1.00, 'hormigon', 'Hormigonera'));
      if (r.kgMalla > 0) sec1.push(mk('Malla electrosoldada (' + this.lpfMallaTipo() + ')', r.kgMalla/div, 'KG', 1.00, 'malla', 'Acero'));
      sec2.push(mk('Herramientas menores', 1.0, 'GL', 1.00, 'herramientas', 'Equipos'));
      sec3.push(mk('Cuadrilla colocación y hormigonado', r.moJornales/div, 'JOR', 1.00, 'cuadrilla', 'Mano Obra'));
    }

    return { sec1, sec2, sec3 };
  });

  constructor() {
    effect(() => {
      this.parametersChange.emit({
        ...this.apuParameters,
        tipoLosa: this.tipoLosa(),
        cantidad_calculada: this.volumenPresupuestado(),
        apuData: this.apuData(),
      });
    });
  }

  // Arrays manipulation
  addTramo(tipo: string) {
    if (tipo === 'lav') this.lavTramos.update(t => [...t, { id: Date.now(), largo: 5, ancho: 4 }]);
    if (tipo === 'lmz') this.lmzTramos.update(t => [...t, { id: Date.now(), largo: 5, ancho: 4 }]);
    if (tipo === 'lct') this.lctTramos.update(t => [...t, { id: Date.now(), largo: 5, ancho: 4 }]);
    if (tipo === 'lpf') this.lpfTramos.update(t => [...t, { id: Date.now(), largo: 5, ancho: 4 }]);
  }
  rmTramo(tipo: string, id: number) {
    if (tipo === 'lav') this.lavTramos.update(t => t.filter(x => x.id !== id));
    if (tipo === 'lmz') this.lmzTramos.update(t => t.filter(x => x.id !== id));
    if (tipo === 'lct') this.lctTramos.update(t => t.filter(x => x.id !== id));
    if (tipo === 'lpf') this.lpfTramos.update(t => t.filter(x => x.id !== id));
  }
  updTramo(tipo: string, id: number, field: string, val: any) {
    const fn = (t: TramoLosa[]) => t.map(x => x.id === id ? { ...x, [field]: +val } : x);
    if (tipo === 'lav') this.lavTramos.update(fn);
    if (tipo === 'lmz') this.lmzTramos.update(fn);
    if (tipo === 'lct') this.lctTramos.update(fn);
    if (tipo === 'lpf') this.lpfTramos.update(fn);
  }

  addMad(tipo: string) {
    if (tipo === 'lav') this.lavMadRows.update(t => [...t, { id: Date.now(), tipo: 'pino', ancho: 4, largo: 8, desp: 15, custom: false }]);
    if (tipo === 'lmz') this.lmzMadRows.update(t => [...t, { id: Date.now(), tipo: 'pino', ancho: 4, largo: 8, desp: 15, custom: false }]);
  }
  rmMad(tipo: string, id: number) {
    if (tipo === 'lav') this.lavMadRows.update(t => t.filter(x => x.id !== id));
    if (tipo === 'lmz') this.lmzMadRows.update(t => t.filter(x => x.id !== id));
  }
  updMad(tipo: string, id: number, field: string, val: any) {
    const fn = (t: MaderaEnc[]) => t.map(x => x.id === id ? { ...x, [field]: field === 'tipo' ? val : +val } : x);
    if (tipo === 'lav') this.lavMadRows.update(fn);
    if (tipo === 'lmz') this.lmzMadRows.update(fn);
  }

  ngOnInit() {}
  ngOnChanges(changes: SimpleChanges) {}
}
