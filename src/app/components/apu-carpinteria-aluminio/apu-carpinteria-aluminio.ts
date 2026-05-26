import { Component, Input, Output, EventEmitter, signal, computed, effect, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ElementoAluminio {
  descripcion: string;
  tipo: string;
  ancho: number;
  alto: number;
  cant: number;
}

@Component({
  selector: 'app-apu-carpinteria-aluminio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './apu-carpinteria-aluminio.html',
  styles: [``]
})
export class ApuCarpinteriaAluminio implements OnInit, OnChanges {
  @Input() apuParameters: any;
  @Output() parametersChange = new EventEmitter<any>();

  readonly TIPOS = [
    'Ventana corredera',
    'Ventana proyectante',
    'Ventana fija',
    'Puerta aluminio y vidrio',
    'Puerta corrediza',
    'Mampara de ducha',
    'Cortina de vidrio',
    'Celosía de aluminio',
    'Fachada ventilada',
    'Lucernario / Claraboya',
    'Pergola aluminio',
  ];

  elementos = signal<ElementoAluminio[]>([
    { descripcion: 'Ventana dormitorio', tipo: 'Ventana corredera', ancho: 1.20, alto: 1.00, cant: 2 },
    { descripcion: 'Ventana sala',       tipo: 'Ventana corredera', ancho: 1.80, alto: 1.20, cant: 1 },
  ]);

  perfilTipo          = signal('Aluminio anodizado natural');
  vidrio              = signal('Cristal claro 6mm');
  incluye_instalacion = signal(true);
  incluye_sellado     = signal(true);

  areaTotal = computed(() =>
    this.elementos().reduce((s, e) => s + (e.ancho||0)*(e.alto||0)*(e.cant||1), 0)
  );

  totalPiezas = computed(() =>
    this.elementos().reduce((s, e) => s + (e.cant||1), 0)
  );

  private _firstEmit = false;

  constructor() {
    effect(() => {
      const params = {
        elementos: this.elementos(),
        perfilTipo: this.perfilTipo(),
        vidrio: this.vidrio(),
        incluye_instalacion: this.incluye_instalacion(),
        incluye_sellado: this.incluye_sellado(),
        cantidad_calculada: +this.areaTotal().toFixed(2),
      };
      if (!this._firstEmit) { this._firstEmit = true; return; }
      this.parametersChange.emit(params);
    });
  }

  ngOnInit() { if (this.apuParameters) this._loadFromParams(); }

  ngOnChanges(c: SimpleChanges) {
    if (c['apuParameters'] && !c['apuParameters'].firstChange) this._loadFromParams();
  }

  private _loadFromParams() {
    const p = this.apuParameters;
    if (!p) return;
    if (p.elementos)   this.elementos.set(p.elementos);
    if (p.perfilTipo)  this.perfilTipo.set(p.perfilTipo);
    if (p.vidrio)      this.vidrio.set(p.vidrio);
    if (p.incluye_instalacion != null) this.incluye_instalacion.set(p.incluye_instalacion);
    if (p.incluye_sellado     != null) this.incluye_sellado.set(p.incluye_sellado);
  }

  addElemento() {
    this.elementos.update(e => [...e, { descripcion: 'Elemento', tipo: this.TIPOS[0], ancho: 0, alto: 0, cant: 1 }]);
  }

  removeElemento(i: number) {
    this.elementos.update(e => e.filter((_, idx) => idx !== i));
  }

  updateElemento(i: number, field: keyof ElementoAluminio, val: any) {
    this.elementos.update(e => e.map((x, idx) => idx === i ? { ...x, [field]: val } : x));
  }
}
