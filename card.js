/**
 * card.js 
 * Version: v3.0.1 (確保 rowId 導航邏輯完美運作)
 */
const LIFF_ID = "2009367829-DLtYBDUm"; 
const WORKER_URL = "https://actmaster.fangwl591021.workers.dev"; 

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
  setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.classList.add('hidden'), 300); }, 3000); 
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
    try { result = JSON.parse(resText); } catch(e) { throw new Error(`伺服器回應異常`); }
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
    img.onload = function() { resolve(`${Math.round(this.width)}:${Math.round(this.height)}`); };
    img.onerror = function() { resolve('20:13'); };
    img.src = url;
  });
};

function formatPhoneStr(val) {
  if (!val) return '';
  let str = String(val).trim();
  let matches = str.match(/(?:\+?\d[\d\-\s]{7,18}\d)/g);
  let targetStr = (matches && matches.length > 0) ? matches[0] : str;
  let s = targetStr.replace(/[^\d+]/g, '');
  if (s.startsWith('886')) s = '0' + s.substring(3);
  if (s.length === 9 && s.startsWith('9')) s = '0' + s;
  return s;
}

function checkAndOpenMyCard() {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const targetRowId = params.get('rowId');

    if (mode !== 'mycard' || myCardOpened) return;

    let targetCard = null;
    
    // ⭐ DOM 防呆：首頁傳過來的 rowId 絕對信任，打破退回首頁的死胡同
    if (targetRowId && globalCardContacts.length > 0) {
        targetCard = globalCardContacts.find(c => String(c.rowId) === String(targetRowId));
    } else if (globalCardContacts.length > 0) {
        targetCard = globalCardContacts.find(c => String(c['LINE ID']).trim() === userProfile.userId || String(c.userId).trim() === userProfile.userId);
    }

    if (targetCard) {
        myCardOpened = true;
        window.openCardDetailByRowId(targetCard.rowId);
    } else {
        window.showToast("找不到對應的名片紀錄", true);
        setTimeout(() => window.location.href = 'index.html?view=user-profile', 2000);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await liff.init({ liffId: LIFF_ID });
    if (!liff.isLoggedIn()) { liff.login({ redirectUri: window.location.href }); return; }
    
    userProfile = await liff.getProfile();
    const ADMIN_IDS = ["Uf729764dbb5b652a5a90a467320bea29", "U58eb5c1a747450140ce1335af709ae55", "U8932b891ad24da512afb9c1a6f41567b"];
    isAdmin = ADMIN_IDS.includes(userProfile.userId);

    if (new URLSearchParams(window.location.search).get('mode') === 'mycard') {
        loadCardContacts();
        return; 
    }

    const userAvatarEl = document.getElementById('user-avatar');
    if (userAvatarEl) userAvatarEl.src = userProfile.pictureUrl || '';
    
    const userProfileBadge = document.getElementById('user-profile-badge');
    if (userProfileBadge) userProfileBadge.classList.remove('hidden');
    
    if (!isAdmin) { 
        document.getElementById('role-switch-btn')?.remove(); 
        document.getElementById('admin-tools-container')?.remove(); 
        document.getElementById('bottom-nav-admin')?.remove(); 
    }
    
    switchView('list');
    loadCardContacts();
  } catch (err) {
    window.showToast("初始化失敗", true);
  }
});

function switchView(view) {
  ['view-loading', 'view-list', 'view-process'].forEach(v => { const el = document.getElementById(v); if (el) el.classList.add('hidden'); });
  const target = document.getElementById(`view-${view}`); if (target) target.classList.remove('hidden');
}

async function loadCardContacts() { 
    try {
        const data = await window.fetchAPI('getCardContacts', {}, true);
        globalCardContacts = data || [];
        
        if (new URLSearchParams(window.location.search).get('mode') === 'mycard') {
            checkAndOpenMyCard();
        } else {
            filterCardList(); 
        }
    } catch(e) {
        const container = document.getElementById('admin-card-list-container');
        if (container) container.innerHTML = `<div class="text-center py-10 text-error font-bold">連線異常</div>`;
    }
}

function filterCardList() { 
    if (!isAdmin) return;
    const term = document.getElementById('card-search-input')?.value.toLowerCase() || '';
    filteredCards = globalCardContacts.filter(c => (c['姓名'] || '').toLowerCase().includes(term) || (c['公司名稱'] || '').toLowerCase().includes(term));
    currentPage = 1;
    renderCardPage(true);
}

