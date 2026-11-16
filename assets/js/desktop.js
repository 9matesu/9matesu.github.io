// ------------------------------------------------- área de trabalho
// A página é um sistema operacional de mentira: papel de parede com o
// mapa, ícones na mesa, a janela do portfólio e uma barra de tarefas.
var deskEl = document.getElementById("desktop");
var introCard = document.getElementById("intro-card");
var appWindow = document.getElementById("app-window");
var winMin = document.getElementById("win-min");
var winMax = document.getElementById("win-max");
var winClose = document.getElementById("win-close");
var introClose = document.getElementById("intro-close");
var iconPortfolio = document.getElementById("icon-portfolio");
var iconSobre = document.getElementById("icon-sobre");
var taskApp = document.getElementById("task-app");
var startBtn = document.getElementById("start-btn");
var startMenu = document.getElementById("start-menu");
var taskClock = document.getElementById("task-clock");
var introEnter = document.getElementById("intro-enter");
var viewportEl = document.getElementById("viewport");

var deskState = "intro";
var deskBusy = false;

// O nome vira letras soltas, cada uma com o seu atraso
(function splitIntroName() {
  var name = document.querySelector(".intro-name");
  if (!name) return;
  var text = name.getAttribute("aria-label") || name.textContent;
  name.innerHTML = "";
  for (var i = 0; i < text.length; i++) {
    var span = document.createElement("span");
    span.textContent = text.charAt(i);
    span.style.setProperty("--i", i);
    span.setAttribute("aria-hidden", "true");
    name.appendChild(span);
  }
})();

// Índices para o texto entrar em cascata
function deskStagger() {
  if (!viewportEl) return;
  var bio = viewportEl.querySelectorAll("#sidebar .bio-top > *, #sidebar .bio-footer");
  for (var i = 0; i < bio.length; i++) bio[i].style.setProperty("--i", i);
  var cols = viewportEl.querySelectorAll("#stage .col");
  for (var c = 0; c < cols.length; c++) {
    cols[c].style.setProperty("--i", c);
    var items = cols[c].querySelectorAll(".item");
    for (var k = 0; k < items.length; k++) items[k].style.setProperty("--i", k);
  }
}

function updatePortfolioTask(state) {
  var host = document.getElementById("task-buttons");
  if (!host) return;
  var btn = document.getElementById("task-app");

  if (state === "app" || state === "min") {
    if (!btn) {
      btn = document.createElement("button");
      btn.id = "task-app";
      btn.type = "button";
      btn.className = "task-item";
      btn.innerHTML = '<span class="task-icon" aria-hidden="true"><img src="img/xp/Explorer-32.png" alt=""></span><span class="task-label">matesu: portf\u00f3lio</span>';
      btn.addEventListener("click", function() {
        if (deskState === "app") minimizeApp();
        else openApp();
      });
      host.appendChild(btn);
      taskApp = btn;
    }
    btn.classList.toggle("active", state === "app");
  } else {
    if (btn && btn.parentNode) {
      btn.parentNode.removeChild(btn);
      taskApp = null;
    }
  }
}

function deskSet(state) {
  deskState = state;
  if (deskEl) deskEl.className = "desk--" + state;
  updatePortfolioTask(state);
  if (state === "app" && appWindow) {
    appWindow.style.transform = "";
    appWindow.style.opacity = "";
    appWindow.style.pointerEvents = "";
  }
}

// Abre a janela grande. Vindo do cartão, a janela cresce de dentro dele
// e o texto do cartão corre para fora junto.
function openApp() {
  if (!appWindow || deskBusy) return;
  if (deskState === "app") return;
  deskBusy = true;

  if (deskState === "intro" && introCard) {
    introCard.classList.add("leaving");
    var ir = introCard.getBoundingClientRect();
    appWindow.style.transition = "none";
    appWindow.style.transform = "none";
    appWindow.style.opacity = "1";
    appWindow.style.pointerEvents = "none";
    appWindow.style.transformOrigin = "center";
    var ar = appWindow.getBoundingClientRect();
    var sx = ir.width / ar.width;
    var sy = ir.height / ar.height;
    var tx = (ir.left + ir.width / 2) - (ar.left + ar.width / 2);
    var ty = (ir.top + ir.height / 2) - (ar.top + ar.height / 2);
    appWindow.style.transform = "translate(" + tx.toFixed(1) + "px," + ty.toFixed(1) + "px) scale(" + sx.toFixed(3) + "," + sy.toFixed(3) + ")";

    deskState = "app";
    deskEl.className = "desk--app";
    updatePortfolioTask("app");
    appWindow.classList.add("enter-anim");
    deskStagger();
    mapResize();

    var applied = false;
    function applyEnd() {
      if (applied) return;
      applied = true;
      appWindow.style.transition = "";
      appWindow.style.transform = "";
      appWindow.style.opacity = "";
      appWindow.style.pointerEvents = "";
    }

    requestAnimationFrame(function() {
      requestAnimationFrame(applyEnd);
    });
    setTimeout(applyEnd, 60);

    setTimeout(function() {
      introCard.classList.remove("leaving");
      appWindow.classList.remove("enter-anim");
      deskBusy = false;
    }, 900);
    return;
  }

  // voltando da barra de tarefas ou do ícone
  deskSet("app");
  deskStagger();
  appWindow.classList.add("enter-anim");
  setTimeout(function() {
    appWindow.classList.remove("enter-anim");
    deskBusy = false;
  }, 900);
  mapResize();
}

function collapseApp(target, state) {
  if (!appWindow) return;
  var r = appWindow.getBoundingClientRect();
  var tx = target.left + target.width / 2 - (r.left + r.width / 2);
  var ty = target.top + target.height / 2 - (r.top + r.height / 2);
  appWindow.style.transition = "";
  appWindow.style.transform = "translate(" + tx.toFixed(1) + "px," + ty.toFixed(1) + "px) scale(0.05)";
  appWindow.style.opacity = "0";
  appWindow.style.pointerEvents = "none";
  deskSet(state);
}

function minimizeApp() {
  if (deskState !== "app") return;
  xpPlay("minimize", 0.5);
  if (taskApp) collapseApp(taskApp.getBoundingClientRect(), "min");
  else showIntro(false);
}

function closeApp() {
  if (deskState !== "app" && deskState !== "min") return;
  appWindow.classList.remove("maximized");
  if (winMax) winMax.setAttribute("aria-label", "maximizar");
  playClick("close");
  if (iconPortfolio) collapseApp(iconPortfolio.getBoundingClientRect(), "closed");
  else showIntro(false);
  setTimeout(mapResize, 600);
}

// Maximizar: ocupa a mesa toda, com uma folga mínima nas bordas
function maximizeApp() {
  if (!appWindow || deskState !== "app") return;
  var on = appWindow.classList.toggle("maximized");
  if (winMax) winMax.setAttribute("aria-label", on ? "restaurar" : "maximizar");
  xpPlay(on ? "minimize" : "restore", 0.45);
  mapResize();
  setTimeout(mapResize, 620);
}

// Mostra o cartão de entrada por cima do papel de parede
function showIntro(soft) {
  if (!introCard) return;
  deskSet("intro");
  if (appWindow) {
    appWindow.style.transform = "";
    appWindow.style.transition = "";
    appWindow.style.opacity = "";
    appWindow.style.pointerEvents = "";
  }
  // reinicia as animações do cartão
  introCard.querySelectorAll(".intro-photo, .intro-bio, .intro-actions, .intro-corner").forEach(function(el) {
    el.style.animation = "none";
    void el.offsetWidth;
    el.style.animation = "";
  });
  var name = introCard.querySelector(".intro-name");
  if (name) {
    name.querySelectorAll("span").forEach(function(sp) {
      sp.style.animation = "none";
      void sp.offsetWidth;
      sp.style.animation = "";
    });
  }
  introCard.classList.remove("leaving");
}

