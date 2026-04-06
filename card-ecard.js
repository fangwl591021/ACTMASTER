/**
 * card-ecard.js
 * Version: v20260406_1200 (QQ 完美體驗版：修復 V2 版型開啟時未自動帶入聯絡資訊按鈕的 Bug)
 */

// ⭐ V2 預設常數庫
const V2_ICONS = { 
    "LINE": "https://aiwe.cc/wp-content/uploads/2026/02/b75a5831fd553c7130aeafbb9783cf79.png", 
    "FB": "https://aiwe.cc/wp-content/uploads/2026/02/3986d1fd62384c8cdaa0e7c82f2740d1.png", 
    "IG": "https://aiwe.cc/wp-content/uploads/2026/02/a33306edcecd1ebdfd14baea6718cf23.png", // 新增預設 IG
    "YT": "https://aiwe.cc/wp-content/uploads/2026/02/87e6f8054bd3672f2885e38bddb112e2.png", 
    "TEL": "https://aiwe.cc/wp-content/uploads/2026/02/7254567388850a6b4d77b75208ebd4b8.png",
    "WEB": "https://aiwe.cc/wp-content/uploads/2026/02/web_icon_placeholder.png" // 需自行替換真實 WEB icon
};
let v2Socials = [];
let v2Bars = [];

window.toggleECardType = function(type) {
    const typeEl = document.getElementById('ec-card-type');
    if (typeEl) typeEl.value = type;
    
    const tabImg = document.getElementById('ec-tab-image');
    const tabVid = document.getElementById('ec-tab-video');
    const tabV2 = document.getElementById('ec-tab-v2');
    
    const v1Fields = document.getElementById('ec-v1-fields');
    const v2Fields = document.getElementById('ec-v2-fields');
    const vidGroup = document.getElementById('ec-video-input-group');
    const uploadLabel = document.getElementById('ec-upload-label');
    const uploadHint = document.getElementById('ec-upload-hint');
    
    // 重置所有 Tab 樣式
    if (tabImg) tabImg.className = 'flex-1 py-2 rounded-lg text-[14px] font-bold text-slate-500 transition-all hover:text-slate-700 bg-transparent';
    if (tabVid) tabVid.className = 'flex-1 py-2 rounded-lg text-[14px] font-bold text-slate-500 transition-all hover:text-slate-700 bg-transparent';
    if (tabV2) tabV2.className = 'flex-1 py-2 rounded-lg text-[14px] font-bold text-slate-500 transition-all hover:text-slate-700 bg-transparent';

    if (type === 'v2') {
        if (tabV2) tabV2.className = 'flex-1 py-2 rounded-lg text-[14px] font-bold bg-white text-blue-600 shadow-sm transition-all';
        if (v1Fields) v1Fields.classList.add('hidden');
        if (v2Fields) v2Fields.classList.remove('hidden');
    } else {
        if (v1Fields) v1Fields.classList.remove('hidden');
        if (v2Fields) v2Fields.classList.add('hidden');
        
        if (type === 'video') {
          if (tabVid) tabVid.className = 'flex-1 py-2 rounded-lg text-[14px] font-bold bg-white text-slate-800 shadow-sm transition-all';
          if (vidGroup) vidGroup.classList.remove('hidden');
          if (uploadLabel) uploadLabel.innerHTML = '點擊上傳封面圖縮圖 <span class="ml-1.5 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[11px] font-bold tracking-wider">選填</span>';
          if (uploadHint) uploadHint.innerText = '※ 影片必須有封面縮圖，若未上傳系統將自動代入名片圖或預設底圖。';
        } else {
          if (tabImg) tabImg.className = 'flex-1 py-2 rounded-lg text-[14px] font-bold bg-white text-slate-800 shadow-sm transition-all';
          if (vidGroup) vidGroup.classList.add('hidden');
          if (uploadLabel) uploadLabel.innerHTML = '點圖更換封面 <span class="ml-1.5 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[11px] font-bold tracking-wider">選填</span>';
          if (uploadHint) uploadHint.innerText = '※ 若未上傳，系統將智能代入您原先的名片圖檔作為底圖。';
        }
    }
    
    if (typeof window.updateECardPreview === 'function') window.updateECardPreview();
}

// ⭐ V2 社群清單渲染
window.renderV2SocialUI = function() {
    const list = document.getElementById('ec-v2-social-list'); if(!list) return;
    list.innerHTML = '';
    v2Socials.forEach((s, idx) => {
        const div = document.createElement('div');
        div.className = "flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm relative group";
        let opts = ['LINE', 'FB', 'IG', 'YT', 'TEL', 'WEB'].map(k => `<option value="${k}" ${s.type === k ? 'selected' : ''}>${k} 圖示</option>`).join('');
        div.innerHTML = `
          <select class="bg-slate-50 border-none text-[12px] font-bold p-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 shrink-0 w-[90px]" onchange="v2Socials[${idx}].type=this.value; if(typeof window.updateECardPreview === 'function') window.updateECardPreview()">${opts}</select>
          <input type="text" class="flex-1 bg-transparent border-none text-[13px] font-mono outline-none px-2 py-1 placeholder-slate-400 focus:ring-0" placeholder="輸入網址或電話" value="${s.u}" oninput="v2Socials[${idx}].u=this.value; if(typeof window.updateECardPreview === 'function') window.updateECardPreview()">
          <button onclick="v2Socials.splice(${idx},1); window.renderV2SocialUI(); if(typeof window.updateECardPreview === 'function') window.updateECardPreview();" class="text-slate-300 hover:text-red-500 p-1 transition-colors"><span class="material-symbols-outlined text-[18px]">delete</span></button>
        `;
        list.appendChild(div);
    });
}
window.addV2Social = function() { v2Socials.push({type:'LINE', u:'https://line.me'}); window.renderV2SocialUI(); if(typeof window.updateECardPreview === 'function') window.updateECardPreview(); }

