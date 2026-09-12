import * as THREE from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';
import {RoundedBoxGeometry} from './vendor/RoundedBoxGeometry.js';
import {RoomEnvironment} from './vendor/RoomEnvironment.js';

// Everything in the viewport is geometry. Canvas textures supply only lettering,
// material grain and the monitor UI; no reference photograph is loaded or displayed.
const host=document.getElementById('webglStudio');
const loading=document.getElementById('studioLoading');
const isSmall=()=>innerWidth<760;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let renderer;
try {
 renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
} catch(error) {
 loading.innerHTML='The 3D studio needs WebGL. <a href="#services">Explore our services ↓</a>';
 host.classList.add('unavailable');
 throw error;
}
renderer.setPixelRatio(Math.min(devicePixelRatio,isSmall()?1.5:1.8));
renderer.setClearColor('#b6a7a1');
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
renderer.transmissionResolutionScale=.5;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.05;
host.prepend(renderer.domElement);
renderer.domElement.setAttribute('aria-label','Real-time 3D Azadi workstation. Drag to orbit, scroll to zoom, click objects and service models.');
renderer.domElement.setAttribute('role','img');
const scene=new THREE.Scene();
scene.fog=new THREE.Fog('#b5a6a0',17,36);
const camera=new THREE.PerspectiveCamera(43,1,.08,80);
const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;controls.dampingFactor=.075;controls.enablePan=false;
controls.minDistance=4;controls.maxDistance=17;controls.minPolarAngle=.52;controls.maxPolarAngle=1.50;
controls.minAzimuthAngle=-.85;controls.maxAzimuthAngle=.85;
controls.enableZoom=false; // Wheel scroll belongs to the page; explicit controls zoom the camera.
controls.rotateSpeed=.55;
const environment=new RoomEnvironment();
const pmrem=new THREE.PMREMGenerator(renderer);
scene.environment=pmrem.fromScene(environment,.04).texture;scene.environmentIntensity=.65;
environment.dispose();pmrem.dispose();
const hemi=new THREE.HemisphereLight('#e5efff','#4c2020',.85);scene.add(hemi);
const key=new THREE.DirectionalLight('#fff0e4',2.8);key.position.set(-3,7,5);key.castShadow=true;
key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-7,right:7,top:6,bottom:-5,near:.1,far:22});key.shadow.normalBias=.024;key.shadow.bias=-.00015;key.shadow.radius=3;scene.add(key);
const fill=new THREE.DirectionalLight('#d6e3ff',1.0);fill.position.set(6,4,0);scene.add(fill);
const rim=new THREE.PointLight('#ff1632',25,12,2);rim.position.set(-4,2,-2.7);scene.add(rim);
const screenLight=new THREE.PointLight('#f2f0ff',4,4,2);screenLight.position.set(0,2.5,.4);scene.add(screenLight);
const standard=(color,metalness=0,roughness=.45,extra={})=>new THREE.MeshStandardMaterial({color,metalness,roughness,...extra});
const black=standard('#131317',.35,.32),rubber=standard('#161518',.05,.83),silver=standard('#adb0b4',.88,.24),edge=standard('#55565d',.8,.24),red=standard('#bd071c',.55,.25),white=standard('#f3eee9',.12,.3),skin=standard('#cf9670',.02,.52);
const glow=new THREE.MeshStandardMaterial({color:'#ff102c',emissive:'#ff0428',emissiveIntensity:2.7,roughness:.22});
const glass=new THREE.MeshPhysicalMaterial({color:'#f4eef4',metalness:0,roughness:.06,transmission:.96,thickness:.12,ior:1.48,clearcoat:1});
const sphereGeo=new THREE.SphereGeometry(1,32,24);
const geometries=new Map();
function box(w,h,d,r=.025){const k=[w,h,d,r].join('/');if(!geometries.has(k))geometries.set(k,new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/2,h/2,d/2)));return geometries.get(k);}
function mesh(geo,mat,parent,x=0,y=0,z=0){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function cube(parent,size,mat,pos=[0,0,0],r=.025){return mesh(box(...size,r),mat,parent,...pos);}
function ball(parent,size,mat,pos=[0,0,0]){const m=mesh(sphereGeo,mat,parent,...pos);m.scale.set(...size);return m;}
function cyl(parent,r1,r2,h,mat,pos=[0,0,0],segments=48){return mesh(new THREE.CylinderGeometry(r1,r2,h,segments),mat,parent,...pos);}
function torus(parent,r,t,mat,pos=[0,0,0],arc=Math.PI*2){return mesh(new THREE.TorusGeometry(r,t,12,64,arc),mat,parent,...pos);}
function group(parent,pos=[0,0,0]){const g=new THREE.Group();g.position.set(...pos);parent.add(g);return g;}
function rod(parent,a,b,r,mat){const va=new THREE.Vector3(...a),vb=new THREE.Vector3(...b),delta=vb.clone().sub(va);const m=cyl(parent,r,r,delta.length(),mat,va.clone().add(vb).multiplyScalar(.5).toArray(),16);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return m;}
function canvasTexture(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t;}
function textPlane(parent,text,w,h,pos,color='#ede4df',size=64,bg=null){const texture=canvasTexture(1024,256,(ctx,W,H)=>{if(bg){ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);}ctx.fillStyle=color;ctx.font=`500 ${size}px Arial`;ctx.textAlign='center';ctx.textBaseline='middle';text.split('\n').forEach((line,i,arr)=>ctx.fillText(line,W/2,H/2+(i-(arr.length-1)/2)*size*1.3));});const m=mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:texture,transparent:!bg,depthWrite:false,toneMapped:false}),parent,...pos);m.castShadow=false;return m;}
function logo(parent,size,pos,mat=red){const s=new THREE.Shape();s.moveTo(-.5,-.4);s.lineTo(0,.5);s.lineTo(.5,-.4);s.lineTo(.24,-.4);s.lineTo(.11,-.15);s.lineTo(-.11,-.15);s.lineTo(-.24,-.4);s.closePath();const hole=new THREE.Path();hole.moveTo(-.055,-.02);hole.lineTo(0,.1);hole.lineTo(.055,-.02);hole.closePath();s.holes.push(hole);const m=mesh(new THREE.ExtrudeGeometry(s,{depth:.07,bevelEnabled:true,bevelSize:.012,bevelThickness:.012,bevelSegments:2,steps:1}),mat,parent,...pos);m.scale.setScalar(size);return m;}
const pickables=[];
function pick(g,label,service){g.userData={label,service};pickables.push(g);}
let seed=627;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
const woodTex=canvasTexture(1024,1024,(c,w,h)=>{c.fillStyle='#77706c';c.fillRect(0,0,w,h);for(let i=0;i<14000;i++){const shade=Math.floor(90+rand()*65);c.strokeStyle=`rgba(${shade},${shade-3},${shade-5},.18)`;c.beginPath();let y=rand()*h;c.moveTo(0,y);c.bezierCurveTo(300,y+rand()*5,700,y-rand()*6,w,y+rand()*8);c.stroke();}});woodTex.wrapS=woodTex.wrapT=THREE.RepeatWrapping;woodTex.repeat.set(3,2);
const leatherTex=canvasTexture(256,256,(c,w,h)=>{c.fillStyle='#27252a';c.fillRect(0,0,w,h);for(let i=0;i<21000;i++){const v=20+rand()*38;c.fillStyle=`rgb(${v},${v},${v})`;c.fillRect(rand()*w,rand()*h,1,1);}});leatherTex.wrapS=leatherTex.wrapT=THREE.RepeatWrapping;leatherTex.repeat.set(8,4);
const wood=standard('#82838a',.52,.37,{map:woodTex});
const leather=standard('#a9a4a7',.06,.8,{map:leatherTex,bumpMap:leatherTex,bumpScale:.008});

