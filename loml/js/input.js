// Tastiera + touch (joystick virtuale e pulsante azione) + tocchi generici
const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  Space: 'action', Enter: 'action', NumpadEnter: 'action', KeyE: 'action', KeyZ: 'action',
  Escape: 'menu', KeyP: 'menu', KeyM: 'mute', KeyX: 'back', Backspace: 'back',
};

export const input = {
  held: new Set(),
  q: new Set(),
  taps: [],
  joy: null,
  joyEnabled: false,
  actionBtn: null,
  touchUsed: false,
  pointer: { x: 0, y: 0, down: false, id: null },
  onGesture: null,

  dir() {
    let x = 0, y = 0;
    if (this.held.has('left')) x -= 1;
    if (this.held.has('right')) x += 1;
    if (this.held.has('up')) y -= 1;
    if (this.held.has('down')) y += 1;
    if (this.joy) {
      const dx = this.joy.x - this.joy.ox, dy = this.joy.y - this.joy.oy;
      const d = Math.hypot(dx, dy);
      if (d > 7) {
        const m = Math.min(1, d / 44);
        x = (dx / d) * m; y = (dy / d) * m;
      }
    }
    const l = Math.hypot(x, y);
    if (l > 1) { x /= l; y /= l; }
    return { x, y };
  },
  pressed(n) { return this.q.has(n); },
  consume(n) { this.q.delete(n); },
  takeTap(rect) {
    for (let i = 0; i < this.taps.length; i++) {
      const t = this.taps[i];
      if (t.x >= rect.x && t.x <= rect.x + rect.w && t.y >= rect.y && t.y <= rect.y + rect.h) {
        this.taps.splice(i, 1);
        return true;
      }
    }
    return false;
  },
  anyTap() {
    if (this.taps.length) { this.taps.length = 0; return true; }
    return false;
  },
  endFrame() { this.q.clear(); this.taps.length = 0; },
};

function gesture() { if (input.onGesture) input.onGesture(); }

window.addEventListener('keydown', (e) => {
  const k = KEYMAP[e.code];
  gesture();
  if (!k) return;
  e.preventDefault();
  if (!e.repeat) input.q.add(k);
  input.held.add(k);
});
window.addEventListener('keyup', (e) => {
  const k = KEYMAP[e.code];
  if (k) input.held.delete(k);
});
window.addEventListener('blur', () => { input.held.clear(); input.joy = null; });

const cv = document.getElementById('game');
cv.addEventListener('contextmenu', (e) => e.preventDefault());
cv.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  gesture();
  const x = e.clientX, y = e.clientY;
  if (e.pointerType === 'touch') input.touchUsed = true;
  try { cv.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
  const ab = input.actionBtn;
  if (input.touchUsed && ab && Math.hypot(x - ab.x, y - ab.y) < ab.r * 1.3) {
    input.q.add('action');
    return;
  }
  if (input.joyEnabled && e.pointerType === 'touch' && x < window.innerWidth * 0.55 && y > 70) {
    input.joy = { id: e.pointerId, ox: x, oy: y, x, y };
    return;
  }
  input.taps.push({ x, y });
  input.pointer = { x, y, down: true, id: e.pointerId };
}, { passive: false });
cv.addEventListener('pointermove', (e) => {
  if (input.joy && input.joy.id === e.pointerId) {
    input.joy.x = e.clientX; input.joy.y = e.clientY;
    // il joystick "segue" il dito se si allontana troppo
    const dx = input.joy.x - input.joy.ox, dy = input.joy.y - input.joy.oy, d = Math.hypot(dx, dy);
    if (d > 60) { input.joy.ox = input.joy.x - dx / d * 60; input.joy.oy = input.joy.y - dy / d * 60; }
  }
  if (input.pointer.id === e.pointerId) { input.pointer.x = e.clientX; input.pointer.y = e.clientY; }
});
function up(e) {
  if (input.joy && input.joy.id === e.pointerId) input.joy = null;
  if (input.pointer.id === e.pointerId) input.pointer.down = false;
}
cv.addEventListener('pointerup', up);
cv.addEventListener('pointercancel', up);
