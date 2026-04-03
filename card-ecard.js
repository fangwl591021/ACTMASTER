/**
 * card-ecard.js
 * 數位電子名片 (ECard) 專用模組 - QQ修復版 (預設按鈕改為 LINE 綠色)
 */

window.toggleECardType = function(type) {
    document.getElementById('ec-card-type').value = type;
    const tabImg = document.getElementById('ec-tab-image');
    const tabVid = document.getElementById('ec-tab-video');
    const vidGroup = document.getElementById('ec-video-input-group');
    
    if (type === 'video') {
      tabImg.className = 'flex-1 py-2 rounded-xl text-[14px] font-bold text-slate-500 transition-all hover:text-slate-700 bg-transparent';
      tabVid.className = 'flex-1 py-2 rounded-xl text-[14px] font-bold bg-white text-primary shadow-sm transition-all';
      vidGroup.classList.remove('hidden');
      document.getElementById('ec-upload-label').innerHTML = '點擊上傳封面圖縮圖 <span class="ml-1.5 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[11px] font-bold tracking-wider">選填</span>';
      document.getElementById('ec-upload-hint').innerText = '※ 影片必須有封面縮圖，若未上傳系統將自動代入名片圖或預設底圖。';
    } else {
      tabImg.className = 'flex-1 py-2 rounded-xl text-[14px] font-bold bg-white text-primary shadow-sm transition-all';
      tabVid.className = 'flex-1 py-2 rounded-xl text-[14px] font-bold text-slate-500 transition-all hover:text-slate-700 bg-transparent';
      vidGroup.classList.add('hidden');
      document.getElementById('ec-upload-label').innerHTML = '點擊圖片變更 <span class="ml-1.5 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[11px] font-bold tracking-wider">選填</span>';
      document.getElementById('ec-upload-hint').innerText = '※ 若未上傳，系統將智能代入您原先的名片圖檔作為底圖。';
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
    imgUrl = window.getDirectImageUrl(rawImg);
    
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
        // ⭐ QQ修復：Flex Message 按鈕顏色若無指定，預設改為 #06C755
        let btnColor = buttons[i].c || '#06C755';
        btnContents.push({ "type": "button", "style": "primary", "color": btnColor, "height": "sm", "margin": "sm", "action": { "type": "uri", "label": label.substring(0, 20), "uri": safeU.substring(0, 1000) } });
    }
  
    const badgeUrl = `https://liff.line.me/${myLiffId}/card.html?shareCardId=${card.rowId}`;
  
    const headerBlock = {
        "type": "box",
        "layout": "horizontal",
        "justifyContent": "flex-end",
        "paddingAll": "7px",
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
        "type": "bubble", "size": imgSize,
        "header": headerBlock,
        "hero": heroBlock,
        "body": {
            "type": "box", "layout": "vertical", "paddingAll": "0px",
            "contents": [
                { "type": "box", "layout": "vertical", "paddingAll": "7px", "contents": [ { "type": "text", "text": title, "weight": "bold", "size": "xl", "align": titleAlign, "wrap": true }, { "type": "text", "text": desc, "size": "xs", "margin": "sm", "color": "#666666", "wrap": true } ] }
            ]
        }
    };
    
    if (btnContents.length > 0) flexContents.footer = { "type": "box", "layout": "vertical", "spacing": "sm", "paddingAll": "7px", "backgroundColor": "#FFFFFF", "contents": btnContents };
    return flexContents;
}
  
