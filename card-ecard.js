/**
 * card-ecard.js
 * Version: v20260419_1710 (QQ 終極修復版：補齊截斷代碼，恢復版型切換與轉發)
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

// ⭐ 模式/版型切換核心邏輯
window.toggleECardType = function(type) {
    currentEcardType = type;
    const typeEl = document.getElementById('ec-card-type');
    if (typeEl) typeEl.value = type;
    
    // 更新頁籤 UI
    const tabs = { 'image': 'ec-tab-image', 'video': 'ec-tab-video', 'v2': 'ec-tab-v2' };
    for (let key in tabs) {
        const el = document.getElementById(tabs[key]);
        if (el) {
            if (key === type) el.className = 'flex-1 py-2 text-sm font-bold rounded-lg bg-white text-blue-600 shadow-sm transition-all';
            else el.className = 'flex-1 py-2 text-sm font-bold rounded-lg text-slate-500 bg-transparent transition-all';
        }
    }

    // 更新欄位顯示
    const v1Fields = document.getElementById('ec-v1-fields');
    const v2Fields = document.getElementById('ec-v2-fields');
    const vidGroup = document.getElementById('ec-video-input-group');
    
    if (type === 'v2') {
        if (v1Fields) v1Fields.classList.add('hidden');
        if (v2Fields) v2Fields.classList.remove('hidden');
    } else {
        if (v1Fields) v1Fields.classList.remove('hidden');
        if (v2Fields) v2Fields.classList.add('hidden');
        if (vidGroup) vidGroup.classList.toggle('hidden', type !== 'video');
    }
    
    window.updateECardPreview();
}

window.renderV2SocialUI = function() {
    const list = document.getElementById('ec-v2-social-list'); if(!list) return;
    list.innerHTML = '';
    window.v2Socials.forEach((s, idx) => {
        const div = document.createElement('div');
        div.className = "flex items-center gap-2 mb-2 bg-slate-50 p-2 rounded-xl relative group";
        let opts = ['LINE', 'FB', 'IG', 'YT', 'TEL', 'WEB'].map(k => `<option value="${k}" ${s.type === k ? 'selected' : ''}>${k}</option>`).join('');
        div.innerHTML = `
          <select class="bg-white shadow-sm border-none text-[12px] font-bold py-2 px-1 rounded-lg w-[80px]" onchange="window.v2Socials[${idx}].type=this.value; window.updateECardPreview()">${opts}</select>
          <input type="text" class="flex-1 bg-white shadow-sm border-none rounded-lg text-[13px] px-3 py-2" placeholder="連結" value="${s.u || ''}" oninput="window.v2Socials[${idx}].u=this.value; window.updateECardPreview()">
          <button onclick="window.v2Socials.splice(${idx},1); window.renderV2SocialUI(); window.updateECardPreview();" class="text-red-400 bg-red-50 w-9 h-9 rounded-xl flex items-center justify-center shrink-0">✕</button>
        `;
        list.appendChild(div);
    });
}
window.addV2Social = function() { window.v2Socials.push({type:'LINE', u:'https://line.me'}); window.renderV2SocialUI(); window.updateECardPreview(); }

window.renderV2BarsUI = function() {
    const list = document.getElementById('ec-v2-bars-list'); if(!list) return;
    list.innerHTML = '';
    window.v2Bars.forEach((bar, idx) => {
        const div = document.createElement('div');
        div.className = "flex flex-col gap-2 bg-slate-50 p-3 rounded-2xl relative";
        div.innerHTML = `
          <button onclick="window.v2Bars.splice(${idx},1); window.renderV2BarsUI(); window.updateECardPreview();" class="absolute top-3 right-3 text-slate-400">✕</button>
          <div class="flex items-center gap-2 pr-6"><span class="text-[12px] text-slate-400 w-8">文字</span><input type="text" value="${bar.t || ''}" class="custom-input !h-[36px] !bg-white flex-1" oninput="window.v2Bars[${idx}].t=this.value; window.updateECardPreview()"></div>
          <div class="flex items-center gap-2"><span class="text-[12px] text-slate-400 w-8">網址</span><input type="text" value="${bar.u || ''}" class="custom-input !h-[36px] !bg-white flex-1" oninput="window.v2Bars[${idx}].u=this.value; window.updateECardPreview()"></div>
        `;
        list.appendChild(div);
    });
}
window.addV2Bar = function() { window.v2Bars.push({t:"新按鈕", u:"https://line.me"}); window.renderV2BarsUI(); window.updateECardPreview(); }

window.escapeHtml = function(str) { 
    if (!str) return ''; 
    return String(str).replace(/[&<>]/g, function(m) { return {'&':'&amp;','<':'&lt;','>':'&gt;'}[m] || m; }); 
}

// ⭐ 實時預覽引擎 (對接網址轉化)
window.updateECardPreview = function(forceBase64 = null, cropTarget = null) {
    const desktopContainer = document.getElementById('previewContainer');
    const mobileContainer = document.getElementById('mobilePreviewContainer');
    const title = document.getElementById('ec-title-input')?.value || '商務名片';
    const desc = document.getElementById('ec-desc-input')?.value || '';
    let htmlContent = '';

    if (currentEcardType === 'v2') {
        let logo = document.getElementById('ec-v2-logo-url')?.value || SVG_AVATAR;
        if (forceBase64 && cropTarget === 'v2logo') logo = forceBase64;
        if(typeof window.getDirectImageUrl === 'function') logo = window.getDirectImageUrl(logo);
        const bgStart = document.getElementById('ec-v2-bg-start')?.value || '#57142b';
        const bgEnd = document.getElementById('ec-v2-bg-end')?.value || '#46250c';
        let socialHtml = window.v2Socials.map(s => `<div class="bg-white/20 p-1.5 rounded-full shadow-sm"><img src="${V2_ICONS[s.type] || V2_ICONS['WEB']}" style="width:32px; height:32px; border-radius:50%;"></div>`).join('');
        let barsHtml = window.v2Bars.map(b => `<div class="block bg-white text-[#333] py-3 rounded-full text-sm font-bold mb-3 shadow-md">${window.escapeHtml(b.t)}</div>`).join('');

        htmlContent = `
            <div class="p-6 text-white text-center min-h-[400px] flex flex-col items-center" style="background: linear-gradient(135deg, ${bgStart}, ${bgEnd});">
                <img src="${logo}" class="w-20 h-20 rounded-full mx-auto object-cover border-4 border-white/20 mb-4 shadow-lg" onerror="this.src='${SVG_AVATAR}'">
                <div class="font-extrabold text-[20px] tracking-tight">${window.escapeHtml(title)}</div>
                <div class="text-xs opacity-90 mt-2 leading-relaxed whitespace-pre-wrap">${window.escapeHtml(desc)}</div>
                <div class="flex justify-center gap-3 my-6 flex-wrap">${socialHtml}</div>
                <div class="w-full max-w-[260px]">${barsHtml}</div>
            </div>
        `;
    } else {
        let imgUrl = document.getElementById('ec-img-input')?.value;
        if (forceBase64 && cropTarget === 'ecard') imgUrl = forceBase64;
        if (!imgUrl) imgUrl = SVG_COVER;
        if(typeof window.getDirectImageUrl === 'function') imgUrl = window.getDirectImageUrl(imgUrl);
        let buttonsHtml = '';
        for (let i = 1; i <= 4; i++) {
            const label = document.getElementById(`ec-btn${i}-label`)?.value;
            const color = document.getElementById(`ec-btn${i}-color`)?.value;
            if (label) buttonsHtml += `<div class="block py-3 rounded-xl text-white text-center text-[14px] font-bold mb-2 shadow-sm" style="background:${color}">${window.escapeHtml(label)}</div>`;
        }
        let heroContent = `<img src="${imgUrl}" class="w-full aspect-[20/13] object-cover" onerror="this.src='${SVG_COVER}'">`;
        if (currentEcardType === 'video') heroContent = `<div class="relative w-full aspect-[20/13] bg-black flex items-center justify-center overflow-hidden"><img src="${imgUrl}" class="absolute inset-0 w-full h-full object-cover opacity-50"><span class="material-symbols-outlined text-white text-5xl z-10">play_circle</span></div>`;
        htmlContent = `<div class="bg-white overflow-hidden pb-4"><div class="relative">${heroContent}<div class="absolute top-2 right-2 bg-red-500 text-white text-[9px] px-2 py-1 rounded-full font-bold">分享</div></div><div class="p-4 text-center"><div class="font-black text-[18px] text-slate-800">${window.escapeHtml(title)}</div><div class="text-[12px] text-slate-500 mt-1.5 font-medium leading-relaxed whitespace-pre-wrap">${window.escapeHtml(desc)}</div></div><div class="px-4">${buttonsHtml}</div></div>`;
    }
    if (desktopContainer) desktopContainer.innerHTML = htmlContent;
    if (mobileContainer) mobileContainer.innerHTML = htmlContent;
}

window.openECardGenerator = function() {
    try {
        if (!currentActiveCard) return;
        const c = currentActiveCard;
        let saved = null; if (c['自訂名片設定']) try { saved = JSON.parse(c['自訂名片設定']); } catch(e){}
        
        const setV = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
        if (saved) {
            setV('ec-video-url', saved.videoUrl || '');
            setV('ec-img-input', saved.imgUrl || '');
            setV('ec-title-input', saved.title || '');
            setV('ec-desc-input', saved.desc || '');
            setV('ec-v2-logo-url', saved.v2Logo || '');
            window.v2Socials = saved.v2Socials || [];
            window.v2Bars = saved.v2Bars || [];
            window.toggleECardType(saved.cardType || 'image');
        } else {
            setV('ec-title-input', c['姓名'] || '');
            setV('ec-desc-input', c['服務項目/品牌標語'] || '');
            window.toggleECardType('image');
        }
        window.renderV2SocialUI();
        window.renderV2BarsUI();
        document.getElementById('ecard-generator-modal')?.classList.remove('hidden');
        window.updateECardPreview();
    } catch (e) { alert("開啟編輯器失敗: " + e.message); }
}
  
window.closeECardGenerator = function() { document.getElementById('ecard-generator-modal')?.classList.add('hidden'); }

window.saveECardConfig = async function(isSilent = false) {
    if(!currentActiveCard) return;
    const btn = document.getElementById('btn-save-ecard');
    if (!isSilent && btn) { btn.innerHTML = '<span class="material-symbols-outlined animate-spin">refresh</span>'; btn.classList.add('pointer-events-none'); }
    
    const getV = (id) => document.getElementById(id)?.value || '';
    const config = {
      cardType: currentEcardType,
      videoUrl: getV('ec-video-url').trim(),
      imgUrl: getV('ec-img-input'),
      title: getV('ec-title-input'),
      desc: getV('ec-desc-input'),
      v2Logo: getV('ec-v2-logo-url'),
      v2BgStart: getV('ec-v2-bg-start'),
      v2BgEnd: getV('ec-v2-bg-end'),
      v2Socials: window.v2Socials,
      v2Bars: window.v2Bars,
      buttons: []
    };
    for(let i=1; i<=4; i++) {
        const l = getV(`ec-btn${i}-label`);
        const u = getV(`ec-btn${i}-url`);
        const c = getV(`ec-btn${i}-color`);
        if(l && u) config.buttons.push({l, u, c});
    }
  
    try {
      await window.fetchAPI('updateECardConfig', { rowId: currentActiveCard.rowId, config }, true);
      currentActiveCard['自訂名片設定'] = JSON.stringify(config); 
      if(!isSilent) window.showToast('✅ 設定已儲存');
      window.updateECardPreview();
    } catch(e) { if(!isSilent) window.showToast('⚠️ 儲存失敗', true); }
    finally { if (!isSilent && btn) { btn.innerHTML = '儲存草稿'; btn.classList.remove('pointer-events-none'); } }
}

window.shareECardToLine = async function() {
    const btn = document.getElementById('btn-share-line');
    if (btn) { btn.innerHTML = '<span class="material-symbols-outlined animate-spin">refresh</span>'; btn.classList.add('pointer-events-none'); }
    try {
      await window.saveECardConfig(true); 
      const config = JSON.parse(currentActiveCard['自訂名片設定']);
      const currentImgUrl = window.getDirectImageUrl(config.imgUrl || currentActiveCard['名片圖檔']);
      const detectedAr = await window.getTrueAspectRatio(currentImgUrl);
      const flexMsg = window.buildFlexMessageFromCard(currentActiveCard, config, detectedAr);
      const res = await liff.shareTargetPicker([{ type: "flex", altText: config.altText || "您收到一張數位名片", contents: flexMsg }]);
      if(res) { window.showToast('✅ 已發送'); setTimeout(()=> liff.closeWindow(), 1000); }
    } catch(e) { window.showToast("發送失敗", true); }
    finally { if (btn) { btn.innerHTML = '🚀 發送至 LINE'; btn.classList.remove('pointer-events-none'); } }
}

window.openVoomModal = function() { document.getElementById('voomModal')?.classList.remove('hidden'); }
window.closeVoomModal = function() { document.getElementById('voomModal')?.classList.add('hidden'); }
window.fetchVoomData = async function() {
    const url = document.getElementById('voomUrl')?.value.trim();
    if(!url) return window.showToast('請輸入連結', true);
    try {
        const data = await window.fetchAPI('getLineVoomMedia', { url });
        document.getElementById('voomPlayer').src = data.video.videoUrl;
        document.getElementById('applyVoomBtn').dataset.videoUrl = data.video.videoUrl;
        document.getElementById('applyVoomBtn').dataset.thumbUrl = data.video.thumbnailUrl || '';
        document.getElementById('voomResult').classList.remove('hidden');
    } catch(e) { window.showToast("解析失敗", true); }
}
window.applyVoom = function() {
    const vBtn = document.getElementById('applyVoomBtn');
    document.getElementById('ec-video-url').value = vBtn.dataset.videoUrl;
    document.getElementById('ec-img-input').value = vBtn.dataset.thumbUrl;
    window.closeVoomModal();
    window.updateECardPreview();
}

// ⭐ 唯讀轉發函式
window.shareReadOnlyCardToLine = async function(btnEl) {
    if (btnEl) { btnEl.innerHTML = '<span class="material-symbols-outlined animate-spin">refresh</span>'; btnEl.classList.add('pointer-events-none'); }
    try {
        let config = null; if (currentActiveCard['自訂名片設定']) try { config = JSON.parse(currentActiveCard['自訂名片設定']); } catch(e){}
        const currentImgUrl = window.getDirectImageUrl(config?.imgUrl || currentActiveCard['名片圖檔']);
        const detectedAr = await window.getTrueAspectRatio(currentImgUrl);
        const flexMsg = window.buildFlexMessageFromCard(currentActiveCard, config, detectedAr);
        const res = await liff.shareTargetPicker([{ type: 'flex', altText: "數位名片", contents: flexMsg }]);
        if (res) liff.closeWindow();
    } catch(e) { alert("發送失敗"); }
    finally { if (btnEl) { btnEl.innerHTML = '🚀 轉發名片至 LINE'; btnEl.classList.remove('pointer-events-none'); } }
}
