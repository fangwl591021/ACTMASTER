/**
 * card.js 
 * Version: v20260405_1400 (QQ 修復版：移除舊有 Modal 開關，交由編輯器處理隱私參數)
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

    const userAvatarEl = document.getElementById('user-avatar');
    if (userAvatarEl) userAvatarEl.src = userProfile.pictureUrl || '';
    
    const userProfileBadge = document.getElementById('user-profile-badge');
    if (userProfileBadge) userProfileBadge.classList.remove('hidden');
    
    if (isAdmin) {
        const roleBtn = document.getElementById('role-switch-btn');
        if (roleBtn) roleBtn.classList.remove('hidden');
        const adminNav = document.getElementById('bottom-nav-admin');
        if (adminNav) adminNav.classList.remove('hidden');
    } else { 
        document.getElementById('role-switch-btn')?.remove(); 
        document.getElementById('admin-tools-container')?.remove(); 
        document.getElementById('bottom-nav-admin')?.remove(); 
    }

    if (new URLSearchParams(window.location.search).get('mode') === 'mycard') {
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
  ['view-loading', 'view-list', 'view-process'].forEach(v => { const el = document.getElementById(v); if (el) el.classList.add('hidden'); });
  const target = document.getElementById(`view-${view}`); if (target) target.classList.remove('hidden');
}

window.switchProcessSection = function(id) {
  ['section-loading', 'section-form'].forEach(v => { const el = document.getElementById(v); if (el) el.classList.add('hidden'); });
  const target = document.getElementById(id); if (target) target.classList.remove('hidden');
}

window.resetUI = function() {
  const cCam = document.getElementById('card-camera'); if (cCam) cCam.value = "";
  const cUp = document.getElementById('card-upload'); if (cUp) cUp.value = "";
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
            checkAndOpenMyCard();
            window.filterCardList(); 
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
        } else if (!cachedDataString && !myCardOpened) {
            checkAndOpenMyCard();
        }
    } catch(e) {
        if (!cachedDataString && container) container.innerHTML = `<div class="text-center py-10 text-error font-bold">連線異常</div>`;
        const loadText = document.getElementById('loading-text');
        if (loadText) loadText.innerText = "資料讀取失敗，請重新載入";
        const spinner = document.querySelector('#view-loading .animate-spin');
        if (spinner) spinner.classList.add('hidden');
    }
}

window.filterCardList = function() { 
    if (!isAdmin) return;
    const term = document.getElementById('card-search-input')?.value.toLowerCase() || '';
    filteredCards = globalCardContacts.filter(c => (c['姓名'] || '').toLowerCase().includes(term) || (c['公司名稱'] || '').toLowerCase().includes(term));
    currentPage = 1;
    window.renderCardPage(true);
}

window.renderCardPage = function(isReset = false) {
    const container = document.getElementById('admin-card-list-container');
    if (!container) return;
    if (filteredCards.length === 0) { container.innerHTML = '<div class="text-center py-16 text-slate-500">查無名片</div>'; return; }

    const pageData = filteredCards.slice((currentPage - 1) * PAGE_LIMIT, currentPage * PAGE_LIMIT);
    let html = pageData.map(c => {
        const isClaimed = !!(c.userId || c['LINE ID'] || c['Line ID'] || c['lineId']);
        const claimBadge = isClaimed ? '<span class="shrink-0 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md text-[11px] font-bold ml-2">已綁定</span>' : '';
        return `
        <div onclick="if(typeof window.openCardDetailByRowId === 'function') window.openCardDetailByRowId('${c.rowId}')" class="p-5 bg-white flex items-center gap-4 rounded-[2rem] shadow-sm mb-3 cursor-pointer active:scale-[0.98] transition-transform">
          <div class="w-[56px] h-[56px] shrink-0 rounded-2xl overflow-hidden bg-slate-50 flex items-center justify-center">
            ${c['名片圖檔'] && c['名片圖檔'] !== '圖片儲存失敗' && c['名片圖檔'] !== '無圖檔' ? `<img src="${window.getDirectImageUrl(c['名片圖檔'])}" class="w-full h-full object-cover">` : `<span class="material-symbols-outlined text-slate-300 text-[28px]">contact_mail</span>`}
          </div>
          <div class="flex-1 overflow-hidden flex flex-col justify-center gap-1">
            <div class="flex items-center"><h4 class="text-[17px] font-extrabold text-slate-800 truncate">${c['姓名'] || '未知姓名'}</h4>${isAdmin ? claimBadge : ''}</div>
            <p class="text-[13px] text-slate-500 font-medium truncate">${c['公司名稱'] || c['職稱'] || '無資訊'}</p>
          </div>
        </div>
    `}).join('');

    const loadMoreBtnId = 'btn-load-more-cards';
    let loadMoreBtn = document.getElementById(loadMoreBtnId);

    if (isReset) {
        container.innerHTML = `<div id="card-list-wrapper">${html}</div>`;
    } else {
        if (loadMoreBtn) loadMoreBtn.remove();
        const wrapper = document.getElementById('card-list-wrapper');
        if (wrapper) wrapper.insertAdjacentHTML('beforeend', html);
    }

    if (currentPage * PAGE_LIMIT < filteredCards.length) {
        const wrapper = document.getElementById('card-list-wrapper');
        if (wrapper) {
            wrapper.insertAdjacentHTML('afterend', `<button id="${loadMoreBtnId}" onclick="if(typeof window.loadMoreCards === 'function') window.loadMoreCards()" class="w-full py-4 mt-2 bg-white text-slate-700 font-bold text-[15px] rounded-[2rem] shadow-sm active:scale-95 transition-transform flex justify-center items-center gap-1">顯示更多</button>`);
        }
    }
}

window.loadMoreCards = function() { currentPage++; window.renderCardPage(false); }

window.openCardDetailByRowId = function(rowId) { 
    try {
      const card = globalCardContacts.find(c => String(c.rowId) === String(rowId));
      if(!card) return;
      currentActiveCard = card; 
      
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
      if (card['名片圖檔'] && card['名片圖檔'] !== '圖片儲存失敗' && card['名片圖檔'] !== '無圖檔' && card['名片圖檔'].startsWith('http')) {
        if (imgEl) { imgEl.src = window.getDirectImageUrl(card['名片圖檔']); imgEl.classList.remove('hidden'); }
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

      const modal = document.getElementById('readonly-card-modal');
      if (modal) modal.classList.remove('hidden');
      window.switchView('list');
    } catch(e) { console.error("開啟錯誤:", e.message); }
}

window.closeReadOnlyCard = function() { 
    if (new URLSearchParams(window.location.search).get('mode') === 'mycard') {
        window.location.href = 'index.html?view=user-profile';
    } else {
        const modal = document.getElementById('readonly-card-modal');
        if (modal) modal.classList.add('hidden'); 
    }
}

window.shareClaimLink = async function() {
  if (!currentActiveCard || isProcessing) return;
  isProcessing = true;
  setButtonLoading('btn-share-claim', true);

  try {
      const card = currentActiveCard;
      const url = `https://liff.line.me/${LIFF_ID}/?view=user-profile&claimCardId=${card.rowId}&referrer=${userProfile.userId}`;

      const flexMessage = {
          type: "bubble", size: "mega",
          body: {
              type: "box", layout: "vertical", paddingAll: "20px",
              contents: [
                  { type: "text", text: "專屬名片認領", weight: "bold", color: "#2563eb", size: "sm" },
                  { type: "text", text: `您好，${card['姓名'] || card['Name'] || ''}！`, weight: "bold", size: "xl", margin: "md" },
                  { type: "text", text: "我已為您建立了數位商務名片。點擊下方按鈕即可認領名片、自由編輯內容，並啟用數位轉發功能！", size: "sm", color: "#64748b", wrap: true, margin: "md" }
              ]
          },
          footer: {
              type: "box", layout: "vertical", spacing: "sm", paddingAll: "20px",
              contents: [ { type: "button", style: "primary", color: "#2563eb", height: "sm", action: { type: "uri", label: "認領並編輯名片", uri: url } } ]
          }
      };

      if (!liff.isLoggedIn()) { liff.login(); return; }
      
      const altText = "您的專屬數位名片認領邀請";

      if (liff.isApiAvailable('shareTargetPicker')) {
          try {
              const res = await liff.shareTargetPicker([{ type: "flex", altText: altText, contents: flexMessage }]);
              if (res) window.showToast('✅ 認領連結已發送！');
          } catch (err) {
              if(typeof window.fallbackShare === 'function') window.fallbackShare(url, altText);
          }
      } else {
          if(typeof window.fallbackShare === 'function') window.fallbackShare(url, altText);
      }
  } catch (error) {
      console.error(error);
  } finally {
      setButtonLoading('btn-share-claim', false, '邀請認領');
      isProcessing = false;
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
  
  let payload = { rowId: currentActiveCard.rowId, Name: document.getElementById('edit-c-Name')?.value.trim() || '', EnglishName: document.getElementById('edit-c-EnglishName')?.value.trim() || '', Title: document.getElementById('edit-c-Title')?.value.trim() || '', Department: document.getElementById('edit-c-Department')?.value.trim() || '', CompanyName: document.getElementById('edit-c-CompanyName')?.value.trim() || '', TaxID: document.getElementById('edit-c-TaxID')?.value.trim() || '', Mobile: document.getElementById('edit-c-Mobile')?.value.trim() || '', Tel: document.getElementById('edit-c-Tel')?.value.trim() || '', Ext: document.getElementById('edit-c-Ext')?.value.trim() || '', Fax: document.getElementById('edit-c-Fax')?.value.trim() || '', Address: document.getElementById('edit-c-Address')?.value.trim() || '', Email: document.getElementById('edit-c-Email')?.value.trim() || '', Website: document.getElementById('edit-c-Website')?.value.trim() || '', SocialMedia: document.getElementById('edit-c-SocialMedia')?.value.trim() || '', Slogan: document.getElementById('edit-c-Slogan')?.value.trim() || '', Notes: document.getElementById('edit-c-Notes')?.value.trim() || '', Birthday: document.getElementById('edit-c-Birthday')?.value || '' };
  
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
    window.closeCardEdit();
    loadCardContacts();
  } catch(err) { 
      window.showToast("更新失敗", true); 
  } finally { 
      if (btn) btn.innerText = '儲存變更'; 
      isProcessing = false; 
  }
}

// ⭐ QQ 終極防呆：保證 `input.value = ""` 絕不干擾手機端 `FileReader` 非同步讀取
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
          
          cropperInstance = new Cropper(img, { 
              aspectRatio: NaN, 
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

// ⭐ QQ 本地即時渲染防破圖 (Optimistic UI)
window.confirmCrop = async function() { 
    if (!cropperInstance) return; 
    let quality = 0.8; 
    let base64 = cropperInstance.getCroppedCanvas({ maxWidth: 1200, maxHeight: 1200 }).toDataURL('image/jpeg', quality); 
    while (base64.length > 400000 && quality > 0.1) { 
        quality -= 0.1; 
        base64 = cropperInstance.getCroppedCanvas({ maxWidth: 1200, maxHeight: 1200 }).toDataURL('image/jpeg', quality); 
    }
    window.cancelCrop(); 
    
    if (currentCropTarget === 'ecard') {
      const btn = document.getElementById('btn-check-format'); 
      const originalHtml = btn ? btn.innerHTML : '';
      if(btn) { btn.innerHTML = '<span class="material-symbols-outlined text-[20px] animate-spin">refresh</span> 上傳中'; btn.classList.add('pointer-events-none'); }
      
      window.optimisticBase64 = base64;
      if (typeof window.updateECardPreview === 'function') window.updateECardPreview(base64);

      try {
          window.showToast("圖片上傳中...", false);
          const url = await window.fetchAPI('uploadImage', { base64Image: base64 });
          
          if (!url || !url.startsWith('http')) throw new Error("伺服器無法回傳有效網址");

          const imgInput = document.getElementById('ec-img-input');
          if(imgInput) imgInput.value = url;
          window.optimisticImageUrl = url; 
          
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
       const fields = ['Name', 'EnglishName', 'Title', 'Department', 'CompanyName', 'TaxID', 'Mobile', 'Tel', 'Ext', 'Fax', 'Address', 'Email', 'Website', 'SocialMedia', 'Slogan'];
       fields.forEach(f => { const el = document.getElementById(`f-${f}`); if(el) { let val = data[f] || ''; if (f === 'Mobile' || f === 'Tel' || f === 'Fax') val = formatPhoneStr(val); if (f === 'Website' && val && !val.startsWith('http') && val.includes('.')) val = 'https://' + val; el.value = val; } });
       currentFateTags = { Personality: data.Personality || '', Hobbies: data.Hobbies || '', Wealth: data.Wealth || '', Health: data.Health || '', Career: data.Career || '' };
       window.switchProcessSection('section-form');
       window.showToast("✅ AI 辨識完成");
    }).catch(err => { window.resetUI(); });
}

window.saveToCloud = async function() {
  if (isProcessing) return; isProcessing = true; setButtonLoading('btn-save', true);
  const payload = { base64Image: compressedBase64, Notes: document.getElementById('f-Notes')?.value || '', userId: '' };
  const fields = ['Name', 'EnglishName', 'Title', 'Department', 'CompanyName', 'TaxID', 'Mobile', 'Tel', 'Ext', 'Fax', 'Address', 'Email', 'Website', 'SocialMedia', 'Slogan'];
  fields.forEach(f => { payload[f] = document.getElementById(`f-${f}`)?.value || ''; });
  if (!payload.Name && !payload.CompanyName) { setButtonLoading('btn-save', false, '存入雲端'); isProcessing = false; return window.showToast("⚠️ 請輸入姓名或公司", true); }
  
  try {
    await window.fetchAPI('saveCard', payload); window.showToast("🎉 建立成功！");
    setTimeout(() => { window.resetUI(); }, 1000);
  } catch(err) { console.error(err); } finally { setButtonLoading('btn-save', false, '存入雲端'); isProcessing = false; }
}

window.batchRegenerateECards = async function() {
    if (!isAdmin) return;
    if (!confirm("系統將「重新讀取」所有名片的聯絡資料，並自動更新數位名片設定。確定要執行嗎？")) return;
    const btn = document.getElementById('btn-batch-regenerate');
    if (btn) { btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-[14px]">refresh</span> 處理中...'; btn.classList.add('pointer-events-none', 'opacity-50'); }
    let updatedCount = 0;
    try {
        for (let i = 0; i < globalCardContacts.length; i++) {
            const c = globalCardContacts[i];
            let buttons = [];
            let p1 = c['手機號碼'] || c['Mobile'];
            if (p1) { let phone = String(p1).split(',')[0].replace(/[^\d+]/g, ''); if (phone.startsWith('886')) phone = '0' + phone.substring(3); if (phone) buttons.push({ l: '撥打手機', u: `tel:${phone}`, c: '#06C755' }); }
            let p2 = c['公司電話'] || c['Tel'];
            if (p2) { let tel = String(p2).split(',')[0].replace(/[^\d+]/g, ''); if (tel.startsWith('886')) tel = '0' + tel.substring(3); if (tel) buttons.push({ l: '撥打電話', u: `tel:${tel}`, c: '#06C755' }); }
            let p3 = c['電子郵件'] || c['Email'];
            if (p3) { let email = String(p3).split(/[\s,]+/)[0]; if (email.includes('@')) buttons.push({ l: '發送信箱', u: `mailto:${email}`, c: '#06C755' }); }
            let p4 = c['公司地址'] || c['Address'];
            if (p4) buttons.push({ l: 'Google 導航', u: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p4.split(',')[0])}`, c: '#06C755' });
            let p5 = c['公司網址'] || c['Website'];
            if (p5 && buttons.length < 4) { let wUrl = String(p5).trim(); if (wUrl && !wUrl.startsWith('http')) wUrl = 'https://' + wUrl; if (wUrl) buttons.push({ l: '公司網站', u: wUrl, c: '#06C755' }); }

            let cName = c['公司名稱'] && c['公司名稱'] !== 'Not provided' ? c['公司名稱'] : '';
            let uName = c['姓名'] && c['姓名'] !== 'Not provided' ? c['姓名'] : '';
            let defaultTitle = [cName, uName].filter(Boolean).join(' - ') || c['Name'] || '商務名片';
            let defaultDesc = c['服務項目/品牌標語'] || ''; if (defaultDesc === 'Not provided' || defaultDesc === '未提供') defaultDesc = '';

            let config = {}; if (c['自訂名片設定']) { try { config = JSON.parse(c['自訂名片設定']); } catch(e){} }
            config.cardType = config.cardType || 'image'; config.videoUrl = config.videoUrl || ''; config.imgUrl = config.imgUrl || c['名片圖檔'] || ''; config.imgActionUrl = config.imgActionUrl || `https://liff.line.me/${LIFF_ID}`; config.imgSize = config.imgSize || 'mega'; config.ar = config.ar || 'auto'; config.titleAlign = config.titleAlign || 'center';
            if (!config.title || config.title.includes('Not provided') || config.title.includes('未提供')) config.title = defaultTitle;
            if (!config.desc || config.desc.includes('Not provided') || config.desc.includes('未提供')) config.desc = defaultDesc;
            config.buttons = buttons;
            await window.fetchAPI('updateECardConfig', { rowId: c.rowId, config: config }, true);
            c['自訂名片設定'] = JSON.stringify(config); updatedCount++;
        }
        window.showToast(`✅ 重新讀取寫入完成！共更新了 ${updatedCount} 張。`); loadCardContacts();
    } catch (err) { window.showToast("更新錯誤", true); } finally { if (btn) { btn.innerHTML = '<span class="material-symbols-outlined text-[15px]">sync</span> 批次重新讀取寫入所有名片按鈕'; btn.classList.remove('pointer-events-none', 'opacity-50'); } }
}

window.fallbackShare = function(url, altText) {
    const fullText = `${altText}\n${url}`;
    const fallbackInput = document.createElement('textarea');
    fallbackInput.value = fullText;
    fallbackInput.style.position = 'fixed'; fallbackInput.style.opacity = '0';
    document.body.appendChild(fallbackInput);
    fallbackInput.focus(); fallbackInput.select();
    try {
        document.execCommand('copy');
        alert("⚠️ 電腦版或外部瀏覽器無法直接傳送圖文訊息。\n\n✅ 已複製「專屬連結」至剪貼簿！\n請直接貼上給好友。");
    } catch(err) {
        alert("請複製以下連結分享：\n\n" + url);
    }
    document.body.removeChild(fallbackInput);
    window.open(`https://line.me/R/share?text=${encodeURIComponent(fullText)}`, '_blank');
};

window.triggerFlexSharing = async (flexContents, altText) => {
    if (!liff.isLoggedIn()) { liff.login({ redirectUri: window.location.href }); return; }
    try {
        const message = { type: "flex", altText: altText || "收到一張數位名片", contents: flexContents };
        const res = await liff.shareTargetPicker([message]);
        if (res) window.showToast('🚀 數位名片已成功轉發！');
        setTimeout(() => liff.closeWindow(), 1500);
    } catch (error) {
        if (error.message && error.message.includes('not allowed')) {
            alert("⚠️ 系統權限更新，即將重新登入");
            liff.logout(); window.location.reload(); 
        } else {
            alert('發送取消或發生錯誤');
        }
    }
};