// Architectural room, window mullions, distant skyline and physical lighting strips.
const room=group(scene);
cube(room,[26,.15,26],standard('#b5a9a1',.2,.65),[0,-.22,-3]);
cube(room,[20,9,.15],standard('#8a7770',.08,.85),[0,4,-5.6]);
for(let i=0;i<8;i++)cube(room,[.028,8,.05],edge,[-9+i*1.25,4,-5.48]);
cube(room,[.1,8,13],standard('#d8d3d2',.05,.48),[7.4,4,-2.8]);
const sunset=canvasTexture(16,512,(c,w,h)=>{let g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#a1b6d0');g.addColorStop(.6,'#efc9b7');g.addColorStop(1,'#d99287');c.fillStyle=g;c.fillRect(0,0,w,h);});
const windowWall=mesh(new THREE.PlaneGeometry(15,9),new THREE.MeshBasicMaterial({map:sunset}),room,0,4.1,-5.45);windowWall.castShadow=false;
for(let i=0;i<22;i++){const x=-8+i*.72,y=.7+rand()*2.5;const building=cube(room,[.35+rand()*.4,y,.3],standard('#6b727d',.2,.7),[x,y/2-.1,-5.1]);for(let j=0;j<5;j++){if(rand()>.5)cube(building,[.04,.07,.01],standard('#ffd8a8',0,.8,{emissive:'#c77b4c',emissiveIntensity:.4}),[-.12+(j%3)*.1,j*.28-y/2+.25,.16]);}}
for(let i=-2;i<=2;i++)cube(room,[.085,9,.11],black,[i*3.1,4,-4.75]);
cube(room,[17,.1,.12],black,[0,1.25,-4.75]);
cube(room,[4.3,8,.3],standard('#8c7972',.1,.67),[-6,3.8,-3.9]);
textPlane(room,'AZADI',2.5,.65,[-5.23,4.7,-3.70],'#fff8f1',125);
textPlane(room,'S T U D I O',2.5,.45,[-5.23,4.05,-3.70],'#fff8f1',84);
textPlane(room,'C R E A T I V E   F R E E D O M',2.5,.3,[-5.23,3.6,-3.70],'#eadbd3',37);
cube(room,[.55,.022,.015],glow,[-6.03,2.92,-3.7]);
textPlane(room,'IDEAS\nDESIGN\nVISUALIZE',1.3,1.3,[-5.75,2.15,-3.7],'#f4ded4',45);
for(const x of [-7.65,-3.75])cube(room,[.022,7,.04],glow,[x,3.7,-3.65]);
cube(room,[18,.09,.12],glow,[0,6.1,-3.5]);

// Beveled desktop, grain, metal lip, inlaid red LED and stitched leather mat.
const desk=group(scene);
cube(desk,[10,.19,4.5],wood,[0,.94,.4],.09);
cube(desk,[10,.09,.10],edge,[0,.83,2.6],.035);
cube(desk,[9.7,.022,.012],glow,[0,.81,2.66],.006);
for(const x of [-4.35,4.35]){cube(desk,[.20,1.15,.3],silver,[x,.29,.8]);cube(desk,[.6,.1,2.9],black,[x,-.15,.5]);}
cube(desk,[5.9,.035,1.63],leather,[.4,1.055,1.45],.017);
textPlane(desk,'A Z A D I   S T U D I O',2.8,.17,[0,.91,2.665],'#252025',52);
for(let i=0;i<65;i++)cube(desk,[.05,.003,.006],edge,[-2.47+i*.088,1.075,2.22],.001);

// Workstation monitor: metal enclosure, rear shell, ports, vents, stand, camera.
const monitor=group(scene,[0,2.99,-.79]);
cube(monitor,[5.85,3.35,.19],silver,[0,0,-.07],.07);
cube(monitor,[5.81,3.31,.12],black,[0,0,.015],.06);
cube(monitor,[5.62,3.12,.018],standard('#ebe7e8',.1,.26),[0,.015,.083],.015);
const screenTex=canvasTexture(2048,1136,(c,w,h)=>{
const grad=c.createLinearGradient(0,0,w,h);grad.addColorStop(0,'#fcfafa');grad.addColorStop(.6,'#e9e5e9');grad.addColorStop(1,'#bfa6ac');c.fillStyle=grad;c.fillRect(0,0,w,h);
// Stylized low-contrast terrain is drawn for the UI wallpaper, never the room.
for(let layer=0;layer<4;layer++){c.fillStyle=['#e8e2e6','#dfd6dc','#d2c4cc','#c7b6c0'][layer];c.beginPath();c.moveTo(0,h);for(let x=0;x<=w;x+=70)c.lineTo(x,h-160-layer*45-Math.sin(x*.007+layer)*60-Math.cos(x*.019)*35);c.lineTo(w,h);c.fill();}
c.fillStyle='#b60021';c.font='bold 48px Arial';c.fillText('▲',52,75);c.fillStyle='#1c1820';c.font='bold 29px Arial';c.fillText('Azadi Studio',110,70);
c.font='22px Arial';['Home','Services','Work','About','Contact'].forEach((t,i)=>c.fillText(t,590+i*190,65));c.fillStyle='#b80924';c.beginPath();c.roundRect(1750,29,240,59,30);c.fill();c.fillStyle='#ffffff';c.font='bold 24px Arial';c.fillText('Let’s Create',1800,68);
c.fillStyle='#8e717a';c.font='19px Arial';c.fillText('C R E A T I V E   F R E E D O M',67,231);c.fillStyle='#1c171b';c.font='bold 77px Arial';c.fillText('Innovation',65,331);c.fillStyle='#ad0922';c.fillText('Without Limits.',65,419);c.fillStyle='#6e5b65';c.font='25px Arial';c.fillText('Design  ·  Animate  ·  Film  ·  Create',68,481);c.font='italic 47px Georgia';c.fillText('Ideas live here.',76,630);
c.fillStyle='#55404b';c.font='20px Arial';c.fillText('Good ideas create a brighter tomorrow.',70,995);c.fillStyle='#b70c2c';c.font='17px Arial';c.fillText('AZADI STUDIO  /  CREATIVE FREEDOM',70,1034);
});
const screen=mesh(new THREE.PlaneGeometry(5.60,3.105),new THREE.MeshBasicMaterial({map:screenTex,toneMapped:false}),monitor,0,.014,.094);screen.castShadow=false;
cube(monitor,[.32,.07,.024],black,[0,1.619,.09],.018);const webcam=ball(monitor,[.02,.02,.012],standard('#173647',.7,.1),[.085,1.619,.109]);
textPlane(monitor,'A Z A D I',.45,.065,[0,-1.622,.094],'#92929a',65);
for(let i=0;i<36;i++)cube(monitor,[.065,.017,.02],rubber,[-1.95+i*.11,-1.48,-.172],.006);
cube(monitor,[.82,1.18,.25],silver,[0,-1.53,-.24],.05);
cube(scene,[1.8,.078,.82],silver,[0,1.093,-.67],.039);
for(let i=0;i<4;i++)cube(monitor,[.12,.035,.015],rubber,[.75+i*.18,-1.33,-.174],.008);
pick(monitor,'Workstation · focus the monitor','focus');
for(const [x,label,anchor] of [[-1.05,'Home','top'],[-.53,'Services','services'],[0,'Work','work'],[.53,'About','about'],[1.05,'Contact','contact'],[2.37,'Let’s create','contact']]){
 const nav=group(monitor,[x,1.39,.112]);
 mesh(new THREE.PlaneGeometry(.43,.17),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}),nav);
 pick(nav,label,'nav:'+anchor);
}

