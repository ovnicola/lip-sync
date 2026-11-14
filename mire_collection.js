/* Synchro Ligne : collection de mires historiques.
   Charger après le script principal et, si présent, après mires-v3.js.
   Ne pas ajouter de balises <script> dans ce fichier. */
(()=>{
'use strict';
const select=document.getElementById('pattern');
if(!select||typeof background!=='function'){console.error('Collection : Synchro Ligne V2 requise.');return;}
const items=[
 ['card_angel','BBC Angel Wings Color (1957)','angel-wings.png'],
 ['card_hd','Color Bars HD / HDTV','color-bars-hd.png'],
 ['card_italian','Italian Regional Test Pattern','italian-regional.png'],
 ['card_eia','EIA Resolution Chart','eia-resolution.png'],
 ['card_philips','Philips PM5544 — image de référence','philips-pm5544.png']
];
const images=new Map(),messages=new Map();
let selected=select.value;
try{const s=JSON.parse(localStorage.getItem('synchro-ligne-v2')||'{}');if(items.some(x=>x[0]===s.pattern))selected=s.pattern;}catch(e){}
for(const [key,label] of items){if(![...select.options].some(o=>o.value===key))select.add(new Option(label,key));}
select.value=selected;
const panel=document.createElement('div');panel.className='field';
const label=document.createElement('label');label.textContent='Images de mires : cadrage';
const fit=document.createElement('select');fit.add(new Option('Image entière — proportions conservées','contain'));fit.add(new Option('Remplir — recadrage, sans déformation','cover'));fit.add(new Option('Étirer — déformation possible','stretch'));
try{fit.value=localStorage.getItem('synchro-card-fit')||'contain';}catch(e){}
fit.onchange=()=>{try{localStorage.setItem('synchro-card-fit',fit.value);}catch(e){}};
const button=document.createElement('button');button.type='button';button.textContent='Importer une image pour cette mire';
const input=document.createElement('input');input.type='file';input.accept='image/png,image/jpeg,image/webp';input.hidden=true;
const help=document.createElement('small');help.textContent='Choisir une mire de cette collection puis importer son fichier original. Import local : propre à cet iPhone. Pour tous les collègues, publier les images dans le dossier mires du dépôt.';
const notice=document.createElement('small');notice.style.marginTop='8px';
panel.append(label,fit,button,input,help,notice);select.parentElement.after(panel);
function report(){const item=items.find(x=>x[0]===select.value);button.disabled=!item;if(!item){notice.textContent='Import disponible pour les cinq mires de la collection.';return;}notice.textContent=messages.get(item[0])||'Chargement…';}
select.addEventListener('change',report);
const dbPromise=new Promise(resolve=>{
 if(!window.indexedDB){resolve(null);return;}
 const request=indexedDB.open('synchro-ligne-images',1);
 request.onupgradeneeded=()=>request.result.createObjectStore('images');
 request.onsuccess=()=>resolve(request.result);request.onerror=()=>resolve(null);
});
async function stored(key){const db=await dbPromise;if(!db)return null;return new Promise(resolve=>{try{const r=db.transaction('images').objectStore('images').get(key);r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>resolve(null);}catch(e){resolve(null);}});}
async function save(key,file){const db=await dbPromise;if(!db)return false;return new Promise(resolve=>{try{const t=db.transaction('images','readwrite');t.objectStore('images').put(file,key);t.oncomplete=()=>resolve(true);t.onerror=()=>resolve(false);t.onabort=()=>resolve(false);}catch(e){resolve(false);}});}
function decode(url){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('Image absente ou illisible'));image.src=url;});}
async function init(item){const [key,,filename]=item;try{const image=await decode('./mires/'+filename);images.set(key,image);messages.set(key,'Image du dépôt chargée — '+image.naturalWidth+' × '+image.naturalHeight);}
 catch(e){const blob=await stored(key);if(blob){const url=URL.createObjectURL(blob);try{const image=await decode(url);images.set(key,image);messages.set(key,'Image locale chargée sur cet appareil.');}catch(e){messages.set(key,'Image locale illisible. Réimporter.');}finally{URL.revokeObjectURL(url);}}
 else messages.set(key,'Image à ajouter : mires/'+filename+' — ou utiliser le bouton Importer.');}report();}
button.onclick=()=>{input.value='';input.click();};
input.onchange=async()=>{
 const item=items.find(x=>x[0]===select.value),file=input.files[0];if(!item||!file)return;
 const key=item[0],url=URL.createObjectURL(file);
 try{const image=await decode(url);images.set(key,image);messages.set(key,'Image importée ; enregistrement local…');report();const ok=await save(key,file);messages.set(key,ok?'Image enregistrée sur cet appareil uniquement.':'Image disponible pour cette session uniquement.');}
 catch(e){messages.set(key,'Échec : sélectionner un fichier PNG, JPEG ou WebP valide.');}
 finally{URL.revokeObjectURL(url);report();}
};
const previous=background;
background=function(c,w,h){
 const item=items.find(x=>x[0]===c.pattern);if(!item){previous(c,w,h);return;}
 ctx.fillStyle='#000';ctx.fillRect(0,0,w,h);
 const image=images.get(c.pattern);
 if(!image){ctx.save();ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=Math.max(14,Math.min(w,h)*.035)+'px system-ui';ctx.fillText(item[1],w/2,h*.4,w*.9);ctx.font=Math.max(12,Math.min(w,h)*.025)+'px system-ui';ctx.fillText('Image manquante : importer dans les réglages',w/2,h*.53,w*.9);ctx.restore();return;}
 let dw=w,dh=h;
 if(fit.value!=='stretch'){const scale=fit.value==='cover'?Math.max(w/image.naturalWidth,h/image.naturalHeight):Math.min(w/image.naturalWidth,h/image.naturalHeight);dw=image.naturalWidth*scale;dh=image.naturalHeight*scale;}
 ctx.save();ctx.imageSmoothingEnabled=true;ctx.drawImage(image,(w-dw)/2,(h-dh)/2,dw,dh);ctx.restore();
};
for(const item of items)init(item);report();
})();
