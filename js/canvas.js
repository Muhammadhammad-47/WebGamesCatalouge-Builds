////////////////////////////////////////////////////////////
// CANVAS
////////////////////////////////////////////////////////////
var stage
var canvasW=0;
var canvasH=0;

/*!
 * 
 * START GAME CANVAS - This is the function that runs to setup game canvas
 * 
 */
function initGameCanvas(w,h){
	var gameCanvas = document.getElementById("gameCanvas");
	gameCanvas.width = w;
	gameCanvas.height = h;
	
	canvasW=w;
	canvasH=h;
	stage = new createjs.Stage("gameCanvas");
	
	createjs.Touch.enable(stage);
	stage.enableMouseOver(20);
	stage.mouseMoveOutside = true;
	
	createjs.Ticker.framerate = 60;
	createjs.Ticker.addEventListener("tick", tick);
}

var guide = false;
var canvasContainer,resultButtonContainer, bgResultContainer, levelNumberContainer, gameContainer, instructionContainer, mapContainer, objectsContainer, resultContainer, scoreContainer, lifeContainer, moveContainer,levelSelectContainer, confirmContainer, buttonUndoContainer, buttonSkipContainer, buttonRetryContainer, buttonReviveContainer, buttonSkip2Container;
var guideline, buttonOk, result, shadowResult, buttonUndoContainerPortrait, gameOverContainer, buttonSkipContainerPortrait, buttonRetryContainerPortrait, buttonReplay,levelCompleteText, iconPlay, buttonFullscreen, buttonSoundOn, buttonSoundOff, homeButton;

$.puzzle = {};
$.level = {};

/*!
 * 
 * BUILD GAME CANVAS ASSERTS - This is the function that runs to build game canvas asserts
 * 
 */
