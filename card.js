/**
 * card.js 
 * 修復版：還原 OCR 命理演算邏輯與認領機制
 * Version: v1.6.10 (修理 openCardDetailByRowId 與命理標籤緩存)
 */

const LIFF_ID = "2009367829-DLtYBDUm"; 
const WORKER_URL = "https://actmaster.fangwl591021.workers.dev"; 
const ADMIN_IDS = ["Uf729764dbb5b652a5a90a467320bea29", "U58eb5c1a747450140ce1335af709ae55", "U8932b891ad24da512afb9c1a6f41567b"];

let userProfile = null, isAdmin = false, globalCardContacts = [], isProcessing = false;
let currentActiveCard = null, currentFateTags = null, compressedBase64 = "", cropperInstance = null;

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await liff.init({ liffId: LIFF_ID });
    if (!liff.isLoggedIn()) { liff.login({ redirectUri: window.location.href }); return; }
    userProfile = await liff.getProfile();
    isAdmin = ADMIN_IDS.includes(userProfile.userId);
    
    // UI 元件解鎖 (僅 Admin)
    if (isAdmin) {
        const at = document.getElementById('admin-tools'); if(at) at.classList.remove('hidden');
        const bna = document.getElementById('bottom-nav-admin'); if(bna) bna.classList.remove('hidden');
    }
    
    const avatarEl = document.getElementById('user-avatar');
    if(avatarEl) avatarEl.src = userProfile.pictureUrl;
    const badgeEl = document.getElementById('user-profile-badge');
    if(badgeEl) badgeEl.classList.remove('hidden');
    
    document.getElementById('view-loading').classList.add('hidden');
    document.getElementById('view-list').classList.remove('hidden');
    
    window.loadCardContacts();
  } catch (err) { alert("名片系統初始化失敗"); }
});

window.fetchAPI = async function(action, payload = {}) {
    const res = await fetch(WORKER_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, payload }) });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return json.data;
}

