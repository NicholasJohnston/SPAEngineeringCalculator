const factors=[.9856,.985,.9844,.9838,.9831,.9825,.9819,.9813,.9806,.98,.9794,.9788,.9782,.9776,.9769,.9763,.9757,.9751,.9745,.9739,.9732,.9726,.972,.9714,.9708,.9702,.9695,.9689,.9683,.9677,.9671,.9665,.9659,.9653,.9646,.964,.9634,.9628,.9622,.9616,.961,.9604,.9597,.9591,.9585,.9579,.9573,.9567,.9561,.9555,.9549,.9543,.9537,.9531,.9524,.9518,.9512,.9506,.95,.9494,.9488,.9482,.9476,.947,.9464,.9458,.9452,.9446,.944,.9434,.9428,.9422,.9416,.941,.9404,.9398,.9392,.9386,.938,.9374,.9368,.9362,.9356,.935,.9344,.9338,.9332,.9326,.932,.9314,.9308,.9302,.9296,.929,.9284,.9278,.9272,.9266,.926,.9255,.9249,.9243,.9237,.9231,.9225,.9219,.9213,.9207,.9201,.9195,.9189,.9184,.9178,.9172,.9166,.916,.9154,.9148,.9142,.9136,.913,.9125,.9119,.9113,.9107,.9101,.9095,.909,.9084,.9078,.9072,.9066,.906,.9055,.9049,.9043,.9037,.9031,.9025,.902,.9014,.9008,.9002,.8996,.899,.8985,.8979,.8973,.8967,.8962,.8956,.895,.8944,.8939,.8933,.8927,.8921,.8915,.8909,.8904,.8898,.8892,.8886];
const tools={
  litresTonnes:{title:'Litres to Tonnes',group:'Bitumen',description:'Convert bitumen volume at temperature to equivalent mass.',fields:[['temperature','Bitumen temperature','°C'],['volume','Bitumen volume','litres']],outputs:[['tonnes','Tonnes'],['kg','kg']],calc:v=>{const f=tempFactor(v.temperature);const t=.00103*v.volume*f;return{tonnes:fmt(t,2),kg:fmt(t*1000,0)}}},
  tonnesLitres:{title:'Tonnes to Litres',group:'Bitumen',description:'Convert bitumen mass to cold and hot volume.',fields:[['temperature','Bitumen temperature','°C'],['tonnes','Bitumen mass','tonnes']],outputs:[['cold','Cold litres @ 15°C'],['hot','Hot litres']],calc:v=>{const cold=971*v.tonnes;return{cold:fmt(cold,0),hot:fmt(cold/tempFactor(v.temperature),0)}}},
  dcp:{title:'DCP to CBR',group:'Field test',description:'Convert DCP blows per 100 mm to CBR.',fields:[['blows','Blows per 100 mm','blows']],outputs:[['cbr','CBR']],calc:v=>({cbr:fmt(294.02*Math.pow(100/v.blows,-1.116),1)})},
  binder:{title:'Binder Spread Rate',group:'Binder',description:'Calculate binder spread rate from layer properties.',fields:[['thickness','Thickness','mm'],['percentage','Binder percentage','%'],['density','Material MDD','t/m³']],outputs:[['rate','kg/m²']],calc:v=>({rate:fmt(v.thickness*v.percentage*v.density/100,2)})},
  spreadArea:{title:'Area to Spread',group:'Binder',description:'Calculate the area covered by available binder.',fields:[['rate','Spread rate','kg/m²'],['tonnes','Tonnes available','tonnes']],outputs:[['area','m²']],calc:v=>({area:fmt(1000*v.tonnes/v.rate,0)})},
  actualSpread:{title:'Actual Spread Rate',group:'Binder',description:'Calculate average spread rate from tonnes used and area.',fields:[['tonnes','Tonnes used','tonnes'],['area','Area spread','m²']],outputs:[['rate','kg/m²']],calc:v=>({rate:fmt(1000*v.tonnes/v.area,2)})},
  granularTonnes:{title:'Granular Material Tonnes',group:'Granular',description:'Estimate material tonnage for a compacted layer.',fields:[['area','Area','m²'],['thickness','Compacted thickness','mm'],['density','Material density','t/m³']],outputs:[['tonnes','tonnes']],calc:v=>({tonnes:fmt(v.density*v.area*v.thickness/1000,0)})},
  granularArea:{title:'Material Placement Area',group:'Granular',description:'Estimate placement area from ordered material.',fields:[['material','Material ordered','tonnes'],['thickness','Compacted thickness','mm'],['density','Material density','t/m³']],outputs:[['area','m²']],calc:v=>({area:fmt(v.material/(v.thickness/1000)/v.density,0)})},
  asphaltTonnes:{title:'AC Tonnes',group:'Asphalt',description:'Estimate asphalt tonnage for a compacted area.',fields:[['area','Area','m²'],['thickness','Compacted thickness','mm'],['density','Asphalt density','t/m³']],outputs:[['tonnes','tonnes']],calc:v=>({tonnes:fmt(v.density*v.area*v.thickness/1000,0)})},
  asphaltArea:{title:'Area to Pave',group:'Asphalt',description:'Estimate paving area from available asphalt.',fields:[['ordered','Asphalt available','tonnes'],['thickness','Compacted thickness','mm'],['density','Asphalt density','t/m³']],outputs:[['area','m²']],calc:v=>({area:fmt(v.ordered/(v.thickness/1000)/v.density,0)})},
  density:{title:'Material Density',group:'Mass',description:'Calculate density from mass and volume.',fields:[['tonnes','Mass','tonnes'],['volume','Volume','m³']],outputs:[['density','tonnes/m³']],calc:v=>({density:fmt(v.tonnes/v.volume,2)})}
};
const categories=[
  ['bitumen','Bitumen Conversions','Litres, tonnes and temperature correction','B',['litresTonnes','tonnesLitres','volumeTable']],
  ['binderGroup','Binder Spread Rates','Design and verify binder application','S',['binder','spreadArea','actualSpread']],
  ['granular','Granular Material','Tonnage and placement area estimates','G',['granularTonnes','granularArea']],
  ['asphalt','Asphalt Calculations','AC quantities and paving coverage','A',['asphaltTonnes','asphaltArea']],
  ['dcp','DCP to CBR','Convert field penetration readings','D',['dcp']],
  ['geometry','Area / Volume / Mass','Reference formulas and density','ƒ',['formulas','density']]
];
const areaRows=[['Square','A = a²'],['Rectangle','A = ab'],['Parallelogram','A = bh'],['Trapezoid','A = h/2 (b₁ + b₂)'],['Circle','A = πr²'],['Triangle','A = ½bh'],['Intersection','A = (L × R) + 0.43R²']];
const volumeRows=[['Cube','V = a³'],['Rectangular prism','V = abc'],['Cylinder','V = πr²h']];
let deferredPrompt=null;
function fmt(n,d){if(!Number.isFinite(n))throw Error('Check that all values are greater than zero.');return Number(n).toLocaleString('en-AU',{minimumFractionDigits:d,maximumFractionDigits:d})}
function tempFactor(t){const n=Math.trunc(Number(t));if(n<38||n>200||!Number.isFinite(n))throw Error('Temperature must be between 38°C and 200°C.');return factors[n-38]}
function header(){return `<header class="topbar"><button class="brand" onclick="goHome()" aria-label="SPA Calculator home" style="border:0;background:none;padding:0;text-align:left"><img src="logo.jpg" alt="SPA"><span class="brand-copy"><strong>Engineering Calculator</strong><span>Road construction field tools</span></span></button><button class="install" id="installBtn">Install app</button></header>`}
function frame(body){return `<div class="shell">${header()}<main class="content">${body}<div class="footer">SPA Engineering Calculator</div></main></div>`}
function home(){return frame(`<section class="welcome"><div><div class="section-label">Field-ready calculations</div><h1>Engineering numbers, without the guesswork.</h1><p>Quick calculations for bitumen, binder, granular material, asphalt and site testing.</p></div><img class="welcome-logo" src="logo.jpg" alt="SPA Australia logo"></section><div class="section-label">Choose a calculation</div><section class="grid">${categories.map(c=>`<button class="tool-card" onclick="openCategory('${c[0]}')"><span class="tool-icon">${c[3]}</span><h2>${c[1]}</h2><p>${c[2]}</p></button>`).join('')}</section>`)}
function openCategory(id){const cat=categories.find(c=>c[0]===id);if(!cat)return;const cards=cat[4].map(k=>{if(k==='volumeTable')return card(k,'Bitumen Volume Table','Temperature correction factors','T');if(k==='formulas')return card(k,'Area & Volume Formulas','Common geometric references','ƒ');return card(k,tools[k].title,tools[k].description,cat[3])}).join('');render(frame(`<button class="back" onclick="goHome()">← All calculators</button><section class="welcome" style="grid-template-columns:1fr"><div><div class="section-label">${cat[1]}</div><h1 style="font-size:clamp(2rem,5vw,3.5rem)">${cat[2]}</h1></div></section><section class="grid">${cards}</section>`));history.pushState({view:'category',id},'',`#${id}`)}
function card(id,title,description,icon){return `<button class="tool-card" onclick="${id==='volumeTable'?"showVolumeTable()":id==='formulas'?"showFormulas()":`showTool('${id}')`}"><span class="tool-icon">${icon}</span><h2>${title}</h2><p>${description}</p></button>`}
function showTool(id){const t=tools[id];render(frame(`<button class="back" onclick="goHome()">← All calculators</button><section class="panel"><div class="panel-head"><div class="eyebrow">${t.group}</div><h1>${t.title}</h1><p>${t.description}</p></div><div class="panel-body"><form class="form-grid" id="calcForm">${t.fields.map(f=>`<div class="field"><label for="${f[0]}"><span>${f[1]}</span><span class="unit">${f[2]}</span></label><input id="${f[0]}" name="${f[0]}" inputmode="decimal" type="number" step="any" min="0" required></div>`).join('')}<button class="calculate" type="submit">Calculate</button><p class="error" id="error" role="alert"></p><div id="result"><p class="empty-result">Enter values to see the result.</p></div></form></div></section>`));document.getElementById('calcForm').addEventListener('submit',e=>calculate(e,t));history.pushState({view:'tool',id},'',`#${id}`);document.querySelector('input')?.focus()}
function calculate(e,t){e.preventDefault();const data=Object.fromEntries(new FormData(e.currentTarget));const error=document.getElementById('error');error.textContent='';try{for(const [k,label] of t.fields){const n=Number(data[k]);if(!Number.isFinite(n)||n<=0)throw Error(`Enter a valid ${label.toLowerCase()}.`);data[k]=n}const out=t.calc(data);document.getElementById('result').innerHTML=`<div class="${t.outputs.length>1?'multi-result':''}">${t.outputs.map(o=>`<div class="result"><div class="result-value"><strong>${out[o[0]]}</strong><span>${o[1]}</span></div></div>`).join('')}</div>`}catch(err){error.textContent=err.message}}
function showFormulas(){const rows=[...areaRows,...volumeRows];render(referencePage('Area & Volume Formulas','Common geometry formulas used in field calculations',['Shape','Formula'],rows));history.pushState({view:'formulas'},'','#formulas')}
function showVolumeTable(){const rows=factors.map((f,i)=>[`${i+38}°C`,f.toFixed(4)]);render(referencePage('Bitumen Volume Conversion','Multiply by factor A to reduce volume at T°C to volume at 15°C. Divide by A to increase volume at 15°C to volume at T°C.',['Temperature','Factor A'],rows));history.pushState({view:'volumeTable'},'','#volumeTable')}
function referencePage(title,description,heads,rows){return frame(`<button class="back" onclick="goHome()">← All calculators</button><section class="reference"><div class="reference-head"><h1>${title}</h1><p>${description}</p></div><div class="table-wrap"><table><thead><tr>${heads.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div></section>`)}
function render(html){document.getElementById('app').innerHTML=html;bindInstall();window.scrollTo(0,0)}function goHome(){render(home());history.pushState({view:'home'},'','#home')}
let installedThisSession=false;
let installInProgress=false;
const standaloneMode=window.matchMedia('(display-mode: standalone)');
function bindInstall(){
  const btn=document.getElementById('installBtn');
  if(!btn)return;
  const installed=installedThisSession||standaloneMode.matches||navigator.standalone===true;
  const available=!!deferredPrompt&&!installed&&!installInProgress;
  btn.classList.toggle('show',available);
  btn.disabled=!available;
  btn.onclick=async()=>{
    if(!deferredPrompt||installInProgress)return;
    const prompt=deferredPrompt;
    deferredPrompt=null;
    installInProgress=true;
    bindInstall();
    try{
      // Invoke directly within the click handler to retain user activation.
      await prompt.prompt();
      await prompt.userChoice;
    }catch(error){
      console.warn('The browser installation prompt was unavailable.',error);
    }finally{
      installInProgress=false;
      bindInstall();
    }
  };
}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;bindInstall()});
window.addEventListener('appinstalled',()=>{installedThisSession=true;deferredPrompt=null;bindInstall()});
standaloneMode.addEventListener?.('change',bindInstall);
window.addEventListener('online',()=>document.body.classList.remove('offline'));window.addEventListener('offline',()=>document.body.classList.add('offline'));if(!navigator.onLine)document.body.classList.add('offline');
window.addEventListener('popstate',()=>route());function route(){const id=location.hash.slice(1);if(tools[id])showToolNoHistory(id);else if(id==='volumeTable')showVolumeTableNoHistory();else if(id==='formulas')showFormulasNoHistory();else{const cat=categories.find(c=>c[0]===id);cat?openCategoryNoHistory(cat):render(home())}}
function showToolNoHistory(id){const old=history.pushState;history.pushState=()=>{};showTool(id);history.pushState=old}function openCategoryNoHistory(c){const old=history.pushState;history.pushState=()=>{};openCategory(c[0]);history.pushState=old}function showVolumeTableNoHistory(){const old=history.pushState;history.pushState=()=>{};showVolumeTable();history.pushState=old}function showFormulasNoHistory(){const old=history.pushState;history.pushState=()=>{};showFormulas();history.pushState=old}
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js'));
function registerWebMCP(){
  const context=document.modelContext;
  if(!context?.registerTool)return;
  const ids=Object.keys(tools);
  try{void Promise.resolve(context.registerTool({
    name:'calculate_engineering_value',
    title:'Run an SPA engineering calculation',
    description:'Run one of the SPA engineering calculators and show the calculation in the app.',
    inputSchema:{type:'object',properties:{calculator:{type:'string',enum:ids},values:{type:'object',additionalProperties:{type:'number'}}},required:['calculator','values'],additionalProperties:false},
    annotations:{readOnlyHint:false,untrustedContentHint:false},
    execute(input){
      if(!input||!ids.includes(input.calculator)||!input.values||typeof input.values!=='object')throw Error('Choose a valid calculator and provide numeric values.');
      const tool=tools[input.calculator];
      const values={};
      for(const [key,label] of tool.fields){const n=Number(input.values[key]);if(!Number.isFinite(n)||n<=0)throw Error(`Enter a valid ${label.toLowerCase()}.`);values[key]=n}
      const result=tool.calc(values);
      showToolNoHistory(input.calculator);
      for(const [key] of tool.fields)document.getElementById(key).value=values[key];
      document.getElementById('result').innerHTML=`<div class="${tool.outputs.length>1?'multi-result':''}">${tool.outputs.map(o=>`<div class="result"><div class="result-value"><strong>${result[o[0]]}</strong><span>${o[1]}</span></div></div>`).join('')}</div>`;
      return{calculator:input.calculator,result};
    }
  })).catch(()=>{});}catch(_error){}
}
route();
registerWebMCP();
