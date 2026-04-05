/**
 * card-ecard.js
 * Version: v2.1.1 (QQ 擴充版：支援自訂 LINE 顯示文字 / altText)
 */

window.toggleECardType = function(type) {
    const typeEl = document.getElementById('ec-card-type');
    if (typeEl) typeEl.value = type;
    
    const tabImg = document.getElementById('ec-tab-image');
    const tabVid = document.getElementById('ec-tab-video');
    const vidGroup = document.getElementById('ec-video-input-group');
    const uploadLabel = document.getElementById('ec-upload-label');
    const uploadHint = document.getElementById('ec-upload-hint');
    
    if (type === 'video') {
      if (tabImg) tabImg.className = 'flex-1 py-2 rounded-lg text-[14px] font-bold text-slate-500 transition-all hover:text-slate-700 bg-transparent';
      if (tabVid) tabVid.className = 'flex-1 py-2 rounded-lg text-[14px] font-bold bg-white text-primary shadow-sm transition-all';
      if (vidGroup) vidGroup.classList.remove('hidden');
      if (uploadLabel) uploadLabel.innerHTML = '點擊上傳封面圖縮圖 <span class="ml-1.5 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[11px] font-bold tracking-wider">選填</span>';
      if (uploadHint) uploadHint.innerText = '※ 影片必須有封面縮圖，若未上傳系統將自動代入名片圖或預設底圖。';
    } else {
      if (tabImg) tabImg.className = 'flex-1 py-2 rounded-lg text-[14px] font-bold bg-white text-primary shadow-sm transition-all';
      if (tabVid) tabVid.className = 'flex-1 py-2 rounded-lg text-[14px] font-bold text-slate-500 transition-all hover:text-slate-700 bg-transparent';
      if (vidGroup) vidGroup.classList.add('hidden');
      if (uploadLabel) uploadLabel.innerHTML = '點擊圖片變更 <span class="ml-1.5 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[11px] font-bold tracking-wider">選填</span>';
      if (uploadHint) uploadHint.innerText = '※ 若未上傳，系統將智能代入您原先的名片圖檔作為底圖。';
    }
    
    if (typeof window.updateECardPreview === 'function') window.updateECardPreview();
}

