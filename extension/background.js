chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'shareToSupercurators',
    title: 'Share to Supercurators',
    contexts: ['page', 'link']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const url = info.linkUrl || info.pageUrl;
  // Open popup with pre-filled URL
  chrome.windows.create({
    url: 'popup.html?url=' + encodeURIComponent(url),
    type: 'popup',
    width: 400,
    height: 300
  });
});