const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('src/Untitled4.html', 'utf-8');
const dom = new JSDOM(html);
const document = dom.window.document;

function writeIfFound(selector, dest) {
    const el = document.querySelector(selector);
    if (el) {
        fs.writeFileSync(dest, el.outerHTML, 'utf-8');
        console.log(`Saved ${selector} to ${dest}`);
    } else {
        console.log(`Not found: ${selector}`);
    }
}

writeIfFound('header', 'src/app/components/header/header.html');
writeIfFound('main', 'src/app/components/project-list/project-list.html');
writeIfFound('#vista-presupuesto-detalle', 'src/app/components/budget-view/budget-view.html');
writeIfFound('#modalConfig', 'src/app/components/modals/config-modal/config-modal.html');
writeIfFound('#modalMedidas', 'src/app/components/modals/measures-modal/measures-modal.html');
writeIfFound('#modalAceroSecciones', 'src/app/components/modals/steel-modal/steel-modal.html');
writeIfFound('#modalFormatoLogo', 'src/app/components/modals/logo-format-modal/logo-format-modal.html');
writeIfFound('#modalPreciosGlobales', 'src/app/components/modals/prices-modal/prices-modal.html');
writeIfFound('#modalNuevaBarra', 'src/app/components/modals/new-bar-modal/new-bar-modal.html');

const scriptTag = document.querySelector('script:not([src])');
if (scriptTag) {
    fs.writeFileSync('src/legacy-script.ts', scriptTag.innerHTML, 'utf-8');
    console.log('Saved script to src/legacy-script.ts');
}