function buildGameCanvas(){
	canvasContainer = new createjs.Container();
	levelContainer = new createjs.Container();
	gameContainer = new createjs.Container();
	statusContainer = new createjs.Container();
	statusInnerContainer = new createjs.Container();
	puzzleContainer = new createjs.Container();
	puzzleDotContainer = new createjs.Container();
	puzzleEditContainer = new createjs.Container();
	puzzleGuideContainer = new createjs.Container();
	puzzleAnimateContainer = new createjs.Container();
	puzzleStrokeContainer = new createjs.Container();
	scoreContainer = new createjs.Container();
	lifeContainer = new createjs.Container();
	resultContainer = new createjs.Container();
	confirmContainer = new createjs.Container();
	levelSelectContainer = new createjs.Container();
	levelNumberContainer = new createjs.Container();
	buttonUndoContainer = new createjs.Container();
	buttonUndoContainerPortrait = new createjs.Container();
	buttonSkipContainer = new createjs.Container();
	buttonRetryContainer = new createjs.Container();
	buttonReviveContainer = new createjs.Container();
	buttonSkip2Container = new createjs.Container();
	resultButtonContainer = new createjs.Container();
	bgResultContainer = new createjs.Container();
	buttonRetryContainerPortrait = new createjs.Container();
	buttonSkipContainerPortrait = new createjs.Container();
	gameOverContainer = new createjs.Container();
	

	//select
	//levels
	//level
	var levelData = {sX:0, sY:0, x:0, y:0, space:5, size:80, count:0};
	var totalW = (selectData.column-1) * levelData.size;
	totalW += (selectData.column-1) * levelData.space;
	var totalH = (selectData.row-1) * levelData.size;
	totalH += (selectData.row-1) * levelData.space;

	levelData.sX = -(totalW/2);
	levelData.sY = -(totalH/2);
	levelData.y = levelData.sY;

	for(var r=0; r<selectData.row; r++){
		levelData.x = levelData.sX;
		for(var c=0; c<selectData.column; c++){
			$.level[r+'_'+c] = new createjs.Bitmap(loader.getResult('itemLevelLock'));
			centerReg($.level[r+'_'+c]);
			$.level[r+'_'+c].x = levelData.x;
			$.level[r+'_'+c].y = levelData.y;

			$.level[r+'_current_'+c] = new createjs.Bitmap(loader.getResult('itemLevel'));
			centerReg($.level[r+'_current_'+c]);
			$.level[r+'_current_'+c].x = levelData.x;
			$.level[r+'_current_'+c].y = levelData.y;

			$.level[r+'_unlock_'+c] = new createjs.Bitmap(loader.getResult('itemCurrent'));
			centerReg($.level[r+'_unlock_'+c]);
			$.level[r+'_unlock_'+c].x = levelData.x;
			$.level[r+'_unlock_'+c].y = levelData.y;
			$.level[r+'_iconTick_'+c] = new createjs.Bitmap(loader.getResult('iconTick'));
			centerReg($.level[r+'_iconTick_'+c]);
			$.level[r+'_iconTick_'+c].x = levelData.x+25;
			$.level[r+'_iconTick_'+c].y = levelData.y+25;
			$.level[r+'_iconTick_'+c].visible = false;	

			$.level[r+'_skip_'+c] = new createjs.Bitmap(loader.getResult('itemSkip'));
			centerReg($.level[r+'_skip_'+c]);
			$.level[r+'_skip_'+c].x = levelData.x;
			$.level[r+'_skip_'+c].y = levelData.y;
			$.level[r+'_iconX_'+c] = new createjs.Bitmap(loader.getResult('iconX'));
			centerReg($.level[r+'_iconX_'+c]);
			$.level[r+'_iconX_'+c].x = levelData.x+25;
			$.level[r+'_iconX_'+c].y = levelData.y+25;
			$.level[r+'_iconX_'+c].visible = false;	

			$.level[r+'_text_'+c] = new createjs.Text();
			$.level[r+'_text_'+c].font = "30px lilitaone";
			$.level[r+'_text_'+c].color = '#000000';
			$.level[r+'_text_'+c].textAlign = "center";
			$.level[r+'_text_'+c].textBaseline='alphabetic';
			$.level[r+'_text_'+c].x = levelData.x;
			$.level[r+'_text_'+c].y = levelData.y + 12;
			$.level[r+'_text_'+c].hitArea = new createjs.Shape(new createjs.Graphics().beginFill("#000").drawRect(0,0,0,0));	

			$.level[r+'_unlock_'+c].text = $.level[r+'_text_'+c];
			$.level[r+'_skip_'+c].text = $.level[r+'_text_'+c];
			$.level[r+'_current_'+c].text = $.level[r+'_text_'+c];

			levelContainer.addChild($.level[r+'_'+c], $.level[r+'_current_'+c], $.level[r+'_unlock_'+c], $.level[r+'_iconTick_'+c], $.level[r+'_skip_'+c], $.level[r+'_iconX_'+c], $.level[r+'_text_'+c]);
			
			levelData.x += levelData.size + levelData.space;
			levelData.count++;
		}
		levelData.y += levelData.size + levelData.space;
	}

	homeButton = new createjs.Bitmap(loader.getResult('buttonHome'));
	homeButton.scaleX = 0.65;
	homeButton.scaleY = 0.65;
	centerReg(homeButton);

	homeBg = new createjs.Shape();	
	homeBg.graphics.setStrokeStyle(2, 'round', 'round')
    .beginStroke("#000000")
    .beginFill("#E6E6E6")
    .drawCircle(0, 0, 30);

	


	bgLevelSelect = new createjs.Shape();	
	bgLevelSelect.graphics.beginFill("#4BB8E9").command;
	bgLevelSelect.graphics.setStrokeStyle(2, 'round', 'round').beginStroke("#000000");
	bgLevelSelect.graphics.drawRect(0, 0, 300, 50, 20);
	centerReg(bgLevelSelect);

	selectLevelTitleTxt = new createjs.Text();
	selectLevelTitleTxt.font = "35px lilitaone";
	selectLevelTitleTxt.color = '#fff';
	selectLevelTitleTxt.textAlign = "center";
	selectLevelTitleTxt.textBaseline='alphabetic';
	selectLevelTitleTxt.x=150;
	selectLevelTitleTxt.y=38;
	selectLevelTitleTxt.text = textDisplay.selectLevel;

	levelSelectContainer.addChild(bgLevelSelect, selectLevelTitleTxt);

	buttonLevelArrowL = new createjs.Bitmap(loader.getResult('buttonArrow'));
	buttonLevelArrowL.scaleX = -0.7;
	centerReg(buttonLevelArrowL);

	buttonLevelArrowR = new createjs.Bitmap(loader.getResult('buttonArrow'));
	buttonLevelArrowR.scaleX = 0.7;
	centerReg(buttonLevelArrowR);

	levelContainer.addChild( buttonLevelArrowL, buttonLevelArrowR);
	
	//game
	drawGuide = new createjs.Bitmap(loader.getResult('hand'));
	centerReg(drawGuide);
	drawGuide.scaleX = 0.5;
	drawGuide.scaleY = 0.5;
	drawGuide.visible = false;


	
	buttonRetry = new createjs.Shape();	
	gameData.fillCommand = buttonRetry.graphics.beginFill("#99E25F").command;
	buttonRetry.graphics.setStrokeStyle(2, 'round', 'round').beginStroke("#000000");
	buttonRetry.graphics.drawRoundRect(0, 0, 150, 50, 20); 

	buttonRetryTxt = new createjs.Text();
	buttonRetryTxt.font = "25px lilitaone";
	buttonRetryTxt.color = '#000000';
	buttonRetryTxt.textAlign = "center";
	buttonRetryTxt.textBaseline='alphabetic';
	buttonRetryTxt.text = textDisplay.retry;
	buttonRetryTxt.x = 65;
	buttonRetryTxt.y = 35;

	iconRetry = new createjs.Bitmap(loader.getResult('iconRestart'));
	centerReg(iconRetry);
	iconRetry.scaleX = 0.5;
	iconRetry.scaleY = 0.5;
	iconRetry.x = 125;
	iconRetry.y = 25;

	buttonRetryContainer.addChild(buttonRetry, buttonRetryTxt,iconRetry);

	buttonRetryPortrait = new createjs.Shape();	
	buttonRetryPortrait.graphics.beginFill("#99E25F").command;
	buttonRetryPortrait.graphics.setStrokeStyle(2, 'round', 'round').beginStroke("#000000");
	buttonRetryPortrait.graphics.drawRoundRect(0, 0, 70, 60, 20); 

	iconRetryPortrait = new createjs.Bitmap(loader.getResult('iconRestart'));
	centerReg(iconRetryPortrait);
	iconRetryPortrait.scaleX = 0.6;
	iconRetryPortrait.scaleY = 0.6;
	iconRetryPortrait.x = 35;
	iconRetryPortrait.y = 30;

	buttonRetryContainerPortrait.addChild(buttonRetryPortrait, iconRetryPortrait);

	buttonUndo = new createjs.Shape();	
	gameData.fillCommand = buttonUndo.graphics.beginFill("#4BB8E9").command;
	buttonUndo.graphics.setStrokeStyle(2, 'round', 'round').beginStroke("#000000");
	buttonUndo.graphics.drawRoundRect(0, 0, 150, 50, 20);

	buttonUndoTxt = new createjs.Text();
	buttonUndoTxt.font = "25px lilitaone";
	buttonUndoTxt.color = '#000000';
	buttonUndoTxt.textAlign = "center";
	buttonUndoTxt.textBaseline='alphabetic';
	buttonUndoTxt.text = textDisplay.undo;
	buttonUndoTxt.x = 65;
	buttonUndoTxt.y = 35;

	iconUndo = new createjs.Bitmap(loader.getResult('iconUndo'));
	centerReg(iconUndo);
	iconUndo.scaleX = 0.5;
	iconUndo.scaleY = 0.5;
	iconUndo.x = 125;
	iconUndo.y = 25;

	iconUndoReward = new createjs.Bitmap(loader.getResult('iconVideo'));
	centerReg(iconUndoReward);
	iconUndoReward.scaleX = 0.5;
	iconUndoReward.scaleY = 0.5;
	iconUndoReward.x = 5;
	iconUndoReward.y = 5;

	buttonUndoContainer.addChild(buttonUndo, buttonUndoTxt,iconUndo,iconUndoReward);

	buttonUndoPortrait = new createjs.Shape();	
	buttonUndoPortrait.graphics.beginFill("#4BB8E9").command;
	buttonUndoPortrait.graphics.setStrokeStyle(2, 'round', 'round').beginStroke("#000000");
	buttonUndoPortrait.graphics.drawRoundRect(0, 0, 70, 60, 20);

	iconUndoPortrait = new createjs.Bitmap(loader.getResult('iconUndo'));
	centerReg(iconUndoPortrait);
	iconUndoPortrait.scaleX = 0.6;
	iconUndoPortrait.scaleY = 0.6;
	iconUndoPortrait.x = 35;
	iconUndoPortrait.y = 30;

	iconUndoRewardP = new createjs.Bitmap(loader.getResult('iconVideo'));
	centerReg(iconUndoRewardP);
	iconUndoRewardP.scaleX = 0.6;
	iconUndoRewardP.scaleY = 0.6;
	iconUndoRewardP.x = 65;
	iconUndoRewardP.y = 5;

	buttonUndoContainerPortrait.addChild(buttonUndoPortrait,iconUndoPortrait,iconUndoRewardP);


	buttonSkip = new createjs.Shape();	
	gameData.fillCommand = buttonSkip.graphics.beginFill("#4BB8E9").command;
	buttonSkip.graphics.setStrokeStyle(2, 'round', 'round').beginStroke("#000000");
	buttonSkip.graphics.drawRoundRect(0, 0, 150, 50, 20);

	buttonSkipTxt = new createjs.Text();
	buttonSkipTxt.font = "25px lilitaone";
	buttonSkipTxt.color = '#000000';
	buttonSkipTxt.textAlign = "center";
	buttonSkipTxt.textBaseline='alphabetic';
	buttonSkipTxt.text = textDisplay.skip;
	buttonSkipTxt.x = 65;
	buttonSkipTxt.y = 35;

	iconSkip = new createjs.Bitmap(loader.getResult('iconSkip'));
	centerReg(iconSkip);
	iconSkip.scaleX = 0.5;
	iconSkip.scaleY = 0.5;
	iconSkip.x = 125;
	iconSkip.y = 25;

	iconUndoReward2 = new createjs.Bitmap(loader.getResult('iconVideo'));
	centerReg(iconUndoReward2);
	iconUndoReward2.scaleX = 0.5;
	iconUndoReward2.scaleY = 0.5;
	iconUndoReward2.x = 5;
	iconUndoReward2.y = 5;

	buttonSkipContainer.addChild(buttonSkip, buttonSkipTxt,iconSkip,iconUndoReward2);

	buttonSkipPortrait = new createjs.Shape();	
	buttonSkipPortrait.graphics.beginFill("#4BB8E9").command;
	buttonSkipPortrait.graphics.setStrokeStyle(2, 'round', 'round').beginStroke("#000000");
	buttonSkipPortrait.graphics.drawRoundRect(0, 0, 150, 60, 20);

	buttonSkipTxtPortrait = new createjs.Text();
	buttonSkipTxtPortrait.font = "27px lilitaone";
	buttonSkipTxtPortrait.color = '#000000';
	buttonSkipTxtPortrait.textAlign = "center";
	buttonSkipTxtPortrait.textBaseline='alphabetic';
	buttonSkipTxtPortrait.text = textDisplay.skip;
	buttonSkipTxtPortrait.x = 65;
	buttonSkipTxtPortrait.y = 40;

	iconSkipPortrait = new createjs.Bitmap(loader.getResult('iconSkip'));
	centerReg(iconSkipPortrait);
	iconSkipPortrait.scaleX = 0.6;
	iconSkipPortrait.scaleY = 0.6;
	iconSkipPortrait.x = 125;
	iconSkipPortrait.y = 30;

	iconUndoReward2Portrait = new createjs.Bitmap(loader.getResult('iconVideo'));
	centerReg(iconUndoReward2Portrait);
	iconUndoReward2Portrait.scaleX = 0.6;
	iconUndoReward2Portrait.scaleY = 0.6;
	iconUndoReward2Portrait.x = 5;
	iconUndoReward2Portrait.y = 5;

	buttonSkipContainerPortrait.addChild(buttonSkipPortrait, buttonSkipTxtPortrait,iconSkipPortrait,iconUndoReward2Portrait);

	bgScore = new createjs.Shape();	
	gameData.fillCommand = bgScore.graphics.beginFill("#4BB8E9").command;
	bgScore.graphics.setStrokeStyle(2, 'round', 'round').beginStroke("#000000");
	bgScore.graphics.drawRoundRect(0, 0, 130, 50, 20); 

	scoreTxt = new createjs.Text();
	scoreTxt.font = "30px lilitaone";
	scoreTxt.color = '#fff';
	scoreTxt.textAlign = "center";
	scoreTxt.textBaseline='alphabetic';
	scoreTxt.text = textDisplay.share;
	scoreTxt.x = 65;
	scoreTxt.y = 35;

	scoreContainer.addChild(bgScore, scoreTxt);


	levelNumberTxt = new createjs.Text();
	levelNumberTxt.font = "40px lilitaone";
	levelNumberTxt.color = '#000000';
	levelNumberTxt.textAlign = "center";
	levelNumberTxt.textBaseline='alphabetic';
	levelNumberTxt.x = 0;
	levelNumberTxt.y = 38;

	levelNumberContainer.addChild( levelNumberTxt);

	bgLife = new createjs.Shape();	
	gameData.fillCommand = bgLife.graphics.beginFill("#4BB8E9").command;
	bgLife.graphics.setStrokeStyle(2, 'round', 'round').beginStroke("#000000");
	bgLife.graphics.drawRoundRect(0, 0, 180, 50, 20);

	lifeContainer.addChild(bgLife);
	for(var n=0; n<gameData.life; n++){
		var redLife = new createjs.Shape();	
		gameData.fillCommand = redLife.graphics.beginFill("yellow").drawCircle(0, 0, 15);
		redLife.x = 50 + (n*40);
		redLife.y = 25;
		lifeContainer.addChild(redLife);
	}
	
	
	
	//result

	bgResult = new createjs.Shape();	
	bgResult.graphics.beginFill("#4BB8E9").command;
	bgResult.graphics.setStrokeStyle(2, 'round', 'round').beginStroke("#000000");
	bgResult.graphics.drawRect(0, 0, 300, 50, 20);


	resultCompleteTxt = new createjs.Text();
	resultCompleteTxt.font = "30px lilitaone";
	resultCompleteTxt.color = '#fff';
	resultCompleteTxt.textAlign = "center";
	resultCompleteTxt.textBaseline='alphabetic';
	resultCompleteTxt.x=150;
	resultCompleteTxt.y=38;
	resultCompleteTxt.text = textDisplay.resultComplete;

	bgResultContainer.addChild(bgResult, resultCompleteTxt);

	buttonContinue = new createjs.Bitmap(loader.getResult('buttonContinue'));
	buttonContinue.scaleX = 0.65;
	buttonContinue.scaleY = 0.65;	
	centerReg(buttonContinue);

	resultDescTxt = new createjs.Text();
	resultDescTxt.font = "40px lilitaone";
	resultDescTxt.lineHeight = 45;
	resultDescTxt.color = '#000000';
	resultDescTxt.textAlign = "center";
	resultDescTxt.textBaseline='alphabetic';
	resultDescTxt.text = '';

	levelCompleteText = new createjs.Bitmap(loader.getResult('levelCompleteText'));
	centerReg(levelCompleteText);
	levelCompleteText.scaleX = 0.65;
	levelCompleteText.scaleY = 0.65;


	iconPlay = new createjs.Bitmap(loader.getResult('iconPlay'));
	centerReg(iconPlay);

	resultButtonContainer.addChild( buttonContinue, resultDescTxt, iconPlay);
	resultContainer.addChild( resultButtonContainer, levelCompleteText);
	
	var scale=0.60;

	buttonSoundOn = new createjs.Bitmap(loader.getResult('buttonSoundOn'));
	centerReg(buttonSoundOn);
	buttonSoundOn.scaleX=scale;
	buttonSoundOn.scaleY=scale;
	buttonSoundOff = new createjs.Bitmap(loader.getResult('buttonSoundOff'));
	centerReg(buttonSoundOff);
	buttonSoundOff.scaleX=scale;
	buttonSoundOff.scaleY=scale;
	buttonSoundOn.visible = false;
	buttonMusicOn = new createjs.Bitmap(loader.getResult('buttonMusicOn'));
	centerReg(buttonMusicOn);
	buttonMusicOn.scaleX=scale;
	buttonMusicOn.scaleY=scale;
	buttonMusicOff = new createjs.Bitmap(loader.getResult('buttonMusicOff'));
	centerReg(buttonMusicOff);
	buttonMusicOff.scaleX=scale;
	buttonMusicOff.scaleY=scale;
	buttonMusicOn.visible = false;
	buttonSettings = new createjs.Bitmap(loader.getResult('buttonSettings'));
	centerReg(buttonSettings);
	buttonSettings.scaleX=scale;
	buttonSettings.scaleY=scale;

	settingsBg = new createjs.Shape();	
	settingsBg.graphics.setStrokeStyle(2, 'round', 'round')
    .beginStroke("#000000")
    .beginFill("#E6E6E6")
    .drawCircle(0, 0, 30);

	musicBg = new createjs.Shape();	
	musicBg.graphics.setStrokeStyle(2, 'round', 'round')
    .beginStroke("#000000")
    .beginFill("#E6E6E6")
    .drawCircle(0, 0, 30);

	soundBg = new createjs.Shape();	
	soundBg.graphics.setStrokeStyle(2, 'round', 'round')
    .beginStroke("#000000")
    .beginFill("#E6E6E6")
    .drawCircle(0, 0, 30);

	
	createHitarea(buttonSoundOn);
	createHitarea(buttonSoundOff);
	createHitarea(buttonMusicOn);
	createHitarea(buttonMusicOff);
	createHitarea(homeButton);
	createHitarea(buttonSettings);
	optionsContainer = new createjs.Container();
	optionsContainer.addChild( musicBg, soundBg, buttonSoundOn, buttonSoundOff, buttonMusicOn, buttonMusicOff);
	optionsContainer.visible = false;

	
	//exit
	bgGameOver = new createjs.Shape();	
	bgGameOver.graphics.beginFill("#4BB8E9").command;
	bgGameOver.graphics.setStrokeStyle(2, 'round', 'round').beginStroke("#000000");
	bgGameOver.graphics.drawRect(0, 0, 300, 50, 20);

	gameOverTxt = new createjs.Text();
	gameOverTxt.font = "30px lilitaone";
	gameOverTxt.color = '#fff';
	gameOverTxt.textAlign = "center";
	gameOverTxt.textBaseline='alphabetic';
	gameOverTxt.x=150;
	gameOverTxt.y=38;
	gameOverTxt.text = textDisplay.gameOver;

	gameOverContainer.addChild(bgGameOver, gameOverTxt);

	bgExit = new createjs.Shape();	
	bgExit.graphics.beginFill("#ffffff").command;
	bgExit.graphics.setStrokeStyle(2, 'round', 'round').beginStroke("#000000");
	bgExit.graphics.drawRoundRect(0, 0, 400, 260, 20);


	buttonRevive = new createjs.Shape();	
	buttonRevive.graphics.beginFill("#99E25F").command;
	buttonRevive.graphics.setStrokeStyle(2, 'round', 'round').beginStroke("#000000");
	buttonRevive.graphics.drawRoundRect(0, 0, 180, 50, 20);

	buttonReviveTxt = new createjs.Text();
	buttonReviveTxt.font = "25px lilitaone";
	buttonReviveTxt.color = '#000000';
	buttonReviveTxt.textAlign = "center";
	buttonReviveTxt.textBaseline='alphabetic';
	buttonReviveTxt.text = textDisplay.revive;
	buttonReviveTxt.x = 75;
	buttonReviveTxt.y = 35;

	iconRevive = new createjs.Bitmap(loader.getResult('iconRevive'));
	centerReg(iconRevive);
	iconRevive.scaleX = 0.5;
	iconRevive.scaleY = 0.5;
	iconRevive.x = 145;
	iconRevive.y = 25;

	buttonReviveContainer.addChild(buttonRevive, buttonReviveTxt,iconRevive);

	buttonSkip2 = new createjs.Shape();	
	buttonSkip2.graphics.beginFill("#4BB8E9").command;
	buttonSkip2.graphics.setStrokeStyle(2, 'round', 'round').beginStroke("#000000");
	buttonSkip2.graphics.drawRoundRect(0, 0, 180, 50, 20);

	buttonSkip2Txt = new createjs.Text();
	buttonSkip2Txt.font = "25px lilitaone";
	buttonSkip2Txt.color = '#000000';
	buttonSkip2Txt.textAlign = "center";
	buttonSkip2Txt.textBaseline='alphabetic';
	buttonSkip2Txt.text = textDisplay.skip;
	buttonSkip2Txt.x = 75;
	buttonSkip2Txt.y = 35;

	iconSkip2 = new createjs.Bitmap(loader.getResult('iconSkip'));
	centerReg(iconSkip2);
	iconSkip2.scaleX = 0.5;
	iconSkip2.scaleY = 0.5;
	iconSkip2.x = 145;
	iconSkip2.y = 25;

	iconUndoReward4 = new createjs.Bitmap(loader.getResult('iconVideo'));
	centerReg(iconUndoReward4);
	iconUndoReward4.scaleX = 0.5;
	iconUndoReward4.scaleY = 0.5;
	iconUndoReward4.x = 5;
	iconUndoReward4.y = 5;

	buttonSkip2Container.addChild(buttonSkip2, buttonSkip2Txt,iconSkip2,iconUndoReward4);
	
	
	confirmContainer.addChild(bgExit, buttonReviveContainer, buttonSkip2Container);
	confirmContainer.visible = false;
	
	if(guide){
		guideline = new createjs.Shape();	
		guideline.graphics.setStrokeStyle(2).beginStroke('red').drawRect((stageW-contentW)/2, (stageH-contentH)/2, contentW, contentH);
	}
	
	puzzleContainer.addChild(puzzleGuideContainer, puzzleStrokeContainer, puzzleAnimateContainer, puzzleDotContainer, puzzleEditContainer,drawGuide);
	gameContainer.addChild(puzzleContainer, buttonRetryContainer, buttonUndoContainer, buttonUndoContainerPortrait, buttonRetryContainerPortrait, buttonSkipContainer, buttonSkipContainerPortrait, scoreContainer, lifeContainer,levelNumberContainer);

	
	canvasContainer.addChild(levelContainer,bgResultContainer, levelSelectContainer,gameOverContainer, gameContainer, resultContainer, confirmContainer, optionsContainer, settingsBg, buttonSettings, homeBg, homeButton, guideline);
	stage.addChild(canvasContainer);
	
	changeViewport(viewport.isLandscape);
	resizeGameFunc();
}

