/**
 * card.js 
 * 修理版：修復 Null 報錯、補齊 15 個商務欄位、確保全域函式掛載
 * Version: v1.6.14
 */

const LIFF_ID = "2009367829-DLtYBDUm"; 
const WORKER_URL = "https://actmaster.fangwl591021.workers.dev"; 
const ADMIN_IDS = ["Uf729764dbb5b652a5a90a467320bea29", "U58eb5c1a747450140ce1335af709ae55", "U8932b891ad24da512afb9c1a6f41567b"];

let userProfile = null, isAdmin = false, globalCardContacts = [], isProcessing = false;
let currentActiveCard = null, currentFateTags = null, compressedBase64 = "", cropperInstance = null;

document.addEventListener("DOMContentLoaded", async () => {
  // ⭐ 頁面檢查防呆：如果不是在有名片列表的頁面，就不執行後續載入
  if (!document.getElementById('admin-card-list-container') && !document.getElementById('card-detail-content')) return;

  try {
    await liff.init({ liffId: LIFF_ID });
    if (!liff.isLoggedIn()) { liff.login({ redirectUri: window.location.href }); return; }
    userProfile = await liff.getProfile();
    isAdmin = ADMIN_IDS.includes(userProfile.userId);
    
    // UI 元件權限鎖
    const at = document.getElementById('admin-tools');
    const bna = document.getElementById('bottom-nav-admin');
    if (isAdmin) {
        if(at) at.classList.remove('hidden');
        if(bna) bna.classList.remove('hidden');
    }
    
    const avatarEl = document.getElementById('user-avatar');
    if(avatarEl) avatarEl.src = userProfile.pictureUrl;
    const badgeEl = document.getElementById('user-profile-badge');
    if(badgeEl) badgeEl.classList.remove('hidden');
    
    const vl = document.getElementById('view-loading');
    if(vl) vl.classList.add('hidden');
    const vlist = document.getElementById('view-list');
    if(vlist) vlist.classList.remove('hidden');
    
    window.loadCardContacts();
  } catch (err) { console.error("LIFF Init Failed", err); }
});

window.fetchAPI = async function(action, payload = {}) {
    const res = await fetch(WORKER_URL, { method: 'POST', body: JSON.stringify({ action, payload }) });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return json.data;
}

window.loadCardContacts = async function() {
    const container = document.getElementById('admin-card-list-container');
    if (!container) return; // ⭐ 防止 Null 報錯的核心修復
    
    container.innerHTML = '<div class="py-10 text-center text-slate-300 font-normal">讀取資料中...</div>';
    try {
        let data = await window.fetchAPI('getCardContacts');
        globalCardContacts = data || [];
        if (!isAdmin) {
            globalCardContacts = globalCardContacts.filter(c => c.userId === userProfile.userId || c['LINE ID'] === userProfile.userId);
        }
        window.renderCardList(globalCardContacts);
    } catch(e) { container.innerHTML = '讀取失敗'; }
}

window.renderCardList = function(cards) {
    const container = document.getElementById('admin-card-list-container');
    if (!container) return;
    if (!cards.length) { container.innerHTML = '<div class="py-20 text-center text-slate-400 font-normal">目前暫無名單</div>'; return; }
    
    container.innerHTML = cards.map(c => {
        const isClaimed = !!(c.userId || c['LINE ID']);
        return `
            <div onclick="window.openCardDetailByRowId('${c.rowId}')" class="py-4 border-b border-slate-50 flex items-center gap-4 active:bg-slate-50 transition-colors">
                <div class="w-12 h-12 rounded-full bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                    ${c['名片圖檔'] && c['名片圖檔'] !== '無圖檔' ? `<img src="${window.getDirectImageUrl(c['名片圖檔'])}" class="w-full h-full object-cover">` : `<span class="material-symbols-outlined text-slate-300">person</span>`}
                </div>
                <div class="flex-1 overflow-hidden">
                    <div class="flex items-center gap-2">
                        <h4 class="text-[16px] text-slate-800 font-normal">${c['姓名'] || '未具名'}</h4>
                        ${isAdmin && isClaimed ? '<span class="text-[10px] text-emerald-500 border border-emerald-100 px-1 rounded bg-emerald-50">已認領</span>' : ''}
                    </div>
                    <p class="text-[13px] text-slate-400 truncate font-normal">${c['公司名稱'] || '無資訊'}</p>
                </div>
                <span class="material-symbols-outlined text-slate-200">chevron_right</span>
            </div>
        `;
    }).join('');
}

