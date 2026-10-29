(function() {
    'use strict';
    var PokiSDK = {
        init: function() {
            return Promise.resolve();
        },
        initWithVideoHB: function() {
            return Promise.resolve();
        },
        commercialBreak: function() {
            return new Promise(function(resolve) {
                setTimeout(resolve, 50);
            });
        },
        rewardedBreak: function() {
            return new Promise(function(resolve) {
                setTimeout(function() {
                    resolve(true);
                }, 50);
            });
        },
        displayAd: function(e, t, o, i) {
            if (o) o();
            if (i) i(true);
        },
        destroyAd: function() {},
        getLeaderboard: function() {
            return Promise.resolve([]);
        },
        shareableURL: function() {
            return Promise.resolve(window.location.href);
        },
        getURLParam: function() {
            return "";
        },
        getLanguage: function() {
            return (navigator.language || "en").toLowerCase().split("-")[0];
        },
        getDeviceInfo: function() {
            return { category: /mobile|android|iphone|ipad/i.test(navigator.userAgent) ? "mobile" : "desktop" };
        },
        isAdBlocked: function() {
            return false;
        },
        getUser: function() {
            return Promise.resolve({ id: "local-user" });
        },
        getToken: function() {
            return Promise.resolve("local-token");
        },
        login: function() {
            return Promise.resolve();
        },
        generateScreenshot: function() {
            return Promise.resolve("");
        },
        gameLoadingStart: function() {},
        gameLoadingProgress: function() {},
        gameLoadingFinished: function() {},
        gameplayStart: function() {},
        gameplayStop: function() {},
        happyTime: function() {},
        muteAd: function() {},
        roundEnd: function() {},
        roundStart: function() {},
        sendHighscore: function() {},
        setDebug: function() {},
        setLogging: function() {},
        setPlayerAge: function() {},
        setPlaytestCanvas: function() {},
        playtestSetCanvas: function() {},
        playtestCaptureHtmlOnce: function() {},
        playtestCaptureHtmlForce: function() {},
        playtestCaptureHtmlOn: function() {},
        playtestCaptureHtmlOff: function() {},
        measure: function() {},
        customEvent: function() {},
        captureError: function() {},
        logError: function() {},
        movePill: function() {},
        showLeaderboard: function() {},
        enableEventTracking: function() {}
    };
    window.PokiSDK = PokiSDK;
})();
