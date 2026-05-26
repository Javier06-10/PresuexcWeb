import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiState } from '../../services/ui-state';
import { ProjectService } from '../../services/project';
import { ConfigService } from '../../services/config';
import { showSuccess } from '../../utils/alert.util';
import { ClientService } from '../../services/client.service';
import { ApuService } from '../../services/apu.service';
import { ExportService } from '../../services/export.service';
import { ShareService } from '../../services/share.service';
import { QuickCalcCanvasComponent } from '../quick-calc-canvas/quick-calc-canvas';
import { ApuCapaVegetalComponent } from '../apu-capa-vegetal/apu-capa-vegetal';
import { ApuExcavacionCieloComponent } from '../apu-excavacion-cielo/apu-excavacion-cielo';
import { ApuExcavacionCimientosComponent } from '../apu-excavacion-cimientos/apu-excavacion-cimientos';
import { ApuRellenoComponent } from '../apu-relleno/apu-relleno';
import { ApuCharranchaComponent } from '../apu-charrancha/apu-charrancha';
import { ApuFumigacionComponent } from '../apu-fumigacion/apu-fumigacion';
import { ApuBarreraVaporComponent } from '../apu-barrera-vapor/apu-barrera-vapor';
import { ApuHormigonZapataComponent } from '../apu-hormigon-zapata/apu-hormigon-zapata';
import { ApuHormigonColumnaComponent } from '../apu-hormigon-columna/apu-hormigon-columna';
import { ApuHormigonVigaComponent } from '../apu-hormigon-viga/apu-hormigon-viga';
import { ApuHormigonLosaComponent } from '../apu-hormigon-losa/apu-hormigon-losa';
import { ApuMamposteriaComponent } from '../apu-mamposteria/apu-mamposteria';
import { ApuContrapisoComponent } from '../apu-contrapiso/apu-contrapiso';
import { ApuEnlucidoComponent } from '../apu-enlucido/apu-enlucido';
import { ApuCeramicaComponent } from '../apu-ceramica/apu-ceramica';
import { ApuPinturaComponent } from '../apu-pintura/apu-pintura';
import { ApuCubiertaComponent } from '../apu-cubierta/apu-cubierta';
import { ApuCieloRasoComponent } from '../apu-cielo-raso/apu-cielo-raso';
import { ApuImpermeabilizacionComponent } from '../apu-impermeabilizacion/apu-impermeabilizacion';
import { ApuPuertaComponent } from '../apu-puerta/apu-puerta';
import { ApuVentanaComponent } from '../apu-ventana/apu-ventana';
import { ApuTuberiaComponent } from '../apu-tuberia/apu-tuberia';
import { ApuInstalacionElectricaComponent } from '../apu-instalacion-electrica/apu-instalacion-electrica';
import { ApuEscaleraComponent } from '../apu-escalera/apu-escalera';
import { ApuAceraComponent } from '../apu-acera/apu-acera';
import { ApuAparatoSanitarioComponent } from '../apu-aparato-sanitario/apu-aparato-sanitario';
import { ApuClosetComponent } from '../apu-closet/apu-closet';
import { ApuRevestimiento } from '../apu-revestimiento/apu-revestimiento';
import { ApuPisoFlotante } from '../apu-piso-flotante/apu-piso-flotante';
import { ApuMuroPerimetral } from '../apu-muro-perimetral/apu-muro-perimetral';
import { ApuCisterna } from '../apu-cisterna/apu-cisterna';
import { ApuInstalacionSanitaria } from '../apu-instalacion-sanitaria/apu-instalacion-sanitaria';
import { ApuDesbanque } from '../apu-desbanque/apu-desbanque';
import { ApuCarpinteriaAluminio } from '../apu-carpinteria-aluminio/apu-carpinteria-aluminio';
import { ApuInstalacionGas } from '../apu-instalacion-gas/apu-instalacion-gas';
import { ApuJardineria } from '../apu-jardineria/apu-jardineria';
import { ApuEstructuraMetalica } from '../apu-estructura-metalica/apu-estructura-metalica';
import { ApuZapataMuro } from '../apu-zapata-muro/apu-zapata-muro';
import { ApuZapataColumna } from '../apu-zapata-columna/apu-zapata-columna';
import { ApuLosaFundacion } from '../apu-losa-fundacion/apu-losa-fundacion';
import { ApuPilotes } from '../apu-pilotes/apu-pilotes';