if (introEnter) introEnter.addEventListener("click", function() {
  playClick("open");
  openApp();
});

if (winMin) winMin.addEventListener("click", function(e) {
  e.stopPropagation();
  minimizeApp();
});

if (winMax) winMax.addEventListener("click", function(e) {
  e.stopPropagation();
  maximizeApp();
});

// Duplo clique na barra de título alterna maximizar, como no XP
if (appWindow) {
  var winBarEl = appWindow.querySelector(".win-bar");
  if (winBarEl) winBarEl.addEventListener("dblclick", function(e) {
    if (e.target.closest(".win-btn")) return;
    maximizeApp();
  });
}

if (winClose) winClose.addEventListener("click", function(e) {
  e.stopPropagation();
  closeApp();
});

// Fechar o cartão de sobre deixa só a mesa, como no XP
if (introClose) introClose.addEventListener("click", function(e) {
  e.stopPropagation();
  deskSet("closed");
});

// =====================================================================
//  ÁREA DE TRABALHO XP
//  Cada item abre uma janela independente: Meu Computador, Documentos,
//  Música, Imagens, as pastas de release e o Windows Media Player.
//  As janelas são arrastáveis, redimensionáveis e trazem menu de
//  contexto no botão direito, como no XP.
// =====================================================================

var deskIconsEl = document.getElementById("desk-icons");
var deskMarqueeEl = document.getElementById("desk-marquee");
var xpWindowsEl = document.getElementById("xp-windows");
var xpContextLayer = document.getElementById("xp-context-layer");

// ------------------------------------------------- grade de ícones
// O XP guardava a posição de cada ícone e alinhava na grade de 75px.
var DESK_GRID_X = 76;
var DESK_GRID_Y = 80;
var DESK_PAD_X = 8;
var DESK_PAD_Y = 8;

function deskGridSlots() {
  var w = window.innerWidth;
  var h = window.innerHeight - 34;
  var cols = Math.max(1, Math.floor((w - DESK_PAD_X) / DESK_GRID_X));
  var rows = Math.max(1, Math.floor((h - DESK_PAD_Y) / DESK_GRID_Y));
  return { cols: cols, rows: rows };
}

function deskSlotRect(slot) {
  var slots = deskGridSlots();
  // coluna-principal: desce primeiro, depois vai para a direita (como XP)
  var row = slot % slots.rows;
  var col = Math.floor(slot / slots.rows);
  return {
    left: DESK_PAD_X + col * DESK_GRID_X,
    top: DESK_PAD_Y + row * DESK_GRID_Y
  };
}

// Posições salvas por ícone, para o desktop lembrar o arrasto.
function deskLoadPositions() {
  var out = {};
  try {
    var saved = localStorage.getItem("matesu_deskpos");
    if (saved) out = JSON.parse(saved) || {};
  } catch (e) {}
  return out;
}

function deskSavePositions() {
  try {
    var out = {};
    var icons = deskIconsEl.querySelectorAll(".desk-icon");
    for (var i = 0; i < icons.length; i++) {
      var body = icons[i]._deskBody;
      out[icons[i].id] = {
        left: parseFloat(icons[i].style.left) || 0,
        top: parseFloat(icons[i].style.top) || 0,
        a: body ? +(body.a % 360).toFixed(2) : 0
      };
    }
    localStorage.setItem("matesu_deskpos", JSON.stringify(out));
  } catch (e) {}
}

// ------------------------------------------------- física dos ícones
// A mesa é um plano com gravidade. Cada ícone cai do alto, quica,
// esbarra nos vizinhos e descansa em cima da barra de tarefas, que faz
// as vezes de piso. Arrastar arremessa o ícone com inércia; clicar
// gira; a roda do mouse empurra para a frente ou para trás.
var DESK_G = 2700;          // gravidade, px/s²
var DESK_BOUNCE = 0.62;     // quique no piso
var DESK_WALL = 0.58;       // quique nas paredes
var DESK_STEP = 1 / 120;    // passo fixo da simulação

var deskBodies = [];
var deskPhysRaf = null;
var deskPhysLast = 0;
var deskPhysAcc = 0;
var deskPhysBooted = false;

function deskPhysClamp(v, lo, hi) {
  return v < lo ? lo : (v > hi ? hi : v);
}

function deskPhysSize() {
  return {
    w: (deskIconsEl && deskIconsEl.clientWidth) || window.innerWidth,
    h: (deskIconsEl && deskIconsEl.clientHeight) || (window.innerHeight - 34)
  };
}

function deskBodyFor(el) {
  return el && el._deskBody ? el._deskBody : null;
}

// Distribui os ícones. Na primeira vez todos nascem acima da tela e caem;
// ao redimensionar, os corpos só são acomodados dentro da nova mesa.
function deskLayoutIcons() {
  if (!deskIconsEl) return;

  if (deskPhysBooted) {
    deskPhysReflow();
    return;
  }
  deskPhysBooted = true;

  var icons = deskIconsEl.querySelectorAll(".desk-icon");
  var saved = deskLoadPositions();
  var size = deskPhysSize();
  var W = size.w;

  deskBodies = [];

  for (var i = 0; i < icons.length; i++) {
    var el = icons[i];
    var w = el.offsetWidth || 76;
    var h = el.offsetHeight || 76;
    var pos = saved[el.id];
    var savedAngle = pos && typeof pos.a === "number";
    var sx;

    if (pos && typeof pos.left === "number") {
      sx = pos.left;
    } else {
      // primeira carga: chuva de ícones espalhada pela largura
      var frac = icons.length > 1 ? (i + 0.5) / icons.length : 0.5;
      sx = DESK_PAD_X + frac * Math.max(1, W - w - DESK_PAD_X * 2);
      sx += (Math.random() * 2 - 1) * 18;
    }
    sx = deskPhysClamp(sx, 0, Math.max(0, W - w));

    var body = {
      el: el,
      w: w,
      h: h,
      x: sx,
      y: -h - 30 - Math.random() * 80,
      vx: (Math.random() * 2 - 1) * 70,
      vy: 40 + Math.random() * 80,
      a: savedAngle ? pos.a : (Math.random() * 2 - 1) * 16,
      va: savedAngle ? 0 : (Math.random() * 2 - 1) * 90,
      fromSave: !!savedAngle,
      z: (Math.random() * 2 - 1) * 0.7,
      vz: 0,
      restZ: (Math.random() * 2 - 1) * 0.45,
      held: false,
      asleep: false,
      sleepT: 0,
      grounded: false,
      delay: i * 0.07 + Math.random() * 0.08
    };

    el._deskBody = body;
    deskBodies.push(body);
    deskPhysPaint(body);
  }

  deskPhysEnsure();
}

function deskPhysReflow() {
  var size = deskPhysSize();
  var W = size.w;
  var H = size.h;

  for (var i = 0; i < deskBodies.length; i++) {
    var b = deskBodies[i];
    b.w = b.el.offsetWidth || b.w;
    b.h = b.el.offsetHeight || b.h;
    b.x = deskPhysClamp(b.x, 0, Math.max(0, W - b.w));
    var floor = Math.max(0, H - b.h);
    b.y = Math.min(b.y, floor);
    // a mesa mudou de tamanho: acorda a física, sem teleportar ninguém
    // para o piso nem mexer no ângulo em que o ícone estava
    b.asleep = false;
    b.sleepT = 0;
    b.grounded = false;
  }

  deskPhysPaintAll();
  deskPhysEnsure();
}

