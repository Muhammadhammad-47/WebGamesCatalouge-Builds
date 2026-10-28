////////////////////////////////////////////////////////////
// CANVAS LOADER
////////////////////////////////////////////////////////////

 /*!
 * 
 * START CANVAS PRELOADER - This is the function that runs to preload canvas asserts
 * 
 */
function initPreload(){
	toggleLoader(true);
	
	checkMobileEvent();
	
	$(window).resize(function(){
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(checkMobileOrientation, 1000);
	});
	resizeGameFunc();
	
	var preferXHR = window.location.protocol.indexOf('http') === 0;
	loader = new createjs.LoadQueue(preferXHR);
	loader.setMaxConnections(16);
	manifest=[
			{src:'assets/logo.png', id:'logo'},
			{src:'assets/button_arrow.png', id:'buttonArrow'},
			{src:'assets/icon_tick.png', id:'iconTick'},
			{src:'assets/item_level.png', id:'itemLevel'},
			{src:'assets/item_level_lock.png', id:'itemLevelLock'},
			{src:'assets/item_current.png', id:'itemCurrent'},
			{src:'assets/item_skipped.png', id:'itemSkip'},
			{src:'assets/icon_x.png', id:'iconX'},
			{src:'assets/button_continue.png', id:'buttonContinue'},
			{src:'assets/level_complete_text.png', id:'levelCompleteText'},
			{src:'assets/icon_play.png', id:'iconPlay'},
			{src:'assets/button_sound_on.png', id:'buttonSoundOn'},
			{src:'assets/button_sound_off.png', id:'buttonSoundOff'},
			{src:'assets/button_music_on.png', id:'buttonMusicOn'},
			{src:'assets/button_music_off.png', id:'buttonMusicOff'},
			{src:'assets/round_button_grey.png', id:'buttonSettings'},
			{src:'assets/button_home.png', id:'buttonHome'},
			{src:'assets/icon_restart.png', id:'iconRestart'},
			{src:'assets/icon_undo.png', id:'iconUndo'},
			{src:'assets/icon_skip.png', id:'iconSkip'},
			{src:'assets/icon_video.png', id:'iconVideo'},
			{src:'assets/icon_revive.png', id:'iconRevive'},
			{src:'assets/hand.png', id:'hand'}

	];
	
	
	soundOn = true;
	if($.browser.mobile || isTablet){
		if(!enableMobileSound){
			soundOn=false;
		}
	}else{
		if(!enableDesktopSound){
			soundOn=false;
		}
	}
	
	if(soundOn){
		manifest.push({src:'assets/sounds/sound_click.mp3', id:'soundButton'});
		manifest.push({src:'assets/sounds/sound_start.mp3', id:'soundStart'});
		manifest.push({src:'assets/sounds/sound_result.mp3', id:'soundResult'});
		manifest.push({src:'assets/sounds/sound_complete.mp3', id:'soundComplete'});
		manifest.push({src:'assets/sounds/sound_connect.mp3', id:'soundConnect'});
		manifest.push({src:'assets/sounds/sound_error.mp3', id:'soundError'});
		manifest.push({src:'assets/sounds/sound_select.mp3', id:'soundSelect'});
		manifest.push({src:'assets/sounds/sound_reset.mp3', id:'soundReset'});
		manifest.push({src:'assets/sounds/sound_undo.mp3', id:'soundUndo'});
		manifest.push({src:'assets/sounds/sound_stroke.mp3', id:'soundStroke'});
		manifest.push({src:'assets/sounds/sound_unlock.mp3', id:'soundUnlock'});
		manifest.push({src:'assets/sounds/music_main.mp3', id:'musicMain'});
		manifest.push({src:'assets/sounds/music_game.mp3', id:'musicGame'});
		
		createjs.Sound.alternateExtensions = ["ogg"];
		loader.installPlugin(createjs.Sound);
	}
	
	loader.addEventListener("complete", handleComplete);
	loader.addEventListener("fileload", fileComplete);
	loader.addEventListener("error",handleFileError);
	loader.on("progress", handleProgress, this);
	loader.loadManifest(manifest);
}

/*!
 * 
 * CANVAS FILE COMPLETE EVENT - This is the function that runs to update when file loaded complete
 * 
 */
function fileComplete(evt) {
	var item = evt.item;
	//console.log("Event Callback file loaded ", evt.item.id);
}

/*!
 * 
 * CANVAS FILE HANDLE EVENT - This is the function that runs to handle file error
 * 
 */
function handleFileError(evt) {
	console.log("error ", evt);
}

/*!
 * 
 * CANVAS PRELOADER UPDATE - This is the function that runs to update preloder progress
 * 
 */
function handleProgress() {
	$('#mainLoader span').html(Math.round(loader.progress/1*100)+'%');
}

/*!
 * 
 * CANVAS PRELOADER COMPLETE - This is the function that runs when preloader is complete
 * 
 */
function handleComplete() {
	if (typeof CielAds !== 'undefined' && typeof CielAds.showPreroll === 'function') {
		CielAds.showPreroll(function() {
			toggleLoader(false);
			initMain();
		});
	} else {
		toggleLoader(false);
		initMain();
	}
};

/*!
 * 
 * TOGGLE LOADER - This is the function that runs to display/hide loader
 * 
 */
function toggleLoader(con){
	if(con){
		$('#mainLoader').css('display', 'flex').show();
	}else{
		$('#mainLoader').hide();
	}
}