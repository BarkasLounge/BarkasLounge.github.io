var SUPABASE_URL = 'https://dszbzitphenbqdsybtdt.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzemJ6aXRwaGVuYnFkc3lidGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1NTE0ODUsImV4cCI6MjEwOTEyNzQ4NX0.SQxeaALW3F2YSzzhEj_JEavv24iFhHEGtCygVJukQHo';

(function(){
  var TEL = '+79647999998';
  var TEL_PRETTY = '+7 964 799 99 98';

  function $(s, r){ return (r||document).querySelector(s); }
  function $$(s, r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); }

  var header = $('#header');
  function onScroll(){
    if(header){ header.classList.toggle('scrolled', window.scrollY > 24); }
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  var burger = $('#burger');
  var nav = $('#nav');
  function closeNav(){
    if(!nav || !burger){ return; }
    nav.classList.remove('open');
    burger.classList.remove('open');
    burger.setAttribute('aria-expanded','false');
    document.body.style.overflow = '';
  }
  if(burger && nav){
    burger.addEventListener('click', function(){
      var open = nav.classList.toggle('open');
      burger.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    nav.addEventListener('click', function(e){
      if(e.target.tagName === 'A' || e.target === nav){ closeNav(); }
    });
    window.addEventListener('resize', function(){
      if(window.innerWidth > 920 && nav.classList.contains('open')){ closeNav(); }
    });
  }

  $$('[data-split]').forEach(function(el, blockIndex){
    var text = el.textContent;
    el.textContent = '';
    var i = 0;
    text.split('').forEach(function(ch){
      var s = document.createElement('span');
      s.className = 'ch';
      s.style.setProperty('--i', blockIndex * 8 + i);
      s.textContent = ch === ' ' ? '\u00A0' : ch;
      el.appendChild(s);
      i++;
    });
  });

  $$('[data-stagger]').forEach(function(group){
    Array.prototype.forEach.call(group.children, function(child, idx){
      child.style.setProperty('--d', (idx % 8) * 80 + 'ms');
    });
  });

  var revealEls = $$('.reveal');
  if('IntersectionObserver' in window && revealEls.length){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    },{threshold:.12,rootMargin:'0px 0px -6% 0px'});
    revealEls.forEach(function(el){ io.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add('visible'); });
  }

  var parallaxEls = $$('[data-parallax]');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function parallax(){
    if(reduced){ return; }
    var vh = window.innerHeight;
    parallaxEls.forEach(function(el){
      var r = el.getBoundingClientRect();
      if(r.bottom < 0 || r.top > vh){ return; }
      var speed = parseFloat(el.getAttribute('data-parallax')) || 0;
      var offset = (r.top + r.height/2 - vh/2) * speed;
      el.style.transform = 'translate3d(0,' + offset.toFixed(1) + 'px,0)' +
        (el.tagName === 'IMG' ? ' scale(1.12)' : '');
    });
  }
  if(parallaxEls.length && !reduced){
    window.addEventListener('scroll', function(){ requestAnimationFrame(parallax); }, {passive:true});
    window.addEventListener('resize', parallax);
    parallax();
  }

  var toastEl = $('.toast');
  var toastTimer = null;
  function toast(msg){
    if(!toastEl){ return; }
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ toastEl.classList.remove('show'); }, 3200);
  }

  function openModal(id){
    closeModals();
    var m = $('#' + id);
    if(!m){ return; }
    m.classList.add('open');
    document.body.style.overflow = 'hidden';
    var first = m.querySelector('input, select, button.btn');
    if(first){ setTimeout(function(){ first.focus(); }, 60); }
    if(id === 'bookModal'){ bookState.openedAt = Date.now(); initBooking(); }
  }
  function closeModals(){
    $$('.overlay.open').forEach(function(m){ m.classList.remove('open'); });
    document.body.style.overflow = '';
  }
  document.addEventListener('click', function(e){
    var opener = e.target.closest('[data-open]');
    if(opener){
      e.preventDefault();
      openModal(opener.getAttribute('data-open'));
      return;
    }
    if(e.target.closest('[data-close]')){
      e.preventDefault();
      closeModals();
      return;
    }
    if(e.target.classList && e.target.classList.contains('overlay')){
      closeModals();
    }
  });
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape'){
      closeModals();
      closeTgPop();
      closeNav();
    }
    if(e.shiftKey && e.altKey && (e.code === 'KeyA')){
      openModal('loginModal');
    }
  });

  var tgBtn = $('#tgBtn');
  var tgPop = $('#tgPop');
  function closeTgPop(){
    if(tgPop){ tgPop.classList.remove('open'); }
    if(tgBtn){ tgBtn.setAttribute('aria-expanded','false'); }
  }
  if(tgBtn && tgPop){
    tgBtn.addEventListener('click', function(e){
      e.stopPropagation();
      var open = tgPop.classList.toggle('open');
      tgBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function(e){
      if(!e.target.closest('#tgPop') && !e.target.closest('#tgBtn')){ closeTgPop(); }
    });
  }

  var dotClicks = 0;
  var dotTimer = null;
  var dot = $('#adminDot');
  if(dot){
    dot.addEventListener('click', function(){
      dotClicks++;
      clearTimeout(dotTimer);
      dotTimer = setTimeout(function(){ dotClicks = 0; }, 1500);
      if(dotClicks >= 3){
        dotClicks = 0;
        openModal('loginModal');
      }
    });
  }

  var loginForm = $('#loginForm');
  if(loginForm){
    loginForm.addEventListener('submit', function(e){
      e.preventDefault();
      var msg = $('#loginMsg');
      var u = $('#lgUser').value.trim();
      var p = $('#lgPass').value;
      if(!SUPABASE_URL || !SUPABASE_ANON_KEY){
        msg.className = 'form-msg form-msg--err show';
        msg.textContent = 'Панель управления ещё не подключена к базе.';
        return;
      }
      msg.className = 'form-msg show';
      msg.textContent = 'Проверяем…';
      fetch(SUPABASE_URL + '/auth/v1/token?grant_type=password', {
        method: 'POST',
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: u, password: p })
      }).then(function(r){ return r.json().then(function(j){ return { ok: r.ok, j: j }; }); })
        .then(function(res){
          if(!res.ok || !res.j.access_token){
            msg.className = 'form-msg form-msg--err show';
            msg.textContent = 'Неверный логин или пароль.';
            return;
          }
          return fetch(SUPABASE_URL + '/rest/v1/profiles?select=role&id=eq.' + res.j.user.id, {
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + res.j.access_token }
          }).then(function(r){ return r.json(); }).then(function(pr){
            var role = (pr && pr[0] && pr[0].role) || null;
            if(!role){
              msg.className = 'form-msg form-msg--err show';
              msg.textContent = 'У учётной записи нет доступа к панели.';
              return;
            }
            localStorage.setItem('barkas_admin_session', JSON.stringify({
              access: res.j.access_token,
              refresh: res.j.refresh_token,
              role: role,
              uid: res.j.user.id,
              at: Date.now()
            }));
            location.href = 'admin.html';
          });
        })
        .catch(function(){
          msg.className = 'form-msg form-msg--err show';
          msg.textContent = 'Нет связи с сервером.';
        });
    });
  }

  var HOURS = {
    khleb: { satSun: [14, 24], weekday: [10, 24] },
    veranda: { monThu: [12, 24], fri: [12, 30], satSun: [14, 30] }
  };
  var bookState = { openedAt: 0, venue: 'khleb', guests: 4 };

  function pad(n){ return (n < 10 ? '0' : '') + n; }

  function venueOf(){
    var sel = $('#bkVenue');
    if(sel && sel.value){ return sel.value; }
    return document.body.classList.contains('v-veranda') ? 'veranda' : 'khleb';
  }

  function slotsFor(venue, dateStr){
    var h = HOURS[venue];
    if(!h){ return []; }
    var d = dateStr ? new Date(dateStr + 'T00:00:00') : new Date();
    var day = d.getDay();
    var range;
    if(venue === 'khleb'){
      range = (day === 0 || day === 6) ? h.satSun : h.weekday;
    } else {
      if(day === 5){ range = h.fri; }
      else if(day === 0 || day === 6){ range = h.satSun; }
      else { range = h.monThu; }
    }
    if(!range){ return []; }
    var out = [];
    var lastStart = range[1] - 1;
    for(var t = range[0]; t <= lastStart; t += 0.5){
      var hour = Math.floor(t) % 24;
      var min = (t % 1) ? '30' : '00';
      var label = pad(hour) + ':' + min + (t >= 24 ? ' (ночь)' : '');
      out.push({ v: pad(hour) + ':' + min, label: label });
    }
    return out;
  }

  function fillTime(){
    var sel = $('#bkTime');
    if(!sel){ return; }
    var venue = venueOf();
    var date = $('#bkDate') ? $('#bkDate').value : '';
    var slots = slotsFor(venue, date);
    sel.innerHTML = '';
    if(!slots.length){
      var o = document.createElement('option');
      o.value = '';
      o.textContent = 'Нет доступного времени';
      sel.appendChild(o);
      return;
    }
    slots.forEach(function(s){
      var o = document.createElement('option');
      o.value = s.v;
      o.textContent = s.label;
      sel.appendChild(o);
    });
  }

  function initBooking(){
    var dateInp = $('#bkDate');
    if(dateInp && !dateInp.value){
      var now = new Date();
      dateInp.min = now.getFullYear() + '-' + pad(now.getMonth()+1) + '-' + pad(now.getDate());
      var max = new Date(now.getTime() + 30 * 864e5);
      dateInp.max = max.getFullYear() + '-' + pad(max.getMonth()+1) + '-' + pad(max.getDate());
    }
    fillTime();
    updateGuests();
    var venueSel = $('#bkVenue');
    if(venueSel && !venueSel.dataset.bound){
      venueSel.dataset.bound = '1';
      venueSel.addEventListener('change', fillTime);
    }
    if(dateInp && !dateInp.dataset.bound){
      dateInp.dataset.bound = '1';
      dateInp.addEventListener('change', fillTime);
    }
    $$('#bookModal .seg button').forEach(function(b){
      if(b.dataset.bound){ return; }
      b.dataset.bound = '1';
      b.addEventListener('click', function(){
        $$('#bookModal .seg button').forEach(function(x){ x.classList.remove('active'); });
        b.classList.add('active');
        var mode = b.getAttribute('data-mode');
        $('#bkPhoneView').style.display = mode === 'phone' ? '' : 'none';
        $('#bkFormView').style.display = mode === 'form' ? '' : 'none';
      });
    });
  }

  function updateGuests(){
    var out = $('#bkGuestsOut');
    if(out){ out.textContent = bookState.guests; }
    var inp = $('#bkGuests');
    if(inp){ inp.value = bookState.guests; }
  }
  var gMinus = $('#bkGuestsMinus');
  var gPlus = $('#bkGuestsPlus');
  if(gMinus){ gMinus.addEventListener('click', function(){ bookState.guests = Math.max(1, bookState.guests - 1); updateGuests(); }); }
  if(gPlus){ gPlus.addEventListener('click', function(){ bookState.guests = Math.min(12, bookState.guests + 1); updateGuests(); }); }

  var phoneInp = $('#bkPhone');
  function formatPhone(v){
    var d = v.replace(/\D/g, '');
    if(d.startsWith('8')){ d = '7' + d.slice(1); }
    if(d.startsWith('9')){ d = '7' + d; }
    if(!d.startsWith('7')){ d = '7' + d; }
    d = d.slice(0, 11);
    var out = '+7';
    if(d.length > 1){ out += ' (' + d.slice(1, 4); }
    if(d.length >= 5){ out += ') ' + d.slice(4, 7); }
    if(d.length >= 8){ out += '-' + d.slice(7, 9); }
    if(d.length >= 10){ out += '-' + d.slice(9, 11); }
    return out;
  }
  if(phoneInp){
    phoneInp.addEventListener('input', function(){
      phoneInp.value = formatPhone(phoneInp.value);
    });
  }

  function setErr(id, on, text){
    var f = $('#' + id);
    if(!f){ return; }
    f.classList.toggle('invalid', !!on);
    if(text){ var e = f.querySelector('.err'); if(e){ e.textContent = text; } }
  }

  var bookForm = $('#bookForm');
  if(bookForm){
    bookForm.addEventListener('submit', function(e){
      e.preventDefault();
      var msg = $('#bookMsg');
      var hp = $('#bkHp').value;
      var elapsed = Date.now() - (bookState.openedAt || 0);
      if(hp || elapsed < 5000){
        toast('Похоже, автоматическая отправка. Если это не так — позвоните нам.');
        return;
      }
      var ok = true;
      var name = $('#bkName').value.trim();
      var phone = phoneInp.value.replace(/\D/g, '');
      var date = $('#bkDate').value;
      var time = $('#bkTime').value;
      if(!/^[А-Яа-яЁёA-Za-z][А-Яа-яЁёA-Za-z\s-]{1,39}$/.test(name)){ setErr('bkNameF', true, 'Имя: 2–40 букв'); ok = false; } else { setErr('bkNameF', false); }
      if(!/^7\d{10}$/.test(phone)){ setErr('bkPhoneF', true, 'Телефон в формате +7 (999) 123-45-67'); ok = false; } else { setErr('bkPhoneF', false); }
      if(!date){ setErr('bkDateF', true, 'Выберите дату'); ok = false; } else { setErr('bkDateF', false); }
      if(!time){ setErr('bkTimeF', true, 'Выберите время'); ok = false; } else { setErr('bkTimeF', false); }
      if(!ok){ return; }
      if(!SUPABASE_URL || !SUPABASE_ANON_KEY){
        msg.className = 'form-msg form-msg--err show';
        msg.innerHTML = 'Онлайн-бронирование временно недоступно. Позвоните: <a href="tel:' + TEL + '" style="color:var(--a1)">' + TEL_PRETTY + '</a>';
        return;
      }
      msg.className = 'form-msg show';
      msg.textContent = 'Отправляем…';
      var btn = bookForm.querySelector('button[type="submit"]');
      btn.disabled = true;
      fetch(SUPABASE_URL + '/rest/v1/bookings', {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          venue: venueOf(),
          name: name,
          phone: phoneInp.value,
          date: date,
          time: time,
          guests: bookState.guests
        })
      }).then(function(r){
        return r.json().then(function(j){ return { ok: r.ok, j: j }; });
      }).then(function(res){
        btn.disabled = false;
        if(res.ok && res.j && res.j[0]){
          bookForm.reset();
          updateGuests();
          msg.className = 'form-msg form-msg--ok show';
          msg.innerHTML = 'Бронь <b>#' + String(res.j[0].id).slice(0, 8).toUpperCase() + '</b> принята! Мы позвоним вам для подтверждения.';
        } else {
          msg.className = 'form-msg form-msg--err show';
          msg.innerHTML = 'Не получилось отправить. Позвоните: <a href="tel:' + TEL + '" style="color:var(--a1)">' + TEL_PRETTY + '</a>';
        }
      }).catch(function(){
        btn.disabled = false;
        msg.className = 'form-msg form-msg--err show';
        msg.innerHTML = 'Нет связи. Позвоните: <a href="tel:' + TEL + '" style="color:var(--a1)">' + TEL_PRETTY + '</a>';
      });
    });
  }

  $$('[data-detail]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var card = btn.closest('[data-item-id]') || btn.closest('.pizza');
      if(!card){ return; }
      var d = card.dataset;
      $('#dtName').textContent = d.name || '';
      $('#dtDesc').textContent = d.desc || '';
      $('#dtPrice').textContent = (d.price || '—') + ' ₽';
      $('#dtWeight').textContent = d.weight ? d.weight + ' г' : '— г';
      $('#dtKcal').textContent = d.kcal || '—';
      $('#dtProt').textContent = d.prot || '—';
      $('#dtFat').textContent = d.fat || '—';
      $('#dtCarb').textContent = d.carb || '—';
      var ph = $('#dtPhoto');
      var img = card.querySelector('img');
      ph.src = img ? img.src : '';
      ph.alt = d.name || '';
      openModal('detailModal');
    });
  });

  function syncData(){
    if(!SUPABASE_URL || !SUPABASE_ANON_KEY){ return; }
    var headers = {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
    };
    fetch(SUPABASE_URL + '/rest/v1/menu_items?select=*&is_active=eq.true&order=sort.asc', { headers: headers })
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(items){
        if(!items){ return; }
        var seen = {};
        items.forEach(function(it){
          var el = document.querySelector('[data-item-id="' + it.id + '"]');
          if(el){
            seen[it.id] = true;
            applyItem(el, it);
          }
        });
        items.forEach(function(it){
          if(seen[it.id]){ return; }
          var cat = it.category || 'hookah';
          var venue = it.venue === 'both'
            ? (document.body.classList.contains('v-veranda') ? 'veranda' : 'khleb')
            : it.venue;
          var proto = document.querySelector('[data-item-id^="' + venue + '-' + cat + '-"]');
          if(!proto || !proto.parentElement){ return; }
          var clone = proto.cloneNode(true);
          clone.setAttribute('data-item-id', it.id);
          clone.classList.add('visible');
          clone.classList.remove('reveal');
          applyItem(clone, it);
          proto.parentElement.appendChild(clone);
        });
      })
      .catch(function(){});
    function applyItem(el, it){
      var priceEl = el.querySelector('[data-price]');
      if(priceEl && it.price != null){ priceEl.textContent = it.price; }
      var ps = el.querySelector('[data-price-s]');
      if(ps){ ps.textContent = it.price_s != null ? it.price_s : ''; }
      var pm = el.querySelector('[data-price-m]');
      if(pm){ pm.textContent = it.price_m != null ? it.price_m : ''; }
      var pl = el.querySelector('[data-price-l]');
      if(pl){ pl.textContent = it.price_l != null ? it.price_l : ''; }
      var nameEl = el.querySelector('[data-name]');
      if(nameEl && it.name){ nameEl.textContent = it.name; }
      var descEl = el.querySelector('[data-desc]');
      if(descEl && it.description){ descEl.textContent = it.description; }
      var imgEl = el.querySelector('img');
      if(imgEl && it.photo_path){ imgEl.src = it.photo_path; }
      if(it.weight_g != null){ el.dataset.weight = it.weight_g; }
      if(it.kcal != null){ el.dataset.kcal = it.kcal; }
      if(it.protein != null){ el.dataset.prot = it.protein; }
      if(it.fat != null){ el.dataset.fat = it.fat; }
      if(it.carb != null){ el.dataset.carb = it.carb; }
      var b = el.querySelector('.badge');
      if(it.badge){
        if(!b){ b = document.createElement('p'); b.className = 'badge'; el.querySelector('.card__photo, .pizza__photo').appendChild(b); }
        b.textContent = it.badge;
      } else if(b){ b.remove(); }
    }
    fetch(SUPABASE_URL + '/rest/v1/promos?select=*&is_active=eq.true&order=sort.asc', { headers: headers })
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(promos){ if(promos){ window.__barkasPromos = promos; } })
      .catch(function(){});
    fetch(SUPABASE_URL + '/rest/v1/gallery_photos?select=*&is_active=eq.true&order=sort.asc', { headers: headers })
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(photos){
        if(!photos){ return; }
        var grids = {};
        photos.forEach(function(p){
          var key = 'gal-' + p.venue;
          grids[key] = grids[key] || [];
          grids[key].push(p);
        });
        Object.keys(grids).forEach(function(key){
          var grid = document.querySelector('[data-gallery="' + key.replace('gal-','') + '"]');
          if(!grid){ return; }
          grid.innerHTML = '';
          grids[key].forEach(function(p, i){
            var fig = document.createElement('figure');
            fig.className = 'reveal visible';
            var img = document.createElement('img');
            img.src = p.path;
            img.alt = p.alt || 'Баркас — наш вайб';
            img.loading = 'lazy';
            if(i < 3){ img.setAttribute('data-parallax', '0.05'); }
            fig.appendChild(img);
            grid.appendChild(fig);
          });
        });
      })
      .catch(function(){});
  }
  syncData();
})();
