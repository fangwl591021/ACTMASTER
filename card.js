/**
 * card.js 
 * Version: v20260419_1810 (QQ 完全體版：負責核心 CRUD、OCR 與 R2 上傳)
 */
const LIFF_ID = "2009367829-DLtYBDUm"; 
const WORKER_URL = "https://actmaster.fangwl591021.workers.dev"; 
const CACHE_KEY_CONTACTS = "app_cache_card_contacts_v1";

let compressedBase64 = "";
let userProfile = null;
let cropperInstance = null;
let globalCardContacts = []; 
let filteredCards = [];
let currentPage = 1;
const PAGE_LIMIT = 12;
let currentActiveCard = null; 
let isProcessing = false;
let isAdmin = false;
let currentCropTarget = '';

window.showToast = function(msg, isError = false) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.innerHTML = `<span class="material-symbols-outlined icon-filled">${isError ? 'error' : 'info'}</span> ${msg}`;
  t.className = `toast-message show ${isError ? 'bg-red-500' : 'bg-slate-800'}`;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000); 
};

window.fetchAPI = async function(action, payload = {}, silent = false) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); 
    const response = await fetch(WORKER_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload }), signal: controller.signal
    });
    clearTimeout(timeoutId);
    const resText = await response.text();
    let result;
    try { result = JSON.parse(resText); } catch(e) { throw new Error(`連線超時`); }
    if (!result.success) throw new Error(result.error);
    return result.data;
  } catch (err) {
    if (!silent) window.showToast(err.message, true); 
    throw err;
  }
};

window.getDirectImageUrl = function(url) { 
  if (!url || typeof url !== 'string') return url;
  const driveMatch = url.match(/id=([a-zA-Z0-9_-]+)/) || url.match(/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch && url.includes('drive.google.com')) return `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w1000`;
  return url;
};

window.getTrueAspectRatio = function(url) {
  return new Promise((resolve) => {
    if (!url) return resolve('20:13');
    const img = new Image();
    img.onload = function() { 
        let w = this.width; let h = this.height; 
        if (w === 0 || h === 0) return resolve('20:13');
        resolve(`${w}:${h}`); 
    };
    img.onerror = function() { resolve('20:13'); };
    img.src = url;
  });
};

function formatPhoneStr(val) {
  if (!val) return '';
  let s = String(val).replace(/[^\d+]/g, '');
  if (s.startsWith('+886')) s = '0' + s.substring(4);
  else if (s.startsWith('886') && s.length >= 11) s = '0' + s.substring(3);
  if (/^9\d{8}$/.test(s)) s = '0' + s;
  return s;
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await liff.init({ liffId: LIFF_ID });
    if (!liff.isLoggedIn()) { liff.login({ redirectUri: window.location.href }); return; }
    userProfile = await liff.getProfile();
    
    const userAvatar = document.getElementById('userAvatar');
    if (userAvatar) { userAvatar.src = userProfile.pictureUrl; userAvatar.classList.remove('hidden'); }
    document.getElementById('user-profile-badge')?.classList.remove('hidden');

    const ADMIN_IDS = ["Uf729764dbb5b652a5a90a467320bea29", "U58eb5c1a747450140ce1335af709ae55", "U8932b891ad24da512afb9c1a6f41567b"];
    isAdmin = ADMIN_IDS.includes(userProfile.userId);
    
    if (isAdmin) {
        document.getElementById('bottom-nav-admin')?.classList.remove('hidden');
        document.getElementById('roleSwitchBtn')?.classList.remove('hidden');
    } else {
        document.getElementById('bottom-nav-user')?.classList.remove('hidden');
    }
    
    window.switchView('list');
    loadCardContacts();
  } catch (err) {
    window.showToast("LINE 初始化失敗", true);
  }
});

window.switchView = function(view) {
  ['loadingView', 'listView', 'processView'].forEach(v => { document.getElementById(v)?.classList.add('hidden'); });
  document.getElementById(`${view}View`)?.classList.remove('hidden');
}

window.switchProcessSection = function(id) {
  ['section-loading', 'section-form'].forEach(v => { document.getElementById(v)?.classList.add('hidden'); });
  document.getElementById(id)?.classList.remove('hidden');
}

window.resetUI = function() {
  compressedBase64 = "";
  document.getElementById('cameraInput').value = "";
  document.getElementById('galleryInput').value = "";
  window.switchView('list');
}