function renderCardPage(isReset = false) {
    const container = document.getElementById('admin-card-list-container');
    if (!container) return;
    if (filteredCards.length === 0) { container.innerHTML = '<div class="text-center py-16 text-slate-500">查無名片</div>'; return; }

    const pageData = filteredCards.slice((currentPage - 1) * PAGE_LIMIT, currentPage * PAGE_LIMIT);
    let html = pageData.map(c => `
        <div onclick="window.openCardDetailByRowId('${c.rowId}')" class="p-4 bg-white flex items-center gap-4 border-b border-slate-100 cursor-pointer">
          <div class="w-12 h-12 rounded-full overflow-hidden bg-slate-100"><img src="${window.getDirectImageUrl(c['名片圖檔'])}" class="w-full h-full object-cover"></div>
          <div><h4 class="text-[16px] font-bold text-slate-800">${c['姓名']}</h4><p class="text-[13px] text-slate-500">${c['公司名稱']}</p></div>
        </div>
    `).join('');

    if (isReset) container.innerHTML = html; else container.insertAdjacentHTML('beforeend', html);
    const box = document.getElementById('card-load-more-box');
    if(box) box.classList.toggle('hidden', currentPage * PAGE_LIMIT >= filteredCards.length);
}
function loadMoreCards() { currentPage++; renderCardPage(false); }

window.openCardDetailByRowId = function(rowId) { 
    const card = globalCardContacts.find(c => String(c.rowId) === String(rowId));
    if(!card) return;
    currentActiveCard = card; 
    
    const setName = document.getElementById('ro-name'); if (setName) setName.innerText = card['姓名'] || '無姓名';
    const setTitle = document.getElementById('ro-title'); if (setTitle) setTitle.innerText = [card['職稱'], card['部門']].filter(Boolean).join(' / ') || '無職稱';
    const setCompany = document.getElementById('ro-company'); if (setCompany) setCompany.innerText = card['公司名稱'] || '未提供';
    const setTax = document.getElementById('ro-taxid'); if (setTax) setTax.innerText = card['統一編號'] || '未提供';
    const setTel = document.getElementById('ro-tel'); if (setTel) setTel.innerText = card['公司電話'] || '未提供';
    const setAddr = document.getElementById('ro-address'); if (setAddr) setAddr.innerText = card['公司地址'] || '未提供';
    
    const phone = formatPhoneStr(card['手機號碼']);
    const mLink = document.getElementById('ro-mobile-link');
    if (mLink) { mLink.innerText = phone || '未提供'; mLink.href = phone ? `tel:${phone}` : '#'; }
    
    const email = card['電子郵件'];
    const eLink = document.getElementById('ro-email-link');
    if (eLink) { eLink.innerText = email || '未提供'; eLink.href = email ? `mailto:${email}` : '#'; }
    
    const notesEl = document.getElementById('ro-notes');
    if (notesEl) notesEl.innerText = card['服務項目/品牌標語'] || '無資訊';
    
    const imgEl = document.getElementById('ro-image');
    if (imgEl) {
        if (card['名片圖檔'] && card['名片圖檔'].startsWith('http')) {
          imgEl.src = window.getDirectImageUrl(card['名片圖檔']);
          imgEl.classList.remove('hidden');
        } else {
          imgEl.classList.add('hidden');
        }
    }
    
    if (isAdmin) {
        const shareBtn = document.getElementById('btn-share-claim');
        if (shareBtn) shareBtn.classList.remove('hidden');
    }
    
    const modal = document.getElementById('readonly-card-modal');
    if (modal) modal.classList.remove('hidden');
    switchView('list');
}

window.closeReadOnlyCard = function() { 
    if (new URLSearchParams(window.location.search).get('mode') === 'mycard') {
        window.location.href = 'index.html?view=user-profile';
    } else {
        const modal = document.getElementById('readonly-card-modal');
        if (modal) modal.classList.add('hidden'); 
    }
}