function deskPhysEnsure() {
  if (deskPhysRaf != null || !deskIconsEl || !deskBodies.length) return;
  deskPhysLast = window.performance && performance.now ? performance.now() : Date.now();
  deskPhysAcc = 0;
  deskPhysRaf = window.requestAnimationFrame(deskPhysFrame);
}

function deskPhysFrame(now) {
  deskPhysRaf = null;
  var dt = (now - deskPhysLast) / 1000;
  deskPhysLast = now;
  if (dt < 0) dt = 0;
  if (dt > 0.1) dt = 0.1; // voltou de outra aba: não explode
  deskPhysAcc += dt;

  var guard = 0;
  while (deskPhysAcc >= DESK_STEP && guard < 12) {
    deskPhysStep(DESK_STEP);
    deskPhysAcc -= DESK_STEP;
    guard++;
  }
  if (guard >= 12) deskPhysAcc = 0;

  deskPhysPaintAll();

  var awake = false;
  for (var i = 0; i < deskBodies.length; i++) {
    if (!deskBodies[i].asleep) { awake = true; break; }
  }
  if (awake) deskPhysRaf = window.requestAnimationFrame(deskPhysFrame);
}

function deskPhysStep(dt) {
  var size = deskPhysSize();
  var W = size.w;
  var H = size.h;

  for (var i = 0; i < deskBodies.length; i++) {
    var b = deskBodies[i];
    if (b.asleep) continue;

    if (b.delay > 0) {
      b.delay -= dt;
      if (b.delay > 0) continue;
    }

    if (b.held) {
      // arrastado: a gravidade continua puxando, o ponteiro só guia.
      // Solta pra cima e o ícone voa; solta e ele cai de novo.
      b.vy += DESK_G * dt * 0.5;
      b.sleepT = 0;
      continue;
    }

    b.vy += DESK_G * dt;

    // profundidade: mola macia de volta ao repouso
    b.vz += (b.restZ - b.z) * 34 * dt;
    b.vz *= Math.pow(0.012, dt);

    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.a += b.va * dt;
    b.z += b.vz * dt;

    if (b.x < 0) {
      b.x = 0;
      if (b.vx < 0) {
        deskImpactSound(b, Math.abs(b.vx), "click");
        b.vx = -b.vx * DESK_WALL;
      }
      b.va += 16;
    } else if (b.x > W - b.w) {
      b.x = Math.max(0, W - b.w);
      if (b.vx > 0) {
        deskImpactSound(b, Math.abs(b.vx), "click");
        b.vx = -b.vx * DESK_WALL;
      }
      b.va -= 16;
    }

    if (b.z < -1) {
      b.z = -1;
      if (b.vz < 0) b.vz = -b.vz * 0.35;
    } else if (b.z > 1) {
      b.z = 1;
      if (b.vz > 0) b.vz = -b.vz * 0.35;
    }

    if (b.y < 0) {
      b.y = 0;
      if (b.vy < 0) {
        deskImpactSound(b, Math.abs(b.vy), "click");
        b.vy = -b.vy * DESK_WALL;
        if (!b.fromSave) b.va += (Math.random() * 2 - 1) * 60;
      }
    }

    b.grounded = false;
    var floor = H - b.h;
    if (b.y >= floor) {
      b.y = floor;
      if (b.vy > 28) {
        deskImpactSound(b, b.vy, "click");
        b.vy = -b.vy * DESK_BOUNCE;
        if (!b.fromSave) b.va += (Math.random() * 2 - 1) * 130;
        if (Math.random() < 0.3) b.vz += (Math.random() * 2 - 1) * 1.4;
      } else {
        b.vy = 0;
        b.grounded = true;
      }
    }

    // no chão: a mesa freia o deslize aos poucos e o giro morre onde parou
    if (b.grounded) {
      b.vx *= Math.pow(0.18, dt);
      b.va *= Math.pow(0.08, dt);

      if (Math.abs(b.vx) < 8 && Math.abs(b.vy) < 10 &&
          Math.abs(b.va) < 25 && Math.abs(b.vz) < 0.08 &&
          Math.abs(b.z - b.restZ) < 0.03) {
        b.sleepT += dt;
        if (b.sleepT > 0.35) {
          b.vx = 0;
          b.vy = 0;
          b.va = 0;
          b.vz = 0;
          b.z = b.restZ;
          b.asleep = true;
          deskSavePositions();
        }
      } else {
        b.sleepT = 0;
      }
    } else {
      b.sleepT = 0;
    }
  }

  deskPhysCollide(W, H);
}

// Colisão retangular simples: separa o par pelo eixo de menor
// penetração e troca um pouco de velocidade. Dá para seis ícones.
function deskPhysCollide(W, H) {
  for (var i = 0; i < deskBodies.length; i++) {
    var a = deskBodies[i];
    for (var k = i + 1; k < deskBodies.length; k++) {
      var b = deskBodies[k];
      if (a.asleep && b.asleep) continue;
      if (a.delay > 0 || b.delay > 0) continue;

      var dx = (a.x + a.w / 2) - (b.x + b.w / 2);
      var dy = (a.y + a.h / 2) - (b.y + b.h / 2);
      var ox = (a.w + b.w) / 2 - Math.abs(dx);
      var oy = (a.h + b.h) / 2 - Math.abs(dy);
      if (ox <= 0 || oy <= 0) continue;

      // Na mesa os ícones não empilham: a separação é sempre no eixo
      // horizontal, então quem cai em cima de outro escorrega para o lado.
      var nx = dx < 0 ? -1 : (dx > 0 ? 1 : (Math.random() < 0.5 ? -1 : 1));
      var pen = ox;


      var push = Math.min(pen / 2, 3);
      a.x += nx * push;
      b.x -= nx * push;

      var vn = (a.vx - b.vx) * nx;
      if (vn < -24) {
        deskImpactSound(a, Math.abs(vn), "click");
        var imp = -(1 + 0.55) * vn / 2;
        a.vx += imp * nx;
        b.vx -= imp * nx;
        // impacto dá um giro de brinde
        if (!a.fromSave) a.va += (Math.random() * 2 - 1) * Math.min(70, Math.abs(vn) * 0.08);
        if (!b.fromSave) b.va += (Math.random() * 2 - 1) * Math.min(70, Math.abs(vn) * 0.08);
      } else if (vn < 0) {
        a.vx *= 0.5;
        b.vx *= 0.5;
      }

      a.x = deskPhysClamp(a.x, 0, Math.max(0, W - a.w));
      b.x = deskPhysClamp(b.x, 0, Math.max(0, W - b.w));
      var fa = H - a.h;
      var fb = H - b.h;
      if (a.y > fa) a.y = fa;
      if (b.y > fb) b.y = fb;

      if (pen > 0.8) {
        if (a.asleep && Math.abs(b.vx) + Math.abs(b.vy) > 36) {
          a.asleep = false;
          a.sleepT = 0;
        }
        if (b.asleep && Math.abs(a.vx) + Math.abs(a.vy) > 36) {
          b.asleep = false;
          b.sleepT = 0;
        }
      }
    }
  }
}

