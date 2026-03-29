/**
 * LIFF Share Target Picker 共用發送模組
 * 包含大檔支援、自動 Token 換發與防呆重登機制
 */
window.triggerFlexSharing = async function(flexContents, altText, successMsg = '🚀 數位名片已成功轉發！') {
    // 共用的提示函式，動態相容各頁面的 showToast 或退回原生 alert
    const notify = (msg, isError = false) => {
        if (typeof window.showToast === 'function') {
            window.showToast(msg, isError);
        } else {
            alert(msg);
        }
    };

    // 1. 確保使用者已登入
    if (!liff.isLoggedIn()) { 
        liff.login({ redirectUri: window.location.href }); 
        return; 
    }
    
    try {
        // 2. 信任官方 SDK 進行 POST 與 ott 轉換
        const message = { type: "flex", altText: altText || "您收到一張數位名片", contents: flexContents };
        const res = await liff.shareTargetPicker([message]);
        
        if (res) {
            notify(successMsg);
            setTimeout(() => liff.closeWindow(), 1500);
        } else {
            notify('取消傳送', true);
        }
    } catch (error) {
        console.error("LIFF SDK Share Error:", error);
        
        // 3. 終極防呆機制：攔截過期 Token 導致的 "not allowed" 報錯
        if (error.message && error.message.includes('not allowed')) {
            notify("⚠️ 系統權限已更新！即將為您重新登入...", true);
            setTimeout(() => {
                liff.logout(); // 清除舊 Token
                window.location.reload(); // 重新整理換發新 Token
            }, 2000);
        } else {
            notify('發送取消或發生未知錯誤: ' + error.message, true);
        }
    }
};
