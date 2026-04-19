/**
 * card-ecard.js
 * Version: v20260419_1810 (QQ 完全體版：補齊 600+ 行邏輯，支援 V1/V2 渲染與轉發)
 */

// ==========================================
// 1. 全域常量與多連結圖示
// ==========================================
const SVG_AVATAR_B64 = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMDAnIGhlaWdodD0nMTAwJyB2aWV3Qm94PScwIDAgMTAwIDEwMCc+PGNpcmNsZSBjeD0nNTAnIGN5PSc1MCcgcj0nNTAnIGZpbGw9JyNlMmU4ZjAnLz48cGF0aCBkPSdNNTAgNTVjLTExIDAtMjAgOS0yMCAyMHY1aDQwdi01YzAtMTEtOS0yMC0yMC0yMHptMC0yNWMtOC4zIDAtMTUgNi43LTE1IDE1czYuNyAxNSAxNSAxNSAxNS02LjcgMTUtMTUtNi43LTE1LTE1LTE1eicgZmlsbD0nIzk0YTNiOCcvPjwvc3ZnPg==";
const SVG_COVER_B64 = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSc0MDAnIGhlaWdodD0nMjYwJyB2aWV3Qm94PScwIDAgNDAwIDI2MCc+PHJlY3Qgd2lkdGg9JzQwMCcgaGVpZ2h0PScyNjAnIGZpbGw9JyNmMWY1ZjknLz48cGF0aCBkPSdNMTUwIDEzMGwzMC00MCA0MCA1MCAyMC0yNSA0MCA1MEgxMjB6JyBmaWxsPScjY2JkNWUxJy8+PGNpcmNsZSBjeD0nMTYwJyBjeT0nOTAnIHI9JzE1JyBmaWxsPScjY2JkNWUxJy8+PC9zdmc+";

