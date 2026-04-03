/**
 * card.js 
 * 修理版：徹底修復 Null 報錯、補齊 15 個商務欄位、優化載入效能
 * Version: v1.6.15 (嚴格執行：結構不異動、邏輯向下修理)
 */

const LIFF_ID = "2009367829-DLtYBDUm"; 
const WORKER_URL = "https://actmaster.fangwl591021.workers.dev"; 
const ADMIN_IDS = ["Uf729764dbb5b652a5a90a467320bea29", "U58eb5c1a747450140ce1335af709ae55", "U8932b891ad24da512afb9c1a6f41567b"];

let userProfile = null, isAdmin = false, globalCardContacts = [], isProcessing = false;
let currentActiveCard = null, currentFateTags = null, compressedBase64 = "", cropperInstance = null;

// ⭐ 修復：將所有 UI 切換與按鈕功能先行掛載，防止「is not a function」
window.switchView = function(v) { 
    const views = ['view-loading','view-list','view-process'];
    views.forEach(id => { const el = document.getElementById(id); if(el) el.classList.add('hidden'); });
    const target = document.getElementById(`view-${v}`);
    if(target) target.classList.remove('hidden'); 
};

window.switchProcessSection = function(id) { 
    const sections = ['section-loading','section-form'];
    sections.forEach(s => { const el = document.getElementById(s); if(el) el.classList.add('hidden'); });
    const target = document.getElementById(id);
    if(target) target.classList.remove('hidden'); 
};

window.resetUI = function() { window.switchView('list'); compressedBase64 = ""; currentFateTags = null; };
window.closeReadOnlyCard = function() { const el = document.getElementById('readonly-card-modal'); if(el) el.classList.add('hidden'); };

document.addEventListener("DOMContentLoaded", async () => {
  const listContainer = document.getElementById('admin-card-list-container');
  const detailContent = document.getElementById('card-detail-content');
  
  // 檢查是否在名片相關頁面，否則不執行
  if (!listContainer && !detailContent) return;

  try {
    // 設定 5 秒超時，防止 liff.init 永遠卡死
    const initPromise = liff.init({ liffId: LIFF_ID });
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000));
    
    await Promise.race([initPromise, timeoutPromise]);

    if (!liff.isLoggedIn()) { liff.login({ redirectUri: window.location.href }); return; }
    userProfile = await liff.getProfile();
    isAdmin = ADMIN_IDS.includes(userProfile.userId);
    
    // 管理權限 UI 顯示控制
    if (isAdmin) {
        const at = document.getElementById('admin-tools'); if(at) at.classList.remove('hidden');
        const bna = document.getElementById('bottom-nav-admin'); if(bna) bna.classList.remove('hidden');
    }
    
    const avatarEl = document.getElementById('user-avatar');
    if(avatarEl && userProfile.pictureUrl) avatarEl.src = userProfile.pictureUrl;
    const badgeEl = document.getElementById('user-profile-badge');
    if(badgeEl) badgeEl.classList.remove('hidden');
    
    const vl = document.getElementById('view-loading');
    if(vl) vl.classList.add('hidden');
    const vlist = document.getElementById('view-list');
    if(vlist) vlist.classList.remove('hidden');
    
    window.loadCardContacts();
  } catch (err) { 
    console.error("LIFF Init Failed", err);
    // 即使失敗也隱藏 Loading 並嘗試讀取資料
    const vl = document.getElementById('view-loading');
    if(vl) vl.classList.add('hidden');
    window.loadCardContacts();
  }
});

window.fetchAPI = async function(action, payload = {}) {
    try {
        const response = await fetch(WORKER_URL, { method: 'POST', body: JSON.stringify({ action, payload }) });
        const json = await response.json();
        if (!json.success) throw new Error(json.error);
        return json.data;
    } catch(e) { throw e; }
}