@Component({
  selector: 'app-budget-view',
  imports: [
    CommonModule, FormsModule,
    ApuCapaVegetalComponent,
    ApuExcavacionCieloComponent,
    ApuExcavacionCimientosComponent,
    ApuRellenoComponent,
    ApuCharranchaComponent,
    ApuFumigacionComponent,
    ApuBarreraVaporComponent,
    ApuHormigonZapataComponent,
    ApuHormigonColumnaComponent,
    ApuHormigonVigaComponent,
    ApuHormigonLosaComponent,
    ApuMamposteriaComponent,
    ApuContrapisoComponent,
    ApuEnlucidoComponent,
    ApuCeramicaComponent,
    ApuPinturaComponent,
    ApuCubiertaComponent,
    ApuCieloRasoComponent,
    ApuImpermeabilizacionComponent,
    ApuPuertaComponent,
    ApuVentanaComponent,
    ApuTuberiaComponent,
    ApuInstalacionElectricaComponent,
    ApuEscaleraComponent,
    ApuAceraComponent,
    ApuAparatoSanitarioComponent,
    ApuClosetComponent,
    ApuRevestimiento,
    ApuPisoFlotante,
    ApuMuroPerimetral,
    ApuCisterna,
    ApuInstalacionSanitaria,
    ApuDesbanque,
    ApuCarpinteriaAluminio,
    ApuInstalacionGas,
    ApuJardineria,
    ApuEstructuraMetalica,
    ApuZapataMuro,
    ApuZapataColumna,
    ApuLosaFundacion,
    ApuPilotes,
    QuickCalcCanvasComponent,
  ],
  templateUrl: './budget-view.html',
  styleUrl: './budget-view.css',
  providers: [DatePipe],
})
export class BudgetView {
  uiState = inject(UiState);
  projectService = inject(ProjectService);
  configService = inject(ConfigService);
  clientService = inject(ClientService);
  apuService = inject(ApuService);
  exportService = inject(ExportService);
  shareService = inject(ShareService);
  datePipe = inject(DatePipe);

  showShareModal = signal(false);

  currentDate = this.datePipe.transform(new Date(), 'dd/MM/yyyy') || '';

  selectedBudgetItem = signal<any>(null);
  viewingApuDetails = signal<boolean>(false);
  showApuPanel = signal<boolean>(true);
  apuPositionValue = signal<'abajo' | 'lado'>('abajo');
  apuParameters = signal<Record<string, any>>({});

  // Auto-resolves the APU template from the selected item's apu_template_id.
  // Reads uiState.activeApuId() as a side dependency so the computed re-runs
  // after _linkApuToBudgetItem mutates item.apu_template_id and sets activeApuId.
  readonly selectedApuTemplate = computed(() => {
    const item = this.selectedBudgetItem();
    if (!item) return null;
    this.uiState.activeApuId(); // reactive dependency for new-APU assignment flow
    const apuId = item.apu_template_id;
    if (!apuId) return null;
    return this.apuService.apus().find((a: any) => a.id === apuId) ?? null;
  });
  hasUnsavedApuChanges = signal<boolean>(false);
  isSavingApu = signal<boolean>(false);
  // Absorbs the one-time initialization emission from each APU component's effect().
  private _firstApuEmitReceived = false;

