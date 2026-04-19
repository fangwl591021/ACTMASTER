/**
 * card.js 
 * Version: v20260419_1530 (QQ 退版版：保持 R2 上傳架構，但不修復後續衝突)
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
const PAGE_LIMIT = 10;
let currentActiveCard = null; 
let isProcessing = false;
let isAdmin = false;
let myCardOpened = false;
let currentCropTarget = '';

window.showToast = function(msg, isError = false) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.innerHTML = `<span class="material-symbols-outlined icon-filled">${isError ? 'error' : 'info'}</span> ${msg}`;
  t.className = `fixed top-14 left-1/2 -translate-x-1/2 px-5 py-3 rounded-full text-[14px] shadow-lg transition-all font-bold flex items-center gap-2 w-max max-w-[90vw] ${isError ? 'bg-red-500 text-white border-red-600' : 'bg-slate-800 text-white border-slate-700'} opacity-100`;
  t.classList.remove('hidden');
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translate(-50%, -1rem)'; setTimeout(() => t.classList.add('hidden'), 300); }, 3000); 
};

window.fetchAPI = async function(action, payload = {}, silent = false) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); 
    const response = await fetch(WORKER_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload }), signal: controller.signal
    });
    clearTimeout(timeoutId);
    const resText = await response.text();
    let result;
    try { result = JSON.parse(resText); } catch(e) { throw new Error(`系統連線失敗`); }
    if (!result.success) throw new Error(result.error);
    return result.data;
  } catch (err) {
    if (!silent) window.showToast(err.message, true); 
    throw err;
  }
};

window.getDirectImageUrl = function(url) { 
  if (!url) return url;
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
        let ratio = w / h;
        resolve(`${Math.round(w)}:${Math.round(h)}`); 
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
    const ADMIN_IDS = ["Uf729764dbb5b652a5a90a467320bea29", "U58eb5c1a747450140ce1335af709ae55", "U8932b891ad24da512afb9c1a6f41567b"];
    isAdmin = ADMIN_IDS.includes(userProfile.userId);
    
    if (isAdmin) {
        document.getElementById('bottom-nav-admin')?.classList.remove('hidden');
    } else {
        document.getElementById('bottom-nav-user')?.classList.remove('hidden');
    }
    
    window.switchView('list');
    loadCardContacts();
  } catch (err) {
    window.showToast("初始化失敗", true);
  }
});

window.switchView = function(view) {
  ['loadingView', 'listView', 'processView'].forEach(v => { const el = document.getElementById(v); if (el) el.classList.add('hidden'); });
  const target = document.getElementById(`${view}View`); if (target) target.classList.remove('hidden');
}

window.switchProcessSection = function(id) {
  ['section-loading', 'section-form'].forEach(v => { const el = document.getElementById(v); if (el) el.classList.add('hidden'); });
  const target = document.getElementById(id); if (target) target.classList.remove('hidden');
}

window.resetUI = function() {
  compressedBase64 = "";
  window.switchView('list');
}

async function loadCardContacts() { 
    try {
        const data = await window.fetchAPI('getCardContacts', {}, true);
        globalCardContacts = data || [];
        window.filterCardList();
    } catch(e) { }
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
        <div onclick="window.openCardDetailByRowId('${c.rowId}')" class="p-5 bg-white flex items-center gap-4 rounded-[2rem] shadow-sm mb-3 cursor-pointer">
          <div class="w-[56px] h-[56px] shrink-0 rounded-2xl overflow-hidden bg-slate-50 flex items-center justify-center border border-slate-100">
            <img src="${window.getDirectImageUrl(c['名片圖檔'])}" class="w-full h-full object-cover">
          </div>
          <div class="flex-1 overflow-hidden flex flex-col justify-center gap-1">
            <h4 class="text-[17px] font-extrabold text-slate-800 truncate">${c['姓名'] || '未知'}</h4>
            <p class="text-[13px] text-slate-500 font-medium truncate">${c['公司名稱'] || '無資訊'}</p>
          </div>
        </div>
    `).join('');
    container.innerHTML = html;
}

window.openCardDetailByRowId = function(rowId) { 
    const card = globalCardContacts.find(c => String(c.rowId) === String(rowId));
    if(!card) return;
    currentActiveCard = card; 
    
    document.getElementById('ro-name').innerText = card['姓名'] || '未知';
    document.getElementById('ro-title').innerText = card['職稱'] || '';
    document.getElementById('ro-company').innerText = card['公司名稱'] || '';
    document.getElementById('ro-mobile-link').innerText = card['手機號碼'] || '';
    document.getElementById('ro-email-link').innerText = card['電子郵件'] || '';
    document.getElementById('ro-image').src = window.getDirectImageUrl(card['名片圖檔']);
    document.getElementById('ro-notes').innerText = card['服務項目/品牌標語'] || '';

    document.getElementById('readonly-card-modal').classList.remove('hidden');
}

window.closeReadOnlyCard = function() { document.getElementById('readonly-card-modal').classList.add('hidden'); }

window.openCardEdit = function() { 
    const c = currentActiveCard;
    document.getElementById('edit-c-Name').value = c['姓名'] || '';
    document.getElementById('edit-c-CompanyName').value = c['公司名稱'] || '';
    document.getElementById('edit-c-Mobile').value = c['手機號碼'] || '';
    document.getElementById('edit-c-Title').value = c['職稱'] || '';
    document.getElementById('card-edit-modal').classList.remove('hidden');
}

window.closeCardEdit = function() { document.getElementById('card-edit-modal').classList.add('hidden'); }

window.openCamera = () => document.getElementById('cameraInput').click();
window.openGallery = () => document.getElementById('galleryInput').click();
window.handleCameraInput = (e) => { if(e.target.files[0]) window.openCropper(e.target.files[0], 'ocr'); };

window.openCropper = function(file, target) {
    currentCropTarget = target;
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = document.getElementById('cropper-image');
        img.src = e.target.result;
        img.onload = () => {
            document.getElementById('section-image-cropper').classList.remove('hidden');
            if (cropperInstance) cropperInstance.destroy();
            cropperInstance = new Cropper(img, { aspectRatio: NaN, viewMode: 1 });
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
        const url = await window.fetchAPI('uploadImage', { base64Image: b64 });
        if (currentCropTarget === 'v2logo') document.getElementById('ec-v2-logo-url').value = url;
        else document.getElementById('ec-img-input').value = url;
        window.updateECardPreview();
        return;
    }
    
    compressedBase64 = b64;
    document.getElementById('process-preview-image').src = b64;
    window.switchView('process');
    window.switchProcessSection('section-loading');
    
    const data = await window.fetchAPI('recognizeCard', { base64Image: b64 });
    const fields = ['Name', 'CompanyName', 'Mobile', 'Title', 'Slogan', 'Notes'];
    fields.forEach(f => { const el = document.getElementById(`f-${f}`); if(el) el.value = data[f] || ''; });
    window.switchProcessSection('section-form');
}

window.saveToCloud = async function() {
    const payload = { 
        base64Image: compressedBase64,
        userId: userProfile.userId
    };
    const fields = ['Name', 'CompanyName', 'Mobile', 'Title', 'Slogan', 'Notes'];
    fields.forEach(f => { payload[f] = document.getElementById(`f-${f}`).value; });
    await window.fetchAPI('saveCard', payload);
    window.resetUI();
    loadCardContacts();
}