function laptop(parent){const g=group(parent);const lid=cube(g,[.71,.45,.045],silver,[0,.15,0],.018);lid.rotation.x=-.12;cube(g,[.65,.38,.012],black,[0,.16,.03],.008);logo(g,.20,[0,.18,.042]);cube(g,[.79,.035,.45],silver,[0,-.09,.19],.015);for(let r=0;r<3;r++)for(let c=0;c<9;c++)cube(g,[.055,.008,.05],black,[-.28+c*.07,-.069,.08+r*.065],.004);cube(g,[.22,.004,.095],edge,[0,-.068,.325],.003);const phone=cube(g,[.16,.32,.022],black,[.37,.01,.29],.02);phone.rotation.z=-.12;return g;}
function filmIcon(parent){const g=group(parent);cube(g,[.6,.37,.1],black,[0,-.03,0],.025);const top=group(g,[-.30,.18,0]);const slate=cube(top,[.62,.095,.1],white,[.31,.018,0],.01);for(let i=0;i<5;i++){const stripe=cube(top,[.045,.092,.005],black,[.06+i*.12,.017,.054],.001);stripe.rotation.z=-.4;}top.rotation.z=.20;const shape=new THREE.Shape();shape.moveTo(-.065,-.085);shape.lineTo(.095,0);shape.lineTo(-.065,.085);shape.closePath();mesh(new THREE.ExtrudeGeometry(shape,{depth:.035,bevelEnabled:true,bevelSize:.009,bevelThickness:.009,bevelSegments:2}),glow,g,0,-.02,.055);return g;}
function cameraModel(parent){const g=group(parent);cube(g,[.62,.4,.25],black,[0,0,0],.06);cube(g,[.17,.39,.30],rubber,[-.25,-.02,.01],.05);cube(g,[.24,.10,.19],edge,[0,.23,-.015],.015);cube(g,[.1,.017,.1],black,[0,.29,-.01],.005);for(const [radius,depth,z,material] of [[.19,.17,.17,edge],[.178,.16,.28,rubber],[.16,.04,.38,silver],[.143,.035,.408,black]]){const lens=cyl(g,radius,radius,depth,material,[.04,0,z]);lens.rotation.x=Math.PI/2;}const lensGlass=ball(g,[.123,.123,.027],new THREE.MeshPhysicalMaterial({color:'#240b25',metalness:.5,roughness:.03,clearcoat:1}),[.04,0,.439]);torus(g,.11,.006,red,[.04,0,.445]);ball(g,[.04,.025,.008],standard('#8099aa',.3,.08),[.00,.045,.46]);cyl(g,.042,.042,.021,silver,[.22,.222,.00]);for(let i=0;i<24;i++){const a=i/24*Math.PI*2;const line=cube(g,[.009,.014,.12],edge,[.04+Math.cos(a)*.18,Math.sin(a)*.18,.29]);}return g;}
function penModel(parent){const g=group(parent);const body=cyl(g,.025,.035,.63,black,[0,0,0],24);cyl(g,.036,.036,.045,silver,[0,-.22,0],24);cyl(g,.028,.002,.11,silver,[0,-.36,0],24);cube(g,[.012,.18,.018],silver,[.028,.14,.0],.005);return g;}
function graphicIcon(parent){const g=group(parent);const disk=cyl(g,.19,.19,.028,red,[.12,.04,-.09]);disk.rotation.x=Math.PI/2;const sheet=cube(g,[.42,.41,.024],new THREE.MeshPhysicalMaterial({color:'#efbdc9',metalness:.15,roughness:.16,transparent:true,opacity:.85,side:THREE.DoubleSide}),[-.1,0,.015],.01);sheet.rotation.z=.48;const pen=penModel(g);pen.position.set(.17,0,.12);pen.rotation.z=-.52;return g;}
const animatedIcons=[];
function animationIcon(parent){const g=group(parent);const inner=cube(g,[.34,.34,.34],red,[0,0,0],.025);inner.rotation.set(.25,.55,.12);cube(g,[.49,.49,.49],new THREE.MeshPhysicalMaterial({color:'#f5f2f4',roughness:.08,metalness:.02,transmission:.8,thickness:.05,transparent:true,opacity:.85}),[0,0,0],.03);const ring=torus(g,.40,.008,silver);ring.rotation.x=1.08;ring.rotation.y=.2;ball(g,[.045,.045,.045],red,[.36,.12,.01]);animatedIcons.push({g:inner,type:'spin'});return g;}
const cardMat=new THREE.MeshPhysicalMaterial({color:'#f1e9ed',metalness:.06,roughness:.22,clearcoat:1,clearcoatRoughness:.12});
function serviceCard(x,y,key,label,builder){const g=group(monitor,[x,y,.115]);const panel=new THREE.Shape();const w=.61,r=.085;
panel.moveTo(-w+r,-w);panel.lineTo(w-r,-w);panel.quadraticCurveTo(w,-w,w,-w+r);panel.lineTo(w,w-r);panel.quadraticCurveTo(w,w,w-r,w);panel.lineTo(-w+r,w);panel.quadraticCurveTo(-w,w,-w,w-r);panel.lineTo(-w,-w+r);panel.quadraticCurveTo(-w,-w,-w+r,-w);
mesh(new THREE.ExtrudeGeometry(panel,{depth:.03,bevelEnabled:true,bevelSize:.004,bevelThickness:.004,bevelSegments:2,steps:1,curveSegments:8}),cardMat,g,0,0,-.015);const icon=builder(g);icon.position.set(0,.16,.18);icon.scale.setScalar(.88);icon.rotation.y=-.16;animatedIcons.push({g:icon,type:'bob',base:.16,phase:animatedIcons.length});textPlane(g,label,1.11,.23,[0,-.395,.032],'#251c25',82);const arrow=cyl(g,.075,.075,.018,white,[.46,-.49,.04],32);arrow.rotation.x=Math.PI/2;textPlane(g,'↗',.12,.1,[.46,-.49,.055],'#78152a',120);pick(g,label.replace('\n',' '),key);return g;}
serviceCard(.40,.63,'web','Website &\nApp Design',laptop);
serviceCard(1.77,.63,'animation','3D & Cinematic\nAnimation',animationIcon);
serviceCard(-.97,-.76,'editing','Film & Video\nEditing',filmIcon);
serviceCard(.40,-.76,'graphic','Graphic Design',graphicIcon);
serviceCard(1.77,-.76,'photo','Photography &\nVideography',cameraModel);