  constructor() {
    // Auto-navigate to APU form when the APU editor modal closes after linking an APU.
    effect(() => {
      const editorOpen = this.uiState.isApuEditorOpen();
      if (!editorOpen && this.activeSidebarTabValue() === 'item') {
        const item = this.selectedBudgetItem();
        if (item?.apu_template_id && !this.viewingApuDetails()) {
          this._firstApuEmitReceived = false;
          this.viewingApuDetails.set(true);
        }
      }
    });
  }

  selectItem(item: any, capId: string) {
    this.selectedBudgetItem.set(item);
    this.hasUnsavedApuChanges.set(false);
    this.apuParameters.set(item.apu_parameters || item.parameters || {});
    this.activeSidebarTabValue.set('item');
    this._firstApuEmitReceived = false;
    // If item already has an APU, go straight to the form; otherwise show selector
    this.viewingApuDetails.set(!!item.apu_template_id);
    if (this.apuService.apus().length === 0 && !this.apuService.isLoading()) {
      this.apuService.loadApus();
    }
  }

  selectResumen() {
    this.activeSidebarTabValue.set('resumen');
  }

  toggleChapter(capId: string) {
    const current = this.openChapters();
    if (current.includes(capId)) {
      this.openChapters.set(current.filter(id => id !== capId));
    } else {
      this.openChapters.set([...current, capId]);
    }
  }

  isChapterOpen(capId: string) {
    return this.openChapters().includes(capId);
  }

  toggleSidebar() {
    this.sidebarOpen.set(!this.sidebarOpen());
  }

  isSidebarOpen() {
    return this.sidebarOpen();
  }

  toggleApuPanel() {
    this.showApuPanel.set(!this.showApuPanel());
  }

  setApuPosition(pos: 'abajo' | 'lado') {
    this.apuPositionValue.set(pos);
  }

  apuPosition() {
    return this.apuPositionValue();
  }

  parameters() {
    return [] as Array<{ label: string; unit: string; key: string; ref_table?: string; ref_value_field?: string; ref_label_field?: string; default?: any }>;
  }

  paramValues() {
    return this.apuParameters();
  }

  updateAllParams(params: Record<string, any>) {
    this.apuParameters.set(params);
    if (!this._firstApuEmitReceived) {
      this._firstApuEmitReceived = true;
      return; // initialization emission — don't mark dirty
    }
    this.hasUnsavedApuChanges.set(true);
  }

  getDropdownOptions(paramKey: string) {
    return [] as Array<any>;
  }

  getParamValue(key: string, defaultVal: any) {
    return this.apuParameters()[key] ?? defaultVal;
  }

  updateParam(key: string, value: any) {
    const current = this.apuParameters();
    this.apuParameters.set({ ...current, [key]: value });
  }

  syncItemName(newName: string) {
    const item = this.selectedBudgetItem();
    if (item) {
      item.description = newName;
      this.hasUnsavedApuChanges.set(true);
      this.projectService.hasUnsavedChanges.set(true);
    }
  }

  async saveActiveItem() {
    this.isSavingApu.set(true);
    try {
      const item = this.selectedBudgetItem();
      if (item) {
        item.apu_parameters = this.apuParameters();
        const qty = this.apuParameters()['cantidad_calculada'];
        if (qty != null) {
          item.quantity = qty;
          const unitPrice = this.selectedApuTemplate()?.total_unit || 0;
          item.unit_price = unitPrice;
          item.total = item.quantity * unitPrice;
        }
      }
      this.projectService.updateTotal(); // refresh budget totals in the UI before saving
      await this.projectService.saveBudgetManual();
      this.hasUnsavedApuChanges.set(false);
    } finally {
      this.isSavingApu.set(false);
    }
  }

  openNewApuForCurrentItem() {
    const item = this.selectedBudgetItem();
    if (!item) return;
    this.uiState.activeBudgetItemForOptions.set(item);
    const chapter = this.projectService.activeBudgetLevels()
      .flatMap((l: any) => l.chapters || [])
      .find((c: any) => (c.items || []).some((i: any) => i.id === item.id));
    this.uiState.activeChapterForPicker.set(chapter || null);
    this.uiState.isItemOptionsModalOpen.set(true);
  }