function deskPhysPaint(b) {
  if (!b || !b.el) return;
  var s = 0.9 + (b.z + 1) * 0.075; // 0.90 .. 1.05
  var zi = Math.round(30 + b.z * 12);
  if (b.held) zi = 80;
  b.el.style.left = b.x.toFixed(2) + "px";
  b.el.style.top = b.y.toFixed(2) + "px";
  // profundidade no botão inteiro; o giro só no desenho, para o rótulo
  // continuar de pé e legível
  b.el.style.transform = "scale(" + s.toFixed(3) + ")";
  b.el.style.zIndex = String(zi);
  b.el.style.opacity = b.held ? "1" : String(0.88 + ((b.z + 1) / 2) * 0.12);
  var art = b.el.querySelector(".desk-icon-art img");
  if (art) art.style.transform = "rotate(" + b.a.toFixed(2) + "deg)";
}

function deskPhysPaintAll() {
  for (var i = 0; i < deskBodies.length; i++) deskPhysPaint(deskBodies[i]);
}

// Clique: um giro e um pulinho aleatórios.
function deskIconSpin(el) {
  var b = deskBodyFor(el);
  if (!b) return;
  var dir = Math.random() < 0.5 ? -1 : 1;
  // gira em torno do próprio centro e muda de profundidade: fica
  // divertido sem tirar o ícone de baixo do ponteiro (o duplo clique
  // continua abrindo a janela)
  b.va += dir * (420 + Math.random() * 780);
  b.vz += (Math.random() * 2 - 1) * 1.7;
  b.asleep = false;
  b.sleepT = 0;
  deskPhysEnsure();
}

// Roda do mouse: empurra o ícone para a frente ou para trás.
function deskIconDepth(el, dir) {
  var b = deskBodyFor(el);
  if (!b || !dir) return;
  b.restZ = deskPhysClamp(b.restZ + dir * 0.3, -1, 1);
  b.vz += dir * 2.4;
  b.asleep = false;
  b.sleepT = 0;
  deskPhysEnsure();
}

// ------------------------------------------------- arrastar os icones (ragdoll e arremesso)
var deskIconDrag = null;
var deskIconSuppressClick = false;

function deskIconPointerDown(e) {
  if (e.button !== 0) return;
  var icon = e.currentTarget;
  var body = deskBodyFor(icon);
  if (!body) return;

  var rect = deskIconsEl.getBoundingClientRect();
  var grabX = e.clientX - rect.left - body.x;
  var grabY = e.clientY - rect.top - body.y;
  var startX = e.clientX;
  var startY = e.clientY;
  var moved = false;
  var pid = e.pointerId;

  // Historico de velocidades recentes para arremesso limpo
  var lastX = e.clientX;
  var lastY = e.clientY;
  var lastT = window.performance && performance.now ? performance.now() : Date.now();
  var flingVx = 0;
  var flingVy = 0;

  body.held = true;
  body.asleep = false;
  body.sleepT = 0;
  body.vx = 0;
  body.vy = 0;
  body.va = 0;
  deskPhysEnsure();

  try { icon.setPointerCapture(pid); } catch (err) {}

  function move(ev) {
    if (ev.pointerId !== pid) return;
    var dx = ev.clientX - startX;
    var dy = ev.clientY - startY;

    if (!moved) {
      if (Math.abs(dx) < 3 && Math.abs(dy) < 3) return;
      moved = true;
      icon.classList.add("dragging");
      deskIconDrag = icon;
      deskSelectIcons([icon]);
    }

    var now = window.performance && performance.now ? performance.now() : Date.now();
    var dt = Math.max(0.005, (now - lastT) / 1000);

    // Calculo da velocidade do arrasto para arremesso
    var curVx = (ev.clientX - lastX) / dt;
    var curVy = (ev.clientY - lastY) / dt;
    flingVx = flingVx * 0.35 + curVx * 0.65;
    flingVy = flingVy * 0.35 + curVy * 0.65;

    lastX = ev.clientX;
    lastY = ev.clientY;
    lastT = now;

    // Posicionamento livre e responsivo
    var nx = deskPhysClamp(ev.clientX - rect.left - grabX, -body.w * 0.3, Math.max(0, rect.width - body.w * 0.7));
    var ny = deskPhysClamp(ev.clientY - rect.top - grabY, -body.h * 0.3, Math.max(0, rect.height - body.h * 0.5));

    body.x = nx;
    body.y = ny;
    // Ragdoll: inclina dinamicamente com o movimento horizontal
    body.a = deskPhysClamp(flingVx * 0.045, -35, 35);

    deskPhysPaint(body);
  }

  function up(ev) {
    if (ev.pointerId !== pid) return;
    icon.removeEventListener("pointermove", move);
    icon.removeEventListener("pointerup", up);
    icon.removeEventListener("pointercancel", up);
    try { icon.releasePointerCapture(pid); } catch (err) {}

    body.held = false;
    body.asleep = false;
    body.sleepT = 0;

    if (!moved) {
      deskPhysEnsure();
      return;
    }

    icon.classList.remove("dragging");
    deskIconDrag = null;

    // Arremesso: fisica pura com inercia e giro proporcional ao arremesso
    var boost = 1.18;
    body.vx = deskPhysClamp(flingVx * boost, -2800, 2800);
    body.vy = deskPhysClamp(flingVy * boost, -2800, 2800);
    body.va = deskPhysClamp(flingVx * 0.22 + (Math.random() * 2 - 1) * 70, -600, 600);

    deskSavePositions();
    deskPhysEnsure();

    // Suprimir clique acidental apos arrastar
    deskIconSuppressClick = true;
    requestAnimationFrame(function() {
      requestAnimationFrame(function() { deskIconSuppressClick = false; });
    });
  }

  icon.addEventListener("pointermove", move);
  icon.addEventListener("pointerup", up);
  icon.addEventListener("pointercancel", up);
}

// ------------------------------------------------- seleção de ícones
function deskSelectIcons(list) {
  var icons = deskIconsEl.querySelectorAll(".desk-icon");
  for (var i = 0; i < icons.length; i++) {
    icons[i].classList.toggle("selected", list.indexOf(icons[i]) >= 0);
  }
}

// ------------------------------------------------- retângulo de seleção
// Clicar no fundo da mesa e arrastar desenha o retângulo azul do XP.
var deskMarquee = null;

function deskMarqueeStart(e) {
  if (e.button !== 0) return;
  if (e.target.closest(".desk-icon, .window, #taskbar, #start-menu, .xp-menu")) return;

  var sx = e.clientX;
  var sy = e.clientY;
  var marquee = deskMarqueeEl;

  function move(ev) {
    var x = Math.min(sx, ev.clientX);
    var y = Math.min(sy, ev.clientY);
    var w = Math.abs(ev.clientX - sx);
    var h = Math.abs(ev.clientY - sy);
    if (w < 3 && h < 3) return;
    marquee.classList.add("on");
    marquee.style.left = x + "px";
    marquee.style.top = y + "px";
    marquee.style.width = w + "px";
    marquee.style.height = h + "px";

    // marca os ícones que caem dentro do retângulo
    var picked = [];
    var icons = deskIconsEl.querySelectorAll(".desk-icon");
    for (var i = 0; i < icons.length; i++) {
      var r = icons[i].getBoundingClientRect();
      var cx = r.left + r.width / 2;
      var cy = r.top + r.height / 2;
      if (cx >= x && cx <= x + w && cy >= y && cy <= y + h) picked.push(icons[i]);
    }
    deskSelectIcons(picked);
  }

  function up() {
    document.removeEventListener("pointermove", move);
    document.removeEventListener("pointerup", up);
    marquee.classList.remove("on");
    marquee.style.width = "0px";
    marquee.style.height = "0px";
    deskMarquee = null;
  }

  deskMarquee = { sx: sx, sy: sy };
  document.addEventListener("pointermove", move);
  document.addEventListener("pointerup", up);
}

