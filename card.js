/**
 * card.js 
 * 名片管理中樞核心邏輯
 * Version: v1.4.7 (精確修理版：修復元件 ID 衝突導致的辨識沒反應、補全資料導入)
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
let dynamicAspectRatio = "20:13"; 
let currentFateTags = null; 
let uploadTargetMode = 'card'; 

const ADMIN_IDS = ["Uf729764dbb5b652a5a90a467320bea29", "U58eb5c1a747450140ce1335af709ae55", "U8932b891ad24da512afb9c1a6f41567b"];
let isAdmin = false;

// ⭐ 修理：備用分享機制
window.fallbackShare = function(url, altText) {
    const fullText = `${altText}\n${url}`;
    const fallbackInput = document.createElement('textarea');
    fallbackInput.value = fullText;
    fallbackInput.style.position = 'fixed';
    fallbackInput.style.opacity = '0';
    document.body.appendChild(fallbackInput);
    fallbackInput.select();
    try {
        document.execCommand('copy');
        alert("⚠️ 電腦版無法直接傳送精美圖文。\n\n✅ 系統已將「專屬連結」複製到您的剪貼簿！\n即將為您開啟 LINE 分享畫面，您可以直接貼上給好友。");
    } catch(err) {
        alert("請複製以下連結分享給好友：\n\n" + url);
    }
    document.body.removeChild(fallbackInput);
    window.open(`https://line.me/R/share?text=${encodeURIComponent(fullText)}`, '_blank');
}

document.addEventListener("DOMContentLoaded", async () => {
  if (!document.getElementById('card-search-input')) return;

  try {
    await liff.init({ liffId: LIFF_ID });
    const params = new URLSearchParams(window.location.search);
    const shareCardId = params.get('shareCardId');
    
    if (shareCardId) {
      if (!liff.isLoggedIn()) { liff.login({ redirectUri: window.location.href }); return; }
      const loadText = document.getElementById('loading-text');
      if(loadText) loadText.innerText = '準備轉發數位名片...';
      
      try {
          const contacts = await window.fetchAPI('getCardContacts');
          const card = contacts.find(c => String(c.rowId) === String(shareCardId));
          if (!card) throw new Error('找不到該名片資料');

          let config = null;
          if (card['自訂名片設定']) { try { config = JSON.parse(card['自訂名片設定']); } catch(e){} }

          const imgUrlForAr = config && config.imgUrl ? window.getDirectImageUrl(config.imgUrl) : window.getDirectImageUrl(card['名片圖檔']);
          const detectedAr = await window.getTrueAspectRatio(imgUrlForAr);

          if (typeof window.buildFlexMessageFromCard === 'function') {
             const flexContents = window.buildFlexMessageFromCard(card, config, detectedAr);
             const title = config && config.title ? config.title : card['姓名'] || card['Name'];
             const altText = `您收到一張數位名片：${title || '商務名片'}`;
             const shareUrl = `https://liff.line.me/${LIFF_ID}/card.html?shareCardId=${shareCardId}`;
             
             if (liff.isApiAvailable('shareTargetPicker')) {
                 try {
                     if (window.triggerFlexSharing) {
                         await window.triggerFlexSharing(flexContents, altText);
                     } else {
                         await liff.shareTargetPicker([{ type: "flex", altText: altText, contents: flexContents }]);
                     }
                     setTimeout(() => { liff.closeWindow(); }, 500);
                 } catch(e) { window.fallbackShare(shareUrl, altText); }
             } else {
                 window.fallbackShare(shareUrl, altText);
             }
          }
      } catch (e) { alert('名片讀取失敗: ' + e.message); }
      return; 
    }

    if (liff.isLoggedIn()) {
      userProfile = await liff.getProfile();
      const avatarEl = document.getElementById('user-avatar');
      if (avatarEl) avatarEl.src = userProfile.pictureUrl || '';
      document.getElementById('user-profile-badge').classList.remove('hidden');
      
      isAdmin = ADMIN_IDS.includes(userProfile.userId);
      const roleBtn = document.getElementById('role-switch-btn');
      if (roleBtn && !isAdmin) { roleBtn.remove(); }

      window.switchView('list');
    } else {
      liff.login({ redirectUri: window.location.href });
    }
  } catch (err) {
    window.showToast("⚠️ LIFF 初始化失敗", true);
  }
});

window.setButtonLoading = function(btnId, isLoading, originalText = '') {
    const btn = document.getElementById(btnId);
    if (!btn) return false;
    if (isLoading) {
        if (!btn.dataset.oriText) btn.dataset.oriText = btn.innerHTML;
        btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-[18px] align-middle">refresh</span> 處理中...';
        btn.classList.add('opacity-50', 'pointer-events-none');
        return true;
    } else {
        btn.innerHTML = originalText || btn.dataset.oriText || '送出';
        btn.classList.remove('opacity-50', 'pointer-events-none');
        return false;
    }
}

window.formatPhoneStr = function(val) {
  if (!val) return '';
  let str = String(val).trim();
  let matches = str.match(/(?:\+?\d[\d\-\s]{7,18}\d)/g);
  let targetStr = (matches && matches.length > 0) ? matches[0] : str;
  let s = targetStr.replace(/[^\d+]/g, '');
  if (s.startsWith('+886')) s = '0' + s.substring(4);
  else if (s.startsWith('886') && s.length >= 11) s = '0' + s.substring(3);
  if (/^9\d{8}$/.test(s)) s = '0' + s;
  return s;
}

window.getDirectImageUrl = function(url) { 
  if (!url || url === '無圖檔' || url === '圖片儲存失敗') return '';
  const driveMatch = url.match(/id=([a-zA-Z0-9_-]+)/) || url.match(/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch && url.includes('drive.google.com')) return `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w1000`;
  return url;
}

window.getTrueAspectRatio = (url) => new Promise((resolve) => {
    if (!url) return resolve('20:13');
    const img = new Image();
    img.onload = function() {
        let w = this.width; let h = this.height; let ratio = w / h;
        if (ratio > 3) { w = 300; h = 100; }
        else if (ratio < 0.334) { w = 100; h = 300; }
        resolve(`${Math.round(w)}:${Math.round(h)}`);
    };
    img.onerror = function() { resolve('20:13'); };
    img.src = url;
});

window.fetchAPI = async function(action, payload = {}, silent = false) {
  try {
    const response = await fetch(WORKER_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload })
    });
    const resText = await response.text();
    let result;
    try { result = JSON.parse(resText); } catch(e) { throw new Error(`系統連線失敗 (非 JSON)`); }
    if (!result.success) throw new Error(result.error);
    return result.data;
  } catch (err) {
    if (!silent) window.showToast(err.message, true); 
    throw err;
  }
}

window.switchView = function(view) {
  const views = ['view-loading', 'view-list', 'view-process'];
  views.forEach(v => {
    const el = document.getElementById(v);
    if (el) el.classList.add('hidden');
  });
  if (view === 'process') {
    document.getElementById('view-process').classList.remove('hidden');
  } else if (view === 'list') {
    document.getElementById('view-list').classList.remove('hidden');
    if (globalCardContacts.length === 0 && !isProcessing) { window.loadCardContacts(); }
  }
}

window.switchProcessSection = function(id) {
  ['section-loading', 'section-form'].forEach(v => {
    const el = document.getElementById(v);
    if(el) el.classList.add('hidden');
  });
  const target = document.getElementById(id);
  if(target) target.classList.remove('hidden');
}

window.resetUI = function() {
  document.getElementById('card-camera').value = "";
  document.getElementById('card-upload').value = "";
  compressedBase64 = "";
  currentFateTags = null;
  const params = new URLSearchParams(window.location.search);
  if (params.get('mode') === 'mycard') { window.location.href = 'index.html?view=user-profile'; } 
  else { window.switchView('list'); }
}

window.showToast = function(msg, isError = false) {
  const t = document.getElementById('toast');
  if(!t) return;
  t.innerHTML = `<span class="material-symbols-outlined icon-filled">${isError ? 'error' : 'info'}</span> ${msg}`;
  t.className = `fixed top-14 left-1/2 -translate-x-1/2 px-5 py-3 rounded text-[15px] shadow-lg transition-all z-[10000] font-bold flex items-center gap-2 w-max max-w-[90vw] ${isError ? 'bg-red-500 text-white border-red-600' : 'bg-slate-800 text-white border-slate-700'} opacity-100`;
  t.classList.remove('hidden');
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translate(-50%, -1rem)'; }, 3000); 
}

window.openCropper = function(input, mode = 'card') {
    uploadTargetMode = mode;
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.getElementById('cropper-image');
      img.src = e.target.result;
      img.style.opacity = '0';
      document.getElementById('section-cropper').classList.remove('hidden');
      if (cropperInstance) cropperInstance.destroy();
      setTimeout(() => {
        img.style.opacity = '1';
        cropperInstance = new Cropper(img, { 
          viewMode: 1, dragMode: 'move', autoCropArea: 0.9, aspectRatio: NaN, 
          restore: false, guides: true, center: true, highlight: false, cropBoxMovable: true, cropBoxResizable: true, toggleDragModeOnDblclick: false 
        });
      }, 100);
    };
    reader.readAsDataURL(file);
    input.value = ""; 
}

window.cancelCrop = function() {
  if (cropperInstance) { cropperInstance.destroy(); cropperInstance = null; }
  document.getElementById('section-cropper').classList.add('hidden');
}

window.confirmCrop = async function() {
  if (!cropperInstance) return;
  const croppedCanvas = cropperInstance.getCroppedCanvas({ maxWidth: 1200, maxHeight: 1200 });
  compressedBase64 = croppedCanvas.toDataURL('image/jpeg', 0.8);
  window.cancelCrop();
  
  if (uploadTargetMode === 'ecard') {
      const btn = document.getElementById('btn-check-format'); 
      const originalHtml = btn.innerHTML;
      btn.innerHTML = '<span class="material-symbols-outlined text-[20px] animate-spin">refresh</span> 上傳中';
      btn.classList.add('pointer-events-none');
      try {
          window.showToast("圖片上傳中...", false);
          const url = await window.fetchAPI('uploadImage', { base64Image: compressedBase64 });
          document.getElementById('ec-img-input').value = url;
          if(typeof window.updateECardPreview === 'function') window.updateECardPreview();
          window.showToast("✅ 圖片上傳成功");
      } catch (err) { window.showToast("⚠️ 上傳失敗：" + err.message, true); } 
      finally { btn.innerHTML = originalHtml; btn.classList.remove('pointer-events-none'); }
  } else {
      // ⭐ 修理：修正 ID 從 preview-image 改為 process-preview-image
      const prevImg = document.getElementById('process-preview-image');
      if(prevImg) prevImg.src = compressedBase64;
      window.switchView('process');
      window.switchProcessSection('section-loading');
      window.recognizeCardData();
  }
}

window.recognizeCardData = async function() {
  try {
    const data = await window.fetchAPI('recognizeCard', { base64Image: compressedBase64 });
    // 補全所有商務欄位導入
    const fields = ['Name', 'EnglishName', 'Title', 'Department', 'CompanyName', 'TaxID', 'Mobile', 'Tel', 'Ext', 'Fax', 'Address', 'Email', 'Website', 'SocialMedia', 'Slogan'];
    fields.forEach(f => {
      const el = document.getElementById(`f-${f}`);
      if(el) {
          let val = data[f] || '';
          if (f === 'Mobile' || f === 'Tel' || f === 'Fax') val = window.formatPhoneStr(val);
          if (f === 'Website' && val && !val.startsWith('http') && val.includes('.')) val = 'https://' + val;
          el.value = val;
      }
    });
    // ⭐ 修理：保存命理演算標籤，確保儲存時不會遺失
    currentFateTags = {
        Personality: data.Personality || '', Hobbies: data.Hobbies || '',
        Wealth: data.Wealth || '', Health: data.Health || '', Career: data.Career || ''
    };
    window.switchProcessSection('section-form');
    window.showToast("✅ AI 辨識完成");
  } catch(err) { window.resetUI(); }
}

window.saveToCloud = async function() {
  if (isProcessing) return; 
  isProcessing = true;
  window.setButtonLoading('btn-save', true);
  
  const payload = {
    base64Image: compressedBase64,
    Notes: document.getElementById('f-Notes').value,
    userId: '', 
    ...currentFateTags // ⭐ 修理：確保儲存時帶入命理資料
  };
  
  const fields = ['Name', 'EnglishName', 'Title', 'Department', 'CompanyName', 'TaxID', 'Mobile', 'Tel', 'Ext', 'Fax', 'Address', 'Email', 'Website', 'SocialMedia', 'Slogan'];
  fields.forEach(f => { payload[f] = document.getElementById(`f-${f}`).value; });
  
  if (!payload.Name && !payload.CompanyName) {
    window.setButtonLoading('btn-save', false, '存入雲端');
    isProcessing = false;
    return window.showToast("⚠️ 請輸入姓名或公司", true);
  }

  try {
    await window.fetchAPI('saveCard', payload);
    window.showToast("🎉 建立成功！");
    globalCardContacts = [];
    sessionStorage.removeItem('getCardContacts{}');
    setTimeout(() => { window.resetUI(); }, 1000);
  } catch(err) { console.error(err); } 
  finally { window.setButtonLoading('btn-save', false, '存入雲端'); isProcessing = false; }
}

window.loadCardContacts = async function() { 
    const container = document.getElementById('admin-card-list-container');
    if (!container) return;

    if (!isAdmin) {
        const navAdmin = document.getElementById('bottom-nav-admin');
        if (navAdmin) navAdmin.classList.add('hidden');
        const toolsContainer = document.getElementById('admin-tools-container');
        if (toolsContainer) toolsContainer.classList.add('hidden');
        const searchContainer = document.getElementById('admin-search-container');
        if (searchContainer) searchContainer.classList.add('hidden');
    }

    const cacheKey = 'getCardContacts{}';
    const cached = sessionStorage.getItem(cacheKey);
    
    if (cached) {
        try {
            globalCardContacts = JSON.parse(cached);
            if (!isAdmin && userProfile) {
                globalCardContacts = globalCardContacts.filter(c => c.userId === userProfile.userId || c['LINE ID'] === userProfile.userId);
            }
            window.filterCardList(); 
        } catch(e) {}
    } else {
        container.innerHTML = '<div class="text-center py-10"><div class="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin mx-auto"></div></div>';
    }

    window.fetchAPI('getCardContacts', {}, true).then(data => {
        globalCardContacts = data || [];
        sessionStorage.setItem(cacheKey, JSON.stringify(globalCardContacts));
        if (!isAdmin && userProfile) {
            globalCardContacts = globalCardContacts.filter(c => c.userId === userProfile.userId || c['LINE ID'] === userProfile.userId);
        }
        window.filterCardList(); 
    }).catch(e => {
        if (globalCardContacts.length === 0) {
            container.innerHTML = `<div class="text-center py-10 text-error font-bold">讀取失敗</div>`;
        }
    });
}

window.filterCardList = function() { 
    const term = document.getElementById('card-search-input').value.toLowerCase();
    filteredCards = globalCardContacts.filter(c => 
      (c['姓名'] || '').toLowerCase().includes(term) || (c['公司名稱'] || '').toLowerCase().includes(term)
    );
    currentPage = 1;
    window.renderCardPage(true);
}

window.renderCardPage = function(isReset = false) {
    const container = document.getElementById('admin-card-list-container');
    if (!container) return;

    if (!filteredCards || filteredCards.length === 0) {
        container.innerHTML = '<div class="text-center py-16 bg-white rounded shadow-sm border border-slate-200 text-slate-500 text-[15px]">查無相關名片</div>';
        return;
    }

    const startIndex = (currentPage - 1) * PAGE_LIMIT;
    const endIndex = startIndex + PAGE_LIMIT;
    const pageData = filteredCards.slice(startIndex, endIndex);

    let html = pageData.map((card) => {
        const isClaimed = !!(card.userId || card['LINE ID'] || card['Line ID'] || card['lineId']);
        const claimBadge = isClaimed 
          ? '<span class="shrink-0 text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded text-[11px] whitespace-nowrap ml-2 border border-emerald-100">已認領</span>' 
          : '<span class="shrink-0 text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded text-[11px] whitespace-nowrap ml-2 border border-slate-200">未認領</span>';
        
        return `
        <div onclick="window.openCardDetailByRowId('${card.rowId}')" class="pl-[5px] pr-4 py-4 bg-white flex items-center gap-4 border-b border-slate-200 last:border-b-0 active:bg-slate-50 cursor-pointer transition-colors">
          <div class="w-[52px] h-[52px] shrink-0 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200">
            ${card['名片圖檔'] && card['名片圖檔'] !== '圖片儲存失敗' && card['名片圖檔'] !== '無圖檔' ? `<img src="${window.getDirectImageUrl(card['名片圖檔'])}" class="w-full h-full object-cover">` : `<span class="material-symbols-outlined text-slate-400 text-[24px]">person</span>`}
          </div>
          <div class="flex-1 overflow-hidden flex flex-col justify-center gap-1.5">
            <div class="flex items-center">
              <h4 class="text-[17px] text-slate-800 truncate leading-none">${card['姓名'] || '未知姓名'}</h4>
              ${isAdmin ? claimBadge : ''}
            </div>
            <p class="text-[14px] text-slate-500 truncate leading-none font-normal">${card['公司名稱'] || card['職稱'] || '無資訊'}</p>
          </div>
        </div>`
    }).join('');

    if (isReset) {
        container.innerHTML = `<div class="bg-white border border-slate-200 rounded overflow-hidden" id="card-list-wrapper">${html}</div>`;
    } else {
        const wrapper = document.getElementById('card-list-wrapper');
        if (wrapper) wrapper.insertAdjacentHTML('beforeend', html);
    }
}

window.loadMoreCards = function() { currentPage++; window.renderCardPage(false); }

window.openCardDetailByRowId = function(rowId) { 
    try {
      const card = globalCardContacts.find(c => String(c.rowId) === String(rowId));
      if(!card) return;
      currentActiveCard = card; 
      
      document.getElementById('ro-name').innerText = card['姓名'] || card['Name'] || '未知姓名';
      
      const statusEl = document.getElementById('ro-claim-status');
      if (isAdmin && statusEl) {
          const isClaimed = card.userId || card['LINE ID'] || card['Line ID'] || card['lineId'];
          statusEl.innerText = isClaimed ? '已認領' : '未認領';
          statusEl.className = isClaimed ? 'px-2 py-0.5 rounded text-[11px] border bg-emerald-50 border-emerald-200 text-emerald-600' : 'px-2 py-0.5 rounded text-[11px] border bg-slate-50 border-slate-200 text-slate-400';
          statusEl.classList.remove('hidden');
      }
      
      document.getElementById('ro-title').innerText = [card['職稱']||card['Title'], card['部門']||card['Department']].filter(Boolean).join(' / ') || '無職稱';
      document.getElementById('ro-company').innerText = [card['公司名稱']||card['CompanyName'], card['英文名/別名']||card['EnglishName']].filter(Boolean).join(' - ') || '未提供';
      document.getElementById('ro-taxid').innerText = card['統一編號'] || card['TaxID'] || '未提供';
      
      const mobileLink = document.getElementById('ro-mobile-link');
      let phoneStr = card['手機號碼'] || card['Mobile'] ? window.formatPhoneStr(card['手機號碼'] || card['Mobile']) : '';
      mobileLink.innerText = phoneStr || '未提供'; mobileLink.href = phoneStr ? `tel:${phoneStr}` : '#';
      
      document.getElementById('ro-tel').innerText = [card['公司電話']||card['Tel'] ? window.formatPhoneStr(card['公司電話']||card['Tel']) : '', card['分機']||card['Ext'] ? `ext.${card['分機']||card['Ext']}` : ''].filter(Boolean).join(' ') || '未提供';
      
      const emailLink = document.getElementById('ro-email-link');
      const emailStr = card['電子郵件'] || card['Email'] || '';
      emailLink.innerText = emailStr || '未提供'; emailLink.href = emailStr ? `mailto:${emailStr}` : '#';
      
      document.getElementById('ro-address').innerText = card['公司地址'] || card['Address'] || '未提供';
      
      const notesArr = [];
      const slogan = card['服務項目/品牌標語']||card['Slogan'];
      if(slogan) notesArr.push(`【服務項目】\n${slogan}`);
      const website = card['公司網址']||card['Website'];
      if(website) notesArr.push(`【網址】${website}`);
      const internalNotes = card['建檔人/備註']||card['Notes'];
      if(internalNotes && isAdmin) notesArr.push(`【內部備註】\n${internalNotes}`);
      
      document.getElementById('ro-notes').innerText = notesArr.join('\n\n') || '無其他資訊';

      const imgEl = document.getElementById('ro-image');
      const noImgEl = document.getElementById('ro-no-image');
      if (card['名片圖檔'] && card['名片圖檔'] !== '圖片儲存失敗' && card['名片圖檔'] !== '無圖檔') {
        imgEl.src = window.getDirectImageUrl(card['名片圖檔']); imgEl.classList.remove('hidden'); noImgEl.classList.add('hidden');
      } else {
        imgEl.src = ''; imgEl.classList.add('hidden'); noImgEl.classList.remove('hidden');
      }
      
      const shareBtn = document.getElementById('btn-share-claim');
      if(shareBtn) shareBtn.classList.toggle('hidden', !isAdmin);

      document.getElementById('readonly-card-modal').classList.remove('hidden');
    } catch(e) { console.log(e); }
}

window.closeReadOnlyCard = function() { 
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'mycard') { window.location.href = 'index.html?view=user-profile'; } 
    else { document.getElementById('readonly-card-modal').classList.add('hidden'); }
}

window.shareClaimLink = async function() {
  if (!currentActiveCard || isProcessing) return;
  isProcessing = true;
  window.setButtonLoading('btn-share-claim', true);

  try {
      const card = currentActiveCard;
      const url = `https://liff.line.me/${LIFF_ID}/?claimCardId=${card.rowId}&referrer=${userProfile.userId}`;
      const flexMessage = {
          type: "bubble", size: "mega",
          body: {
              type: "box", layout: "vertical", paddingAll: "20px",
              contents: [
                  { type: "text", text: "專屬名片認領", weight: "bold", color: "#2563eb", size: "sm" },
                  { type: "text", text: `您好，${card['姓名'] || card['Name'] || ''}！`, weight: "bold", size: "xl", margin: "md" },
                  { type: "text", text: "我已為您建立了數位名片。點擊下方按鈕即可完成資料認領，並啟用轉發功能！", size: "sm", color: "#64748b", wrap: true, margin: "md" }
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
          } catch (err) { window.fallbackShare(url, altText); }
      } else { window.fallbackShare(url, altText); }
  } catch (error) { console.error(error); } 
  finally { window.setButtonLoading('btn-share-claim', false, '邀請認領'); isProcessing = false; }
}

window.openCardEdit = function() { 
    const c = currentActiveCard; if (!c) return;
    const fields = {
      'edit-c-Name': c['姓名'] || c['Name'] || '', 'edit-c-EnglishName': c['英文名/別名'] || c['EnglishName'] || '',
      'edit-c-Title': c['職稱'] || c['Title'] || '', 'edit-c-Department': c['部門'] || c['Department'] || '',
      'edit-c-CompanyName': c['公司名稱'] || c['CompanyName'] || '', 'edit-c-TaxID': c['統一編號'] || c['TaxID'] || '',
      'edit-c-Mobile': window.formatPhoneStr(c['手機號碼'] || c['Mobile']) || '', 'edit-c-Tel': window.formatPhoneStr(c['公司電話'] || c['Tel']) || '',
      'edit-c-Ext': c['分機'] || c['Ext'] || '', 'edit-c-Fax': window.formatPhoneStr(c['傳真'] || c['Fax']) || '',
      'edit-c-Address': c['公司地址'] || c['Address'] || '', 'edit-c-Email': c['電子郵件'] || c['Email'] || '',
      'edit-c-Website': c['公司網址'] || c['Website'] || '', 'edit-c-SocialMedia': c['社群帳號'] || c['SocialMedia'] || '',
      'edit-c-Slogan': c['服務項目/品牌標語'] || c['Slogan'] || '', 'edit-c-Notes': c['建檔人/備註'] || c['Notes'] || ''
    };
    for (const [id, value] of Object.entries(fields)) { const el = document.getElementById(id); if (el) el.value = value; }
    document.getElementById('card-edit-modal').classList.remove('hidden');
}

window.closeCardEdit = function() { document.getElementById('card-edit-modal').classList.add('hidden'); }

window.submitCardEdit = async function() {
  if (isProcessing || !currentActiveCard) return;
  isProcessing = true; window.setButtonLoading('btn-save-card-edit', true);
  let payload = { rowId: currentActiveCard.rowId };
  const fields = ['Name', 'EnglishName', 'Title', 'Department', 'CompanyName', 'TaxID', 'Mobile', 'Tel', 'Ext', 'Fax', 'Address', 'Email', 'Website', 'SocialMedia', 'Slogan', 'Notes'];
  fields.forEach(f => { payload[f] = document.getElementById(`edit-c-${f}`)?.value.trim() || ''; });

  try {
    await window.fetchAPI('updateCard', payload);
    Object.assign(currentActiveCard, payload);
    window.closeCardEdit();
    window.openCardDetailByRowId(payload.rowId);
    window.showToast("✅ 資料更新成功");
  } catch(err) { window.showToast("更新失敗", true); } 
  finally { window.setButtonLoading('btn-save-card-edit', false, '儲存變更'); isProcessing = false; }
}
