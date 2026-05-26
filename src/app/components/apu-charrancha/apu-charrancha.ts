import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-apu-charrancha',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './apu-charrancha.html',
  styleUrls: ['./apu-charrancha.css'],
})
export class ApuCharranchaComponent implements OnInit, OnChanges {
  @Input() apuParameters: any = {};
  @Output() parametersChange = new EventEmitter<any>();

  areaTerreno    = signal<number>(0);
  perimetro      = signal<number>(0);
  tipoNivelacion = signal<string>('Topografía instrumental');

  topografo   = signal<number>(1);
  ayudantes   = signal<number>(2);
  rendimiento = signal<number>(500);

  areaReplanteo = computed(() => this.areaTerreno());
  duracionCalc  = computed(() => { const r = this.rendimiento(); return r ? Math.ceil(this.areaReplanteo()/r) : 0; });

  constructor() {
    effect(() => {
      this.parametersChange.emit({
        ...this.apuParameters,
        areaTerreno: this.areaTerreno(), perimetro: this.perimetro(),
        tipoNivelacion: this.tipoNivelacion(),
        topografo: this.topografo(), ayudantes: this.ayudantes(), rendimiento: this.rendimiento(),
        cantidad_calculada: this.areaReplanteo(),
      });
    });
  }

  private _loadFromParams() {
    const p = this.apuParameters;
    if (p?.areaTerreno   != null) this.areaTerreno.set(p.areaTerreno);
    if (p?.perimetro     != null) this.perimetro.set(p.perimetro);
    if (p?.tipoNivelacion)        this.tipoNivelacion.set(p.tipoNivelacion);
    if (p?.topografo     != null) this.topografo.set(p.topografo);
    if (p?.ayudantes     != null) this.ayudantes.set(p.ayudantes);
    if (p?.rendimiento   != null) this.rendimiento.set(p.rendimiento);
  }

  ngOnInit() { this._loadFromParams(); }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['apuParameters'] && !changes['apuParameters'].firstChange) {
      this._loadFromParams();
    }
  }
}
