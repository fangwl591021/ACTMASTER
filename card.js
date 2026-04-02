/**
 * card.js 
 * 名片管理核心邏輯 - 權限鎖死版
 * Version: v1.6.8 (強化 isAdmin 檢查與 UI 同步)
 */

const LIFF_ID = "2009367829-DLtYBDUm"; 
const WORKER_URL = "https://actmaster.fangwl591021.workers.dev"; 
const ADMIN_IDS = ["Uf729764dbb5b652a5a90a467320bea29", "U58eb5c1a747450140ce1335af709ae55", "U8932b891ad24da512afb9c1a6f41567b"];

let userProfile = null, isAdmin = false, globalCardContacts = [];

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await liff.init({ liffId: LIFF_ID });
    if (!liff.isLoggedIn()) { liff.login(); return; }
    userProfile = await liff.getProfile();
    
    // ⭐ 最高權限檢查
    isAdmin = ADMIN_IDS.includes(userProfile.userId);
    
    // UI 元件解鎖
    if (isAdmin) {
        const at = document.getElementById('admin-tools-container'); if(at) at.classList.remove('hidden');
        const bna = document.getElementById('bottom-nav-admin'); if(bna) bna.classList.remove('hidden');
    }
    
    document.getElementById('user-avatar').src = userProfile.pictureUrl;
    document.getElementById('user-profile-badge').classList.remove('hidden');
    document.getElementById('view-loading').classList.add('hidden');
    
    window.loadCardContacts();
  } catch (err) { alert("名片系統啟動失敗"); }
});

window.loadCardContacts = async function() {
    const container = document.getElementById('admin-card-list-container');
    container.innerHTML = '<div class="text-center py-10 text-slate-300">讀取中...</div>';
    
    try {
        let data = await window.fetchAPI('getCardContacts');
        globalCardContacts = data || [];
        
        // ⭐ 非管理員只能看到自己的名片
        if (!isAdmin) {
            globalCardContacts = globalCardContacts.filter(c => c.userId === userProfile.userId || c['LINE ID'] === userProfile.userId);
        }
        
        window.renderCardList(globalCardContacts);
    } catch(e) { container.innerHTML = '讀取失敗'; }
}

window.renderCardList = function(cards) {
    const container = document.getElementById('admin-card-list-container');
    if (cards.length === 0) {
        container.innerHTML = '<div class="py-20 text-center text-slate-400">目前沒有名片</div>';
        return;
    }
    container.innerHTML = cards.map(c => `
      <div onclick="window.openCardDetailByRowId('${c.rowId}')" class="py-4 border-b border-slate-50 flex items-center gap-4 active:bg-slate-50">
        <div class="w-12 h-12 rounded-full bg-slate-200 overflow-hidden shrink-0">
          <img src="${window.getDirectImageUrl(c['名片圖檔'])}" class="w-full h-full object-cover" onerror="this.src='https://cdn-icons-png.flaticon.com/512/149/149071.png'">
        </div>
        <div class="flex-1 overflow-hidden">
          <h4 class="text-[16px] text-slate-800">${c['姓名'] || '未具名'}</h4>
          <p class="text-[13px] text-slate-500 truncate">${c['公司名稱'] || '無公司資訊'}</p>
        </div>
      </div>
    `).join('');
}

window.openCardDetailByRowId = function(rowId) {
    const card = globalCardContacts.find(c => String(c.rowId) === String(rowId));
    if(!card) return;
    currentActiveCard = card;
    
    const isOwner = card.userId === userProfile.userId || card['LINE ID'] === userProfile.userId;
    
    // ⭐ 根據權限顯示按鈕
    const editBtn = document.getElementById('btn-card-edit');
    const adminBar = document.getElementById('admin-action-bar');
    
    if (isAdmin || isOwner) editBtn.classList.remove('hidden'); else editBtn.classList.add('hidden');
    if (isAdmin) adminBar.classList.remove('hidden'); else adminBar.classList.add('hidden');

    document.getElementById('card-detail-content').innerHTML = `
        <div class="w-full h-60 bg-slate-100"><img src="${window.getDirectImageUrl(card['名片圖檔'])}" class="w-full h-full object-contain"></div>
        <div class="p-6">
            <h2 class="text-2xl text-slate-800">${card['姓名']}</h2>
            <p class="text-slate-500 mt-1">${card['職稱'] || ''} ${card['部門'] || ''}</p>
            <div class="mt-6 space-y-4 text-[15px]">
                <div class="flex gap-3"><span class="text-slate-400">公司</span><span>${card['公司名稱'] || '-'}</span></div>
                <div class="flex gap-3"><span class="text-slate-400">電話</span><a href="tel:${card['手機號碼']}" class="text-blue-600">${card['手機號碼'] || '-'}</a></div>
                <div class="flex gap-3"><span class="text-slate-400">郵件</span><span>${card['電子郵件'] || '-'}</span></div>
                <div class="flex gap-3"><span class="text-slate-400">地址</span><span class="leading-snug">${card['公司地址'] || '-'}</span></div>
            </div>
            <div class="mt-8 pt-6 border-t border-slate-100">
                <p class="text-[13px] text-slate-400 whitespace-pre-wrap">${card['服務項目/品牌標語'] || ''}</p>
            </div>
        </div>
    `;
    document.getElementById('readonly-card-modal').classList.remove('hidden');
}

window.shareClaimLink = async function() {
    if (!isAdmin) return;
    const card = currentActiveCard;
    const myLiffId = (typeof LIFF_ID !== 'undefined') ? LIFF_ID : '2009367829-DLtYBDUm';
    const url = `https://liff.line.me/${myLiffId}/?claimCardId=${card.rowId}&referrer=${userProfile.userId}`;
    const fullText = `您好，${card['姓名']}！我已為您建立專屬數位名片，請點擊認領並編輯：\n${url}`;
    
    // ⭐ 使用最新 LINE 分享協議，絕不跳 404
    window.open(`https://line.me/R/share?text=${encodeURIComponent(fullText)}`, '_blank');
}

window.closeReadOnlyCard = function() { document.getElementById('readonly-card-modal').classList.add('hidden'); }
window.fetchAPI = async function(action, payload = {}) {
    const res = await fetch(WORKER_URL, { method: 'POST', body: JSON.stringify({ action, payload }) });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return json.data;
}
window.getDirectImageUrl = function(url) {
    if(!url || url === '無圖檔') return 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
    const match = url.match(/id=([a-zA-Z0-9_-]+)/);
    return match ? `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000` : url;
}