window.openECardGenerator = function() {
    if (typeof currentActiveCard === 'undefined' || !currentActiveCard) return;
    const c = currentActiveCard;
  
    if (typeof userProfile !== 'undefined' && userProfile && userProfile.pictureUrl) {
        document.getElementById('preview-user-avatar').src = userProfile.pictureUrl;
        document.getElementById('preview-user-avatar').classList.remove('hidden');
        document.querySelector('.avatar-fallback').classList.add('hidden');
    }
  
    let savedConfig = null;
    if (c['自訂名片設定']) { try { savedConfig = JSON.parse(c['自訂名片設定']); } catch(e){} }
  
    const myLiffId = (typeof LIFF_ID !== 'undefined') ? LIFF_ID : '2009367829-DLtYBDUm';

    if (savedConfig) {
      document.getElementById('ec-card-type').value = savedConfig.cardType || 'image';
      document.getElementById('ec-video-url').value = savedConfig.videoUrl || '';
      
      document.getElementById('ec-img-input').value = savedConfig.imgUrl || '';
      document.getElementById('ec-img-action-url').value = savedConfig.imgActionUrl || `https://liff.line.me/${myLiffId}`;
      
      const sizeEl = document.getElementById('ec-img-size');
      if (sizeEl) sizeEl.value = savedConfig.imgSize || 'mega';
      
      const arEl = document.getElementById('ec-aspect-ratio');
      if (arEl) arEl.value = savedConfig.ar || 'auto';
      
      document.getElementById('ec-title-align').value = savedConfig.titleAlign || 'center';
      
      document.getElementById('ec-title-input').value = savedConfig.title || '';
      document.getElementById('ec-desc-input').value = savedConfig.desc || '';
  
      for(let i=1; i<=4; i++) {
        const btn = savedConfig.buttons[i-1];
        document.getElementById(`ec-btn${i}-label`).value = btn ? btn.l : '';
        document.getElementById(`ec-btn${i}-url`).value = btn ? btn.u : '';
        // ⭐ QQ修復：還原設定時，預設給 #06C755
        document.getElementById(`ec-btn${i}-color`).value = btn && btn.c ? btn.c : '#06C755';
      }
    } else {
      const defaultFlex = window.buildFlexMessageFromCard(c, null);
      document.getElementById('ec-card-type').value = 'image';
      document.getElementById('ec-video-url').value = '';
      
      document.getElementById('ec-img-input').value = defaultFlex.hero.url || '';
      document.getElementById('ec-img-action-url').value = `https://liff.line.me/${myLiffId}`;
      
      const sizeEl = document.getElementById('ec-img-size');
      if (sizeEl) sizeEl.value = defaultFlex.size;
      
      const arEl = document.getElementById('ec-aspect-ratio');
      if (arEl) arEl.value = 'auto';
  
      document.getElementById('ec-title-align').value = 'center';
      
      document.getElementById('ec-title-input').value = defaultFlex.body.contents[0].contents[0].text;
      document.getElementById('ec-desc-input').value = defaultFlex.body.contents[0].contents[1] ? defaultFlex.body.contents[0].contents[1].text : '';
      
      const buttons = defaultFlex.footer ? defaultFlex.footer.contents : [];
      for(let i=1; i<=4; i++) {
        const btn = buttons[i-1];
        document.getElementById(`ec-btn${i}-label`).value = btn ? btn.action.label : '';
        document.getElementById(`ec-btn${i}-url`).value = btn ? btn.action.uri : '';
        // ⭐ QQ修復：初次開啟編輯器，按鈕顏色預設給 #06C755
        document.getElementById(`ec-btn${i}-color`).value = '#06C755';
      }
    }
    
    window.toggleECardType(document.getElementById('ec-card-type').value);
    document.getElementById('preview-ec-img').removeAttribute('data-current-src');
    document.getElementById('ecard-generator-modal').classList.remove('hidden');
}
  
window.closeECardGenerator = function() { document.getElementById('ecard-generator-modal').classList.add('hidden'); }
  