// Keyboard: individual beveled keycaps, legends, chassis, feet and cable.
const keyboard=group(scene,[.13,1.115,1.43]);
cube(keyboard,[2.80,.085,.88],silver,[0,0,0],.034);
cube(keyboard,[2.75,.04,.83],black,[0,.052,0],.017);
const keyGroup=group(keyboard);
const keyMat=standard('#35353b',.28,.46);
const keys=[];for(let r=0;r<5;r++){for(let col=0;col<15;col++){if(r===4&&col>3&&col<10)continue;const x=-1.25+col*.18,z=-.33+r*.164;const k=cube(keyGroup,[.158,.045,.139],keyMat,[x,.093,z],.014);keys.push(k);}}
cube(keyGroup,[1.12,.045,.14],keyMat,[-.1,.093,.326],.014);
const legends=canvasTexture(1536,512,(c,w,h)=>{c.fillStyle='#c4c0c2';c.font='22px Arial';const rows=['ESC 1 2 3 4 5 6 7 8 9 0 - + ⌫','TAB Q W E R T Y U I O P [ ] \\','CAP A S D F G H J K L ; ” ↵','⇧ Z X C V B N M , . / ⇧ ↑','CTRL ALT CMD                     ◀ ↓ ▶'];rows.forEach((row,r)=>{row.split(' ').forEach((v,j)=>c.fillText(v,27+j*98,48+r*99));});});
const legendMesh=mesh(new THREE.PlaneGeometry(2.7,.84),new THREE.MeshBasicMaterial({map:legends,transparent:true,depthWrite:false,toneMapped:false}),keyboard,0,.117,0);legendMesh.rotation.x=-Math.PI/2;legendMesh.castShadow=false;
const cableCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(.7,1.08,1.0),new THREE.Vector3(.85,1.07,.55),new THREE.Vector3(1.35,1.07,.20),new THREE.Vector3(1,1.07,-.8)]);
mesh(new THREE.TubeGeometry(cableCurve,32,.014,8,false),rubber,scene);
pick(keyboard,'Keyboard · illuminate the studio','lighting');
const mouse=group(scene,[2.20,1.11,1.53]);mouse.rotation.y=-.15;
ball(mouse,[.235,.112,.36],black,[0,.043,0]);cube(mouse,[.008,.003,.35],edge,[0,.152,-.035],.001);const wheel=cyl(mouse,.035,.035,.034,rubber,[0,.145,-.14],24);wheel.rotation.z=Math.PI/2;pick(mouse,'Mouse · focus the workstation','focus');