// ⭐ V2 按鈕清單渲染
window.renderV2BarsUI = function() {
    const list = document.getElementById('ec-v2-bars-list'); if(!list) return;
    list.innerHTML = '';
    v2Bars.forEach((bar, idx) => {
        const div = document.createElement('div');
        div.className = "flex flex-col gap-2 bg-slate-50 p-3 rounded-2xl relative border border-transparent hover:border-slate-200 transition-colors";
        div.innerHTML = `
          <div class="absolute top-2 right-2">
             <button onclick="v2Bars.splice(${idx},1); window.renderV2BarsUI(); if(typeof window.updateECardPreview === 'function') window.updateECardPreview();" class="text-slate-400 hover:text-red-500 transition-colors"><span class="material-symbols-outlined text-[16px]">close</span></button>
          </div>
          <div class="flex items-center gap-2 pr-6">
              <span class="text-[12px] font-bold text-slate-400 shrink-0 w-8">文字</span>
              <input type="text" value="${bar.t}" class="custom-input !h-[36px] !bg-white shadow-sm !text-[13px] !rounded-lg flex-1" placeholder="按鈕顯示文字" oninput="v2Bars[${idx}].t=this.value; if(typeof window.updateECardPreview === 'function') window.updateECardPreview()">
          </div>
          <div class="flex items-center gap-2">
              <span class="text-[12px] font-bold text-slate-400 shrink-0 w-8">網址</span>
              <input type="text" value="${bar.u}" class="custom-input !h-[36px] !bg-white shadow-sm !text-[12px] font-mono !rounded-lg flex-1" placeholder="https:// 或 tel:" oninput="v2Bars[${idx}].u=this.value; if(typeof window.updateECardPreview === 'function') window.updateECardPreview()">
          </div>
        `;
        list.appendChild(div);
    });
}
window.addV2Bar = function() { v2Bars.push({t:"新按鈕", u:"https://line.me"}); window.renderV2BarsUI(); if(typeof window.updateECardPreview === 'function') window.updateECardPreview(); }

function sanitizeUri(u) {
    let t = (u || "").trim();
    if(!t) return "https://line.me";
    if(!t.match(/^(https?|tel|line):/i)) return "https://" + t;
    return t;
}