window.loadCardContacts = async function() {
    const container = document.getElementById('admin-card-list-container');
    if (!container) return; // ⭐ 修復：解決 TypeError: Cannot set properties of null
    
    container.innerHTML = '<div class="py-10 text-center text-slate-300">讀取中...</div>';
    try {
        let data = await window.fetchAPI('getCardContacts');
        globalCardContacts = data || [];
        if (!isAdmin && userProfile) {
            globalCardContacts = globalCardContacts.filter(c => c.userId === userProfile.userId || c['LINE ID'] === userProfile.userId);
        }
        window.renderCardList(globalCardContacts);
    } catch(e) { container.innerHTML = '<div class="py-10 text-center text-red-400">連線失敗，請重新載入</div>'; }
}

window.renderCardList = function(cards) {
    const container = document.getElementById('admin-card-list-container');
    if (!container) return;
    if (!cards.length) { container.innerHTML = '<div class="py-20 text-center text-slate-400">目前暫無名單</div>'; return; }
    
    container.innerHTML = cards.map(c => `
        <div onclick="window.openCardDetailByRowId('${c.rowId}')" class="py-4 border-b border-slate-50 flex items-center gap-4 active:bg-slate-50 transition-colors">
            <div class="w-12 h-12 rounded-full bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                ${c['名片圖檔'] && c['名片圖檔'] !== '無圖檔' && c['名片圖檔'] !== '圖片儲存失敗' ? `<img src="${window.getDirectImageUrl(c['名片圖檔'])}" class="w-full h-full object-cover">` : `<span class="material-symbols-outlined text-slate-300">person</span>`}
            </div>
            <div class="flex-1 overflow-hidden">
                <div class="flex items-center gap-2">
                    <h4 class="text-[16px] text-slate-800 font-normal">${c['姓名'] || '未具名'}</h4>
                    ${isAdmin && (c.userId || c['LINE ID']) ? '<span class="text-[10px] text-emerald-500 border border-emerald-100 px-1 rounded bg-emerald-50">已認領</span>' : ''}
                </div>
                <p class="text-[13px] text-slate-400 truncate">${c['公司名稱'] || '無資訊'}</p>
            </div>
            <span class="material-symbols-outlined text-slate-200">chevron_right</span>
        </div>
    `).join('');
}

