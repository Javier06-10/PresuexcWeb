import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiState } from '../../../services/ui-state';
import { ProjectService } from '../../../services/project';
import { ApuService } from '../../../services/apu.service';
import { SupabaseService } from '../../../services/supabase.service';
import { CatalogService } from '../../../services/catalog.service';
import { showError, showWarning } from '../../../utils/alert.util';

@Component({
  selector: 'app-item-options-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './item-options-modal.html'
})
export class ItemOptionsModal {
  uiState = inject(UiState);
  projectService = inject(ProjectService);
  apuService = inject(ApuService);
  supabaseService = inject(SupabaseService);
  catalogService = inject(CatalogService);

  isCreatingApuMode = false;
  isSelectingTemplateMode = false;
  selectedCategoryId = '';
  selectedGroupId = '';
  selectedTemplateId = '';
  newApuName = '';
  newApuUnit = 'UND';

  templateCategories = [
      {
          id: 'cat_obra_gris',
          name: 'Obra Gris',
          groups: [
              { 
                  id: 'og_cim', name: 'Cimentación', 
                  templates: [
                      { id: 'og_cim_1', name: 'Zapata de muro en parrilla', unit: 'M3', items: [
                          { group_name: 'materials', resource_type: 'free', description: 'Hormigón 210 kg/cm2', quantity: 1.05, unit: 'M3', unit_price: 6000 },
                          { group_name: 'materials', resource_type: 'free', description: 'Acero de Refuerzo', quantity: 80, unit: 'KG', unit_price: 65 },
                          { group_name: 'labor', resource_type: 'free', description: 'Mano de obra', quantity: 0.8, unit: 'DIA', unit_price: 2500 }
                      ]},
                      { id: 'og_cim_2', name: 'Viga zapata', unit: 'M3', items: [
                          { group_name: 'materials', resource_type: 'free', description: 'Hormigón 210 kg/cm2', quantity: 1.05, unit: 'M3', unit_price: 6000 },
                          { group_name: 'materials', resource_type: 'free', description: 'Acero de Refuerzo', quantity: 100, unit: 'KG', unit_price: 65 },
                          { group_name: 'labor', resource_type: 'free', description: 'Mano de obra', quantity: 1, unit: 'DIA', unit_price: 2500 }
                      ]},
                      { id: 'og_cim_3', name: 'Zapata de columna o aislada', unit: 'M3', items: [
                          { group_name: 'materials', resource_type: 'free', description: 'Hormigón 210 kg/cm2', quantity: 1.05, unit: 'M3', unit_price: 6000 },
                          { group_name: 'materials', resource_type: 'free', description: 'Acero de Refuerzo', quantity: 90, unit: 'KG', unit_price: 65 },
                          { group_name: 'labor', resource_type: 'free', description: 'Mano de obra', quantity: 0.9, unit: 'DIA', unit_price: 2500 }
                      ]},
                      { id: 'og_cim_4', name: 'Losa de fundación o platea', unit: 'M3', items: [
                          { group_name: 'materials', resource_type: 'free', description: 'Hormigón 210 kg/cm2', quantity: 1.05, unit: 'M3', unit_price: 6000 },
                          { group_name: 'materials', resource_type: 'free', description: 'Acero de Refuerzo', quantity: 120, unit: 'KG', unit_price: 65 },
                          { group_name: 'labor', resource_type: 'free', description: 'Mano de obra', quantity: 1.2, unit: 'DIA', unit_price: 2500 }
                      ]}
                  ] 
              },
              { 
                  id: 'og_col', name: 'Columnas (castillos o pilar)', 
                  templates: [
                      { id: 'og_col_1', name: 'Rectangulares', unit: 'M3', items: [
                          { group_name: 'materials', resource_type: 'free', description: 'Hormigón 210 kg/cm2', quantity: 1.05, unit: 'M3', unit_price: 6000 },
                          { group_name: 'materials', resource_type: 'free', description: 'Acero de Refuerzo', quantity: 150, unit: 'KG', unit_price: 65 },
                          { group_name: 'materials', resource_type: 'free', description: 'Madera para Encofrado', quantity: 20, unit: 'P2', unit_price: 80 },
                          { group_name: 'labor', resource_type: 'free', description: 'Mano de obra', quantity: 0.8, unit: 'DIA', unit_price: 2500 }
                      ]},
                      { id: 'og_col_2', name: 'Circulares', unit: 'M3', items: [
                          { group_name: 'materials', resource_type: 'free', description: 'Hormigón 210 kg/cm2', quantity: 1.05, unit: 'M3', unit_price: 6000 },
                          { group_name: 'materials', resource_type: 'free', description: 'Acero de Refuerzo', quantity: 160, unit: 'KG', unit_price: 65 },
                          { group_name: 'materials', resource_type: 'free', description: 'Encofrado Circular (Tubo de Cartón/Metal)', quantity: 1, unit: 'ML', unit_price: 800 },
                          { group_name: 'labor', resource_type: 'free', description: 'Mano de obra', quantity: 1, unit: 'DIA', unit_price: 2500 }
                      ]},
                      { id: 'og_col_3', name: 'Poligonales', unit: 'M3', items: [
                          { group_name: 'materials', resource_type: 'free', description: 'Hormigón 210 kg/cm2', quantity: 1.05, unit: 'M3', unit_price: 6000 },
                          { group_name: 'materials', resource_type: 'free', description: 'Acero de Refuerzo', quantity: 155, unit: 'KG', unit_price: 65 },
                          { group_name: 'materials', resource_type: 'free', description: 'Madera para Encofrado Especial', quantity: 25, unit: 'P2', unit_price: 80 },
                          { group_name: 'labor', resource_type: 'free', description: 'Mano de obra', quantity: 1.2, unit: 'DIA', unit_price: 2500 }
                      ]}
                  ] 
              },
              { 
                  id: 'og_vig', name: 'Vigas (trabe)', 
                  templates: [
                      { id: 'og_vig_1', name: 'Viga de amarre', unit: 'M3', items: [
                          { group_name: 'materials', resource_type: 'free', description: 'Hormigón 210 kg/cm2', quantity: 1.05, unit: 'M3', unit_price: 6000 },
                          { group_name: 'materials', resource_type: 'free', description: 'Acero de Refuerzo', quantity: 140, unit: 'KG', unit_price: 65 },
                          { group_name: 'labor', resource_type: 'free', description: 'Mano de obra', quantity: 0.8, unit: 'DIA', unit_price: 2500 }
                      ]},
                      { id: 'og_vig_2', name: 'Viga dintel', unit: 'ML', items: [
                          { group_name: 'materials', resource_type: 'free', description: 'Hormigón 210 kg/cm2', quantity: 0.04, unit: 'M3', unit_price: 6000 },
                          { group_name: 'materials', resource_type: 'free', description: 'Acero de Refuerzo', quantity: 4, unit: 'KG', unit_price: 65 },
                          { group_name: 'labor', resource_type: 'free', description: 'Mano de obra', quantity: 0.1, unit: 'DIA', unit_price: 2500 }
                      ]},
                      { id: 'og_vig_3', name: 'Viga peraltadas y colgantes', unit: 'M3', items: [
                          { group_name: 'materials', resource_type: 'free', description: 'Hormigón 210 kg/cm2', quantity: 1.05, unit: 'M3', unit_price: 6000 },
                          { group_name: 'materials', resource_type: 'free', description: 'Acero de Refuerzo', quantity: 180, unit: 'KG', unit_price: 65 },
                          { group_name: 'labor', resource_type: 'free', description: 'Mano de obra', quantity: 1.2, unit: 'DIA', unit_price: 2500 }
                      ]},
                      { id: 'og_vig_4', name: 'Viga tipo T', unit: 'M3', items: [
                          { group_name: 'materials', resource_type: 'free', description: 'Hormigón 210 kg/cm2', quantity: 1.05, unit: 'M3', unit_price: 6000 },
                          { group_name: 'materials', resource_type: 'free', description: 'Acero de Refuerzo', quantity: 160, unit: 'KG', unit_price: 65 },
                          { group_name: 'labor', resource_type: 'free', description: 'Mano de obra', quantity: 1.1, unit: 'DIA', unit_price: 2500 }
                      ]}
                  ] 
              },
              { 
                  id: 'og_los', name: 'Losas', 
                  templates: [
                      { id: 'og_los_1', name: 'Losa maciza', unit: 'M3', items: [
                          { group_name: 'materials', resource_type: 'free', description: 'Hormigón 210 kg/cm2', quantity: 1.05, unit: 'M3', unit_price: 6000 },
                          { group_name: 'materials', resource_type: 'free', description: 'Acero de Refuerzo', quantity: 120, unit: 'KG', unit_price: 65 },
                          { group_name: 'labor', resource_type: 'free', description: 'Mano de obra', quantity: 0.8, unit: 'DIA', unit_price: 2500 }
                      ]},
                      { id: 'og_los_2', name: 'Losa aligerada', unit: 'M2', items: [
                          { group_name: 'materials', resource_type: 'free', description: 'Hormigón 210 kg/cm2', quantity: 0.12, unit: 'M3', unit_price: 6000 },
                          { group_name: 'materials', resource_type: 'free', description: 'Acero de Refuerzo', quantity: 10, unit: 'KG', unit_price: 65 },
                          { group_name: 'materials', resource_type: 'free', description: 'Bloques de EPS / Bovedilla', quantity: 4, unit: 'UND', unit_price: 150 },
                          { group_name: 'labor', resource_type: 'free', description: 'Mano de obra', quantity: 0.2, unit: 'DIA', unit_price: 2500 }
                      ]},
                      { id: 'og_los_3', name: 'Losa metaldeck', unit: 'M2', items: [
                          { group_name: 'materials', resource_type: 'free', description: 'Hormigón 210 kg/cm2', quantity: 0.1, unit: 'M3', unit_price: 6000 },
                          { group_name: 'materials', resource_type: 'free', description: 'Malla Electrosoldada', quantity: 1.1, unit: 'M2', unit_price: 180 },
                          { group_name: 'materials', resource_type: 'free', description: 'Lámina Metaldeck', quantity: 1.05, unit: 'M2', unit_price: 850 },
                          { group_name: 'labor', resource_type: 'free', description: 'Mano de obra', quantity: 0.2, unit: 'DIA', unit_price: 2500 }
                      ]}
                  ] 
              },
              { 
                  id: 'og_mur', name: 'Muros', 
                  templates: [
                      { id: 'og_mur_1', name: 'Muros de bloques o ladrillos', unit: 'M2', items: [
                          { group_name: 'materials', resource_type: 'free', description: 'Bloques de 6"', quantity: 13, unit: 'UND', unit_price: 45 },
                          { group_name: 'materials', resource_type: 'free', description: 'Mortero', quantity: 0.02, unit: 'M3', unit_price: 4500 },
                          { group_name: 'labor', resource_type: 'free', description: 'Mano de obra', quantity: 0.2, unit: 'DIA', unit_price: 2000 }
                      ]},
                      { id: 'og_mur_2', name: 'Muros en formaleta', unit: 'M3', items: [
                          { group_name: 'materials', resource_type: 'free', description: 'Hormigón', quantity: 1.05, unit: 'M3', unit_price: 6000 },
                          { group_name: 'materials', resource_type: 'free', description: 'Acero de Refuerzo', quantity: 60, unit: 'KG', unit_price: 65 },
                          { group_name: 'labor', resource_type: 'free', description: 'Mano de obra', quantity: 1, unit: 'DIA', unit_price: 2500 }
                      ]}
                  ] 
              }
          ]
      },
      {
          id: 'cat_terminaciones',
          name: 'Terminaciones',
          groups: [
              { 
                  id: 'te_pis', name: 'Pisos', 
                  templates: [{ id: 't_pis', name: 'Cerámica / Porcelanato', unit: 'M2', items: [
                      { group_name: 'materials', resource_type: 'free', description: 'Cerámica / Porcelanato', quantity: 1.05, unit: 'M2', unit_price: 800 },
                      { group_name: 'labor', resource_type: 'free', description: 'Colocación de Piso', quantity: 1, unit: 'M2', unit_price: 350 }
                  ] }]
              },
              { 
                  id: 'te_zoc', name: 'Zócalos', 
                  templates: [{ id: 't_zoc', name: 'Zócalo Estándar', unit: 'ML', items: [
                      { group_name: 'materials', resource_type: 'free', description: 'Zócalo', quantity: 1.05, unit: 'ML', unit_price: 150 },
                      { group_name: 'labor', resource_type: 'free', description: 'Colocación de Zócalo', quantity: 1, unit: 'ML', unit_price: 100 }
                  ] }]
              },
              { 
                  id: 'te_rev', name: 'Revestimiento de escalón', 
                  templates: [{ id: 't_rev', name: 'Revestimiento Básico', unit: 'M2', items: [
                      { group_name: 'materials', resource_type: 'free', description: 'Revestimiento', quantity: 1.1, unit: 'M2', unit_price: 900 },
                      { group_name: 'labor', resource_type: 'free', description: 'Instalador', quantity: 1, unit: 'M2', unit_price: 500 }
                  ] }]
              },
              { 
                  id: 'te_pin', name: 'Pintura', 
                  templates: [{ id: 't_pin', name: 'Pintura Acrílica', unit: 'M2', items: [
                      { group_name: 'materials', resource_type: 'free', description: 'Pintura Acrílica', quantity: 0.05, unit: 'GAL', unit_price: 1200 },
                      { group_name: 'labor', resource_type: 'free', description: 'Pintor', quantity: 1, unit: 'M2', unit_price: 120 }
                  ] }]
              },
              { id: 'te_psh', name: 'Pared en sheetrock', templates: [{ id: 't_psh', name: 'Pared Sheetrock Básico', unit: 'M2', items: [{ group_name: 'materials', resource_type: 'free', description: 'Plancha de Sheetrock', quantity: 0.35, unit: 'UND', unit_price: 450 }, { group_name: 'labor', resource_type: 'free', description: 'Instalación', quantity: 1, unit: 'M2', unit_price: 400 }] }] },
              { id: 'te_pgl', name: 'Paredes en glass', templates: [{ id: 't_pgl', name: 'Cristal Templado', unit: 'M2', items: [{ group_name: 'materials', resource_type: 'free', description: 'Cristal Templado', quantity: 1.05, unit: 'M2', unit_price: 3500 }, { group_name: 'labor', resource_type: 'free', description: 'Instalación de Cristales', quantity: 1, unit: 'M2', unit_price: 800 }] }] },
              { id: 'te_tsh', name: 'Techos en sheetrock', templates: [{ id: 't_tsh', name: 'Techo Sheetrock', unit: 'M2', items: [{ group_name: 'materials', resource_type: 'free', description: 'Plancha de Sheetrock', quantity: 0.35, unit: 'UND', unit_price: 450 }, { group_name: 'labor', resource_type: 'free', description: 'Instalación de Techo', quantity: 1, unit: 'M2', unit_price: 450 }] }] },
              { id: 'te_fac', name: 'Facias', templates: [{ id: 't_fac', name: 'Facia Lineal', unit: 'ML', items: [{ group_name: 'materials', resource_type: 'free', description: 'Sheetrock y Perfiles', quantity: 1, unit: 'ML', unit_price: 250 }, { group_name: 'labor', resource_type: 'free', description: 'Instalador de Facias', quantity: 1, unit: 'ML', unit_price: 300 }] }] }
          ]
      },
      {
          id: 'cat_electricidad',
          name: 'Electricidad',
          groups: [
              { id: 'el_luc', name: 'Luces', templates: [{ id: 't_luc', name: 'Luminaria Estándar', unit: 'UND', items: [{ group_name: 'materials', resource_type: 'free', description: 'Luminaria / Lámpara', quantity: 1, unit: 'UND', unit_price: 800 }, { group_name: 'labor', resource_type: 'free', description: 'Electricista', quantity: 1, unit: 'UND', unit_price: 400 }] }] },
              { id: 'el_int', name: 'Interruptores', templates: [{ id: 't_int', name: 'Interruptor Sencillo', unit: 'UND', items: [{ group_name: 'materials', resource_type: 'free', description: 'Interruptor', quantity: 1, unit: 'UND', unit_price: 250 }, { group_name: 'labor', resource_type: 'free', description: 'Instalación', quantity: 1, unit: 'UND', unit_price: 300 }] }] },
              { id: 'el_tom', name: 'Toma corrientes', templates: [{ id: 't_tom', name: 'Tomacorriente Doble', unit: 'UND', items: [{ group_name: 'materials', resource_type: 'free', description: 'Tomacorriente', quantity: 1, unit: 'UND', unit_price: 300 }, { group_name: 'labor', resource_type: 'free', description: 'Instalación', quantity: 1, unit: 'UND', unit_price: 300 }] }] },
              { id: 'el_pan', name: 'Paneles', templates: [{ id: 't_pan', name: 'Panel de Distribución', unit: 'UND', items: [{ group_name: 'materials', resource_type: 'free', description: 'Panel de Breakers', quantity: 1, unit: 'UND', unit_price: 3500 }, { group_name: 'labor', resource_type: 'free', description: 'Instalación de Panel', quantity: 1, unit: 'UND', unit_price: 2500 }] }] },
              { id: 'el_gen', name: 'Instalaciones generales', templates: [{ id: 't_gen_e', name: 'Acometida Eléctrica', unit: 'GLB', items: [{ group_name: 'materials', resource_type: 'free', description: 'Materiales Generales', quantity: 1, unit: 'GLB', unit_price: 5000 }, { group_name: 'labor', resource_type: 'free', description: 'Mano de Obra Global', quantity: 1, unit: 'GLB', unit_price: 8000 }] }] }
          ]
      },
      {
          id: 'cat_plomeria',
          name: 'Plomería',
          groups: [
              { id: 'pl_int', name: 'Instalaciones internas', templates: [{ id: 't_pli', name: 'Red Interna Agua', unit: 'GLB', items: [{ group_name: 'materials', resource_type: 'free', description: 'Tuberías y Piezas', quantity: 1, unit: 'GLB', unit_price: 3000 }, { group_name: 'labor', resource_type: 'free', description: 'Plomero', quantity: 1, unit: 'GLB', unit_price: 4500 }] }] },
              { id: 'pl_ex_a', name: 'Instalaciones externas (Agua Potable)', templates: [{ id: 't_plea', name: 'Tubería Exterior', unit: 'ML', items: [{ group_name: 'materials', resource_type: 'free', description: 'Tubo PVC Presión', quantity: 1.05, unit: 'ML', unit_price: 80 }, { group_name: 'labor', resource_type: 'free', description: 'Excavación e Instalación', quantity: 1, unit: 'ML', unit_price: 150 }] }] },
              { id: 'pl_ex_d', name: 'Instalaciones externas (Drenaje Sanitario)', templates: [{ id: 't_pled', name: 'Tubería Sanitaria', unit: 'ML', items: [{ group_name: 'materials', resource_type: 'free', description: 'Tubo PVC Sanitario', quantity: 1.05, unit: 'ML', unit_price: 120 }, { group_name: 'labor', resource_type: 'free', description: 'Excavación e Instalación', quantity: 1, unit: 'ML', unit_price: 200 }] }] },
              { id: 'pl_lav', name: 'Lavamanos', templates: [{ id: 't_plla', name: 'Lavamanos con Pedestal', unit: 'UND', items: [{ group_name: 'materials', resource_type: 'free', description: 'Lavamanos y Llave', quantity: 1, unit: 'UND', unit_price: 4500 }, { group_name: 'labor', resource_type: 'free', description: 'Instalación', quantity: 1, unit: 'UND', unit_price: 1000 }] }] },
              { id: 'pl_ino', name: 'Inodoro (WC)', templates: [{ id: 't_plin', name: 'Inodoro Standard', unit: 'UND', items: [{ group_name: 'materials', resource_type: 'free', description: 'Inodoro Completo', quantity: 1, unit: 'UND', unit_price: 5500 }, { group_name: 'labor', resource_type: 'free', description: 'Instalación', quantity: 1, unit: 'UND', unit_price: 1200 }] }] },
              { id: 'pl_fre', name: 'Fregadero (lavadero)', templates: [{ id: 't_plfr', name: 'Fregadero Acero Inox', unit: 'UND', items: [{ group_name: 'materials', resource_type: 'free', description: 'Fregadero y Llave', quantity: 1, unit: 'UND', unit_price: 3800 }, { group_name: 'labor', resource_type: 'free', description: 'Instalación', quantity: 1, unit: 'UND', unit_price: 1000 }] }] },
              { id: 'pl_des', name: 'Desagüe de piso', templates: [{ id: 't_plde', name: 'Drenaje de Piso', unit: 'UND', items: [{ group_name: 'materials', resource_type: 'free', description: 'Drenaje / Rejilla', quantity: 1, unit: 'UND', unit_price: 300 }, { group_name: 'labor', resource_type: 'free', description: 'Instalación', quantity: 1, unit: 'UND', unit_price: 400 }] }] },
              { id: 'pl_reg', name: 'Registros y trampas', templates: [{ id: 't_plre', name: 'Registro Sanitario', unit: 'UND', items: [{ group_name: 'materials', resource_type: 'free', description: 'Materiales de Registro', quantity: 1, unit: 'GLB', unit_price: 1500 }, { group_name: 'labor', resource_type: 'free', description: 'Construcción', quantity: 1, unit: 'UND', unit_price: 2000 }] }] },
              { id: 'pl_sep', name: 'Séptico', templates: [{ id: 't_plse', name: 'Fosa Séptica', unit: 'UND', items: [{ group_name: 'materials', resource_type: 'free', description: 'Materiales Construcción', quantity: 1, unit: 'GLB', unit_price: 15000 }, { group_name: 'labor', resource_type: 'free', description: 'Construcción', quantity: 1, unit: 'GLB', unit_price: 12000 }] }] },
              { id: 'pl_cis', name: 'Cisterna', templates: [{ id: 't_plci', name: 'Cisterna de Hormigón', unit: 'UND', items: [{ group_name: 'materials', resource_type: 'free', description: 'Materiales Cisterna', quantity: 1, unit: 'GLB', unit_price: 25000 }, { group_name: 'labor', resource_type: 'free', description: 'Construcción', quantity: 1, unit: 'GLB', unit_price: 18000 }] }] }
          ]
      },
      {
          id: 'cat_generalidades',
          name: 'Generalidades',
          groups: [
              { id: 'ge_top', name: 'Tope para revestimiento de cocina', templates: [{ id: 't_geto', name: 'Tope de Granito', unit: 'ML', items: [{ group_name: 'materials', resource_type: 'free', description: 'Granito / Mármol', quantity: 1, unit: 'ML', unit_price: 4500 }, { group_name: 'labor', resource_type: 'free', description: 'Instalación de Tope', quantity: 1, unit: 'ML', unit_price: 1200 }] }] },
              { id: 'ge_gab', name: 'Gabinete de cocina', templates: [{ id: 't_gega', name: 'Gabinete Madera', unit: 'ML', items: [{ group_name: 'materials', resource_type: 'free', description: 'Gabinete en Madera', quantity: 1, unit: 'ML', unit_price: 8000 }, { group_name: 'labor', resource_type: 'free', description: 'Instalación', quantity: 1, unit: 'ML', unit_price: 1500 }] }] },
              { id: 'ge_pue', name: 'Puertas', templates: [{ id: 't_gepu', name: 'Puerta Principal', unit: 'UND', items: [{ group_name: 'materials', resource_type: 'free', description: 'Puerta y Marcos', quantity: 1, unit: 'UND', unit_price: 5500 }, { group_name: 'labor', resource_type: 'free', description: 'Instalación', quantity: 1, unit: 'UND', unit_price: 1500 }] }] },
              { id: 'ge_ven', name: 'Ventanas', templates: [{ id: 't_geve', name: 'Ventana Corrediza', unit: 'UND', items: [{ group_name: 'materials', resource_type: 'free', description: 'Ventana', quantity: 1, unit: 'UND', unit_price: 4500 }, { group_name: 'labor', resource_type: 'free', description: 'Instalación', quantity: 1, unit: 'UND', unit_price: 800 }] }] },
              { id: 'ge_arm', name: 'Armario (closet)', templates: [{ id: 't_gear', name: 'Closet Modular', unit: 'UND', items: [{ group_name: 'materials', resource_type: 'free', description: 'Materiales Closet', quantity: 1, unit: 'UND', unit_price: 9000 }, { group_name: 'labor', resource_type: 'free', description: 'Instalación', quantity: 1, unit: 'UND', unit_price: 2000 }] }] },
              { id: 'ge_bar', name: 'Barandas', templates: [{ id: 't_geba', name: 'Baranda Metálica', unit: 'ML', items: [{ group_name: 'materials', resource_type: 'free', description: 'Acero / Hierro', quantity: 1, unit: 'ML', unit_price: 3500 }, { group_name: 'labor', resource_type: 'free', description: 'Instalación', quantity: 1, unit: 'ML', unit_price: 800 }] }] }
          ]
      }
  ];