window.updateECardPreview = function() {
    const cardType = document.getElementById('ec-card-type').value || 'image';
    const videoUrl = document.getElementById('ec-video-url').value.trim();
    const arSetting = document.getElementById('ec-aspect-ratio') ? document.getElementById('ec-aspect-ratio').value : 'auto';
  
    let rawUrl = document.getElementById('ec-img-input').value;
    if (!rawUrl) {
        rawUrl = (typeof currentActiveCard !== 'undefined' && currentActiveCard && currentActiveCard['名片圖檔']) ? currentActiveCard['名片圖檔'] : '';
        if (!rawUrl || rawUrl === '無圖檔' || rawUrl === '圖片儲存失敗' || !rawUrl.startsWith('http')) {
            rawUrl = 'https://images.unsplash.com/photo-1616628188550-808682f3926d?w=800&q=80';
        }
    }
    let imgUrl = window.getDirectImageUrl ? window.getDirectImageUrl(rawUrl) : rawUrl;
    
    const heroEl = document.getElementById('preview-ec-hero');
    const imgEl = document.getElementById('preview-ec-img');
    const videoEl = document.getElementById('preview-ec-video');
    const playIcon = document.getElementById('preview-ec-play-icon');
    const bubbleEl = document.getElementById('preview-ec-bubble');
    
    const sizeEl = document.getElementById('ec-img-size');
    const imgSize = sizeEl ? sizeEl.value : 'mega';
    if (imgSize === 'giga') bubbleEl.style.maxWidth = '360px';
    else if (imgSize === 'kilo') bubbleEl.style.maxWidth = '260px';
    else bubbleEl.style.maxWidth = '300px'; 
    
    const previewBox = document.getElementById('ec-img-preview-box');
    const placeholder = document.getElementById('ec-upload-placeholder');
  
    if (cardType === 'video') {
        if (videoUrl) {
            videoEl.src = videoUrl;
            videoEl.classList.remove('hidden');
            videoEl.play().catch(e => {});
        } else {
            videoEl.src = '';
            videoEl.classList.add('hidden');
        }
        playIcon.classList.remove('hidden');
    } else {
        videoEl.src = '';
        videoEl.classList.add('hidden');
        playIcon.classList.add('hidden');
    }
  
    const applyAspectRatio = (ratioStr) => {
        let [w, h] = ratioStr.split(':');
        if(w && h) {
            heroEl.style.aspectRatio = `${w} / ${h}`;
            imgEl.style.aspectRatio = `${w} / ${h}`;
            imgEl.style.objectFit = 'cover';
        }
    };
  
    if (imgEl.getAttribute('data-current-src') !== imgUrl || arSetting !== 'auto') {
        imgEl.setAttribute('data-current-src', imgUrl);
        const tempImg = new Image();
        tempImg.onload = function() {
            if (arSetting === 'auto') {
                let w = this.width; let h = this.height; let ratio = w / h;
                if (ratio > 3) { w = 300; h = 100; }
                else if (ratio < 0.334) { w = 100; h = 300; }
                let dynAr = `${Math.round(w)}:${Math.round(h)}`;
                if (typeof window.dynamicAspectRatio !== 'undefined') window.dynamicAspectRatio = dynAr;
                applyAspectRatio(dynAr);
            } else {
                applyAspectRatio(arSetting);
            }
            imgEl.src = imgUrl;
            imgEl.classList.remove('hidden');
            
            if (previewBox && placeholder) {
                previewBox.src = imgUrl;
                previewBox.classList.remove('hidden');
                placeholder.classList.add('hidden');
            }
        };
        tempImg.onerror = function() {
            applyAspectRatio(arSetting === 'auto' ? "20:13" : arSetting);
            imgEl.src = imgUrl;
            imgEl.classList.remove('hidden');
            
            if (previewBox && placeholder) {
                previewBox.src = '';
                previewBox.classList.add('hidden');
                placeholder.classList.remove('hidden');
            }
        };
        tempImg.src = imgUrl;
    } else {
        applyAspectRatio(arSetting === 'auto' ? "20:13" : arSetting);
    }
  
    const titleAlign = document.getElementById('ec-title-align').value;
    const cssAlign = titleAlign === 'start' ? 'left' : (titleAlign === 'end' ? 'right' : 'center');
    document.getElementById('preview-ec-title').style.textAlign = cssAlign;
  
    document.getElementById('preview-ec-title').innerText = document.getElementById('ec-title-input').value || '請輸入標題';
    document.getElementById('preview-ec-desc').innerText = document.getElementById('ec-desc-input').value;
    
    const btnContainer = document.getElementById('preview-ec-buttons');
    btnContainer.innerHTML = '';
    for(let i=1; i<=4; i++) {
      const label = document.getElementById(`ec-btn${i}-label`).value;
      const url = document.getElementById(`ec-btn${i}-url`).value;
      const color = document.getElementById(`ec-btn${i}-color`).value;
      if(label && url) {
        btnContainer.innerHTML += `<div class="w-full text-white text-[13px] font-bold text-center py-2.5 rounded-lg mb-2 shadow-sm" style="background-color: ${color}">${label}</div>`;
      }
    }
}
  