window.buildFlexMessageFromCard = function(card, config, dynamicAr = null) {
    let cardType = config && config.cardType ? config.cardType : 'image';
    const myLiffId = (typeof LIFF_ID !== 'undefined') ? LIFF_ID : '2009367829-DLtYBDUm';
    const badgeUrl = `https://liff.line.me/${myLiffId}?shareCardId=${card.rowId}`;

    // =================================================================
    // 🎨 質感多連結版型 (V2)
    // =================================================================
    if (cardType === 'v2') {
        const title = config.title || card['姓名'] || '商務名片';
        const desc = config.desc || card['服務項目/品牌標語'] || '';
        const logoUrl = config.v2Logo || "https://aiwe.cc/wp-content/uploads/2026/02/6e1716a9965b002e6c25ab6f9d383e60.jpg";
        const bgStart = config.v2BgStart || "#57142b";
        const bgEnd = config.v2BgEnd || "#46250c";
        const socials = config.v2Socials || [];
        const bars = config.v2Bars || [];

        let bodyContents = [
            {
                "type": "box",
                "layout": "vertical",
                "width": "100px",
                "height": "100px",
                "cornerRadius": "100px",
                "margin": "lg",
                "contents": [{ "type": "image", "url": logoUrl, "size": "full", "aspectMode": "cover", "aspectRatio": "1:1" }]
            },
            {
                "type": "box",
                "layout": "vertical",
                "alignItems": "center",
                "margin": "sm",
                "contents": [
                    { "type": "text", "text": title, "weight": "bold", "size": "lg", "color": "#ffffff", "align": "center", "adjustMode": "shrink-to-fit" }
                ],
                "paddingAll": "0px"
            }
        ];

        if (desc) {
            bodyContents[1].contents.push({ "type": "text", "text": desc, "size": "sm", "color": "#ffffff", "align": "center", "wrap": true, "margin": "sm" });
        }

        if (socials.length > 0) {
            bodyContents.push({
                "type": "box",
                "layout": "horizontal",
                "justifyContent": "center",
                "spacing": "xl",
                "paddingTop": "xs",
                "paddingBottom": "xs",
                "margin": "lg",
                "contents": socials.map(s => ({
                    "type": "image",
                    "url": V2_ICONS[s.type] || s.type,
                    "size": "70px",
                    "aspectRatio": "1:1",
                    "animated": true,
                    "action": { "type": "uri", "uri": sanitizeUri(s.u) }
                }))
            });
        }

        if (bars.length > 0) {
            bodyContents.push({
                "type": "box",
                "layout": "vertical",
                "spacing": "none",
                "margin": "lg",
                "alignItems": "center",
                "contents": bars.map(b => ({
                    "type": "box",
                    "layout": "vertical",
                    "backgroundColor": "#ffffff",
                    "cornerRadius": "100px",
                    "paddingAll": "md",
                    "width": "260px",
                    "margin": "lg",
                    "alignItems": "center",
                    "contents": [{ "type": "text", "text": b.t || 'Link', "color": "#333333", "align": "center", "weight": "bold", "size": "sm", "adjustMode": "shrink-to-fit" }],
                    "action": { "type": "uri", "uri": sanitizeUri(b.u) }
                }))
            });
        }

        bodyContents.push({ "type": "box", "layout": "vertical", "height": "10px", "contents": [] });

        return {
            "type": "bubble",
            "size": "mega",
            "header": {
                "type": "box", "layout": "horizontal", "justifyContent": "flex-end", "paddingAll": "8px",
                "contents": [{ "type": "box", "layout": "vertical", "justifyContent": "center", "backgroundColor": "#FF0000", "width": "65px", "height": "25px", "cornerRadius": "25px", "contents": [{ "type": "text", "text": "分享", "weight": "bold", "align": "center", "color": "#FFFFFF", "size": "xs" }], "action": { "type": "uri", "label": "share", "uri": badgeUrl } }]
            },
            "body": {
                "type": "box",
                "layout": "vertical",
                "paddingAll": "0px",
                "contents": bodyContents,
                "alignItems": "center",
                "background": { "type": "linearGradient", "angle": "88deg", "startColor": bgStart, "endColor": bgEnd }
            }
        };
    }

    // =================================================================
    // 🖼️ 滿版圖片/動態影片版型 (V1)
    // =================================================================
    let imgUrl, imgActionUrl, imgSize, aspectMode, ar, title, desc, buttons = [];
    let videoUrl = config?.videoUrl || '';
    let titleAlign = config?.titleAlign || 'center';
    
    let rawImg = (config && config.imgUrl) ? config.imgUrl : (card && card['名片圖檔'] ? card['名片圖檔'] : '');
    if (!rawImg || typeof rawImg !== 'string' || !rawImg.startsWith('http') || rawImg === '無圖檔' || rawImg === '圖片儲存失敗') {
        rawImg = 'https://images.unsplash.com/photo-1616628188550-808682f3926d?w=800&q=80'; 
    }
    imgUrl = typeof window.getDirectImageUrl === 'function' ? window.getDirectImageUrl(rawImg) : rawImg;

    if (config) {
        imgActionUrl = config.imgActionUrl || `https://liff.line.me/${myLiffId}`;
        imgSize = config.imgSize || 'mega';
        aspectMode = config.aspectMode || 'cover';
        let arSetting = config.ar || 'auto';
        ar = (arSetting === 'auto') ? (dynamicAr || '20:13') : arSetting;
        title = config.title || '-';
        desc = config.desc || '-'; 
        buttons = config.buttons || [];
    } else {
        imgActionUrl = `https://liff.line.me/${myLiffId}`;
        imgSize = 'mega';
        aspectMode = 'cover';
        ar = dynamicAr || '20:13';
        let cName = card['公司名稱'] && card['公司名稱'] !== 'Not provided' ? card['公司名稱'] : '';
        let uName = card['姓名'] && card['姓名'] !== 'Not provided' ? card['姓名'] : '';
        title = [cName, uName].filter(Boolean).join(' - ') || card['Name'] || '商務名片';
        let defaultDesc = card['服務項目/品牌標語'] || '';
        if (defaultDesc === 'Not provided' || defaultDesc === '未提供') defaultDesc = '';
        desc = defaultDesc || '歡迎點擊下方按鈕與我聯繫';
        buttons = [];
    }
  
    const validSizes = ['nano', 'micro', 'kilo', 'mega', 'giga'];
    if (!validSizes.includes(imgSize)) imgSize = 'mega';
    if (!/^\d+:\d+$/.test(ar)) ar = '20:13';
  
    let safeImgActionUrl = imgActionUrl ? String(imgActionUrl).trim() : `https://liff.line.me/${myLiffId}`;
    if (!safeImgActionUrl.match(/^(http|https|tel|mailto|line):/i)) { safeImgActionUrl = 'https://' + safeImgActionUrl; }
  
    const btnContents = [];
    for (let i=0; i<buttons.length; i++) {
        let label = buttons[i].l ? String(buttons[i].l).trim() : '查看';
        let safeU = buttons[i].u ? String(buttons[i].u).trim() : 'https://line.me';
        let btnColor = buttons[i].c || '#06C755';
        btnContents.push({ "type": "button", "style": "primary", "color": btnColor, "height": "sm", "margin": "sm", "action": { "type": "uri", "label": label.substring(0, 20), "uri": safeU.substring(0, 1000) } });
    }
  
    const headerBlock = {
        "type": "box", "layout": "horizontal", "justifyContent": "flex-end", "paddingAll": "8px",
        "contents": [{ "type": "box", "layout": "vertical", "justifyContent": "center", "backgroundColor": "#FF0000", "width": "65px", "height": "25px", "cornerRadius": "25px", "contents": [{ "type": "text", "text": "分享", "weight": "bold", "align": "center", "color": "#FFFFFF", "size": "xs" }], "action": { "type": "uri", "label": "share", "uri": badgeUrl } }]
    };
  
    let heroBlock;
    if (cardType === 'video' && videoUrl && videoUrl.match(/^https:\/\//i)) {
        heroBlock = { "type": "video", "url": videoUrl, "previewUrl": imgUrl, "altContent": { "type": "image", "size": "full", "aspectRatio": ar, "aspectMode": aspectMode, "url": imgUrl }, "aspectRatio": ar };
    } else {
        heroBlock = { "type": "image", "url": imgUrl, "size": "full", "aspectRatio": ar, "aspectMode": aspectMode, "action": { "type": "uri", "label": "cover", "uri": safeImgActionUrl.substring(0, 1000) } };
    }
  
    const flexContents = {
        "type": "bubble", "size": imgSize, "header": headerBlock, "hero": heroBlock,
        "body": { "type": "box", "layout": "vertical", "paddingAll": "0px", "contents": [{ "type": "box", "layout": "vertical", "paddingAll": "10px", "contents": [{ "type": "text", "text": title, "weight": "bold", "size": "xl", "align": titleAlign, "wrap": true }, { "type": "text", "text": desc, "size": "sm", "margin": "md", "color": "#666666", "wrap": true }] }] }
    };
    
    if (btnContents.length > 0) {
        flexContents.footer = { "type": "box", "layout": "vertical", "spacing": "sm", "paddingAll": "10px", "paddingTop": "0px", "backgroundColor": "#FFFFFF", "contents": btnContents };
    }
    return flexContents;
}
  
window.openECardGenerator = function() {
    try {
        if (typeof currentActiveCard === 'undefined' || !currentActiveCard) return;
        const c = currentActiveCard;
      
        try {
            if (typeof userProfile !== 'undefined' && userProfile && userProfile.pictureUrl) {
                const avatarImg = document.getElementById('preview-user-avatar');
                if (avatarImg) {
                    avatarImg.src = userProfile.pictureUrl;
                    avatarImg.classList.remove('hidden');
                }
                const fallback = document.querySelector('.avatar-fallback');
                if (fallback) fallback.classList.add('hidden');
            }
        } catch(e) {}
      
        let savedConfig = null;
        if (c['自訂名片設定']) { try { savedConfig = JSON.parse(c['自訂名片設定']); } catch(e){} }
      
        const myLiffId = (typeof LIFF_ID !== 'undefined') ? LIFF_ID : '2009367829-DLtYBDUm';

        const safeSetValue = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.value = val;
        };

        // ⭐ QQ 優化：提前萃取預設聯絡資訊 (V1 / V2 共用)
        let autoExtractedBtns = [];
        let p1 = c['手機號碼'] || c['Mobile'];
        if (p1) { let phone = String(p1).split(',')[0].replace(/[^\d+]/g, ''); if (phone.startsWith('886')) phone = '0' + phone.substring(3); if (phone) autoExtractedBtns.push({ l: '撥打手機', u: `tel:${phone}`, c: '#06C755' }); }
        let p2 = c['公司電話'] || c['Tel'];
        if (p2) { let tel = String(p2).split(',')[0].replace(/[^\d+]/g, ''); if (tel.startsWith('886')) tel = '0' + tel.substring(3); if (tel) autoExtractedBtns.push({ l: '撥打電話', u: `tel:${tel}`, c: '#06C755' }); }
        let p3 = c['電子郵件'] || c['Email'];
        if (p3) { let email = String(p3).split(/[\s,]+/)[0]; if (email.includes('@')) autoExtractedBtns.push({ l: '發送信箱', u: `mailto:${email}`, c: '#06C755' }); }
        let p4 = c['公司地址'] || c['Address'];
        if (p4) autoExtractedBtns.push({ l: 'Google 導航', u: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p4.split(',')[0])}`, c: '#06C755' });
        let p5 = c['公司網址'] || c['Website'];
        if (p5 && autoExtractedBtns.length < 4) { let wUrl = String(p5).trim(); if (wUrl && !wUrl.startsWith('http')) wUrl = 'https://' + wUrl; if (wUrl) autoExtractedBtns.push({ l: '公司網站', u: wUrl, c: '#06C755' }); }
        autoExtractedBtns = autoExtractedBtns.slice(0, 4);

        // 載入 V1 按鈕設定
        const listEl = document.getElementById('ec-btn-list');
        if (listEl) {
            listEl.innerHTML = '';
            let sBtns = (savedConfig && savedConfig.buttons && savedConfig.buttons.length > 0) ? savedConfig.buttons : autoExtractedBtns;

            for(let i=1; i<=4; i++) {
                const b = sBtns[i-1] || {l:'', u:'', c:'#06C755'};
                listEl.innerHTML += `
                <div class="flex items-center gap-3 bg-slate-50 p-2.5 rounded-2xl">
                  <input type="color" id="ec-btn${i}-color" value="${b.c || '#06C755'}" class="w-10 h-10 rounded-xl cursor-pointer border-none bg-transparent shrink-0" oninput="if (typeof window.updateECardPreview === 'function') window.updateECardPreview()">
                  <div class="flex flex-col flex-1 gap-1">
                    <input type="text" id="ec-btn${i}-label" class="w-full bg-transparent border-none text-[14px] font-bold outline-none px-2 py-1 placeholder-slate-400 focus:ring-0" placeholder="按鈕文字 (選填)" value="${b.l}" oninput="if (typeof window.updateECardPreview === 'function') window.updateECardPreview()">
                    <input type="text" id="ec-btn${i}-url" class="w-full bg-transparent border-none text-[13px] text-slate-500 font-medium outline-none px-2 py-1 placeholder-slate-400 focus:ring-0" placeholder="連結網址 (選填)" value="${b.u}" oninput="if (typeof window.updateECardPreview === 'function') window.updateECardPreview()">
                  </div>
                </div>`;
            }
        }

        // 載入 V2 設定
        v2Socials = (savedConfig && savedConfig.v2Socials && savedConfig.v2Socials.length > 0) ? savedConfig.v2Socials : [{type:'LINE', u:'https://line.me'}];
        
        if (savedConfig && savedConfig.v2Bars && savedConfig.v2Bars.length > 0) {
            v2Bars = savedConfig.v2Bars;
        } else {
            // ⭐ V2 也能無縫套用萃取出的聯絡資訊
            v2Bars = autoExtractedBtns.length > 0 
                ? autoExtractedBtns.map(b => ({ t: b.l, u: b.u })) 
                : [{t:"查看更多", u:"https://line.me"}];
        }

        if(typeof window.renderV2SocialUI === 'function') window.renderV2SocialUI();
        if(typeof window.renderV2BarsUI === 'function') window.renderV2BarsUI();

        if (savedConfig) {
          if (savedConfig.title) savedConfig.title = savedConfig.title.replace(/Not provided/gi, '').replace(/未提供/g, '').trim();
          if (savedConfig.desc) savedConfig.desc = savedConfig.desc.replace(/Not provided/gi, '').replace(/未提供/g, '').trim();
          
          if (!savedConfig.title) {
              let cName = c['公司名稱'] && c['公司名稱'] !== 'Not provided' ? c['公司名稱'] : '';
              let uName = c['姓名'] && c['姓名'] !== 'Not provided' ? c['姓名'] : '';
              savedConfig.title = [cName, uName].filter(Boolean).join(' - ') || c['Name'] || '商務名片';
          }

          safeSetValue('ec-card-type', savedConfig.cardType || 'image');
          safeSetValue('ec-video-url', savedConfig.videoUrl || '');
          safeSetValue('ec-img-input', savedConfig.imgUrl || '');
          safeSetValue('ec-img-action-url', savedConfig.imgActionUrl || `https://liff.line.me/${myLiffId}`);
          safeSetValue('ec-img-size', savedConfig.imgSize || 'mega');
          safeSetValue('ec-aspect-ratio', savedConfig.ar || 'auto');
          safeSetValue('ec-title-align', savedConfig.titleAlign || 'center');
          safeSetValue('ec-title-input', savedConfig.title || '');
          safeSetValue('ec-desc-input', savedConfig.desc || '');
          safeSetValue('ec-alt-text-input', savedConfig.altText || '這是我的電子名片，請多指教');
          
          safeSetValue('ec-v2-logo-url', savedConfig.v2Logo || '');
          safeSetValue('ec-v2-bg-start', savedConfig.v2BgStart || '#57142b');
          safeSetValue('ec-v2-bg-end',   savedConfig.v2BgEnd || '#46250c');
          
          const startHex = document.getElementById('ec-v2-bg-start-hex'); if(startHex) startHex.innerText = savedConfig.v2BgStart || '#57142B';
          const endHex = document.getElementById('ec-v2-bg-end-hex'); if(endHex) endHex.innerText = savedConfig.v2BgEnd || '#46250C';

          const isPublicEl = document.getElementById('ec-isPublic-input');
          if (isPublicEl) {
              if (savedConfig.hasOwnProperty('isPrivate')) {
                  isPublicEl.checked = !(savedConfig.isPrivate === true);
              } else {
                  isPublicEl.checked = true;
              }
          }
        } else {
          const defaultFlex = window.buildFlexMessageFromCard(c, null);
          
          safeSetValue('ec-card-type', 'image');
          safeSetValue('ec-video-url', '');
          safeSetValue('ec-img-input', defaultFlex.hero ? defaultFlex.hero.url : '');
          safeSetValue('ec-img-action-url', `https://liff.line.me/${myLiffId}`);
          safeSetValue('ec-img-size', defaultFlex.size || 'mega');
          safeSetValue('ec-aspect-ratio', 'auto');
          safeSetValue('ec-title-align', 'center');
          
          let defaultTitle = '';
          let defaultDesc = '';
          if (defaultFlex.body && defaultFlex.body.contents && defaultFlex.body.contents[0] && defaultFlex.body.contents[0].contents) {
              defaultTitle = defaultFlex.body.contents[0].contents[0] ? defaultFlex.body.contents[0].contents[0].text : '';
              defaultDesc = defaultFlex.body.contents[0].contents[1] ? defaultFlex.body.contents[0].contents[1].text : '';
          }
          
          safeSetValue('ec-title-input', defaultTitle);
          safeSetValue('ec-desc-input', defaultDesc);
          safeSetValue('ec-alt-text-input', '這是我的電子名片，請多指教');
          safeSetValue('ec-v2-logo-url', '');
          safeSetValue('ec-v2-bg-start', '#57142b');
          safeSetValue('ec-v2-bg-end', '#46250c');
          
          const isPublicEl = document.getElementById('ec-isPublic-input');
          if (isPublicEl) isPublicEl.checked = true;
        }
        
        const cardTypeEl = document.getElementById('ec-card-type');
        if (typeof window.toggleECardType === 'function') window.toggleECardType(cardTypeEl ? cardTypeEl.value : 'image');
        
        const previewImg = document.getElementById('preview-ec-img');
        if (previewImg) previewImg.removeAttribute('data-current-src');
        
        const modalEl = document.getElementById('ecard-generator-modal');
        if (modalEl) modalEl.classList.remove('hidden');
        
        if (typeof window.updateECardPreview === 'function') window.updateECardPreview();
        
    } catch (err) {
        alert("開啟編輯器時發生系統異常：" + err.message);
    }
}
  