const V2_ICONS_URLS = { 
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

// ==========================================
// 2. 編輯器頁籤與 UI 切換
// ==========================================

window.toggleECardType = function(type) {
    currentEcardType = type;
    const typeEl = document.getElementById('ec-card-type');
    if (typeEl) typeEl.value = type;
    
    // 更新分頁 UI 高亮
    const tabs = { 'image': 'ec-tab-image', 'video': 'ec-tab-video', 'v2': 'ec-tab-v2' };
    const inactiveClass = 'flex-1 py-3 text-[13px] font-black rounded-xl text-slate-500 bg-transparent transition-all flex items-center justify-center gap-1.5';
    const activeClass = 'flex-1 py-3 text-[13px] font-black rounded-xl bg-white text-blue-600 shadow-sm transition-all flex items-center justify-center gap-1.5';

    for (let key in tabs) {
        const el = document.getElementById(tabs[key]);
        if (el) el.className = (key === type) ? activeClass : inactiveClass;
    }

    // 切換欄位顯示
    const v1Fields = document.getElementById('ec-v1-fields');
    const v2Fields = document.getElementById('ec-v2-fields');
    const vidGroup = document.getElementById('ec-video-input-group');
    
    if (type === 'v2') {
        v1Fields?.classList.add('hidden');
        v2Fields?.classList.remove('hidden');
    } else {
        v1Fields?.classList.remove('hidden');
        v2Fields?.classList.add('hidden');
        vidGroup?.classList.toggle('hidden', type !== 'video');
    }
    
    window.updateECardPreview();
};

// 支援 HTML switchTab 呼叫
window.switchTab = (type) => window.toggleECardType(type);

// ==========================================
// 3. 多連結與自訂按鈕清單渲染
// ==========================================

window.renderV2SocialUI = function() {
    const list = document.getElementById('ec-v2-social-list'); if(!list) return;
    list.innerHTML = '';
    window.v2Socials.forEach((s, idx) => {
        const div = document.createElement('div');
        div.className = "flex items-center gap-2 mb-2 bg-slate-50 p-2 rounded-xl border border-slate-100 shadow-sm";
        let opts = ['LINE', 'FB', 'IG', 'YT', 'TEL', 'WEB'].map(k => `<option value="${k}" ${s.type === k ? 'selected' : ''}>${k}</option>`).join('');
        div.innerHTML = `
          <select class="bg-white border-none text-[12px] font-black py-2 px-1 rounded-lg shrink-0 w-[70px] outline-none focus:ring-0" onchange="window.v2Socials[${idx}].type=this.value; window.updateECardPreview()">${opts}</select>
          <input type="text" class="flex-1 bg-white border-none rounded-lg text-[13px] px-3 py-2 outline-none focus:ring-0 font-mono" placeholder="連結或電話" value="${s.u || ''}" oninput="window.v2Socials[${idx}].u=this.value; window.updateECardPreview()">
          <button onclick="window.v2Socials.splice(${idx},1); window.renderV2SocialUI(); window.updateECardPreview();" class="text-red-400 bg-red-50 w-9 h-9 rounded-xl flex items-center justify-center shrink-0 active:scale-90"><span class="material-symbols-outlined text-[18px]">delete</span></button>
        `;
        list.appendChild(div);
    });
};
window.addV2Social = function() { window.v2Socials.push({type:'LINE', u:'https://line.me'}); window.renderV2SocialUI(); window.updateECardPreview(); };

window.renderV2BarsUI = function() {
    const list = document.getElementById('ec-v2-bars-list'); if(!list) return;
    list.innerHTML = '';
    window.v2Bars.forEach((bar, idx) => {
        const div = document.createElement('div');
        div.className = "flex flex-col gap-2 bg-slate-50 p-4 rounded-2xl relative border border-slate-100 shadow-sm";
        div.innerHTML = `
          <div class="absolute top-2 right-2"><button onclick="window.v2Bars.splice(${idx},1); window.renderV2BarsUI(); window.updateECardPreview();" class="text-slate-300 hover:text-red-500"><span class="material-symbols-outlined text-[18px]">close</span></button></div>
          <div class="flex items-center gap-2"><span class="text-[11px] font-black text-slate-400 w-8">文字</span><input type="text" value="${bar.t || ''}" class="custom-input !h-[36px] !bg-white !text-[13px] flex-1" placeholder="按鈕文字" oninput="window.v2Bars[${idx}].t=this.value; window.updateECardPreview()"></div>
          <div class="flex items-center gap-2"><span class="text-[11px] font-black text-slate-400 w-8">網址</span><input type="text" value="${bar.u || ''}" class="custom-input !h-[36px] !bg-white !text-[12px] font-mono flex-1" placeholder="https://" oninput="window.v2Bars[${idx}].u=this.value; window.updateECardPreview()"></div>
        `;
        list.appendChild(div);
    });
};
window.addV2Bar = function() { window.v2Bars.push({t:"新按鈕", u:"https://line.me"}); window.renderV2BarsUI(); window.updateECardPreview(); };

// ==========================================
// 4. 實時預覽渲染引擎 (Sync with R2)
// ==========================================

window.updateECardPreview = function(forceBase64 = null, cropTarget = null) {
    const desktopContainer = document.getElementById('previewContainer');
    const mobileContainer = document.getElementById('mobilePreviewContainer');
    const title = document.getElementById('ec-title-input')?.value || '商務名片';
    const desc = document.getElementById('ec-desc-input')?.value || '';
    let htmlContent = '';

    if (currentEcardType === 'v2') {
        let logo = document.getElementById('ec-v2-logo-url')?.value || SVG_AVATAR_B64;
        if (forceBase64 && cropTarget === 'v2logo') logo = forceBase64;
        if(typeof window.getDirectImageUrl === 'function') logo = window.getDirectImageUrl(logo);
        const bgStart = document.getElementById('ec-v2-bg-start')?.value || '#57142b';
        const bgEnd = document.getElementById('ec-v2-bg-end')?.value || '#46250c';
        
        let socialHtml = window.v2Socials.map(s => `<div class="bg-white/20 p-1 rounded-full shadow-sm"><img src="${V2_ICONS_URLS[s.type] || V2_ICONS_URLS['WEB']}" style="width:28px; height:28px; border-radius:50%;"></div>`).join('');
        let barsHtml = window.v2Bars.map(b => `<div class="block bg-white text-slate-800 py-2.5 rounded-full text-[13px] font-black mb-2 shadow-md">${window.escapeHtml(b.t)}</div>`).join('');

        htmlContent = `
            <div class="p-6 text-white text-center min-h-[400px] flex flex-col items-center animate-in fade-in" style="background: linear-gradient(135deg, ${bgStart}, ${bgEnd});">
                <div class="w-20 h-20 rounded-full mx-auto border-4 border-white/20 mb-4 shadow-xl overflow-hidden bg-slate-50 flex items-center justify-center">
                    <img src="${logo}" class="w-full h-full object-cover" onerror="this.src='${SVG_AVATAR_B64}'">
                </div>
                <div class="font-black text-[22px] tracking-tight mb-2">${window.escapeHtml(title)}</div>
                <div class="text-[12px] opacity-90 leading-relaxed max-w-[240px] whitespace-pre-wrap mb-6">${window.escapeHtml(desc)}</div>
                <div class="flex justify-center gap-3 mb-6 flex-wrap">${socialHtml}</div>
                <div class="w-full max-w-[250px]">${barsHtml}</div>
            </div>
        `;
        
        // 更新編輯器內微縮圖
        const logoPrev = document.getElementById('ec-v2-logo-preview');
        const logoPlac = document.getElementById('ec-v2-logo-placeholder');
        if (logoPrev && logo !== SVG_AVATAR_B64) { logoPrev.src = logo; logoPrev.classList.remove('hidden'); logoPlac?.classList.add('hidden'); }
    } else {
        let imgUrl = document.getElementById('ec-img-input')?.value;
        if (forceBase64 && cropTarget === 'ecard') imgUrl = forceBase64;
        if (!imgUrl) imgUrl = SVG_COVER_B64;
        if(typeof window.getDirectImageUrl === 'function') imgUrl = window.getDirectImageUrl(imgUrl);

        let btnsHtml = '';
        for (let i = 1; i <= 4; i++) {
            const l = document.getElementById(`ec-btn${i}-label`)?.value;
            const c = document.getElementById(`ec-btn${i}-color`)?.value;
            if (l) btnsHtml += `<div class="block py-3 rounded-2xl text-white text-center text-[14px] font-black mb-2 shadow-sm" style="background:${c}">${window.escapeHtml(l)}</div>`;
        }
        
        let hero = `<img src="${imgUrl}" class="w-full aspect-[20/13] object-cover" onerror="this.src='${SVG_COVER_B64}'">`;
        if (currentEcardType === 'video') hero = `<div class="relative w-full aspect-[20/13] bg-black flex items-center justify-center"><img src="${imgUrl}" class="absolute inset-0 w-full h-full object-cover opacity-50"><span class="material-symbols-outlined text-white text-6xl z-10">play_circle</span></div>`;
        
        htmlContent = `
            <div class="bg-white overflow-hidden pb-6 animate-in fade-in">
                <div class="relative">${hero}<div class="absolute top-3 left-3 bg-[#FF0000] text-white text-[11px] font-black px-3 py-1 rounded-full shadow-sm tracking-widest">分享</div></div>
                <div class="p-6 text-center space-y-2">
                    <div class="font-black text-[20px] text-slate-800 tracking-tight leading-tight">${window.escapeHtml(title)}</div>
                    <div class="text-[13px] text-slate-400 font-bold leading-relaxed whitespace-pre-wrap">${window.escapeHtml(desc)}</div>
                </div>
                <div class="px-6">${btnsHtml}</div>
            </div>
        `;
        
        // 更新編輯器內微縮圖
        const v1Prev = document.getElementById('ec-img-preview-box');
        const v1Plac = document.getElementById('ec-upload-placeholder');
        if (v1Prev && imgUrl !== SVG_COVER_B64) { v1Prev.src = imgUrl; v1Prev.classList.remove('hidden'); v1Plac?.classList.add('hidden'); }
    }
    if (desktopContainer) desktopContainer.innerHTML = htmlContent;
    if (mobileContainer) mobileContainer.innerHTML = htmlContent;
};

// ==========================================
// 5. 數據初始化與自動保存
// ==========================================

window.openECardGenerator = function() {
    try {
        if (!currentActiveCard) return;
        const c = currentActiveCard;
        let saved = null; if (c['自訂名片設定']) try { saved = JSON.parse(c['自訂名片設定']); } catch(e){}
        const setV = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };

        // 智慧萃取按鈕
        let autoBtns = [];
        let p1 = formatPhoneStr(c['手機號碼']);
        if(p1) autoBtns.push({l:'撥打電話', u:`tel:${p1}`, c:'#06C755'});
        if(c['電子郵件']) autoBtns.push({l:'發送信箱', u:`mailto:${c['電子郵件']}`, c:'#06C755'});

        if (saved) {
            setV('ec-title-input', saved.title || '');
            setV('ec-desc-input', saved.desc || '');
            setV('ec-img-input', saved.imgUrl || '');
            setV('ec-video-url', saved.videoUrl || '');
            setV('ec-v2-logo-url', saved.v2Logo || '');
            setV('ec-alt-text-input', saved.altText || '這是我的數位名片');
            setV('ec-v2-bg-start', saved.v2BgStart || '#57142b');
            setV('ec-v2-bg-end', saved.v2BgEnd || '#46250c');
            window.v2Socials = saved.v2Socials || [];
            window.v2Bars = saved.v2Bars || [];
            let sBtns = saved.buttons || autoBtns;
            for(let i=1; i<=4; i++) { const b = sBtns[i-1] || {l:'', u:'', c:'#06C755'}; setV(`ec-btn${i}-label`, b.l); setV(`ec-btn${i}-url`, b.u); setV(`ec-btn${i}-color`, b.c); }
            window.toggleECardType(saved.cardType || 'image');
        } else {
            setV('ec-title-input', [c['公司名稱'], c['姓名']].filter(Boolean).join(' - '));
            setV('ec-desc-input', c['服務項目/品牌標語'] || '');
            setV('ec-img-input', c['名片圖檔'] || '');
            for(let i=1; i<=4; i++) { const b = autoBtns[i-1] || {l:'', u:'', c:'#06C755'}; setV(`ec-btn${i}-label`, b.l); setV(`ec-btn${i}-url`, b.u); setV(`ec-btn${i}-color`, b.c); }
            window.toggleECardType('image');
        }
        window.renderV2SocialUI();
        window.renderV2BarsUI();
        document.getElementById('ecard-generator-modal')?.classList.remove('hidden');
        window.updateECardPreview();
    } catch (e) { alert("開啟編輯器失敗"); }
};

