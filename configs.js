const configs = {
    'closeWhenFocusedInitialWindow': true,
    'tryOpenAtMousePosition': false,
    'hideBrowserControls': true,
    'tryFitWindowSizeToImage': true,
    'popupHeight': 600,
    'popupWidth': 600,
}

function loadUserConfigs(callback) {
    const keys = Object.keys(configs);
    chrome.storage.sync.get(
        keys, function (userConfigs) {
            const l = keys.length;
            for (let i = 0; i < l; i++) {
                let key = keys[i];

                if (userConfigs[key] !== null && userConfigs[key] !== undefined)
                    configs[key] = userConfigs[key];

            }

            if (callback) callback(userConfigs);
        }
    );
}

function saveAllSettings() {
    chrome.storage.sync.set(configs);
}