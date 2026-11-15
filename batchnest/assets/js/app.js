/* BatchNest — front-end logic */
(function () {
  'use strict';

  var CONFIG = window.BATCHNEST_CONFIG || {};
  var $ = function (sel) { return document.querySelector(sel); };

  /* ---------- Toast ---------- */
  var toastTimer = null;
  function toast(msg) {
    var el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 3800);
  }

  /* ---------- Telegram join ---------- */
  function joinTelegram() {
    var url = (CONFIG.TELEGRAM_URL || '').trim();
    if (!url) {
      toast('Telegram link is not configured yet. Set TELEGRAM_URL in assets/js/config.js');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  /* ---------- Date helpers ---------- */
  function todayISO() {
    var d = new Date();
    var off = d.getTimezoneOffset();
    return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
  }
  function formatLongDate(d) {
    return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  /* ---------- Data loading ---------- */
  function loadData() {
    // Prefer a live API endpoint if the owner configured one; otherwise use bundled schedule.json.
    var source = (CONFIG.CLASSES_API || '').trim() || '/schedule.json';
    return fetch(source, { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .catch(function () {
        return { batches: CONFIG.BATCHES || [], classes: [] };
      });
  }

  /* ---------- Rendering ---------- */
  var state = { batches: [], classes: [], selectedBatch: '' };

  function renderBatchSelect() {
    var select = $('#batchSelect');
    var frag = document.createDocumentFragment();
    var placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Select Batch…';
    frag.appendChild(placeholder);
    state.batches.forEach(function (name) {
      var opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      frag.appendChild(opt);
    });
    select.innerHTML = '';
    select.appendChild(frag);
  }

  function classMatchesBatch(cls, batch) {
    if (!batch) return true;
    if (!cls.batch) return true; // untagged classes show for every batch
    return String(cls.batch).toLowerCase() === batch.toLowerCase();
  }

  function renderToday() {
    var wrap = $('#todayClasses');
    var empty = $('#todayEmpty');
    var info = $('#selectedBatchInfo');
    var today = todayISO();
    var list = state.classes.filter(function (cls) {
      return cls.date === today && classMatchesBatch(cls, state.selectedBatch);
    });

    if (state.selectedBatch) {
      info.innerHTML = 'Showing schedule for <strong>' + escapeHTML(state.selectedBatch) + '</strong>';
    } else {
      info.textContent = 'Tip: select your batch to filter today’s classes.';
    }

    wrap.innerHTML = '';
    if (!list.length) {
      empty.style.display = 'block';
      return;
    }
    empty.style.display = 'none';
    list.sort(function (a, b) { return String(a.time || '').localeCompare(String(b.time || '')); });
    list.forEach(function (cls) {
      wrap.appendChild(classItemNode(cls));
    });
  }

  function classItemNode(cls) {
    var div = document.createElement('div');
    div.className = 'class-item';

    var time = document.createElement('div');
    time.className = 'class-time';
    time.innerHTML = escapeHTML(cls.time || 'TBA').replace('-', '<br>');

    var meta = document.createElement('div');
    meta.className = 'class-meta';
    var subject = document.createElement('div');
    subject.className = 'class-subject';
    subject.textContent = cls.subject || 'Class';
    var sub = document.createElement('div');
    sub.className = 'class-sub';
    sub.textContent = [cls.teacher, cls.batch, cls.mode].filter(Boolean).join(' · ') || 'BatchNest live class';
    meta.appendChild(subject);
    meta.appendChild(sub);

    var action;
    if (cls.link) {
      action = document.createElement('a');
      action.className = 'join-btn';
      action.href = cls.link;
      action.target = '_blank';
      action.rel = 'noopener noreferrer';
      action.textContent = 'JOIN LIVE';
    } else {
      action = document.createElement('span');
      action.className = 'join-btn disabled';
      action.textContent = 'SOON';
    }

    div.appendChild(time);
    div.appendChild(meta);
    div.appendChild(action);
    return div;
  }

  function escapeHTML(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------- All classes modal ---------- */
  function renderAllClasses(filter) {
    var listEl = $('#allClassesList');
    var emptyEl = $('#allClassesEmpty');
    var q = (filter || '').trim().toLowerCase();
    var items = state.classes.filter(function (cls) {
      if (state.selectedBatch && cls.batch && String(cls.batch).toLowerCase() !== state.selectedBatch.toLowerCase()) return false;
      if (!q) return true;
      return [cls.subject, cls.teacher, cls.batch, cls.date].filter(Boolean).join(' ').toLowerCase().indexOf(q) !== -1;
    });

    listEl.innerHTML = '';
    if (!items.length) { emptyEl.style.display = 'block'; return; }
    emptyEl.style.display = 'none';

    var byDate = {};
    items.forEach(function (cls) { (byDate[cls.date || 'Unscheduled'] = byDate[cls.date || 'Unscheduled'] || []).push(cls); });
    Object.keys(byDate).sort().forEach(function (date) {
      var label = document.createElement('div');
      label.className = 'date-group';
      label.textContent = date === 'Unscheduled' ? 'Unscheduled' : formatLongDate(new Date(date + 'T00:00:00'));
      listEl.appendChild(label);
      byDate[date].sort(function (a, b) { return String(a.time || '').localeCompare(String(b.time || '')); })
        .forEach(function (cls) { listEl.appendChild(classItemNode(cls)); });
    });
  }

  function openModal(id) { var m = $(id); m.classList.add('open'); m.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; }
  function closeModal(m) { m.classList.remove('open'); m.setAttribute('aria-hidden', 'true'); if (!document.querySelector('.modal-backdrop.open')) document.body.style.overflow = ''; }

  /* ---------- Telegram popup (once per session) ---------- */
  function maybeShowPopup() {
    try { if (sessionStorage.getItem('bn_tg_popup') === '1') return; } catch (e) { /* private mode */ }
    var ad = $('#tgPopupAd');
    if (CONFIG.AD_IMAGE_URL && ad) ad.src = CONFIG.AD_IMAGE_URL;
    setTimeout(function () {
      openModal('#telegramPopup');
      try { sessionStorage.setItem('bn_tg_popup', '1'); } catch (e) { /* ignore */ }
    }, 2200);
  }

  /* ---------- Wire up ---------- */
  function init() {
    $('#footerYear').textContent = new Date().getFullYear();
    $('#todayDate').textContent = formatLongDate(new Date());

    $('#batchSelect').addEventListener('change', function (e) {
      state.selectedBatch = e.target.value;
      renderToday();
      renderAllClasses($('#classSearch').value);
    });

    $('#viewAllBtn').addEventListener('click', function () { renderAllClasses($('#classSearch').value); openModal('#allClassesModal'); });
    $('#closeAllClasses').addEventListener('click', function () { closeModal($('#allClassesModal')); });
    $('#classSearch').addEventListener('input', function (e) { renderAllClasses(e.target.value); });

    $('#joinTelegramBtn').addEventListener('click', joinTelegram);
    $('#popupJoinBtn').addEventListener('click', joinTelegram);
    $('#headerTelegramBtn').addEventListener('click', joinTelegram);
    $('#footerTelegramLink').addEventListener('click', function (e) { e.preventDefault(); joinTelegram(); });
    $('#closeTelegramPopup').addEventListener('click', function () { closeModal($('#telegramPopup')); });

    document.querySelectorAll('.modal-backdrop').forEach(function (backdrop) {
      backdrop.addEventListener('click', function (e) { if (e.target === backdrop) closeModal(backdrop); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') document.querySelectorAll('.modal-backdrop.open').forEach(closeModal);
    });

    loadData().then(function (data) {
      state.batches = Array.isArray(data.batches) && data.batches.length ? data.batches : (CONFIG.BATCHES || []);
      state.classes = Array.isArray(data.classes) ? data.classes : [];
      renderBatchSelect();
      renderToday();
      maybeShowPopup();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
