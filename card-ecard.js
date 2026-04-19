/**
 * card-ecard.js
 * Version: v20260419_1730 (QQ 退版完整版：補齊括號，保留所有頁籤失效 Bug)
 */

const SVG_AVATAR = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMDAnIGhlaWdodD0nMTAwJyB2aWV3Qm94PScwIDAgMTAwIDEwMCc+PGNpcmNsZSBjeD0nNTAnIGN5PSc1MCcgcj0nNTAnIGZpbGw9JyNlMmU4ZjAnLz48cGF0aCBkPSdNNTAgNTVjLTExIDAtMjAgOS0yMCAyMHY1aDQwdi01YzAtMTEtOS0yMC0yMC0yMHptMC0yNWMtOC4zIDAtMTUgNi43LTE1IDE1czYuNyAxNSAxNSAxNSAxNS02LjcgMTUtMTUtNi43LTE1LTE1LTE1eicgZmlsbD0nIzk0YTNiOCcvPjwvc3ZnPg==";
const SVG_COVER = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSc0MDAnIGhlaWdodD0nMjYwJyB2aWV3Qm94PScwIDAgNDAwIDI2MCc+PHJlY3Qgd2lkdGg9JzQwMCcgaGVpZ2h0PScyNjAnIGZpbGw9JyNmMWY1ZjknLz48cGF0aCBkPSdNMTUwIDEzMGwzMC00MCA0MCA1MCAyMC0yNSA0MCA1MEgxMjB6JyBmaWxsPScjY2JkNWUxJy8+PGNpcmNsZSBjeD0nMTYwJyBjeT0nOTAnIHI9JzE1JyBmaWxsPScjY2JkNWUxJy8+PC9zdmc+";
const V2_ICONS = { 
    "LINE": "https://aiwe.cc/wp-content/uploads/2026/02/b75a5831fd553c7130aeafbb9783cf79.png", 
    "FB": "https://aiwe.cc/wp-content/uploads/2026/02/3986d1fd62384c8cdaa0e7c82f2740d1.png", 
    "IG": "https://aiwe.cc/wp-content/uploads/2026/02/a33306edcecd1ebdfd14baea6718cf23.png",
    "YT": "https://aiwe.cc/wp-content/uploads/2026/02/87e6f8054bd3672f2885e38bddb112e2.png", 
    "TEL": "https://aiwe.cc/wp-content/uploads/2026/02/7254567388850a6b4d77b75208ebd4b8.png",
    "WEB": "https://aiwe.cc/wp-content/uploads/2026/02/web_icon_placeholder.png" 
};

window.v2Socials = [];
window.v2Bars = [];
let currentEcardType = 'image';

// ⚠️ 頁籤切換函式：名稱為 toggleECardType，但 HTML 呼叫的是 switchTab
window.toggleECardType = function(type) {
    currentEcardType = type;
    const typeEl = document.getElementById('ec-card-type');
    if (typeEl) typeEl.value = type;
    
    const v1Fields = document.getElementById('ec-v1-fields');
    const v2Fields = document.getElementById('ec-v2-fields');
    
    if (type === 'v2') {
        if(v1Fields) v1Fields.classList.add('hidden');
        if(v2Fields) v2Fields.classList.remove('hidden');
    } else {
        if(v1Fields) v1Fields.classList.remove('hidden');
        if(v2Fields) v2Fields.classList.add('hidden');
    }
    window.updateECardPreview();
};

window.renderV2SocialUI = function() {
    const list = document.getElementById('ec-v2-social-list'); if(!list) return;
    list.innerHTML = '';
    window.v2Socials.forEach((s, idx) => {
        list.innerHTML += `<div class="bg-slate-50 p-2 rounded mb-1 text-xs">Social Item ${idx} (${s.type})</div>`;
    });
};

window.addV2Social = function() { window.v2Socials.push({type:'LINE', u:''}); window.renderV2SocialUI(); };

window.renderV2BarsUI = function() {
    const list = document.getElementById('ec-v2-bars-list'); if(!list) return;
    list.innerHTML = '';
    window.v2Bars.forEach((bar, idx) => {
        list.innerHTML += `<div class="bg-slate-50 p-2 rounded mb-1 text-xs">Bar Item ${idx}</div>`;
    });
};

window.addV2Bar = function() { window.v2Bars.push({t:'', u:''}); window.renderV2BarsUI(); };

window.updateECardPreview = function() {
    const container = document.getElementById('previewContainer');
    if (!container) return;
    container.innerHTML = `<div class="p-10 text-center text-slate-400">目前選擇：${currentEcardType}<br>此處預覽邏輯暫未生效</div>`;
};

window.openECardGenerator = function() {
    const modal = document.getElementById('ecard-generator-modal');
    if(modal) modal.classList.remove('hidden');
    window.updateECardPreview();
};
  
window.closeECardGenerator = function() { 
    const modal = document.getElementById('ecard-generator-modal');
    if(modal) modal.classList.add('hidden'); 
};

window.saveECardConfig = async function() {
    const config = { cardType: currentEcardType };
    try {
        await window.fetchAPI('updateECardConfig', { rowId: currentActiveCard.rowId, config });
        window.showToast('✅ 已儲存草稿');
    } catch(e) {
        window.showToast('儲存失敗', true);
    }
};

window.shareECardToLine = async function() {
    alert("轉發功能尚未實作完成");
};

// ⚠️ 此處為前次被截斷的程式碼補完區
window.fetchVoomData = async function() {
    const url = document.getElementById('voomUrl')?.value;
    if(!url) return;
    window.showToast('VOOM 解析中...');
};

window.applyVoom = function() {
    window.showToast('影片已套用');
    window.closeVoomModal();
};

window.openVoomModal = function() { 
    document.getElementById('voomModal')?.classList.remove('hidden'); 
};

window.closeVoomModal = function() { 
    document.getElementById('voomModal')?.classList.add('hidden'); 
};

window.handleECardImageUpload = async function(input, mode) {
    if(typeof window.openCropper === 'function') {
        window.openCropper(input.files[0], mode);
    }
};
