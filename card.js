/**
 * card.js 
 * QQ 大師修復版：實作嚴格的 A波(2條) 與 B波(5條) 動態切換，解決日期讀取空白問題
 * Version: v1.6.7 
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

function fallbackShare(url, altText) {
    const fullText = `${altText}\n${url}`;
    const fallbackInput = document.createElement('textarea');
    fallbackInput.value = fullText;
    fallbackInput.style.position = 'fixed';
    fallbackInput.style.opacity = '0';
    document.body.appendChild(fallbackInput);
    fallbackInput.select();
    try {
        document.execCommand('copy');
        alert("⚠️ 電腦版或外部瀏覽器無法直接傳送圖文訊息。\n\n✅ 系統已為您複製「專屬連結」至剪貼簿！\n您可以直接貼上給好友，或在跳出的視窗中選擇好友分享。");
    } catch(err) {
        alert("請複製以下連結分享給好友：\n\n" + url);
    }
    document.body.removeChild(fallbackInput);
    window.open(`https://line.me/R/share?text=${encodeURIComponent(fullText)}`, '_blank');
}

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const claimCardId = params.get('claimCardId');
  
  if (claimCardId) {
      window.location.replace(`index.html?view=user-profile&claimCardId=${claimCardId}&referrer=${params.get('referrer') || ''}`);
      return;
  }

  if (!document.getElementById('card-search-input')) return;

  try {
    await liff.init({ liffId: LIFF_ID });
    const shareCardId = params.get('shareCardId');
    
    if (shareCardId) {
      if (!liff.isLoggedIn()) { liff.login({ redirectUri: window.location.href }); return; }
      
      const loadText = document.getElementById('loading-text');
      if(loadText) loadText.innerText = '準備轉發數位名片...';
      
      try {
          const contacts = await fetchAPI('getCardContacts');
          const card = contacts.find(c => String(c.rowId) === String(shareCardId));
          if (!card) throw new Error('找不到該名片資料');

          let config = null;
          if (card['自訂名片設定']) { try { config = JSON.parse(card['自訂名片設定']); } catch(e){} }

          const imgUrlForAr = config && config.imgUrl ? getDirectImageUrl(config.imgUrl) : getDirectImageUrl(card['名片圖檔']);
          const detectedAr = await getTrueAspectRatio(imgUrlForAr);

          if (typeof window.buildFlexMessageFromCard === 'function') {
             const flexContents = buildFlexMessageFromCard(card, config, detectedAr);
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
                 } catch(e) {
                     fallbackShare(shareUrl, altText);
                 }
             } else {
                 fallbackShare(shareUrl, altText);
             }
          } else {
             alert('無法載入電子名片模組');
          }
      } catch (e) {
          alert('名片讀取失敗: ' + e.message); 
      }
      return; 
    }

    if (liff.isLoggedIn()) {
      userProfile = await liff.getProfile();
      document.getElementById('user-avatar').src = userProfile.pictureUrl || '';
      document.getElementById('user-profile-badge').classList.remove('hidden');
      isAdmin = ADMIN_IDS.includes(userProfile.userId);
      
      const roleBtn = document.getElementById('role-switch-btn');
      if (roleBtn && !isAdmin) { roleBtn.remove(); }

      switchView('list');
    } else {
      liff.login({ redirectUri: window.location.href });
    }
  } catch (err) {
    showToast("⚠️ LIFF 初始化失敗", true);
  }
});

function setButtonLoading(btnId, isLoading, originalText = '') {
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

function getDirectImageUrl(url) { 
  if (!url) return url;
  const driveMatch = url.match(/id=([a-zA-Z0-9_-]+)/) || url.match(/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch && url.includes('drive.google.com')) return `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w1000`;
  return url;
}

const getTrueAspectRatio = (url) => new Promise((resolve) => {
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

async function fetchAPI(action, payload = {}, silent = false) {
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
    if (!silent) showToast(err.message, true); 
    throw err;
  }
}

function switchView(view) {
  ['view-loading', 'view-list', 'view-process'].forEach(v => {
    const el = document.getElementById(v);
    if (el) el.classList.add('hidden');
  });
  
  if (view === 'process') {
    document.getElementById('view-process').classList.remove('hidden');
  } else if (view === 'list') {
    document.getElementById('view-list').classList.remove('hidden');
    if (globalCardContacts.length === 0 && !isProcessing) {
        loadCardContacts();
    }
  }
}

function switchProcessSection(id) {
  ['section-loading', 'section-form'].forEach(v => {
    const el = document.getElementById(v);
    if (el) el.classList.add('hidden');
  });
  const target = document.getElementById(id);
  if (target) target.classList.remove('hidden');
}

function resetUI() {
  document.getElementById('card-camera').value = "";
  document.getElementById('card-upload').value = "";
  compressedBase64 = "";
  currentFateTags = null;
  
  const params = new URLSearchParams(window.location.search);
  if (params.get('mode') === 'mycard') {
      window.location.href = 'index.html?view=user-profile';
  } else {
      switchView('list');
  }
}

function showToast(msg, isError = false) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.innerHTML = `<span class="material-symbols-outlined icon-filled">${isError ? 'error' : 'info'}</span> ${msg}`;
  t.className = `fixed top-14 left-1/2 -translate-x-1/2 px-5 py-3 rounded text-[15px] shadow-lg transition-all font-bold flex items-center gap-2 w-max max-w-[90vw] ${isError ? 'bg-red-500 text-white border-red-600' : 'bg-slate-800 text-white border-slate-700'} opacity-100`;
  t.style.zIndex = '10000';
  t.classList.remove('hidden');
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translate(-50%, -1rem)'; setTimeout(() => t.classList.add('hidden'), 300); }, 3000); 
}

function openCropper(input, mode = 'card') {
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

function cancelCrop() {
  if (cropperInstance) { cropperInstance.destroy(); cropperInstance = null; }
  document.getElementById('section-cropper').classList.add('hidden');
}

async function confirmCrop() {
  if (!cropperInstance) return;
  const croppedCanvas = cropperInstance.getCroppedCanvas({ maxWidth: 1200, maxHeight: 1200, imageSmoothingEnabled: true, imageSmoothingQuality: 'high' });
  compressedBase64 = croppedCanvas.toDataURL('image/jpeg', 0.8);
  cancelCrop();
  
  if (uploadTargetMode === 'ecard') {
      const btn = document.getElementById('btn-check-format'); 
      const originalHtml = btn.innerHTML;
      btn.innerHTML = '<span class="material-symbols-outlined text-[20px] animate-spin">refresh</span> 上傳中';
      btn.classList.add('pointer-events-none');
      try {
          showToast("圖片上傳中...", false);
          const url = await fetchAPI('uploadImage', { base64Image: compressedBase64 });
          document.getElementById('ec-img-input').value = url;
          if (typeof window.updateECardPreview === 'function') window.updateECardPreview();
          showToast("✅ 圖片上傳成功");
      } catch (err) {
          showToast("⚠️ 上傳失敗：" + err.message, true);
      } finally {
          btn.innerHTML = originalHtml;
          btn.classList.remove('pointer-events-none');
      }
  } else {
      document.getElementById('process-preview-image').src = compressedBase64;
      switchView('process');
      switchProcessSection('section-loading');
      recognizeCardData();
  }
}

async function recognizeCardData() {
  try {
    const data = await fetchAPI('recognizeCard', { base64Image: compressedBase64 });
    const fields = ['Name', 'EnglishName', 'Title', 'Department', 'CompanyName', 'TaxID', 'Mobile', 'Tel', 'Ext', 'Fax', 'Address', 'Email', 'Website', 'SocialMedia', 'Slogan'];
    
    fields.forEach(f => {
      const el = document.getElementById(`f-${f}`);
      if(el) {
          let val = data[f] || '';
          if (f === 'Mobile' || f === 'Tel' || f === 'Fax') val = formatPhoneStr(val);
          if (f === 'Website' && val && !val.startsWith('http') && val.includes('.')) val = 'https://' + val;
          el.value = val;
      }
    });

    currentFateTags = {
        Personality: data.Personality || '',
        Hobbies: data.Hobbies || '',
        Wealth: data.Wealth || '',
        Health: data.Health || '',
        Career: data.Career || ''
    };
    switchProcessSection('section-form');
    showToast("✅ AI 辨識完成");
  } catch(err) {
    resetUI();
  }
}

async function saveToCloud() {
  if (isProcessing) return; 
  isProcessing = true;
  setButtonLoading('btn-save', true);
  
  const payload = {
    base64Image: compressedBase64,
    Notes: document.getElementById('f-Notes').value,
    userId: '', 
    ...(currentFateTags || {})
  };
  
  const fields = ['Name', 'EnglishName', 'Title', 'Department', 'CompanyName', 'TaxID', 'Mobile', 'Tel', 'Ext', 'Fax', 'Address', 'Email', 'Website', 'SocialMedia', 'Slogan'];
  fields.forEach(f => { payload[f] = document.getElementById(`f-${f}`).value; });
  
  if (!payload.Name && !payload.CompanyName) {
    setButtonLoading('btn-save', false, '存入雲端');
    isProcessing = false;
    return showToast("⚠️ 請輸入姓名或公司", true);
  }

  if (!currentFateTags || !currentFateTags.Personality || currentFateTags.Personality === '待分析' || currentFateTags.Personality === '') {
      try {
          setButtonLoading('btn-save', true, 'AI 命理建檔中...');
          const tags = await fetchAPI('calculateFateTags', { Name: payload.Name, Mobile: payload.Mobile, Birthday: '' }, true);
          currentFateTags = {
              Personality: tags.Personality || '',
              Hobbies: tags.Hobbies || '',
              Wealth: tags.Wealth || '',
              Health: tags.Health || '',
              Career: tags.Career || ''
          };
      } catch(e) {
          console.warn("Fate calculation failed", e);
      }
  }
  
  Object.assign(payload, currentFateTags);

  try {
    await fetchAPI('saveCard', payload);
    showToast("🎉 建立成功！");
    globalCardContacts = [];
    sessionStorage.removeItem('getCardContacts{}');
    setTimeout(() => { resetUI(); }, 1000);
  } catch(err) {
    console.error(err);
  } finally {
    setButtonLoading('btn-save', false, '存入雲端');
    isProcessing = false;
  }
}

async function loadCardContacts() { 
    const container = document.getElementById('admin-card-list-container');
    if (!container) return; 
    
    if (!isAdmin) {
        const navAdmin = document.getElementById('bottom-nav-admin');
        if (navAdmin) navAdmin.classList.add('hidden');
        const toolsContainer = document.getElementById('admin-tools-container');
        if (toolsContainer) toolsContainer.classList.add('hidden');
        const searchContainer = document.getElementById('admin-search-container');
        if (searchContainer) searchContainer.classList.add('hidden');
        const loadMoreBox = document.getElementById('card-load-more-box');
        if (loadMoreBox) loadMoreBox.classList.add('hidden');
    }

    const cacheKey = 'getCardContacts{}';
    const cached = sessionStorage.getItem(cacheKey);
    
    if (cached) {
        try {
            globalCardContacts = JSON.parse(cached);
            globalCardContacts.forEach(c => {
                if (c['手機號碼']) c['手機號碼'] = formatPhoneStr(c['手機號碼']);
                if (c['公司電話']) c['公司電話'] = formatPhoneStr(c['公司電話']);
            });
            
            if (!isAdmin) {
                globalCardContacts = globalCardContacts.filter(c => c.userId === userProfile.userId || c['LINE ID'] === userProfile.userId || c['Line ID'] === userProfile.userId);
                const mode = new URLSearchParams(window.location.search).get('mode');
                if (mode === 'mycard' && globalCardContacts.length > 0) {
                    openCardDetailByRowId(globalCardContacts[0].rowId);
                } else if (mode === 'mycard' && globalCardContacts.length === 0) {
                    showToast("找不到您的專屬名片", true);
                    setTimeout(() => window.location.href = 'index.html?view=user-profile', 2000);
                }
            }
            
            filterCardList(); 
        } catch(e) {}
    } else {
        container.innerHTML = '<div class="text-center py-10"><div class="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin mx-auto"></div></div>';
    }

    fetchAPI('getCardContacts', {}, true).then(data => {
        globalCardContacts = data || [];
        globalCardContacts.forEach(c => {
            if (c['手機號碼']) c['手機號碼'] = formatPhoneStr(c['手機號碼']);
            if (c['公司電話']) c['公司電話'] = formatPhoneStr(c['公司電話']);
        });
        sessionStorage.setItem(cacheKey, JSON.stringify(globalCardContacts));
        
        if (!isAdmin) {
            globalCardContacts = globalCardContacts.filter(c => c.userId === userProfile.userId || c['LINE ID'] === userProfile.userId || c['Line ID'] === userProfile.userId);
            const mode = new URLSearchParams(window.location.search).get('mode');
            if (mode === 'mycard' && globalCardContacts.length > 0 && !cached) {
                openCardDetailByRowId(globalCardContacts[0].rowId);
            } else if (mode === 'mycard' && globalCardContacts.length === 0 && !cached) {
                showToast("找不到您的專屬名片", true);
                setTimeout(() => window.location.href = 'index.html?view=user-profile', 2000);
            }
        }
        
        filterCardList(); 
    }).catch(e => {
        if (globalCardContacts.length === 0) {
            container.innerHTML = `<div class="text-center py-10 text-error font-bold">讀取失敗</div>`;
        }
    });
}

function filterCardList() { 
    const searchInput = document.getElementById('card-search-input');
    const term = searchInput ? searchInput.value.toLowerCase() : '';
    filteredCards = globalCardContacts.filter(c => 
      (c['姓名'] || '').toLowerCase().includes(term) || 
      (c['公司名稱'] || '').toLowerCase().includes(term)
    );
    currentPage = 1;
    renderCardPage(true);
}

function renderCardPage(isReset = false) {
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
        <div onclick="openCardDetailByRowId('${card.rowId}')" class="pl-[5px] pr-4 py-4 bg-white flex items-center gap-4 border-b border-slate-200 last:border-b-0 active:bg-slate-50 cursor-pointer transition-colors">
          <div class="w-[52px] h-[52px] shrink-0 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200">
            ${card['名片圖檔'] && card['名片圖檔'] !== '圖片儲存失敗' && card['名片圖檔'] !== '無圖檔' ? `<img src="${getDirectImageUrl(card['名片圖檔'])}" class="w-full h-full object-cover">` : `<span class="material-symbols-outlined text-slate-400 text-[24px]">person</span>`}
          </div>
          <div class="flex-1 overflow-hidden flex flex-col justify-center gap-1.5">
            <div class="flex items-center">
              <h4 class="text-[17px] text-slate-800 truncate leading-none">${card['姓名'] || '未知姓名'}</h4>
              ${isAdmin ? claimBadge : ''}
            </div>
            <p class="text-[14px] text-slate-500 truncate leading-none">${card['公司名稱'] || card['職稱'] || '無資訊'}</p>
          </div>
        </div>
    `}).join('');

    const loadMoreBtnId = 'btn-load-more-cards';
    let loadMoreBtn = document.getElementById(loadMoreBtnId);

    if (isReset) {
        container.innerHTML = `<div class="bg-white border border-slate-200 rounded overflow-hidden" id="card-list-wrapper">${html}</div>`;
    } else {
        if (loadMoreBtn) loadMoreBtn.remove();
        const wrapper = document.getElementById('card-list-wrapper');
        if (wrapper) wrapper.insertAdjacentHTML('beforeend', html);
    }

    if (endIndex < filteredCards.length) {
        const wrapper = document.getElementById('card-list-wrapper');
        if (wrapper) {
            wrapper.insertAdjacentHTML('afterend', `
                <button id="${loadMoreBtnId}" onclick="loadMoreCards()" class="w-full py-3 mt-3 bg-white text-slate-700 font-bold text-[15px] rounded border border-slate-300 shadow-sm active:bg-slate-50 transition-colors flex justify-center items-center gap-1">
                    <span class="material-symbols-outlined text-[20px]">expand_more</span> 載入更多名片
                </button>
            `);
        }
    }
}

function loadMoreCards() {
    currentPage++;
    renderCardPage(false);
}

function openCardDetailByRowId(rowId) { 
    try {
      const card = globalCardContacts.find(c => String(c.rowId) === String(rowId));
      if(!card) return;
      currentActiveCard = card; 
      
      document.getElementById('ro-name').innerText = card['姓名'] || card['Name'] || '未知姓名';
      
      const statusEl = document.getElementById('ro-claim-status');
      if (isAdmin && statusEl) {
          if (card.userId || card['LINE ID'] || card['Line ID'] || card['lineId']) {
              statusEl.innerText = '已認領';
              statusEl.className = 'px-2 py-0.5 rounded text-[11px] border bg-emerald-50 border-emerald-200 text-emerald-600 font-bold';
          } else {
              statusEl.innerText = '未認領';
              statusEl.className = 'px-2 py-0.5 rounded text-[11px] border bg-slate-50 border-slate-200 text-slate-400 font-bold';
          }
          statusEl.classList.remove('hidden');
      } else if (statusEl) {
          statusEl.classList.add('hidden');
      }
      
      document.getElementById('ro-title').innerText = [card['職稱']||card['Title'], card['部門']||card['Department']].filter(Boolean).join(' / ') || '無職稱';
      document.getElementById('ro-company').innerText = [card['公司名稱']||card['CompanyName'], card['英文名/別名']||card['EnglishName']].filter(Boolean).join(' - ') || '未提供';
      document.getElementById('ro-taxid').innerText = card['統一編號'] || card['TaxID'] || '未提供';
      
      const mobileLink = document.getElementById('ro-mobile-link');
      let phoneStr = card['手機號碼'] || card['Mobile'] ? formatPhoneStr(card['手機號碼'] || card['Mobile']) : '';
      mobileLink.innerText = phoneStr || '未提供';
      mobileLink.href = phoneStr ? `tel:${phoneStr}` : '#';
      
      document.getElementById('ro-tel').innerText = [card['公司電話']||card['Tel'] ? formatPhoneStr(card['公司電話']||card['Tel']) : '', card['分機']||card['Ext'] ? `ext.${card['分機']||card['Ext']}` : ''].filter(Boolean).join(' ') || '未提供';
      
      const emailLink = document.getElementById('ro-email-link');
      const emailStr = card['電子郵件'] || card['Email'] || '';
      emailLink.innerText = emailStr || '未提供';
      emailLink.href = emailStr ? `mailto:${emailStr}` : '#';
      
      document.getElementById('ro-address').innerText = card['公司地址'] || card['Address'] || '未提供';
      
      // ⭐ QQ大師：完美呈現 5 大命理標籤 (無邊框、多行斷行呈現)
      const tagsContainer = document.getElementById('ro-fate-tags-container');
      if (tagsContainer) {
          if (card['個性'] && card['個性'] !== '待分析') {
              tagsContainer.innerHTML = `
              <div class="pt-8 border-t border-slate-100">
                  <h3 class="text-[14px] font-bold text-slate-800 mb-5 tracking-wide flex items-center gap-1.5">
                      <span class="material-symbols-outlined text-[18px] text-primary">psychology</span> AI 深度命理分析
                  </h3>
                  <div class="space-y-5 text-[14px] font-normal">
                      ${card['個性'] ? `<div class="flex gap-3 items-start flex-col sm:flex-row pb-4 border-b border-slate-50 last:border-0"><span class="text-slate-400 w-[40px] shrink-0 sm:pt-0.5 font-bold">個性</span><span class="text-slate-700 leading-relaxed whitespace-pre-wrap flex-1">${card['個性']}</span></div>` : ''}
                      ${card['興趣'] ? `<div class="flex gap-3 items-start flex-col sm:flex-row pb-4 border-b border-slate-50 last:border-0"><span class="text-slate-400 w-[40px] shrink-0 sm:pt-0.5 font-bold">興趣</span><span class="text-slate-700 leading-relaxed whitespace-pre-wrap flex-1">${card['興趣']}</span></div>` : ''}
                      ${card['財運'] ? `<div class="flex gap-3 items-start flex-col sm:flex-row pb-4 border-b border-slate-50 last:border-0"><span class="text-slate-400 w-[40px] shrink-0 sm:pt-0.5 font-bold">財運</span><span class="text-slate-700 leading-relaxed whitespace-pre-wrap flex-1">${card['財運']}</span></div>` : ''}
                      ${card['健康'] ? `<div class="flex gap-3 items-start flex-col sm:flex-row pb-4 border-b border-slate-50 last:border-0"><span class="text-slate-400 w-[40px] shrink-0 sm:pt-0.5 font-bold">健康</span><span class="text-slate-700 leading-relaxed whitespace-pre-wrap flex-1">${card['健康']}</span></div>` : ''}
                      ${card['事業'] ? `<div class="flex gap-3 items-start flex-col sm:flex-row pb-4 border-b border-slate-50 last:border-0"><span class="text-slate-400 w-[40px] shrink-0 sm:pt-0.5 font-bold">事業</span><span class="text-slate-700 leading-relaxed whitespace-pre-wrap flex-1">${card['事業']}</span></div>` : ''}
                  </div>
              </div>`;
          } else {
              tagsContainer.innerHTML = '';
          }
      }

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
      document.getElementById('ro-notes').innerText = finalNotes || '無其他資訊';

      const imgEl = document.getElementById('ro-image');
      const noImgEl = document.getElementById('ro-no-image');
      if (card['名片圖檔'] && card['名片圖檔'] !== '圖片儲存失敗' && card['名片圖檔'] !== '無圖檔') {
        imgEl.src = getDirectImageUrl(card['名片圖檔']);
        imgEl.classList.remove('hidden');
        noImgEl.classList.add('hidden');
      } else {
        imgEl.src = '';
        imgEl.classList.add('hidden');
        noImgEl.classList.remove('hidden');
      }
      
      const shareBtn = document.getElementById('btn-share-claim');
      if (shareBtn) {
          if (!isAdmin) {
              shareBtn.classList.add('hidden');
          } else {
              shareBtn.classList.remove('hidden');
          }
      }

      document.getElementById('readonly-card-modal').classList.remove('hidden');
    } catch(e) {
      console.error("開啟錯誤:", e.message);
    }
}

function closeReadOnlyCard() { 
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'mycard') {
        window.location.href = 'index.html?view=user-profile';
    } else {
        document.getElementById('readonly-card-modal').classList.add('hidden'); 
    }
}

async function shareClaimLink() {
  if (!currentActiveCard || isProcessing) return;
  isProcessing = true;
  setButtonLoading('btn-share-claim', true);

  try {
      const card = currentActiveCard;
      const myLiffId = (typeof LIFF_ID !== 'undefined') ? LIFF_ID : '2009367829-DLtYBDUm';
      const url = `https://liff.line.me/${myLiffId}/?view=user-profile&claimCardId=${card.rowId}&referrer=${userProfile.userId}`;

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
              if (res) showToast('✅ 認領連結已發送！');
          } catch (err) {
              fallbackShare(url, altText);
          }
      } else {
          fallbackShare(url, altText);
      }
  } catch (error) {
      console.error(error);
  } finally {
      setButtonLoading('btn-share-claim', false, '邀請認領');
      isProcessing = false;
  }
}

function openCardEdit() { 
    const c = currentActiveCard;
    if (!c) return;
    
    let webStr = c['公司網址'] || c['Website'] || '';
    if (webStr && !webStr.startsWith('http') && webStr.includes('.')) webStr = 'https://' + webStr;

    // ⭐ QQ大師修復：處理從資料庫讀出之生日字串，轉換為 <input type="date"> 需要的 YYYY-MM-DD 格式
    let bdayVal = c['生日'] || '';
    if (bdayVal) {
        try {
            const d = new Date(bdayVal);
            if (!isNaN(d.getTime())) {
                bdayVal = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            }
        } catch(e){}
    }

    const fields = {
      'edit-c-Name': c['姓名'] || c['Name'] || '',
      'edit-c-EnglishName': c['英文名/別名'] || c['EnglishName'] || '',
      'edit-c-Title': c['職稱'] || c['Title'] || '',
      'edit-c-Department': c['部門'] || c['Department'] || '',
      'edit-c-CompanyName': c['公司名稱'] || c['CompanyName'] || '',
      'edit-c-TaxID': c['統一編號'] || c['TaxID'] || '',
      'edit-c-Mobile': formatPhoneStr(c['手機號碼'] || c['Mobile']) || '',
      'edit-c-Tel': formatPhoneStr(c['公司電話'] || c['Tel']) || '',
      'edit-c-Ext': c['分機'] || c['Ext'] || '',
      'edit-c-Fax': formatPhoneStr(c['傳真'] || c['Fax']) || '',
      'edit-c-Address': c['公司地址'] || c['Address'] || '',
      'edit-c-Email': c['電子郵件'] || c['Email'] || '',
      'edit-c-Website': webStr,
      'edit-c-SocialMedia': c['社群帳號'] || c['SocialMedia'] || '',
      'edit-c-Slogan': c['服務項目/品牌標語'] || c['Slogan'] || '',
      'edit-c-Notes': c['建檔人/備註'] || c['Notes'] || '',
      'edit-c-Birthday': bdayVal
    };
    
    for (const [id, value] of Object.entries(fields)) {
      const el = document.getElementById(id);
      if (el) el.value = value;
    }

    document.getElementById('card-edit-modal').classList.remove('hidden');
}

function closeCardEdit() { document.getElementById('card-edit-modal').classList.add('hidden'); }

async function submitCardEdit() {
  if (isProcessing || !currentActiveCard) return;
  isProcessing = true;
  setButtonLoading('btn-save-card-edit', true);

  let payload = {
    rowId: currentActiveCard.rowId,
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
  
  // 防呆：比對生日時，將 DB 的原始字串先轉成 YYYY-MM-DD 才能準確比對
  let parsedOldBday = '';
  const oldBdayRaw = currentActiveCard['生日'] || '';
  if (oldBdayRaw) {
      const d = new Date(oldBdayRaw);
      if (!isNaN(d.getTime())) parsedOldBday = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  
  const tagsMissing = !currentActiveCard['個性'] || currentActiveCard['個性'] === '待分析';
  
  // ⭐ QQ大師：B波 - 若姓名、電話、生日任一異動，或本來缺標籤，主動重新觸發深度運算 (5條)
  if (payload.Name !== oldName || payload.Mobile !== oldPhone || payload.Birthday !== parsedOldBday || tagsMissing) {
      try {
           setButtonLoading('btn-save-card-edit', true, 'AI 深度分析中...');
           const newTags = await fetchAPI('calculateFateTags', { Name: payload.Name, Mobile: payload.Mobile, Birthday: payload.Birthday }, true);
           payload = { ...payload, ...newTags };
      } catch (e) {}
  }

  try {
    await fetchAPI('updateCard', payload);
    Object.assign(currentActiveCard, {
      '姓名': payload.Name, 'Name': payload.Name, '英文名/別名': payload.EnglishName,
      '手機號碼': payload.Mobile, 'Mobile': payload.Mobile, '公司名稱': payload.CompanyName,
      '職稱': payload.Title, 'Title': payload.Title, '部門': payload.Department,
      '統一編號': payload.TaxID, 'TaxID': payload.TaxID, '公司電話': payload.Tel,
      '傳真': payload.Fax, 'Fax': payload.Fax, '分機': payload.Ext, 'Ext': payload.Ext,
      '電子郵件': payload.Email, 'Email': payload.Email, '公司地址': payload.Address,
      '公司網址': payload.Website, '社群帳號': payload.SocialMedia,
      '服務項目/品牌標語': payload.Slogan, 'Slogan': payload.Slogan,
      '建檔人/備註': payload.Notes, 'Notes': payload.Notes,
      '生日': payload.Birthday
    });
    if (payload.Personality) currentActiveCard['個性'] = payload.Personality;
    if (payload.Hobbies) currentActiveCard['興趣'] = payload.Hobbies;
    if (payload.Wealth) currentActiveCard['財運'] = payload.Wealth;
    if (payload.Health) currentActiveCard['健康'] = payload.Health;
    if (payload.Career) currentActiveCard['事業'] = payload.Career;

    closeCardEdit();
    
    const index = globalCardContacts.findIndex(c => c.rowId === payload.rowId);
    if (index !== -1) globalCardContacts[index] = currentActiveCard;
    openCardDetailByRowId(payload.rowId);
    
    fetchAPI('getCardContacts').then(data => {
        globalCardContacts = data || [];
        globalCardContacts.forEach(c => {
          if (c['手機號碼']) c['手機號碼'] = formatPhoneStr(c['手機號碼']);
          if (c['公司電話']) c['公司電話'] = formatPhoneStr(c['公司電話']);
        });
        filterCardList();
    });

    showToast("✅ 資料更新成功");
  } catch(err) {
    showToast("更新失敗", true);
  } finally {
    setButtonLoading('btn-save-card-edit', false, '儲存變更');
    isProcessing = false;
  }
}