async function loadCardContacts() { 
    try {
        const data = await window.fetchAPI('getCardContacts', {}, true);
        globalCardContacts = data || [];
        window.filterCardList();
    } catch(e) { }
    finally { document.getElementById('loadingView')?.classList.add('hidden'); }
}

window.reloadCardContacts = async function() {
    const btn = document.getElementById('btn-refresh-cards');
    btn?.classList.add('animate-spin');
    await loadCardContacts();
    btn?.classList.remove('animate-spin');
    window.showToast("✅ 名單已同步");
}

window.filterCardList = function() { 
    const term = document.getElementById('searchInput')?.value.toLowerCase() || '';
    filteredCards = globalCardContacts.filter(c => (c['姓名'] || '').toLowerCase().includes(term) || (c['公司名稱'] || '').toLowerCase().includes(term));
    currentPage = 1;
    window.renderCardPage(true);
}

window.renderCardPage = function(isReset = false) {
    const container = document.getElementById('admin-card-list-container');
    if (!container) return;
    let html = filteredCards.map(c => `
        <div onclick="window.openCardDetailByRowId('${c.rowId}')" class="p-5 bg-white flex items-center gap-4 rounded-[2rem] shadow-sm mb-3 cursor-pointer border border-slate-100 active:scale-[0.98] transition-all">
          <div class="w-[56px] h-[56px] shrink-0 rounded-2xl overflow-hidden bg-slate-50 flex items-center justify-center border border-slate-50">
            ${c['名片圖檔'] && c['名片圖檔'].startsWith('http') ? `<img src="${window.getDirectImageUrl(c['名片圖檔'])}" class="w-full h-full object-cover">` : `<span class="material-symbols-outlined text-slate-300">contact_mail</span>`}
          </div>
          <div class="flex-1 overflow-hidden flex flex-col justify-center gap-0.5">
            <h4 class="text-[17px] font-black text-slate-800 truncate">${c['姓名'] || '未知'}</h4>
            <p class="text-[12px] text-slate-400 font-bold truncate tracking-wide">${c['公司名稱'] || '無資訊'}</p>
          </div>
        </div>
    `).join('');
    container.innerHTML = html;
}

window.openCardDetailByRowId = function(rowId) { 
    const card = globalCardContacts.find(c => String(c.rowId) === String(rowId));
    if(!card) return;
    currentActiveCard = card; 
    
    document.getElementById('ro-name').innerText = card['姓名'] || '未知姓名';
    document.getElementById('ro-title').innerText = card['職稱'] || '尚未填寫職稱';
    document.getElementById('ro-company').innerText = card['公司名稱'] || '尚未填寫公司';
    
    const mLink = document.getElementById('ro-mobile-link');
    const phone = formatPhoneStr(card['手機號碼']);
    mLink.innerText = phone || '未提供電話';
    mLink.href = phone ? `tel:${phone}` : '#';
    
    const eLink = document.getElementById('ro-email-link');
    eLink.innerText = card['電子郵件'] || '未提供電子信箱';
    eLink.href = card['電子郵件'] ? `mailto:${card['電子郵件']}` : '#';
    
    const imgEl = document.getElementById('ro-image');
    const noImgEl = document.getElementById('ro-no-image');
    if (card['名片圖檔'] && card['名片圖檔'].startsWith('http')) {
        imgEl.src = window.getDirectImageUrl(card['名片圖檔']);
        imgEl.classList.remove('hidden'); noImgEl.classList.add('hidden');
    } else {
        imgEl.classList.add('hidden'); noImgEl.classList.remove('hidden');
    }
    
    document.getElementById('ro-notes').innerText = card['服務項目/品牌標語'] || '目前無詳細說明。';
    document.getElementById('readonly-card-modal').classList.remove('hidden');
}

window.closeReadOnlyCard = function() { document.getElementById('readonly-card-modal').classList.add('hidden'); }

window.openCardEdit = function() { 
    const c = currentActiveCard;
    document.getElementById('edit-c-Name').value = c['姓名'] || '';
    document.getElementById('edit-c-CompanyName').value = c['公司名稱'] || '';
    document.getElementById('edit-c-Mobile').value = formatPhoneStr(c['手機號碼']);
    document.getElementById('edit-c-Title').value = c['職稱'] || '';
    document.getElementById('edit-c-Slogan').value = c['服務項目/品牌標語'] || '';
    document.getElementById('edit-c-Notes').value = c['建檔人/備註'] || '';
    document.getElementById('card-edit-modal').classList.remove('hidden');
}

window.closeCardEdit = function() { document.getElementById('card-edit-modal').classList.add('hidden'); }