// Leather notebook, pages, embossed title and turned metal stylus.
const notebook=group(scene,[-2.32,1.091,1.60]);notebook.rotation.y=-.1;
cube(notebook,[1.40,.065,.95],black,[0,0,0],.025);cube(notebook,[1.34,.035,.90],white,[.013,.0,0],.009);cube(notebook,[1.4,.019,.95],leather,[0,.034,0],.008);const coverText=textPlane(notebook,'Create\nExplore\nRepeat',.62,.42,[0,.047,0],'#c0a899',65);coverText.rotation.x=-Math.PI/2;
const stylus=penModel(notebook);stylus.position.set(.5,.07,-.02);stylus.rotation.z=-Math.PI/2;stylus.rotation.y=.8;pick(notebook,'Design notebook · graphic design','graphic');
const book=group(scene,[3.76,1.12,1.73]);book.rotation.y=.20;cube(book,[1.53,.17,1.0],white);cube(book,[1.59,.024,1.04],leather,[0,.098,0]);cube(book,[1.59,.024,1.04],leather,[0,-.098,0]);const title=textPlane(book,'IDEAS SHAPE\nA BRIGHTER\nTOMORROW',1.17,.67,[0,.113,0],'#e2c5b6',55);title.rotation.x=-Math.PI/2;pick(book,'Ideas · creative direction','creative');

// Over-ear headphones: curved headband, stitched cushion, articulated metal yokes.
const headphones=group(scene,[-3.84,1.18,1.75]);headphones.rotation.set(.15,-.20,-.10);
const band=torus(headphones,.50,.055,black,[0,.38,0],Math.PI);const cushion=torus(headphones,.46,.038,rubber,[0,.38,.008],Math.PI);
for(const x of [-.49,.49]){const ear=group(headphones,[x,.26,.03]);ear.rotation.y=x>0?-.22:.22;const shell=cyl(ear,.25,.24,.14,black,[0,0,0]);shell.rotation.x=Math.PI/2;const ring=torus(ear,.22,.018,silver,[0,0,.08]);const pad=torus(ear,.18,.064,rubber,[0,0,-.09]);logo(ear,.19,[0,0,.085]);rod(headphones,[x,.46,0],[x*.94,.64,0],.022,silver);}
pick(headphones,'Headphones · film & video editing','editing');
// Hollow pen cup using a lathed profile and individually modeled pens.
const cup=group(scene,[-3.92,1.08,.25]);
const cupProfile=[[0,0],[.19,0],[.205,.02],[.205,.48],[.188,.49],[.178,.46],[.178,.05],[0,.05]].map(p=>new THREE.Vector2(...p));mesh(new THREE.LatheGeometry(cupProfile,48),silver,cup);
textPlane(cup,'BETTER\nIDEAS',.26,.20,[0,.24,.207],'#eee7e3',75);
for(let i=0;i<5;i++){const pen=penModel(cup);pen.position.set(-.13+i*.06,.48,.025*(i%2));pen.rotation.z=(i-2)*.11;}