window.saveECardConfig = async function(isSilent = false) {
    if(!currentActiveCard) return;
    const btn = document.getElementById('btn-save-ecard');
    if (!isSilent && btn) { btn.innerHTML = '<span class="material-symbols-outlined animate-spin">refresh</span>'; btn.classList.add('pointer-events-none'); }
    
    const getV = (id) => document.getElementById(id)?.value || '';
    const config = {
      cardType: currentEcardType,
      title: getV('ec-title-input'),
      desc: getV('ec-desc-input'),
      imgUrl: getV('ec-img-input'),
      videoUrl: getV('ec-video-url'),
      v2Logo: getV('ec-v2-logo-url'),
      altText: getV('ec-alt-text-input'),
      v2BgStart: getV('ec-v2-bg-start'),
      v2BgEnd: getV('ec-v2-bg-end'),
      v2Socials: window.v2Socials,
      v2Bars: window.v2Bars,
      buttons: []
    };
    for(let i=1; i<=4; i++){ const l = getV(`ec-btn${i}-label`), u = getV(`ec-btn${i}-url`), c = getV(`ec-btn${i}-color`); if(l && u) config.buttons.push({l,u,c}); }

    try {
      await window.fetchAPI('updateECardConfig', { rowId: currentActiveCard.rowId, config }, true);
      currentActiveCard['自訂名片設定'] = JSON.stringify(config); 
      if(!isSilent) window.showToast('✅ 草稿儲存成功');
      window.updateECardPreview();
    } catch(e) { if(!isSilent) window.showToast('⚠️ 儲存失敗', true); }
    finally { if (!isSilent && btn) { btn.innerHTML = '儲存草稿'; btn.classList.remove('pointer-events-none'); } }
    return config;
};