// ------------------------------------------------- menu de contexto
// O menu do XP nascia no ponto do clique, com moldura cinza e item
// marcado em azul no hover.
var openXpMenu = null;

function closeXpMenu() {
  if (openXpMenu) {
    if (openXpMenu.parentNode) openXpMenu.parentNode.removeChild(openXpMenu);
    openXpMenu = null;
  }
}

// items: [{ label, ico, action, disabled, separator, submenu }]
function showXpMenu(x, y, items) {
  closeXpMenu();
  var menu = document.createElement("div");
  menu.className = "xp-menu";
  menu.setAttribute("role", "menu");

  items.forEach(function(item) {
    if (item.separator) {
      var sep = document.createElement("div");
      sep.className = "xp-menu-sep";
      menu.appendChild(sep);
      return;
    }
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "xp-menu-item" + (item.disabled ? " disabled" : "");
    btn.setAttribute("role", "menuitem");
    if (item.disabled) btn.setAttribute("aria-disabled", "true");

    if (item.ico) {
      var ico = document.createElement("img");
      ico.className = "xp-menu-ico";
      ico.src = item.ico;
      ico.alt = "";
      btn.appendChild(ico);
    }

    var label = document.createElement("span");
    label.textContent = item.label;
    btn.appendChild(label);

    if (item.submenu) {
      var arrow = document.createElement("span");
      arrow.className = "xp-menu-arrow";
      arrow.textContent = "▶";
      btn.appendChild(arrow);
    }

    if (!item.disabled) {
      btn.addEventListener("click", function(e) {
        e.stopPropagation();
        if (item.submenu) return;
        closeXpMenu();
        if (item.action) item.action();
      });
    }
    menu.appendChild(btn);
  });

  xpContextLayer.appendChild(menu);

  // mantém o menu dentro da tela
  var mw = menu.offsetWidth;
  var mh = menu.offsetHeight;
  if (x + mw > window.innerWidth - 4) x = Math.max(4, window.innerWidth - mw - 4);
  if (y + mh > window.innerHeight - 38) y = Math.max(4, window.innerHeight - mh - 38);
  menu.style.left = x + "px";
  menu.style.top = y + "px";

  openXpMenu = menu;
  playClick("open");
  return menu;
}

// fecha o menu ao clicar fora
document.addEventListener("pointerdown", function(e) {
  if (openXpMenu && !e.target.closest(".xp-menu")) closeXpMenu();
}, true);

document.addEventListener("keydown", function(e) {
  if (e.key === "Escape") closeXpMenu();
});


// =====================================================================
//  GERENCIADOR DE JANELAS
//  Cada janela do desktop é independente: tem barra de título, pode
//  ser arrastada, redimensionada, minimizada, maximizada e fechada.
//  Fica no botão da barra de tarefas, como no XP.
// =====================================================================

var xpWindowSeq = 0;
var xpWindowZ = 30;
var xpOpenWindows = [];

function xpNextZ() {
  xpWindowZ += 1;
  return xpWindowZ;
}

// Ícones de arquivo usados na lista do explorer.
// Os "Folder", "Computer", "Network" e afins sao os icones verdadeiros
// do shell32.dll do Windows XP, extraidos como PNG.
var XP_ICONS = {
  folder: "img/xp/FolderOpen.png",
  folderClosed: "img/xp/Folder.png",
  file: "img/xp/Notepad.png",
  picture: "img/xp/Camera.png",
  music: "img/xp/Media.png",
  app: "img/xp/Wmp.png",
  computer: "img/xp/Computer.png",
  network: "img/xp/Network.png",
  drive: "img/xp/Drive.png",
  cd: "img/xp/CdRom.png"
};

function xpFileIconFor(name, type) {
  var n = String(name || "").toLowerCase();
  if (type === "folder") return XP_ICONS.folder;
  if (/\.(png|jpe?g|gif|bmp|webp)$/.test(n)) return XP_ICONS.picture;
  if (/\.(mp3|wav|flac|ogg|m4a)$/.test(n)) return XP_ICONS.music;
  if (/\.(exe|msi)$/.test(n)) return XP_ICONS.app;
  if (/\.(txt|doc|pdf|md|json)$/.test(n)) return XP_ICONS.file;
  return XP_ICONS.file;
}

// ------------------------------------------------- barra de tarefas
function xpTaskHost() {
  return document.getElementById("task-buttons") || document.getElementById("taskbar");
}

// A barra de tarefas usa os PNGs de 32px reduzidos a 16px: as versões
// de 16px extraídas do shell32 são de 4 bits e ficam lavadas.
function xpTaskIcon(src) {
  if (!src) return XP_ICONS.folder;
  var m = String(src).match(/^(.*?)\.png$/i);
  if (!m) return src;
  return m[1] + "-32.png";
}

function xpTaskButton(win) {
  return document.querySelector('.task-item[data-win="' + win.id + '"]');
}

function xpFocusWindow(win) {
  if (!win || !win.el) return;
  if (win.minimized) {
    xpRestoreWindow(win);
    return;
  }
  win.el.classList.add("open");
  win.el.style.zIndex = xpNextZ();
  var btns = document.querySelectorAll(".task-item[data-win]");
  for (var i = 0; i < btns.length; i++) btns[i].classList.remove("active");
  var btn = xpTaskButton(win);
  if (btn) btn.classList.add("active");
}