function changeViewport(isLandscape){
	if(isLandscape){
		//landscape
		stageW=landscapeSize.w;
		stageH=landscapeSize.h;
		contentW = landscapeSize.cW;
		contentH = landscapeSize.cH;
	}else{
		//portrait
		stageW=portraitSize.w;
		stageH=portraitSize.h;
		contentW = portraitSize.cW;
		contentH = portraitSize.cH;
	}
	
	gameCanvas.width = stageW;
	gameCanvas.height = stageH;
	
	canvasW=stageW;
	canvasH=stageH;
	
	changeCanvasViewport();
}

function changeCanvasViewport(){
	if(canvasContainer!=undefined){
		
		if(viewport.isLandscape){
		
			

			bgExit.x = (canvasW/2)-200;
			bgExit.y = (canvasH/2)-150;


			buttonReviveContainer.x = bgExit.x+110;
			buttonReviveContainer.y = bgExit.y+60;

			buttonSkip2Container.x = bgExit.x+110;
			buttonSkip2Container.y = bgExit.y+150;

		}else{


			bgExit.x = (canvasW/2)-200;
			bgExit.y = (canvasH/2)-150;


			buttonReviveContainer.x = bgExit.x+110;
			buttonReviveContainer.y = bgExit.y+60;

			buttonSkip2Container.x = bgExit.x+110;
			buttonSkip2Container.y = bgExit.y+150;

			
			//exit

		}
	}
}