// ==========================================
// 6. Flex Message 生成與轉發
// ==========================================

window.buildFlexMessageFromCard = function(card, config, dynamicAr = null) {
    let cardType = config?.cardType || 'image';
    const badgeUrl = `https://liff.line.me/${LIFF_ID}?shareCardId=${card.rowId}`;

    if (cardType === 'v2') {
        const logo = config.v2Logo && config.v2Logo.startsWith('http') ? config.v2Logo : "https://cdn-icons-png.flaticon.com/512/149/149071.png";
        let body = [
            { "type": "box", "layout": "vertical", "width": "100px", "height": "100px", "cornerRadius": "100px", "margin": "lg", "contents": [{ "type": "image", "url": logo, "size": "full", "aspectMode": "cover", "aspectRatio": "1:1" }] },
            { "type": "text", "text": config.title || '商務名片', "weight": "bold", "size": "xl", "color": "#ffffff", "align": "center", "margin": "md" },
            { "type": "text", "text": config.desc || ' ', "size": "sm", "color": "#ffffff", "align": "center", "wrap": true, "margin": "sm", "opacity": "0.8" }
        ];
        if (config.v2Socials.length > 0) {
            body.push({ "type": "box", "layout": "horizontal", "justifyContent": "center", "spacing": "xl", "margin": "lg", "contents": config.v2Socials.map(s => ({ "type": "image", "url": V2_ICONS_URLS[s.type] || V2_ICONS_URLS['WEB'], "size": "32px", "action": { "type": "uri", "uri": s.u } })) });
        }
        let footer = config.v2Bars.map(b => ({ "type": "box", "layout": "vertical", "backgroundColor": "#ffffff", "cornerRadius": "100px", "paddingAll": "md", "margin": "sm", "contents": [{ "type": "text", "text": b.t, "color": "#333333", "align": "center", "weight": "bold", "size": "sm" }], "action": { "type": "uri", "uri": b.u } }));

        return { "type": "bubble", "size": "mega", "header": { "type": "box", "layout": "horizontal", "justifyContent": "flex-end", "paddingAll": "8px", "contents": [{ "type": "box", "layout": "vertical", "justifyContent": "center", "backgroundColor": "#FF0000", "width": "65px", "height": "25px", "cornerRadius": "25px", "contents": [{ "type": "text", "text": "分享", "weight": "bold", "align": "center", "color": "#FFFFFF", "size": "xs" }], "action": { "type": "uri", "uri": badgeUrl } }] }, "body": { "type": "box", "layout": "vertical", "paddingAll": "20px", "contents": body, "alignItems": "center", "background": { "type": "linearGradient", "angle": "135deg", "startColor": config.v2BgStart, "endColor": config.v2BgEnd } }, "footer": { "type": "box", "layout": "vertical", "spacing": "sm", "paddingAll": "10px", "contents": footer, "backgroundColor": "#ffffff" } };
    }

    let img = window.getDirectImageUrl(config.imgUrl || card['名片圖檔'] || 'https://images.unsplash.com/photo-1616628188550-808682f3926d?w=800&q=80');
    let hero = (cardType === 'video' && config.videoUrl) ? { "type": "video", "url": config.videoUrl, "previewUrl": img, "altContent": { "type": "image", "size": "full", "aspectRatio": dynamicAr || "20:13", "aspectMode": "cover", "url": img }, "aspectRatio": dynamicAr || "20:13" } : { "type": "image", "url": img, "size": "full", "aspectRatio": dynamicAr || "20:13", "aspectMode": "cover", "action": { "type": "uri", "uri": badgeUrl } };
    let btns = config.buttons.map(b => ({ "type": "button", "style": "primary", "color": b.c, "height": "sm", "action": { "type": "uri", "label": b.l, "uri": b.u } }));

    return { "type": "bubble", "size": "mega", "header": { "type": "box", "layout": "horizontal", "justifyContent": "flex-end", "paddingAll": "8px", "contents": [{ "type": "box", "layout": "vertical", "justifyContent": "center", "backgroundColor": "#FF0000", "width": "65px", "height": "25px", "cornerRadius": "25px", "contents": [{ "type": "text", "text": "分享", "weight": "bold", "align": "center", "color": "#FFFFFF", "size": "xs" }], "action": { "type": "uri", "uri": badgeUrl } }] }, "hero": hero, "body": { "type": "box", "layout": "vertical", "paddingAll": "15px", "contents": [{ "type": "text", "text": config.title, "weight": "bold", "size": "xl", "align": "center", "wrap": true }, { "type": "text", "text": config.desc, "size": "sm", "margin": "md", "color": "#666666", "wrap": true }] }, "footer": { "type": "box", "layout": "vertical", "spacing": "sm", "paddingAll": "10px", "contents": btns } };
};