window.buildFlexMessageFromCard = function(card, config, dynamicAr = null) {
    let imgUrl, imgActionUrl, imgSize, aspectMode, ar, title, desc, buttons = [];
    let cardType = config && config.cardType ? config.cardType : 'image';
    let videoUrl = config && config.videoUrl ? config.videoUrl : '';
    let titleAlign = config && config.titleAlign ? config.titleAlign : 'center';
    let rawImg = (config && config.imgUrl) ? config.imgUrl : (card && card['名片圖檔'] ? card['名片圖檔'] : '');
    
    if (!rawImg || typeof rawImg !== 'string' || !rawImg.startsWith('http') || rawImg === '無圖檔' || rawImg === '圖片儲存失敗') {
        rawImg = 'https://images.unsplash.com/photo-1616628188550-808682f3926d?w=800&q=80'; 
    }
    
    imgUrl = typeof window.getDirectImageUrl === 'function' ? window.getDirectImageUrl(rawImg) : rawImg;
    
    const myLiffId = (typeof LIFF_ID !== 'undefined') ? LIFF_ID : '2009367829-DLtYBDUm';

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
  
    const badgeUrl = `https://liff.line.me/${myLiffId}?shareCardId=${card.rowId}`;
  
    const headerBlock = {
        "type": "box",
        "layout": "horizontal",
        "justifyContent": "flex-end",
        "paddingAll": "8px",
        "contents": [
            {
                "type": "box",
                "layout": "vertical",
                "justifyContent": "center",
                "backgroundColor": "#FF0000",
                "width": "65px",
                "height": "25px",
                "cornerRadius": "25px",
                "contents": [
                    {
                        "type": "text",
                        "text": "分享",
                        "weight": "bold",
                        "align": "center",
                        "color": "#FFFFFF",
                        "size": "xs"
                    }
                ],
                "action": {
                    "type": "uri",
                    "label": "share",
                    "uri": badgeUrl
                }
            }
        ]
    };
  
    let heroBlock;
    if (cardType === 'video' && videoUrl && videoUrl.match(/^https:\/\//i)) {
        heroBlock = {
            "type": "video",
            "url": videoUrl,
            "previewUrl": imgUrl,
            "altContent": {
                "type": "image",
                "size": "full",
                "aspectRatio": ar,
                "aspectMode": aspectMode,
                "url": imgUrl
            },
            "aspectRatio": ar
        };
    } else {
        heroBlock = {
            "type": "image",
            "url": imgUrl,
            "size": "full",
            "aspectRatio": ar,
            "aspectMode": aspectMode,
            "action": { "type": "uri", "label": "cover", "uri": safeImgActionUrl.substring(0, 1000) }
        };
    }
  
    const flexContents = {
        "type": "bubble", 
        "size": imgSize,
        "header": headerBlock,
        "hero": heroBlock,
        "body": {
            "type": "box", "layout": "vertical", "paddingAll": "0px",
            "contents": [
                { 
                    "type": "box", "layout": "vertical", "paddingAll": "10px", 
                    "contents": [ 
                        { "type": "text", "text": title, "weight": "bold", "size": "xl", "align": titleAlign, "wrap": true }, 
                        { "type": "text", "text": desc, "size": "sm", "margin": "md", "color": "#666666", "wrap": true } 
                    ] 
                }
            ]
        }
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

        const listEl = document.getElementById('ec-btn-list');
        if (listEl) {
            listEl.innerHTML = '';
            const sBtns = savedConfig ? savedConfig.buttons : [];
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
          // ⭐ 帶入儲存的 altText
          safeSetValue('ec-alt-text-input', savedConfig.altText || '這是我的電子名片，請多指教');
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
          // ⭐ 預設 altText
          safeSetValue('ec-alt-text-input', '這是我的電子名片，請多指教');
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

window.updateECardPreview = function(forceBase64 = null) {
    const cardTypeEl = document.getElementById('ec-card-type');
    const cardType = cardTypeEl ? cardTypeEl.value : 'image';
    
    const videoUrlEl = document.getElementById('ec-video-url');
    const videoUrl = videoUrlEl ? videoUrlEl.value.trim() : '';
    
    const arSettingEl = document.getElementById('ec-aspect-ratio');
    const arSetting = arSettingEl ? arSettingEl.value : 'auto';
  
    const imgInputEl = document.getElementById('ec-img-input');
    let rawUrl = imgInputEl ? imgInputEl.value : '';

    let displayUrl = forceBase64; 

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
    
    const heroEl = document.getElementById('preview-ec-hero');
    const imgEl = document.getElementById('preview-ec-img');
    const videoEl = document.getElementById('preview-ec-video');
    const playIcon = document.getElementById('preview-ec-play-icon');
    const bubbleEl = document.getElementById('preview-ec-bubble');
    
    if (!heroEl || !imgEl || !bubbleEl) return;

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
  
    const titleAlignEl = document.getElementById('ec-title-align');
    const titleAlign = titleAlignEl ? titleAlignEl.value : 'center';
    const cssAlign = titleAlign === 'start' ? 'left' : (titleAlign === 'end' ? 'right' : 'center');
    
    const previewTitleEl = document.getElementById('preview-ec-title');
    if (previewTitleEl) {
        previewTitleEl.style.textAlign = cssAlign;
        const titleInputEl = document.getElementById('ec-title-input');
        previewTitleEl.innerText = (titleInputEl ? titleInputEl.value : '') || '請輸入標題';
    }

    const previewDescEl = document.getElementById('preview-ec-desc');
    if (previewDescEl) {
        const descInputEl = document.getElementById('ec-desc-input');
        previewDescEl.innerText = descInputEl ? descInputEl.value : '';
    }
    
    const btnContainer = document.getElementById('preview-ec-buttons');
    if (btnContainer) {
        btnContainer.innerHTML = '';
        for(let i=1; i<=4; i++) {
          const labelEl = document.getElementById(`ec-btn${i}-label`);
          const urlEl = document.getElementById(`ec-btn${i}-url`);
          const colorEl = document.getElementById(`ec-btn${i}-color`);
          
          const label = labelEl ? labelEl.value : '';
          const url = urlEl ? urlEl.value : '';
          const color = colorEl ? colorEl.value : '#06C755';

          if(label && url) {
            btnContainer.innerHTML += `<div class="w-full text-white text-[13px] font-bold text-center py-2.5 rounded-lg mb-2 shadow-sm" style="background-color: ${color}">${label}</div>`;
          }
        }
    }
    
    if (bubbleEl) {
        let existingHeader = bubbleEl.querySelector('.preview-header');
        if (!existingHeader) {
            const headerHTML = `<div class="preview-header w-full flex justify-end p-2 bg-white pb-1"><div class="preview-share-btn bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-sm tracking-widest">分享</div></div>`;
            bubbleEl.insertAdjacentHTML('afterbegin', headerHTML);
        }
        
        const titleDescContainer = previewTitleEl?.parentElement;
        if (titleDescContainer) {
            titleDescContainer.className = "px-3.5 py-4 text-center bg-white relative";
        }
        if (btnContainer) {
            btnContainer.className = "px-3.5 pb-4 pt-0 bg-white space-y-2";
        }

        const absoluteShare = bubbleEl.querySelector('.absolute.top-4.right-4.bg-red-500');
        if (absoluteShare) absoluteShare.remove();
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
  
    const imgInputEl = document.getElementById('ec-img-input');
    const imgUrl = imgInputEl ? imgInputEl.value.trim() : '';
    if (imgUrl && !imgUrl.match(/^https?:\/\//i)) {
        errors.push("❌ 【封面圖片網址】若要填寫，必須以 http:// 或 https:// 開頭。");
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
      // ⭐ 儲存自訂的 altText
      altText: getVal('ec-alt-text-input', '這是我的電子名片，請多指教').trim() || '這是我的電子名片，請多指教',
      buttons: []
    };
    
    for(let i=1; i<=4; i++) {
      const l = getVal(`ec-btn${i}-label`, '');
      const u = getVal(`ec-btn${i}-url`, '');
      const c = getVal(`ec-btn${i}-color`, '#06C755');
      if(l && u) config.buttons.push({l, u, c});
    }
  
    try {
      if (typeof window.fetchAPI === 'function') {
         await window.fetchAPI('updateECardConfig', { rowId: currentActiveCard.rowId, config: config }, true);
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
      const imgInput = document.getElementById('ec-img-input');
      let rawUrl = imgInput ? imgInput.value : '';
      if (!rawUrl) {
          rawUrl = (typeof currentActiveCard !== 'undefined' && currentActiveCard && currentActiveCard['名片圖檔']) ? currentActiveCard['名片圖檔'] : 'https://images.unsplash.com/photo-1616628188550-808682f3926d?w=800&q=80';
      }
      const currentImgUrl = typeof window.getDirectImageUrl === 'function' ? window.getDirectImageUrl(rawUrl) : rawUrl;
      const detectedAr = (typeof window.getTrueAspectRatio === 'function') ? await window.getTrueAspectRatio(currentImgUrl) : "20:13";
  
      let config = null;
      if (typeof window.saveECardConfig === 'function') {
          config = await window.saveECardConfig(true); 
      }
      
      if (!config) throw new Error("無法取得名片設定檔");

      const flexMessageObj = typeof window.buildFlexMessageFromCard === 'function' ? window.buildFlexMessageFromCard(currentActiveCard, config, detectedAr) : null;
      if (!flexMessageObj) throw new Error("無法產生名片訊息");

      // ⭐ 直接從 config 中提取剛剛儲存的 altText 作為 LINE 聊天室的提示文字
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
  
window.handleECardImageUpload = function(input) {
    if (typeof window.openCropper === 'function') {
        window.openCropper(input, 'ecard');
    }
}

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
