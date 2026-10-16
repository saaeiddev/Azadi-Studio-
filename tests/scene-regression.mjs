// CPU scene regression only. WebGL, PMREM and canvas drawing are test doubles.
// Run: node --experimental-vm-modules tests/scene-regression.mjs
// Real desktop/mobile GPU and visual QA are required separately before deployment.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import * as THREE from '../assets/vendor/three.module.min.js';
const repo=fileURLToPath(new URL('../',import.meta.url));
const base='7045b46c13f1168aa023973b2697403e9e54fb9b';
const original=p=>execFileSync('git',['show',`${base}:${p}`],{cwd:repo,encoding:'utf8'});
const updated=p=>fs.readFileSync(path.join(repo,p),'utf8');
const index=updated('index.html');
assert.equal(index.replace('v=fidelity-20261016','v=3d-1'),original('index.html'),'HTML, styles, links and content must remain identical');
for(const p of ['assets/workstation.css','assets/realism.css','assets/realism.js','.github/workflows/pages.yml','CNAME'])assert.equal(updated(p),original(p),p);
function makeElement(id,width,height){
 const handlers=new Map(),classes=new Set(),attrs=new Map();
 return {id,handlers,classes,attrs,style:{setProperty(k,v){this[k]=v;}},clientWidth:width,clientHeight:height,hidden:false,textContent:'',innerHTML:'',
 classList:{add(...v){v.forEach(x=>classes.add(x));},remove(...v){v.forEach(x=>classes.delete(x));},contains(x){return classes.has(x);}},
 addEventListener(k,v){if(!handlers.has(k))handlers.set(k,[]);handlers.get(k).push(v);},removeEventListener(k,v){handlers.set(k,(handlers.get(k)||[]).filter(x=>x!==v));},
 dispatchEvent(e){this.dispatch(e.type,e);return true;},dispatch(k,e={}){for(const fn of handlers.get(k)||[])fn({type:k,preventDefault(){},stopPropagation(){},...e});},
 setAttribute(k,v){attrs.set(k,v);},getAttribute(k){return attrs.get(k);},prepend(){},setPointerCapture(){},releasePointerCapture(){},focus(){this.focused=true;},scrollIntoView(){this.scrolled=true;},
 getBoundingClientRect(){return {left:0,top:0,width:this.clientWidth,height:this.clientHeight};}};
}
async function load(before,width,height,reduced=false){
 const elements=new Map();let now=1000,observer,resizeObserver;
 const element=id=>{if(!elements.has(id))elements.set(id,makeElement(id,width,height));return elements.get(id);};
 const drawContext=new Proxy({createLinearGradient:()=>({addColorStop(){}})}, {get(o,k){return k in o?o[k]:(()=>{});}});
 const document=element('document');document.hidden=false;document.body=element('body');document.getElementById=element;
 document.createElement=tag=>{const e=makeElement(tag,width,height);e.getContext=()=>drawContext;return e;};
 class Renderer{
  constructor(){this.domElement=element('canvas');this.domElement.getRootNode=()=>document;this.capabilities={getMaxAnisotropy:()=>16};this.shadowMap={};this.renders=0;this.shadows=0;}
  setPixelRatio(v){this.pixelRatio=v;}setClearColor(){}setSize(w,h){this.width=w;this.height=h;}setAnimationLoop(cb){this.loop=cb;}
  render(scene,camera){scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);this.renders++;if(this.shadowMap.needsUpdate){this.shadows++;this.shadowMap.needsUpdate=false;}}
 }
 class PMREM{fromScene(){return {texture:new THREE.Texture()};}dispose(){}}
 const window=element('window');window.openService=key=>{window.service=key;};
 const ctx=vm.createContext({console,document,window,innerWidth:width,innerHeight:height,devicePixelRatio:3,matchMedia:()=>({matches:reduced}),performance:{now:()=>now},Event,
 ResizeObserver:class{constructor(cb){resizeObserver=cb;}observe(){}},IntersectionObserver:class{constructor(cb){observer=cb;}observe(){}}});
 const overrides={...THREE,WebGLRenderer:Renderer,PMREMGenerator:PMREM};
 const three=new vm.SyntheticModule(Object.keys(overrides),function(){for(const [k,v]of Object.entries(overrides))this.setExport(k,v);},{context:ctx});
 const modules=new Map();
 function module(p){if(!modules.has(p)){let src=before?original(p):updated(p);if(p==='assets/workstation.js')src+='\nexport {pickables,animatedIcons,figures,renderFrame,resize,controls,renderer,scene,glass,wood,leather};';modules.set(p,new vm.SourceTextModule(src,{context:ctx,identifier:p}));}return modules.get(p);}
 const entry=module('assets/workstation.js');
 await entry.link((specifier,parent)=>specifier==='three'?three:module(path.posix.normalize(path.posix.join(path.posix.dirname(parent.identifier),specifier))));
 await entry.evaluate();
 const n=entry.namespace;
 function advance(ms,step=1000/60){const end=now+ms;for(;now<end;now+=step)n.renderFrame(now);}
 return {n,ctx,elements,element,window,document,advance,get now(){return now;},set now(n){now=n;},intersect(value){observer([{isIntersecting:value}]);},resize(w,h){ctx.innerWidth=w;ctx.innerHeight=h;const host=element('webglStudio');host.clientWidth=w;host.clientHeight=h;resizeObserver();}};
}
const vec=v=>v.toArray().map(x=>typeof x==='number'?+x.toFixed(6):x);
function manifest(n){const rows=[];n.scene.traverse(o=>{if(o.isMesh&&o.geometry.type==='BufferGeometry'&&o.geometry.index===null&&!o.geometry.attributes.uv)return;rows.push({type:o.type,pos:vec(o.position),rotation:vec(o.rotation),scale:vec(o.scale),label:o.userData.label,service:o.userData.service,color:o.material?.color?.getHex(),mapSize:o.material?.map?.image?[o.material.map.image.width,o.material.map.image.height]:null});});return JSON.stringify(rows);}
function validateGeometry(n){let meshes=0,triangles=0;const materials=new Set(),textures=new Set();n.scene.traverse(o=>{if(!o.isMesh)return;meshes++;for(const attribute of Object.values(o.geometry.attributes))for(const v of attribute.array)assert(Number.isFinite(v),'Geometry has non-finite value');if(o.visible)triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;materials.add(o.material);});for(const m of materials)for(const v of Object.values(m))if(v?.isTexture)textures.add(v);return {meshes,triangles,materials:materials.size,textures:textures.size};}
function clickableManifest(n){return Array.from(n.pickables,o=>({label:o.userData.label,service:o.userData.service,position:vec(o.getWorldPosition(new THREE.Vector3()))}));}
function rayHits(n){n.scene.updateMatrixWorld(true);n.controls.object.updateMatrixWorld(true);const caster=new THREE.Raycaster(),out=[];for(let y=-.7;y<=.7;y+=.14)for(let x=-.9;x<=.9;x+=.12){caster.setFromCamera(new THREE.Vector2(x,y),n.controls.object);const hit=caster.intersectObjects(n.pickables,true)[0];let o=hit?.object;while(o&&!o.userData.service)o=o.parent;out.push(o?.userData.service||null);}return out;}
const results=[];
for(const config of [{w:1440,h:900,reduced:false},{w:390,h:844,reduced:false},{w:1440,h:900,reduced:true},{w:390,h:844,reduced:true}]){
 const a=await load(true,config.w,config.h,config.reduced),b=await load(false,config.w,config.h,config.reduced);
 assert.equal(manifest(a.n),manifest(b.n),'Scene objects, transforms and albedo colors must be identical');
 assert.deepEqual(clickableManifest(a.n),clickableManifest(b.n),'All pickable objects must remain in place');
 const oldHits=rayHits(a.n),newHits=rayHits(b.n);oldHits.forEach((target,i)=>{if(target!==null)assert.equal(newHits[i],target,'Existing raycast service target must remain clickable');});
 const geometry=validateGeometry(b.n);
 b.advance(1500);assert.equal(b.window.__azadi3dReady,true);assert.equal(b.element('studioLoading').hidden,true);
 const home=vec(b.n.controls.object.position),homeTarget=vec(b.n.controls.target);
 b.element('cameraFocus').dispatch('click');b.advance(1500);assert.equal(b.element('body').classList.contains('focus-mode'),true);
 a.element('cameraFocus').dispatch('click');a.advance(1500);assert.deepEqual(vec(b.n.controls.target),vec(a.n.controls.target));assert.deepEqual(vec(b.n.controls.object.position),vec(a.n.controls.object.position),'Focus endpoint must match original OrbitControls limits');
 b.element('cameraHome').dispatch('click');b.advance(1500);assert.deepEqual(vec(b.n.controls.object.position),home);assert.deepEqual(vec(b.n.controls.target),homeTarget);
 b.element('cameraLeft').dispatch('click');b.advance(1500);assert.notDeepEqual(vec(b.n.controls.object.position),home);
 b.element('cameraRight').dispatch('click');b.advance(1500);assert.deepEqual(vec(b.n.controls.object.position),home);
 b.element('lightToggle').dispatch('click');b.advance(100);assert.equal(b.element('lightToggle').textContent,'Cool studio light');
 b.element('lightToggle').dispatch('click');b.advance(100);assert.equal(b.element('lightToggle').textContent,'Red studio light');
 if(b.element('motionToggle').getAttribute('aria-pressed')==='true')b.element('motionToggle').dispatch('click');
 b.advance(1000);const beforeFrozen=b.n.renderer.renders;b.advance(1000);assert.equal(b.n.renderer.renders,beforeFrozen,'Frozen scene should stop redundant draws');
 b.element('lightToggle').dispatch('click');b.advance(100);assert(b.n.renderer.renders>beforeFrozen,'Lighting must still redraw while motion is off');
 b.element('motionToggle').dispatch('click');b.advance(1000);const animated=b.n.animatedIcons[0].g.rotation.y;
 b.intersect(false);const count=b.n.renderer.renders;b.advance(10000);assert.equal(b.n.renderer.renders,count,'Offscreen scene should not render');b.intersect(true);b.advance(17);assert(Math.abs(b.n.animatedIcons[0].g.rotation.y-animated)<.025,'Resume must not jump animation');
 b.resize(config.w<760?844:390,config.w<760?390:844);assert.equal(b.n.controls.enableRotate,config.w<760);assert.equal(b.n.controls.object.fov,config.w<760?43:63);
 b.resize(0,0);b.advance(100);assert(Number.isFinite(b.n.controls.object.aspect),'Collapsed host must not invalidate camera');
 results.push({...config,pickables:b.n.pickables.length,...geometry,pixelRatioAfterResize:b.n.renderer.pixelRatio,result:'PASS'});
}
console.log(JSON.stringify({checks:'HTML/CSS preservation; real Three.js scene construction and geometry; unchanged object transforms/colors and raycast destinations; focus/reset/orbit; lighting; pause/resume; offscreen skipping; responsive camera setup',results,limitation:'Renderer, PMREM and 2D canvas are test doubles. No WebGL shader compilation, visual appearance, actual GPU FPS, touch browser behavior or real mobile/desktop browser pass is claimed.'},null,2));
