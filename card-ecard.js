/**
 * card-ecard.js
 * Version: v20260419_1530 (QQ 防爆分離版：完美修復切換失效，同步實時預覽與 R2 上傳)
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

window.toggleECardType = function(type) {
    currentEcardType = type;
    const typeEl = document.getElementById('ec-card-type');
    if (typeEl) typeEl.value = type;
    
    const tabImg = document.getElementById('ec-tab-image');
    const tabVid = document.getElementById('ec-tab-video');
    const tabV2 = document.getElementById('ec-tab-v2');
    
    const v1Fields = document.getElementById('ec-v1-fields');
    const v2Fields = document.getElementById('ec-v2-fields');
    const vidGroup = document.getElementById('ec-video-input-group');
    
    const inactiveClass = 'flex-1 py-2 text-sm font-bold rounded-lg text-slate-500 bg-transparent transition-all';
    const activeClass = 'flex-1 py-2 text-sm font-bold rounded-lg bg-white text-blue-600 shadow-sm transition-all';

    if (tabImg) tabImg.className = inactiveClass;
    if (tabVid) tabVid.className = inactiveClass;
    if (tabV2) tabV2.className = inactiveClass;

    if (type === 'v2') {
        if (tabV2) tabV2.className = activeClass;
        if (v1Fields) v1Fields.classList.add('hidden');
        if (v2Fields) v2Fields.classList.remove('hidden');
    } else {
        if (v1Fields) v1Fields.classList.remove('hidden');
        if (v2Fields) v2Fields.classList.add('hidden');
        
        if (type === 'video') {
          if (tabVid) tabVid.className = activeClass;
          if (vidGroup) vidGroup.classList.remove('hidden');
        } else {
          if (tabImg) tabImg.className = activeClass;
          if (vidGroup) vidGroup.classList.add('hidden');
        }
    }
    
    if (typeof window.updateECardPreview === 'function') window.updateECardPreview();
}

window.renderV2SocialUI = function() {
    const list = document.getElementById('ec-v2-social-list'); if(!list) return;
    list.innerHTML = '';
    window.v2Socials.forEach((s, idx) => {
        const div = document.createElement('div');
        div.className = "flex items-center gap-2 mb-2 bg-slate-50 p-2 rounded-xl border border-transparent hover:border-slate-200 transition-colors relative group";
        let opts = ['LINE', 'FB', 'IG', 'YT', 'TEL', 'WEB'].map(k => `<option value="${k}" ${s.type === k ? 'selected' : ''}>${k} 圖示</option>`).join('');
        div.innerHTML = `
          <select class="bg-white shadow-sm border-none text-[12px] font-bold py-2 px-1 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 shrink-0 w-[80px]" onchange="window.v2Socials[${idx}].type=this.value; window.updateECardPreview()">${opts}</select>
          <input type="text" class="flex-1 bg-white shadow-sm border-none rounded-lg text-[13px] font-mono outline-none px-3 py-2 placeholder-slate-400" placeholder="網址或電話" value="${s.u || s.url || ''}" oninput="window.v2Socials[${idx}].u=this.value; window.updateECardPreview()">
          <button onclick="window.v2Socials.splice(${idx},1); window.renderV2SocialUI(); window.updateECardPreview();" class="text-red-400 bg-red-50 w-9 h-9 rounded-xl flex items-center justify-center shrink-0 active:scale-90 transition-transform"><span class="material-symbols-outlined text-[18px]">delete</span></button>
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
        div.className = "flex flex-col gap-2 bg-slate-50 p-3 rounded-2xl relative border border-transparent hover:border-slate-200 transition-colors";
        div.innerHTML = `
          <div class="absolute top-3 right-3">
             <button onclick="window.v2Bars.splice(${idx},1); window.renderV2BarsUI(); window.updateECardPreview();" class="text-slate-400 hover:text-red-500 transition-colors"><span class="material-symbols-outlined text-[18px]">close</span></button>
          </div>
          <div class="flex items-center gap-2 pr-6">
              <span class="text-[12px] font-bold text-slate-400 shrink-0 w-8">文字</span>
              <input type="text" value="${bar.t || bar.text || ''}" class="custom-input !h-[36px] !bg-white shadow-sm !text-[13px] !rounded-lg flex-1" placeholder="按鈕文字" oninput="window.v2Bars[${idx}].t=this.value; window.updateECardPreview()">
          </div>
          <div class="flex items-center gap-2">
              <span class="text-[12px] font-bold text-slate-400 shrink-0 w-8">網址</span>
              <input type="text" value="${bar.u || bar.url || ''}" class="custom-input !h-[36px] !bg-white shadow-sm !text-[12px] font-mono !rounded-lg flex-1" placeholder="https://" oninput="window.v2Bars[${idx}].u=this.value; window.updateECardPreview()">
          </div>
        `;
        list.appendChild(div);
    });
}
window.addV2Bar = function() { window.v2Bars.push({t:"新按鈕", u:"https://line.me"}); window.renderV2BarsUI(); window.updateECardPreview(); }

window.escapeHtml = function(str) { 
    if (!str) return ''; 
    return String(str).replace(/[&<>]/g, function(m) { 
        if (m === '&') return '&amp;'; 
        if (m === '<') return '&lt;'; 
        if (m === '>') return '&gt;'; 
        return m; 
    }); 
}

window.updateECardPreview = function(forceBase64 = null, cropTarget = null) {
    const desktopContainer = document.getElementById('previewContainer');
    const mobileContainer = document.getElementById('mobilePreviewContainer');
    
    const title = document.getElementById('ec-title-input')?.value || '商務名片';
    const desc = document.getElementById('ec-desc-input')?.value || '';
    
    let htmlContent = '';

    if (currentEcardType === 'v2') {
        let logo = document.getElementById('ec-v2-logo-url')?.value || SVG_AVATAR;
        if (forceBase64 && cropTarget === 'v2logo') logo = forceBase64;
        
        const bgStart = document.getElementById('ec-v2-bg-start')?.value || '#57142b';
        const bgEnd = document.getElementById('ec-v2-bg-end')?.value || '#46250c';
        
        let socialHtml = window.v2Socials.filter(s => s.type).map(s => `<div class="bg-white/20 p-1.5 rounded-full shadow-sm"><img src="${V2_ICONS[s.type] || V2_ICONS['WEB']}" style="width:32px; height:32px; border-radius:50%;"></div>`).join('');
        let barsHtml = window.v2Bars.filter(b => b.t || b.text).map(b => `<div class="block bg-white text-[#333] py-3 rounded-full text-sm font-bold mb-3 shadow-md">${window.escapeHtml(b.t || b.text)}</div>`).join('');

        htmlContent = `
            <div class="p-6 text-white text-center min-h-[400px] flex flex-col items-center" style="background: linear-gradient(135deg, ${bgStart}, ${bgEnd});">
                <img src="${logo}" class="w-20 h-20 rounded-full mx-auto object-cover border-4 border-white/20 mb-4 shadow-lg" onerror="this.onerror=null; this.src='${SVG_AVATAR}'">
                <div class="font-extrabold text-[20px] tracking-tight">${window.escapeHtml(title)}</div>
                <div class="text-xs opacity-90 mt-2 leading-relaxed max-w-[250px] whitespace-pre-wrap">${window.escapeHtml(desc)}</div>
                <div class="flex justify-center gap-3 my-6 flex-wrap">${socialHtml}</div>
                <div class="w-full max-w-[260px]">${barsHtml}</div>
            </div>
        `;
    } else {
        let imgUrl = document.getElementById('ec-img-input')?.value;
        if (forceBase64 && cropTarget === 'ecard') imgUrl = forceBase64;
        if (!imgUrl) imgUrl = SVG_COVER;

        let buttonsHtml = '';
        for (let i = 1; i <= 4; i++) {
            const label = document.getElementById(`ec-btn${i}-label`)?.value;
            const color = document.getElementById(`ec-btn${i}-color`)?.value;
            if (label) {
                buttonsHtml += `<div class="block py-3 rounded-xl text-white text-center text-[14px] font-bold mb-2 shadow-sm" style="background:${color}">${window.escapeHtml(label)}</div>`;
            }
        }
        
        let heroContent = `<img src="${imgUrl}" class="w-full aspect-[20/13] object-cover" onerror="this.onerror=null; this.src='${SVG_COVER}'">`;
        if (currentEcardType === 'video') {
            heroContent = `
            <div class="relative w-full aspect-[20/13] bg-black flex items-center justify-center overflow-hidden">
               <img src="${imgUrl}" class="absolute inset-0 w-full h-full object-cover opacity-50" onerror="this.onerror=null; this.src='${SVG_COVER}'">
               <span class="material-symbols-outlined text-white text-5xl z-10">play_circle</span>
            </div>`;
        }

        htmlContent = `
            <div class="bg-white overflow-hidden pb-4">
                <div class="relative">${heroContent}<div class="absolute top-2 right-2 bg-red-500 text-white text-[9px] px-2 py-1 rounded-full font-bold">分享</div></div>
                <div class="p-4 text-center">
                    <div class="font-black text-[18px] text-slate-800">${window.escapeHtml(title)}</div>
                    <div class="text-[12px] text-slate-500 mt-1.5 font-medium leading-relaxed whitespace-pre-wrap">${window.escapeHtml(desc)}</div>
                </div>
                <div class="px-4">${buttonsHtml}</div>
            </div>
        `;
    }
    
    if (desktopContainer) desktopContainer.innerHTML = htmlContent;
    if (mobileContainer) mobileContainer.innerHTML = htmlContent;
}

window.openECardGenerator = function() {
    try {
        if (!currentActiveCard) return;
        const c = currentActiveCard;
      
        let savedConfig = null;
        if (c['自訂名片設定']) { try { savedConfig = JSON.parse(c['自訂名片設定']); } catch(e){} }
      
        const safeSetValue = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };

        // 智能萃取聯絡資訊
        let autoExtractedBtns = [];
        let autoExtractedSocials = [];

        let p1 = c['手機號碼'] || c['Mobile'];
        if (p1) { 
            let phone = String(p1).split(',')[0].replace(/[^\d+]/g, ''); 
            if (phone.startsWith('886')) phone = '0' + phone.substring(3); 
            if (phone) {
                autoExtractedBtns.push({ l: '撥打手機', u: `tel:${phone}`, c: '#06C755' }); 
                autoExtractedSocials.push({ type: 'TEL', u: `tel:${phone}` });
            }
        }
        let p2 = c['公司電話'] || c['Tel'];
        if (p2) { 
            let tel = String(p2).split(',')[0].replace(/[^\d+]/g, ''); 
            if (tel.startsWith('886')) tel = '0' + tel.substring(3); 
            if (tel) autoExtractedBtns.push({ l: '撥打電話', u: `tel:${tel}`, c: '#06C755' }); 
        }
        
        let p3 = c['電子郵件'] || c['Email'];
        if (p3) { 
            let email = String(p3).split(/[\s,]+/)[0]; 
            if (email.includes('@')) autoExtractedBtns.push({ l: '發送信箱', u: `mailto:${email}`, c: '#06C755' }); 
        }
        
        let p4 = c['公司地址'] || c['Address'];
        if (p4) autoExtractedBtns.push({ l: 'Google 導航', u: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p4.split(',')[0])}`, c: '#06C755' });
        
        let p5 = c['公司網址'] || c['Website'];
        if (p5) { 
            let wUrl = String(p5).trim(); 
            if (wUrl && !wUrl.startsWith('http')) wUrl = 'https://' + wUrl; 
            if (wUrl) {
                if (autoExtractedBtns.length < 4) autoExtractedBtns.push({ l: '公司網站', u: wUrl, c: '#06C755' }); 
                if (wUrl.includes('facebook.com') || wUrl.includes('fb.')) autoExtractedSocials.push({ type: 'FB', u: wUrl });
                else if (wUrl.includes('instagram.com') || wUrl.includes('instagr.am')) autoExtractedSocials.push({ type: 'IG', u: wUrl });
                else if (wUrl.includes('youtube.com') || wUrl.includes('youtu.be')) autoExtractedSocials.push({ type: 'YT', u: wUrl });
                else autoExtractedSocials.push({ type: 'WEB', u: wUrl });
            }
        }
        
        let p6 = c['社群帳號'] || c['SocialMedia'];
        if (p6) {
            let sUrls = String(p6).split(/[\s,\n]+/);
            sUrls.forEach(u => {
                let su = u.trim();
                if (!su) return;
                if (!su.startsWith('http') && su.includes('.')) su = 'https://' + su;
                if (su.includes('line.me') || su.includes('line://')) autoExtractedSocials.push({ type: 'LINE', u: su });
                else if (su.includes('facebook.com') || su.includes('fb.')) autoExtractedSocials.push({ type: 'FB', u: su });
                else if (su.includes('instagram.com') || su.includes('instagr.am') || su.includes('ig.')) autoExtractedSocials.push({ type: 'IG', u: su });
                else if (su.includes('youtube.com') || su.includes('youtu.be')) autoExtractedSocials.push({ type: 'YT', u: su });
                else if (su.startsWith('http')) autoExtractedSocials.push({ type: 'WEB', u: su });
            });
        }

        autoExtractedSocials = autoExtractedSocials.filter((social, index, self) => index === self.findIndex((t) => t.type === social.type));

        const listEl = document.getElementById('ec-btn-list');
        if (listEl) {
            listEl.innerHTML = '';
            let sBtns = (savedConfig && savedConfig.buttons && savedConfig.buttons.length > 0) ? savedConfig.buttons : autoExtractedBtns;
            for(let i=1; i<=4; i++) {
                const b = sBtns[i-1] || {l:'', u:'', c:'#06C755'};
                listEl.innerHTML += `
                <div class="flex items-center gap-3 bg-slate-50 p-2.5 rounded-2xl">
                  <input type="color" id="ec-btn${i}-color" value="${b.c || '#06C755'}" class="w-10 h-10 rounded-xl cursor-pointer border-none bg-transparent shrink-0" oninput="window.updateECardPreview()">
                  <div class="flex flex-col flex-1 gap-1">
                    <input type="text" id="ec-btn${i}-label" class="w-full bg-transparent border-none text-[14px] font-bold outline-none px-2 py-1 placeholder-slate-400 focus:ring-0" placeholder="按鈕文字 (選填)" value="${b.l}" oninput="window.updateECardPreview()">
                    <input type="text" id="ec-btn${i}-url" class="w-full bg-transparent border-none text-[13px] text-slate-500 font-medium outline-none px-2 py-1 placeholder-slate-400 focus:ring-0" placeholder="連結網址 (選填)" value="${b.u}" oninput="window.updateECardPreview()">
                  </div>
                </div>`;
            }
        }

        if (savedConfig && savedConfig.hasOwnProperty('v2Socials')) window.v2Socials = savedConfig.v2Socials;
        else window.v2Socials = autoExtractedSocials;
        
        if (savedConfig && savedConfig.v2Bars && savedConfig.v2Bars.length > 0) window.v2Bars = savedConfig.v2Bars;
        else window.v2Bars = autoExtractedBtns.length > 0 ? autoExtractedBtns.map(b => ({ t: b.l, u: b.u })) : [{t:"查看更多", u:"https://line.me"}];

        window.renderV2SocialUI();
        window.renderV2BarsUI();

        if (savedConfig) {
          if (savedConfig.title) savedConfig.title = savedConfig.title.replace(/Not provided/gi, '').replace(/未提供/g, '').trim();
          if (savedConfig.desc) savedConfig.desc = savedConfig.desc.replace(/Not provided/gi, '').replace(/未提供/g, '').trim();
          if (!savedConfig.title) savedConfig.title = [c['公司名稱'], c['姓名']].filter(Boolean).join(' - ') || '商務名片';

          safeSetValue('ec-video-url', savedConfig.videoUrl || '');
          safeSetValue('ec-img-input', savedConfig.imgUrl || '');
          safeSetValue('ec-img-action-url', savedConfig.imgActionUrl || `https://liff.line.me/${LIFF_ID}`);
          safeSetValue('ec-title-input', savedConfig.title || '');
          safeSetValue('ec-desc-input', savedConfig.desc || '');
          safeSetValue('ec-alt-text-input', savedConfig.altText || '這是我的電子名片，請多指教');
          safeSetValue('ec-v2-logo-url', savedConfig.v2Logo || '');
          safeSetValue('ec-v2-bg-start', savedConfig.v2BgStart || '#57142b');
          safeSetValue('ec-v2-bg-end',   savedConfig.v2BgEnd || '#46250c');
          
          const isPublicEl = document.getElementById('ec-isPublic-input');
          if (isPublicEl) isPublicEl.checked = !(savedConfig.isPrivate === true);
          
          window.toggleECardType(savedConfig.cardType || 'image');
        } else {
          safeSetValue('ec-video-url', '');
          safeSetValue('ec-img-input', c['名片圖檔'] && c['名片圖檔'].startsWith('http') ? c['名片圖檔'] : '');
          safeSetValue('ec-img-action-url', `https://liff.line.me/${LIFF_ID}`);
          safeSetValue('ec-title-input', [c['公司名稱'], c['姓名']].filter(Boolean).join(' - ') || '商務名片');
          safeSetValue('ec-desc-input', c['服務項目/品牌標語'] || '');
          safeSetValue('ec-alt-text-input', '這是我的電子名片，請多指教');
          safeSetValue('ec-v2-logo-url', '');
          safeSetValue('ec-v2-bg-start', '#57142b');
          safeSetValue('ec-v2-bg-end', '#46250c');
          
          const isPublicEl = document.getElementById('ec-isPublic-input');
          if (isPublicEl) isPublicEl.checked = true;
          
          window.toggleECardType('image');
        }
        
        document.getElementById('ecard-generator-modal')?.classList.remove('hidden');
        window.updateECardPreview();
        
    } catch (err) {
        alert("開啟編輯器時發生系統異常：" + err.message);
    }
}
  
window.closeECardGenerator = function() { 
    document.getElementById('ecard-generator-modal')?.classList.add('hidden'); 
}

window.saveECardConfig = async function(isSilent = false) {
    if(!currentActiveCard) return;
    const btn = document.getElementById('btn-save-ecard');
    const originalText = btn ? btn.innerHTML : '';
    
    if (!isSilent && btn) {
        btn.innerHTML = '<span class="material-symbols-outlined text-[16px] animate-spin">refresh</span>';
        btn.classList.add('pointer-events-none', 'opacity-50');
    }
  
    const getVal = (id, def) => { const el = document.getElementById(id); return el ? el.value : def; };
    const isPublicEl = document.getElementById('ec-isPublic-input');

    let imgUrl = getVal('ec-img-input', '');
    let logoUrl = getVal('ec-v2-logo-url', '');

    try {
        // ⭐ R2 圖床極速寫入
        if (imgUrl.startsWith('data:image') && imgUrl !== SVG_COVER && imgUrl !== SVG_AVATAR) {
            imgUrl = await window.fetchAPI('uploadImage', { base64Image: imgUrl });
            document.getElementById('ec-img-input').value = imgUrl;
        }
        if (logoUrl.startsWith('data:image') && logoUrl !== SVG_COVER && logoUrl !== SVG_AVATAR) {
            logoUrl = await window.fetchAPI('uploadImage', { base64Image: logoUrl });
            document.getElementById('ec-v2-logo-url').value = logoUrl;
        }
    } catch(e) {
        if(!isSilent) window.showToast('⚠️ 圖片上傳失敗', true);
    }

    const config = {
      cardType: currentEcardType,
      videoUrl: getVal('ec-video-url', '').trim(),
      imgUrl: imgUrl,
      imgActionUrl: getVal('ec-img-action-url', ''),
      title: getVal('ec-title-input', ''),
      desc: getVal('ec-desc-input', ''),
      altText: getVal('ec-alt-text-input', '這是我的電子名片，請多指教').trim() || '這是我的電子名片，請多指教',
      isPrivate: isPublicEl ? !isPublicEl.checked : false,
      buttons: [],
      v2Logo: logoUrl,
      v2BgStart: getVal('ec-v2-bg-start', '#57142b'),
      v2BgEnd: getVal('ec-v2-bg-end', '#46250c'),
      v2Socials: window.v2Socials,
      v2Bars: window.v2Bars
    };
    
    for(let i=1; i<=4; i++) {
      const l = getVal(`ec-btn${i}-label`, '');
      const u = getVal(`ec-btn${i}-url`, '');
      const c = getVal(`ec-btn${i}-color`, '#06C755');
      if(l && u) config.buttons.push({l, u, c});
    }
  
    try {
      await window.fetchAPI('updateECardConfig', { 
          rowId: currentActiveCard.rowId, 
          targetVerifyUid: currentActiveCard['LINE ID'] || currentActiveCard.userId || '',
          config: config 
      }, true);
      
      currentActiveCard['自訂名片設定'] = JSON.stringify(config); 
      if(config.imgUrl && config.imgUrl.startsWith('http')) currentActiveCard['名片圖檔'] = config.imgUrl; 
      if(!isSilent) window.showToast('✅ 名片設定已儲存');
      window.updateECardPreview();
    } catch(e) {
      if(!isSilent) window.showToast('⚠️ 儲存失敗', true);
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
    window.showToast(state ? "✅ 已開放 AI 媒合與搜尋" : "🔒 隱私模式已啟動 (不參與配對)");
    await window.saveECardConfig(true); 
};

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
            { "type": "box", "layout": "vertical", "alignItems": "center", "margin": "sm", "contents": [{ "type": "text", "text": title, "weight": "bold", "size": "lg", "color": "#ffffff", "align": "center", "adjustMode": "shrink-to-fit" }], "paddingAll": "0px" }
        ];

        if (desc) bodyContents[1].contents.push({ "type": "text", "text": desc, "size": "sm", "color": "#ffffff", "align": "center", "wrap": true, "margin": "sm" });

        if (config.v2Socials && config.v2Socials.length > 0) {
            bodyContents.push({
                "type": "box", "layout": "horizontal", "justifyContent": "center", "spacing": "xl", "paddingTop": "xs", "paddingBottom": "xs", "margin": "lg",
                "contents": config.v2Socials.filter(s => s.type).map(s => ({ "type": "image", "url": V2_ICONS[s.type] || V2_ICONS['WEB'], "size": "70px", "aspectRatio": "1:1", "action": { "type": "uri", "uri": sanitizeUri(s.u || s.url) } }))
            });
        }

        if (config.v2Bars && config.v2Bars.length > 0) {
            bodyContents.push({
                "type": "box", "layout": "vertical", "spacing": "none", "margin": "lg", "alignItems": "center",
                "contents": config.v2Bars.filter(b => b.t || b.text).map(b => ({
                    "type": "box", "layout": "vertical", "backgroundColor": "#ffffff", "cornerRadius": "100px", "paddingAll": "md", "width": "260px", "margin": "lg", "alignItems": "center",
                    "contents": [{ "type": "text", "text": b.t || b.text || 'Link', "color": "#333333", "align": "center", "weight": "bold", "size": "sm", "adjustMode": "shrink-to-fit" }],
                    "action": { "type": "uri", "uri": sanitizeUri(b.u || b.url) }
                }))
            });
        }
        bodyContents.push({ "type": "box", "layout": "vertical", "height": "10px", "contents": [] });

        return {
            "type": "bubble", "size": "mega",
            "header": { "type": "box", "layout": "horizontal", "justifyContent": "flex-end", "paddingAll": "8px", "contents": [{ "type": "box", "layout": "vertical", "justifyContent": "center", "backgroundColor": "#FF0000", "width": "65px", "height": "25px", "cornerRadius": "25px", "contents": [{ "type": "text", "text": "分享", "weight": "bold", "align": "center", "color": "#FFFFFF", "size": "xs" }], "action": { "type": "uri", "label": "share", "uri": badgeUrl } }] },
            "body": { "type": "box", "layout": "vertical", "paddingAll": "0px", "contents": bodyContents, "alignItems": "center", "background": { "type": "linearGradient", "angle": "88deg", "startColor": bgStart, "endColor": bgEnd } }
        };
    }

    let imgUrl = config?.imgUrl || card['名片圖檔'];
    if (!imgUrl || !imgUrl.startsWith('http')) imgUrl = 'https://images.unsplash.com/photo-1616628188550-808682f3926d?w=800&q=80';
    imgUrl = window.getDirectImageUrl(imgUrl);
    
    let safeImgActionUrl = sanitizeUri(config?.imgActionUrl || `https://liff.line.me/${LIFF_ID}`);
    let buttons = config?.buttons || [];
    let title = config?.title || '商務名片';
    let desc = config?.desc || ' ';

    const btnContents = buttons.filter(b => b.l && b.u).map(b => ({ "type": "button", "style": "primary", "color": b.c || '#06C755', "height": "sm", "margin": "sm", "action": { "type": "uri", "label": b.l.substring(0, 20), "uri": sanitizeUri(b.u).substring(0, 1000) } }));
  
    const headerBlock = { "type": "box", "layout": "horizontal", "justifyContent": "flex-end", "paddingAll": "8px", "contents": [{ "type": "box", "layout": "vertical", "justifyContent": "center", "backgroundColor": "#FF0000", "width": "65px", "height": "25px", "cornerRadius": "25px", "contents": [{ "type": "text", "text": "分享", "weight": "bold", "align": "center", "color": "#FFFFFF", "size": "xs" }], "action": { "type": "uri", "label": "share", "uri": badgeUrl } }] };
  
    let heroBlock;
    if (cardType === 'video' && config?.videoUrl && config.videoUrl.match(/^https:\/\//i)) {
        heroBlock = { "type": "video", "url": config.videoUrl, "previewUrl": imgUrl, "altContent": { "type": "image", "size": "full", "aspectRatio": dynamicAr || "20:13", "aspectMode": "cover", "url": imgUrl }, "aspectRatio": dynamicAr || "20:13" };
    } else {
        heroBlock = { "type": "image", "url": imgUrl, "size": "full", "aspectRatio": dynamicAr || "20:13", "aspectMode": "cover", "action": { "type": "uri", "label": "cover", "uri": safeImgActionUrl.substring(0, 1000) } };
    }
  
    const flexContents = {
        "type": "bubble", "size": "mega", "header": headerBlock, "hero": heroBlock,
        "body": { "type": "box", "layout": "vertical", "paddingAll": "0px", "contents": [{ "type": "box", "layout": "vertical", "paddingAll": "10px", "contents": [{ "type": "text", "text": title, "weight": "bold", "size": "xl", "align": "center", "wrap": true }, { "type": "text", "text": desc, "size": "sm", "margin": "md", "color": "#666666", "wrap": true }] }] }
    };
    if (btnContents.length > 0) flexContents.footer = { "type": "box", "layout": "vertical", "spacing": "sm", "paddingAll": "10px", "paddingTop": "0px", "backgroundColor": "#FFFFFF", "contents": btnContents };
    return flexContents;
}

window.shareECardToLine = async function() {
    const btnShare = document.getElementById('btn-share-line');
    let oriHtml = '';
    if (btnShare) {
        oriHtml = btnShare.innerHTML;
        btnShare.innerHTML = '<span class="material-symbols-outlined animate-spin text-[18px]">refresh</span> 發送中...';
        btnShare.classList.add('pointer-events-none');
    }
  
    try {
      const config = await window.saveECardConfig(true); 
      if (!config) throw new Error("無法取得名片設定檔");

      const imgInput = document.getElementById('ec-img-input');
      let rawUrl = imgInput ? imgInput.value : '';
      if (!rawUrl) rawUrl = currentActiveCard['名片圖檔'] || 'https://images.unsplash.com/photo-1616628188550-808682f3926d?w=800&q=80';
      
      const currentImgUrl = window.getDirectImageUrl(rawUrl);
      const detectedAr = await window.getTrueAspectRatio(currentImgUrl);

      const flexMessageObj = window.buildFlexMessageFromCard(currentActiveCard, config, detectedAr);
      const altText = config.altText || '這是我的電子名片，請多指教';
      const shareUrl = `https://liff.line.me/${LIFF_ID}?shareCardId=${currentActiveCard.rowId}`;
  
      if (liff.isApiAvailable('shareTargetPicker')) {
          try {
              if (typeof window.triggerFlexSharing === 'function') await window.triggerFlexSharing(flexMessageObj, altText);
              else await liff.shareTargetPicker([{ type: "flex", altText: altText, contents: flexMessageObj }]);
              window.showToast('✅ 數位名片已發送！');
              setTimeout(()=>liff.closeWindow(), 1000);
          } catch(e) { window.fallbackShare(shareUrl, altText); }
      } else {
          window.fallbackShare(shareUrl, altText);
      }
    } catch(err) {
      alert("錯誤：" + err.message);
    } finally {
      if (btnShare) { btnShare.innerHTML = oriHtml; btnShare.classList.remove('pointer-events-none'); }
    }
}

// VOOM 轉換器邏輯
window.openVoomModal = function() { document.getElementById('voomModal')?.classList.remove('hidden'); };
window.closeVoomModal = function() { document.getElementById('voomModal')?.classList.add('hidden'); };

window.fetchVoomData = async function() {
    const url = document.getElementById('voomUrl')?.value.trim();
    if(!url) return window.showToast('請輸入 VOOM 網址', true);
    
    const btn = document.getElementById('fetchVoomBtn');
    const oriTxt = btn ? btn.innerText : '';
    if (btn) { btn.innerHTML = '<span class="material-symbols-outlined animate-spin align-middle">refresh</span>'; btn.classList.add('opacity-50', 'pointer-events-none'); }
    
    try {
        const data = await window.fetchAPI('getLineVoomMedia', { url: url }, false);
        if (data && data.video && data.video.videoUrl) {
            document.getElementById('voomPlayer').src = data.video.videoUrl;
            document.getElementById('applyVoomBtn').dataset.videoUrl = data.video.videoUrl;
            document.getElementById('applyVoomBtn').dataset.thumb
