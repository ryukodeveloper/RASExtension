/*

DO NOT REMOVE THIS NOTE!
CREATED BY RYUKO DEVELOPER!

*/

const FB_AGENT = "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";

function showNotify(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'https://image2url.com/r2/default/images/1774317141895-f7230ba7-c3db-4d19-a1a1-106596403da1.jpg',
    title: title,
    message: message,
    priority: 2
  });
}

async function saveLog(msg, isError = false) {
  const { logs = [] } = await chrome.storage.local.get("logs");
  const newLog = { msg, isError, time: new Date().toLocaleTimeString() };
  logs.push(newLog);
  if (logs.length > 100) logs.shift();
  await chrome.storage.local.set({ logs });
  chrome.runtime.sendMessage({ type: "LOG", ...newLog }).catch(() => {});
}

async function getAccessToken(cookieString) {
  try {
    const response = await fetch('https://business.facebook.com/business_locations', {
      headers: { "User-Agent": FB_AGENT, "Cookie": cookieString }
    });
    const text = await response.text();
    const tokenMatch = text.match(/EAAG\w+/);
    return tokenMatch ? tokenMatch[0] : null;
  } catch (e) { return null; }
}

chrome.runtime.onMessage.addListener(async (request) => {
  if (request.action === "startSharing") {
    const token = await getAccessToken(request.data.cookie);
    if (!token) {
      await saveLog("token error!", true);
      showNotify("Ryuko Error", "Failed to get Access Token.");
      chrome.runtime.sendMessage({ type: "STATUS_UPDATE", isRunning: false }).catch(() => {});
      return;
    }

    await chrome.storage.local.set({
      shareData: { ...request.data, token },
      currentCount: 0,
      isRunning: true
    });

    const intervalMinutes = Math.max(0.1, request.data.interval / 60000);
    chrome.alarms.create("ryukoShareAlarm", { periodInMinutes: intervalMinutes });
    
    showNotify("Ryuko Started", "Background process initiated.");
    await saveLog("BACKGROUND PROCESS STARTED", false);
  }

  if (request.action === "stopSharing") {
    chrome.alarms.clear("ryukoShareAlarm");
    await chrome.storage.local.set({ isRunning: false });
    await saveLog("PROCESS STOPPED BY USER", true);
    chrome.runtime.sendMessage({ type: "STATUS_UPDATE", isRunning: false }).catch(() => {});
    showNotify("Ryuko Stopped", "The sharing process has been terminated.");
  }

  if (request.action === "clearStorage") {
    chrome.alarms.clear("ryukoShareAlarm");
    await chrome.storage.local.clear();
    chrome.runtime.sendMessage({ type: "STATUS_UPDATE", isRunning: false }).catch(() => {});
  }
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "ryukoShareAlarm") {
    const state = await chrome.storage.local.get(["shareData", "currentCount", "isRunning"]);
    
    if (!state.isRunning || state.currentCount >= state.shareData.count) {
      chrome.alarms.clear("ryukoShareAlarm");
      await chrome.storage.local.set({ isRunning: false });
      chrome.runtime.sendMessage({ type: "STATUS_UPDATE", isRunning: false }).catch(() => {});
      if (state.currentCount >= state.shareData.count) {
        showNotify("Completed", "Finished sharing tasks!");
        await saveLog("COMPLETED SHARING PROCCESS!");
      }
      return;
    }

    try {
      const { cookie, url, token } = state.shareData;
      const fbUrl = `https://graph.facebook.com/me/feed?access_token=${token}`;
      
      const res = await fetch(fbUrl, {
        method: 'POST',
        headers: { "Content-Type": "application/json", "Cookie": cookie },
        body: JSON.stringify({ link: url, published: 0, privacy: { value: "SELF" }, no_story: true })
      });
      
      const json = await res.json();
      const newCount = (state.currentCount || 0) + 1;

      if (json.id) {
        await chrome.storage.local.set({ currentCount: newCount });
        await saveLog(`Shared : ${newCount}/${state.shareData.count}, ID : ${json.id}`);
      } else {
        await saveLog("error : " + (json.error?.message || "Check settings"), true);
        chrome.alarms.clear("ryukoShareAlarm");
        await chrome.storage.local.set({ isRunning: false });
        chrome.runtime.sendMessage({ type: "STATUS_UPDATE", isRunning: false }).catch(() => {});
      }
    } catch (err) {
      await saveLog("network error!", true);
    }
  }
});
