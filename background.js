let lastClientX, lastClientY, clientHeight, clientWidth, originWindowId
let lastPopupId, lastPopupDx, lastPopupDy, lastPopupHeight, lastPopupWidth;
let titlebarheight = 60, toolbarwidth = 40;

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {

        if (request.action == 'updateExistingWindow'){
            if (configs.tryFitWindowSizeToImage == false) return;

            let updatedHeight = request.imageHeight, updatedWidth = request.imageWidth, newHeight, newWidth;
            const aspectRatio = updatedWidth / updatedHeight;
            newHeight = (window.screen.height * 0.7); newWidth = (newHeight * aspectRatio) - toolbarwidth;

            if (newWidth > window.screen.width) {
                newWidth = (window.screen.width * 0.7) + toolbarwidth; newHeight = (newWidth / aspectRatio);
            }

            chrome.windows.update(lastPopupId, {
                'width': Math.round(newWidth), 
                'height': Math.round(newHeight - 10),
                'top': Math.round(lastPopupDy + ((lastPopupHeight - newHeight) / 2)), 'left': Math.round(lastPopupDx + (lastPopupWidth - newWidth) / 2)
            });
        } else {
            /// save mouse coordinates
            lastClientX = request.lastClientX;
            lastClientY = request.lastClientY;
            clientHeight = request.clientHeight;
            clientWidth = request.clientWidth;
        }
        return true;
    }
);

const contextMenuItem = {
    "id": "viewInPopupWindow",
    "title": chrome.i18n.getMessage('viewInPopupWindow'),
    "contexts": ["image"]
};

chrome.contextMenus.create(contextMenuItem);

chrome.contextMenus.onClicked.addListener(function(clickData) {
    /// load configs
    loadUserConfigs(function(){

        /// store current windowId
        chrome.windows.getCurrent(
            function(originWindow){
                if (originWindow.type !== 'popup') originWindowId = originWindow.id;
        });
    
        let dx, dy, height, width;

        if (configs.tryFitWindowSizeToImage == true) {
            height = clientHeight ? clientHeight : configs.popupHeight, width = (clientWidth ?? configs.popupWidth);
            const aspectRatio = width / height;
            height = window.screen.height * 0.7; width = (height * aspectRatio);
    
            if (width > window.screen.width) {
                width = window.screen.width * 0.7 + toolbarwidth; height = (width / aspectRatio);
            }
        } else {
            height = configs.popupHeight;
            width = configs.popupWidth;
        }

        if (configs.tryOpenAtMousePosition == true && (lastClientX && lastClientY)) {
            /// open at last known mouse position (when context menu was clicked)
            dx = lastClientX - (width / 2), dy = lastClientY - (height / 2);
        } else {
            /// open at center of screen
            dx = (window.screen.width / 2) - (width / 2), dy = (window.screen.height / 2) - (height / 2);
        }
    
        /// check for screen overflow
        if (dx < 0) dx = 0;
        if (dy < 0) dy = 0;

        if (dx + width > window.screen.width) dx = dx - (dx + width - window.screen.width);
        if (dy + height > window.screen.height) dy = dy - (dy + height - window.screen.height);
        
        dx = Math.round(dx); dy = Math.round(dy);
        height = parseInt(Math.round(height)); width = parseInt(Math.round(width));
    
        /// create popup window
        setTimeout(function () {
            chrome.windows.create({
                'url': chrome.runtime.getURL('viewer/viewer.html') + '?src=' + clickData.srcUrl, 
                'type': 'popup', 
                'width': width, 'height': height,
                'top': dy, 'left': dx - 40
            }, function (popupWindow) {
                /// set coordinates again (workaround for old firefox bug)
                chrome.windows.update(popupWindow.id, {
                    'top': dy, 'left': dx
                });

                /// store to compare after image loaded
                lastPopupId = popupWindow.id;
                lastPopupDx = dx;
                lastPopupDy = dy;
                lastPopupHeight = height;
                lastPopupWidth = width;
    
                if (configs.closeWhenFocusedInitialWindow == false) return;

                /// close popup on click parent window
                function windowFocusListener(windowId) {
                    if (windowId == originWindowId) {
                        chrome.windows.onFocusChanged.removeListener(windowFocusListener);
                        chrome.windows.remove(popupWindow.id);
    
                        // if (originalWindowIsFullscreen) chrome.windows.update(parentWindow.id, {
                        //     'state': 'fullscreen'
                        // });
                    }
                }
    
                setTimeout(function () {
                    chrome.windows.onFocusChanged.addListener(windowFocusListener);
                }, 300);
            });
        // }, originalWindowIsFullscreen ? 600 : 0)
        }, 0);
    });
 });