// ------------------------------------------------- criar janela
// spec: { id, title, icon, width, height, left, top, body(el), onClose }
function xpCreateWindow(spec) {
  var id = spec.id || ("win" + (++xpWindowSeq));

  // se já existe, só levanta
  var existing = document.getElementById(id);
  if (existing) {
    var found = xpOpenWindows.filter(function(w) { return w.id === id; })[0];
    if (found) {
      xpFocusWindow(found);
      return found;
    }
  }

  var el = document.createElement("section");
  el.className = spec.kind === "wmp" ? "xp-wmp" : "xp-explorer";
  el.id = id;
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-label", spec.title);

  // Sem barra de tarefas (shell suíço), minimizar/maximizar não têm
  // para onde ir: a janela ganha só o fechar.
  var hasTask = !!xpTaskHost();

  var w = spec.width || 520;
  var h = spec.height || 380;
  var left = spec.left != null ? spec.left : 120;
  var top = spec.top != null ? spec.top : 70;

  el.style.width = w + "px";
  el.style.height = h + "px";
  el.style.left = left + "px";
  el.style.top = top + "px";

  // barra de título
  var bar = document.createElement("div");
  bar.className = "win-bar xp-drag-handle";

  var icon = document.createElement("img");
  icon.className = "win-icon";
  icon.src = spec.icon || XP_ICONS.folder;
  icon.alt = "";
  bar.appendChild(icon);

  var title = document.createElement("span");
  title.className = "win-title";
  title.textContent = spec.title;
  bar.appendChild(title);

  var btns = document.createElement("div");
  btns.className = "win-btns";

  var bMin = document.createElement("button");
  bMin.type = "button";
  bMin.className = "win-btn win-min";
  bMin.setAttribute("aria-label", "minimizar");
  bMin.innerHTML = "<span></span>";

  var bMax = document.createElement("button");
  bMax.type = "button";
  bMax.className = "win-btn win-max";
  bMax.setAttribute("aria-label", "maximizar");
  bMax.innerHTML = "<span></span>";

  var bClose = document.createElement("button");
  bClose.type = "button";
  bClose.className = "win-btn win-close";
  bClose.setAttribute("aria-label", "fechar");
  bClose.innerHTML = "<span></span>";

  btns.appendChild(bClose);
  if (hasTask) {
    btns.insertBefore(bMin, bClose);
    btns.insertBefore(bMax, bClose);
  }
  bar.appendChild(btns);
  el.appendChild(bar);

  var win = {
    id: id,
    el: el,
    bar: bar,
    title: title,
    minimized: false,
    maximized: false,
    spec: spec
  };
  xpOpenWindows.push(win);

  // corpo
  var body = document.createElement("div");
  body.className = spec.kind === "wmp" ? "xp-wmp-body" : "xp-explorer-body";
  el.appendChild(body);
  win.body = body;
  if (spec.build) spec.build(win, body);

  // alça de redimensionamento
  var grip = document.createElement("div");
  grip.className = "xp-resize";
  el.appendChild(grip);
  xpMakeResizable(win, grip);

  xpWindowsEl.appendChild(el);

  // botão na barra de tarefas
  var taskHost = xpTaskHost();
  if (taskHost) {
  var taskBtn = document.createElement("button");
  taskBtn.type = "button";
  taskBtn.className = "task-item";
  taskBtn.dataset.win = id;
  taskBtn.setAttribute("aria-label", spec.title);
  taskBtn.title = spec.title;
  var tIcon = document.createElement("span");
  tIcon.className = "task-icon";
  tIcon.setAttribute("aria-hidden", "true");
  var tImg = document.createElement("img");
  tImg.src = xpTaskIcon(spec.icon);
  tImg.alt = "";
  tIcon.appendChild(tImg);
  taskBtn.appendChild(tIcon);
  var tLabel = document.createElement("span");
  tLabel.className = "task-label";
  tLabel.textContent = spec.title;
  taskBtn.appendChild(tLabel);
  taskHost.appendChild(taskBtn);

  taskBtn.addEventListener("click", function() {
    if (win.minimized) {
      xpFocusWindow(win);
    } else if (win.el.style.zIndex == xpWindowZ) {
      xpMinimizeWindow(win);
    } else {
      xpFocusWindow(win);
    }
  });

  // menu de contexto do botão na barra de tarefas
  taskBtn.addEventListener("contextmenu", function(e) {
    e.preventDefault();
    e.stopPropagation();
    showXpMenu(e.clientX, e.clientY, [
      { label: "Restaurar", disabled: !win.minimized, action: function() { xpFocusWindow(win); } },
      { label: "Minimizar", action: function() { xpMinimizeWindow(win); } },
      { label: "Maximizar", disabled: win.maximized, action: function() { xpToggleMaximize(win); } },
      { separator: true },
      { label: "Fechar", action: function() { xpCloseWindow(win); } }
    ]);
  });
  }

  // botões da barra de título
  bMin.addEventListener("click", function(e) {
    e.stopPropagation();
    xpMinimizeWindow(win);
  });
  bMax.addEventListener("click", function(e) {
    e.stopPropagation();
    xpToggleMaximize(win);
  });
  bClose.addEventListener("click", function(e) {
    e.stopPropagation();
    xpCloseWindow(win);
  });

  // arrastar pela barra de título
  xpMakeDraggable(win, bar);

  // duplo clique no título maximiza, como no XP
  if (hasTask) bar.addEventListener("dblclick", function(e) {
    if (e.target.closest(".win-btn")) return;
    xpToggleMaximize(win);
  });

  // menu de contexto na barra de título
  bar.addEventListener("contextmenu", function(e) {
    e.preventDefault();
    if (!hasTask) {
      showXpMenu(e.clientX, e.clientY, [
        { label: "Fechar", action: function() { xpCloseWindow(win); } }
      ]);
      return;
    }
    showXpMenu(e.clientX, e.clientY, [
      { label: "Restaurar", disabled: !win.maximized, action: function() { xpToggleMaximize(win); } },
      { label: "Mover", disabled: true },
      { label: "Tamanho", disabled: true },
      { label: "Minimizar", action: function() { xpMinimizeWindow(win); } },
      { label: "Maximizar", disabled: win.maximized, action: function() { xpToggleMaximize(win); } },
      { separator: true },
      { label: "Fechar", action: function() { xpCloseWindow(win); } }
    ]);
  });

  // menu de contexto no corpo
  body.addEventListener("contextmenu", function(e) {
    e.preventDefault();
    if (spec.contextMenu) spec.contextMenu(e, win);
    else {
      showXpMenu(e.clientX, e.clientY, [
        { label: "Atualizar", action: function() { if (spec.onRefresh) spec.onRefresh(); } },
        { separator: true },
        { label: "Propriedades", disabled: true }
      ]);
    }
  });

  el.addEventListener("pointerdown", function() { xpFocusWindow(win); }, true);

  xpFocusWindow(win);
  return win;
}

// ------------------------------------------------- arrastar janela
// O arrasto vive no document, nao na barra: se o ponteiro sai da barra
// enquanto o botao esta apertado, a janela continua andando. E o
// cursor vira a "mover" durante o arrasto, como no XP.
function xpMakeDraggable(win, handle) {
  var dragging = false;
  var moved = false;
  var startX = 0, startY = 0, origLeft = 0, origTop = 0;
  var pointerId = null;

  function place(e) {
    var dx = e.clientX - startX;
    var dy = e.clientY - startY;
    var maxX = window.innerWidth - 60;
    var maxY = window.innerHeight - 46;
    var left = Math.max(-win.el.offsetWidth + 90, Math.min(maxX, origLeft + dx));
    var top = Math.max(0, Math.min(maxY, origTop + dy));
    win.el.style.left = Math.round(left) + "px";
    win.el.style.top = Math.round(top) + "px";
  }

  function onMove(e) {
    if (!dragging) return;
    if (e.pointerId != null && pointerId != null && e.pointerId !== pointerId) return;
    if (!moved) {
      // so conta como arrasto depois de uns poucos pixels
      if (Math.abs(e.clientX - startX) < 3 && Math.abs(e.clientY - startY) < 3) return;
      moved = true;
      win.el.classList.add("dragging");
      document.body.classList.add("xp-dragging");
    }
    e.preventDefault();
    place(e);
  }

  function end(e) {
    if (!dragging) return;
    if (e && pointerId != null && e.pointerId !== undefined && e.pointerId !== pointerId) return;
    dragging = false;
    pointerId = null;
    document.removeEventListener("pointermove", onMove, true);
    document.removeEventListener("pointerup", end, true);
    document.removeEventListener("pointercancel", end, true);
    win.el.classList.remove("dragging");
    document.body.classList.remove("xp-dragging");
  }

  handle.addEventListener("pointerdown", function(e) {
    if (e.button !== 0) return;
    if (e.target.closest(".win-btn")) return;
    if (win.maximized) return;
    dragging = true;
    moved = false;
    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    origLeft = win.el.offsetLeft;
    origTop = win.el.offsetTop;
    document.addEventListener("pointermove", onMove, true);
    document.addEventListener("pointerup", end, true);
    document.addEventListener("pointercancel", end, true);
    e.preventDefault();
  });
}

