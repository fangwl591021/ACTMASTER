/**
 * card.js 
 * Version: v20260419_1530 (QQ 防爆分離版：拔除 E-card 內嵌邏輯，專注 CRUD 與 R2 上傳)
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

window.addEventListener('unhandledrejection', function() {
    const spinner = document.querySelector('#view-loading .animate-spin');
    if (spinner) spinner.classList.add('hidden');
    const loadText = document.getElementById('loading-text');
    if (loadText) loadText.innerText = "系統發生未預期錯誤";
    window.switchView('list');
});

window.showToast = function(msg, isError = false) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.innerHTML = `<span class="material-symbols-outlined icon-filled">${isError ? 'error' : 'info'}</span> ${msg}`;
  t.className = `fixed top-14 left-1/2 -translate-x-1/2 px-5 py-3 rounded-full text-[14px] shadow-lg transition-all font-bold flex items-center gap-2 w-max max-w-[90vw] ${isError ? 'bg-red-500 text-white border-red-600' : 'bg-slate-800 text-white border-slate-700'} opacity-100 z-[10000]`;
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
        if (ratio > 3) { w = 300; h = 100; }
        else if (ratio < 0.334) { w = 100; h = 300; }
        resolve(`${Math.round(w)}:${Math.round(h)}`); 
    };
    img.onerror = function() { 
        if (url.includes('line-scdn') || url.includes('linevoom')) resolve('9:16');
        else resolve('20:13'); 
    };
    img.src = url;
  });
};

function formatPhoneStr(val) {
  if (!val) return '';
  let str = String(val).trim();
  let matches = str.match(/(?:\+?\d[\d\-\s]{7,18}\d)/g);
  let targetStr = (matches && matches.length > 0) ? matches[0] : str;
  let s = targetStr.replace(/[^\d+]/g, '');
  if (s.startsWith('+886')) s = '0' + s.substring(4);
  else if (s.startsWith('886') && s.length >= 11) s = '0' + s.substring(3);
  if (/^9\d{8}$/.test(s)) s = '0' + s;
  if (s.length > 10 && s.startsWith('09')) {
      s = s.substring(0, 10);
  }
  return s;
}

function setButtonLoading(btnId, isLoading, originalText = '') {
    const btn = document.getElementById(btnId);
    if (!btn) return false;
    if (isLoading) {
        if (!btn.dataset.oriText) btn.dataset.oriText = btn.innerHTML;
        btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-[20px] align-middle">refresh</span>';
        btn.classList.add('opacity-50', 'pointer-events-none');
        return true;
    } else {
        btn.innerHTML = originalText || btn.dataset.oriText || '送出';
        btn.classList.remove('opacity-50', 'pointer-events-none');
        return false;
    }
}

function checkAndOpenMyCard() {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const targetRowId = params.get('rowId');

    if (mode !== 'mycard' || myCardOpened) return;

    let targetCard = null;
    
    if (targetRowId && globalCardContacts.length > 0) {
        targetCard = globalCardContacts.find(c => String(c.rowId) === String(targetRowId));
    } else if (globalCardContacts.length > 0) {
        targetCard = globalCardContacts.find(c => String(c['LINE ID']).trim() === userProfile.userId || String(c.userId).trim() === userProfile.userId);
    }

    if (targetCard) {
        myCardOpened = true;
        if(typeof window.openCardDetailByRowId === 'function') window.openCardDetailByRowId(targetCard.rowId);
    } else {
        window.switchView('list'); 
        window.showToast("找不到對應的名片紀錄", true);
        setTimeout(() => window.location.href = 'index.html?view=user-profile', 2000);
    }
}

function applyUserFilter(contacts) {
    if (isAdmin) return contacts;
    const targetRowId = new URLSearchParams(window.location.search).get('rowId');
    return contacts.filter(c => {
        if (targetRowId && String(c.rowId) === String(targetRowId)) return true;
        const cUid = String(c['LINE ID'] || c.userId || c['Line ID'] || c.lineId || '').trim();
        if (cUid && cUid === userProfile.userId) return true;
        return false;
    });
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await liff.init({ liffId: LIFF_ID });
    
    const params = new URLSearchParams(window.location.search);
    const shareCardId = params.get('shareCardId');
    
    if (shareCardId) {
        if (!liff.isLoggedIn()) { liff.login({ redirectUri: window.location.href }); return; }
        const loadText = document.getElementById('loading-text');
        if (loadText) loadText.innerText = '準備轉發數位名片...';
        try {
            const contacts = await window.fetchAPI('getCardContacts', {}, false);
            const card = contacts.find(c => String(c.rowId) === String(shareCardId));
            if (!card) throw new Error('找不到該名片資料');
            
            let config = null;
            if (card['自訂名片設定']) { try { config = JSON.parse(card['自訂名片設定']); } catch(e){} }
            
            const rawImg = config?.imgUrl || card['名片圖檔'];
            const currentImgUrl = typeof window.getDirectImageUrl === 'function' ? window.getDirectImageUrl(rawImg) : rawImg;
            const detectedAr = typeof window.getTrueAspectRatio === 'function' ? await window.getTrueAspectRatio(currentImgUrl) : "20:13";
            
            const flexContents = typeof window.buildFlexMessageFromCard === 'function' ? window.buildFlexMessageFromCard(card, config, detectedAr) : null;
            
            const title = config?.title || card['姓名'] || '商務名片';
            const altText = `您收到一張數位名片：${title}`;
            const shareUrl = `https://liff.line.me/${LIFF_ID}?shareCardId=${shareCardId}`;
            
            if (typeof window.triggerFlexSharing === 'function' && flexContents) {
                await window.triggerFlexSharing(flexContents, altText);
            } else {
                if(typeof window.fallbackShare === 'function') window.fallbackShare(shareUrl, altText);
            }
        } catch (e) {
            alert('名片轉發失敗: ' + e.message);
        }
        return; 
    }

    if (!liff.isLoggedIn()) { liff.login({ redirectUri: window.location.href }); return; }
    
    userProfile = await liff.getProfile();
    const ADMIN_IDS = ["Uf729764dbb5b652a5a90a467320bea29", "U58eb5c1a747450140ce1335af709ae55", "U8932b891ad24da512afb9c1a6f41567b"];
    isAdmin = ADMIN_IDS.includes(userProfile.userId);

    const userAvatarEl = document.getElementById('userAvatar');
    if (userAvatarEl) {
        userAvatarEl.src = userProfile.pictureUrl || '';
        userAvatarEl.classList.remove('hidden');
    }
    
    if (!isAdmin && params.get('mode') !== 'mycard') {
        window.location.replace('index.html');
        return;
    }

    if (isAdmin) {
        const roleBtn = document.getElementById('roleSwitchBtn');
        if (roleBtn) roleBtn.classList.remove('hidden');
        const adminNav = document.getElementById('bottom-nav-admin');
        if (adminNav) adminNav.classList.remove('hidden');
    } else { 
        document.getElementById('bottom-nav-user')?.classList.remove('hidden'); 
    }

    if (params.get('mode') === 'mycard') {
        loadCardContacts();
        return; 
    }
    
    window.switchView('list');
    loadCardContacts();
  } catch (err) {
    window.showToast("初始化失敗", true);
    const loadText = document.getElementById('loading-text');
    if (loadText) loadText.innerText = "初始化失敗，請確認網路連線";
    const spinner = document.querySelector('#view-loading .animate-spin');
    if (spinner) spinner.classList.add('hidden');
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
  const cCam = document.getElementById('cameraInput'); if (cCam) cCam.value = "";
  const cUp = document.getElementById('galleryInput'); if (cUp) cUp.value = "";
  compressedBase64 = "";
  
  const params = new URLSearchParams(window.location.search);
  if (params.get('mode') === 'mycard') window.location.href = 'index.html?view=user-profile';
  else window.switchView('list');
}

async function loadCardContacts() { 
    const container = document.getElementById('admin-card-list-container');
    const cachedDataString = localStorage.getItem(CACHE_KEY_CONTACTS);
    
    if (cachedDataString) {
        try {
            globalCardContacts = JSON.parse(cachedDataString);
            globalCardContacts = applyUserFilter(globalCardContacts);
            window.filterCardList(); 
            checkAndOpenMyCard();
        } catch(e) {}
    } else if (container) {
        container.innerHTML = '<div class="text-center py-10"><div class="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div></div>';
    }

    try {
        const data = await window.fetchAPI('getCardContacts', {}, true);
        let newContacts = data || [];
        newContacts.forEach(c => {
            if (c['手機號碼']) c['手機號碼'] = formatPhoneStr(c['手機號碼']);
            if (c['公司電話']) c['公司電話'] = formatPhoneStr(c['公司電話']);
        });

        const newDataString = JSON.stringify(newContacts);
        if (cachedDataString !== newDataString) {
            localStorage.setItem(CACHE_KEY_CONTACTS, newDataString);
            globalCardContacts = applyUserFilter(newContacts);
            window.filterCardList(); 
            if (!myCardOpened) checkAndOpenMyCard();
        } else if (!cachedDataString) {
            globalCardContacts = applyUserFilter(newContacts);
            window.filterCardList();
            if (!myCardOpened) checkAndOpenMyCard();
        }
    } catch(e) {
        if (!cachedDataString && container) container.innerHTML = `<div class="text-center py-10 text-red-500 font-bold">連線異常</div>`;
        const loadText = document.getElementById('loading-text');
        if (loadText) loadText.innerText = "資料讀取失敗，請重新載入";
        const spinner = document.querySelector('#view-loading .animate-spin');
        if (spinner) spinner.classList.add('hidden');
    } finally {
        const globalLoading = document.getElementById('loadingView');
        if (globalLoading && !globalLoading.classList.contains('hidden') && new URLSearchParams(window.location.search).get('mode') !== 'mycard') {
            window.switchView('list');
        }
    }
}

window.reloadCardContacts = async function() {
    if (isProcessing) return;
    isProcessing = true;
    const btn = document.getElementById('btn-refresh-cards');
    if (btn) {
        btn.classList.add('pointer-events-none', 'opacity-50');
        btn.querySelector('span')?.classList.add('animate-spin');
    }
    localStorage.removeItem(CACHE_KEY_CONTACTS); 
    try {
        await loadCardContacts();
        window.showToast("✅ 名單已更新");
    } catch(e) {
        window.showToast("更新失敗，請重試", true);
    } finally {
        isProcessing = false;
        if (btn) {
            btn.classList.remove('pointer-events-none', 'opacity-50');
            btn.querySelector('span')?.classList.remove('animate-spin');
        }
    }
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
    if (filteredCards.length === 0) { container.innerHTML = '<div class="text-center py-16 text-slate-500 font-bold">查無名片</div>'; return; }

    const pageData = filteredCards.slice((currentPage - 1) * PAGE_LIMIT, currentPage * PAGE_LIMIT);
    let html = pageData.map(c => {
        const isClaimed = !!(c.userId || c['LINE ID'] || c['Line ID'] || c['lineId']);
        const claimBadge = isClaimed ? '<span class="shrink-0 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md text-[11px] font-bold ml-2">已綁定</span>' : '';
        return `
        <div onclick="if(typeof window.openCardDetailByRowId === 'function') window.openCardDetailByRowId('${c.rowId}')" class="p-5 bg-white flex items-center gap-4 rounded-[2rem] shadow-sm mb-3 cursor-pointer active:scale-[0.98] transition-transform border border-slate-100">
          <div class="w-[56px] h-[56px] shrink-0 rounded-2xl overflow-hidden bg-slate-50 flex items-center justify-center border border-slate-100">
            ${c['名片圖檔'] && c['名片圖檔'] !== '圖片儲存失敗' && c['名片圖檔'] !== '無圖檔' ? `<img src="${window.getDirectImageUrl(c['名片圖檔'])}" class="w-full h-full object-cover">` : `<span class="material-symbols-outlined text-slate-300 text-[28px]">contact_mail</span>`}
          </div>
          <div class="flex-1 overflow-hidden flex flex-col justify-center gap-1">
            <div class="flex items-center"><h4 class="text-[17px] font-extrabold text-slate-800 truncate">${c['姓名'] || '未知姓名'}</h4>${isAdmin ? claimBadge : ''}</div>
            <p class="text-[13px] text-slate-500 font-medium truncate">${c['公司名稱'] || c['職稱'] || '無資訊'}</p>
          </div>
        </div>
    `}).join('');

    const loadMoreBtnId = 'loadMoreBox';
    let loadMoreBtn = document.getElementById(loadMoreBtnId);

    if (isReset) {
        container.innerHTML = `<div id="card-list-wrapper">${html}</div>`;
    } else {
        if (loadMoreBtn) loadMoreBtn.classList.add('hidden');
        const wrapper = document.getElementById('card-list-wrapper');
        if (wrapper) wrapper.insertAdjacentHTML('beforeend', html);
    }

    if (currentPage * PAGE_LIMIT < filteredCards.length) {
        if (loadMoreBtn) loadMoreBtn.classList.remove('hidden');
        else {
             const wrapper = document.getElementById('card-list-wrapper');
             if (wrapper) wrapper.insertAdjacentHTML('afterend', `<div id="${loadMoreBtnId}" class="text-center py-4"><button onclick="window.loadMoreCards()" class="text-slate-500 text-sm bg-white px-6 py-2 rounded-full shadow-sm">顯示更多</button></div>`);
        }
    }
}

window.loadMoreCards = function() { currentPage++; window.renderCardPage(false); }

window.openCardDetailByRowId = function(rowId) { 
    try {
      const card = globalCardContacts.find(c => String(c.rowId) === String(rowId));
      if(!card) {
          window.showToast("找不到對應的名片", true);
          window.switchView('list');
          return;
      }
      currentActiveCard = card; 
      
      window.switchView('list');
      const modal = document.getElementById('readonly-card-modal');
      if (modal) modal.classList.remove('hidden');

      const setName = document.getElementById('ro-name'); if (setName) setName.innerText = card['姓名'] || card['Name'] || '未知姓名';
      
      const statusEl = document.getElementById('ro-claim-status');
      if (isAdmin && statusEl) {
          if (card.userId || card['LINE ID'] || card['Line ID'] || card['lineId']) {
              statusEl.innerText = '已認領';
              statusEl.className = 'px-2.5 py-0.5 rounded-md text-[11px] bg-emerald-50 text-emerald-600 font-bold';
          } else {
              statusEl.innerText = '未認領';
              statusEl.className = 'px-2.5 py-0.5 rounded-md text-[11px] bg-slate-50 text-slate-400 font-bold';
          }
          statusEl.classList.remove('hidden');
      } else if (statusEl) {
          statusEl.classList.add('hidden');
      }
      
      const setTitle = document.getElementById('ro-title'); if (setTitle) setTitle.innerText = [card['職稱']||card['Title'], card['部門']||card['Department']].filter(Boolean).join(' / ') || '無職稱';
      const setCompany = document.getElementById('ro-company'); if (setCompany) setCompany.innerText = [card['公司名稱']||card['CompanyName'], card['英文名/別名']||card['EnglishName']].filter(Boolean).join(' - ') || '未提供';
      const setTax = document.getElementById('ro-taxid'); if (setTax) setTax.innerText = card['統一編號'] || card['TaxID'] || '未提供';
      
      const mobileLink = document.getElementById('ro-mobile-link');
      let phoneStr = card['手機號碼'] || card['Mobile'] ? formatPhoneStr(card['手機號碼'] || card['Mobile']) : '';
      if (mobileLink) { mobileLink.innerText = phoneStr || '未提供'; mobileLink.href = phoneStr ? `tel:${phoneStr}` : '#'; }
      
      const telEl = document.getElementById('ro-tel');
      if (telEl) telEl.innerText = [card['公司電話']||card['Tel'] ? formatPhoneStr(card['公司電話']||card['Tel']) : '', card['分機']||card['Ext'] ? `ext.${card['分機']||card['Ext']}` : ''].filter(Boolean).join(' ') || '未提供';
      
      const emailLink = document.getElementById('ro-email-link');
      const emailStr = card['電子郵件'] || card['Email'] || '';
      if (emailLink) { emailLink.innerText = emailStr || '未提供'; emailLink.href = emailStr ? `mailto:${emailStr}` : '#'; }
      
      const addrEl = document.getElementById('ro-address');
      if (addrEl) addrEl.innerText = card['公司地址'] || card['Address'] || '未提供';
      
      const tagsContainer = document.getElementById('ro-fate-tags-container');
      if (tagsContainer) { tagsContainer.innerHTML = ''; tagsContainer.style.display = 'none'; }

      const notesArr = [];
      const slogan = card['服務項目/品牌標語']||card['Slogan'];
      if(slogan) notesArr.push(`【品牌與服務】\n${slogan}`);
      const fax = card['傳真']||card['Fax'];
      if(fax) notesArr.push(`【傳真】${fax}`);
      const website = card['公司網址']||card['Website'];
      if(website) notesArr.push(`【網址】${website}`);
      const social = card['社群帳號']||card['SocialMedia'];
      if(social) notesArr.push(`【社群】${social}`);
      const internalNotes = card['建檔人/備註']||card['Notes'];
      if(internalNotes && isAdmin) notesArr.push(`【內部備註】\n${internalNotes}`);
      
      const finalNotes = notesArr.join('\n\n');
      const notesEl = document.getElementById('ro-notes');
      if (notesEl) notesEl.innerText = finalNotes || '無其他資訊';

      const imgEl = document.getElementById('ro-image');
      const noImgEl = document.getElementById('ro-no-image');
      
      let rawImg = card['名片圖檔'];
      if (rawImg && typeof rawImg === 'string' && rawImg !== '圖片儲存失敗' && rawImg !== '無圖檔' && rawImg.startsWith('http')) {
        if (imgEl) { imgEl.src = window.getDirectImageUrl(rawImg); imgEl.classList.remove('hidden'); }
        if (noImgEl) noImgEl.classList.add('hidden');
      } else {
        if (imgEl) { imgEl.src = ''; imgEl.classList.add('hidden'); }
        if (noImgEl) noImgEl.classList.remove('hidden');
      }
      
      const shareBtn = document.getElementById('btn-share-claim');
      if (shareBtn) {
          if (!isAdmin) shareBtn.classList.add('hidden');
          else shareBtn.classList.remove('hidden');
      }

    } catch(e) { 
        console.error("開啟錯誤:", e.message); 
        window.switchView('list'); 
    }
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
    let webStr = c['公司網址'] || c['Website'] || '';
    if (webStr && !webStr.startsWith('http') && webStr.includes('.')) webStr = 'https://' + webStr;
    let bdayVal = c['生日'] || '';
    if (bdayVal) { try { const d = new Date(bdayVal); if (!isNaN(d.getTime())) bdayVal = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; } catch(e){} }

    const fields = { 'edit-c-Name': c['姓名'] || c['Name'] || '', 'edit-c-EnglishName': c['英文名/別名'] || c['EnglishName'] || '', 'edit-c-Title': c['職稱'] || c['Title'] || '', 'edit-c-Department': c['部門'] || c['Department'] || '', 'edit-c-CompanyName': c['公司名稱'] || c['CompanyName'] || '', 'edit-c-TaxID': c['統一編號'] || c['TaxID'] || '', 'edit-c-Mobile': formatPhoneStr(c['手機號碼'] || c['Mobile']) || '', 'edit-c-Tel': formatPhoneStr(c['公司電話'] || c['Tel']) || '', 'edit-c-Ext': c['分機'] || c['Ext'] || '', 'edit-c-Fax': formatPhoneStr(c['傳真'] || c['Fax']) || '', 'edit-c-Address': c['公司地址'] || c['Address'] || '', 'edit-c-Email': c['電子郵件'] || c['Email'] || '', 'edit-c-Website': webStr, 'edit-c-SocialMedia': c['社群帳號'] || c['SocialMedia'] || '', 'edit-c-Slogan': c['服務項目/品牌標語'] || c['Slogan'] || '', 'edit-c-Notes': c['建檔人/備註'] || c['Notes'] || '', 'edit-c-Birthday': bdayVal };
    for (const [id, val] of Object.entries(fields)) { const el = document.getElementById(id); if (el) el.value = val; }
    
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
  
  let payload = { 
      rowId: currentActiveCard.rowId, 
      targetVerifyUid: currentActiveCard['LINE ID'] || currentActiveCard.userId || '',
      targetVerifyName: currentActiveCard['姓名'] || currentActiveCard['Name'] || '',
      Name: document.getElementById('edit-c-Name')?.value.trim() || '', 
      EnglishName: document.getElementById('edit-c-EnglishName')?.value.trim() || '', 
      Title: document.getElementById('edit-c-Title')?.value.trim() || '', 
      Department: document.getElementById('edit-c-Department')?.value.trim() || '', 
      CompanyName: document.getElementById('edit-c-CompanyName')?.value.trim() || '', 
      TaxID: document.getElementById('edit-c-TaxID')?.value.trim() || '', 
      Mobile: document.getElementById('edit-c-Mobile')?.value.trim() || '', 
      Tel: document.getElementById('edit-c-Tel')?.value.trim() || '', 
      Ext: document.getElementById('edit-c-Ext')?.value.trim() || '', 
      Fax: document.getElementById('edit-c-Fax')?.value.trim() || '', 
      Address: document.getElementById('edit-c-Address')?.value.trim() || '', 
      Email: document.getElementById('edit-c-Email')?.value.trim() || '', 
      Website: document.getElementById('edit-c-Website')?.value.trim() || '', 
      SocialMedia: document.getElementById('edit-c-SocialMedia')?.value.trim() || '', 
      Slogan: document.getElementById('edit-c-Slogan')?.value.trim() || '', 
      Notes: document.getElementById('edit-c-Notes')?.value.trim() || '', 
      Birthday: document.getElementById('edit-c-Birthday')?.value || '' 
  };
  
  const oldName = currentActiveCard['姓名'] || currentActiveCard['Name'] || '';
  const oldPhone = formatPhoneStr(currentActiveCard['手機號碼'] || currentActiveCard['Mobile']) || '';
  let parsedOldBday = ''; const oldBdayRaw = currentActiveCard['生日'] || '';
  if (oldBdayRaw) { const d = new Date(oldBdayRaw); if (!isNaN(d.getTime())) parsedOldBday = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
  const tagsMissing = !currentActiveCard['個性'] || currentActiveCard['個性'] === '待分析';
  
  if (payload.Name !== oldName || payload.Mobile !== oldPhone || payload.Birthday !== parsedOldBday || tagsMissing) {
      try { 
          if (btn) btn.innerText = 'AI 深度分析中...';
          const newTags = await window.fetchAPI('calculateFateTags', { Name: payload.Name, Mobile: payload.Mobile, Birthday: payload.Birthday }, true); 
          payload = { ...payload, ...newTags }; 
      } catch (e) {}
  }

  try {
    if (btn) btn.innerText = '寫入資料庫...';
    await window.fetchAPI('updateCard', payload);
    window.showToast("✅ 資料更新成功");
    
    localStorage.removeItem(CACHE_KEY_CONTACTS);
    
    Object.assign(currentActiveCard, {
        '姓名': payload.Name,
        'Name': payload.Name,
        '英文名/別名': payload.EnglishName,
        '職稱': payload.Title,
        '部門': payload.Department,
        '公司名稱': payload.CompanyName,
        '統一編號': payload.TaxID,
        '手機號碼': payload.Mobile ? `'${payload.Mobile}` : "",
        'Mobile': payload.Mobile,
        '公司電話': payload.Tel ? `'${payload.Tel}` : "",
        'Tel': payload.Tel,
        '分機': payload.Ext,
        '傳真': payload.Fax,
        '公司地址': payload.Address,
        '電子郵件': payload.Email,
        '公司網址': payload.Website,
        '社群帳號': payload.SocialMedia,
        '服務項目/品牌標語': payload.Slogan,
        '建檔人/備註': payload.Notes,
        '生日': payload.Birthday
    });
    
    if (payload.Personality && payload.Personality !== '待分析') {
        currentActiveCard['個性'] = payload.Personality;
        currentActiveCard['興趣'] = payload.Hobbies;
        currentActiveCard['財運'] = payload.Wealth;
        currentActiveCard['健康'] = payload.Health;
        currentActiveCard['事業'] = payload.Career;
    }

    window.closeCardEdit();
    window.openCardDetailByRowId(payload.rowId);
    loadCardContacts();
    
  } catch(err) { 
      window.showToast("更新失敗：" + err.message, true); 
  } finally { 
      if (btn) btn.innerText = '儲存變更'; 
      isProcessing = false; 
  }
}

window.openCamera = () => document.getElementById('cameraInput').click();
window.openGallery = () => document.getElementById('galleryInput').click();
window.handleCameraInput = (e) => { if(e.target.files[0]) window.openCropper(e.target.files[0], 'ocr'); };
window.handleGalleryInput = (e) => { if(e.target.files[0]) window.openCropper(e.target.files[0], 'ocr'); };

window.openCropper = async function(input, targetMode) {
    const file = input.files[0]; 
    if (!file) return;
    
    currentCropTarget = targetMode;
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = document.getElementById('cropper-image'); 
      if (!img) return;
      
      img.onload = () => {
          const modal = document.getElementById('section-image-cropper');
          if (modal) modal.classList.remove('hidden');
          
          if (cropperInstance) cropperInstance.destroy();
          img.style.opacity = '1';
          
          const cropRatio = currentCropTarget === 'v2logo' ? 1 : NaN;
          
          cropperInstance = new Cropper(img, { 
              aspectRatio: cropRatio, 
              viewMode: 1, 
              dragMode: 'move', 
              autoCropArea: 0.9, 
              guides: true, 
              center: true, 
              highlight: false 
          });
      };
      img.src = e.target.result;
      
      input.value = ""; 
    }; 
    
    reader.onerror = () => {
        window.showToast("讀取圖片失敗，請重試", true);
    };
    
    reader.readAsDataURL(file); 
}

window.cancelCrop = function() { 
    if (cropperInstance) { cropperInstance.destroy(); cropperInstance = null; } 
    const modal = document.getElementById('section-image-cropper');
    if (modal) modal.classList.add('hidden'); 
    
    const img = document.getElementById('cropper-image');
    if (img) { img.src = ''; img.style.opacity = '0'; }
}

window.confirmCrop = async function() { 
    if (!cropperInstance) return; 
    let size = 1200;
    let quality = 0.8; 
    let base64 = cropperInstance.getCroppedCanvas({ maxWidth: size, maxHeight: size }).toDataURL('image/jpeg', quality); 
    
    while (base64.length > 400000 && quality > 0.1) { 
        quality -= 0.1; 
        base64 = cropperInstance.getCroppedCanvas({ maxWidth: size, maxHeight: size }).toDataURL('image/jpeg', quality); 
    }
    
    window.cancelCrop(); 
    
    if (currentCropTarget === 'ecard' || currentCropTarget === 'v2logo') {
      const btn = document.getElementById('btn-save-ecard'); 
      const originalHtml = btn ? btn.innerHTML : '';
      if(btn) { btn.innerHTML = '<span class="material-symbols-outlined text-[20px] animate-spin">refresh</span> 上傳中'; btn.classList.add('pointer-events-none'); }
      
      if (typeof window.updateECardPreview === 'function') window.updateECardPreview(base64, currentCropTarget);

      try {
          window.showToast("圖片上傳中...", false);
          const url = await window.fetchAPI('uploadImage', { base64Image: base64 });
          
          if (!url || !url.startsWith('http')) throw new Error("伺服器無法回傳有效網址");

          const inputId = currentCropTarget === 'v2logo' ? 'ec-v2-logo-url' : 'ec-img-input';
          const imgInput = document.getElementById(inputId);
          if(imgInput) imgInput.value = url;
          
          if (typeof window.updateECardPreview === 'function') window.updateECardPreview();
          window.showToast("✅ 圖片上傳成功");
      } catch (err) { 
          window.showToast("⚠️ 上傳失敗：" + err.message, true); 
      } finally { 
          if(btn) { btn.innerHTML = originalHtml; btn.classList.remove('pointer-events-none'); } 
      }
      return;
    }

    compressedBase64 = base64;
    const prevImg = document.getElementById('process-preview-image');
    if (prevImg) prevImg.src = compressedBase64;
    
    window.switchView('process');
    window.switchProcessSection('section-loading');
    
    window.fetchAPI('recognizeCard', { base64Image: compressedBase64 }).then(data => {
       const fields = ['Name', 'CompanyName', 'Mobile', 'Title', 'Slogan', 'Notes'];
       fields.forEach(f => { const el = document.getElementById(`f-${f}`); if(el) { let val = data[f] || ''; if (f === 'Mobile') val = formatPhoneStr(val); el.value = val; } });
       window.switchProcessSection('section-form');
       window.showToast("✅ AI 辨識完成");
    }).catch(err => { window.resetUI(); });
}

window.saveToCloud = async function() {
  if (isProcessing) return; 
  isProcessing = true; 
  setButtonLoading('btn-save', true);
  
  let finalImgUrl = compressedBase64;

  if (compressedBase64.startsWith('data:image')) {
      try {
          finalImgUrl = await window.fetchAPI('uploadImage', { base64Image: compressedBase64 });
      } catch(e) {
          window.showToast("圖片上傳失敗：" + e.message, true);
          setButtonLoading('btn-save', false, '💾 存入雲端'); 
          isProcessing = false;
          return;
      }
  }

  const payload = { base64Image: finalImgUrl, Notes: document.getElementById('f-Notes')?.value || '', userId: userProfile?.userId || '' };
  const fields = ['Name', 'CompanyName', 'Mobile', 'Title', 'Slogan'];
  fields.forEach(f => { payload[f] = document.getElementById(`f-${f}`)?.value || ''; });
  
  if (!payload.Name && !payload.CompanyName) { 
      setButtonLoading('btn-save', false, '💾 存入雲端'); 
      isProcessing = false; 
      return window.showToast("⚠️ 請輸入姓名或公司", true); 
  }
  
  try {
    await window.fetchAPI('saveCard', payload); 
    window.showToast("🎉 建立成功！");
    
    localStorage.removeItem(CACHE_KEY_CONTACTS);
    setTimeout(() => { 
        window.resetUI(); 
        loadCardContacts();
    }, 1000);
  } catch(err) { 
      window.showToast("存檔失敗：" + err.message, true);
  } finally { 
      setButtonLoading('btn-save', false, '💾 存入雲端'); 
      isProcessing = false; 
  }
}