// Detailed armored collectible: anatomical joints, layered armor and folded cape.
const figures=[];
function base(parent,r,label){cyl(parent,r,r,.095,black,[0,.04,0]);cyl(parent,r+.005,r,.018,silver,[0,.09,0]);textPlane(parent,label,r*1.65,.07,[0,.041,r+.004],'#b49a80',66);}
function armorFigure(){const root=group(scene,[-3.12,1.047,-.01]);base(root,.45,'A Z A D I');const g=group(root,[0,.10,0]);
const armor=standard('#303135',.8,.31),dark=standard('#141117',.30,.54),trim=standard('#9b7760',.85,.28);
for(const s of [-1,1]){const leg=group(g,[s*.13,.31,0]);leg.rotation.z=s*-.075;ball(leg,[.10,.22,.105],dark,[0,.14,0]);cube(leg,[.12,.42,.10],armor,[0,-.015,.079],.035);ball(leg,[.095,.08,.085],trim,[0,.28,.01]);cube(leg,[.18,.10,.29],dark,[0,-.245,.075],.035);cube(leg,[.16,.05,.18],armor,[0,-.215,.145],.025);}
ball(g,[.22,.31,.13],dark,[0,.76,0]);cube(g,[.32,.20,.17],armor,[0,.93,.048],.04);cube(g,[.16,.25,.10],armor,[0,.76,.102],.03);
for(let i=0;i<4;i++){const rib=cube(g,[.31-i*.035,.045,.12],armor,[0,.66+i*.063,.06],.012);}
cyl(g,.225,.225,.07,trim,[0,.60,0]);cube(g,[.085,.079,.032],silver,[0,.60,.229],.012);
for(const s of [-1,1]){const arm=group(g,[s*.25,1.0,0]);arm.rotation.z=s*.22;ball(arm,[.145,.095,.145],armor,[0,0,0]);ball(arm,[.068,.16,.072],dark,[0,-.18,0]);ball(arm,[.07,.065,.07],trim,[0,-.31,0]);cube(arm,[.11,.24,.11],armor,[0,-.40,.025],.026);ball(arm,[.069,.08,.06],dark,[0,-.55,.01]);for(let k=0;k<3;k++)cube(arm,[.12,.023,.12],trim,[0,-.33-k*.06,.021],.008);}
// Hood opening, sculpted cheek plates and emissive visor.
ball(g,[.20,.245,.19],dark,[0,1.28,-.025]);ball(g,[.138,.173,.072],black,[0,1.265,.147]);cube(g,[.19,.025,.018],glow,[0,1.30,.206],.01);for(const s of [-1,1]){const cheek=cube(g,[.045,.15,.075],armor,[s*.09,1.22,.17],.018);cheek.rotation.z=s*-.25;}
cube(g,[.06,.15,.038],trim,[0,1.225,.216],.014);
const capeGeo=new THREE.BufferGeometry(),vs=[],uv=[],inds=[];const nx=24,ny=32;
for(let j=0;j<=ny;j++){const t=j/ny;for(let i=0;i<=nx;i++){const u=i/nx,a=(u-.5)*2.35;const radius=.22+t*.29;vs.push(Math.sin(a)*radius,1.06-t*.92,-.08-Math.cos(a)*radius+.022*Math.sin(u*45)*(t+.2));uv.push(u,t);if(i<nx&&j<ny){const k=j*(nx+1)+i;inds.push(k,k+1,k+nx+1,k+1,k+nx+2,k+nx+1);}}}
capeGeo.setAttribute('position',new THREE.Float32BufferAttribute(vs,3));capeGeo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));capeGeo.setIndex(inds);capeGeo.computeVertexNormals();mesh(capeGeo,new THREE.MeshStandardMaterial({color:'#3b101c',roughness:.82,side:THREE.DoubleSide}),g);
const sword=group(g,[.42,.62,.04]);sword.rotation.z=.56;rod(sword,[0,-.05,0],[0,.13,0],.027,silver);cube(sword,[.17,.024,.04],trim,[0,-.04,0],.006);rod(sword,[0,-.09,0],[0,-.76,0],.016,glow);
logo(g,.085,[0,.955,.143],red);figures.push({g,base:g.rotation.y,phase:0});pick(root,'Armored collectible · 3D animation','animation');return root;}
armorFigure();

// Vinyl designer collectible with sculpted hair, ears, glossy eyes, jacket and sneakers.
function vinylFigure(){const root=group(scene,[3.23,1.047,.42]);base(root,.33,'A Z A D I');const g=group(root,[0,.10,0]);
for(const s of [-1,1]){cube(g,[.105,.23,.11],black,[s*.092,.20,0],.025);cube(g,[.14,.073,.215],white,[s*.092,.058,.045],.025);cube(g,[.145,.022,.22],red,[s*.092,.027,.045],.01);for(let k=0;k<3;k++)cube(g,[.072,.009,.011],silver,[s*.092,.098,.051+k*.024],.003);}
cube(g,[.29,.34,.19],black,[0,.45,0],.055);cube(g,[.13,.21,.01],red,[0,.47,.103],.014);logo(g,.09,[0,.50,.116],silver);
for(const s of [-1,1]){const lapel=cube(g,[.055,.22,.026],edge,[s*.091,.49,.11],.012);lapel.rotation.z=s*.23;const arm=group(g,[s*.19,.51,0]);arm.rotation.z=s*.10;cube(arm,[.085,.25,.12],black,[0,-.05,0],.038);ball(arm,[.052,.059,.05],skin,[0,-.2,0]);}
const head=group(g,[0,.84,0]);cube(head,[.59,.51,.46],skin,[0,0,0],.15);
for(const s of [-1,1]){ball(head,[.055,.078,.035],skin,[s*.30,0,.025]);ball(head,[.068,.083,.025],standard('#08070b',.15,.09),[s*.142,-.025,.232]);ball(head,[.014,.016,.004],white,[s*.142-.021,.005,.255]);const brow=cube(head,[.14,.028,.022],black,[s*.14,.087,.228],.01);brow.rotation.z=s*-.12;}
ball(head,[.031,.042,.025],skin,[0,-.047,.243]);const smile=torus(head,.039,.004,standard('#905e49',0,.6),[0,-.113,.224],Math.PI*.8);smile.rotation.z=Math.PI*1.1;
const hair=standard('#171316',.18,.3);ball(head,[.31,.16,.239],hair,[0,.216,-.024]);for(let i=0;i<20;i++){const a=i*.5;const lock=ball(head,[.066,.055,.13],hair,[Math.sin(a)*.235,.21+Math.cos(a)*.045,Math.cos(a)*.13]);lock.rotation.set(.15,Math.sin(a)*.8,-.35);}
for(const s of [-1,1])ball(head,[.043,.12,.10],hair,[s*.28,.14,-.05]);
figures.push({g:head,base:0,phase:1.8});pick(root,'Designer collectible · meet Azadi','about');return root;}
vinylFigure();