window.openCardDetailByRowId = function(rowId) {
    const card = globalCardContacts.find(c => String(c.rowId) === String(rowId));
    if(!card) return;
    currentActiveCard = card;
    const isOwner = card.userId === userProfile.userId || card['LINE ID'] === userProfile.userId;
    const isClaimed = !!(card.userId || card['LINE ID']);

    const editBtn = document.getElementById('btn-card-edit');
    const adminBar = document.getElementById('admin-action-bar');
    if (editBtn) editBtn.classList.toggle('hidden', !(isAdmin || isOwner));
    if (adminBar) adminBar.classList.toggle('hidden', !isAdmin);
    
    const badge = document.getElementById('ro-claim-badge');
    if(badge) {
        if (isClaimed) {
            badge.innerText = '已認領'; badge.className = 'px-2 py-0.5 rounded text-[10px] border border-emerald-100 bg-emerald-50 text-emerald-500 font-normal';
        } else {
            badge.innerText = '待認領'; badge.className = 'px-2 py-0.5 rounded text-[10px] border border-slate-200 bg-slate-50 text-slate-400 font-normal';
        }
        badge.classList.remove('hidden');
    }

    // ⭐ 修理：補全所有資訊欄位，還原 LINE 原生資訊流
    let infoHtml = `
        <div class="w-full h-64 bg-slate-50 border-b border-slate-100"><img src="${window.getDirectImageUrl(card['名片圖檔'])}" class="w-full h-full object-contain"></div>
        <div class="p-6 space-y-6">
            <div>
                <h2 class="text-2xl font-normal text-slate-800 flex items-center gap-2">${card['姓名'] || '未具名'} ${card['英文名/別名'] ? `<span class="text-lg text-slate-400 font-normal">(${card['英文名/別名']})</span>` : ''}</h2>
                <p class="text-slate-500 mt-1 font-normal">${card['職稱']||''} ${card['部門'] ? ` / ${card['部門']}` : ''}</p>
            </div>
            
            <div class="space-y-4 text-[15px] font-normal">
                <div class="flex gap-4"><span class="material-symbols-outlined text-slate-300">apartment</span><span class="text-slate-700">${card['公司名稱'] || '-'}</span></div>
                ${card['統一編號'] ? `<div class="flex gap-4"><span class="material-symbols-outlined text-slate-300">tag</span><span class="text-slate-700">統編 ${card['統一編號']}</span></div>` : ''}
                <div class="flex gap-4"><span class="material-symbols-outlined text-slate-300">smartphone</span><a href="tel:${card['手機號碼']}" class="text-blue-600">${card['手機號碼'] || '-'}</a></div>
                ${card['公司電話'] ? `<div class="flex gap-4"><span class="material-symbols-outlined text-slate-300">call</span><span class="text-slate-700">${card['公司電話']}${card['分機'] ? ` 分機 ${card['分機']}` : ''}</span></div>` : ''}
                ${card['傳真'] ? `<div class="flex gap-4"><span class="material-symbols-outlined text-slate-300">fax</span><span class="text-slate-700">${card['傳真']} (傳真)</span></div>` : ''}
                <div class="flex gap-4"><span class="material-symbols-outlined text-slate-300">email</span><span class="text-slate-700">${card['電子郵件'] || '-'}</span></div>
                ${card['公司網址'] ? `<div class="flex gap-4"><span class="material-symbols-outlined text-slate-300">language</span><a href="${card['公司網址']}" target="_blank" class="text-blue-600 truncate">${card['公司網址']}</a></div>` : ''}
                <div class="flex gap-4"><span class="material-symbols-outlined text-slate-300">location_on</span><span class="text-slate-700 leading-snug">${card['公司地址'] || '-'}</span></div>
                ${card['社群帳號'] ? `<div class="flex gap-4"><span class="material-symbols-outlined text-slate-300">chat</span><span class="text-slate-700">${card['社群帳號']}</span></div>` : ''}
            </div>

            ${card['服務項目/品牌標語'] ? `
            <div class="pt-6 border-t border-slate-100">
                <h3 class="text-[13px] font-normal text-slate-400 mb-2">品牌標語 / 服務項目</h3>
                <p class="text-[15px] text-slate-700 whitespace-pre-wrap leading-relaxed font-normal">${card['服務項目/品牌標語']}</p>
            </div>` : ''}

            ${isAdmin && card['建檔人/備註'] ? `
            <div class="pt-6 border-t border-slate-100 bg-slate-50 -mx-6 px-6 py-4">
                <h3 class="text-[12px] font-normal text-slate-400 mb-1">管理員備註</h3>
                <p class="text-[14px] text-slate-600 font-normal">${card['建檔人/備註']}</p>
            </div>` : ''}
        </div>
    `;
    
    const detailContent = document.getElementById('card-detail-content');
    if(detailContent) detailContent.innerHTML = infoHtml;
    document.getElementById('readonly-card-modal').classList.remove('hidden');
}

