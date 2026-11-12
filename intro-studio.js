// Intro BY LUX Studio : 5 s plein écran à chaque lancement de l'appli (modèle commun : C:\dev\_commun\intro-studio).
// Ne bloque JAMAIS le jeu : fichier absent ou illisible → l'écran noir disparaît seul.
// Toucher l'écran après 1,2 s passe l'intro. Pas de dépendance, pas de réglage dans le jeu de l'auteur.
//
// 02/11 (retour de Tedy sur Moka & Minou) : un <video> avec son affichait le lecteur du système Android
// (pop-up « vidéo qui démarre », notification média, icône de lecture grise).
// 03/11 (Android Vitals de Dragonnet) : 2 des 6 plantages viennent du décodeur vidéo matériel de Samsung
// (libcodec2 / CCodec). Une vidéo à CHAQUE lancement en ajouterait. Donc plus de <video> du tout :
//   - l'image est un WebP animé (intro-by-lux.webp, lu une seule fois) décodé en logiciel par le WebView ;
//   - le son est un MP3 joué par Web Audio (intro-by-lux.mp3) : rien n'est affiché au système.
(function () {
  if (window.__introStudio) return;
  // 9/11 (rétention, QCM de Tedy) : pas d'intro au TOUT PREMIER lancement (ni intro déjà vue, ni partie sauvegardée) : le joueur arrive plus vite au jeu.
  try { var vu = localStorage.getItem('bylux.intro.vu'); localStorage.setItem('bylux.intro.vu', '1'); if (!vu && !localStorage.getItem('dragonnet.save.v1')) return; } catch (e) {}
  window.__introStudio = true;
  var d = document, fini = false, t0 = Date.now(), ctx = null, src = null, DUREE = 5000;

  var box = d.createElement('div');
  box.id = 'intro-studio';
  box.setAttribute('aria-hidden', 'true');
  box.style.cssText = 'position:fixed;left:0;top:0;right:0;bottom:0;z-index:2147483647;background:#000;opacity:1;transition:opacity .25s;touch-action:manipulation';
  d.documentElement.appendChild(box);

  // promesses audio rattrapées : un contexte fermé les fait échouer (« AudioContext is closed »)
  function sansErreur(pr) { if (pr && pr.catch) pr.catch(function () {}); }
  function fin() {
    if (fini) return;
    fini = true;
    try { if (src) src.stop(); } catch (e) {}
    try { if (ctx && ctx.close) sansErreur(ctx.close()); } catch (e) {}
    box.style.opacity = '0';
    box.style.pointerEvents = 'none';
    setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); }, 300);
  }
  box.addEventListener('click', function () { if (Date.now() - t0 > 1200) fin(); });
  d.addEventListener('visibilitychange', function () { if (d.hidden) fin(); });
  setTimeout(fin, 7500); // filet de sécurité : jamais plus de 7,5 s

  // Son : décodé pendant que l'image charge, lancé quand l'image apparaît. Sans son (contexte refusé, fichier absent) : intro muette.
  var tampon = null, voulu = false;
  function lanceSon() {
    if (fini || !tampon || !ctx || src) return;
    try {
      if (ctx.state === 'suspended' && ctx.resume) sansErreur(ctx.resume());
      src = ctx.createBufferSource();
      src.buffer = tampon;
      src.connect(ctx.destination);
      src.start(0);
    } catch (e) { src = null; }
  }
  try {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (AC) {
      ctx = new AC();
      fetch('intro-by-lux.mp3').then(function (r) { return r.arrayBuffer(); }).then(function (ab) {
        // la promesse renvoyée par decodeAudioData est rattrapée : si l'intro est passée avant la fin du décodage,
        // le contexte est fermé et elle échouerait sans être rattrapée (erreur « AudioContext is closed »)
        return new Promise(function (ok, ko) { var pr = ctx.decodeAudioData(ab, ok, ko); if (pr && pr.catch) pr.catch(function () {}); });
      }).then(function (b) { tampon = b; if (voulu) lanceSon(); }).catch(function () {});
    }
  } catch (e) { ctx = null; }
  // Toucher l'écran réveille un contexte audio resté suspendu (politique d'autolecture du WebView)
  box.addEventListener('touchstart', function () { if (ctx && ctx.state === 'suspended' && ctx.resume) try { sansErreur(ctx.resume()); } catch (e) {} }, { passive: true });

  // L'image est chargée hors de la page (une image animée hors de la page ne tourne pas), puis posée :
  // l'animation part de sa première image à ce moment-là, en même temps que le son.
  var pre = new Image();
  pre.onerror = fin;
  pre.onload = function () {
    if (fini) return;
    var img = d.createElement('img');
    img.alt = '';
    img.draggable = false;
    img.style.cssText = 'width:100%;height:100%;object-fit:contain;display:block;pointer-events:none;user-select:none;-webkit-user-select:none';
    img.onerror = fin;
    img.src = pre.src;
    box.appendChild(img);
    voulu = true;
    lanceSon();
    setTimeout(fin, DUREE);
  };
  pre.src = 'intro-by-lux.webp';
})();
