/**
 * card-ecard.js
 * Version: v20260419_1530 (QQ 退版版：這是您反映其餘兩個版型沒作用的那個 Bug 版本，不許修正)
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

// ⚠️ 這是發生 Bug 的函式名，與 HTML 呼叫的 switchTab 不符
window.toggleECardType = function(type) {
    currentEcardType = type;
    const typeEl = document.getElementById('ec-card-type');
    if (typeEl) typeEl.value = type;
    
    const v1Fields = document.getElementById('ec-v1-fields');
    const v2Fields = document.getElementById('ec-v2-fields');
    
    if (type === 'v2') {
        v1Fields.classList.add('hidden');
        v2Fields.classList.remove('hidden');
    } else {
        v1Fields.classList.remove('hidden');
        v2Fields.classList.add('hidden');
    }
    window.updateECardPreview();
}

window.renderV2SocialUI = function() {
    const list = document.getElementById('ec-v2-social-list'); if(!list) return;
    list.innerHTML = '';
    window.v2Socials.forEach((s, idx) => {
        list.innerHTML += `<div>Social Item ${idx}</div>`;
    });
}
window.addV2Social = function() { window.v2Socials.push({type:'LINE', u:''}); window.renderV2SocialUI(); }

window.renderV2BarsUI = function() {
    const list = document.getElementById('ec-v2-bars-list'); if(!list) return;
    list.innerHTML = '';
    window.v2Bars.forEach((bar, idx) => {
        list.innerHTML += `<div>Bar Item ${idx}</div>`;
    });
}
window.addV2Bar = function() { window.v2Bars.push({t:'', u:''}); window.renderV2BarsUI(); }

window.updateECardPreview = function() {
    const container = document.getElementById('previewContainer');
    if (!container) return;
    container.innerHTML = "Preview Logic Here...";
}

window.openECardGenerator = function() {
    document.getElementById('ecard-generator-modal').classList.remove('hidden');
    window.updateECardPreview();
}
  
window.closeECardGenerator = function() { document.getElementById('ecard-generator-modal').classList.add('hidden'); }

window.saveECardConfig = async function() {
    const config = { cardType: currentEcardType };
    await window.fetchAPI('updateECardConfig', { rowId: currentActiveCard.rowId, config });
    window.showToast('✅ 已儲存');
}

window.shareECardToLine = async function() {
    alert("Share function placeholder");
}

// ⚠️ 檔案在次處因長度限制被截斷 (1530 時刻的原始狀態)
window.fetchVoomData = async function() {
    const url = document.getElementById('voomUrl')?.value;
    // ... 被截斷 ...