// Glass brand orb and a real camera on a small display plinth.
const orb=group(scene,[4.08,1.12,.12]);cyl(orb,.36,.37,.16,black);const sphere=ball(orb,[.38,.38,.38],glass,[0,.44,0]);const orbLogo=logo(orb,.34,[0,.43,-.035],glow);pick(orb,'Creative orb · creative direction','creative');
const deskCamera=group(scene,[-4.3,1.32,-.78]);cameraModel(deskCamera);deskCamera.scale.setScalar(.8);deskCamera.rotation.y=.45;pick(deskCamera,'Camera · photography','photo');

// Plants are individual curved leaf meshes, stems and ceramic planters.
function plant(x,z,scale){const p=group(scene,[x,-.13,z]);p.scale.setScalar(scale);cyl(p,.34,.26,.56,standard('#d1c6bc',.1,.47),[0,.28,0]);cyl(p,.31,.31,.025,standard('#332b24',0,1),[0,.57,0]);const leafMat=standard('#334a32',0,.63,{side:THREE.DoubleSide});for(let i=0;i<20;i++){const a=i*2.4,height=.9+rand()*1.65;rod(p,[0,.55,0],[Math.sin(a)*.3,height,Math.cos(a)*.3],.018,standard('#4b4c2c',0,.8));const shape=new THREE.Shape();shape.moveTo(0,0);shape.bezierCurveTo(-.25,.2,-.18,.55,0,.81);shape.bezierCurveTo(.18,.55,.25,.2,0,0);const leaf=mesh(new THREE.ShapeGeometry(shape,16),leafMat,p,Math.sin(a)*.3,height,Math.cos(a)*.3);const positions=leaf.geometry.attributes.position;for(let v=0;v<positions.count;v++){const yy=positions.getY(v);positions.setZ(v,Math.sin(yy/.81*Math.PI)*.12+positions.getX(v)*positions.getX(v)*.8);}positions.needsUpdate=true;leaf.geometry.computeVertexNormals();leaf.rotation.set(.65,a,-.5);}}plant(5.4,-2.8,1.5);plant(-5.7,-1.5,1.1);


// Batch material-compatible mesh geometry. Original meshes stay available to
// raycasting; rendered batches preserve the same world-space volume and shadows.
const movingRoots=new Set([...animatedIcons.map(x=>x.g),...figures.map(x=>x.g),orbLogo]);
function batchRoot(root){
 if(root.isMesh)return;
 scene.updateMatrixWorld(true);
 const inverse=root.matrixWorld.clone().invert(),bins=new Map();
 const meshes=[];root.traverse(o=>{if(!o.isMesh||Array.isArray(o.material)||o.material.transparent||o.material.transmission>0||!o.visible)return;let a=o;while(a&&a!==root){if(movingRoots.has(a))return;a=a.parent;}meshes.push(o);});
 for(const o of meshes){const k=o.material.uuid+'/'+o.castShadow;let bin=bins.get(k);if(!bin){bin={material:o.material,shadow:o.castShadow,geos:[]};bins.set(k,bin);}const geo=(o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone());geo.applyMatrix4(inverse.clone().multiply(o.matrixWorld));bin.geos.push(geo);o.visible=false;}
 for(const bin of bins.values()){const geo=new THREE.BufferGeometry();for(const name of ['position','normal','uv']){if(!bin.geos.every(g=>g.attributes[name]))continue;const n=bin.geos.reduce((sum,g)=>sum+g.attributes[name].array.length,0),data=new Float32Array(n);let offset=0;for(const g of bin.geos){data.set(g.attributes[name].array,offset);offset+=g.attributes[name].array.length;}geo.setAttribute(name,new THREE.BufferAttribute(data,name==='uv'?2:3));}geo.computeBoundingSphere();const m=new THREE.Mesh(geo,bin.material);m.castShadow=bin.shadow;m.receiveShadow=true;root.add(m);for(const g of bin.geos)g.dispose();}
}
batchRoot(scene);for(const root of movingRoots)batchRoot(root);