// ------------------------------------------------- redimensionar janela
// Mesmo principle do arrasto: os ouvintes ficam no document e saem
// quando o botao solta, entao a janela nunca "trava" no tamanho.
function xpMakeResizable(win, grip) {
  var resizing = false;
  var startX = 0, startY = 0, origW = 0, origH = 0;

  function onMove(e) {
    if (!resizing) return;
    e.preventDefault();
    var w = Math.max(320, origW + (e.clientX - startX));
    var h = Math.max(220, origH + (e.clientY - startY));
    win.el.style.width = Math.round(w) + "px";
    win.el.style.height = Math.round(h) + "px";
    if (win.onResize) win.onResize();
  }

  function end() {
    if (!resizing) return;
    resizing = false;
    document.removeEventListener("pointermove", onMove, true);
    document.removeEventListener("pointerup", end, true);
    document.removeEventListener("pointercancel", end, true);
    win.el.classList.remove("resizing");
    document.body.classList.remove("xp-resizing");
    if (win.onResize) win.onResize();
  }

  grip.addEventListener("pointerdown", function(e) {
    if (e.button !== 0) return;
    if (win.maximized) return;
    resizing = true;
    startX = e.clientX;
    startY = e.clientY;
    origW = win.el.offsetWidth;
    origH = win.el.offsetHeight;
    win.el.classList.add("resizing");
    document.body.classList.add("xp-resizing");
    document.addEventListener("pointermove", onMove, true);
    document.addEventListener("pointerup", end, true);
    document.addEventListener("pointercancel", end, true);
    e.preventDefault();
    e.stopPropagation();
  });
}

// ------------------------------------------------- estados da janela
function xpMinimizeWindow(win) {
  if (!win || win.minimized) return;
  win.minimized = true;
  win.el.classList.add("minimized");
  win.el.classList.remove("open");
  var btn = xpTaskButton(win);
  if (btn) btn.classList.remove("active");
  xpPlay("minimize", 0.45);
}

function xpRestoreWindow(win) {
  if (!win) return;
  win.minimized = false;
  win.el.classList.remove("minimized");
  win.el.classList.add("open");
  xpFocusWindow(win);
  xpPlay("restore", 0.4);
}

function xpToggleMaximize(win) {
  if (!win) return;
  win.maximized = !win.maximized;
  win.el.classList.toggle("maximized", win.maximized);
  var bMax = win.el.querySelector(".win-max");
  if (bMax) bMax.setAttribute("aria-label", win.maximized ? "restaurar" : "maximizar");
  xpPlay(win.maximized ? "minimize" : "restore", 0.4);
  if (win.onResize) setTimeout(win.onResize, 40);
}

function xpCloseWindow(win) {
  if (!win) return;
  if (win.spec.onClose) win.spec.onClose(win);
  win.el.classList.remove("open");
  var idx = xpOpenWindows.indexOf(win);
  if (idx >= 0) xpOpenWindows.splice(idx, 1);
  var btn = xpTaskButton(win);
  if (btn && btn.parentNode) btn.parentNode.removeChild(btn);
  setTimeout(function() {
    if (win.el.parentNode) win.el.parentNode.removeChild(win.el);
  }, 160);
  xpPlay("minimize", 0.45);
}


// =====================================================================
//  EXPLORER
//  Janela do Windows XP: barra de ferramentas, endereço, árvore de
//  pastas na esquerda e lista de arquivos na direita.
// =====================================================================

var XP_TOOLBAR_ICONS = {
  back: "M8 3 L2 8 L8 13 M2 8 H14",
  fwd: "M8 3 L14 8 L8 13 M14 8 H2",
  up: "M8 13 V3 M3 8 L8 3 L13 8",
  search: "M7 2a5 5 0 1 1 0 10A5 5 0 0 1 7 2zM11 11l4 4"
};

function xpToolbarIcon(name) {
  var ns = "http://www.w3.org/2000/svg";
  var svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 16 16");
  svg.setAttribute("aria-hidden", "true");
  var path = document.createElementNS(ns, "path");
  path.setAttribute("d", XP_TOOLBAR_ICONS[name] || "");
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-width", "1.6");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  svg.appendChild(path);
  return svg;
}