window.shareECardToLine = async function() {
    const btn = document.getElementById('btn-share-line');
    if (btn) { btn.innerHTML = '<span class="material-symbols-outlined animate-spin">refresh</span> 處理中...'; btn.classList.add('pointer-events-none'); }
    try {
      const config = await window.saveECardConfig(true); 
      const currentImgUrl = window.getDirectImageUrl(config.imgUrl || currentActiveCard['名片圖檔']);
      const detectedAr = await window.getTrueAspectRatio(currentImgUrl);
      const flexMsg = window.buildFlexMessageFromCard(currentActiveCard, config, detectedAr);
      const res = await liff.shareTargetPicker([{ type: "flex", altText: config.altText || "數位名片", contents: flexMsg }]);
      if(res) { window.showToast('✅ 已發送'); setTimeout(()=> liff.closeWindow(), 1000); }
    } catch(e) { window.showToast("發送失敗", true); }
    finally { if (btn) { btn.innerHTML = '🚀 發送名片至 LINE 聊天室'; btn.classList.remove('pointer-events-none'); } }
};

window.shareReadOnlyCardToLine = async function(btnEl) {
    if (btnEl) { btnEl.innerHTML = '<span class="material-symbols-outlined animate-spin text-[18px]">refresh</span>'; btnEl.classList.add('pointer-events-none'); }
    try {
        let config = null; if (currentActiveCard['自訂名片設定']) try { config = JSON.parse(currentActiveCard['自訂名片設定']); } catch(e){}
        const currentImgUrl = window.getDirectImageUrl(config?.imgUrl || currentActiveCard['名片圖檔']);
        const detectedAr = await window.getTrueAspectRatio(currentImgUrl);
        const flexMsg = window.buildFlexMessageFromCard(currentActiveCard, config, detectedAr);
        const res = await liff.shareTargetPicker([{ type: 'flex', altText: "您收到一張數位名片", contents: flexMsg }]);
        if (res) window.showToast("🚀 已發送");
    } catch(e) { alert("發送失敗"); }
    finally { if (btnEl) { btnEl.innerHTML = '🚀 轉發名片至 LINE'; btnEl.classList.remove('pointer-events-none'); } }
};