  totalApuItem() {
    return this.totalUnitarioApu() * this.calculatedQuantity();
  }

  activeSidebarTabValue = signal<'resumen' | 'item' | 'quickcalc'>('resumen');
  openChapters = signal<string[]>([]);
  sidebarOpen = signal<boolean>(true);

  // ── Quick Calculator ─────────────────────────────────────────────
  readonly QUICK_CALC_TREE: Array<{ id: string; name: string; icon: string; items: Array<{ key: string; name: string }> }> = [
    {
      id: '01', name: 'Preliminares', icon: 'ph-shovel',
      items: [
        { key: 'desbanque',      name: 'Desbanque y limpieza de terreno' },
        { key: 'capa-vegetal',   name: 'Extracción de capa vegetal' },
        { key: 'exc-cielo',      name: 'Excavación a cielo abierto' },
        { key: 'exc-cimientos',  name: 'Excavación de cimientos' },
        { key: 'relleno',        name: 'Relleno de material' },
        { key: 'charrancha',     name: 'Charrancha y replanteo' },
        { key: 'fumigacion',     name: 'Fumigación' },
        { key: 'barrera-vapor',  name: 'Barrera de vapor' },
      ]
    },
    {
      id: '02', name: 'Fundaciones', icon: 'ph-wall',
      items: [
        { key: 'zapata',         name: 'Hormigón en Zapata' },
        { key: 'zapata-muro',    name: 'Zapata corrida / De muro' },
        { key: 'zapata-columna', name: 'Zapata aislada / De columna' },
        { key: 'losa-fundacion', name: 'Losa de fundación / Platea' },
        { key: 'pilotes',        name: 'Pilotes' },
        { key: 'columna',        name: 'Hormigón en Columna / Castillo' },
        { key: 'viga',           name: 'Hormigón en Viga / Nervio' },
        { key: 'losa',           name: 'Hormigón en Losa / Entrepiso' },
      ]
    },
    {
      id: '03', name: 'Mampostería', icon: 'ph-bricks',
      items: [
        { key: 'mamposteria', name: 'Mampostería de bloque' },
        { key: 'contrapiso',  name: 'Contrapiso' },
      ]
    },
    {
      id: '04', name: 'Acabados', icon: 'ph-paint-roller',
      items: [
        { key: 'enlucido',          name: 'Enlucido / Revoque' },
        { key: 'ceramica',          name: 'Cerámica / Porcelanato (piso)' },
        { key: 'revestimiento',     name: 'Revestimiento de paredes' },
        { key: 'pintura',           name: 'Pintura' },
        { key: 'cubierta',          name: 'Cubierta / Techo' },
        { key: 'cielo-raso',        name: 'Cielo Raso / Gypsum' },
        { key: 'impermeabilizacion',name: 'Impermeabilización' },
      ]
    },
    {
      id: '05', name: 'Carpintería', icon: 'ph-door',
      items: [
        { key: 'puerta',               name: 'Puertas' },
        { key: 'ventana',              name: 'Ventanas / Vidriería' },
        { key: 'carpinteria-aluminio', name: 'Carpintería de aluminio' },
      ]
    },
    {
      id: '06', name: 'Instalaciones', icon: 'ph-pipe',
      items: [
        { key: 'tuberia',               name: 'Tuberías / Conduit' },
        { key: 'instalacion-electrica', name: 'Instalación Eléctrica' },
        { key: 'instalacion-sanitaria', name: 'Instalación Sanitaria' },
        { key: 'instalacion-gas',       name: 'Instalación de Gas' },
        { key: 'aparato-sanitario',     name: 'Aparatos Sanitarios' },
        { key: 'cisterna',              name: 'Cisterna / Tanque' },
      ]
    },
    {
      id: '07', name: 'Exteriores', icon: 'ph-path',
      items: [
        { key: 'acera',           name: 'Acera / Patio / Andén' },
        { key: 'escalera',        name: 'Escalera' },
        { key: 'muro-perimetral', name: 'Muro / Cerca Perimetral' },
        { key: 'jardineria',      name: 'Jardinería / Paisajismo' },
      ]
    },
    {
      id: '08', name: 'Carpintería Interior', icon: 'ph-wardrobe',
      items: [
        { key: 'closet',       name: 'Closets / Armarios' },
        { key: 'piso-flotante',name: 'Piso Flotante / Laminado' },
      ]
    },
    {
      id: '09', name: 'Estructura Metálica', icon: 'ph-buildings',
      items: [
        { key: 'estructura-metalica', name: 'Estructura metálica / Cubierta' },
      ]
    },
  ];