  get availableGroups() {
      const cat = this.templateCategories.find(c => c.id === this.selectedCategoryId);
      return cat ? cat.groups : [];
  }

  get availableTemplates() {
      const cat = this.templateCategories.find(c => c.id === this.selectedCategoryId);
      if (!cat) return [];
      const group = cat.groups.find(g => g.id === this.selectedGroupId);
      return group ? group.templates : [];
  }

  get allTemplatesFlat() {
      let all: {id: string, name: string, unit: string, items: any[]}[] = [];
      for (const cat of this.templateCategories) {
          for (const group of cat.groups) {
              all.push(...group.templates);
          }
      }
      return all;
  }

  availableUnits = computed(() => {
    const units = new Set<string>(['UND', 'M2', 'M3', 'ML', 'PA', 'GLB', 'KG', 'QQ', 'GL', 'P2', 'GAL', 'MES', 'DIA', 'HR']);
    
    this.catalogService.materials().forEach(m => { if (m.unit) units.add(m.unit.toUpperCase()) });
    this.catalogService.labor().forEach(l => { if (l.unit) units.add(l.unit.toUpperCase()) });
    this.catalogService.equipment().forEach(e => { if (e.unit) units.add(e.unit.toUpperCase()) });
    
    return Array.from(units).sort();
  });