window.openCardEdit = function() { 
    const c = currentActiveCard; if (!c) return;
    const fields = { 'edit-c-Name': c['姓名'], 'edit-c-EnglishName': c['英文名/別名'], 'edit-c-Title': c['職稱'], 'edit-c-Department': c['部門'], 'edit-c-CompanyName': c['公司名稱'], 'edit-c-TaxID': c['統一編號'], 'edit-c-Mobile': formatPhoneStr(c['手機號碼']), 'edit-c-Tel': formatPhoneStr(c['公司電話']), 'edit-c-Ext': c['分機'], 'edit-c-Fax': c['傳真'], 'edit-c-Address': c['公司地址'], 'edit-c-Email': c['電子郵件'], 'edit-c-Website': c['公司網址'], 'edit-c-SocialMedia': c['社群帳號'], 'edit-c-Slogan': c['服務項目/品牌標語'], 'edit-c-Notes': c['建檔人/備註'] };
    for (const [id, val] of Object.entries(fields)) { const el = document.getElementById(id); if (el) el.value = val || ''; }
    
    const modal = document.getElementById('card-edit-modal');
    if (modal) modal.classList.remove('hidden');
}

window.closeCardEdit = function() { 
    const modal = document.getElementById('card-edit-modal');
    if (modal) modal.classList.add('hidden'); 
}

window.submitCardEdit = async function() {
  if (isProcessing || !currentActiveCard) return;
  isProcessing = true;
  
  const btn = document.getElementById('btn-save-card-edit');
  if (btn) btn.innerText = '儲存中...';
  
  const payload = { rowId: currentActiveCard.rowId, Name: document.getElementById('edit-c-Name')?.value, Title: document.getElementById('edit-c-Title')?.value, CompanyName: document.getElementById('edit-c-CompanyName')?.value, Mobile: document.getElementById('edit-c-Mobile')?.value, Email: document.getElementById('edit-c-Email')?.value, Address: document.getElementById('edit-c-Address')?.value, Slogan: document.getElementById('edit-c-Slogan')?.value };
  
  try {
    await window.fetchAPI('updateCard', payload);
    window.showToast("✅ 資料更新成功");
    window.closeCardEdit();
    loadCardContacts();
  } catch(err) { 
      window.showToast("更新失敗", true); 
  } finally { 
      isProcessing = false; 
      if (btn) btn.innerText = '儲存變更'; 
  }
}

window.openCropper = async function(input, targetMode) {
    const file = input.files[0]; if (!file) return;
    currentCropTarget = targetMode;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.getElementById('cropper-image'); 
      if (!img) return;
      img.src = e.target.result; img.style.opacity = '0';
      const modal = document.getElementById('section-image-cropper');
      if (modal) modal.classList.remove('hidden');
      if (cropperInstance) cropperInstance.destroy();
      setTimeout(() => { img.style.opacity = '1'; cropperInstance = new Cropper(img, { aspectRatio: NaN, viewMode: 1, dragMode: 'move', autoCropArea: 0.9, guides: true, center: true, highlight: false }); }, 100);
    }; 
    reader.readAsDataURL(file); input.value = ""; 
}

window.cancelCrop = function() { 
    if (cropperInstance) { cropperInstance.destroy(); cropperInstance = null; } 
    const modal = document.getElementById('section-image-cropper');
    if (modal) modal.classList.add('hidden'); 
}

window.confirmCrop = function() { 
    if (!cropperInstance) return; 
    let quality = 0.8; let base64 = cropperInstance.getCroppedCanvas({ maxWidth: 1000, maxHeight: 1000 }).toDataURL('image/webp', quality); 
    while (base64.length > 40000 && quality > 0.1) { quality -= 0.1; base64 = cropperInstance.getCroppedCanvas({ maxWidth: 1000, maxHeight: 1000 }).toDataURL('image/webp', quality); }
    window.cancelCrop(); 
    if (currentCropTarget === 'card') {
      compressedBase64 = base64;
      const prevImg = document.getElementById('process-preview-image');
      if (prevImg) prevImg.src = compressedBase64;
      
      switchView('process');
      const secLoading = document.getElementById('section-loading');
      if (secLoading) secLoading.classList.remove('hidden');
      const secForm = document.getElementById('section-form');
      if (secForm) secForm.classList.add('hidden');
      
      window.fetchAPI('recognizeCard', { base64Image: compressedBase64 }).then(data => {
         const fields = ['Name', 'EnglishName', 'Title', 'Department', 'CompanyName', 'TaxID', 'Mobile', 'Tel', 'Ext', 'Fax', 'Address', 'Email', 'Website', 'SocialMedia', 'Slogan'];
         fields.forEach(f => {
            const el = document.getElementById(`f-${f}`);
            if(el) el.value = data[f] || '';
         });
         if (secLoading) secLoading.classList.add('hidden');
         if (secForm) secForm.classList.remove('hidden');
      });
    }
}