/*!
 * 
 * RESIZE GAME CANVAS - This is the function that runs to resize game canvas
 * 
 */
function resizeCanvas(){
 	if(canvasContainer!=undefined){

		if(viewport.isLandscape){
		buttonSettings.x = (canvasW - offset.x) - 78;
		buttonSettings.y = offset.y + 50;

		settingsBg.x = buttonSettings.x;
		settingsBg.y = buttonSettings.y;

		homeButton.x = (offset.x) + 78;
		homeButton.y = offset.y + 50;

		homeBg.x = homeButton.x;
		homeBg.y = homeButton.y;

		levelSelectContainer.x = (canvasW/2)-150;
		levelSelectContainer.y = offset.y + 30;

		bgResultContainer.x = (canvasW/2) - 150;
		bgResultContainer.y = (offset.y + 30);

		gameOverContainer.x = (canvasW/2) - 150;
		gameOverContainer.y = (offset.y + 30);
		}else{
			
		buttonSettings.x = (canvasW - offset.x) - 60;
		buttonSettings.y = offset.y + 90;

		settingsBg.x = buttonSettings.x;
		settingsBg.y = buttonSettings.y;

		homeButton.x = (offset.x) + 60;
		homeButton.y = offset.y + 90;	

		homeBg.x = homeButton.x;
		homeBg.y = homeButton.y;

		levelSelectContainer.x = (canvasW/2)-150;
		levelSelectContainer.y = offset.y + 67;

		bgResultContainer.x = (canvasW/2) - 150;
		bgResultContainer.y = (offset.y + 67);

		gameOverContainer.x = (canvasW/2) - 150;
		gameOverContainer.y = (offset.y + 67);
		}

		
		var distanceNum = 68;
		var nextCount = 0;
		if(curPage != 'game'){
			
			buttonSoundOn.x = buttonSoundOff.x = buttonSettings.x;
			buttonSoundOn.y = buttonSoundOff.y = buttonSettings.y+distanceNum;
			buttonSoundOn.x = buttonSoundOff.x;
			buttonSoundOn.y = buttonSoundOff.y = buttonSettings.y+distanceNum;

			if (typeof buttonMusicOn != "undefined") {
				buttonMusicOn.x = buttonMusicOff.x = buttonSettings.x;
				buttonMusicOn.y = buttonMusicOff.y = buttonSettings.y+(distanceNum*2);
				buttonMusicOn.x = buttonMusicOff.x;
				buttonMusicOn.y = buttonMusicOff.y = buttonSettings.y+(distanceNum*2);
				nextCount = 2;
			}else{
				nextCount = 1;
			}
			
	
		}else{
			
			buttonSoundOn.x = buttonSoundOff.x = buttonSettings.x;
			buttonSoundOn.y = buttonSoundOff.y = buttonSettings.y+distanceNum;
			buttonSoundOn.x = buttonSoundOff.x;
			buttonSoundOn.y = buttonSoundOff.y = buttonSettings.y+distanceNum;

			if (typeof buttonMusicOn != "undefined") {
				buttonMusicOn.x = buttonMusicOff.x = buttonSettings.x;
				buttonMusicOn.y = buttonMusicOff.y = buttonSettings.y+(distanceNum*2);
				buttonMusicOn.x = buttonMusicOff.x;
				buttonMusicOn.y = buttonMusicOff.y = buttonSettings.y+(distanceNum*2);
				nextCount = 2;
			}else{
				nextCount = 1;
			}
			
	
			
		
			
		}

		musicBg.x = buttonMusicOn.x;
		musicBg.y = buttonMusicOn.y;
		soundBg.x = buttonSoundOn.x;
		soundBg.y = buttonSoundOn.y;

		resizePuzzle();
	}
}

/*!
 * 
 * REMOVE GAME CANVAS - This is the function that runs to remove game canvas
 * 
 */
 function removeGameCanvas(){
	 stage.autoClear = true;
	 stage.removeAllChildren();
	 stage.update();
	 createjs.Ticker.removeEventListener("tick", tick);
	 createjs.Ticker.removeEventListener("tick", stage);
 }

/*!
 * 
 * CANVAS LOOP - This is the function that runs for canvas loop
 * 
 */ 
function tick(event) {
	updateGame();
	stage.update(event);
}

/*!
 * 
 * CANVAS MISC FUNCTIONS
 * 
 */
function centerReg(obj){
	if(obj.image == undefined){
		return;
	}

	obj.regX=obj.image.naturalWidth/2;
	obj.regY=obj.image.naturalHeight/2;
}

function createHitarea(obj){
	obj.hitArea = new createjs.Shape(new createjs.Graphics().beginFill("#000").drawRect(0, 0, obj.image.naturalWidth, obj.image.naturalHeight));	
}