(() => {
  if (document.documentElement.dataset.azadiRealism === '2') return;
  document.documentElement.dataset.azadiRealism = '2';

  const el = (tag, cls, parent, text='') => {
    const node = document.createElement(tag);
    node.className = cls;
    if (text) node.textContent = text;
    parent?.appendChild(node);
    return node;
  };

  const monitor = document.querySelector('.monitor');
  if (monitor) {
    el('span', 'monitor-camera', monitor);
    el('span', 'monitor-vent', monitor);
    el('span', 'monitor-brandmark', monitor, 'AZADI');
  }

  const pc = document.querySelector('.pc');
  if (pc) {
    const internals = el('div', 'pc-internals', pc);
    el('i', 'pc-board', internals);
    el('i', 'pc-gpu', internals);
    el('i', 'pc-ram', internals);
    el('i', 'pc-tube', internals);
  }

  const figure = document.querySelector('.figure');
  if (figure) {
    el('i', 'figure-shoe left', figure);
    el('i', 'figure-shoe right', figure);
  }

  const vinyl = document.querySelector('.funko .head');
  if (vinyl) el('i', 'vinyl-glint', vinyl);

  const desk = document.querySelector('.desk-zone');
  if (desk) {
    const mat = el('div', 'realism-mat', desk);
    mat.setAttribute('aria-hidden', 'true');
    const cableA = el('i', 'realism-cable keyboard-cable', desk);
    const cableB = el('i', 'realism-cable mouse-cable', desk);
    cableA.setAttribute('aria-hidden', 'true');
    cableB.setAttribute('aria-hidden', 'true');

    // Keep foreground props above the injected desk mat without altering layout.
    ['.keyboard','.mouse','.computer','.pc','.speaker','.figure','.funko','.monitor-cta'].forEach((selector) => {
      const node = desk.querySelector(selector);
      if (node && !node.style.zIndex) node.style.zIndex = selector === '.computer' ? '7' : '4';
    });
  }

  const root = document.documentElement;
  let raf = 0;
  const updateLight = (x, y) => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      root.style.setProperty('--real-light-x', `${Math.max(0, Math.min(100, x))}%`);
      root.style.setProperty('--real-light-y', `${Math.max(0, Math.min(100, y))}%`);
    });
  };
  window.addEventListener('pointermove', (event) => {
    updateLight((event.clientX / innerWidth) * 100, (event.clientY / innerHeight) * 100);
  }, { passive:true });
})();