window.checkFormat = function(showAlert = false) {
    let errors = [];
    
    const cardType = document.getElementById('ec-card-type').value;
    if (cardType === 'video') {
        const vUrl = document.getElementById('ec-video-url').value.trim();
        if (!vUrl) errors.push("❌ 【動態影片版】必須填寫影片網址。");
        else if (!vUrl.match(/^https:\/\//i)) errors.push("❌ 【影片網址】必須以 https:// 開頭。");
        else if (!vUrl.toLowerCase().includes('mp4')) errors.push("❌ 【影片網址】目前僅支援 MP4 格式。");
    }
  
    for (let i = 1; i <= 4; i++) {
        let urlInput = document.getElementById(`ec-btn${i}-url`);
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
  
    const imgUrl = document.getElementById('ec-img-input').value.trim();
    if (imgUrl && !imgUrl.match(/^https?:\/\//i)) {
        errors.push("❌ 【封面圖片網址】若要填寫，必須以 http:// 或 https:// 開頭。");
    }
  
    const actionUrl = document.getElementById('ec-img-action-url').value.trim();
    if (!actionUrl) errors.push("❌ 【點圖預設連結】不得為空。");
    else if (!actionUrl.match(/^(https?|tel|mailto|line):/i)) errors.push("❌ 【點圖預設連結】必須為有效網址。");
  
    for (let i = 1; i <= 4; i++) {
        const label = document.getElementById(`ec-btn${i}-label`).value.trim();
        const url = document.getElementById(`ec-btn${i}-url`).value.trim();
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
  
    let currentDynAr = (typeof window.dynamicAspectRatio !== 'undefined') ? window.dynamicAspectRatio : '20:13';

    const config = {
      cardType: document.getElementById('ec-card-type').value,
      videoUrl: document.getElementById('ec-video-url').value.trim(),
      imgUrl: document.getElementById('ec-img-input').value,
      imgActionUrl: document.getElementById('ec-img-action-url').value,
      imgSize: document.getElementById('ec-img-size') ? document.getElementById('ec-img-size').value : 'mega',
      ar: document.getElementById('ec-aspect-ratio') ? document.getElementById('ec-aspect-ratio').value : 'auto',
      aspectMode: 'cover',
      titleAlign: document.getElementById('ec-title-align').value,
      title: document.getElementById('ec-title-input').value,
      desc: document.getElementById('ec-desc-input').value,
      buttons: []
    };
    for(let i=1; i<=4; i++) {
      const l = document.getElementById(`ec-btn${i}-label`).value;
      const u = document.getElementById(`ec-btn${i}-url`).value;
      const c = document.getElementById(`ec-btn${i}-color`).value;
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
    if (!window.checkFormat(true)) return;
  
    const btnShare = document.getElementById('btn-share-line');
    const oriHtml = btnShare.innerHTML;
    btnShare.innerHTML = '<span class="material-symbols-outlined animate-spin text-[18px]">refresh</span> 發送中...';
    btnShare.classList.add('pointer-events-none');
  
    try {
      let rawUrl = document.getElementById('ec-img-input').value;
      if (!rawUrl) {
          rawUrl = currentActiveCard['名片圖檔'] ? currentActiveCard['名片圖檔'] : 'https://images.unsplash.com/photo-1616628188550-808682f3926d?w=800&q=80';
      }
      const currentImgUrl = window.getDirectImageUrl ? window.getDirectImageUrl(rawUrl) : rawUrl;
      const detectedAr = (typeof window.getTrueAspectRatio === 'function') ? await window.getTrueAspectRatio(currentImgUrl) : "20:13";
  
      const config = await window.saveECardConfig(true); 
      const flexMessageObj = window.buildFlexMessageFromCard(currentActiveCard, config, detectedAr);
      const altText = `您收到一張數位名片：${config ? config.title : currentActiveCard['姓名'] || currentActiveCard['Name'] || '商務名片'}`;
      
      const myLiffId = (typeof LIFF_ID !== 'undefined') ? LIFF_ID : '2009367829-DLtYBDUm';
      const shareUrl = `https://liff.line.me/${myLiffId}/card.html?shareCardId=${currentActiveCard.rowId}`;
  
      if (liff.isApiAvailable('shareTargetPicker')) {
          try {
              if (window.triggerFlexSharing) {
                  await window.triggerFlexSharing(flexMessageObj, altText);
              } else {
                  await liff.shareTargetPicker([{ type: "flex", altText: altText, contents: flexMessageObj }]);
              }
              if (typeof window.showToast === 'function') window.showToast('✅ 數位名片已發送！');
          } catch(e) {
              if (typeof window.fallbackShare === 'function') window.fallbackShare(shareUrl, altText);
          }
      } else {
          if (typeof window.fallbackShare === 'function') window.fallbackShare(shareUrl, altText);
      }
    } catch(err) {
      alert("錯誤：" + err.message);
    } finally {
      btnShare.innerHTML = oriHtml;
      btnShare.classList.remove('pointer-events-none');
    }
}
  
window.handleECardImageUpload = function(input) {
    if (typeof window.openCropper === 'function') {
        window.openCropper(input, 'ecard');
    }
}