  selectedQuickCalcKey = signal<string | null>(null);
  quickCalcParams = signal<Record<string, any>>({});
  quickCalcOpenCats = signal<string[]>(['01']);
  quickCalcTargetChapterId = signal<string | null>(null);
  private _quickCalcFirstEmit = false;

  selectQuickCalcItem(key: string) {
    this.selectedQuickCalcKey.set(key);
    this.quickCalcParams.set({});
    this.activeSidebarTabValue.set('quickcalc');
    this._quickCalcFirstEmit = false;
  }

  updateQuickCalcParams(params: Record<string, any>) {
    this.quickCalcParams.set(params);
    if (!this._quickCalcFirstEmit) { this._quickCalcFirstEmit = true; }
  }

  toggleQuickCalcCat(id: string) {
    const cur = this.quickCalcOpenCats();
    if (cur.includes(id)) this.quickCalcOpenCats.set(cur.filter(x => x !== id));
    else this.quickCalcOpenCats.set([...cur, id]);
  }

  isQuickCalcCatOpen(id: string) { return this.quickCalcOpenCats().includes(id); }

  quickCalcLabel(key: string): string {
    for (const cat of this.QUICK_CALC_TREE) {
      const it = cat.items.find(i => i.key === key);
      if (it) return it.name;
    }
    return key;
  }

  quickCalcUnit(key: string): string {
    const units: Record<string, string> = {
      'capa-vegetal': 'm²', 'exc-cielo': 'm³', 'exc-cimientos': 'm³',
      'relleno': 'm³', 'charrancha': 'm²', 'fumigacion': 'm²', 'barrera-vapor': 'm²',
      'zapata': 'm³', 'zapata-muro': 'm³', 'zapata-columna': 'm³', 'losa-fundacion': 'm³', 'pilotes': 'ml',
      'columna': 'm³', 'viga': 'm³', 'losa': 'm³',
      'mamposteria': 'm²', 'contrapiso': 'm²',
      'enlucido': 'm²', 'ceramica': 'm²', 'pintura': 'm²',
      'cubierta': 'm²', 'cielo-raso': 'm²', 'impermeabilizacion': 'm²',
      'puerta': 'uds', 'ventana': 'm²', 'tuberia': 'm',
      'instalacion-electrica': 'puntos', 'escalera': 'm²', 'acera': 'm²',
      'aparato-sanitario': 'uds', 'closet': 'm²',
      'revestimiento': 'm²', 'piso-flotante': 'm²',
      'muro-perimetral': 'ml', 'cisterna': 'm³', 'instalacion-sanitaria': 'puntos',
      'desbanque': 'm²', 'carpinteria-aluminio': 'm²',
      'instalacion-gas': 'puntos', 'jardineria': 'm²', 'estructura-metalica': 'm²',
    };
    return units[key] || '';
  }

  quickCalcChapters(): any[] {
    return this.projectService.activeBudgetLevels().flatMap((l: any) => l.chapters || []);
  }