// Monta a janela do explorer e devolve o objeto de navegação.
function xpOpenExplorer(spec) {
  var win = xpCreateWindow({
    id: spec.id,
    kind: "explorer",
    title: spec.title,
    icon: spec.icon || XP_ICONS.folder,
    width: spec.width || 560,
    height: spec.height || 380,
    left: spec.left,
    top: spec.top,
    contextMenu: spec.contextMenu,
    onClose: spec.onClose,
    onRefresh: spec.onRefresh,
    tree: spec.tree,
    build: function(win, body) {
      // barra de ferramentas
      var toolbar = document.createElement("div");
      toolbar.className = "xp-explorer-toolbar";

      var bBack = document.createElement("button");
      bBack.type = "button";
      bBack.className = "xp-tbtn";
      bBack.setAttribute("aria-label", "voltar");
      bBack.appendChild(xpToolbarIcon("back"));

      var bFwd = document.createElement("button");
      bFwd.type = "button";
      bFwd.className = "xp-tbtn";
      bFwd.setAttribute("aria-label", "avançar");
      bFwd.appendChild(xpToolbarIcon("fwd"));

      var bUp = document.createElement("button");
      bUp.type = "button";
      bUp.className = "xp-tbtn";
      bUp.setAttribute("aria-label", "pasta acima");
      bUp.appendChild(xpToolbarIcon("up"));

      var search = document.createElement("input");
      search.type = "text";
      search.className = "xp-explorer-search";
      search.placeholder = "pesquisar";
      search.setAttribute("aria-label", "pesquisar");

      toolbar.appendChild(bBack);
      toolbar.appendChild(bFwd);
      toolbar.appendChild(bUp);
      toolbar.appendChild(search);
      body.appendChild(toolbar);

      // endereço
      var address = document.createElement("div");
      address.className = "xp-explorer-address";
      var addrLabel = document.createElement("label");
      addrLabel.textContent = "Endereço";
      var addrInput = document.createElement("input");
      addrInput.type = "text";
      addrInput.readOnly = true;
      addrInput.value = spec.address || spec.title;
      address.appendChild(addrLabel);
      address.appendChild(addrInput);
      body.appendChild(address);

      // corpo: árvore + lista
      var content = document.createElement("div");
      content.className = "xp-explorer-content";

      var treeBox = document.createElement("div");
      treeBox.className = "xp-explorer-tree";

      var treeHead = document.createElement("div");
      treeHead.className = "xp-tree-head";
      var treeTitle = document.createElement("span");
      treeTitle.className = "xp-tree-title";
      treeTitle.textContent = "Pastas";
      var treeClose = document.createElement("button");
      treeClose.type = "button";
      treeClose.className = "xp-tree-close";
      treeClose.textContent = "\u00d7";
      treeClose.setAttribute("aria-label", "fechar pastas");
      treeClose.addEventListener("click", function() {
        treeBox.style.display = treeBox.style.display === "none" ? "" : "none";
      });
      treeHead.appendChild(treeTitle);
      treeHead.appendChild(treeClose);
      treeBox.appendChild(treeHead);

      var treeScroll = document.createElement("div");
      treeScroll.className = "xp-tree-scroll";
      treeBox.appendChild(treeScroll);

      var listBox = document.createElement("div");
      listBox.className = "xp-explorer-list";

      var listHead = document.createElement("div");
      listHead.className = "xp-list-head";
      ["Nome", "Tamanho", "Data de modificação", "Tipo"].forEach(function(t, i) {
        var s = document.createElement("span");
        s.textContent = t;
        s.className = "xp-col-" + ["name", "size", "date", "type"][i];
        listHead.appendChild(s);
      });

      var listScroll = document.createElement("div");
      listScroll.className = "xp-list-scroll";

      listBox.appendChild(listHead);
      listBox.appendChild(listScroll);
      content.appendChild(treeBox);
      content.appendChild(listBox);
      body.appendChild(content);

      win.nav = {
        history: [],
        index: -1,
        treeBox: treeScroll,
        treeContainer: treeBox,
        listScroll: listScroll,
        addrInput: addrInput,
        search: search,
        bBack: bBack,
        bFwd: bFwd,
        bUp: bUp,
        current: null
      };

      // busca no XP filtra a lista
      search.addEventListener("input", function() {
        win.renderList(win.nav.current, search.value.trim().toLowerCase());
      });

      bBack.addEventListener("click", function() {
        playClick("close");
        xpNavBack(win);
      });
      bFwd.addEventListener("click", function() {
        playClick("open");
        xpNavFwd(win);
      });
      bUp.addEventListener("click", function() { xpNavUp(win); });
    }
  });

  // navegação
  win.navigate = function(node, label, pathLabel) {
    win.nav.current = node;
    win.nav.addrInput.value = pathLabel || label || "";
    win.title.textContent = label || win.spec.title;
    win.renderList(node, "");
    win.renderTree();
    xpPlay("open", 0.3);
  };

  // lista de arquivos
  win.renderList = function(node, filter) {
    var box = win.nav.listScroll;
    box.innerHTML = "";
    // a raiz da árvore mostra as pastas filhas; as demais mostram entries
    var entries = [];
    if (node) {
      if (node.entries) entries = node.entries;
      else if (node.children) {
        entries = node.children.map(function(ch) {
          return {
            name: ch.label,
            type: "folder",
            node: ch.node,
            typeName: "Pasta de arquivos"
          };
        });
      }
    }

    var shown = entries.filter(function(e) {
      if (!filter) return true;
      return String(e.name || "").toLowerCase().indexOf(filter) >= 0;
    });

    if (!shown.length) {
      var empty = document.createElement("div");
      empty.className = "xp-wmp-empty";
      empty.style.color = "#555";
      empty.textContent = filter ? "nenhum item corresponde a " + filter : "esta pasta está vazia";
      box.appendChild(empty);
      return;
    }

    shown.forEach(function(entry) {
      var row = document.createElement("button");
      row.type = "button";
      row.className = "xp-file";

      var ico = document.createElement("img");
      ico.src = entry.icon || xpFileIconFor(entry.name, entry.type);
      ico.alt = "";
      row.appendChild(ico);

      var name = document.createElement("span");
      name.className = "xp-file-name";
      name.textContent = entry.name;
      row.appendChild(name);

      var size = document.createElement("span");
      size.className = "xp-col-size";
      size.textContent = entry.size || "";
      row.appendChild(size);

      var date = document.createElement("span");
      date.className = "xp-col-date";
      date.textContent = entry.date || "";
      row.appendChild(date);

      var type = document.createElement("span");
      type.className = "xp-col-type";
      type.textContent = entry.typeName || (entry.type === "folder" ? "Pasta de arquivos" : "Arquivo");
      row.appendChild(type);

      // clique simples so seleciona, sem estalo
      row.addEventListener("click", function() {
        var siblings = win.nav.listScroll.querySelectorAll(".xp-file");
        for (var i = 0; i < siblings.length; i++) siblings[i].classList.remove("selected");
        row.classList.add("selected");
      });

      // duplo clique abre a pasta ou o item
      row.addEventListener("dblclick", function() {
        playClick("dblclick");
        if (entry.type === "folder" && entry.node) {
          var handled = false;
          if (win.onFolderOpen) handled = win.onFolderOpen(entry);
          if (!handled) {
            win.navigate(entry.node, entry.name, (win.nav.addrInput.value ? win.nav.addrInput.value + "\\" : "") + entry.name);
          }
        } else if (win.onEntryOpen) {
          win.onEntryOpen(entry);
        } else if (entry.onOpen) {
          entry.onOpen(entry);
        }
      });

      row.addEventListener("contextmenu", function(e) {
        e.preventDefault();
        e.stopPropagation();
        row.classList.add("selected");
        if (win.spec.fileMenu) win.spec.fileMenu(e, entry, win);
        else {
          showXpMenu(e.clientX, e.clientY, [
            { label: "Abrir", action: function() { if (entry.onOpen) entry.onOpen(entry); } },
            { separator: true },
            { label: "Propriedades", disabled: true }
          ]);
        }
      });

      box.appendChild(row);
    });
  };

  // árvore de pastas na lateral
  // A raiz é sempre a própria janela; abaixo dela, as pastas que a
  // janela oferece. É a estrutura do "Meu Computador" do XP.
  win.renderTree = function() {
    var box = win.nav.treeBox;
    box.innerHTML = "";
    var root = win.spec.tree;
    if (!root) return;

    var rootRow = document.createElement("button");
    rootRow.type = "button";
    rootRow.className = "xp-tree-node active";
    var rootArrow = document.createElement("span");
    rootArrow.className = "xp-tree-arrow";
    rootArrow.textContent = "▼";
    rootRow.appendChild(rootArrow);
    var rootIcon = document.createElement("img");
    rootIcon.src = root.icon || win.spec.icon || XP_ICONS.folderClosed;
    rootIcon.alt = "";
    rootRow.appendChild(rootIcon);
    var rootText = document.createElement("span");
    rootText.textContent = root.label || win.spec.title;
    rootRow.appendChild(rootText);
    rootRow.addEventListener("click", function() {
      win.navigate(root, root.label || win.spec.title, root.label || win.spec.title);
    });
    box.appendChild(rootRow);

    (root.children || []).forEach(function(ch) {
      var row = document.createElement("button");
      row.type = "button";
      row.className = "xp-tree-node";
      row.style.paddingLeft = "15px";

      var arrow = document.createElement("span");
      arrow.className = "xp-tree-arrow";
      row.appendChild(arrow);

      var ico = document.createElement("img");
      ico.src = ch.icon || XP_ICONS.folderClosed;
      ico.alt = "";
      row.appendChild(ico);

      var txt = document.createElement("span");
      txt.textContent = ch.label;
      row.appendChild(txt);

      if (win.nav.current === ch.node) row.classList.add("active");

      row.addEventListener("click", function() {
        win.navigate(ch.node, ch.label, (root.label || win.spec.title) + "\\" + ch.label);
      });

      box.appendChild(row);
    });
  };

  // voltar e avançar
  win.go = function(node, label) {
    win.nav.history = win.nav.history.slice(0, win.nav.index + 1);
    win.nav.history.push({ node: node, label: label });
    win.nav.index = win.nav.history.length - 1;
    win.navigate(node, label);
  };

  win.spec = win.spec;
  win.onRefresh = spec.onRefresh;
  return win;
}

function xpNavBack(win) {
  if (win.nav.index <= 0) return;
  win.nav.index--;
  var h = win.nav.history[win.nav.index];
  win.navigate(h.node, h.label);
}

function xpNavFwd(win) {
  if (win.nav.index >= win.nav.history.length - 1) return;
  win.nav.index++;
  var h = win.nav.history[win.nav.index];
  win.navigate(h.node, h.label);
}

function xpNavUp(win) {
  if (win.spec.up) win.spec.up(win);
}