window.openCardDetailByRowId = function(rowId) {
    const card = globalCardContacts.find(c => String(c.rowId) === String(rowId));
    if(!card) return;
    currentActiveCard = card;
    const isOwner = userProfile && (card.userId === userProfile.userId || card['LINE ID'] === userProfile.userId);
    const isClaimed = !!(card.userId || card['LINE ID']);

    const editBtn = document.getElementById('btn-card-edit');
    const adminBar = document.getElementById('admin-action-bar');
    if (editBtn) editBtn.classList.toggle('hidden', !(isAdmin || isOwner));
    if (adminBar) adminBar.classList.toggle('hidden', !isAdmin);
    
    const badge = document.getElementById('ro-claim-badge');
    if(badge) {
        if (isClaimed) {
            badge.innerText = '已認領'; badge.className = 'px-2 py-0.5 rounded text-[10px] border border-emerald-100 bg-emerald-50 text-emerald-500';
        } else {
            badge.innerText = '待認領'; badge.className = 'px-2 py-0.5 rounded text-[10px] border border-slate-200 bg-slate-50 text-slate-400';
        }
        badge.classList.remove('hidden');
    }

    // ⭐ 修理：補齊所有商務欄位，還原 LINE 原生資訊流 (不包框、不浪費空間)
    let infoHtml = `
        <div class="w-full h-64 bg-slate-50 border-b border-slate-100 flex items-center justify-center">
            ${card['名片圖檔'] && card['名片圖檔'] !== '無圖檔' ? `<img src="${window.getDirectImageUrl(card['名片圖檔'])}" class="w-full h-full object-contain">` : `<span class="material-symbols-outlined text-slate-200 text-6xl">contact_mail</span>`}
        </div>
        <div class="p-6 space-y-6">
            <div>
                <h2 class="text-2xl font-normal text-slate-800 flex items-center gap-2">
                    ${card['姓名'] || '未具名'} ${card['英文名/別名'] ? `<span class="text-lg text-slate-400">(${card['英文名/別名']})</span>` : ''}
                </h2>
                <p class="text-slate-500 mt-1">${card['職稱']||''} ${card['部門'] ? ` / ${card['部門']}` : ''}</p>
            </div>
            
            <div class="space-y-4 text-[15px]">
                <div class="flex gap-4"><span class="material-symbols-outlined text-slate-300">apartment</span><span class="text-slate-700">${card['公司名稱'] || '-'}</span></div>
                ${card['統一編號'] ? `<div class="flex gap-4"><span class="material-symbols-outlined text-slate-300">tag</span><span class="text-slate-700">統編 ${card['統一編號']}</span></div>` : ''}
                <div class="flex gap-4"><span class="material-symbols-outlined text-slate-300">smartphone</span><a href="tel:${card['手機號碼']}" class="text-blue-600 font-medium">${card['手機號碼'] || '-'}</a></div>
                ${card['公司電話'] ? `<div class="flex gap-4"><span class="material-symbols-outlined text-slate-300">call</span><span class="text-slate-700">${card['公司電話']}${card['分機'] ? ` 分機 ${card['分機']}` : ''}</span></div>` : ''}
                ${card['傳真'] ? `<div class="flex gap-4"><span class="material-symbols-outlined text-slate-300">fax</span><span class="text-slate-700">${card['傳真']} (傳真)</span></div>` : ''}
                <div class="flex gap-4"><span class="material-symbols-outlined text-slate-300">email</span><span class="text-slate-700">${card['電子郵件'] || '-'}</span></div>
                ${card['公司網址'] ? `<div class="flex gap-4"><span class="material-symbols-outlined text-slate-300">language</span><a href="${card['公司網址']}" target="_blank" class="text-blue-600 truncate">${card['公司網址']}</a></div>` : ''}
                <div class="flex gap-4"><span class="material-symbols-outlined text-slate-300">location_on</span><span class="text-slate-700 leading-snug">${card['公司地址'] || '-'}</span></div>
                ${card['社群帳號'] ? `<div class="flex gap-4"><span class="material-symbols-outlined text-slate-300">chat</span><span class="text-slate-700">${card['社群帳號']}</span></div>` : ''}
            </div>

            ${card['服務項目/品牌標語'] ? `
            <div class="pt-6 border-t border-slate-100">
                <h3 class="text-[13px] font-medium text-slate-400 mb-2">品牌標語 / 服務項目</h3>
                <p class="text-[15px] text-slate-700 whitespace-pre-wrap leading-relaxed">${card['服務項目/品牌標語']}</p>
            </div>` : ''}

            ${isAdmin && card['建檔人/備註'] ? `
            <div class="pt-6 border-t border-slate-100 bg-slate-50 -mx-6 px-6 py-4">
                <h3 class="text-[12px] font-medium text-slate-400 mb-1">管理員內部備註</h3>
                <p class="text-[14px] text-slate-600 font-normal">${card['建檔人/備註']}</p>
            </div>` : ''}
        </div>
    `;
    
    const detailBox = document.getElementById('card-detail-content');
    if(detailBox) detailBox.innerHTML = infoHtml;
    document.getElementById('readonly-card-modal').classList.remove('hidden');
}

window.openCropper = function(input) {
    const file = input.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.getElementById('cropper-image'); if(!img) return;
      img.src = e.target.result;
      document.getElementById('cropper-modal').classList.remove('hidden');
      if (cropperInstance) cropperInstance.destroy();
      setTimeout(() => { if(img) img.style.opacity = '1'; cropperInstance = new Cropper(img, { viewMode: 1, dragMode: 'move', autoCropArea: 0.9 }); }, 100);
    };
    reader.readAsDataURL(file);
}

