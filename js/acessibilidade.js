/* Barra de acessibilidade: alto contraste, tamanho da fonte, atalhos de teclado e VLibras */
(function () {
  'use strict';
  var NIVEIS = [87.5, 100, 125, 150, 175, 200];
  var nivel = 1;
  var raiz = document.documentElement;
  var corpo = document.body;
  var alternarLeitura = null;

  function ler(chave) { try { return window.localStorage.getItem(chave); } catch (e) { return null; } }
  function gravar(chave, valor) { try { window.localStorage.setItem(chave, valor); } catch (e) { /* sem armazenamento */ } }

  function avisar(texto) {
    var area = document.getElementById('aviso');
    if (!area) { return; }
    area.textContent = '';
    window.setTimeout(function () { area.textContent = texto; }, 60);
  }

  function aplicarFonte(anunciar) {
    raiz.style.fontSize = NIVEIS[nivel] + '%';
    gravar('fonte', String(nivel));
    if (anunciar) { avisar('Tamanho da fonte: ' + NIVEIS[nivel] + '%.'); }
  }
  function aumentar() { if (nivel < NIVEIS.length - 1) { nivel++; } aplicarFonte(true); }
  function diminuir() { if (nivel > 0) { nivel--; } aplicarFonte(true); }
  function restaurar() { nivel = 1; aplicarFonte(true); }

  function aplicarContraste(ligado, anunciar) {
    corpo.classList.toggle('alto-contraste', ligado);
    var botao = document.getElementById('btn-contraste');
    if (botao) { botao.setAttribute('aria-pressed', ligado ? 'true' : 'false'); }
    gravar('contraste', ligado ? '1' : '0');
    if (anunciar) { avisar('Alto contraste ' + (ligado ? 'ativado.' : 'desativado.')); }
  }
  function alternarContraste() { aplicarContraste(!corpo.classList.contains('alto-contraste'), true); }

  function irPara(id) {
    var alvo = document.getElementById(id);
    if (alvo) { alvo.focus(); alvo.scrollIntoView(); }
  }
  function irParaMenu() {
    var link = document.querySelector('#menu a');
    if (link) { link.focus(); }
  }

  function iniciarBotoes() {
    var mapa = { 'btn-contraste': alternarContraste, 'btn-aumentar': aumentar, 'btn-diminuir': diminuir, 'btn-restaurar': restaurar };
    Object.keys(mapa).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) { el.addEventListener('click', mapa[id]); }
    });
  }

  /* Atalhos: Alt + número (no Firefox, Alt + Shift + número; no Mac, Option + número) */
  function iniciarAtalhos() {
    document.addEventListener('keydown', function (e) {
      if (!e.altKey || e.ctrlKey || e.metaKey) { return; }
      var acoes = {
        Digit1: function () { irPara('conteudo'); },
        Digit2: irParaMenu,
        Digit3: function () { irPara('rodape'); },
        Digit4: alternarContraste,
        Digit5: aumentar,
        Digit6: diminuir,
        Digit7: restaurar,
        Digit8: function () { if (alternarLeitura) { alternarLeitura(); } },
        Digit0: function () { window.location.href = 'acessibilidade-deste-site.html'; }
      };
      if (acoes[e.code]) { e.preventDefault(); acoes[e.code](); }
    });
  }

  /* Ouvir esta página: usa a voz do navegador; nunca começa sozinho */
  function iniciarLeitura() {
    var sintese = window.speechSynthesis;
    var btnOuvir = document.getElementById('btn-ouvir');
    var btnPausar = document.getElementById('btn-pausar');
    if (!sintese || !window.SpeechSynthesisUtterance || !btnOuvir || !btnPausar) { return; }
    var lendo = false;
    var pausado = false;
    btnOuvir.hidden = false;

    function trechos() {
      var itens = document.querySelectorAll('#conteudo h1, #conteudo .lead, #conteudo h2, #conteudo h3, #conteudo p, #conteudo li, #conteudo caption, #conteudo figcaption, #conteudo tr');
      var lista = [];
      Array.prototype.forEach.call(itens, function (el) {
        if (el.closest('.voltar') || el.closest('.sumario') || el.closest('pre')) { return; }
        if (el.tagName === 'P' && el.closest('li')) { return; }
        var texto;
        if (el.tagName === 'TR') {
          texto = Array.prototype.map.call(el.cells, function (c) { return c.textContent.trim(); }).join(', ');
        } else {
          texto = el.textContent;
        }
        texto = texto.replace(/\s+/g, ' ').trim();
        if (texto) { lista.push(texto); }
      });
      return lista;
    }

    function atualizar() {
      btnOuvir.textContent = lendo ? 'Parar leitura' : 'Ouvir esta página';
      btnPausar.hidden = !lendo;
      btnPausar.textContent = pausado ? 'Continuar leitura' : 'Pausar leitura';
    }

    function parar() {
      lendo = false;
      pausado = false;
      sintese.cancel();
      atualizar();
    }

    function falar(i, lista) {
      if (!lendo) { return; }
      if (i >= lista.length) { parar(); return; }
      var fala = new window.SpeechSynthesisUtterance(lista[i]);
      fala.lang = 'pt-BR';
      var voz = sintese.getVoices().filter(function (v) { return v.lang && v.lang.toLowerCase().indexOf('pt') === 0; })[0];
      if (voz) { fala.voice = voz; }
      fala.onend = function () { falar(i + 1, lista); };
      fala.onerror = function () { if (lendo) { parar(); } };
      sintese.speak(fala);
    }

    function iniciar() {
      lendo = true;
      pausado = false;
      atualizar();
      falar(0, trechos());
    }

    alternarLeitura = function () { if (lendo) { parar(); } else { iniciar(); } };
    btnOuvir.addEventListener('click', alternarLeitura);
    btnPausar.addEventListener('click', function () {
      if (pausado) { sintese.resume(); pausado = false; } else { sintese.pause(); pausado = true; }
      atualizar();
    });
    window.addEventListener('pagehide', function () { sintese.cancel(); });
  }

  function iniciarVLibras() {
    if (!document.querySelector('[vw]')) { return; }
    var s = document.createElement('script');
    s.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
    s.onload = function () {
      try { new window.VLibras.Widget('https://vlibras.gov.br/app'); } catch (e) { /* VLibras indisponível */ }
    };
    document.body.appendChild(s);
  }

  var salvo = parseInt(ler('fonte'), 10);
  if (!isNaN(salvo) && salvo >= 0 && salvo < NIVEIS.length) { nivel = salvo; }
  aplicarFonte(false);
  aplicarContraste(ler('contraste') === '1', false);
  iniciarBotoes();
  iniciarLeitura();
  iniciarAtalhos();
  iniciarVLibras();
})();