window.loadCardContacts = async function() {
    const container = document.getElementById('card-list-container');
    container.innerHTML = '<div class="py-20 text-center text-slate-300">資料讀取中...</div>';
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
    const container = document.getElementById('card-list-container');
    if (!cards.length) { container.innerHTML = '<div class="py-20 text-center text-slate-400">目前沒有名片資料</div>'; return; }
    container.innerHTML = cards.map(c => `
        <div onclick="window.openCardDetailByRowId('${c.rowId}')" class="py-4 border-b border-slate-50 flex items-center gap-4 active:bg-slate-50 transition-colors">
            <div class="w-12 h-12 rounded-full bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                ${c['名片圖檔'] && c['名片圖檔'] !== '無圖檔' ? `<img src="${window.getDirectImageUrl(c['名片圖檔'])}" class="w-full h-full object-cover">` : `<span class="material-symbols-outlined text-slate-300">person</span>`}
            </div>
            <div class="flex-1 overflow-hidden">
                <div class="flex items-center gap-2">
                    <h4 class="text-[16px] text-slate-800">${c['姓名'] || '未具名'}</h4>
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

    const isOwner = card.userId === userProfile.userId || card['LINE ID'] === userProfile.userId;
    const isClaimed = !!(card.userId || card['LINE ID']);

    if (isAdmin || isOwner) document.getElementById('btn-card-edit').classList.remove('hidden'); else document.getElementById('btn-card-edit').classList.add('hidden');
    if (isAdmin) document.getElementById('admin-action-bar').classList.remove('hidden'); else document.getElementById('admin-action-bar').classList.add('hidden');

    const badge = document.getElementById('ro-claim-badge');
    if (isClaimed) {
        badge.innerText = '已認領'; badge.className = 'px-2 py-0.5 rounded-md text-[10px] border border-emerald-100 bg-emerald-50 text-emerald-500';
    } else {
        badge.innerText = '未認領'; badge.className = 'px-2 py-0.5 rounded-md text-[10px] border border-slate-200 bg-slate-50 text-slate-400';
    }
    badge.classList.toggle('hidden', !isAdmin);

    document.getElementById('ro-name').innerText = card['姓名'] || '未具名';
    document.getElementById('ro-title-dept').innerText = `${card['職稱']||''} ${card['部門']||''}`;
    document.getElementById('ro-company').innerText = card['公司名稱'] || '-';
    
    const mLink = document.getElementById('ro-mobile-link');
    mLink.innerText = card['手機號碼'] || '-';
    mLink.href = card['手機號碼'] ? `tel:${card['手機號碼']}` : '#';

    const fateSection = document.getElementById('ro-fate-section');
    const fateContainer = document.getElementById('ro-fate-tags');
    fateContainer.innerHTML = '';
    ['個性','興趣','財運','健康','事業'].forEach(t => {
        if(card[t] && card[t] !== '待分析') {
            fateContainer.innerHTML += `<div class="bg-primary/5 p-3 rounded-xl border border-primary/10 text-[13px] text-primary"><b>${t}：</b>${card[t]}</div>`;
        }
    });
    fateSection.classList.toggle('hidden', fateContainer.innerHTML === '');

    const img = document.getElementById('ro-image');
    const noImg = document.getElementById('ro-no-image');
    if (card['名片圖檔'] && card['名片圖檔'] !== '無圖檔') {
        img.src = window.getDirectImageUrl(card['名片圖檔']); img.classList.remove('hidden'); noImg.classList.add('hidden');
    } else { img.src = ''; img.classList.add('hidden'); noImg.classList.remove('hidden'); }

    document.getElementById('readonly-card-modal').classList.remove('hidden');
}

window.openCropper = function(input) {
    const file = input.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.getElementById('cropper-image'); img.src = e.target.result;
      document.getElementById('cropper-modal').classList.remove('hidden');
      if (cropperInstance) cropperInstance.destroy();
      setTimeout(() => { img.style.opacity = '1'; cropperInstance = new Cropper(img, { viewMode: 1, dragMode: 'move', autoCropArea: 0.9 }); }, 100);
    };
    reader.readAsDataURL(file);
}

window.confirmCrop = async function() {
    const canvas = cropperInstance.getCroppedCanvas({ maxWidth: 1000 });
    compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
    window.cancelCrop();
    
    document.getElementById('process-preview-image').src = compressedBase64;
    window.switchView('process');
    window.switchProcessSection('section-loading');
    
    try {
        const data = await window.fetchAPI('recognizeCard', { base64Image: compressedBase64 });
        document.getElementById('f-Name').value = data.Name || '';
        document.getElementById('f-CompanyName').value = data.CompanyName || '';
        document.getElementById('f-Mobile').value = data.Mobile || '';
        document.getElementById('f-Slogan').value = data.Slogan || '';
        
        // ⭐ 關鍵：緩存命理演算結果
        currentFateTags = {
            Personality: data.Personality, Hobbies: data.Hobbies,
            Wealth: data.Wealth, Health: data.Health, Career: data.Career
        };
        window.switchProcessSection('section-form');
    } catch(err) { window.resetUI(); window.showToast("辨識失敗", true); }
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
    const fullText = `您好，${card['姓名']}！我已為您建立專屬數位名片，請點擊認領並編輯：\n${url}`;
    window.open(`https://line.me/R/share?text=${encodeURIComponent(fullText)}`, '_blank');
}

window.resetUI = function() { window.switchView('list'); compressedBase64 = ""; currentFateTags = null; }
window.closeReadOnlyCard = function() { document.getElementById('readonly-card-modal').classList.add('hidden'); }
window.cancelCrop = function() { if (cropperInstance) cropperInstance.destroy(); document.getElementById('cropper-modal').classList.add('hidden'); }
window.switchView = function(v) { ['view-loading','view-list','view-process'].forEach(id => document.getElementById(id).classList.add('hidden')); document.getElementById(`view-${v}`).classList.remove('hidden'); }
window.switchProcessSection = function(id) { ['section-loading','section-form'].forEach(s => document.getElementById(s).classList.add('hidden')); document.getElementById(id).classList.remove('hidden'); }
window.getDirectImageUrl = function(url) { if(!url || url==='無圖檔') return ''; const match = url.match(/id=([a-zA-Z0-9_-]+)/); return match ? `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000` : url; }
window.showToast = function(m, e=false) { const t = document.getElementById('toast'); t.innerHTML = m; t.className = `fixed top-14 left-1/2 -translate-x-1/2 px-5 py-3 rounded-full text-[14px] shadow-lg transition-all z-[10000] font-normal transform translate-y-0 opacity-100 ${e ? 'bg-red-500 text-white' : 'bg-slate-800 text-white'}`; t.classList.remove('hidden'); setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.classList.add('hidden'), 300); }, 3000); }