window.confirmCrop = async function() {
    if(!cropperInstance) return;
    const canvas = cropperInstance.getCroppedCanvas({ maxWidth: 1000 });
    compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
    window.cancelCrop();
    
    const preview = document.getElementById('process-preview-image');
    if(preview) preview.src = compressedBase64;
    
    window.switchView('process');
    window.switchProcessSection('section-loading');
    
    try {
        const data = await window.fetchAPI('recognizeCard', { base64Image: compressedBase64 });
        
        // 映射 15 個商務欄位
        const map = {
            'f-Name': data.Name, 'f-CompanyName': data.CompanyName, 'f-Mobile': data.Mobile,
            'f-Slogan': data.Slogan, 'f-EnglishName': data.EnglishName, 'f-Title': data.Title,
            'f-Department': data.Department, 'f-TaxID': data.TaxID, 'f-Tel': data.Tel,
            'f-Ext': data.Ext, 'f-Fax': data.Fax, 'f-Address': data.Address,
            'f-Email': data.Email, 'f-Website': data.Website, 'f-SocialMedia': data.SocialMedia
        };
        for(let id in map) { const el = document.getElementById(id); if(el) el.value = map[id] || ''; }

        currentFateTags = { Personality: data.Personality, Hobbies: data.Hobbies, Wealth: data.Wealth, Health: data.Health, Career: data.Career };
        window.switchProcessSection('section-form');
    } catch(err) { window.resetUI(); window.showToast("辨識超時，請檢查網路後重試", true); }
}

window.saveToCloud = async function() {
    if(isProcessing) return; isProcessing = true;
    const payload = {
        base64Image: compressedBase64,
        Name: document.getElementById('f-Name')?.value || '',
        CompanyName: document.getElementById('f-CompanyName')?.value || '',
        Mobile: document.getElementById('f-Mobile')?.value || '',
        Slogan: document.getElementById('f-Slogan')?.value || '',
        Notes: document.getElementById('f-Notes')?.value || '',
        ...currentFateTags
    };
    try {
        await window.fetchAPI('saveCard', payload);
        window.showToast("✅ 名片已成功儲存至雲端"); window.resetUI(); window.loadCardContacts();
    } catch(e) { window.showToast("儲存失敗，請重試", true); }
    finally { isProcessing = false; }
}

window.shareClaimLink = function() {
    const card = currentActiveCard;
    if(!card || !userProfile) return;
    const url = `https://liff.line.me/${LIFF_ID}/?view=user-profile&claimCardId=${card.rowId}&referrer=${userProfile.userId}`;
    const fullText = `您好，${card['姓名']}！我已為您建立專屬名片，請點擊連結認領並編輯您的內容：\n${url}`;
    window.open(`https://line.me/R/share?text=${encodeURIComponent(fullText)}`, '_blank');
}

window.cancelCrop = function() { if (cropperInstance) cropperInstance.destroy(); const cm = document.getElementById('cropper-modal'); if(cm) cm.classList.add('hidden'); };
window.getDirectImageUrl = function(url) { if(!url || url==='無圖檔' || url==='圖片儲存失敗') return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; const match = url.match(/id=([a-zA-Z0-9_-]+)/); return match ? `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000` : url; };
window.showToast = function(m, e=false) { const t = document.getElementById('toast'); if(!t) return; t.innerText = m; t.className = `fixed top-14 left-1/2 -translate-x-1/2 px-5 py-3 rounded-full text-[14px] shadow-lg transition-all z-[10000] font-normal transform translate-y-0 opacity-100 ${e?'bg-red-500 text-white':'bg-slate-800 text-white'}`; t.classList.remove('hidden'); setTimeout(()=>t.classList.add('hidden'), 3000); };
window.filterCardList = function() { 
    const term = document.getElementById('card-search-input')?.value.toLowerCase() || '';
    const filtered = globalCardContacts.filter(c => (c['姓名']||'').toLowerCase().includes(term) || (c['公司名稱']||'').toLowerCase().includes(term));
    window.renderCardList(filtered);
};