  async addQuickCalcToBudget() {
    const levels = this.projectService.activeBudgetLevels();
    const chapterId = this.quickCalcTargetChapterId();
    let lvlIdx = -1, capIdx = -1, targetChapter: any = null;
    for (let li = 0; li < levels.length; li++) {
      const caps = levels[li].chapters || [];
      for (let ci = 0; ci < caps.length; ci++) {
        if (!chapterId || caps[ci].id === chapterId) {
          lvlIdx = li; capIdx = ci; targetChapter = caps[ci]; break;
        }
      }
      if (targetChapter) break;
    }
    if (!targetChapter) return;
    await this.projectService.addItem(targetChapter);
    const items = targetChapter.items || [];
    const itemIdx = items.length - 1;
    const newItem = items[itemIdx];
    if (!newItem) return;
    newItem.description = this.quickCalcLabel(this.selectedQuickCalcKey() || '');
    newItem.quantity = this.quickCalcParams()['cantidad_calculada'] || 0;
    this.projectService.updateItemGranular(lvlIdx, capIdx, itemIdx, newItem);
    this.projectService.hasUnsavedChanges.set(true);
  }
  // ────────────────────────────────────────────────────────────────

  activeSidebarTab() {
    return this.activeSidebarTabValue();
  }

  activeProject() {
    return this.projectService.activeProject() as any;
  }

  volverAlPanel() {
    this.uiState.activeView.set('projects');
    this.projectService.activeProject.set(null);
  }

  imprimir() {
    window.print();
  }

  exportCSV() {
    const project = this.projectService.activeProject();
    const budget  = this.projectService.activeBudget();
    const levels  = this.projectService.activeBudgetLevels();
    const client  = this.clientService.getClientName(project?.client_id ?? '');
    this.exportService.exportCSV(project, budget, levels, client);
  }

  exportPDF() {
    const project = this.projectService.activeProject();
    const budget  = this.projectService.activeBudget();
    const levels  = this.projectService.activeBudgetLevels();
    const client  = this.clientService.getClientName(project?.client_id ?? '');
    const logo    = this.configService.logoConsolidadoBase64();
    this.exportService.exportPDF(project, budget, levels, client, logo);
  }

  async openShareModal() {
    const budget = this.projectService.activeBudget();
    if (!budget) return;
    this.showShareModal.set(true);
    await this.shareService.loadExistingToken(budget.id);
  }

  async generateShareLink() {
    const budget = this.projectService.activeBudget();
    if (!budget) return;
    await this.shareService.generateShareLink(budget.id);
  }

  async revokeShareLink() {
    const budget = this.projectService.activeBudget();
    if (!budget) return;
    await this.shareService.revokeShareLink(budget.id);
  }

  copyShareUrl() {
    const url = this.shareService.shareUrl();
    if (url) navigator.clipboard.writeText(url);
  }

