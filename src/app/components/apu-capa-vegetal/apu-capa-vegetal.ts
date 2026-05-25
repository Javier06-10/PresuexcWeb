import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface Tramo {
  descripcion: string;
  largo: number;
  ancho: number;
}

@Component({
  selector: 'app-apu-capa-vegetal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './apu-capa-vegetal.html',
  styleUrls: ['./apu-capa-vegetal.css'],
})
export class ApuCapaVegetalComponent implements OnInit {
  @Input() apuParameters: any = {};
  @Output() parametersChange = new EventEmitter<any>();

  tramos = signal<Tramo[]>([]);

  profundidad = signal<number>(0.2);
  esponjamiento = signal<number>(1.3);
  desperdicio = signal<number>(5);
  vegetacion = signal<string>('Pasto / hierba');
  terreno = signal<string>('Plano (<5%)');
  disposicion = signal<string>('Acopio en sitio');

  rendimiento = signal<number>(10);
  peones = signal<number>(4);
  ayudantes = signal<number>(0);
  duracion = signal<number>(0);

  areaTotal = computed(() => {
    return this.tramos().reduce((acc, t) => acc + (t.largo || 0) * (t.ancho || 0), 0);
  });

  volumenBanco = computed(() => {
    return this.areaTotal() * (this.profundidad() || 0);
  });

  volumenEsponjado = computed(() => {
    return this.volumenBanco() * (this.esponjamiento() || 1);
  });

  volumenPresupuestado = computed(() => {
    const volEsp = this.volumenEsponjado();
    return volEsp * (1 + (this.desperdicio() || 0) / 100);
  });

  constructor() {
    effect(() => {
      const newParams = {
        ...this.apuParameters,
        tramos: this.tramos(),
        profundidad: this.profundidad(),
        esponjamiento: this.esponjamiento(),
        desperdicio: this.desperdicio(),
        vegetacion: this.vegetacion(),
        terreno: this.terreno(),
        disposicion: this.disposicion(),
        rendimiento: this.rendimiento(),
        peones: this.peones(),
        ayudantes: this.ayudantes(),
        duracion: this.duracion(),
        cantidad_calculada: this.volumenPresupuestado(),
      };

      this.parametersChange.emit(newParams);
    });
  }

  ngOnInit() {
    if (this.apuParameters) {
      if (this.apuParameters.tramos) this.tramos.set(this.apuParameters.tramos);
      else this.tramos.set([{ descripcion: 'Zona principal', largo: 0, ancho: 0 }]);

      if (this.apuParameters.profundidad !== undefined)
        this.profundidad.set(this.apuParameters.profundidad);
      if (this.apuParameters.esponjamiento !== undefined)
        this.esponjamiento.set(this.apuParameters.esponjamiento);
      if (this.apuParameters.desperdicio !== undefined)
        this.desperdicio.set(this.apuParameters.desperdicio);

      if (this.apuParameters.vegetacion) this.vegetacion.set(this.apuParameters.vegetacion);
      if (this.apuParameters.terreno) this.terreno.set(this.apuParameters.terreno);
      if (this.apuParameters.disposicion) this.disposicion.set(this.apuParameters.disposicion);

      if (this.apuParameters.rendimiento !== undefined)
        this.rendimiento.set(this.apuParameters.rendimiento);
      if (this.apuParameters.peones !== undefined) this.peones.set(this.apuParameters.peones);
      if (this.apuParameters.ayudantes !== undefined)
        this.ayudantes.set(this.apuParameters.ayudantes);
      if (this.apuParameters.duracion !== undefined) this.duracion.set(this.apuParameters.duracion);
    } else {
      this.tramos.set([{ descripcion: 'Zona principal', largo: 0, ancho: 0 }]);
    }
  }

  addTramo() {
    this.tramos.update((t) => [...t, { descripcion: '', largo: 0, ancho: 0 }]);
  }

  removeTramo(index: number) {
    this.tramos.update((t) => {
      const copy = [...t];
      copy.splice(index, 1);
      return copy;
    });
  }

  updateTramo(index: number, field: keyof Tramo, value: any) {
    this.tramos.update((t) => {
      const copy = [...t];
      (copy[index] as any)[field] = value;
      return copy;
    });
  }
}