window.openCropper = function(input) {
    const file = input.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.getElementById('cropper-image'); img.src = e.target.result;
      document.getElementById('cropper-modal').classList.remove('hidden');
      if (cropperInstance) cropperInstance.destroy();
      setTimeout(() => { if(img) img.style.opacity = '1'; cropperInstance = new Cropper(img, { viewMode: 1, dragMode: 'move', autoCropArea: 0.9 }); }, 100);
    };
    reader.readAsDataURL(file);
}

window.confirmCrop = async function() {
    const canvas = cropperInstance.getCroppedCanvas({ maxWidth: 1000 });
    compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
    window.cancelCrop();
    
    const previewImg = document.getElementById('process-preview-image');
    if(previewImg) previewImg.src = compressedBase64;
    
    window.switchView('process');
    window.switchProcessSection('section-loading');
    
    try {
        const data = await window.fetchAPI('recognizeCard', { base64Image: compressedBase64 });
        document.getElementById('f-Name').value = data.Name || '';
        document.getElementById('f-CompanyName').value = data.CompanyName || '';
        document.getElementById('f-Mobile').value = data.Mobile || '';
        document.getElementById('f-Slogan').value = data.Slogan || '';
        
        // ⭐ 修理：確保儲存命理演算結果
        currentFateTags = { Personality: data.Personality, Hobbies: data.Hobbies, Wealth: data.Wealth, Health: data.Health, Career: data.Career };
        window.switchProcessSection('section-form');
    } catch(err) { window.resetUI(); window.showToast("辨識超時，請重試", true); }
}

window.saveToCloud = async function() {
    if(isProcessing) return; isProcessing = true;
    const payload = {
        base64Image: compressedBase64,
        Name: document.getElementById('f-Name').value,
        CompanyName: document.getElementById('f-CompanyName').value,
        Mobile: document.getElementById('f-Mobile').value,
        Slogan: document.getElementById('f-Slogan').value,
        Notes: document.getElementById('f-Notes').value,
        ...currentFateTags
    };
    try {
        await window.fetchAPI('saveCard', payload);
        window.showToast("✅ 已存入雲端"); window.resetUI(); window.loadCardContacts();
    } catch(e) { window.showToast("儲存失敗", true); }
    finally { isProcessing = false; }
}

window.shareClaimLink = function() {
    const card = currentActiveCard;
    const url = `https://liff.line.me/${LIFF_ID}/?claimCardId=${card.rowId}&referrer=${userProfile.userId}`;
    const fullText = `您好，${card['姓名']}！我已為您建立專屬名片，請點擊連結認領並編輯您的內容：\n${url}`;
    window.open(`https://line.me/R/share?text=${encodeURIComponent(fullText)}`, '_blank');
}

window.resetUI = function() { window.switchView('list'); compressedBase64 = ""; currentFateTags = null; }
window.closeReadOnlyCard = function() { document.getElementById('readonly-card-modal').classList.add('hidden'); }
window.cancelCrop = function() { if (cropperInstance) cropperInstance.destroy(); document.getElementById('cropper-modal').classList.add('hidden'); }
window.switchView = function(v) { 
    const views = ['view-loading','view-list','view-process'];
    views.forEach(id => { const el = document.getElementById(id); if(el) el.classList.add('hidden'); });
    const target = document.getElementById(`view-${v}`);
    if(target) target.classList.remove('hidden'); 
}
window.switchProcessSection = function(id) { 
    const sections = ['section-loading','section-form'];
    sections.forEach(s => { const el = document.getElementById(s); if(el) el.classList.add('hidden'); });
    const target = document.getElementById(id);
    if(target) target.classList.remove('hidden'); 
}
window.getDirectImageUrl = function(url) { if(!url || url==='無圖檔' || url==='圖片儲存失敗') return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; const match = url.match(/id=([a-zA-Z0-9_-]+)/); return match ? `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000` : url; }
window.showToast = function(m, e=false) { const t = document.getElementById('toast'); if(!t) return; t.innerText = m; t.className = `fixed top-14 left-1/2 -translate-x-1/2 px-5 py-3 rounded-full text-[14px] shadow-lg transition-all z-[10000] font-normal transform translate-y-0 opacity-100 ${e?'bg-red-500 text-white':'bg-slate-800 text-white'}`; t.classList.remove('hidden'); setTimeout(()=>t.classList.add('hidden'), 300); }
window.filterCardList = function() { 
    const term = document.getElementById('card-search-input').value.toLowerCase();
    const filtered = globalCardContacts.filter(c => (c['姓名']||'').toLowerCase().includes(term) || (c['公司名稱']||'').toLowerCase().includes(term));
    window.renderCardList(filtered);
}