  openCatalog() {
    this.uiState.isItemOptionsModalOpen.set(false);
    this.uiState.catalogPickerDefaultTab.set('apus');
    this.uiState.isCatalogPickerOpen.set(true);
  }

  openApuEditor() {
    const item = this.uiState.activeBudgetItemForOptions();
    this.newApuName = item?.description || '';
    this.newApuUnit = item?.unit || 'UND';
    this.isCreatingApuMode = true;
  }

  openTemplateSelector() {
    this.isSelectingTemplateMode = true;
    this.selectedCategoryId = '';
    this.selectedGroupId = '';
    this.selectedTemplateId = '';
  }

  onCategoryChange() {
    this.selectedGroupId = '';
    this.selectedTemplateId = '';
  }

  onGroupChange() {
    this.selectedTemplateId = '';
    const templates = this.availableTemplates;
    if (templates.length === 1) {
        this.selectedTemplateId = templates[0].id;
    }
  }

  onTemplateFlatChange() {
    const tpl = this.allTemplatesFlat.find((t: any) => t.id === this.selectedTemplateId);
    if (tpl) {
        this.newApuName = tpl.name;
    }
  }

  async confirmUseTemplate() {
    const tpl = this.allTemplatesFlat.find((t: any) => t.id === this.selectedTemplateId);
    if (!tpl) return;
    
    this.newApuName = tpl.name;
    this.newApuUnit = tpl.unit;
    
    const item = this.uiState.activeBudgetItemForOptions();
    this.projectService.isSaving.set(true);
    
    const finalUnit = this.newApuUnit ? this.newApuUnit.trim().toUpperCase() : 'UND';
    const created = await this.apuService.createApu(this.newApuName, finalUnit);
    
    if (created) {
        if (tpl.items && tpl.items.length > 0) {
            for (const [index, tplItem] of tpl.items.entries()) {
                await this.apuService.addApuItem(created.id, {
                    apu_id: created.id,
                    sort_order: index + 1,
                    group_name: tplItem.group_name,
                    resource_type: tplItem.resource_type,
                    description: tplItem.description,
                    quantity: tplItem.quantity,
                    unit: tplItem.unit,
                    unit_price: tplItem.unit_price,
                    subtotal: tplItem.quantity * tplItem.unit_price
                });
            }
        }
        
        this.projectService.isSaving.set(false);
        this.uiState.isItemOptionsModalOpen.set(false);
        this.isSelectingTemplateMode = false;
        
        this._linkApuToBudgetItem(item, created);
    } else {
        this.projectService.isSaving.set(false);
        showError("Error al crear la plantilla.");
    }
  }

