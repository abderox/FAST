/* global chrome */
export function openFile(filePath) {
    if (typeof chrome !== 'undefined') {
        const fileUrl = chrome.runtime.getURL(filePath);
        chrome.tabs.create({ url: fileUrl });
    }
}