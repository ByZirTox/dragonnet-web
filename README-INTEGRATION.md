# Intégration des pages de contenu dans la génération du site

Ce dépôt (`dragonnet-web`) est **généré** par `npm run site` dans `C:\dev\dragonnet` (`scripts/build-site.mjs`).
La branche `contenu-adsense` ajoute à la main :

- le dossier `guides/` (hub + 15 guides), `a-propos/`, `contact/`, `confidentialite/`, `mentions-legales/` ;
- `assets/site.css`, `robots.txt`, `sitemap.xml` ;
- un **bandeau de liens visible** (Guides · À propos · Contact · Confidentialité) injecté dans `index.html`.

Sans changement du script, la prochaine génération écraserait `index.html` (le bandeau disparaît) et, selon la façon
dont `site/` est recopié ici, pourrait aussi effacer les dossiers de pages. Voici EXACTEMENT quoi faire (testé :
voir « Vérification » en bas).

## Étape 1 : mettre les pages dans le dépôt du jeu

Copier ces éléments de `C:\dev\dragonnet-web` vers un nouveau dossier **versionné** `C:\dev\dragonnet\site-pages\` :

```
guides/  a-propos/  contact/  confidentialite/  mentions-legales/  assets/  robots.txt  sitemap.xml
```

(Ne PAS y mettre `index.html`, `ads.txt`, `app-ads.txt`, `CNAME`, `version.json`, `manifest.webmanifest`, les PNG : le script
les génère déjà.) `site/` est gitignoré dans ce dépôt ; `site-pages/` ne l'est pas.

## Étape 2 : trois modifications dans `scripts/build-site.mjs`

**2a. Ligne d'import** (ajouter `cpSync`) :

```js
import { copyFileSync, cpSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
```

**2b. Remplacer** ces deux lignes (juste avant `mkdirSync('site', ...)`) :

```js
if (!html.includes('</head>')) throw new Error('</head> introuvable');
html = html.replace('</head>', head.join('\n') + '\n</head>');
```

**par** :

```js
// Liens d'information du site (guides, à propos, contact, confidentialité) : bandeau VISIBLE sous le menu du jeu,
// masqué pendant une partie et dans le Monde. Les pages vivent dans site-pages/ (copiées telles quelles dans site/ plus bas).
head.push(`<style id="site-links-css">
/* Liens d'information du site (guides, à propos, contact, confidentialité) : visibles sous le menu, jamais pendant une partie */
.site-links{position:fixed;left:0;right:0;bottom:0;z-index:12;display:flex;justify-content:center;flex-wrap:nowrap;height:20px;padding:0 4px;font:600 12px/20px var(--font-ui,system-ui,sans-serif);pointer-events:none}
.site-links a{pointer-events:auto;color:var(--moon-soft,rgba(246,235,196,.78));text-decoration:none;padding:0 9px;white-space:nowrap}
.site-links a+a{border-left:1px solid rgba(246,235,196,.28)}
.site-links a:hover{color:var(--coin,#FFC53D);text-decoration:underline}
body:has(#hud:not(.hidden)) .site-links,body.w-on .site-links{display:none}
</style>`);
const siteLinksNav = `<nav class="site-links" aria-label="Informations sur le site"><a href="/guides/">Guides</a><a href="/a-propos/">À propos</a><a href="/contact/">Contact</a><a href="/confidentialite/">Confidentialité</a></nav>`;
if (!html.includes('</head>') || !html.includes('<body>')) throw new Error('</head> ou <body> introuvable');
html = html.replace('</head>', head.join('\n') + '\n</head>').replace('<body>', '<body>\n' + siteLinksNav);
```

**2c. Ajouter** juste après `writeFileSync('site/index.html', html);` :

```js
// pages d'information : guides/, a-propos/, contact/, confidentialite/, mentions-legales/, assets/, robots.txt, sitemap.xml
if (existsSync('site-pages')) cpSync('site-pages', 'site', { recursive: true });
```

## Étape 3 : recopie de `site/` vers ce dépôt

La recopie doit **ajouter/écraser** sans supprimer : si elle vide d'abord le dépôt (ex. `robocopy /MIR`), les dossiers
de pages seraient perdus. Avec `cpSync(... 'site')` à l'étape 2c, `site/` contient déjà TOUT (jeu + pages), donc une
recopie complète de `site/` fonctionne aussi dans le cas « miroir ».

## Ce que fait le bandeau (pour mémoire)

- `position:fixed` en bas, 20 px de haut, **dans la marge vide sous les onglets du menu** : le jeu n'est ni décalé ni rogné
  (vérifié en 412×915 : canvas 0,0 → 412×915, onglets terminent à 895 px, bandeau de 895 à 915 px).
- Masqué pendant une partie (`#hud` visible) et dans le Monde / Rush Dragon (`body.w-on`) ; recouvert naturellement par les
  fenêtres (z-index 12 < 30).
- Aucun contenu caché : ce sont de vrais liens, visibles sur l'écran d'accueil.

## Pubs

- `ads.txt` et `app-ads.txt` : inchangés.
- Chaque page de contenu charge le même `<script async src=".../adsbygoogle.js?client=ca-pub-2218100797445149" ...>` que
  `index.html` (balise de vérification). **Aucun bloc d'annonce `<ins class="adsbygoogle">`** n'est posé : à ajouter après
  l'approbation, jamais sur `/`.

## À savoir pour la suite

- Les pages sont du HTML statique : on les modifie directement dans `site-pages/` (puis on régénère le site).
- Le contenu est écrit pour la **version 1.4.3**. À chaque mise à jour du jeu (prix, durées, événements), relire les guides
  concernés et la date « Mis à jour le … » affichée en haut de chaque guide. Halloween (27 oct. → 2 nov. 2026) et le pass
  « Saison 1 » (1er oct. → 1er déc. 2026) sont datés : à retoucher ou retirer après leur fin.
- Bug connu hors périmètre : `rush/rush-dragon.html` (embarqué dans `index.html`) garde un coffre royal payant 150 gemmes avec
  30 % de chances de dragon (`SHOP.royalOdds`) : incohérent avec « sans hasard payant » de la 1.4.3. Les guides précisent que
  la règle vaut pour le jeu principal et que Rush Dragon a ses propres coffres.

## Vérification (faite)

Le patch a été appliqué sur une copie de `build-site.mjs` (depuis `main`) avec un `www/index.html` simulé et `site-pages/` :
`site/index.html` contient le bandeau (CSS et `<nav>` identiques à ceux de ce dépôt, juste après `<body>`), `site/` contient
`guides/`, `a-propos/`, etc., et `ads.txt` est toujours généré.
