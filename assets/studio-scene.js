/* Reference-directed photographic scene. Deliberately 2.5D, not a WebGL model. */
(() => {
  const hero = document.querySelector('.hero');
  const stage = document.createElement('div');
  stage.className = 'reference-stage';
  stage.innerHTML = '<img class="studio-photograph" src="assets/studio-reference.webp" width="1672" height="941" alt="Azadi Studio workstation: aluminum monitor, red-lit desk, sculpted action figures, headphones, keyboard and creative tools in a sunset studio." fetchpriority="high"><h1 class="sr-only">Azadi Studio — Innovation Without Limits.</h1>';
  hero.prepend(stage);
  const makeHotspot = ({label, box, service, href, focus}) => {
    const node = document.createElement(href ? 'a' : 'button');
    node.className = 'scene-hotspot';
    if (href) node.href = href;
    else node.type = 'button';
    node.setAttribute('aria-label', label);
    node.innerHTML = '<span class="hotspot-label"></span>';
    node.firstChild.textContent = label;
    const [x,y,w,h] = box;
    Object.assign(node.style, {left:`${x/1672*100}%`,top:`${y/941*100}%`,width:`${w/1672*100}%`,height:`${h/941*100}%`});
    if (service) node.addEventListener('click', () => {
      lastTrigger = node;
      openService(service);
      dialog.setAttribute('role','dialog');
      document.getElementById('winClose').focus({preventScroll:true});
    });
    if (focus) node.addEventListener('click',focusDesktop);
    stage.append(node);
  };
  let lastTrigger;
  [
    {label:'Website and App Design',service:'web',box:[741,151,210,230]},
    {label:'3D Advertising and Cinematic Animation',service:'animation',box:[975,147,226,234]},
    {label:'Film and Video Editing',service:'editing',box:[624,397,183,208]},
    {label:'Graphic Design',service:'graphic',box:[827,397,181,210]},
    {label:'Photography and Videography',service:'photo',box:[1028,398,179,208]},
    {label:'Home',href:'#top',box:[655,86,45,35]},
    {label:'All services',href:'#services',box:[718,86,61,35]},
    {label:'Selected work',href:'#work',box:[792,86,48,35]},
    {label:'About Azadi',href:'#about',box:[857,86,48,35]},
    {label:'Contact',href:'#contact',box:[928,86,56,35]},
    {label:'Explore services',href:'#services',box:[1004,84,39,38]},
    {label:'Explore services',href:'#services',box:[1124,83,38,37]},
    {label:'Let’s create together',href:'#contact',box:[1175,84,96,34]},
    {label:'Focus the workstation',focus:true,box:[419,189,306,126]},
    {label:'Meet Azadi Studio',service:'about',box:[418,457,165,131]},
    {label:'Explore character animation',service:'animation',box:[275,407,146,299]},
    {label:'Explore creative direction',service:'creative',box:[1269,550,99,183]},
    {label:'Film and sound',service:'editing',box:[36,656,222,135]},
    {label:'Graphic design tools',service:'graphic',box:[271,736,254,93]}
  ].forEach(makeHotspot);
  const mount = document.createElement('div');
  mount.className = 'reference-screen';
  stage.append(mount);
  const dialog = document.getElementById('serviceWindow');
  dialog.setAttribute('aria-labelledby','winHeading');
  const oldScreen = document.getElementById('screen');
  const toolbar = document.createElement('nav');
  toolbar.className = 'scene-toolbar';
  toolbar.setAttribute('aria-label','Workstation controls');
  toolbar.innerHTML = '<button type="button" class="scene-focus">Enter workstation <span>↗</span></button><a href="#services">All services</a><button type="button" class="scene-motion" aria-pressed="true">Motion on</button>';
  hero.append(toolbar);
  toolbar.querySelector('.scene-focus').addEventListener('click',focusDesktop);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let motion = !reduce.matches;
  const motionButton = toolbar.querySelector('.scene-motion');
  function setMotion(value) {
    motion = value;
    document.body.classList.toggle('scene-still',!motion);
    motionButton.setAttribute('aria-pressed',String(motion));
    motionButton.textContent = motion ? 'Motion on' : 'Motion off';
  }
  setMotion(motion);
  motionButton.addEventListener('click',()=>setMotion(!motion));
  reduce.addEventListener('change', e=>setMotion(!e.matches));
  let frame;
  hero.addEventListener('pointermove', e=>{
    if (!motion || e.pointerType==='touch') return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(()=>{
      const r=hero.getBoundingClientRect();
      stage.style.setProperty('--scene-x',`${((e.clientX-r.left)/r.width-.5)*-6}px`);
      stage.style.setProperty('--scene-y',`${((e.clientY-r.top)/r.height-.5)*-4}px`);
    });
  });
  hero.addEventListener('pointerleave',()=>{
    cancelAnimationFrame(frame);
    stage.style.setProperty('--scene-x','0px');
    stage.style.setProperty('--scene-y','0px');
  });
  function syncDevice(){
    const mobile=document.body.classList.contains('device-mobile');
    const target=mobile?oldScreen:mount;
    if(dialog.parentElement!==target) target.append(dialog);
    stage.inert=mobile;
    document.querySelector('.room').inert=!mobile;
    document.querySelector('.topbar').inert=!mobile;
    document.getElementById('focusExit').textContent=mobile?'← Exit phone focus':'← Back to studio';
  }
  new MutationObserver(syncDevice).observe(document.body,{attributes:true,attributeFilter:['class']});
  syncDevice();
  new MutationObserver(()=>{
    const open=dialog.classList.contains('open');
    dialog.inert=!open;
    if(!open && lastTrigger){lastTrigger.focus({preventScroll:true});lastTrigger=null;}
  }).observe(dialog,{attributes:true,attributeFilter:['class']});
  dialog.inert=true;
  // Reuse the reference's product artwork for the existing mobile service icons.
  const artwork={web:[753,157,186,145],animation:[994,155,188,148],editing:[647,408,143,120],graphic:[846,407,149,137],photo:[1050,407,143,126],video:[1050,407,143,126]};
  for(const [key,[x,y,w,h]] of Object.entries(artwork)){
    document.querySelectorAll(`.desk-icon[data-service="${key}"] .icon3d`).forEach(icon=>{
      icon.classList.add('reference-icon');
      icon.style.backgroundImage='url("assets/studio-reference.webp")';
      icon.style.backgroundSize=`${1672/w*100}% ${941/h*100}%`;
      icon.style.backgroundPosition=`${x/(1672-w)*100}% ${y/(941-h)*100}%`;
    });
  }
})();
