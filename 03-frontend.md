# Frontend - GitHub Pages (matesu.me)

## 1. Nova página: discography
Insere `<section class="page" id="page-discography">` após `page-services`.
Array de páginas: `['page-blog', 'page-portfolio', 'page-services', 'page-discography']`

```html
<section class="page" id="page-discography">
  <div class="page-inner">
    <header class="masthead">
      <h1>discografia</h1>
      <div class="masthead-right">
        <span class="masthead-line">catalogo completo</span>
        <span class="masthead-small">matesu</span>
      </div>
    </header>
    <div class="rule"></div>
    <div class="section">
      <h2>library</h2>
      <div class="section-note">todas as faixas e releases</div>
    </div>
    <div id="discography-root"></div>
  </div>
</section>
```

## 2. Render
- fetch `/discography.json`
- Card grid: capa (100px), tipo, nome, valor, botão "adquirir"
- Tracklist expandida ao clicar
- Player minimalista: html5 audio

## 3. Player
```html
<div class="disco-player">
  <button class="disco-playbtn">▶</button>
  <input type="range" class="disco-seek" value="0" min="0" max="1" style="flex:1;height:2px">
  <span class="disco-time">00:00 / 03:45</span>
</div>
```
Estilo: Swiss (Helvetica 9px, cor `#1e1e1c`).

## 4. Checkout Mercado Pago
- Botão "adquirir" → fetch POST `/api/create-preference`
- Redirect para Mercado Pago Checkout Pro
- Após pagamento, MP redireciona para `?purchase=success&release=xxx`
- JS exibe player completo + link de download

## 5. CSS
```css
.disco-grid { display:flex; flex-flow:wrap; gap:15px }
.disco-card { width:calc(33.333% - 10px); background:#847e72; padding:10px }
.disco-card img { width:100%; aspect-ratio:1; object-fit:cover }
.disco-buy { display:inline-block; border:1px solid #1e1e1c; font:700 9px Helvetica; color:#1e1e1c; padding:4px 12px; margin-top:6px; cursor:pointer }
.disco-buy:hover { color:#b03030; border-color:#b03030 }
.disco-cat { font:700 8px Helvetica; color:#5e5a50 }
.disco-title { font:700 11px Helvetica; color:#1e1e1c }
.disco-artist { font:11px Times; color:#1e1e1c; opacity:0.7 }
.disco-player { display:flex; align-items:center; gap:8px; font:9px Helvetica }
.disco-player input[type="range"] { flex:1; height:2px; -webkit-appearance:none; background:#1e1e1c }
@media(max-width:767px) { .disco-card{ width:100% } }
```