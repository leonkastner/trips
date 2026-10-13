'use strict';
const NS='http://www.w3.org/2000/svg';
const project=(lon,lat)=>[(lon-97)*100,(21-lat)*104];
const svgEl=(tag,attrs={},text)=>{const el=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));if(text!==undefined)el.textContent=text;return el};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function loadJSON(path){const r=await fetch(path);if(!r.ok)throw new Error(`${path}: ${r.status}`);return r.json()}
let travelData;
function renderCountries(geo){
 for(const f of geo.features){const polys=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;let d='';for(const poly of polys)for(const ring of poly){d+=ring.map((c,i)=>{const [x,y]=project(c[0],c[1]);return `${i?'L':'M'}${x.toFixed(2)},${y.toFixed(2)}`}).join(' ')+'Z';}document.querySelector('#countries').append(svgEl('path',{d,class:`country ${f.properties.ADMIN==='Thailand'?'thailand':'neighbor'}`,'data-country':f.properties.ADMIN}));}
 const labels=[['THAILAND',100.2,17,38],['MYANMAR',97.5,18,23],['LAOS',103.7,18,23],['KAMBODSCHA',104.7,12.8,22],['VIETNAM',107.4,16,22],['GOLF VON THAILAND',101.3,9,15]];
 for(const [name,lon,lat,size]of labels){const [x,y]=project(lon,lat);document.querySelector('#country-labels').append(svgEl('text',{x,y,'font-size':size,class:`country-label ${name==='THAILAND'?'thailand-label':''}`},name));}
}
function renderRail(data){
 const points=[[100.54227,13.80369],[100.58302,14.35667],[100.728,14.455],[100.9,14.53],[101.02,14.64],[101.41059,14.70492],[101.58,14.81],[101.74,14.88],[102.07889,14.97245],[102.17,14.98],[102.61,15.00],[102.87,15.03],[103.10801,15.00322],[103.49398,14.89145],[103.78642,14.94516],[104.32733,15.11642],[104.68,15.10],[104.8587,15.2005]];
 const d=points.map(([lon,lat],i)=>`${i?'L':'M'}${project(lon,lat).join(',')}`).join(' ');document.querySelector('#rail-route').setAttribute('d',d);document.querySelector('#rail-shadow').setAttribute('d',d);
 for(const s of data.stations){const [x,y]=project(s.lon,s.lat);const g=svgEl('g',{class:'station','data-station':s.id,'data-target':s.chapter,role:'button',tabindex:'0','aria-label':`${s.name} entdecken`,transform:`translate(${x},${y})`});g.append(svgEl('circle',{r:3.7}),svgEl('text',{x:s.dx,y:s.dy,'text-anchor':s.anchor},s.name));document.querySelector('#station-markers').append(g);}
 for(const l of data.legs){const a=data.stations.find(s=>s.id===l.from),b=data.stations.find(s=>s.id===l.to);const pa=project(a.lon,a.lat),pb=project(b.lon,b.lat);const g=svgEl('g',{class:'leg-label',transform:`translate(${(pa[0]+pb[0])/2+l.dx},${(pa[1]+pb[1])/2+l.dy})`});g.append(svgEl('text',{},l.label));document.querySelector('#leg-labels').append(g);}
 document.querySelector('#rail-timings').innerHTML=data.legs.map(l=>`<div class="rail-timing"><span>${esc(data.stations.find(s=>s.id===l.from).name)} → ${esc(data.stations.find(s=>s.id===l.to).name)}</span><b>${esc(l.label)}</b></div>`).join('');
}
function renderPlaces(data){
 const shorter={'phimai':'Phimai','phanom-rung':'Phanom Rung','surin':'Ban Tha Sawang','mekong':'Pha Taem','glowing-temple':'Sirindhorn-Tempel','ubon':'Ubon'};
 for(const [i,p]of data.places.entries()){
  const [x,y]=project(p.lon,p.lat);const s=data.stations.find(s=>s.id===p.station),[sx,sy]=project(s.lon,s.lat);
  const path=svgEl('path',{d:`M${sx},${sy} L${x},${y}`,class:'excursion','data-place':p.id});document.querySelector('#excursion-layer').append(path);
  const g=svgEl('g',{class:'place-marker','data-place':p.id,'data-target':p.id,role:'button',tabindex:'0','aria-label':`${p.title} entdecken`,transform:`translate(${x},${y})`});const east=p.lon>104.6;
  g.append(svgEl('circle',{class:'marker-halo',r:18}),svgEl('circle',{class:'marker-core',r:9}),svgEl('text',{class:'marker-number',y:0},String(i+1).padStart(2,'0')),svgEl('text',{class:'marker-label',x:east?-14:14,y:p.id==='surin'?-16:25,'text-anchor':east?'end':'start'},shorter[p.id]||p.title));document.querySelector('#place-markers').append(g);
  for(const e of p.extraPoints||[]){const [ex,ey]=project(e.lon,e.lat);const eg=svgEl('g',{class:'extra-point','data-place':p.id});eg.append(svgEl('circle',{cx:ex,cy:ey,r:2.2}),svgEl('text',{x:ex+12,y:ey-20},e.name));document.querySelector('#place-markers').append(eg);}
  const next=data.places[i+1];const article=document.createElement('section');article.className='chapter destination';article.id=p.id;article.dataset.stage='places';article.dataset.place=p.id;
  article.innerHTML=`<div class="destination-header"><span class="destination-number">${String(i+1).padStart(2,'0')}</span><span class="destination-category">${esc(p.category)}</span></div><h2>${esc(p.title)}</h2><p class="destination-subtitle">${esc(p.subtitle)}</p><span class="badge">${esc(p.badge)}</span><div class="photo-strip" data-photos-for="${esc(p.id)}"><div class="photo-placeholder">Fotos laden …</div></div><p class="intro-text">${esc(p.intro)}</p><p>${esc(p.experience)}</p><details class="practical-details"><summary>Besuch planen</summary><div class="visit-notes"><div class="visit-note"><span>${esc(p.access)}</span><p>${esc(p.practical)}</p></div>${p.caveat?`<div class="visit-note caveat"><span>Wichtig</span><p>${esc(p.caveat)}</p></div>`:''}</div></details><div class="stay-slot" data-stay-for="${esc(p.id)}"></div><a class="source-link" href="${esc(p.source)}" target="_blank" rel="noopener noreferrer">${esc(p.sourceLabel)} ↗</a><a class="next-place" href="#${next?next.id:'return-journey'}"><span>Weiter · ${esc(next?next.title:'Rückreise nach Bangkok')}</span><span aria-hidden="true">↓</span></a>`;
  document.querySelector('#destination-chapters').append(article);
  const opt=document.createElement('option');opt.value=p.id;opt.textContent=`${String(i+1).padStart(2,'0')} · ${p.title}`;document.querySelector('#jump-select').append(opt);
 }
 document.querySelector('#place-index').innerHTML=data.places.map((p,i)=>`<a href="#${esc(p.id)}"><span class="index-number">${String(i+1).padStart(2,'0')}</span>${esc(p.title)}</a>`).join('');
}
function renderTripMarks(){
 const layer=document.querySelector('#trip-marks');
 const [bx,by]=project(100.54227,13.80369),[ux,uy]=project(104.8390129,15.2633094);
 const inbound=svgEl('g',{class:'arrival-mark'});
 inbound.append(svgEl('path',{id:'arrival-path',d:`M${bx-220},${by+110} Q${bx-150},${by-30} ${bx},${by}`,class:'trip-path','marker-end':'url(#trip-arrow)'}));
 const plane=svgEl('g',{id:'arrival-plane'});plane.append(svgEl('use',{href:'#plane-symbol',x:-18,y:-18,width:36,height:36}));inbound.append(plane);
 inbound.append(svgEl('circle',{cx:bx,cy:by,r:8}),svgEl('text',{x:bx+18,y:by+40,class:'arrival-label'},'4.12. Bangkok'));
 const ubon=svgEl('g',{class:'ubon-date-mark'});ubon.append(svgEl('circle',{cx:ux,cy:uy,r:8}),svgEl('text',{x:ux-15,y:uy-22,'text-anchor':'end'},'10./12.12. Ubon'));
 layer.append(inbound,ubon);
 const ret=document.querySelector('#return-layer');
 ret.append(svgEl('path',{d:document.querySelector('#rail-route').getAttribute('d'),class:'return-rail','marker-start':'url(#trip-arrow)'}));
 ret.append(svgEl('path',{d:`M${ux},${uy} Q${(bx+ux)/2},${by-190} ${bx},${by}`,class:'return-flight','marker-end':'url(#trip-arrow)'}));
 const midX=(bx+ux)/2,midY=(by+uy)/2-70;
 const icon=svgEl('g',{transform:`translate(${midX},${midY}) rotate(-125)`});icon.append(svgEl('use',{href:'#plane-symbol',x:-15,y:-15,width:30,height:30}));ret.append(icon);
 ret.append(svgEl('circle',{cx:bx,cy:by,r:7}),svgEl('text',{x:bx+15,y:by+35},'Bangkok · 12./13.12.'));
 ret.append(svgEl('circle',{cx:ux,cy:uy,r:7}),svgEl('text',{x:ux-15,y:uy-20,'text-anchor':'end'},'Ubon · 12.12.'));
 ret.append(svgEl('text',{x:midX-40,y:midY+22,class:'flight-option-label'},'Flug'),svgEl('text',{x:midX-30,y:midY+78,class:'rail-option-label'},'Bahn'));
}
async function renderReturnOptions(){
 try{const data=await loadJSON('return-options.json');
 document.querySelector('#return-options').innerHTML=`<div class="return-recommendation"><span class="return-type">${esc(data.recommendation.label)}</span><h3>${esc(data.recommendation.title)}</h3><p>${esc(data.recommendation.text)}</p></div><div class="return-comparison">${data.options.map(o=>`<article class="return-option"><span class="return-type">${esc(o.type)}</span><h3>${esc(o.title)}</h3><div class="return-services">${o.services.map(s=>`<div><strong>${esc(s.name)}</strong><span>${esc(s.schedule)}</span></div>`).join('')}</div><p>${esc(o.fit)}</p><details><summary>Details & buchen</summary><p>${esc(o.description)}</p>${o.booking?`<p>${esc(o.booking.instructions)}</p><a href="${esc(o.booking.url)}" target="_blank" rel="noopener noreferrer">${esc(o.booking.label)} ↗</a>`:''}</details></article>`).join('')}</div>`;
 document.querySelector('#return-research-details').innerHTML=`<p>${esc(data.verification)}</p><ul>${data.sources.map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)} ↗</a></li>`).join('')}</ul><p>Unterkunftstipps sind Ortsideen, keine geprüfte Datumsverfügbarkeit. Für alle Recherchen wird Dezember 2026 vorläufig angenommen.</p>`;
 }catch(error){document.querySelector('#return-options').innerHTML='<p>Die Rückreiseinformationen konnten nicht geladen werden.</p>';console.error(error);}
}
function installNavigation(data){
 const map=document.querySelector('#travel-map'),chapters=[...document.querySelectorAll('.chapter')],reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const full=[0,0,1100,1700],region=[260,445,640,430];let scheduled=false;
 const absoluteTop=e=>e.getBoundingClientRect().top+window.scrollY;
 const clamp=v=>Math.max(0,Math.min(1,v));
 function update(){
  scheduled=false;const mobile=innerWidth<=760;const panel=document.querySelector('.map-panel');const top=mobile?panel.getBoundingClientRect().bottom:64;const readingLine=top+Math.max(40,(innerHeight-top)*.22);
  let current=chapters[0];for(const chapter of chapters){if(chapter.getBoundingClientRect().top<=readingLine)current=chapter;else break;}
  const stage=current.dataset.stage;document.body.dataset.stage=stage;
  const regionStart=absoluteTop(document.querySelector('#our-region'));
  const t=reduced?(stage==='country'?0:1):clamp((scrollY-(regionStart-innerHeight*.7))/(innerHeight*.55));const smooth=t*t*(3-2*t);
  const regionalFrame=mobile?[260,540,640,260]:region;
  map.setAttribute('viewBox',full.map((v,i)=>(v+(regionalFrame[i]-v)*smooth).toFixed(2)).join(' '));
  document.querySelector('#country-labels').style.opacity=1-t;
  const rail=document.querySelector('#rail-route');const length=rail.getTotalLength();let draw=1;
  if(stage==='rail'&&!reduced){const railStart=absoluteTop(document.querySelector('#railway'));draw=clamp((scrollY+readingLine-railStart+innerHeight*.2)/(innerHeight*.5));}
  rail.style.strokeDasharray=String(length);rail.style.strokeDashoffset=String(length*(1-draw));
  const p=data.places.find(p=>p.id===current.dataset.place);
  document.querySelectorAll('[data-place]').forEach(el=>{const active=!!p&&el.dataset.place===p.id;el.classList.toggle('active',active);if(el.classList.contains('place-marker')){el.setAttribute('tabindex',stage==='places'?'0':'-1');if(active)el.setAttribute('aria-current','true');else el.removeAttribute('aria-current');}});
  document.querySelectorAll('.station').forEach(el=>el.setAttribute('tabindex',stage==='rail'||stage==='places'?'0':'-1'));
  const titles={country:['01 / THAILAND','','4.12. Ankunft in Bangkok','13.12. Heimflug · Nachmittag/Abend'],region:['02 / ISAN','','Bangkok → Ubon','10.12. Ubon · Hochzeitsshuttle'],rail:['03 / DIE BAHN','','Bangkok → Ubon','Zug 21 · Beispielzeiten'],places:['04 / DIE ORTE','','Am Weg','Nummer antippen'],return:['12. DEZEMBER','RÜCKREISE','Ubon → Bangkok','13.12. Heimflug · voraussichtlich BKK']};
  document.body.dataset.currentPlace=p?p.id:'';
  document.querySelector('.map-date-strip').innerHTML=stage==='return'?'<span>12.12. Ubon</span><span>12./13.12. Bangkok</span><span>13.12. Heimflug</span>':'<span>4.12. Bangkok</span><span>10.12. Ubon</span><span>13.12. Heimflug</span>';
  const text=current.id==='sample-itinerary'?['BEISPIELROUTE','4.–10. DEZEMBER','Ayutthaya → Ubon','Züge 109, 71 und 21 · Vorschlag']:p?(p.id==='ubon'?['10.–12. DEZEMBER','UBON & HOCHZEIT','10.12. Ubon → Shuttle','11.12. Hochzeit · 12.12. zurück nach Ubon']:['04 / DIE ORTE',p.category.toUpperCase(),p.title,p.access]):titles[stage];
  const arrival=document.querySelector('#arrival-plane');
  const flightPath=document.querySelector('#arrival-path');
  if(arrival&&flightPath){const progress=reduced?1:clamp(scrollY/Math.max(1,regionStart*.65));const pos=flightPath.getPointAtLength(flightPath.getTotalLength()*progress);arrival.setAttribute('transform',`translate(${pos.x},${pos.y}) rotate(65)`);}
  document.querySelector('#map-kicker').textContent=text[0];document.querySelector('.map-active-category').textContent=text[1];document.querySelector('.map-active strong').textContent=text[2];document.querySelector('#map-hint').textContent=text[3];
  const max=document.documentElement.scrollHeight-innerHeight;document.querySelector('#reading-progress').style.width=`${max?clamp(scrollY/max)*100:0}%`;
 }
 function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(update);}}
 function go(id){const target=document.getElementById(id);if(!target)return;const offset=innerWidth<=760?document.querySelector('.map-panel').getBoundingClientRect().bottom+12:84;window.scrollTo({top:Math.max(0,absoluteTop(target)-offset),behavior:reduced?'instant':'smooth'});history.replaceState(null,'',`#${id}`);if(reduced)update();}
 document.querySelector('#jump-select').addEventListener('change',e=>go(e.target.value));
 document.querySelectorAll('[data-target]').forEach(el=>{el.addEventListener('click',()=>go(el.dataset.target));el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go(el.dataset.target);}});});
 window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);update();
 if(location.hash){const id=decodeURIComponent(location.hash.slice(1));if(document.getElementById(id))setTimeout(()=>go(id),50);}
 window.refreshTravelMap=update;
}
const galleries=new Map();
function buildGallery(host,photos,label){
 if(!photos.length){host.hidden=true;return;}
 const key=host.dataset.photosFor||'return-train';galleries.set(key,{photos,index:0});
 host.classList.remove('two-photos');host.classList.add('gallery');
 host.innerHTML=`<div class="gallery-stage"><button class="gallery-prev" aria-label="Vorheriges Foto von ${esc(label)}">‹</button><button class="gallery-zoom" aria-label="Foto von ${esc(label)} groß ansehen"><img class="gallery-main-image" loading="lazy" decoding="async" alt=""></button><button class="gallery-next" aria-label="Nächstes Foto von ${esc(label)}">›</button></div><div class="gallery-meta"><span class="gallery-caption"></span><span class="gallery-count" aria-live="polite"></span></div><div class="gallery-thumbs">${photos.map((a,i)=>`<button aria-label="Foto ${i+1}: ${esc(a.description)}" data-photo-index="${i}"><img src="assets/${encodeURIComponent(a.photo_filename)}" alt="" loading="lazy" decoding="async"></button>`).join('')}</div>`;
 const show=i=>{const state=galleries.get(key);state.index=(i+photos.length)%photos.length;const a=photos[state.index],img=host.querySelector('.gallery-main-image');img.src=`assets/${encodeURIComponent(a.photo_filename)}`;img.alt=a.description;host.querySelector('.gallery-caption').textContent=a.description;host.querySelector('.gallery-count').textContent=`${state.index+1} / ${photos.length}`;host.querySelectorAll('[data-photo-index]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.photoIndex)===state.index)));};
 host.querySelector('.gallery-prev').onclick=()=>show(galleries.get(key).index-1);host.querySelector('.gallery-next').onclick=()=>show(galleries.get(key).index+1);
 host.querySelectorAll('[data-photo-index]').forEach(b=>b.onclick=()=>show(Number(b.dataset.photoIndex)));
 host.querySelector('.gallery-zoom').onclick=()=>openLightbox(key);
 host.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();show(galleries.get(key).index+(e.key==='ArrowRight'?1:-1));}});
 let touchX;host.querySelector('.gallery-stage').addEventListener('touchstart',e=>{touchX=e.changedTouches[0].clientX;},{passive:true});host.querySelector('.gallery-stage').addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-touchX;if(Math.abs(dx)>45)show(galleries.get(key).index+(dx<0?1:-1));},{passive:true});show(0);
}
let lightboxKey,lightboxIndex;
function showLightbox(){const photos=galleries.get(lightboxKey).photos;lightboxIndex=(lightboxIndex+photos.length)%photos.length;const a=photos[lightboxIndex],image=document.querySelector('#lightbox-image');image.src=`assets/${encodeURIComponent(a.photo_filename)}`;image.alt=a.description;document.querySelector('#lightbox-caption').innerHTML=`${esc(a.description)} · ${lightboxIndex+1}/${photos.length}<br><a href="${esc(a.source_url)}" target="_blank" rel="noopener noreferrer">${esc(a.author)} · Bildquelle ↗</a>`;}
function openLightbox(key){lightboxKey=key;lightboxIndex=galleries.get(key).index;showLightbox();document.querySelector('#photo-dialog').showModal();}
function installLightbox(){const dialog=document.querySelector('#photo-dialog');dialog.querySelector('.gallery-close').onclick=()=>dialog.close();dialog.querySelector('.lightbox-prev').onclick=()=>{lightboxIndex--;showLightbox();};dialog.querySelector('.lightbox-next').onclick=()=>{lightboxIndex++;showLightbox();};dialog.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();lightboxIndex+=e.key==='ArrowRight'?1:-1;showLightbox();}});dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});}
async function renderPhotos(data){
 const manifest=await loadJSON('assets/assets-manifest.json');const used=[];
 for(const p of data.places){const keys=new Set([p.id,...p.photoKeys]);const photos=manifest.filter(a=>keys.has(a.place_slug)&&a.status==='downloaded');const unique=[...new Map(photos.map(a=>[a.photo_filename,a])).values()];used.push(...unique);buildGallery(document.querySelector(`[data-photos-for="${p.id}"]`),unique,p.title);}
 const trains=manifest.filter(a=>a.place_slug==='return-train'&&a.status==='downloaded');if(trains.length){const host=document.querySelector('#train-gallery');host.dataset.photosFor='return-train';buildGallery(host,trains,'Zugkabinen');used.push(...trains);}else document.querySelector('#train-gallery').hidden=true;
 const credits=[...new Map(used.map(a=>[a.photo_filename,a])).values()];document.querySelector('#photo-credits').innerHTML='<h3>Bildnachweise</h3>'+credits.map(a=>`<div class="credit-entry"><a href="${esc(a.source_url)}" target="_blank" rel="noopener noreferrer">${esc(a.description)}</a><br>${esc(a.author)} · ${a.license_url&&a.license!=='Public domain'?`<a href="${esc(a.license_url)}" target="_blank" rel="noopener noreferrer">${esc(a.license)}</a>`:esc(a.license)}${a.license.includes('not established')?'<br>Private Vorschau; öffentliche Nutzungsrechte ungeklärt.':''}</div>`).join('');
 installLightbox();window.travelPhotosReady=true;
}
async function renderStays(){const data=await loadJSON('lodgings.json');for(const host of document.querySelectorAll('[data-stay-for]')){const stays=data.stays.filter(s=>s.place_ids.includes(host.dataset.stayFor));host.innerHTML=`<div class="stay-options"><h3 class="stay-options-heading">Übernachten · ${stays.length} Optionen</h3>${stays.map(stay=>`<div class="stay-note"><span class="stay-label">${esc(stay.location)}</span><a href="${esc(stay.url)}" target="_blank" rel="noopener noreferrer">${esc(stay.name)} ↗</a><p>${esc(stay.description)}</p></div>`).join('')}</div>`;}}
async function init(){
 try{const [data,geo]=await Promise.all([loadJSON('places.json'),loadJSON('region.json')]);travelData=data;renderCountries(geo);renderRail(data);renderTripMarks();renderPlaces(data);await Promise.all([renderPhotos(data),renderReturnOptions(),renderStays()]);document.body.dataset.stage='country';installNavigation(data);window.travelReady=true;}
 catch(error){document.querySelector('#map-error').hidden=false;console.error(error);}
}
init();
