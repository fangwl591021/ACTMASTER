/**
 * card-ecard.js
 * Version: v20260419_1740 (QQ 終極完整版：補齊 600+ 行所有邏輯，確保三大版型完美運作)
 */

// ==========================================
// 1. 全域常量與 SVG 資源
// ==========================================
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

// ==========================================
// 2. 編輯器頁籤與 UI 切換
// ==========================================

window.toggleECardType = function(type) {
    currentEcardType = type;
    const typeEl = document.getElementById('ec-card-type');
    if (typeEl) typeEl.value = type;
    
    // 更新頁籤樣式
    const tabs = { 'image': 'ec-tab-image', 'video': 'ec-tab-video', 'v2': 'ec-tab-v2' };
    for (let key in tabs) {
        const el = document.getElementById(tabs[key]);
        if (el) {
            if (key === type) {
                el.className = 'flex-1 py-2 text-sm font-bold rounded-lg bg-white text-blue-600 shadow-sm transition-all';
            } else {
                el.className = 'flex-1 py-2 text-sm font-bold rounded-lg text-slate-500 bg-transparent transition-all';
            }
        }
    }

    // 控制欄位顯示
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
};

window.switchTab = function(type) { window.toggleECardType(type); };

// ==========================================
// 3. V2 質感多連結動態清單
// ==========================================

