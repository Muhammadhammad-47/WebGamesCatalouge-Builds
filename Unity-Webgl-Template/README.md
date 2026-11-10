# CIEL Ads SDK: Unity WebGL games

C# API for ads in Unity WebGL games. It runs on the same `ciel-ads.js` as the HTML5 games,
so ads behave the same in every CIEL game.

## 1. Import

Copy this `Assets` folder into your Unity project (merge it with your own `Assets`):

```
Assets/CielAds/Scripts/CielAds.cs            the C# API
Assets/CielAds/Plugins/WebGL/CielAds.jslib   C# <-> JavaScript bridge
Assets/CielAds/Examples/CielAdsExample.cs    usage example (safe to delete)
Assets/WebGLTemplates/CielAds/               WebGL template: CIEL loading screen + ads SDK
```

## 2. Select the template and set your AdSense id

1. **Edit → Project Settings → Player → WebGL → Resolution and Presentation**.
2. Under **WebGL Template**, choose **CielAds**.
3. Fill in the two fields that appear below it:
   - `CIEL_AD_CLIENT`: your AdSense id, `ca-pub-XXXXXXXXXXXXXXXX`
   - `CIEL_ADS_MODE`: leave empty. It then shows test ads on localhost and Google ads on the live site.
     Other values: `google-test`, `simulate`, `off`.

## 3. Request ads from C#

```csharp
using CIEL.Ads;

// Interstitial ad
CielAds.ShowInterstitial();

// Interstitial ad, then continue the game after it
CielAds.ShowInterstitial(() => LoadNextLevel());

// Rewarded ad: write this game's reward inside the callback.
// It runs ONLY when the player watched the whole ad.
CielAds.ShowRewarded(() =>
{
    coins += 100;
});

// Optional second callback: the ad was closed early or not available
CielAds.ShowRewarded(() => RevivePlayer(), () => ShowGameOver());
```

No scene setup is needed. The first call creates a hidden `[CielAds]` object that survives scene loads.

While an ad is on screen, the SDK sets `Time.timeScale = 0` and `AudioListener.pause = true`, then
restores both afterwards. You can turn either off on the `[CielAds]` component.

Callbacks always run, even with no ad available, an ad blocker or a timeout.

## Extras

```csharp
CielAds.AdStarted  += placement => { };   // the ad appeared (the game is paused)
CielAds.AdEnded    += placement => { };   // the ad closed (the game is resumed)
CielAds.AdFinished += result    => { };   // the full result of every request

CielAds.Show(true, "bonus", r => Debug.Log(r.status)); // full AdResult (rewarded: true)
CielAds.ShowRewarded(onReward, onFail, "revive");      // optional placement name for reports
bool showing = CielAds.IsShowingAd;
string mode  = CielAds.Mode;   // google, google-test, simulate, off, editor
```

## Testing

- **Unity Editor:** a fake ad runs for 2 seconds. Set its length, and whether rewarded ads grant the reward, on the `[CielAds]` component.
- **WebGL build on localhost:** simulated test ads with Close and Claim buttons.
- **Live site with Google's test ads:** set `CIEL_ADS_MODE` to `google-test`, or add `?ads=google-test` to the URL.

## Updating ciel-ads.js

`Assets/WebGLTemplates/CielAds/TemplateData/ciel-ads.js` is the same file as `html5/ciel-ads.js`.
When you change one, copy it over the other.
