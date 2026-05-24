
        let formatoActualGlobal = 'n_num'; 
        let unidadPesoActual = 'kg_m';    
        let elementoSolapeActivo = 'CIMENTACIONES';

        // PERSISTENCIA DE FORMATO Y LOGO
        let colorFilaTitConsolidado = '#8C4F2B';
        let colorFilaSubConsolidado = '#3A3838';
        let logoConsolidadoBase64 = '';
        let fuenteConsolidadaPresupuesto = 'Arial';

        let temp_colorFilaTit = '#8C4F2B';
        let temp_colorFilaSub = '#3A3838';
        let temp_logoBase64 = '';
        let temp_fuentePresupuesto = 'Arial';

        // DATA CENTRALIZADA DE PRECIOS GLOBALES
        let tipoPreciosActivo = 'MAT'; 
        let categoriasPreciosListado = [
            "PRELIMINARES", "ESTRUCTURA Y OBRA GRIS", "TERMINACIONES",
            "INSTALACIONES ELECTRICAS", "INSTALACIONES SANITARIAS", "EXTERIORES",
            "COCINA, VENTANAS, PUERTAS, CLOSET, BARANDAS"
        ];
        
        let basePreciosMemoria = { MAT: {}, MO: {}, JOR: {} };
        let temp_basePreciosMemoria = { MAT: {}, MO: {}, JOR: {} };

        const VALORES_SOLAPE_METROS_DEFECTO = { 3: 0.40, 4: 0.50, 5: 0.65, 6: 0.80, 8: 1.15, 10: 1.45, 12: 1.80 };

        const BARRAS_POR_DEFECTO = [
            { id: 3,  n: '#3',  pulg: '3/8"',   mm: '9.5 mm',  peso_kg: 0.56,  peso_lb: 0.38 },
            { id: 4,  n: '#4',  pulg: '1/2"',   mm: '12.7 mm', peso_kg: 0.99,  peso_lb: 0.67 },
            { id: 5,  n: '#5',  pulg: '5/8"',   mm: '15.9 mm', peso_kg: 1.55,  peso_lb: 1.04 },
            { id: 6,  n: '#6',  pulg: '3/4"',   mm: '19.1 mm', peso_kg: 2.24,  peso_lb: 1.50 },
            { id: 8,  n: '#8',  pulg: '1"',     mm: '25.4 mm', peso_kg: 3.97,  peso_lb: 2.67 },
            { id: 10, n: '#10', pulg: '1-1/4"', mm: '31.8 mm', peso_kg: 6.23,  peso_lb: 4.18 },
            { id: 12, n: '#12', pulg: '1-1/2"', mm: '38.1 mm', peso_kg: 8.94,  peso_lb: 6.01 }
        ];

        let listadoBarras = JSON.parse(JSON.stringify(BARRAS_POR_DEFECTO));
        let valoresSolapesMemoria = {
            CIMENTACIONES: {}, COLUMNAS: {}, VIGAS: {}, LOSA: {}, LOSA_ALIGERADA: {}, MAMPOSTERIA: {}, FORMALETAS: {}
        };

        let temp_listadoBarras = [];
        let temp_valoresSolapesMemoria = {};

        function inicializarMatrizSolapes(targetMatrix) {
            const elementos = ['CIMENTACIONES', 'COLUMNAS', 'VIGAS', 'LOSA', 'LOSA_ALIGERADA', 'FORMALETAS'];
            listadoBarras.forEach(barre => {
                let id = barre.id;
                let valBaseMetros = VALORES_SOLAPE_METROS_DEFECTO[id] || 0.50;
                elementos.forEach(el => { targetMatrix[el][id] = valBaseMetros; });
                targetMatrix['MAMPOSTERIA'][id] = 0.30;
            });
        }

        function inicializarBasePreciosDefecto() {
            ['MAT', 'MO', 'JOR'].forEach(tipo => {
                categoriasPreciosListado.forEach(cat => {
                    basePreciosMemoria[tipo][cat] = [
                        { nombre: "Muestra de Concepto " + (tipo === 'JOR' ? 'Jornal' : 'Partida') + " A", p1: 150.00, p2: 155.00, p3: 148.00, p4: 160.00, p5: 152.00 },
                        { nombre: "Muestra de Concepto " + (tipo === 'JOR' ? 'Jornal' : 'Partida') + " B", p1: 85.00, p2: 90.00, p3: 82.00, p4: 95.00, p5: 88.00 }
                    ];
                });
            });
        }

        let listadoProyectos = [
            { cotizacion: 1, cliente: "Abimael Guirado", proyecto: "Vivienda AG", vencimiento: 20, encargado: "Ing. Joel Javier", niveles: 1, costo: 0.00 }
        ];
        let proximoNumeroCotizacion = 2;

        function formatearTresDigitos(numero) {
            return String(numero).padStart(3, '0');
        }

        function abrirModalNuevoPresupuesto() {
            document.getElementById('input-proy-ncotizacion').value = formatearTresDigitos(proximoNumeroCotizacion);
            document.getElementById('input-proy-cliente').value = "";
            document.getElementById('input-proy-nombre').value = "";
            document.getElementById('input-proy-vencimiento').value = "20"; 
            document.getElementById('input-proy-profesional').value = "";
            document.getElementById('input-proy-niveles').value = "1";
            abrirModal('modalNuevoProy');
        }

        function guardarNuevoPresupuesto() {
            let nCot = document.getElementById('input-proy-ncotizacion').value || formatearTresDigitos(proximoNumeroCotizacion);
            let cliente = document.getElementById('input-proy-cliente').value.trim();
            let proyecto = document.getElementById('input-proy-nombre').value.trim();
            let vencimiento = document.getElementById('input-proy-vencimiento').value || 20;
            let encargado = document.getElementById('input-proy-profesional').value.trim() || "No asignado";
            let niveles = parseInt(document.getElementById('input-proy-niveles').value) || 1;

            if (!cliente || !proyecto) {
                alert("Por favor, completa el Nombre del Cliente y del Proyecto.");
                return;
            }

            const nuevoProy = { cotizacion: nCot, cliente, proyecto, vencimiento, encargado, niveles, costo: 0 };
            listadoProyectos.push(nuevoProy);
            
            if(!isNaN(parseInt(nCot))) { proximoNumeroCotizacion = parseInt(nCot) + 1; } 
            else { proximoNumeroCotizacion++; }

            cerrarModal('modalNuevoProy');
            renderizarTarjetasProyectos();
            
            mostrarHojaPresupuesto(nuevoProy);
        }

        function cambiarLogoDirectoDesdeHoja(files) {
            if (files.length > 0) {
                const file = files[0];
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        document.getElementById('hoja-logo-img').src = e.target.result;
                        logoConsolidadoBase64 = e.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            }
        }

        function mostrarHojaPresupuesto(proy) {
            document.querySelector('header').classList.add('hidden');
            document.querySelector('main').classList.add('hidden');
            
            const vista = document.getElementById('vista-presupuesto-detalle');
            vista.classList.remove('hidden');

            // Inyectar fuente seleccionada mediante variable global CSS
            document.documentElement.style.setProperty('--fuente-presupuesto', fuenteConsolidadaPresupuesto);

            if (logoConsolidadoBase64) {
                document.getElementById('hoja-logo-img').src = logoConsolidadoBase64;
            } else {
                document.getElementById('hoja-logo-img').src = "ICONO PresuXcel.png";
            }

            document.getElementById('hoja-cliente').innerText = proy.cliente;
            document.getElementById('hoja-proyecto').innerText = proy.proyecto;
            document.getElementById('hoja-cotizacion').innerText = isNaN(proy.cotizacion) ? proy.cotizacion : formatearTresDigitos(proy.cotizacion);
            document.getElementById('hoja-vencimiento').innerText = proy.vencimiento;
            
            const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            document.getElementById('hoja-fecha').innerText = new Date().toLocaleDateString('es-ES', opciones);

            generarFilasPresupuesto(proy.niveles);
        }

        // --- FUNCIONES NUEVAS PARA AÑADIR / ELIMINAR FILAS ---

        function agregarFilaPresupuesto(btn) {
            const trActual = btn.closest('tr');
            const nuevaFila = document.createElement('tr');
            nuevaFila.className = "hover:bg-zinc-50 transition border border-zinc-300 group";
            
            // Creamos una fila exactamente igual pero vacía (sin número inicial)
            nuevaFila.innerHTML = `
                <td class="border border-zinc-400 p-1 text-center text-zinc-400 font-normal relative">
                    <button onclick="agregarFilaPresupuesto(this)" contenteditable="false" class="btn-flotante absolute left-1 top-1/2 -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white w-4 h-4 rounded-full items-center justify-center transition shadow z-10 cursor-pointer text-[10px]" title="Añadir fila abajo"><i class="ph ph-plus font-bold"></i></button>
                    -
                </td>
                <td class="border border-zinc-400 p-1 outline-none text-presuOscuro font-medium" contenteditable="true"></td>
                <td class="border border-zinc-400 p-1 outline-none text-center font-bold text-presuOscuro" contenteditable="true"></td>
                <td class="border border-zinc-400 p-1 outline-none text-center uppercase font-bold text-zinc-500" contenteditable="true"></td>
                <td class="border border-zinc-400 p-1 outline-none text-right px-2 font-semibold text-presuOscuro" contenteditable="true">$ - </td>
                <td class="border border-zinc-400 p-1 outline-none text-right px-2 font-black text-presuOscuro" contenteditable="true">$ - </td>
                <td class="border border-zinc-400 p-1 outline-none italic text-zinc-400 font-medium relative" contenteditable="true">
                    <button onclick="eliminarFilaPresupuesto(this)" contenteditable="false" class="btn-flotante absolute right-1 top-1/2 -translate-y-1/2 bg-red-500 hover:bg-red-600 text-white w-4 h-4 rounded-full items-center justify-center transition shadow z-10 cursor-pointer text-[10px]" title="Eliminar esta fila"><i class="ph ph-minus font-bold"></i></button>
                </td>
            `;
            
            // Insertamos la nueva fila debajo de la fila donde se hizo click
            trActual.parentNode.insertBefore(nuevaFila, trActual.nextSibling);
        }

        function eliminarFilaPresupuesto(btn) {
            if (confirm("¿Estás de acuerdo con borrar esta información de forma definitiva?")) {
                btn.closest('tr').remove();
            }
        }

        function generarFilasPresupuesto(numNiveles) {
            const tbody = document.getElementById('cuerpo-tabla-presupuesto');
            tbody.innerHTML = "";
            const nombresNiveles = ["PRIMER", "SEGUNDO", "TERCER", "CUARTO", "QUINTO", "SEXTO"];

            const colorPrimer = colorFilaTitConsolidado;     
            const colorSegundo = colorFilaSubConsolidado;    

            const theadRow = document.querySelector('#vista-presupuesto-detalle table thead tr');
            if (theadRow) {
                theadRow.style.backgroundColor = colorPrimer;
            }

            for (let i = 1; i <= numNiveles; i++) {
                let nombreNivel = nombresNiveles[i-1] || i + "º";
                
                tbody.innerHTML += `
                    <tr class="font-black text-center text-white border border-zinc-400" style="background-color: ${colorSegundo};">
                        <td colspan="5" class="border border-zinc-400 p-1 uppercase tracking-wide">${nombreNivel} NIVEL</td>
                        <td class="border border-zinc-400 p-1 uppercase text-left">TOTAL $</td>
                        <td class="border border-zinc-400 p-1 bg-white text-zinc-400 font-normal">-</td>
                    </tr>
                    <tr class="text-white font-bold border border-zinc-400 group" style="background-color: ${colorPrimer};">
                        <td class="border border-zinc-400 p-1 text-center relative">
                            <button onclick="agregarFilaPresupuesto(this)" contenteditable="false" class="btn-flotante absolute left-1 top-1/2 -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white w-4 h-4 rounded-full items-center justify-center transition shadow z-10 cursor-pointer text-[10px]" title="Añadir fila abajo"><i class="ph ph-plus font-bold"></i></button>
                            1.00
                        </td>
                        <td colspan="6" class="border border-zinc-400 p-1 px-4 uppercase text-[10px] tracking-wide" contenteditable="true">PRELIMINARES</td>
                    </tr>
                `;

                for (let j = 1; j <= 5; j++) {
                    tbody.innerHTML += `
                        <tr class="hover:bg-zinc-50 transition border border-zinc-300 group">
                            <td class="border border-zinc-400 p-1 text-center text-zinc-400 font-normal relative">
                                <button onclick="agregarFilaPresupuesto(this)" contenteditable="false" class="btn-flotante absolute left-1 top-1/2 -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white w-4 h-4 rounded-full items-center justify-center transition shadow z-10 cursor-pointer text-[10px]" title="Añadir fila abajo"><i class="ph ph-plus font-bold"></i></button>
                                1.0${j}
                            </td>
                            <td class="border border-zinc-400 p-1 outline-none text-presuOscuro font-medium" contenteditable="true"></td>
                            <td class="border border-zinc-400 p-1 outline-none text-center font-bold text-presuOscuro" contenteditable="true"></td>
                            <td class="border border-zinc-400 p-1 outline-none text-center uppercase font-bold text-zinc-500" contenteditable="true"></td>
                            <td class="border border-zinc-400 p-1 outline-none text-right px-2 font-semibold text-presuOscuro" contenteditable="true">$ - </td>
                            <td class="border border-zinc-400 p-1 outline-none text-right px-2 font-black text-presuOscuro" contenteditable="true">$ - </td>
                            <td class="border border-zinc-400 p-1 outline-none italic text-zinc-400 font-medium relative" contenteditable="true">
                                <button onclick="eliminarFilaPresupuesto(this)" contenteditable="false" class="btn-flotante absolute right-1 top-1/2 -translate-y-1/2 bg-red-500 hover:bg-red-600 text-white w-4 h-4 rounded-full items-center justify-center transition shadow z-10 cursor-pointer text-[10px]" title="Eliminar esta fila"><i class="ph ph-minus font-bold"></i></button>
                            </td>
                        </tr>
                    `;
                }
                
                tbody.innerHTML += `
                    <tr class="font-black text-white border border-zinc-400" style="background-color: ${colorSegundo};">
                        <td colspan="5" class="border border-zinc-400 p-1 text-right pr-4 uppercase tracking-wide">SUB-TOTAL</td>
                        <td class="border border-zinc-400 p-1 text-right px-2 font-black">$ - </td>
                        <td class="border border-zinc-400 p-1 bg-white"></td>
                    </tr>
                    <tr class="h-2 bg-presuFondo">
                        <td colspan="7" class="border-none p-0 h-2"></td>
                    </tr>
                `;
            }
        }

        function renderizarTarjetasProyectos() {
            let contenedor = document.getElementById('contenedor-proyectos');
            let badgeContador = document.getElementById('contador-proyectos-badge');
            let simboloMoneda = document.getElementById('selector-moneda-global').value;
            
            if(!contenedor) return;

            let botonAgregarHtml = contenedor.firstElementChild.outerHTML;
            contenedor.innerHTML = botonAgregarHtml;

            badgeContador.innerText = `${listadoProyectos.length} ${listadoProyectos.length === 1 ? 'Proyecto' : 'Proyectos'}`;

            listadoProyectos.forEach(proy => {
                let divTarjeta = document.createElement('div');
                divTarjeta.className = "bg-white border border-zinc-300 rounded-xl p-5 shadow-sm min-h-[190px] flex flex-col justify-between hover:border-presuOxido transition cursor-pointer";
                
                let cotizacionFormateada = isNaN(proy.cotizacion) ? proy.cotizacion : formatearTresDigitos(proy.cotizacion);

                divTarjeta.innerHTML = `
                    <div>
                        <div class="flex items-center justify-between">
                            <span class="bg-amber-100 text-amber-800 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-amber-200 tracking-wider">COT #${cotizacionFormateada}</span>
                            <span class="text-[9px] bg-zinc-100 text-zinc-500 font-bold px-1.5 py-0.5 rounded border border-zinc-200"><i class="ph ph-hourglass text-presuOxido"></i> Vence: ${proy.vencimiento}d</span>
                        </div>
                        <h3 class="font-black text-presuOscuro text-base tracking-wide mt-3 leading-tight">${proy.proyecto}</h3>
                        <div class="space-y-0.5 mt-2">
                            <p class="text-[11px] text-zinc-500 uppercase font-bold tracking-wider"><i class="ph ph-user text-presuOxido"></i> Cliente: <span class="text-presuOscuro font-black">${proy.cliente}</span></p>
                            <p class="text-[11px] text-zinc-500 uppercase font-bold tracking-wider"><i class="ph ph-hard-hat text-presuOxido"></i> Encargado: <span class="text-presuOscuro font-black">${proy.encargado}</span></p>
                        </div>
                    </div>
                    <div class="border-t border-zinc-200 pt-3 mt-4 flex items-center justify-between">
                        <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Costo Total</span>
                        <span class="font-black text-presuOscuro text-sm">${simboloMoneda} ${proy.costo.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                `;
                contenedor.appendChild(divTarjeta);
            });
        }

        function prepararYAbrirAceroSecciones() {
            temp_listadoBarras = JSON.parse(JSON.stringify(listadoBarras));
            temp_valoresSolapesMemoria = JSON.parse(JSON.stringify(valoresSolapesMemoria));
            abrirSubModal('modalConfig', 'modalAceroSecciones');
            cambiarSeccionAcero('tab-acero-pres', 'pane-acero-pres');
            renderizarTablaPesos();
        }

        function confirmarCambiosAcero() {
            listadoBarras = JSON.parse(JSON.stringify(temp_listadoBarras));
            valoresSolapesMemoria = JSON.parse(JSON.stringify(temp_valoresSolapesMemoria));
            regresarAModalSinFiltro('modalAceroSecciones', 'modalConfig');
        }

        function prepararYAbrirFormatoLogo() {
            temp_colorFilaTit = colorFilaTitConsolidado;
            temp_colorFilaSub = colorFilaSubConsolidado;
            temp_logoBase64 = logoConsolidadoBase64;
            temp_fuentePresupuesto = fuenteConsolidadaPresupuesto;

            document.getElementById('input-selector-color-tit').value = temp_colorFilaTit;
            document.getElementById('input-hex-color-tit').value = temp_colorFilaTit;
            document.getElementById('input-selector-color-sub').value = temp_colorFilaSub;
            document.getElementById('input-hex-color-sub').value = temp_colorFilaSub;
            document.getElementById('selector-fuente-presupuesto').value = temp_fuentePresupuesto;

            actualizarGraficosLogoDePantalla(temp_logoBase64);
            abrirSubModal('modalConfig', 'modalFormatoLogo');
            configurarArrastreLogo();
        }

        function sincronizarTextoColor(seccion, valorHex) {
            if (seccion === 'tit') {
                temp_colorFilaTit = valorHex;
                document.getElementById('input-hex-color-tit').value = valorHex;
            } else {
                temp_colorFilaSub = valorHex;
                document.getElementById('input-hex-color-sub').value = valorHex;
            }
        }

        function sincronizarRuedaColor(seccion, valorTexto) {
            if (valorTexto.length === 7 && valorTexto.startsWith('#')) {
                if (seccion === 'tit') {
                    temp_colorFilaTit = valorTexto;
                    document.getElementById('input-selector-color-tit').value = valorTexto;
                } else {
                    temp_colorFilaSub = valorTexto;
                    document.getElementById('input-selector-color-sub').value = valorTexto;
                }
            }
        }

        function configurarArrastreLogo() {
            const zona = document.getElementById('zona-drop-logo');
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => {
                zona.addEventListener(evt, (e) => e.preventDefault(), false);
            });
            zona.addEventListener('dragover', () => zona.classList.add('border-presuOxido', 'bg-orange-50/10'), false);
            zona.addEventListener('dragleave', () => zona.classList.remove('border-presuOxido', 'bg-orange-50/10'), false);
            zona.addEventListener('drop', (e) => {
                zona.classList.remove('border-presuOxido', 'bg-orange-50/10');
                procesarArchivoLogo(e.dataTransfer.files);
            }, false);
        }

        function procesarArchivoLogo(archivos) {
            if (archivos.length > 0) {
                const file = archivos[0];
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        temp_logoBase64 = e.target.result;
                        actualizarGraficosLogoDePantalla(temp_logoBase64);
                    };
                    reader.readAsDataURL(file);
                }
            }
        }

        function actualizarGraficosLogoDePantalla(srcImageString) {
            const vacio = document.getElementById('estado-logo-vacio');
            const cargado = document.getElementById('estado-logo-cargado');
            const imgPreview = document.getElementById('preview-logo-pantalla');
            if (srcImageString) {
                vacio.classList.add('hidden');
                cargado.classList.remove('hidden');
                imgPreview.src = srcImageString;
            } else {
                vacio.classList.remove('hidden');
                cargado.classList.add('hidden');
                imgPreview.src = "";
            }
        }

        function confirmarCambiosFormatoLogo() {
            colorFilaTitConsolidado = temp_colorFilaTit;
            colorFilaSubConsolidado = temp_colorFilaSub;
            logoConsolidadoBase64 = temp_logoBase64; 
            fuenteConsolidadaPresupuesto = document.getElementById('selector-fuente-presupuesto').value;
            regresarAModalSinFiltro('modalFormatoLogo', 'modalConfig');
        }

        function verificarCambiosPendientesFormatoLogo() {
            const fuenteSeleccionada = document.getElementById('selector-fuente-presupuesto') ? document.getElementById('selector-fuente-presupuesto').value : temp_fuentePresupuesto;
            return (colorFilaTitConsolidado !== temp_colorFilaTit || colorFilaSubConsolidado !== temp_colorFilaSub || logoConsolidadoBase64 !== temp_logoBase64 || fuenteConsolidadaPresupuesto !== fuenteSeleccionada);
        }

        function prepararYAbrirPreciosGlobales() {
            temp_basePreciosMemoria = JSON.parse(JSON.stringify(basePreciosMemoria));
            tipoPreciosActivo = 'MAT';
            actualizarBotonesFiltroTipoPrecios();
            actualizarSelectCategoríasPrecios();
            actualizarSimboloMonedaPrecios();
            abrirSubModal('modalConfig', 'modalPreciosGlobales');
        }

        function cambiarTipoFiltroPrecios(tipo) {
            tipoPreciosActivo = tipo;
            actualizarBotonesFiltroTipoPrecios();
            const contenedorFiltro = document.getElementById('contenedor-filtro-capitulo');
            if (tipo === 'JOR') {
                contenedorFiltro.classList.add('hidden');
                contenedorFiltro.classList.remove('flex');
            } else {
                contenedorFiltro.classList.remove('hidden');
                contenedorFiltro.classList.add('flex');
            }
            renderizarTablaPrecios();
        }

        function actualizarBotonesFiltroTipoPrecios() {
            const btnMat = document.getElementById('btn-precios-tipo-MAT');
            const btnMo = document.getElementById('btn-precios-tipo-MO');
            const btnJor = document.getElementById('btn-precios-tipo-JOR');
            const claseActiva = "w-1/3 text-center py-2 text-xs font-black uppercase tracking-wider rounded-lg transition duration-200 bg-presuOxido text-white shadow-md";
            const claseInactiva = "w-1/3 text-center py-2 text-xs font-black uppercase tracking-wider rounded-lg transition duration-200 text-zinc-500 hover:text-presuOscuro";
            btnMat.className = tipoPreciosActivo === 'MAT' ? claseActiva : claseInactiva;
            btnMo.className = tipoPreciosActivo === 'MO' ? claseActiva : claseInactiva;
            btnJor.className = tipoPreciosActivo === 'JOR' ? claseActiva : claseInactiva;
        }

        function actualizarSelectCategoríasPrecios() {
            const select = document.getElementById('selector-categoria-precios');
            const catActual = select.value;
            select.innerHTML = "";
            categoriasPreciosListado.forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat; opt.innerText = cat; select.appendChild(opt);
            });
            if(categoriasPreciosListado.includes(catActual)) select.value = catActual;
        }

        function actualizarSimboloMonedaPrecios() { renderizarTablaPrecios(); }

        function agregarNuevaCategoriaPrecios() {
            const nuevaCat = prompt("Escribe el nombre de la nueva categoría o capítulo:");
            if (nuevaCat && nuevaCat.trim() !== "") {
                const nombreLimpio = nuevaCat.trim().toUpperCase();
                if (!categoriasPreciosListado.includes(nombreLimpio)) {
                    categoriasPreciosListado.push(nombreLimpio);
                    temp_basePreciosMemoria.MAT[nombreLimpio] = [];
                    temp_basePreciosMemoria.MO[nombreLimpio] = [];
                    temp_basePreciosMemoria.JOR[nombreLimpio] = []; 
                    actualizarSelectCategoríasPrecios();
                    document.getElementById('selector-categoria-precios').value = nombreLimpio;
                    renderizarTablaPrecios();
                } else { alert("Esa categoría ya existe."); }
            }
        }

        function renderizarTablaPrecios() {
            const tbody = document.getElementById('tabla-precios-dinamica');
            const selectorCat = document.getElementById('selector-categoria-precios');
            const categoriaActiva = selectorCat ? selectorCat.value : "";
            if(!tbody) return; tbody.innerHTML = "";
            const simboloMoneda = document.getElementById('selector-moneda-global').value;
            let listado = [];
            if (tipoPreciosActivo === 'JOR') {
                const catPorDefecto = categoriasPreciosListado[0];
                if(!temp_basePreciosMemoria['JOR'][catPorDefecto]) temp_basePreciosMemoria['JOR'][catPorDefecto] = [];
                listado = temp_basePreciosMemoria['JOR'][catPorDefecto];
            } else {
                if(!categoriaActiva) return;
                if(!temp_basePreciosMemoria[tipoPreciosActivo][categoriaActiva]) temp_basePreciosMemoria[tipoPreciosActivo][categoriaActiva] = [];
                listado = temp_basePreciosMemoria[tipoPreciosActivo][categoriaActiva];
            }
            if(listado.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-zinc-400 italic text-xs">Sin filas añadidas en esta sección. Dale a "Añadir Fila".</td></tr>`; return;
            }
            listado.forEach((item, index) => {
                const tr = document.createElement('tr');
                tr.className = "border-b border-zinc-200 hover:bg-zinc-50 transition duration-150";
                const catKeyDestino = tipoPreciosActivo === 'JOR' ? categoriasPreciosListado[0] : categoriaActiva;
                tr.innerHTML = `
                    <td class="p-2 border-r border-zinc-200"><input type="text" value="${item.nombre}" onfocus="this.select()" onchange=\"actualizarValorMatrizPrecios('${catKeyDestino}', ${index}, 'nombre', this.value)\" class="w-full bg-transparent p-1 border border-transparent hover:border-zinc-300 focus:border-presuOxido rounded font-bold text-xs text-presuOscuro focus:outline-none focus:bg-white"></td>
                    <td class="p-2 border-r border-zinc-200"><div class="flex items-center bg-zinc-50 border border-zinc-200 rounded px-2 focus-within:bg-white focus-within:border-presuOxido shadow-sm"><span class="text-[11px] font-bold text-zinc-400 mr-1">${simboloMoneda}</span><input type="number" value="${item.p1}" step="0.01" onfocus="this.select()" onchange=\"actualizarValorMatrizPrecios('${catKeyDestino}', ${index}, 'p1', this.value)\" class="w-full bg-transparent p-1 text-right font-semibold text-xs text-presuOscuro focus:outline-none"></div></td>
                    <td class="p-2 border-r border-zinc-200"><div class="flex items-center bg-zinc-50 border border-zinc-200 rounded px-2 focus-within:bg-white focus-within:border-presuOxido shadow-sm"><span class="text-[11px] font-bold text-zinc-400 mr-1">${simboloMoneda}</span><input type="number" value="${item.p2}" step="0.01" onfocus="this.select()" onchange=\"actualizarValorMatrizPrecios('${catKeyDestino}', ${index}, 'p2', this.value)\" class="w-full bg-transparent p-1 text-right font-semibold text-xs text-presuOscuro focus:outline-none"></div></td>
                    <td class="p-2 border-r border-zinc-200"><div class="flex items-center bg-zinc-50 border border-zinc-200 rounded px-2 focus-within:bg-white focus-within:border-presuOxido shadow-sm"><span class="text-[11px] font-bold text-zinc-400 mr-1">${simboloMoneda}</span><input type="number" value="${item.p3}" step="0.01" onfocus="this.select()" onchange=\"actualizarValorMatrizPrecios('${catKeyDestino}', ${index}, 'p3', this.value)\" class="w-full bg-transparent p-1 text-right font-semibold text-xs text-presuOscuro focus:outline-none"></div></td>
                    <td class="p-2 border-r border-zinc-200"><div class="flex items-center bg-zinc-50 border border-zinc-300 rounded px-2 focus-within:bg-white focus-within:border-presuOxido shadow-sm"><span class="text-[11px] font-bold text-zinc-400 mr-1">${simboloMoneda}</span><input type="number" value="${item.p4}" step="0.01" onfocus="this.select()" onchange=\"actualizarValorMatrizPrecios('${catKeyDestino}', ${index}, 'p4', this.value)\" class="w-full bg-transparent p-1 text-right font-semibold text-xs text-presuOscuro focus:outline-none"></div></td>
                    <td class="p-2 border-r border-zinc-200"><div class="flex items-center bg-zinc-50 border border-zinc-300 rounded px-2 focus-within:bg-white focus-within:border-presuOxido shadow-sm"><span class="text-[11px] font-bold text-zinc-400 mr-1">${simboloMoneda}</span><input type="number" value="${item.p5}" step="0.01" onfocus="this.select()" onchange=\"actualizarValorMatrizPrecios('${catKeyDestino}', ${index}, 'p5', this.value)\" class="w-full bg-transparent p-1 text-right font-semibold text-xs text-presuOscuro focus:outline-none"></div></td>
                    <td class="p-2 text-center"><button onclick=\"eliminarFilaPrecios('${catKeyDestino}', ${index})\" class="mx-auto bg-red-50 text-red-600 hover:bg-red-600 hover:text-white h-7 w-7 rounded-full transition font-bold text-xs">✕</button></td>
                `;
                tbody.appendChild(tr);
            });
        }

        function actualizarValorMatrizPrecios(catKey, index, columna, campoValor) {
            if (columna !== 'nombre') { temp_basePreciosMemoria[tipoPreciosActivo][catKey][index][columna] = parseFloat(campoValor) || 0; return; }
            temp_basePreciosMemoria[tipoPreciosActivo][catKey][index][columna] = campoValor;
        }

        function agregarNuevaFilaMaterial() {
            const categoriaActiva = tipoPreciosActivo === 'JOR' ? categoriasPreciosListado[0] : document.getElementById('selector-categoria-precios').value;
            if(!categoriaActiva && tipoPreciosActivo !== 'JOR') return;
            temp_basePreciosMemoria[tipoPreciosActivo][categoriaActiva].push({ nombre: "", p1: 0, p2: 0, p3: 0, p4: 0, p5: 0 });
            renderizarTablaPrecios();
        }

        function eliminarFilaPrecios(catKey, index) { temp_basePreciosMemoria[tipoPreciosActivo][catKey].splice(index, 1); renderizarTablaPrecios(); }
        function confirmarCambiosPreciosGlobales() { basePreciosMemoria = JSON.parse(JSON.stringify(temp_basePreciosMemoria)); regresarAModalSinFiltro('modalPreciosGlobales', 'modalConfig'); }
        function verificarCambiosPendientesPreciosGlobales() { return JSON.stringify(basePreciosMemoria) !== JSON.stringify(temp_basePreciosMemoria); }
        function verificarCambiosPendientesAcero() { return (JSON.stringify(listadoBarras) !== JSON.stringify(temp_listadoBarras) || JSON.stringify(valoresSolapesMemoria) !== JSON.stringify(temp_valoresSolapesMemoria)); }

        function regresarAModal(modalSubId, modalPadreId) {
            if (modalSubId === 'modalAceroSecciones' && verificarCambiosPendientesAcero() && !confirm("¿Deseas perder los datos no guardados?")) return;
            if (modalSubId === 'modalFormatoLogo' && verificarCambiosPendientesFormatoLogo() && !confirm("¿Deseas perder los datos no guardados?")) return;
            if (modalSubId === 'modalPreciosGlobales' && verificarCambiosPendientesPreciosGlobales() && !confirm("¿Deseas perder los datos no guardados?")) return;
            regresarAModalSinFiltro(modalSubId, modalPadreId);
        }

        function regresarAModalSinFiltro(modalSubId, modalPadreId) { document.getElementById(modalSubId).classList.add('opacity-0', 'pointer-events-none'); abrirModal(modalPadreId); }
        function abrirModal(idModal) { const modal = document.getElementById(idModal); modal.classList.remove('opacity-0', 'pointer-events-none'); modal.querySelector('div').classList.remove('scale-95'); }
        function cerrarModal(idModal) { const modal = document.getElementById(idModal); modal.classList.add('opacity-0', 'pointer-events-none'); modal.querySelector('div').classList.add('scale-95'); }
        function abrirSubModal(modalActualId, modalNuevoId) { document.getElementById(modalActualId).classList.add('opacity-0', 'pointer-events-none'); abrirModal(modalNuevoId); }

        function cambiarSeccionAcero(btnId, paneId) {
            document.querySelectorAll('.subtab-btn').forEach(btn => {
                btn.classList.remove('bg-orange-50/70', 'border-l-4', 'border-presuOxido', 'text-presuOxido', 'shadow-sm');
                btn.classList.add('hover:bg-zinc-100', 'text-zinc-500');
            });
            document.querySelectorAll('.subtab-pane').forEach(pane => { pane.classList.add('hidden'); });
            const btnActivo = document.getElementById(btnId);
            btnActivo.classList.remove('hover:bg-zinc-100', 'text-zinc-500');
            btnActivo.classList.add('bg-orange-50/70', 'border-l-4', 'border-presuOxido', 'text-presuOxido', 'shadow-sm');
            document.getElementById(paneId).classList.remove('hidden');
        }

        function cambiarFormatoGlobal(tipo) {
            formatoActualGlobal = tipo;
            document.querySelectorAll('.card-pres-acero').forEach(c => {
                c.classList.remove('border-presuOxido', 'bg-orange-50/30', 'border-2');
                c.classList.add('border-zinc-300', 'bg-white', 'border');
            });
            let btnActivo = document.getElementById('btn-fmt-n');
            if(tipo === 'mm') btnActivo = document.getElementById('btn-fmt-mm');
            if(tipo === 'pulg') btnActivo = document.getElementById('btn-fmt-pulg');
            
            btnActivo.classList.remove('border-zinc-300', 'bg-white', 'border');
            btnActivo.classList.add('border-presuOxido', 'bg-orange-50/30', 'border-2');

            const header = document.getElementById('header-dinamico');
            const label = document.getElementById('label-formato-activo');
            if (tipo === 'n_num') { header.innerText = 'Varilla n#'; label.innerText = 'Varilla n#'; } 
            else if (tipo === 'mm') { header.innerText = 'Diámetro (mm)'; label.innerText = 'Milímetros'; } 
            else if (tipo === 'pulg') { header.innerText = 'Fracción (pulg.)'; label.innerText = 'Pulgadas'; }
            renderizerTablaEjemplos(); renderizarTablaPesos();
        }

        function renderizerTablaEjemplos() {
            const tbody = document.getElementById('tabla-ejemplo-body'); if(!tbody) return; tbody.innerHTML = "";
            temp_listadoBarras.forEach(barre => {
                let txt = formatoActualGlobal === 'mm' ? barre.mm : (formatoActualGlobal === 'pulg' ? barre.pulg : barre.n);
                if(barre.customName) txt = barre.customName;
                tbody.innerHTML += `<tr class="border-b border-zinc-100 hover:bg-zinc-50 transition"><td class="p-2 text-presuOxido font-mono text-center">${txt}</td></tr>`;
            });
        }

        function cambiarUnidadPesoGlobal(unidad) {
            unidadPesoActual = unidad;
            document.getElementById('th-unidad-peso').innerText = unidad === 'kg_m' ? "Peso Teórico (kg/m)" : "Peso Teórico (lb/ft)";
            document.getElementById('label-modal-peso').innerText = unidad === 'kg_m' ? "Colocar el Peso (kg/m)" : "Colocar el Peso (lb/ft)";
            renderizarTablaPesos();
        }

        function renderizarTablaPesos() {
            const tbody = document.getElementById('tabla-pesos-dinamica'); if(!tbody) return; tbody.innerHTML = "";
            temp_listadoBarras.forEach((barre, index) => {
                let txt = formatoActualGlobal === 'mm' ? barre.mm : (formatoActualGlobal === 'pulg' ? barre.pulg : barre.n);
                if(barre.customName) txt = barre.customName;
                let vPeso = unidadPesoActual === 'kg_m' ? barre.peso_kg : barre.peso_lb;
                tbody.innerHTML += `
                    <tr class="border-b border-zinc-200 fila-acero-hover hover:bg-zinc-50 transition duration-150">
                        <td class="p-3 border-r border-zinc-200">${txt}</td>
                        <td class="p-3 flex items-center justify-between">
                            <input type="number" value="${vPeso}" step="0.01" onfocus="this.select()" onchange="actualizarPesoDirecto(${index}, this.value)" class="w-24 bg-zinc-50 border border-zinc-300 rounded p-1 text-center font-bold text-presuOxido focus:outline-none">
                            <button onclick="eliminarFilaAcero(${index})" class="btn-eliminar-barra bg-red-50 text-red-600 hover:bg-red-600 hover:text-white h-7 w-7 rounded-full transition font-bold text-xs">✕</button>
                        </td>
                    </tr>`;
            });
            renderizerTablaEjemplos(); renderizarTablaSolapes();
        }

        function actualizarPesoDirecto(index, v) { if(unidadPesoActual === 'kg_m') { temp_listadoBarras[index].peso_kg = parseFloat(v) || 0; } else { temp_listadoBarras[index].peso_lb = parseFloat(v) || 0; } }
        function eliminarFilaAcero(index) { temp_listadoBarras.splice(index, 1); renderizarTablaPesos(); }

        function agregarNuevaFilaAcero() {
            const name = document.getElementById('input-nombre-barra').value.trim();
            const peso = parseFloat(document.getElementById('input-peso-barra').value.trim());
            if (!name || isNaN(peso)) return; let newId = Date.now();
            temp_listadoBarras.push({ id: newId, customName: name, peso_kg: unidadPesoActual === 'kg_m' ? peso : (peso / 0.6719), peso_lb: (unidadPesoActual === 'lb_ft' ? peso : (peso * 0.6719)) });
            ['CIMENTACIONES', 'COLUMNAS', 'VIGAS', 'LOSA', 'LOSA_ALIGERADA', 'FORMALETAS'].forEach(el => { temp_valoresSolapesMemoria[el][newId] = 0.50; });
            temp_valoresSolapesMemoria['MAMPOSTERIA'][newId] = 0.30;
            document.getElementById('input-nombre-barra').value = ""; document.getElementById('input-peso-barra').value = "";
            cerrarModal('modalNuevaBarra'); renderizarTablaPesos();
        }

        function restaurarPesosPorDefecto() { if (confirm("¿Borrar modificaciones?")) { temp_listadoBarras = JSON.parse(JSON.stringify(BARRAS_POR_DEFECTO)); renderizarTablaPesos(); } }
        
        function restaurarSolapesPorDefecto() {
            if (confirm("¿Restaurar solapes de fábrica?")) {
                temp_listadoBarras.forEach(b => {
                    let id = b.id; let vBase = VALORES_SOLAPE_METROS_DEFECTO[id] || 0.50;
                    ['CIMENTACIONES', 'COLUMNAS', 'VIGAS', 'LOSA', 'LOSA_ALIGERADA', 'FORMALETAS'].forEach(el => { temp_valoresSolapesMemoria[el][id] = vBase; });
                    temp_valoresSolapesMemoria['MAMPOSTERIA'][id] = 0.30;
                });
                renderizarTablaSolapes();
            }
        }

        function obtenerUnidadLongitudEstructura() { const s = document.getElementById('selector-estructura-medida').value; return s === 'metrico_mixto' ? 'cm' : (s === 'metrico_absoluto' ? 'm' : (s === 'imperial_mixto' ? 'in' : 'ft')); }
        function actualizarUnidadSolapeLabel() { document.getElementById('span-unidad-solape').innerText = `(${obtenerUnidadLongitudEstructura()})`; renderizarTablaSolapes(); }

        function seleccionarElementoSolape(key) {
            elementoSolapeActivo = key;
            document.querySelectorAll('.btn-solape-el').forEach(b => { b.className = "btn-solape-el px-3 py-2 text-[10px] font-black rounded-lg uppercase border bg-zinc-100 border-zinc-300 text-zinc-600 whitespace-nowrap"; });
            if(document.getElementById(`btn-sol-${key}`)) document.getElementById(`btn-sol-${key}`).className = "btn-solape-el px-3 py-2 text-[10px] font-black rounded-lg uppercase border bg-presuOxido text-white border-presuOxido whitespace-nowrap";
            renderizarTablaSolapes();
        }

        function renderizarTablaSolapes() {
            const tbody = document.getElementById('tabla-solapes-dinamica'); if(!tbody) return; tbody.innerHTML = "";
            const uStr = obtenerUnidadLongitudEstructura(); const sistema = document.getElementById('selector-estructura-medida').value;
            temp_listadoBarras.forEach(b => {
                let txt = formatoActualGlobal === 'mm' ? b.mm : (formatoActualGlobal === 'pulg' ? b.pulg : b.n);
                if(b.customName) txt = b.customName;
                let vBase = temp_valoresSolapesMemoria[elementoSolapeActivo][b.id];
                if (vBase === undefined) { vBase = elementoSolapeActivo === 'MAMPOSTERIA' ? 0.30 : (VALORES_SOLAPE_METROS_DEFECTO[b.id] || 0.50); temp_valoresSolapesMemoria[elementoSolapeActivo][b.id] = vBase; }
                let vConv = vBase;
                if(sistema === 'metrico_mixto') vConv = vBase * 100;
                else if(sistema === 'imperial_mixto') vConv = vBase * 39.3701;
                else if(sistema === 'imperial_absoluto') vConv = vBase * 3.28084;
                vConv = Math.round(vConv * 100) / 100;
                tbody.innerHTML += `
                    <tr class="border-b border-zinc-200 hover:bg-zinc-50 transition">
                        <td class="p-3 border-r border-zinc-200">${txt}</td>
                        <td class="p-3 flex items-center gap-3">
                            <input type="number" value="${vConv}" onfocus="this.select()" onchange="guardarValorSolapeConvertido('${b.id}', this.value)" class="w-32 bg-zinc-50 border border-zinc-300 rounded p-1.5 font-bold text-center text-sm focus:outline-none focus:border-presuOxido shadow-inner">
                            <span class="text-zinc-500 text-xs font-bold font-mono">${uStr}</span>
                        </td>
                    </tr>`;
            });
        }

        function guardarValorSolapeConvertido(barreId, v) {
            const num = parseFloat(v) || 0; const sistema = document.getElementById('selector-estructura-medida').value;
            let vMetros = num;
            if(sistema === 'metrico_mixto') vMetros = num / 100;
            else if(sistema === 'imperial_mixto') vMetros = num / 39.3701;
            else if(sistema === 'imperial_absoluto') vMetros = num / 3.28084;
            temp_valoresSolapesMemoria[elementoSolapeActivo][barreId] = vMetros;
        }

        window.onload = function() {
            inicializarMatrizSolapes(valoresSolapesMemoria);
            inicializarBasePreciosDefecto();
            cambiarFormatoGlobal('n_num');
            actualizarUnidadSolapeLabel();
            renderizarTarjetasProyectos();
        };
    