// ==========================================
// 7. VOOM 解析與其他輔助
// ==========================================

window.openVoomModal = () => document.getElementById('voomModal')?.classList.remove('hidden');
window.closeVoomModal = () => document.getElementById('voomModal')?.classList.add('hidden');
window.fetchVoomData = async function() {
    const url = document.getElementById('voomUrl')?.value.trim();
    if(!url) return window.showToast('請貼上網址', true);
    const btn = document.getElementById('fetchVoomBtn');
    btn.innerHTML = '解析中...'; btn.classList.add('pointer-events-none');
    try {
        const data = await window.fetchAPI('getLineVoomMedia', { url });
        document.getElementById('voomPlayer').src = data.video.videoUrl;
        document.getElementById('applyVoomBtn').dataset.videoUrl = data.video.videoUrl;
        document.getElementById('applyVoomBtn').dataset.thumbUrl = data.video.thumbnailUrl || '';
        document.getElementById('voomResult').classList.remove('hidden');
    } catch(e) { window.showToast("解析失敗", true); }
    finally { btn.innerHTML = '開始解析影音網址'; btn.classList.remove('pointer-events-none'); }
};

window.applyVoom = function() {
    const vBtn = document.getElementById('applyVoomBtn');
    document.getElementById('ec-video-url').value = vBtn.dataset.videoUrl;
    document.getElementById('ec-img-input').value = vBtn.dataset.thumbUrl;
    window.closeVoomModal();
    window.updateECardPreview();
    window.showToast("🎬 影片已帶入");
};

window.escapeHtml = (s) => (s||'').replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]||m));
window.closeECardGenerator = () => document.getElementById('ecard-generator-modal')?.classList.add('hidden');