  async confirmCreateApu() {
    if (!this.newApuName.trim()) {
        showWarning("El nombre es requerido.");
        return;
    }

    const item = this.uiState.activeBudgetItemForOptions();
    
    this.projectService.isSaving.set(true);
    // Create the APU template in the DB
    const finalUnit = this.newApuUnit ? this.newApuUnit.trim().toUpperCase() : 'UND';
    const created = await this.apuService.createApu(this.newApuName, finalUnit);
    this.projectService.isSaving.set(false);
    
    if (created) {
      this.uiState.isItemOptionsModalOpen.set(false);
      this.isCreatingApuMode = false;
      
      this._linkApuToBudgetItem(item, created);
    } else {
      showError("Error al crear el APU.");
    }
  }

  closeModal() {
    this.uiState.isItemOptionsModalOpen.set(false);
    this.uiState.activeBudgetItemForOptions.set(null);
    this.uiState.activeChapterForPicker.set(null);
    this.isCreatingApuMode = false;
    this.isSelectingTemplateMode = false;
    this.selectedCategoryId = '';
    this.selectedGroupId = '';
    this.selectedTemplateId = '';
  }

  private _linkApuToBudgetItem(item: any, created: any) {
      if (item) {
        item.description = created.name;
        item.unit = created.unit;
        item.unit_price = 0;
        item.total = 0;
        item.apu_template_id = created.id;
        
        this.projectService.updateTotal();
        
        this.supabaseService.client.from('budget_items').update({
            description: item.description,
            unit: item.unit,
            unit_price: item.unit_price,
            apu_template_id: item.apu_template_id
        }).eq('id', item.id).then(async () => {
            await this.supabaseService.client.rpc('recalculate_budget_item', { p_item_id: item.id });
            const { data: updatedDbItem } = await this.supabaseService.client.from('budget_items').select('*').eq('id', item.id).single();
            if (updatedDbItem) {
                item.unit_price = updatedDbItem.unit_price;
                item.total = updatedDbItem.total;
                item.apu_snapshot = updatedDbItem.apu_snapshot;
                this.projectService.updateTotal();
            }
        });
      } else {
        const chapter = this.uiState.activeChapterForPicker();
        if (chapter) {
            if (!chapter.items) chapter.items = [];
            const newItem = {
                id: crypto.randomUUID(),
                budget_id: chapter.budget_id,
                chapter_id: chapter.id,
                item_number: `${chapter.chapter_number}.0${chapter.items.length + 1}`,
                description: created.name,
                quantity: 1,
                unit: created.unit,
                unit_price: 0,
                total: 0,
                sort_order: chapter.items.length + 1,
                apu_template_id: created.id
            };
            
            chapter.items.push(newItem as any);
            this.projectService.updateTotal();
            
            const dbPayload = {
                id: newItem.id,
                budget_id: newItem.budget_id,
                chapter_id: newItem.chapter_id,
                item_number: newItem.item_number,
                description: newItem.description,
                quantity: newItem.quantity,
                unit: newItem.unit,
                unit_price: newItem.unit_price,
                sort_order: newItem.sort_order,
                apu_template_id: newItem.apu_template_id
            };
            
            this.supabaseService.client.from('budget_items').insert([dbPayload]).then(async (res: any) => {
                if (res.error) {
                    console.error("Error inserting APU item:", res.error);
                } else {
                    await this.supabaseService.client.rpc('recalculate_budget_item', { p_item_id: newItem.id });
                    const { data: updatedDbItem } = await this.supabaseService.client.from('budget_items').select('*').eq('id', newItem.id).single();
                    if (updatedDbItem) {
                        const localItem = chapter.items!.find((i: any) => i.id === newItem.id);
                        if (localItem) {
                            localItem.unit_price = updatedDbItem.unit_price;
                            localItem.total = updatedDbItem.total;
                            localItem.apu_snapshot = updatedDbItem.apu_snapshot;
                            this.projectService.updateTotal();
                        }
                    }
                }
            });
        }
      }

      this.uiState.activeApuId.set(created.id);
      this.uiState.isApuEditorOpen.set(true);
  }
}