// Interaction uses geometry raycasting, not transparent rectangles over a photograph.
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();const tooltip=document.getElementById('studioTooltip');
let down=null,lastPicked=null,dragged=false,motion=!reduced.matches,active=true,manual=false,cameraTween=null;
function hit(e){const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(pickables,true);if(!hits.length)return null;let o=hits[0].object;while(o&&!o.userData.service)o=o.parent;return o;}
renderer.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};dragged=false;});
renderer.domElement.addEventListener('pointermove',e=>{if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>5)dragged=true;const o=hit(e);lastPicked=o;renderer.domElement.style.cursor=o?'pointer':'grab';tooltip.textContent=o?.userData.label||'';tooltip.hidden=!o||dragged;tooltip.style.left=Math.min(e.clientX-host.getBoundingClientRect().left+14,host.clientWidth-250)+'px';tooltip.style.top=Math.max(70,e.clientY-host.getBoundingClientRect().top-42)+'px';});
renderer.domElement.addEventListener('pointerleave',()=>{tooltip.hidden=true;down=null;});
renderer.domElement.addEventListener('pointerup',e=>{const valid=down&&!dragged;down=null;if(!valid)return;const o=hit(e);if(!o)return;if(o.userData.service.startsWith('nav:'))document.getElementById(o.userData.service.slice(4))?.scrollIntoView({behavior:reduced.matches?'instant':'smooth'});else if(o.userData.service==='focus')focusMonitor();else if(o.userData.service==='lighting')toggleLighting();else {window.openService(o.userData.service);document.getElementById('winClose').focus({preventScroll:true});}});
controls.addEventListener('start',()=>{manual=true;cameraTween=null;});
function goTo(position,target){cameraTween={from:camera.position.clone(),to:new THREE.Vector3(...position),targetFrom:controls.target.clone(),targetTo:new THREE.Vector3(...target),start:performance.now(),duration:reduced.matches?1:1200};}
function home(){document.body.classList.remove('focus-mode');document.getElementById('serviceWindow').classList.remove('open');manual=false;goTo(isSmall()?[.6,4.5,14.4]:[.45,3.25,8.7],[0,2.12,.12]);}
function focusMonitor(){document.body.classList.add('focus-mode');goTo(isSmall()?[0,3.15,7.4]:[0,3.10,5.4],[0,2.94,-.7]);}
document.getElementById('motionToggle').setAttribute('aria-pressed',String(motion));
document.getElementById('motionToggle').textContent=motion?'Animation on':'Animation off';
let warm=true;
function toggleLighting(){warm=!warm;rim.color.set(warm?'#ff1632':'#7dabff');rim.intensity=warm?25:17;glow.emissive.set(warm?'#ff0428':'#659dff');document.getElementById('lightToggle').textContent=warm?'Red studio light':'Cool studio light';}
window.azadi3d={focus:focusMonitor,home,scene,camera,renderer,controls};
document.getElementById('cameraHome').addEventListener('click',home);
document.getElementById('cameraFocus').addEventListener('click',focusMonitor);
document.getElementById('lightToggle').addEventListener('click',toggleLighting);
document.getElementById('motionToggle').addEventListener('click',()=>{motion=!motion;document.getElementById('motionToggle').setAttribute('aria-pressed',String(motion));document.getElementById('motionToggle').textContent=motion?'Animation on':'Animation off';});
document.getElementById('cameraLeft').addEventListener('click',()=>{const v=camera.position.clone().sub(controls.target);v.applyAxisAngle(new THREE.Vector3(0,1,0),-.22);goTo(v.add(controls.target).toArray(),controls.target.toArray());});
document.getElementById('cameraRight').addEventListener('click',()=>{const v=camera.position.clone().sub(controls.target);v.applyAxisAngle(new THREE.Vector3(0,1,0),.22);goTo(v.add(controls.target).toArray(),controls.target.toArray());});
function resize(){const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=isSmall()?63:43;camera.updateProjectionMatrix();controls.enableRotate=!isSmall();renderer.domElement.style.touchAction=isSmall()?'pan-y':'none';}
new ResizeObserver(resize).observe(host);resize();
const initial=isSmall()?[.6,4.5,14.4]:[.45,3.25,8.7];camera.position.set(...initial);controls.target.set(0,2.12,.12);controls.update();
const observer=new IntersectionObserver(entries=>{active=entries[0].isIntersecting;},{threshold:.01});observer.observe(host);
let last=0,frameCount=0,lastRender=0;
function renderFrame(now){if(!active||document.hidden||now-lastRender<1000/30)return;lastRender=now;const t=now*.001,dt=Math.min((now-last)*.001,.05);last=now;
if(cameraTween){const k=Math.min((now-cameraTween.start)/cameraTween.duration,1),ease=k*k*(3-2*k);camera.position.lerpVectors(cameraTween.from,cameraTween.to,ease);controls.target.lerpVectors(cameraTween.targetFrom,cameraTween.targetTo,ease);if(k===1)cameraTween=null;}
if(motion){for(const a of animatedIcons){if(a.type==='spin'){a.g.rotation.y+=dt*.35;}else{a.g.position.y=a.base+Math.sin(t*1.2+a.phase)*.023;a.g.rotation.y=-.16+Math.sin(t*.8+a.phase)*.10;}}for(const f of figures){f.g.rotation.y=f.base+Math.sin(t*.65+f.phase)*.045;}orbLogo.rotation.y=Math.sin(t*.7)*.27;}
controls.update();if(frameCount%12===0)renderer.shadowMap.needsUpdate=true;renderer.render(scene,camera);if(++frameCount===2){host.classList.add('ready');loading.hidden=true;window.__azadi3dReady=true;window.dispatchEvent(new Event('azadi3dready'));}}
renderer.setAnimationLoop(renderFrame);
window.azadi3d.pause=()=>renderer.setAnimationLoop(null);
window.azadi3d.resume=()=>renderer.setAnimationLoop(renderFrame);
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();loading.hidden=false;loading.textContent='3D view paused. Reload to restore the studio.';});