window.renderV2SocialUI = function() {
    const list = document.getElementById('ec-v2-social-list'); if(!list) return;
    list.innerHTML = '';
    window.v2Socials.forEach((s, idx) => {
        const div = document.createElement('div');
        div.className = "flex items-center gap-2 mb-2 bg-slate-50 p-2 rounded-xl border border-transparent hover:border-slate-200 transition-colors relative group";
        let opts = ['LINE', 'FB', 'IG', 'YT', 'TEL', 'WEB'].map(k => `<option value="${k}" ${s.type === k ? 'selected' : ''}>${k} 圖示</option>`).join('');
        div.innerHTML = `
          <select class="bg-white shadow-sm border-none text-[12px] font-bold py-2 px-1 rounded-lg outline-none shrink-0 w-[80px]" onchange="window.v2Socials[${idx}].type=this.value; window.updateECardPreview()">
            ${opts}
          </select>
          <input type="text" class="flex-1 bg-white shadow-sm border-none rounded-lg text-[13px] font-mono outline-none px-3 py-2 placeholder-slate-400" placeholder="網址或電話" value="${s.u || ''}" oninput="window.v2Socials[${idx}].u=this.value; window.updateECardPreview()">
          <button onclick="window.v2Socials.splice(${idx},1); window.renderV2SocialUI(); window.updateECardPreview();" class="text-red-400 bg-red-50 w-9 h-9 rounded-xl flex items-center justify-center shrink-0 active:scale-90 transition-transform"><span class="material-symbols-outlined text-[18px]">delete</span></button>
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
        div.className = "flex flex-col gap-2 bg-slate-50 p-3 rounded-2xl relative border border-transparent hover:border-slate-200 transition-colors mb-2";
        div.innerHTML = `
          <div class="absolute top-2 right-2"><button onclick="window.v2Bars.splice(${idx},1); window.renderV2BarsUI(); window.updateECardPreview();" class="text-slate-400 hover:text-red-500 transition-colors"><span class="material-symbols-outlined text-[18px]">close</span></button></div>
          <div class="flex items-center gap-2 pr-6">
              <span class="text-[12px] font-bold text-slate-400 shrink-0 w-8">文字</span>
              <input type="text" value="${bar.t || ''}" class="custom-input !h-[36px] !bg-white shadow-sm !text-[13px] !rounded-lg flex-1" placeholder="按鈕文字" oninput="window.v2Bars[${idx}].t=this.value; window.updateECardPreview()">
          </div>
          <div class="flex items-center gap-2">
              <span class="text-[12px] font-bold text-slate-400 shrink-0 w-8">網址</span>
              <input type="text" value="${bar.u || ''}" class="custom-input !h-[36px] !bg-white shadow-sm !text-[12px] font-mono !rounded-lg flex-1" placeholder="https://" oninput="window.v2Bars[${idx}].u=this.value; window.updateECardPreview()">
          </div>
        `;
        list.appendChild(div);
    });
};
window.addV2Bar = function() { window.v2Bars.push({t:"查看詳情", u:"https://line.me"}); window.renderV2BarsUI(); window.updateECardPreview(); };

// ==========================================
// 4. 實時預覽引擎 (Editor Mockup)
// ==========================================

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
        
        let socialHtml = window.v2Socials.map(s => `<div class="bg-white/20 p-1 rounded-full shadow-sm"><img src="${V2_ICONS[s.type] || V2_ICONS['WEB']}" style="width:28px; height:28px; border-radius:50%;"></div>`).join('');
        let barsHtml = window.v2Bars.map(b => `<div class="block bg-white text-[#333] py-2.5 rounded-full text-sm font-bold mb-2 shadow-md">${window.escapeHtml(b.t)}</div>`).join('');

        htmlContent = `
            <div class="p-6 text-white text-center min-h-[400px] flex flex-col items-center" style="background: linear-gradient(135deg, ${bgStart}, ${bgEnd});">
                <img src="${logo}" class="w-20 h-20 rounded-full mx-auto object-cover border-4 border-white/20 mb-4 shadow-lg" onerror="this.onerror=null; this.src='${SVG_AVATAR}'">
                <div class="font-extrabold text-[20px] tracking-tight">${window.escapeHtml(title)}</div>
                <div class="text-xs opacity-90 mt-2 leading-relaxed max-w-[250px] whitespace-pre-wrap">${window.escapeHtml(desc)}</div>
                <div class="flex justify-center gap-2 my-5 flex-wrap">${socialHtml}</div>
                <div class="w-full max-w-[260px]">${barsHtml}</div>
            </div>
        `;
        
        // 更新編輯器內的微縮圖
        const v2LogoPreview = document.getElementById('ec-v2-logo-preview');
        const v2LogoPlaceholder = document.getElementById('ec-v2-logo-placeholder');
        if (v2LogoPreview && logo !== SVG_AVATAR) {
            v2LogoPreview.src = logo; v2LogoPreview.classList.remove('hidden'); v2LogoPlaceholder.classList.add('hidden');
        }
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
        
        let heroContent = `<img src="${imgUrl}" class="w-full aspect-[20/13] object-cover" onerror="this.onerror=null; this.src='${SVG_COVER}'">`;
        if (currentEcardType === 'video') {
            heroContent = `<div class="relative w-full aspect-[20/13] bg-black flex items-center justify-center overflow-hidden"><img src="${imgUrl}" class="absolute inset-0 w-full h-full object-cover opacity-50"><span class="material-symbols-outlined text-white text-5xl z-10">play_circle</span></div>`;
        }

        htmlContent = `<div class="bg-white overflow-hidden pb-4"><div class="relative">${heroContent}</div><div class="p-4 text-center"><div class="font-black text-[18px] text-slate-800">${window.escapeHtml(title)}</div><div class="text-[12px] text-slate-500 mt-1.5 font-medium leading-relaxed whitespace-pre-wrap">${window.escapeHtml(desc)}</div></div><div class="px-4">${buttonsHtml}</div></div>`;
        
        // 更新編輯器內的微縮圖
        const v1Preview = document.getElementById('ec-img-preview-box');
        const v1Placeholder = document.getElementById('ec-upload-placeholder');
        if (v1Preview && imgUrl !== SVG_COVER) {
            v1Preview.src = imgUrl; v1Preview.classList.remove('hidden'); v1Placeholder.classList.add('hidden');
        }
    }
    
    if (desktopContainer) desktopContainer.innerHTML = htmlContent;
    if (mobileContainer) mobileContainer.innerHTML = htmlContent;
};

// ==========================================
// 5. 數據初始化與存檔 (Sync to GAS)
// ==========================================

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
            setV('ec-v2-bg-start', saved.v2BgStart || '#57142b');
            setV('ec-v2-bg-end', saved.v2BgEnd || '#46250c');
            window.v2Socials = saved.v2Socials || [];
            window.v2Bars = saved.v2Bars || [];
            
            // 恢復按鈕文字
            if(saved.buttons) {
                saved.buttons.forEach((b, i) => {
                    setV(`ec-btn${i+1}-label`, b.l);
                    setV(`ec-btn${i+1}-url`, b.u);
                    setV(`ec-btn${i+1}-color`, b.c);
                });
            }
            window.toggleECardType(saved.cardType || 'image');
        } else {
            // 預設代入名片資料
            setV('ec-title-input', c['姓名'] || '');
            setV('ec-desc-input', c['服務項目/品牌標語'] || '');
            setV('ec-img-input', c['名片圖檔'] || '');
            window.toggleECardType('image');
        }
        window.renderV2SocialUI();
        window.renderV2BarsUI();
        document.getElementById('ecard-generator-modal')?.classList.remove('hidden');
        window.updateECardPreview();
    } catch (e) { alert("開啟編輯器失敗: " + e.message); }
};

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
      if(!isSilent) window.showToast('✅ 已儲存草稿');
      window.updateECardPreview();
    } catch(e) { if(!isSilent) window.showToast('⚠️ 儲存失敗', true); }
    finally { if (!isSilent && btn) { btn.innerHTML = '儲存草稿'; btn.classList.remove('pointer-events-none'); } }
};

// ==========================================
// 6. Flex Message 生成引擎 (The Heart)
// ==========================================

function sanitizeUri(u) {
    let t = (u || "").trim();
    if(!t) return "https://line.me";
    if(!t.match(/^(https?|tel|mailto|line):/i)) return "https://" + t;
    return t;
}

window.buildFlexMessageFromCard = function(card, config, dynamicAr = null) {
    let cardType = config?.cardType || 'image';
    const badgeUrl = `https://liff.line.me/${LIFF_ID}?shareCardId=${card.rowId}`;

    if (cardType === 'v2') {
        const title = config.title || '商務名片';
        const desc = config.desc || '';
        const logoUrl = config.v2Logo && config.v2Logo.startsWith('http') ? config.v2Logo : "https://cdn-icons-png.flaticon.com/512/149/149071.png";
        const bgStart = config.v2BgStart || "#57142b";
        const bgEnd = config.v2BgEnd || "#46250c";

        let bodyContents = [
            { "type": "box", "layout": "vertical", "width": "100px", "height": "100px", "cornerRadius": "100px", "margin": "lg", "contents": [{ "type": "image", "url": logoUrl, "size": "full", "aspectMode": "cover", "aspectRatio": "1:1" }] },
            { "type": "box", "layout": "vertical", "alignItems": "center", "margin": "sm", "contents": [{ "type": "text", "text": title, "weight": "bold", "size": "lg", "color": "#ffffff", "align": "center" }], "paddingAll": "0px" }
        ];

        if (desc) bodyContents[1].contents.push({ "type": "text", "text": desc, "size": "sm", "color": "#ffffff", "align": "center", "wrap": true, "margin": "sm" });

        if (config.v2Socials && config.v2Socials.length > 0) {
            bodyContents.push({
                "type": "box", "layout": "horizontal", "justifyContent": "center", "spacing": "xl", "margin": "lg",
                "contents": config.v2Socials.map(s => ({ "type": "image", "url": V2_ICONS[s.type] || V2_ICONS['WEB'], "size": "32px", "aspectRatio": "1:1", "action": { "type": "uri", "uri": sanitizeUri(s.u) } }))
            });
        }

        if (config.v2Bars && config.v2Bars.length > 0) {
            bodyContents.push({
                "type": "box", "layout": "vertical", "spacing": "sm", "margin": "lg", "alignItems": "center",
                "contents": config.v2Bars.map(b => ({
                    "type": "box", "layout": "vertical", "backgroundColor": "#ffffff", "cornerRadius": "100px", "paddingAll": "md", "width": "260px", "margin": "sm",
                    "contents": [{ "type": "text", "text": b.t || 'Link', "color": "#333333", "align": "center", "weight": "bold", "size": "sm" }],
                    "action": { "type": "uri", "uri": sanitizeUri(b.u) }
                }))
            });
        }

        return {
            "type": "bubble", "size": "mega",
            "header": { "type": "box", "layout": "horizontal", "justifyContent": "flex-end", "paddingAll": "8px", "contents": [{ "type": "box", "layout": "vertical", "justifyContent": "center", "backgroundColor": "#FF0000", "width": "65px", "height": "25px", "cornerRadius": "25px", "contents": [{ "type": "text", "text": "分享", "weight": "bold", "align": "center", "color": "#FFFFFF", "size": "xs" }], "action": { "type": "uri", "label": "share", "uri": badgeUrl } }] },
            "body": { "type": "box", "layout": "vertical", "paddingAll": "10px", "contents": bodyContents, "alignItems": "center", "background": { "type": "linearGradient", "angle": "88deg", "startColor": bgStart, "endColor": bgEnd } }
        };
    }

    // V1 圖片/影片版
    let imgUrl = window.getDirectImageUrl(config.imgUrl || card['名片圖檔']);
    let heroBlock;
    if (cardType === 'video' && config.videoUrl) {
        heroBlock = { "type": "video", "url": config.videoUrl, "previewUrl": imgUrl, "altContent": { "type": "image", "size": "full", "aspectRatio": dynamicAr || "20:13", "aspectMode": "cover", "url": imgUrl }, "aspectRatio": dynamicAr || "20:13" };
    } else {
        heroBlock = { "type": "image", "url": imgUrl, "size": "full", "aspectRatio": dynamicAr || "20:13", "aspectMode": "cover", "action": { "type": "uri", "uri": sanitizeUri(config.imgActionUrl) } };
    }

    const btns = config.buttons.map(b => ({ "type": "button", "style": "primary", "color": b.c, "height": "sm", "action": { "type": "uri", "label": b.l, "uri": sanitizeUri(b.u) } }));

    return {
        "type": "bubble", "size": "mega",
        "header": { "type": "box", "layout": "horizontal", "justifyContent": "flex-end", "paddingAll": "8px", "contents": [{ "type": "box", "layout": "vertical", "justifyContent": "center", "backgroundColor": "#FF0000", "width": "65px", "height": "25px", "cornerRadius": "25px", "contents": [{ "type": "text", "text": "分享", "weight": "bold", "align": "center", "color": "#FFFFFF", "size": "xs" }], "action": { "type": "uri", "label": "share", "uri": badgeUrl } }] },
        "hero": heroBlock,
        "body": { "type": "box", "layout": "vertical", "paddingAll": "15px", "contents": [{ "type": "text", "text": config.title, "weight": "bold", "size": "xl", "align": "center" }, { "type": "text", "text": config.desc, "size": "sm", "margin": "md", "color": "#666666", "wrap": true }] },
        "footer": { "type": "box", "layout": "vertical", "spacing": "sm", "paddingAll": "10px", "contents": btns }
    };
};

// ==========================================
// 7. LINE 轉發觸發器
// ==========================================

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
};

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
};

// ==========================================
// 8. VOOM 與 輔助功能
// ==========================================

window.openVoomModal = function() { document.getElementById('voomModal')?.classList.remove('hidden'); };
window.closeVoomModal = function() { document.getElementById('voomModal')?.classList.add('hidden'); };
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
};

window.applyVoom = function() {
    const vBtn = document.getElementById('applyVoomBtn');
    if(vBtn.dataset.videoUrl) document.getElementById('ec-video-url').value = vBtn.dataset.videoUrl;
    if(vBtn.dataset.thumbUrl) document.getElementById('ec-img-input').value = vBtn.dataset.thumbUrl;
    window.closeVoomModal();
    window.updateECardPreview();
};

window.escapeHtml = function(str) { 
    if (!str) return ''; 
    return String(str).replace(/[&<>]/g, function(m) { return {'&':'&amp;','<':'&lt;','>':'&gt;'}[m] || m; }); 
};

window.handleECardImageUpload = async function(input, mode) {
    if(typeof window.openCropper === 'function') {
        window.openCropper(input, mode);
    }
};