  cambiarLogoDirectoDesdeHoja(files: FileList | null) {
    if (files && files[0]) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.configService.logoConsolidadoBase64.set(e.target.result);
      };
      reader.readAsDataURL(files[0]);
    }
  }

  async saveBudget() {
    await this.projectService.saveBudgetManual();
    showSuccess('Presupuesto guardado exitosamente.');
  }

  openItemOptions(cap: any, item: any) {
    if (!item.description || item.description.trim() === '') {
      this.uiState.activeChapterForPicker.set(cap);
      this.uiState.activeBudgetItemForOptions.set(item);
      this.uiState.isItemOptionsModalOpen.set(true);
    }
  }

  openItemOptionsForChapter(cap: any) {
    this.uiState.activeChapterForPicker.set(cap);
    this.uiState.activeBudgetItemForOptions.set(null);
    this.uiState.isItemOptionsModalOpen.set(true);
  }

  async addNewLevelAndOpenChapters() {
    const newLevel = await this.projectService.addLevel();
    if (newLevel) {
      this.uiState.activeLevelForChapterAdd.set(newLevel);
      this.uiState.isAddChapterModalOpen.set(true);
    }
  }

  totalUnitarioApu() {
    return this.selectedApuTemplate()?.total_unit || 0;
  }

  getApuItemsByGroup(apu: any, group: string): any[] {
    return (apu?.items || []).filter((i: any) => i.group_name === group);
  }

  getGroupLabel(group: string): string {
    const labels: Record<string, string> = {
      materials: 'Materiales',
      labor: 'Mano de Obra',
      equipment: 'Equipos',
      other: 'Otros',
    };
    return labels[group] || group;
  }

  matchApu(apu: any, nameFragment: string, code: string): boolean {
    if (!apu) return false;
    const name = (apu.name || '').toLowerCase();
    return name.includes(nameFragment.toLowerCase()) || apu.code === code;
  }

  private readonly KNOWN_CODES = [
    '01.01','01.02','01.03','01.04','01.05','01.06','01.07',
    '02.01','02.02','02.03','02.04','02.05','02.06',
    '03.01','03.02','03.03','03.04',
  ];
  private readonly KNOWN_NAMES = [
    'capa vegetal','cielo abierto','cimiento','relleno','charrancha','replanteo','fumigaci','barrera','vapor',
    'zapata','zapata corrida','zapata muro','zapata aislada','zapata columna','pilote','pilotes','losa fundacion','losa de fundacion','platea',
    'columna','castillo','viga','nervio','losa','entrepiso','mamposteria','mamposter','bloque','muro',
    'contrapiso','contra piso','enlucido','revoque','repello','cerámica','ceramica','porcelanato','baldosa',
    'pintura','pintado','cubierta','techo','zinc','teja',
    'cielo raso','cielorraso','gypsum','drywall','plafon','plafón',
    'impermeabil','membrana asfalt',
    'puerta','portón','porton',
    'ventana','vidriera','celosia','celosía',
    'tuberia','tubería','tubo','ducto','conduit',
    'eléctric','electric','punto luz','tomacorriente','apagador','luminaria','breaker','disyuntor',
    'escalera','peldaño','pelda',
    'acera','andén','anden','patio exterior','pavimento','adoquin','adoquín',
    'aparato sanitario','inodoro','sanitario','lavabo','lavamanos','ducha','regadera',
    'closet','armario','ropero','guardarropa',
    'revestimiento','enchape','enchap','baldosa pared','azulejo',
    'piso flotante','laminado','vinilico','vinílico','parquet','bambú',
    'muro perimetral','cerca','cerco','barda','tapia','verja',
    'cisterna','tanque','aljibe','reservorio',
    'instalacion sanitaria','instalación sanitaria','tuberia agua','tubería agua','fontaneria','fontanería','plomeria','plomería',
    'desbanque','descapote','limpieza terreno','limpieza del terreno','nivelacion terreno',
    'carpinteria aluminio','carpintería aluminio','aluminio y vidrio','mampara','celosia aluminio','celosía aluminio',
    'instalacion gas','instalación gas','tuberia gas','tubería gas','punto gas',
    'jardineria','jardinería','paisajismo','area verde','área verde','cesped','césped',
    'estructura metalica','estructura metálica','cubierta metalica','cubierta metálica','pergola','pérgola','galpon','galpón',
  ];

  isKnownPreliminares(apu: any): boolean {
    if (!apu) return false;
    if (this.KNOWN_CODES.includes(apu.code)) return true;
    const name = (apu.name || '').toLowerCase();
    return this.KNOWN_NAMES.some(n => name.includes(n));
  }

  imprevistosPct() {
    return this.projectService.activeBudget()?.contingency_rate || 5;
  }

  imprevistos() {
    return this.projectService.activeBudget()?.contingency_total || 0;
  }

  subtotalEq() {
    return 0;
  }

  calculatedQuantity() {
    return this.apuParameters()['cantidad_calculada'] || 0;
  }

  equiposRows() {
    return [];
  }

  manoObraRows() {
    return [];
  }

  materialesRows() {
    return [];
  }

  subtotalMat() {
    return 0;
  }

  subtotalMO() {
    return 0;
  }
}