window.closeECardGenerator = function() { 
    const modalEl = document.getElementById('ecard-generator-modal');
    if (modalEl) modalEl.classList.add('hidden'); 
}

// ⭐ 更新預覽畫面 (包含 V1 與 V2 切換邏輯)
window.updateECardPreview = function(forceBase64 = null, cropTarget = null) {
    const cardTypeEl = document.getElementById('ec-card-type');
    const cardType = cardTypeEl ? cardTypeEl.value : 'image';
    const bubbleEl = document.getElementById('preview-ec-bubble');
    if (!bubbleEl) return;

    const titleInputEl = document.getElementById('ec-title-input');
    const descInputEl = document.getElementById('ec-desc-input');
    const titleText = titleInputEl ? titleInputEl.value : '';
    const descText = descInputEl ? descInputEl.value : '';
    const titleAlignEl = document.getElementById('ec-title-align');
    const cssAlign = (titleAlignEl && titleAlignEl.value === 'start') ? 'left' : ((titleAlignEl && titleAlignEl.value === 'end') ? 'right' : 'center');

    // ==========================================
    // 🎨 V2: 質感多連結版型渲染
    // ==========================================
    if (cardType === 'v2') {
        const startColorEl = document.getElementById('ec-v2-bg-start');
        const endColorEl = document.getElementById('ec-v2-bg-end');
        const startColor = startColorEl ? startColorEl.value : '#57142b';
        const endColor = endColorEl ? endColorEl.value : '#46250c';
        
        const startHex = document.getElementById('ec-v2-bg-start-hex'); if(startHex) startHex.innerText = startColor;
        const endHex = document.getElementById('ec-v2-bg-end-hex'); if(endHex) endHex.innerText = endColor;

        const logoInputEl = document.getElementById('ec-v2-logo-url');
        let logoUrl = logoInputEl ? logoInputEl.value : '';
        if (forceBase64 && cropTarget === 'v2logo') {
            logoUrl = forceBase64;
        } else if (!logoUrl) {
            logoUrl = "https://aiwe.cc/wp-content/uploads/2026/02/6e1716a9965b002e6c25ab6f9d383e60.jpg";
        }
        
        const logoPreviewBox = document.getElementById('ec-v2-logo-preview');
        const logoPlaceholder = document.getElementById('ec-v2-logo-placeholder');
        if (logoPreviewBox && logoPlaceholder) {
            if (logoUrl && logoUrl !== "https://aiwe.cc/wp-content/uploads/2026/02/6e1716a9965b002e6c25ab6f9d383e60.jpg") {
                logoPreviewBox.src = logoUrl;
                logoPreviewBox.classList.remove('hidden');
                logoPlaceholder.classList.add('hidden');
            } else {
                logoPreviewBox.src = '';
                logoPreviewBox.classList.add('hidden');
                logoPlaceholder.classList.remove('hidden');
            }
        }

        let socialHtml = v2Socials.map(s => `<img src="${V2_ICONS[s.type] || V2_ICONS['WEB']}" style="width:40px; height:40px; border-radius:50%;">`).join('');
        let barsHtml = v2Bars.map(b => `<div style="background:#fff; color:#333; width:100%; text-align:center; padding:10px; border-radius:50px; font-weight:bold; font-size:12px; margin-bottom:10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">${b.t || 'Link'}</div>`).join('');

        bubbleEl.style.maxWidth = '340px';
        bubbleEl.innerHTML = `
        <div style="width:100%; background:linear-gradient(88deg, ${startColor}, ${endColor}); border-radius:20px; overflow:hidden; display:flex; flex-direction:column; position:relative; min-height: 480px; padding-bottom: 20px;">
            <div class="preview-header w-full flex justify-end p-2 pb-1 absolute top-0 right-0 z-20">
                <div class="preview-share-btn bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-sm tracking-widest">分享</div>
            </div>
            <div style="flex:1; display:flex; flex-direction:column; align-items:center; width: 100%; box-sizing: border-box; padding-top: 40px;">
                <div style="display:flex; align-items:center; justify-content:center; overflow:hidden; background:#fff; flex-shrink:0; width:100px; height:100px; border-radius:100px; margin-bottom: 15px; border:2px solid rgba(255,255,255,0.2);">
                    <img src="${logoUrl}" style="width:100%; height:100%; object-fit:cover;">
                </div>
                <div style="display:flex; flex-direction:column; width:100%; padding: 0 20px; align-items: center;">
                    <div style="font-size:18px; font-weight:bold; color:#FFFFFF; word-break: break-all; text-align: center; width:100%;">${titleText || '商務名片'}</div>
                    ${descText ? `<div style="font-size:12px; text-align:center; margin-top:8px; opacity:0.95; line-height:1.5; color:#FFFFFF; white-space:pre-wrap; word-break: break-all; width:100%;">${descText}</div>` : ''}
                </div>
                ${socialHtml ? `<div style="display:flex; align-items:center; justify-content:center; gap:16px; margin-top:24px; width: 100%;">${socialHtml}</div>` : ''}
                ${barsHtml ? `<div style="width:260px; display:flex; flex-direction:column; margin-top:24px; align-items:center;">${barsHtml}</div>` : ''}
            </div>
        </div>`;
        return;
    }

    // ==========================================
    // 🖼️ V1: 滿版圖文版型渲染 (原有邏輯)
    // ==========================================
    const videoUrlEl = document.getElementById('ec-video-url');
    const videoUrl = videoUrlEl ? videoUrlEl.value.trim() : '';
    const arSettingEl = document.getElementById('ec-aspect-ratio');
    const arSetting = arSettingEl ? arSettingEl.value : 'auto';
    const imgInputEl = document.getElementById('ec-img-input');
    let rawUrl = imgInputEl ? imgInputEl.value : '';

    let displayUrl = null;
    if (forceBase64 && cropTarget === 'ecard') {
        displayUrl = forceBase64;
    }

    if (!displayUrl) {
        if (!rawUrl) {
            rawUrl = (typeof currentActiveCard !== 'undefined' && currentActiveCard && currentActiveCard['名片圖檔']) ? currentActiveCard['名片圖檔'] : '';
            if (!rawUrl || rawUrl === '無圖檔' || rawUrl === '圖片儲存失敗' || !rawUrl.startsWith('http')) {
                rawUrl = 'https://images.unsplash.com/photo-1616628188550-808682f3926d?w=800&q=80';
            }
        }
        displayUrl = typeof window.getDirectImageUrl === 'function' ? window.getDirectImageUrl(rawUrl) : rawUrl;
        if (window.optimisticImageUrl && rawUrl === window.optimisticImageUrl && window.optimisticBase64) {
            displayUrl = window.optimisticBase64;
        }
    }
    
    // 重建 V1 DOM 結構
    bubbleEl.innerHTML = `
        <div class="preview-header w-full flex justify-end p-2 bg-white pb-1 z-20 absolute top-0 right-0">
            <div class="preview-share-btn bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-sm tracking-widest">分享</div>
        </div>
        <div id="preview-ec-hero" class="relative w-full overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center">
            <img id="preview-ec-img" src="" class="absolute inset-0 w-full h-full object-cover z-0 hidden">
            <video id="preview-ec-video" muted loop playsinline class="absolute inset-0 w-full h-full object-cover z-10 hidden"></video>
            <div id="preview-ec-play-icon" class="absolute inset-0 z-20 flex items-center justify-center text-white/80 hidden pointer-events-none"><span class="material-symbols-outlined text-[48px] drop-shadow-md">play_circle</span></div>
        </div>
        <div class="px-3.5 py-4 text-center bg-white relative">
            <h2 id="preview-ec-title" class="text-[19px] font-black text-slate-800 leading-snug mb-1.5"></h2>
            <p id="preview-ec-desc" class="text-[13px] text-slate-500 whitespace-pre-wrap leading-relaxed text-left font-medium"></p>
        </div>
        <div id="preview-ec-buttons" class="px-3.5 pb-4 pt-0 bg-white space-y-2"></div>
    `;

    const heroEl = document.getElementById('preview-ec-hero');
    const imgEl = document.getElementById('preview-ec-img');
    const videoEl = document.getElementById('preview-ec-video');
    const playIcon = document.getElementById('preview-ec-play-icon');
    
    const sizeEl = document.getElementById('ec-img-size');
    const imgSize = sizeEl ? sizeEl.value : 'mega';
    if (imgSize === 'giga') bubbleEl.style.maxWidth = '360px';
    else if (imgSize === 'kilo') bubbleEl.style.maxWidth = '260px';
    else bubbleEl.style.maxWidth = '300px'; 
    
    const previewBox = document.getElementById('ec-img-preview-box');
    const placeholder = document.getElementById('ec-upload-placeholder');
  
    if (cardType === 'video') {
        if (videoUrl && videoEl) {
            videoEl.src = videoUrl;
            videoEl.classList.remove('hidden');
            videoEl.play().catch(e => {});
        } else if (videoEl) {
            videoEl.src = '';
            videoEl.classList.add('hidden');
        }
        if (playIcon) playIcon.classList.remove('hidden');
    } else {
        if (videoEl) {
            videoEl.src = '';
            videoEl.classList.add('hidden');
        }
        if (playIcon) playIcon.classList.add('hidden');
    }
  
    const applyAspectRatio = (ratioStr) => {
        let [w, h] = ratioStr.split(':');
        if(w && h && heroEl && imgEl) {
            heroEl.style.aspectRatio = `${w} / ${h}`;
            imgEl.style.aspectRatio = `${w} / ${h}`;
            imgEl.style.objectFit = 'cover';
        }
    };
  
    if (imgEl.getAttribute('data-current-src') !== displayUrl || arSetting !== 'auto') {
        imgEl.setAttribute('data-current-src', displayUrl);
        const tempImg = new Image();
        tempImg.onload = function() {
            if (arSetting === 'auto') {
                let w = this.width; let h = this.height; 
                if (w === 0 || h === 0) w = 20, h = 13;
                let ratio = w / h;
                if (ratio > 3) { w = 300; h = 100; }
                else if (ratio < 0.334) { w = 100; h = 300; }
                let dynAr = `${Math.round(w)}:${Math.round(h)}`;
                if (typeof window.dynamicAspectRatio !== 'undefined') window.dynamicAspectRatio = dynAr;
                applyAspectRatio(dynAr);
            } else {
                applyAspectRatio(arSetting);
            }
            imgEl.src = displayUrl;
            imgEl.classList.remove('hidden');
            
            if (previewBox && placeholder) {
                previewBox.src = displayUrl;
                previewBox.classList.remove('hidden');
                placeholder.classList.add('hidden');
            }
        };
        tempImg.onerror = function() {
            applyAspectRatio(arSetting === 'auto' ? "20:13" : arSetting);
            if (imgEl.getAttribute('data-current-src') === displayUrl) {
                imgEl.src = displayUrl;
                imgEl.classList.remove('hidden');
            }
        };
        tempImg.src = displayUrl;
    } else {
        applyAspectRatio(arSetting === 'auto' ? "20:13" : arSetting);
    }
    
    const previewTitleEl = document.getElementById('preview-ec-title');
    if (previewTitleEl) {
        previewTitleEl.style.textAlign = cssAlign;
        previewTitleEl.innerText = titleText || '請輸入標題';
    }

    const previewDescEl = document.getElementById('preview-ec-desc');
    if (previewDescEl) {
        previewDescEl.innerText = descText;
    }
    
    const btnContainer = document.getElementById('preview-ec-buttons');
    if (btnContainer) {
        btnContainer.innerHTML = '';
        for(let i=1; i<=4; i++) {
          const labelEl = document.getElementById(`ec-btn${i}-label`);
          const colorEl = document.getElementById(`ec-btn${i}-color`);
          const label = labelEl ? labelEl.value : '';
          const color = colorEl ? colorEl.value : '#06C755';
          if(label) {
            btnContainer.innerHTML += `<div class="w-full text-white text-[13px] font-bold text-center py-2.5 rounded-lg mb-2 shadow-sm" style="background-color: ${color}">${label}</div>`;
          }
        }
    }
}
  
