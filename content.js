document.addEventListener("contextmenu", function (e) {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    chrome.runtime.sendMessage({ lastClientX: e.screenX, lastClientY: e.screenY, 
        clientHeight: el.naturalHeight ?? el.clientHeight, clientWidth: el.naturalWidth ?? el.clientWidth});
});