window.submitCardEdit = async function() {
    const btn = document.getElementById('btn-save-card-edit');
    btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-[18px]">refresh</span> 儲存中...';
    btn.classList.add('pointer-events-none', 'opacity-70');
    
    const payload = {
        rowId: currentActiveCard.rowId,
        Name: document.getElementById('edit-c-Name').value,
        CompanyName: document.getElementById('edit-c-CompanyName').value,
        Mobile: document.getElementById('edit-c-Mobile').value,
        Title: document.getElementById('edit-c-Title').value,
        Slogan: document.getElementById('edit-c-Slogan').value,
        Notes: document.getElementById('edit-c-Notes').value
    };
    
    try {
        await window.fetchAPI('updateCard', payload);
        window.showToast('✅ 資料更新成功');
        window.closeCardEdit();
        loadCardContacts();
        window.openCardDetailByRowId(payload.rowId);
    } catch(e) {}
    finally {
        btn.innerHTML = '儲存變更並重新分析';
        btn.classList.remove('pointer-events-none', 'opacity-70');
    }
}

window.openCamera = () => document.getElementById('cameraInput').click();
window.openGallery = () => document.getElementById('galleryInput').click();
window.handleCameraInput = (e) => { if(e.target.files[0]) window.openCropper(e.target.files[0], 'ocr'); };
window.handleGalleryInput = (e) => { if(e.target.files[0]) window.openCropper(e.target.files[0], 'ocr'); };

window.openCropper = function(file, target) {
    currentCropTarget = target;
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = document.getElementById('cropper-image');
        img.src = e.target.result;
        img.onload = () => {
            document.getElementById('section-image-cropper').classList.remove('hidden');
            if (cropperInstance) cropperInstance.destroy();
            cropperInstance = new Cropper(img, { aspectRatio: NaN, viewMode: 1, dragMode: 'move', autoCropArea: 0.9 });
            img.style.opacity = '1';
        };
    };
    reader.readAsDataURL(file);
}

window.cancelCrop = function() {
    if (cropperInstance) cropperInstance.destroy();
    document.getElementById('section-image-cropper').classList.add('hidden');
}

window.confirmCrop = async function() {
    if (!cropperInstance) return;
    const canvas = cropperInstance.getCroppedCanvas({ maxWidth: 1200 });
    const b64 = canvas.toDataURL('image/jpeg', 0.8);
    window.cancelCrop();
    
    if (currentCropTarget === 'ecard' || currentCropTarget === 'v2logo') {
        window.showToast("⏳ 圖片上傳至 CDN...");
        const url = await window.fetchAPI('uploadImage', { base64Image: b64 });
        if (currentCropTarget === 'v2logo') document.getElementById('ec-v2-logo-url').value = url;
        else document.getElementById('ec-img-input').value = url;
        if(typeof window.updateECardPreview === 'function') window.updateECardPreview();
        return;
    }
    
    compressedBase64 = b64;
    document.getElementById('process-preview-image').src = b64;
    window.switchView('process');
    window.switchProcessSection('section-loading');
    
    try {
        const data = await window.fetchAPI('recognizeCard', { base64Image: b64 });
        const fields = ['Name', 'CompanyName', 'Mobile', 'Title', 'Slogan', 'Notes'];
        fields.forEach(f => { 
            const el = document.getElementById(`f-${f}`); 
            if(el) { el.value = data[f] || ''; if(f === 'Mobile') el.value = formatPhoneStr(el.value); }
        });
        window.switchProcessSection('section-form');
    } catch(e) { window.resetUI(); }
}

window.saveToCloud = async function() {
    const btn = document.getElementById('btn-save');
    btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-[18px]">refresh</span> 寫入中...';
    btn.classList.add('pointer-events-none', 'opacity-70');

    try {
        // 先轉為 R2 URL
        const r2Url = await window.fetchAPI('uploadImage', { base64Image: compressedBase64 });
        const payload = { 
            base64Image: r2Url,
            userId: userProfile.userId
        };
        const fields = ['Name', 'CompanyName', 'Mobile', 'Title', 'Slogan', 'Notes'];
        fields.forEach(f => { payload[f] = document.getElementById(`f-${f}`).value; });
        
        await window.fetchAPI('saveCard', payload);
        window.showToast('🎉 名片建立成功！');
        window.resetUI();
        loadCardContacts();
    } catch(e) {}
    finally {
        btn.innerHTML = '💾 存入雲端通訊錄';
        btn.classList.remove('pointer-events-none', 'opacity-70');
    }
}
