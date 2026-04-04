/**
 * card-ecard.js
 * Version: v3.1.0 (數位名片排版編輯器專用)
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
      if (uploadLabel) uploadLabel.innerHTML = '點擊圖片更換 <span class="ml-1.5 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[11px] font-bold tracking-wider">選填</span>';
      if (uploadHint) uploadHint.innerText = '※ 若未上傳，系統將智能代入您原先的名片圖檔作為底圖。';
    }
    
    window.updateECardPreview();
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
  
    const badgeUrl = `https://liff.line.me/${myLiffId}/card.html?shareCardId=${card.rowId}`;
    const headerBlock = {
        "type": "box", "layout": "horizontal", "justifyContent": "flex-end", "paddingAll": "7px",
        "contents": [ { "type": "box", "layout": "vertical", "justifyContent": "center", "backgroundColor": "#FF0000", "width": "65px", "height": "25px", "cornerRadius": "25px", "contents": [ { "type": "text", "text": "分享", "weight": "bold", "align": "center", "color": "#FFFFFF", "size": "xs" } ], "action": { "type": "uri", "label": "share", "uri": badgeUrl } } ]
    };
  
    let heroBlock;
    if (cardType === 'video' && videoUrl && videoUrl.match(/^https:\/\//i)) {
        heroBlock = { "type": "video", "url": videoUrl, "previewUrl": imgUrl, "altContent": { "type": "image", "size": "full", "aspectRatio": ar, "aspectMode": aspectMode, "url": imgUrl }, "aspectRatio": ar };
    } else {
        heroBlock = { "type": "image", "url": imgUrl, "size": "full", "aspectRatio": ar, "aspectMode": aspectMode, "action": { "type": "uri", "label": "cover", "uri": safeImgActionUrl.substring(0, 1000) } };
    }
  
    const flexContents = {
        "type": "bubble", "size": imgSize, "header": headerBlock, "hero": heroBlock,
        "body": { "type": "box", "layout": "vertical", "paddingAll": "0px", "contents": [ { "type": "box", "layout": "vertical", "paddingAll": "7px", "contents": [ { "type": "text", "text": title, "weight": "bold", "size": "xl", "align": titleAlign, "wrap": true }, { "type": "text", "text": desc, "size": "xs", "margin": "sm", "color": "#666666", "wrap": true } ] } ] }
    };
    
    if (btnContents.length > 0) flexContents.footer = { "type": "box", "layout": "vertical", "spacing": "sm", "paddingAll": "7px", "backgroundColor": "#FFFFFF", "contents": btnContents };
    return flexContents;
}
  
window.openECardGenerator = function() {
    try {
        if (typeof currentActiveCard === 'undefined' || !currentActiveCard) return;
        const c = currentActiveCard;
      
        try {
            if (typeof userProfile !== 'undefined' && userProfile && userProfile.pictureUrl) {
                const avatarImg = document.getElementById('preview-user-avatar');
                if (avatarImg) { avatarImg.src = userProfile.pictureUrl; avatarImg.classList.remove('hidden'); }
                const fallback = document.querySelector('.avatar-fallback');
                if (fallback) fallback.classList.add('hidden');
            }
        } catch(e) {}
      
        let savedConfig = null;
        if (c['自訂名片設定']) { try { savedConfig = JSON.parse(c['自訂名片設定']); } catch(e){} }
      
        const myLiffId = (typeof LIFF_ID !== 'undefined') ? LIFF_ID : '2009367829-DLtYBDUm';
        const safeSetValue = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };

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
      
          const sBtns = savedConfig.buttons || [];
          for(let i=1; i<=4; i++) {
            const btn = sBtns[i-1];
            safeSetValue(`ec-btn${i}-label`, btn ? btn.l : '');
            safeSetValue(`ec-btn${i}-url`, btn ? btn.u : '');
            safeSetValue(`ec-btn${i}-color`, btn && btn.c ? btn.c : '#06C755');
          }
        } else {
          const defaultFlex = window.buildFlexMessageFromCard(c, null);
          safeSetValue('ec-card-type', 'image'); safeSetValue('ec-video-url', ''); safeSetValue('ec-img-input', defaultFlex.hero.url || ''); safeSetValue('ec-img-action-url', `https://liff.line.me/${myLiffId}`); safeSetValue('ec-img-size', defaultFlex.size); safeSetValue('ec-aspect-ratio', 'auto'); safeSetValue('ec-title-align', 'center');
          
          let defaultTitle = '', defaultDesc = '';
          if (defaultFlex.body && defaultFlex.body.contents && defaultFlex.body.contents[0] && defaultFlex.body.contents[0].contents) {
              defaultTitle = defaultFlex.body.contents[0].contents[0] ? defaultFlex.body.contents[0].contents[0].text : '';
              defaultDesc = defaultFlex.body.contents[0].contents[1] ? defaultFlex.body.contents[0].contents[1].text : '';
          }
          safeSetValue('ec-title-input', defaultTitle); safeSetValue('ec-desc-input', defaultDesc);
          
          let defaultBtns = defaultFlex.footer && defaultFlex.footer.contents ? defaultFlex.footer.contents : [];
          for(let i=1; i<=4; i++) {
            const btn = defaultBtns[i-1];
            safeSetValue(`ec-btn${i}-label`, btn ? btn.action.label : '');
            safeSetValue(`ec-btn${i}-url`, btn ? btn.action.uri : '');
            safeSetValue(`ec-btn${i}-color`, btn ? btn.color : '#06C755');
          }
        }
        
        const cardTypeEl = document.getElementById('ec-card-type');
        window.toggleECardType(cardTypeEl ? cardTypeEl.value : 'image');
        
        const previewImg = document.getElementById('preview-ec-img');
        if (previewImg) previewImg.removeAttribute('data-current-src');
        
        const modalEl = document.getElementById('ecard-generator-modal');
        if (modalEl) modalEl.classList.remove('hidden');
    } catch (err) { alert("系統異常：" + err.message); }
}
  
window.closeECardGenerator = function() { 
    const modalEl = document.getElementById('ecard-generator-modal');
    if (modalEl) modalEl.classList.add('hidden'); 
}
  
window.updateECardPreview = function() {
    const cardTypeEl = document.getElementById('ec-card-type'); const cardType = cardTypeEl ? cardTypeEl.value : 'image';
    const videoUrlEl = document.getElementById('ec-video-url'); const videoUrl = videoUrlEl ? videoUrlEl.value.trim() : '';
    const arSettingEl = document.getElementById('ec-aspect-ratio'); const arSetting = arSettingEl ? arSettingEl.value : 'auto';
    const imgInputEl = document.getElementById('ec-img-input'); let rawUrl = imgInputEl ? imgInputEl.value : '';

    if (!rawUrl) {
        rawUrl = (typeof currentActiveCard !== 'undefined' && currentActiveCard && currentActiveCard['名片圖檔']) ? currentActiveCard['名片圖檔'] : '';
        if (!rawUrl || rawUrl === '無圖檔' || rawUrl === '圖片儲存失敗' || !rawUrl.startsWith('http')) {
            rawUrl = 'https://images.unsplash.com/photo-1616628188550-808682f3926d?w=800&q=80';
        }
    }
    let imgUrl = typeof window.getDirectImageUrl === 'function' ? window.getDirectImageUrl(rawUrl) : rawUrl;
    
    const heroEl = document.getElementById('preview-ec-hero'); const imgEl = document.getElementById('preview-ec-img');
    const videoEl = document.getElementById('preview-ec-video'); const playIcon = document.getElementById('preview-ec-play-icon');
    const bubbleEl = document.getElementById('preview-ec-bubble');
    
    if (!heroEl || !imgEl || !bubbleEl) return;

    const sizeEl = document.getElementById('ec-img-size'); const imgSize = sizeEl ? sizeEl.value : 'mega';
    if (imgSize === 'giga') bubbleEl.style.maxWidth = '360px'; else if (imgSize === 'kilo') bubbleEl.style.maxWidth = '260px'; else bubbleEl.style.maxWidth = '300px'; 
    
    const previewBox = document.getElementById('ec-img-preview-box'); const placeholder = document.getElementById('ec-upload-placeholder');
  
    if (cardType === 'video') {
        if (videoUrl && videoEl) { videoEl.src = videoUrl; videoEl.classList.remove('hidden'); videoEl.play().catch(e => {}); } else if (videoEl) { videoEl.src = ''; videoEl.classList.add('hidden'); }
        if (playIcon) playIcon.classList.remove('hidden');
    } else {
        if (videoEl) { videoEl.src = ''; videoEl.classList.add('hidden'); }
        if (playIcon) playIcon.classList.add('hidden');
    }
  
    const applyAspectRatio = (ratioStr) => { let [w, h] = ratioStr.split(':'); if(w && h && heroEl && imgEl) { heroEl.style.aspectRatio = `${w} / ${h}`; imgEl.style.aspectRatio = `${w} / ${h}`; imgEl.style.objectFit = 'cover'; } };
  
    if (imgEl.getAttribute('data-current-src') !== imgUrl || arSetting !== 'auto') {
        imgEl.setAttribute('data-current-src', imgUrl);
        const tempImg = new Image();
        tempImg.onload = function() {
            if (arSetting === 'auto') {
                let w = this.width; let h = this.height; let ratio = w / h;
                if (ratio > 3) { w = 300; h = 100; } else if (ratio < 0.334) { w = 100; h = 300; }
                let dynAr = `${Math.round(w)}:${Math.round(h)}`; applyAspectRatio(dynAr);
            } else { applyAspectRatio(arSetting); }
            imgEl.src = imgUrl; imgEl.classList.remove('hidden');
            if (previewBox && placeholder) { previewBox.src = imgUrl; previewBox.classList.remove('hidden'); placeholder.classList.add('hidden'); }
        };
        tempImg.onerror = function() {
            applyAspectRatio(arSetting === 'auto' ? "20:13" : arSetting); imgEl.src = imgUrl; imgEl.classList.remove('hidden');
            if (previewBox && placeholder) { previewBox.src = ''; previewBox.classList.add('hidden'); placeholder.classList.remove('hidden'); }
        };
        tempImg.src = imgUrl;
    } else { applyAspectRatio(arSetting === 'auto' ? "20:13" : arSetting); }
  
    const titleAlignEl = document.getElementById('ec-title-align'); const titleAlign = titleAlignEl ? titleAlignEl.value : 'center';
    const cssAlign = titleAlign === 'start' ? 'left' : (titleAlign === 'end' ? 'right' : 'center');
    
    const previewTitleEl = document.getElementById('preview-ec-title');
    if (previewTitleEl) { previewTitleEl.style.textAlign = cssAlign; const titleInputEl = document.getElementById('ec-title-input'); previewTitleEl.innerText = (titleInputEl ? titleInputEl.value : '') || '請輸入標題'; }

    const previewDescEl = document.getElementById('preview-ec-desc');
    if (previewDescEl) { const descInputEl = document.getElementById('ec-desc-input'); previewDescEl.innerText = descInputEl ? descInputEl.value : ''; }
    
    const btnContainer = document.getElementById('preview-ec-buttons');
    if (btnContainer) {
        btnContainer.innerHTML = '';
        for(let i=1; i<=4; i++) {
          const labelEl = document.getElementById(`ec-btn${i}-label`); const urlEl = document.getElementById(`ec-btn${i}-url`); const colorEl = document.getElementById(`ec-btn${i}-color`);
          const label = labelEl ? labelEl.value : ''; const url = urlEl ? urlEl.value : ''; const color = colorEl ? colorEl.value : '#06C755';
          if(label && url) { btnContainer.innerHTML += `<div class="w-full text-white text-[13px] font-bold text-center py-2.5 rounded-lg mb-2 shadow-sm" style="background-color: ${color}">${label}</div>`; }
        }
    }
}

window.checkFormat = function(showAlert = false) {
    let errors = [];
    const cardTypeEl = document.getElementById('ec-card-type'); const cardType = cardTypeEl ? cardTypeEl.value : 'image';

    if (cardType === 'video') {
        const vUrlEl = document.getElementById('ec-video-url'); const vUrl = vUrlEl ? vUrlEl.value.trim() : '';
        if (!vUrl) errors.push("❌ 【動態影片版】必須填寫影片網址。"); else if (!vUrl.match(/^https:\/\//i)) errors.push("❌ 【影片網址】必須以 https:// 開頭。"); else if (!vUrl.toLowerCase().includes('mp4')) errors.push("❌ 【影片網址】目前僅支援 MP4 格式。");
    }
  
    for (let i = 1; i <= 4; i++) {
        let urlInput = document.getElementById(`ec-btn${i}-url`); if (!urlInput) continue;
        let url = urlInput.value.trim();
        if (url) {
            if (/^[\d\-\+\s()]+$/.test(url) && !url.startsWith('tel:')) {
                let pureNum = url.replace(/[^\d+]/g, '');
                if (pureNum.startsWith('+886')) pureNum = '0' + pureNum.substring(4);
                if (pureNum.startsWith('886')) pureNum = '0' + pureNum.substring(3);
                if (pureNum) urlInput.value = 'tel:' + pureNum;
            } else if (url.includes('@') && !url.startsWith('mailto:') && !url.startsWith('http')) {
                urlInput.value = 'mailto:' + url.replace(/\s/g, '');
            } else if (!url.startsWith('http') && !url.startsWith('tel:') && !url.startsWith('mailto:') && !url.startsWith('line:')) {
                if (url.includes('.')) urlInput.value = 'https://' + url.replace(/\s/g, '');
            }
            urlInput.value = urlInput.value.replace(/\s/g, ''); 
        }
    }
  
    const imgInputEl = document.getElementById('ec-img-input'); const imgUrl = imgInputEl ? imgInputEl.value.trim() : '';
    if (imgUrl && !imgUrl.match(/^https?:\/\//i)) errors.push("❌ 【封面圖片網址】若要填寫，必須以 http:// 或 https:// 開頭。");
  
    const actionUrlEl = document.getElementById('ec-img-action-url'); const actionUrl = actionUrlEl ? actionUrlEl.value.trim() : '';
    if (!actionUrl) errors.push("❌ 【點圖預設連結】不得為空。"); else if (!actionUrl.match(/^(https?|tel|mailto|line):/i)) errors.push("❌ 【點圖預設連結】必須為有效網址。");
  
    for (let i = 1; i <= 4; i++) {
        const labelEl = document.getElementById(`ec-btn${i}-label`); const urlEl = document.getElementById(`ec-btn${i}-url`);
        const label = labelEl ? labelEl.value.trim() : ''; const url = urlEl ? urlEl.value.trim() : '';
        if (label || url) {
            if (!label) errors.push(`❌ 【按鈕 ${i}】缺少文字。`); else if (label.length > 20) errors.push(`❌ 【按鈕 ${i}】文字過長。`);
            if (!url) errors.push(`❌ 【按鈕 ${i}】缺少連結。`); else if (!url.match(/^(https?|tel|mailto|line):/i)) errors.push(`❌ 【按鈕 ${i}】連結開頭錯誤。`);
        }
    }
  
    if (errors.length > 0) { if (showAlert) alert("⚠️ 發現格式錯誤：\n\n" + errors.join("\n")); return false; } 
    else { if (showAlert) { if (typeof window.showToast === 'function') window.showToast("✅ 格式檢查無誤"); } return true; }
}

window.saveECardConfig = async function(isSilent = false) {
    if(typeof currentActiveCard === 'undefined' || !currentActiveCard) return;
    const btn = document.getElementById('btn-save-ecard'); const originalText = btn ? btn.innerHTML : '';
    if (!isSilent && btn) { btn.innerHTML = '<span class="material-symbols-outlined text-[16px] animate-spin">refresh</span>'; btn.classList.add('pointer-events-none', 'opacity-50'); }
  
    const getVal = (id, def) => { const el = document.getElementById(id); return el ? el.value : def; };

    const config = {
      cardType: getVal('ec-card-type', 'image'), videoUrl: getVal('ec-video-url', '').trim(), imgUrl: getVal('ec-img-input', ''),
      imgActionUrl: getVal('ec-img-action-url', ''), imgSize: getVal('ec-img-size', 'mega'), ar: getVal('ec-aspect-ratio', 'auto'),
      aspectMode: 'cover', titleAlign: getVal('ec-title-align', 'center'), title: getVal('ec-title-input', ''), desc: getVal('ec-desc-input', ''), buttons: []
    };
    
    for(let i=1; i<=4; i++) {
      const l = getVal(`ec-btn${i}-label`, ''); const u = getVal(`ec-btn${i}-url`, ''); const c = getVal(`ec-btn${i}-color`, '#06C755');
      if(l && u) config.buttons.push({l, u, c});
    }
  
    try {
      if (typeof window.fetchAPI === 'function') { await window.fetchAPI('updateECardConfig', { rowId: currentActiveCard.rowId, config: config }, true); }
      currentActiveCard['自訂名片設定'] = JSON.stringify(config); 
      if(config.imgUrl) currentActiveCard['名片圖檔'] = config.imgUrl; 
      if(!isSilent && typeof window.showToast === 'function') window.showToast('✅ 名片設定已儲存');
    } catch(e) {
      if(!isSilent && typeof window.showToast === 'function') window.showToast('⚠️ 儲存失敗', true);
    } finally {
      if (!isSilent && btn) { btn.innerHTML = originalText; btn.classList.remove('pointer-events-none', 'opacity-50'); }
    }
    return config;
}
  
window.shareECardToLine = async function() {
    if (!window.checkFormat(true)) return;
  
    const btnShare = document.getElementById('btn-share-line'); let oriHtml = '';
    if (btnShare) { oriHtml = btnShare.innerHTML; btnShare.innerHTML = '<span class="material-symbols-outlined animate-spin text-[18px]">refresh</span> 發送中...'; btnShare.classList.add('pointer-events-none'); }
  
    try {
      const imgInput = document.getElementById('ec-img-input'); let rawUrl = imgInput ? imgInput.value : '';
      if (!rawUrl) { rawUrl = currentActiveCard['名片圖檔'] ? currentActiveCard['名片圖檔'] : 'https://images.unsplash.com/photo-1616628188550-808682f3926d?w=800&q=80'; }
      const currentImgUrl = typeof window.getDirectImageUrl === 'function' ? window.getDirectImageUrl(rawUrl) : rawUrl;
      const detectedAr = (typeof window.getTrueAspectRatio === 'function') ? await window.getTrueAspectRatio(currentImgUrl) : "20:13";
  
      const config = await window.saveECardConfig(true); 
      const flexMessageObj = window.buildFlexMessageFromCard(currentActiveCard, config, detectedAr);
      const altText = `您收到一張數位名片：${config && config.title ? config.title : currentActiveCard['姓名'] || currentActiveCard['Name'] || '商務名片'}`;
      
      const myLiffId = (typeof LIFF_ID !== 'undefined') ? LIFF_ID : '2009367829-DLtYBDUm';
      const shareUrl = `https://liff.line.me/${myLiffId}/card.html?shareCardId=${currentActiveCard.rowId}`;
  
      if (typeof liff !== 'undefined' && liff.isApiAvailable('shareTargetPicker')) {
          try {
              if (typeof window.triggerFlexSharing === 'function') await window.triggerFlexSharing(flexMessageObj, altText);
              else await liff.shareTargetPicker([{ type: "flex", altText: altText, contents: flexMessageObj }]);
              if (typeof window.showToast === 'function') window.showToast('✅ 數位名片已發送！');
              setTimeout(()=>liff.closeWindow(), 1000);
          } catch(e) { if (typeof window.fallbackShare === 'function') window.fallbackShare(shareUrl, altText); }
      } else {
          if (typeof window.fallbackShare === 'function') window.fallbackShare(shareUrl, altText);
      }
    } catch(err) { alert("錯誤：" + err.message); } finally {
      if (btnShare) { btnShare.innerHTML = oriHtml; btnShare.classList.remove('pointer-events-none'); }
    }
}
  
window.handleECardImageUpload = function(input) {
    if (typeof window.openCropper === 'function') window.openCropper(input, 'ecard');
}
