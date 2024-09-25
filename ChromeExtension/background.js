chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install' || details.reason === 'update') {
        // Open the welcome.html page to request microphone access
        chrome.tabs.create({
            url: chrome.runtime.getURL('welcome.html'),
            active: true
        });
    }
});
