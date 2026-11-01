(function(){
  var URL = 'https://dszbzitphenbqdsybtdt.supabase.co';
  var KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzemJ6aXRwaGVuYnFkc3lidGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1NTE0ODUsImV4cCI6MjEwOTEyNzQ4NX0.SQxeaALW3F2YSzzhEj_JEavv24iFhHEGtCygVJukQHo';
  var SKEY = 'barkas_admin_session';

  var S = { access: null, refresh: null, uid: null, role: null, email: '' };

  function $(s, r){ return (r||document).querySelector(s); }
  function $$(s, r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); }
  function esc(s){
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  }
  var toastEl = $('.toast');
  var toastTimer = null;
  function toast(m){
    toastEl.textContent = m;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ toastEl.classList.remove('show'); }, 3000);
  }

  function saveSession(){
    localStorage.setItem(SKEY, JSON.stringify(S));
  }
  function loadSession(){
    try{
      var raw = localStorage.getItem(SKEY);
      if(!raw){ return false; }
      var s = JSON.parse(raw);
      if(!s.access){ return false; }
      S = s;
      return true;
    }catch(e){ return false; }
  }
  function clearSession(){
    localStorage.removeItem(SKEY);
    S = { access: null, refresh: null, uid: null, role: null, email: '' };
  }

  function refreshSession(){
    return fetch(URL + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      headers: { 'apikey': KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: S.refresh })
    }).then(function(r){ return r.json(); }).then(function(j){
      if(!j.access_token){ throw new Error('session expired'); }
      S.access = j.access_token;
      S.refresh = j.refresh_token;
      saveSession();
      return j;
    });
  }

  function req(path, opts){
    opts = opts || {};
    opts.headers = Object.assign({
      'apikey': KEY,
      'Authorization': 'Bearer ' + S.access
    }, opts.headers || {});
    return fetch(URL + path, opts).then(function(r){
      if(r.status === 401 && S.refresh){
        return refreshSession().then(function(){
          opts.headers['Authorization'] = 'Bearer ' + S.access;
          return fetch(URL + path, opts);
        });
      }
      return r;
    });
  }

  function restList(table, qs){
    return req('/rest/v1/' + table + (qs || '?select=*'))
      .then(function(r){ return r.json().then(function(j){ return { ok: r.ok, j: j }; }); });
  }
  function restInsert(table, row){
    return req('/rest/v1/' + table, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
      body: JSON.stringify(row)
    }).then(function(r){ return r.json().then(function(j){ return { ok: r.ok, j: j }; }); });
  }
  function restPatch(table, match, row){
    return req('/rest/v1/' + table + '?' + match, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(row)
    }).then(function(r){ return { ok: r.ok }; });
  }
  function restDelete(table, match){
    return req('/rest/v1/' + table + '?' + match, { method: 'DELETE' })
      .then(function(r){ return { ok: r.ok }; });
  }
  function logChange(entity, id, diff){
    restInsert('change_log', { actor: S.email || S.uid, entity: entity, entity_id: id, diff: diff });
  }

  function num(v){ return v === '' || v == null ? null : Number(v); }

  function resizeImage(file, cb){
    var img = new Image();
    var url = URL.createObjectURL(file);
    img.onload = function(){
      var max = 1600;
      var w = img.width, h = img.height;
      if(w > max || h > max){
        var k = max / (w > h ? w : h);
        w = Math.round(w * k); h = Math.round(h * k);
      }
      var c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      c.toBlob(function(blob){
        URL.revokeObjectURL(url);
        cb(blob);
      }, 'image/jpeg', 0.82);
    };
    img.onerror = function(){ URL.revokeObjectURL(url); cb(null); };
    img.src = url;
  }

  function uploadMedia(key, file, cb){
    resizeImage(file, function(blob){
      if(!blob){ toast('Не удалось обработать изображение'); cb(null); return; }
      fetch(URL + '/storage/v1/object/media/' + key, {
        method: 'POST',
        headers: { 'apikey': KEY, 'Authorization': 'Bearer ' + S.access, 'Content-Type': 'image/jpeg', 'x-upsert': 'true' },
        body: blob
      }).then(function(r){ return r.json(); }).then(function(j){
        if(j.Key){ cb(URL + '/storage/v1/object/public/' + j.Key); }
        else { toast('Ошибка загрузки фото'); cb(null); }
      }).catch(function(){ toast('Ошибка загрузки фото'); cb(null); });
    });
  }

  var TABS = ['menu', 'gallery', 'promos', 'bookings', 'settings'];
  $$('#tabs button').forEach(function(b){
    b.addEventListener('click', function(){
      $$('#tabs button').forEach(function(x){ x.classList.remove('active'); });
      b.classList.add('active');
      $$('.panel').forEach(function(p){ p.classList.remove('active'); });
      $('#tab-' + b.getAttribute('data-tab')).classList.add('active');
      var t = b.getAttribute('data-tab');
      if(t === 'menu'){ loadMenu(); }
      if(t === 'gallery'){ loadGallery(); }
      if(t === 'promos'){ loadPromos(); }
      if(t === 'bookings'){ loadBookings(); }
      if(t === 'settings'){ loadSettings(); }
    });
  });

  function loadMenu(){
    var v = $('#fltVenue').value;
    var c = $('#fltCat').value;
    var q = '?select=*&order=sort.asc';
    if(v){ q += '&venue=in.("' + v + '","both")'; }
    if(c){ q += '&category=eq.' + c; }
    restList('menu_items', q).then(function(res){
      var box = $('#menuList');
      if(!res.ok){ box.innerHTML = '<div class="row-item">Ошибка загрузки</div>'; return; }
      if(!res.j.length){ box.innerHTML = '<div class="row-item">Пока пусто — добавьте позицию по шаблону</div>'; return; }
      box.innerHTML = '';
      res.j.forEach(function(it){
        var row = document.createElement('div');
        row.className = 'row-item';
        var priceInfo = it.price != null ? it.price + ' ₽' : (it.price_s != null ? ('S ' + it.price_s + ' / M ' + (it.price_m ?? '—') + ' / L ' + (it.price_l ?? '—')) : '—');
        row.innerHTML =
          '<div class="grow"><b>' + esc(it.name) + '</b>' +
          '<small>' + esc(catName(it.category)) + ' · ' + esc(venueName(it.venue)) + ' · ' + esc(priceInfo) +
          (it.badge ? ' · ' + esc(it.badge) : '') + '</small></div>' +
          '<button class="mini" data-act="edit">Изменить</button>' +
          '<button class="mini" data-act="toggle">' + (it.is_active ? 'Скрыть' : 'Включить') + '</button>' +
          '<button class="mini mini--warn" data-act="del">Удалить</button>';
        row.querySelector('[data-act="edit"]').addEventListener('click', function(){ openMenuForm(it); });
        row.querySelector('[data-act="toggle"]').addEventListener('click', function(){
          restPatch('menu_items', 'id=eq.' + encodeURIComponent(it.id), { is_active: !it.is_active })
            .then(function(r){ if(r.ok){ toast(it.is_active ? 'Скрыто' : 'Показано'); logChange('menu_items', it.id, { is_active: !it.is_active }); loadMenu(); } });
        });
        row.querySelector('[data-act="del"]').addEventListener('click', function(){
          if(!confirm('Удалить «' + it.name + '»?')){ return; }
          restDelete('menu_items', 'id=eq.' + encodeURIComponent(it.id))
            .then(function(r){ if(r.ok){ toast('Удалено'); logChange('menu_items', it.id, { deleted: true }); loadMenu(); } });
        });
        box.appendChild(row);
      });
    });
  }
  function catName(c){ return { hookah: 'Кальяны', pizza: 'Пицца', tea: 'Чай', coffee: 'Кофе' }[c] || c; }
  function venueName(v){ return { khleb: 'Хлебозаводский', veranda: 'Веранда', both: 'Обе' }[v] || v; }

  function openMenuForm(it){
    $('#menuEditor').style.display = '';
    $('#menuEditor').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    $('#mfHead').textContent = it ? 'Изменение: ' + it.name : 'Новая позиция';
    $('#mf_id').value = it ? it.id : '';
    $('#mf_name').value = it ? it.name : '';
    $('#mf_venue').value = it ? it.venue : (document.body.dataset.venue || 'khleb');
    $('#mf_cat').value = it ? it.category : ($('#fltCat').value || 'pizza');
    $('#mf_desc').value = it ? (it.description || '') : '';
    $('#mf_price').value = it && it.price != null ? it.price : '';
    $('#mf_ps').value = it && it.price_s != null ? it.price_s : '';
    $('#mf_pm').value = it && it.price_m != null ? it.price_m : '';
    $('#mf_pl').value = it && it.price_l != null ? it.price_l : '';
    $('#mf_weight').value = it && it.weight_g != null ? it.weight_g : '';
    $('#mf_kcal').value = it && it.kcal != null ? it.kcal : '';
    $('#mf_prot').value = it && it.protein != null ? it.protein : '';
    $('#mf_fat').value = it && it.fat != null ? it.fat : '';
    $('#mf_carb').value = it && it.carb != null ? it.carb : '';
    $('#mf_badge').value = it ? (it.badge || '') : '';
    $('#mf_sort').value = it ? it.sort : 10;
    $('#mf_active').checked = it ? it.is_active : true;
    $('#mf_photo').value = it ? (it.photo_path || '') : '';
    $('#mf_file').value = '';
    $('#mfDelete').style.display = it ? '' : 'none';
    toggleCoffeeFields();
  }
  function toggleCoffeeFields(){
    var isCoffee = $('#mf_cat').value === 'coffee';
    $$('.mf-coffee').forEach(function(f){ f.style.display = isCoffee ? '' : 'none'; });
  }
  $('#mf_cat').addEventListener('change', toggleCoffeeFields);
  $('#btnNewItem').addEventListener('click', function(){ openMenuForm(null); });
  $('#mfCancel').addEventListener('click', function(){ $('#menuEditor').style.display = 'none'; });

  $('#mfSave').addEventListener('click', function(){
    var id = $('#mf_id').value;
    var isNew = !id;
    var name = $('#mf_name').value.trim();
    var msg = $('#mfMsg');
    if(!name){ msg.className = 'form-msg form-msg--err show'; msg.textContent = 'Введите название'; return; }
    var row = {
      name: name,
      venue: $('#mf_venue').value,
      category: $('#mf_cat').value,
      description: $('#mf_desc').value.trim(),
      price: num($('#mf_price').value),
      price_s: num($('#mf_ps').value),
      price_m: num($('#mf_pm').value),
      price_l: num($('#mf_pl').value),
      weight_g: num($('#mf_weight').value),
      kcal: num($('#mf_kcal').value),
      protein: num($('#mf_prot').value),
      fat: num($('#mf_fat').value),
      carb: num($('#mf_carb').value),
      badge: $('#mf_badge').value.trim() || null,
      sort: num($('#mf_sort').value) || 10,
      is_active: $('#mf_active').checked
    };
    var saveRow = function(photoPath){
      if(photoPath){ row.photo_path = photoPath; }
      var done = function(res){
        if(!res.ok){ msg.className = 'form-msg form-msg--err show'; msg.textContent = 'Ошибка сохранения'; return; }
        toast('Сохранено — обновите страницу сайта');
        logChange('menu_items', row.id || id, row);
        $('#menuEditor').style.display = 'none';
        loadMenu();
      };
      if(isNew){
        row.id = row.category + '-' + row.venue.slice(0, 3) + '-' + Date.now().toString(36);
        restInsert('menu_items', row).then(done);
      } else {
        restPatch('menu_items', 'id=eq.' + encodeURIComponent(id), row).then(done);
      }
    };
    var file = $('#mf_file').files[0];
    if(file){
      var key = 'menu/' + (id || (row.category + '-' + row.venue.slice(0,3) + '-' + Date.now().toString(36))) + '.jpg';
      msg.className = 'form-msg show'; msg.textContent = 'Загружаем фото…';
      uploadMedia(key, file, function(pub){
        if(!pub){ msg.className = 'form-msg form-msg--err show'; msg.textContent = 'Фото не загрузилось'; return; }
        saveRow(pub);
      });
    } else {
      saveRow(null);
    }
  });
  $('#mfDelete').addEventListener('click', function(){
    var id = $('#mf_id').value;
    if(!id || !confirm('Удалить позицию?')){ return; }
    restDelete('menu_items', 'id=eq.' + encodeURIComponent(id)).then(function(r){
      if(r.ok){ toast('Удалено'); logChange('menu_items', id, { deleted: true }); $('#menuEditor').style.display = 'none'; loadMenu(); }
    });
  });
  $('#fltVenue').addEventListener('change', loadMenu);
  $('#fltCat').addEventListener('change', loadMenu);

  function loadGallery(){
    var v = $('#galVenue').value;
    restList('gallery_photos', '?select=*&venue=eq.' + v + '&order=sort.asc').then(function(res){
      var box = $('#galList');
      box.innerHTML = '';
      if(!res.ok){ box.innerHTML = '<div class="row-item">Ошибка загрузки</div>'; return; }
      if(!res.j.length){ box.innerHTML = '<div class="row-item">Фото пока нет — добавьте первое</div>'; return; }
      res.j.forEach(function(p){
        var row = document.createElement('div');
        row.className = 'row-item';
        row.innerHTML =
          '<div class="gal-item" style="flex:1">' +
          '<img src="' + esc(p.path) + '" alt="">' +
          '<div class="gal-fields">' +
          '<div class="field"><label>Alt</label><input data-f="alt" value="' + esc(p.alt) + '"></div>' +
          '<div style="display:flex;gap:10px">' +
          '<div class="field" style="flex:1"><label>Сортировка</label><input data-f="sort" type="number" value="' + p.sort + '"></div>' +
          '<label class="check" style="align-items:flex-end;padding-bottom:14px"><input type="checkbox" data-f="active"' + (p.is_active ? ' checked' : '') + '> Показывать</label>' +
          '</div>' +
          '<div class="field"><label>Заменить фото</label><input type="file" data-f="file" accept="image/jpeg,image/png,image/webp"></div>' +
          '</div>' +
          '<div style="display:flex;flex-direction:column;gap:10px">' +
          '<button class="mini" data-act="save">Сохранить</button>' +
          '<button class="mini mini--warn" data-act="del">Удалить</button>' +
          '</div></div>';
        row.querySelector('[data-act="save"]').addEventListener('click', function(){
          var alt = row.querySelector('[data-f="alt"]').value;
          var sort = num(row.querySelector('[data-f="sort"]').value) || 0;
          var act = row.querySelector('[data-f="active"]').checked;
          var file = row.querySelector('[data-f="file"]').files[0];
          var save = function(path){
            var patch = { alt: alt, sort: sort, is_active: act };
            if(path){ patch.path = path; }
            restPatch('gallery_photos', 'id=eq.' + encodeURIComponent(p.id), patch).then(function(r){
              if(r.ok){ toast('Сохранено'); logChange('gallery_photos', p.id, patch); loadGallery(); }
            });
          };
          if(file){
            toast('Загружаем фото…');
            uploadMedia('gallery/' + p.id + '.jpg', file, function(pub){
              if(!pub){ toast('Фото не загрузилось'); return; }
              save(pub);
            });
          } else {
            save(null);
          }
        });
        row.querySelector('[data-act="del"]').addEventListener('click', function(){
          if(!confirm('Удалить фото из галереи?')){ return; }
          restDelete('gallery_photos', 'id=eq.' + encodeURIComponent(p.id)).then(function(r){
            if(r.ok){ toast('Удалено'); logChange('gallery_photos', p.id, { deleted: true }); loadGallery(); }
          });
        });
        box.appendChild(row);
      });
    });
  }
  $('#galVenue').addEventListener('change', loadGallery);
  $('#gaAdd').addEventListener('click', function(){
    var v = $('#galVenue').value;
    var file = $('#gaFile').files[0];
    var msg = $('#gaMsg');
    if(!file){ msg.className = 'form-msg form-msg--err show'; msg.textContent = 'Выберите файл'; return; }
    var id = v.slice(0, 3) + '-gal-' + Date.now().toString(36);
    msg.className = 'form-msg show'; msg.textContent = 'Загружаем…';
    uploadMedia('gallery/' + id + '.jpg', file, function(pub){
      if(!pub){ msg.className = 'form-msg form-msg--err show'; msg.textContent = 'Не загрузилось'; return; }
      restInsert('gallery_photos', {
        id: id, venue: v, path: pub,
        alt: $('#gaAlt').value.trim() || 'Баркас — наш вайб',
        sort: num($('#gaSort').value) || 10,
        is_active: true
      }).then(function(res){
        if(!res.ok){ msg.className = 'form-msg form-msg--err show'; msg.textContent = 'Ошибка сохранения'; return; }
        toast('Добавлено');
        logChange('gallery_photos', id, { created: true });
        $('#gaFile').value = ''; $('#gaAlt').value = '';
        msg.className = 'form-msg form-msg--ok show'; msg.textContent = 'Готово';
        loadGallery();
      });
    });
  });

  function loadPromos(){
    restList('promos', '?select=*&order=sort.asc').then(function(res){
      var box = $('#promoList');
      box.innerHTML = '';
      if(!res.ok){ box.innerHTML = '<div class="row-item">Ошибка загрузки</div>'; return; }
      res.j.forEach(function(p){
        var row = document.createElement('div');
        row.className = 'row-item';
        row.innerHTML =
          '<div class="grow"><b>' + esc(p.title) + '</b>' +
          '<small>' + esc(p.tag || '') + ' · ' + esc(venueName(p.venue)) + ' · ' + esc(p.value_text || '') + (p.is_active ? '' : ' · скрыта') + '</small></div>' +
          '<button class="mini" data-act="edit">Изменить</button>' +
          '<button class="mini" data-act="toggle">' + (p.is_active ? 'Скрыть' : 'Включить') + '</button>';
        row.querySelector('[data-act="edit"]').addEventListener('click', function(){
          $('#promoEditor').style.display = '';
          $('#pfHead').textContent = 'Изменение: ' + p.title;
          $('#pf_id').value = p.id;
          $('#pf_title').value = p.title;
          $('#pf_tag').value = p.tag || '';
          $('#pf_venue').value = p.venue || 'both';
          $('#pf_value').value = p.value_text || '';
          $('#pf_desc').value = p.description || '';
          $('#pf_rules').value = p.rules || '';
          $('#pf_sort').value = p.sort;
          $('#pf_active').checked = p.is_active;
          $('#pfDelete').style.display = '';
          $('#promoEditor').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
        row.querySelector('[data-act="toggle"]').addEventListener('click', function(){
          restPatch('promos', 'id=eq.' + encodeURIComponent(p.id), { is_active: !p.is_active }).then(function(r){
            if(r.ok){ toast('Обновлено'); loadPromos(); }
          });
        });
        box.appendChild(row);
      });
    });
  }
  $('#btnNewPromo').addEventListener('click', function(){
    $('#promoEditor').style.display = '';
    $('#pfHead').textContent = 'Новая акция';
    $('#pf_id').value = '';
    $('#pf_title').value = ''; $('#pf_tag').value = ''; $('#pf_value').value = '';
    $('#pf_desc').value = ''; $('#pf_rules').value = ''; $('#pf_sort').value = 10;
    $('#pf_active').checked = true;
    $('#pfDelete').style.display = 'none';
  });
  $('#pfCancel').addEventListener('click', function(){ $('#promoEditor').style.display = 'none'; });
  $('#pfSave').addEventListener('click', function(){
    var id = $('#pf_id').value;
    var row = {
      title: $('#pf_title').value.trim(),
      tag: $('#pf_tag').value.trim(),
      venue: $('#pf_venue').value,
      value_text: $('#pf_value').value.trim(),
      description: $('#pf_desc').value.trim(),
      rules: $('#pf_rules').value.trim(),
      sort: num($('#pf_sort').value) || 10,
      is_active: $('#pf_active').checked
    };
    if(!row.title){ toast('Введите заголовок'); return; }
    var done = function(res){
      if(!res.ok){ toast('Ошибка сохранения'); return; }
      toast('Сохранено');
      logChange('promos', row.id || id, row);
      $('#promoEditor').style.display = 'none';
      loadPromos();
    };
    if(id){
      restPatch('promos', 'id=eq.' + encodeURIComponent(id), row).then(done);
    } else {
      row.id = 'promo-' + Date.now().toString(36);
      restInsert('promos', row).then(done);
    }
  });
  $('#pfDelete').addEventListener('click', function(){
    var id = $('#pf_id').value;
    if(!id || !confirm('Удалить акцию?')){ return; }
    restDelete('promos', 'id=eq.' + encodeURIComponent(id)).then(function(r){
      if(r.ok){ toast('Удалено'); $('#promoEditor').style.display = 'none'; loadPromos(); }
    });
  });

  function loadBookings(){
    restList('bookings', '?select=*&order=created_at.desc&limit=100').then(function(res){
      var box = $('#bkList');
      if(!res.ok){ box.innerHTML = '<div class="row-item">Ошибка загрузки</div>'; return; }
      if(!res.j.length){ box.innerHTML = '<div class="row-item">Броней пока нет</div>'; return; }
      box.innerHTML = '<table><thead><tr><th>Создана</th><th>Заведение</th><th>Гость</th><th>Когда</th><th>Гостей</th><th>Статус</th></tr></thead><tbody></tbody></table>';
      var tb = box.querySelector('tbody');
      res.j.forEach(function(b){
        var tr = document.createElement('tr');
        var dt = (b.created_at || '').replace('T', ' ').slice(0, 16);
        tr.innerHTML =
          '<td>' + esc(dt) + '</td>' +
          '<td>' + esc(venueName(b.venue)) + '</td>' +
          '<td><b>' + esc(b.name) + '</b><br><a href="tel:' + esc(b.phone) + '" style="color:var(--a1)">' + esc(b.phone) + '</a></td>' +
          '<td>' + esc(b.date) + ' ' + esc(b.time) + '</td>' +
          '<td>' + esc(b.guests) + '</td>' +
          '<td><span class="bk-status st-' + esc(b.status) + '">' + ({ new: 'новая', confirmed: 'подтверждена', cancelled: 'отменена' }[b.status] || b.status) + '</span><br>' +
          '<select data-id="' + esc(b.id) + '" style="margin-top:6px;padding:5px 8px;border-radius:8px;background:var(--bg-3);color:var(--cream);border:1px solid var(--line-strong)">' +
          '<option value="new"' + (b.status === 'new' ? ' selected' : '') + '>новая</option>' +
          '<option value="confirmed"' + (b.status === 'confirmed' ? ' selected' : '') + '>подтверждена</option>' +
          '<option value="cancelled"' + (b.status === 'cancelled' ? ' selected' : '') + '>отменена</option>' +
          '</select></td>';
        tr.querySelector('select').addEventListener('change', function(e){
          restPatch('bookings', 'id=eq.' + e.target.getAttribute('data-id'), { status: e.target.value }).then(function(r){
            if(r.ok){ toast('Статус обновлён'); loadBookings(); }
          });
        });
        tb.appendChild(tr);
      });
    });
  }

  function loadSettings(){
    if(S.role !== 'owner'){ return; }
    restList('settings', '?select=*').then(function(res){
      if(!res.ok){ return; }
      res.j.forEach(function(s){
        if(s.key === 'promo_rules'){ $('#setRules').value = s.value; }
        if(s.key === 'tg_chat_id'){ $('#setChat').value = s.value === 'null' ? '' : s.value; }
      });
    });
  }
  $('#setSave').addEventListener('click', function(){
    req('/rest/v1/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify([{ key: 'promo_rules', value: $('#setRules').value }])
    }).then(function(r){
      toast(r.ok ? 'Правила сохранены' : 'Ошибка сохранения');
      if(r.ok){ logChange('settings', 'promo_rules', { updated: true }); }
    });
  });
  $('#chatSave').addEventListener('click', function(){
    var v = $('#setChat').value.trim();
    req('/rest/v1/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify([{ key: 'tg_chat_id', value: v }])
    }).then(function(r){
      toast(r.ok ? 'Chat ID сохранён' : 'Ошибка');
    });
  });
  $('#tgTest').addEventListener('click', function(){
    var msg = $('#tgMsg');
    msg.className = 'form-msg show';
    msg.textContent = 'Отправляем…';
    req('/rest/v1/rpc/tg_test_send', { method: 'POST' })
      .then(function(r){ return r.text(); })
      .then(function(t){
        if(t === '"sent"'){
          msg.className = 'form-msg form-msg--ok show';
          msg.textContent = 'Отправлено — проверьте Telegram.';
        } else {
          msg.className = 'form-msg form-msg--err show';
          msg.textContent = 'Ответ: ' + t + ' (проверьте, что выполнен tg-notify.sql и вы написали боту /start)';
        }
      });
  });

  $('#btnLogout').addEventListener('click', function(){
    clearSession();
    location.reload();
  });

  function showApp(){
    $('#loginView').style.display = 'none';
    $('#appView').style.display = '';
    $('#whoami').textContent = (S.email || '') + ' · ' + (S.role === 'owner' ? 'владелец' : 'редактор');
    if(S.role === 'owner'){ $('#tabSettings').style.display = ''; }
    loadMenu();
  }

  function boot(){
    if(!loadSession()){
      $('#loginView').style.display = 'flex';
      return;
    }
    restList('profiles', '?select=role&id=eq.' + S.uid).then(function(res){
      if(!res.ok || !res.j || !res.j.length || !res.j[0].role){
        clearSession();
        $('#loginView').style.display = 'flex';
        return;
      }
      S.role = res.j[0].role;
      saveSession();
      showApp();
    }).catch(function(){
      $('#loginView').style.display = 'flex';
    });
  }

  $('#adminLoginForm').addEventListener('submit', function(e){
    e.preventDefault();
    var msg = $('#alMsg');
    var email = $('#alEmail').value.trim();
    var pass = $('#alPass').value;
    msg.className = 'form-msg show';
    msg.textContent = 'Проверяем…';
    fetch(URL + '/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: { 'apikey': KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: pass })
    }).then(function(r){ return r.json().then(function(j){ return { ok: r.ok, j: j }; }); })
      .then(function(res){
        if(!res.ok || !res.j.access_token){
          msg.className = 'form-msg form-msg--err show';
          msg.textContent = 'Неверный логин или пароль.';
          return;
        }
        S.access = res.j.access_token;
        S.refresh = res.j.refresh_token;
        S.uid = res.j.user.id;
        S.email = email;
        return restList('profiles', '?select=role&id=eq.' + S.uid).then(function(pr){
          if(!pr.ok || !pr.j.length || !pr.j[0].role){
            msg.className = 'form-msg form-msg--err show';
            msg.textContent = 'Нет доступа. Выполните setup-admin.sql.';
            return;
          }
          S.role = pr.j[0].role;
          saveSession();
          showApp();
        });
      })
      .catch(function(){
        msg.className = 'form-msg form-msg--err show';
        msg.textContent = 'Нет связи с сервером.';
      });
  });

  boot();
})();