window.checkFormat = function(showAlert = false) {
    let errors = [];
    const cardTypeEl = document.getElementById('ec-card-type');
    const cardType = cardTypeEl ? cardTypeEl.value : 'image';

    if (cardType === 'video') {
        const vUrlEl = document.getElementById('ec-video-url');
        const vUrl = vUrlEl ? vUrlEl.value.trim() : '';
        if (!vUrl) errors.push("❌ 【動態影片版】必須填寫影片網址。");
        else if (!vUrl.match(/^https:\/\//i)) errors.push("❌ 【影片網址】必須以 https:// 開頭。");
        else if (!vUrl.toLowerCase().includes('mp4') && !vUrl.toLowerCase().includes('line')) errors.push("❌ 【影片網址】必須為 MP4 格式或 LINE 影片連結。");
    }

    // 只檢查 V1 的按鈕格式
    if (cardType !== 'v2') {
        for (let i = 1; i <= 4; i++) {
            let urlInput = document.getElementById(`ec-btn${i}-url`);
            if (!urlInput) continue;
            let url = urlInput.value.trim();
            if (url) {
                if (/^[\d\-\+\s()]+$/.test(url) && !url.startsWith('tel:')) {
                    let pureNum = url.replace(/[^\d+]/g, '');
                    if (pureNum.startsWith('+886')) pureNum = '0' + pureNum.substring(4);
                    if (pureNum.startsWith('886')) pureNum = '0' + pureNum.substring(3);
                    if (pureNum) urlInput.value = 'tel:' + pureNum;
                } 
                else if (url.includes('@') && !url.startsWith('mailto:') && !url.startsWith('http')) {
                    urlInput.value = 'mailto:' + url.replace(/\s/g, '');
                } 
                else if (!url.startsWith('http') && !url.startsWith('tel:') && !url.startsWith('mailto:') && !url.startsWith('line:')) {
                    if (url.includes('.')) {
                        urlInput.value = 'https://' + url.replace(/\s/g, '');
                    }
                }
                urlInput.value = urlInput.value.replace(/\s/g, ''); 
            }
        }
      
        const actionUrlEl = document.getElementById('ec-img-action-url');
        const actionUrl = actionUrlEl ? actionUrlEl.value.trim() : '';
        if (!actionUrl) errors.push("❌ 【點圖預設連結】不得為空。");
        else if (!actionUrl.match(/^(https?|tel|mailto|line):/i)) errors.push("❌ 【點圖預設連結】必須為有效網址。");
      
        for (let i = 1; i <= 4; i++) {
            const labelEl = document.getElementById(`ec-btn${i}-label`);
            const urlEl = document.getElementById(`ec-btn${i}-url`);
            const label = labelEl ? labelEl.value.trim() : '';
            const url = urlEl ? urlEl.value.trim() : '';
            if (label || url) {
                if (!label) errors.push(`❌ 【按鈕 ${i}】缺少文字。`);
                else if (label.length > 20) errors.push(`❌ 【按鈕 ${i}】文字過長。`);
                if (!url) errors.push(`❌ 【按鈕 ${i}】缺少連結。`);
                else if (!url.match(/^(https?|tel|mailto|line):/i)) errors.push(`❌ 【按鈕 ${i}】連結開頭錯誤。`);
            }
        }
    }
  
    if (errors.length > 0) {
        if (showAlert) alert("⚠️ 發現格式錯誤：\n\n" + errors.join("\n"));
        return false;
    } else {
        if (showAlert) { if (typeof window.showToast === 'function') window.showToast("✅ 格式檢查無誤"); }
        return true;
    }
}
  
window.saveECardConfig = async function(isSilent = false) {
    if(typeof currentActiveCard === 'undefined' || !currentActiveCard) return;
    const btn = document.getElementById('btn-save-ecard');
    const originalText = btn ? btn.innerHTML : '';
    
    if (!isSilent && btn) {
        btn.innerHTML = '<span class="material-symbols-outlined text-[16px] animate-spin">refresh</span>';
        btn.classList.add('pointer-events-none', 'opacity-50');
    }
  
    const getVal = (id, def) => { const el = document.getElementById(id); return el ? el.value : def; };
    const isPublicEl = document.getElementById('ec-isPublic-input');

    const config = {
      cardType: getVal('ec-card-type', 'image'),
      videoUrl: getVal('ec-video-url', '').trim(),
      imgUrl: getVal('ec-img-input', ''),
      imgActionUrl: getVal('ec-img-action-url', ''),
      imgSize: getVal('ec-img-size', 'mega'),
      ar: getVal('ec-aspect-ratio', 'auto'),
      aspectMode: 'cover',
      titleAlign: getVal('ec-title-align', 'center'),
      title: getVal('ec-title-input', ''),
      desc: getVal('ec-desc-input', ''),
      altText: getVal('ec-alt-text-input', '這是我的電子名片，請多指教').trim() || '這是我的電子名片，請多指教',
      isPrivate: isPublicEl ? !isPublicEl.checked : false,
      buttons: [],
      // ⭐ V2 資料儲存
      v2Logo: getVal('ec-v2-logo-url', ''),
      v2BgStart: getVal('ec-v2-bg-start', '#57142b'),
      v2BgEnd: getVal('ec-v2-bg-end', '#46250c'),
      v2Socials: v2Socials,
      v2Bars: v2Bars
    };
    
    // V1 Buttons
    for(let i=1; i<=4; i++) {
      const l = getVal(`ec-btn${i}-label`, '');
      const u = getVal(`ec-btn${i}-url`, '');
      const c = getVal(`ec-btn${i}-color`, '#06C755');
      if(l && u) config.buttons.push({l, u, c});
    }
  
    try {
      if (typeof window.fetchAPI === 'function') {
         await window.fetchAPI('updateECardConfig', { 
             rowId: currentActiveCard.rowId, 
             targetVerifyUid: currentActiveCard['LINE ID'] || currentActiveCard.userId || '',
             targetVerifyName: currentActiveCard['姓名'] || currentActiveCard['Name'] || '',
             config: config 
         }, true);
      }
      currentActiveCard['自訂名片設定'] = JSON.stringify(config); 
      if(config.imgUrl) currentActiveCard['名片圖檔'] = config.imgUrl; 
      if(!isSilent && typeof window.showToast === 'function') window.showToast('✅ 名片設定已儲存');
    } catch(e) {
      if(!isSilent && typeof window.showToast === 'function') window.showToast('⚠️ 儲存失敗', true);
    } finally {
      if (!isSilent && btn) {
          btn.innerHTML = originalText;
          btn.classList.remove('pointer-events-none', 'opacity-50');
      }
    }
    return config;
}

window.togglePrivacyAutoSave = async function() {
    const isPublicEl = document.getElementById('ec-isPublic-input');
    const state = isPublicEl ? isPublicEl.checked : true;
    
    if (typeof window.showToast === 'function') {
        window.showToast(state ? "✅ 已開放 AI 媒合與搜尋" : "🔒 隱私模式已啟動 (不參與配對)");
    }
    
    if (typeof window.saveECardConfig === 'function') {
        await window.saveECardConfig(true); 
    }
};
  
window.shareECardToLine = async function() {
    if (typeof window.checkFormat === 'function' && !window.checkFormat(true)) return;
  
    const btnShare = document.getElementById('btn-share-line');
    let oriHtml = '';
    if (btnShare) {
        oriHtml = btnShare.innerHTML;
        btnShare.innerHTML = '<span class="material-symbols-outlined animate-spin text-[18px]">refresh</span> 發送中...';
        btnShare.classList.add('pointer-events-none');
    }
  
    try {
      let config = null;
      if (typeof window.saveECardConfig === 'function') {
          config = await window.saveECardConfig(true); 
      }
      
      if (!config) throw new Error("無法取得名片設定檔");

      // 動態取得 V1 預設圖片比例
      const imgInput = document.getElementById('ec-img-input');
      let rawUrl = imgInput ? imgInput.value : '';
      if (!rawUrl) {
          rawUrl = (typeof currentActiveCard !== 'undefined' && currentActiveCard && currentActiveCard['名片圖檔']) ? currentActiveCard['名片圖檔'] : 'https://images.unsplash.com/photo-1616628188550-808682f3926d?w=800&q=80';
      }
      const currentImgUrl = typeof window.getDirectImageUrl === 'function' ? window.getDirectImageUrl(rawUrl) : rawUrl;
      const detectedAr = (typeof window.getTrueAspectRatio === 'function') ? await window.getTrueAspectRatio(currentImgUrl) : "20:13";

      const flexMessageObj = typeof window.buildFlexMessageFromCard === 'function' ? window.buildFlexMessageFromCard(currentActiveCard, config, detectedAr) : null;
      if (!flexMessageObj) throw new Error("無法產生名片訊息");

      const altText = (config && config.altText) ? config.altText : '這是我的電子名片，請多指教';
      
      const myLiffId = (typeof LIFF_ID !== 'undefined') ? LIFF_ID : '2009367829-DLtYBDUm';
      const shareUrl = `https://liff.line.me/${myLiffId}?shareCardId=${currentActiveCard.rowId}`;
  
      if (typeof liff !== 'undefined' && liff.isApiAvailable('shareTargetPicker')) {
          try {
              if (typeof window.triggerFlexSharing === 'function') {
                  await window.triggerFlexSharing(flexMessageObj, altText);
              } else {
                  await liff.shareTargetPicker([{ type: "flex", altText: altText, contents: flexMessageObj }]);
              }
              if (typeof window.showToast === 'function') window.showToast('✅ 數位名片已發送！');
              setTimeout(()=>liff.closeWindow(), 1000);
          } catch(e) {
              if (typeof window.fallbackShare === 'function') window.fallbackShare(shareUrl, altText);
          }
      } else {
          if (typeof window.fallbackShare === 'function') window.fallbackShare(shareUrl, altText);
      }
    } catch(err) {
      alert("錯誤：" + err.message);
    } finally {
      if (btnShare) {
          btnShare.innerHTML = oriHtml;
          btnShare.classList.remove('pointer-events-none');
      }
    }
}
  
window.handleECardImageUpload = function(input, targetMode = 'ecard') {
    if (typeof window.openCropper === 'function') {
        window.openCropper(input, targetMode); // 傳入 targetMode 區分 V1 還是 v2logo
    }
}

// ... LINE VOOM 轉換器維持不變 ...
window.openVoomModal = function() {
    const m = document.getElementById('voom-modal');
    if (m) m.classList.remove('hidden');
};

window.closeVoomModal = function() {
    const m = document.getElementById('voom-modal');
    if (m) m.classList.add('hidden');
    const res = document.getElementById('voom-result-container');
    if (res) res.classList.add('hidden');
    const err = document.getElementById('voom-error-msg');
    if (err) err.classList.add('hidden');
    const input = document.getElementById('voom-url-input');
    if (input) input.value = '';
    const player = document.getElementById('voom-video-player');
    if (player) { player.pause(); player.src = ''; }
};

window.fetchVoomData = async function() {
    const urlInput = document.getElementById('voom-url-input');
    if (!urlInput) return;
    const url = urlInput.value.trim();
    
    const errEl = document.getElementById('voom-error-msg');
    const resEl = document.getElementById('voom-result-container');
    if (errEl) errEl.classList.add('hidden');
    if (resEl) resEl.classList.add('hidden');

    if (!url) {
        if (errEl) { errEl.textContent = '請貼上有效的 VOOM 網址'; errEl.classList.remove('hidden'); }
        return;
    }

    const btn = document.getElementById('btn-fetch-voom');
    const originalText = btn ? btn.innerHTML : '解析貼文';
    if (btn) {
        btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-[18px] align-middle">refresh</span> 解析中...';
        btn.classList.add('pointer-events-none', 'opacity-70');
    }

    try {
        if (typeof window.fetchAPI !== 'function') throw new Error("連線模組未載入");
        const data = await window.fetchAPI('getLineVoomMedia', { url: url }, false);
        
        if (data && data.type === 'VIDEO' && data.video && data.video.videoUrl) {
            const player = document.getElementById('voom-video-player');
            if (player) player.src = data.video.videoUrl;
            
            const applyBtn = document.getElementById('btn-apply-voom');
            if (applyBtn) {
                applyBtn.dataset.videoUrl = data.video.videoUrl;
                applyBtn.dataset.thumbUrl = data.video.thumbnailUrl || '';
            }
            if (resEl) resEl.classList.remove('hidden');
        } else {
            throw new Error("此貼文中找不到公開的影片，請確認網址正確或貼文為公開狀態。");
        }
    } catch (err) {
        if (errEl) {
            errEl.textContent = '❌ 解析失敗: ' + err.message;
            errEl.classList.remove('hidden');
        }
    } finally {
        if (btn) {
            btn.innerHTML = originalText;
            btn.classList.remove('pointer-events-none', 'opacity-70');
        }
    }
};

window.applyVoomVideo = function() {
    const applyBtn = document.getElementById('btn-apply-voom');
    if (!applyBtn) return;
    const vUrl = applyBtn.dataset.videoUrl;
    const tUrl = applyBtn.dataset.thumbUrl;

    const vInput = document.getElementById('ec-video-url');
    if (vInput) vInput.value = vUrl;
    
    const iInput = document.getElementById('ec-img-input');
    if (iInput && tUrl && tUrl !== '無縮圖') iInput.value = tUrl;
    
    window.closeVoomModal();
    if (typeof window.updateECardPreview === 'function') window.updateECardPreview();
    if (typeof window.showToast === 'function') window.showToast('✅ 影片已成功帶入');
};
