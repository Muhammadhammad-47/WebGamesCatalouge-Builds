////////////////////////////////////////////////////////////
// GAME v1.1
////////////////////////////////////////////////////////////

/*!
 * 
 * GAME SETTING CUSTOMIZATION START
 * 
 */

//game settings
var gameSettings = {
	colors: [
		{ guide: '#CCCCCC', drawStroke: '#303133', drawDot: '#c42a2a', completeStroke: '#ff8908', completeDot: '#e86e0a' },
		{ guide: '#CCCCCC', drawStroke: '#303133', drawDot: '#64a511', completeStroke: '#ff8908', completeDot: '#e86e0a' },
		{ guide: '#CCCCCC', drawStroke: '#303133', drawDot: '#5923af', completeStroke: '#ff8908', completeDot: '#e86e0a' },
		{ guide: '#CCCCCC', drawStroke: '#303133', drawDot: '#3d99d8', completeStroke: '#ff8908', completeDot: '#e86e0a' },
		{ guide: '#CCCCCC', drawStroke: '#303133', drawDot: '#174aaf', completeStroke: '#ff8908', completeDot: '#e86e0a' },
		{ guide: '#CCCCCC', drawStroke: '#303133', drawDot: '#17968a', completeStroke: '#ff8908', completeDot: '#e86e0a' },
		{ guide: '#CCCCCC', drawStroke: '#303133', drawDot: '#cc2364', completeStroke: '#ff8908', completeDot: '#e86e0a' },
		{ guide: '#CCCCCC', drawStroke: '#303133', drawDot: '#424852', completeStroke: '#ff8908', completeDot: '#e86e0a' },
		{ guide: '#CCCCCC', drawStroke: '#303133', drawDot: '#c17a49', completeStroke: '#ff8908', completeDot: '#e86e0a' },
		{ guide: '#CCCCCC', drawStroke: '#303133', drawDot: '#ce9436', completeStroke: '#ff8908', completeDot: '#e86e0a' },
	],
	dotRadius: 20,
	strokeSize: 15,
};

//game text display
var textDisplay = {
	selectLevel: 'SELECT LEVEL',
	exitTitle: 'EXIT GAME',
	exitMessage: 'ARE YOU SURE\nYOU WANT TO\nQUIT GAME?',
	share: 'SHARE YOUR SCORE:',
	gameOver: 'GAME OVER',
	resultComplete: 'CONGRATULATIONS',
	resultDesc: 'LEVEL [NUMBER]',
	retry: 'RETRY',
	undo: 'UNDO',
	skip: 'SKIP',
	revive: 'REVIVE',
	play: 'PLAY',
	comingSoon: 'NEW LEVELS COMING SOON!'
}

//Social share, [SCORE] will replace with game score
var shareEnable = true; //toggle share
var shareTitle = 'Highscore on One Stroke is Level [SCORE]';//social share score title
var shareMessage = 'Level [SCORE] is mine new highscore on One Stroke game! Try it now!'; //social share score message


/*!
 *
 * GAME SETTING CUSTOMIZATION END
 *
 */
$.editor = { enable: false };
var playerData = { score: 0 };
var gameData = { paused: true, levelNum: 0, colors: [], colorIndex: 0, strokeData: { x: 0, y: 0 }, drawGuideW: 600, drawGuideH: 600, levelCompleted: 1, life: 3, skippedLevels: [] };
var tweenData = { score: 0, tweenScore: 0 };
var timeData = { enable: false, startDate: null, nowDate: null, timer: 0, oldTimer: 0 };
var selectData = { page: 0, total: 1, max: 20, column: 5, row: 4 };
var storageKey = 'unico';

/*!
 * 
 * DATA UPDATE - This is the function that runs to update data
 * 
 */
function retrieveLevelData() {
	return new Promise((resolve) => {
		var savedData = localStorage.getItem(storageKey);
		if (savedData !== null) {
			try {
				var data = JSON.parse(savedData);
				gameData.levelCompleted = Number(data.completed);
				gameData.skippedLevels = data.skipped || [];
				// Only set to 3 if life is undefined, keep 0 if it's 0
				gameData.life = data.life !== undefined ? Number(data.life) : 3;
			} catch (e) {
				// Backward compatibility with old format
				gameData.levelCompleted = Number(savedData);
				gameData.skippedLevels = [];
				gameData.life = 3;
			}
			gameData.levelCompleted = gameData.levelCompleted >= levelSettings.length ? levelSettings.length : gameData.levelCompleted;
			findSelectPage(gameData.levelCompleted);
		} else {
			// If no data exists, initialize with default values
			gameData.levelCompleted = 0;
			gameData.skippedLevels = [];
			gameData.life = 3;
		}

		// Always initialize levelNum based on levelCompleted
		gameData.levelNum = Math.max(0, (gameData.levelCompleted || 0) - 1);

		if (gameData.life == 0) {
			gameData.life = 1;
		}

		// Initialize life dots based on saved life count
		for (var i = 1; i <= 3; i++) {
			const lifeDot = lifeContainer.children[i];
			if (lifeDot) {
				// If i is less than or equal to current life count, make yellow, otherwise gray
				const color = i <= gameData.life ? "yellow" : "#D3D3D3";
				lifeDot.graphics.clear().beginFill(color).drawCircle(0, 0, 15);
			}
		}

		resolve(gameData);
	});
}

function saveLevelData() {
	if (Number(gameData.levelNum) >= gameData.levelCompleted) {
		gameData.levelCompleted = Number(gameData.levelNum) + 1;
		gameData.levelCompleted = gameData.levelCompleted >= levelSettings.length ? levelSettings.length : gameData.levelCompleted;
	}
	var data = {
		completed: gameData.levelCompleted,
		skipped: gameData.skippedLevels || [],
		life: gameData.life
	};
	localStorage.setItem(storageKey, JSON.stringify(data));
}

function skipLevel() {
	if (!gameData.skippedLevels) {
		gameData.skippedLevels = [];
	}

	if (!gameData.skippedLevels.includes(gameData.levelNum)) {
		gameData.skippedLevels.push(gameData.levelNum);
		if (gameData.levelNum == gameData.levelCompleted - 1) {
			gameData.levelCompleted++;
		}
		saveLevelData();
	}

	// Move to next level
	gameData.levelNum++;
	if (gameData.levelNum >= levelSettings.length) {
		gameData.levelNum = 0;
	}
	preparePuzzle();
}

/*!
 * 
 * GAME BUTTONS - This is the function that runs to setup button event
 * 
 */
function buildGameButton() {
	$(window).focus(function () {
		if (!buttonSoundOn.visible) {
			toggleSoundInMute(false);
		}

		if (typeof buttonMusicOn != "undefined") {
			if (!buttonMusicOn.visible) {
				toggleMusicInMute(false);
			}
		}
	});

	$(window).blur(function () {
		if (!buttonSoundOn.visible) {
			toggleSoundInMute(true);
		}

		if (typeof buttonMusicOn != "undefined") {
			if (!buttonMusicOn.visible) {
				toggleMusicInMute(true);
			}
		}
	});

	if ($.browser.mobile || isTablet) {

	} else {

	}

	buttonLevelArrowL.cursor = "pointer";
	buttonLevelArrowL.addEventListener("click", function (evt) {
		playSound('soundButton');
		toggleSelect(false);
	});

	buttonLevelArrowR.cursor = "pointer";
	buttonLevelArrowR.addEventListener("click", function (evt) {
		playSound('soundButton');
		toggleSelect(true);
	});

	buttonReviveContainer.cursor = "pointer";
	buttonReviveContainer.addEventListener("click", function (evt) {
		playSound('soundButton');
		stopMusicLoop('musicGame');
		PokiSDK.commercialBreak(() => {
		}).then(() => {
			revive();
		});
	});

	buttonSkip2Container.cursor = "pointer";
	buttonSkip2Container.addEventListener("click", function (evt) {
		playSound('soundButton');
		stopMusicLoop('musicGame');
		PokiSDK.rewardedBreak(() => {
		}).then((success) => {
			if (success) {
				skip2();
			} else {
			}
		});
	});

	resultButtonContainer.cursor = "pointer";
	resultButtonContainer.addEventListener("click", function (evt) {
		playSound('soundButton');
		stopMusicLoop('musicGame');
		PokiSDK.commercialBreak(() => {
		}).then(() => {
			goPage('game');
			playMusicLoop('musicGame');
		});

	});

	homeBg.cursor = "pointer";
	homeBg.addEventListener("click", async function (evt) {
		await checkFirstInteraction();
		playSound('soundButton');
		goPage('level');

	});

	homeButton.cursor = "pointer";
	homeButton.addEventListener("click", async function (evt) {
		await checkFirstInteraction();
		playSound('soundButton');
		goPage('level');


	});

	buttonSoundOff.cursor = "pointer";
	buttonSoundOff.addEventListener("click", function (evt) {
		toggleSoundMute(true);
	});

	buttonSoundOn.cursor = "pointer";
	buttonSoundOn.addEventListener("click", function (evt) {
		toggleSoundMute(false);
	});

	if (typeof buttonMusicOff != "undefined") {
		buttonMusicOff.cursor = "pointer";
		buttonMusicOff.addEventListener("click", function (evt) {
			toggleMusicMute(true);
		});
	}

	if (typeof buttonMusicOn != "undefined") {
		buttonMusicOn.cursor = "pointer";
		buttonMusicOn.addEventListener("click", function (evt) {
			toggleMusicMute(false);
		});
	}



	buttonSettings.cursor = "pointer";
	buttonSettings.addEventListener("click", function (evt) {
		playSound('soundButton');
		toggleOption();
	});

	settingsBg.cursor = "pointer";
	settingsBg.addEventListener("click", function (evt) {
		playSound('soundButton');
		toggleOption();
	});

	buttonRetryContainer.cursor = "pointer";
	buttonRetryContainer.addEventListener("click", async function (evt) {
		await checkFirstInteraction();
		playSound('soundButton');
		resetStrokes("retry");

	});

	buttonRetryContainerPortrait.cursor = "pointer";
	buttonRetryContainerPortrait.addEventListener("click", async function (evt) {
		await checkFirstInteraction();
		playSound('soundButton');
		resetStrokes("retry");

	});

	buttonUndoContainer.cursor = "pointer";
	buttonUndoContainer.addEventListener("click", async function (evt) {
		if (gameData.strokesHistory.length === 0) {
			return; // Exit early if there are no strokes
		}
		await checkFirstInteraction();
		playSound('soundButton');
		PokiSDK.gameplayStop();
		gameStarted = false;
		stopMusicLoop('musicGame');
		PokiSDK.rewardedBreak(() => {
		}).then((success) => {
			if (success) {
				undoStrokes();
				playMusicLoop('musicGame');
				PokiSDK.gameplayStart();
				gameStarted = true;
			} else {
				playMusicLoop('musicGame');
				PokiSDK.gameplayStart();
				gameStarted = true;
			}
		});

	});

	buttonUndoContainerPortrait.cursor = "pointer";
	buttonUndoContainerPortrait.addEventListener("click", async function (evt) {
		// Check if there are any strokes to undo
	if (gameData.strokesHistory.length === 0) {
		return; // Exit early if there are no strokes
	}
		await checkFirstInteraction();
		playSound('soundButton');
		PokiSDK.gameplayStop();
		gameStarted = false;
		stopMusicLoop('musicGame');
		PokiSDK.rewardedBreak(() => {
		}).then((success) => {
			if (success) {
				undoStrokes();
				playMusicLoop('musicGame');
				PokiSDK.gameplayStart();
				gameStarted = true;
			} else {
				playMusicLoop('musicGame');
				PokiSDK.gameplayStart();
				gameStarted = true;
			}
		});

	});

	buttonSkipContainer.cursor = "pointer";
	buttonSkipContainer.addEventListener("click", async function (evt) {
		await checkFirstInteraction();
		playSound('soundButton');
		PokiSDK.gameplayStop();
		gameStarted = false;
		stopMusicLoop('musicGame');
		PokiSDK.rewardedBreak(() => {
		}).then((success) => {
			if (success) {
				skipLevel();
				playMusicLoop('musicGame');
				PokiSDK.gameplayStart();
				gameStarted = true;
			} else {
				playMusicLoop('musicGame');
				PokiSDK.gameplayStart();
				gameStarted = true;
			}
		});

	});

	buttonSkipContainerPortrait.cursor = "pointer";
	buttonSkipContainerPortrait.addEventListener("click", async function (evt) {
		await checkFirstInteraction();
		playSound('soundButton');
		PokiSDK.gameplayStop();
		gameStarted = false;
		stopMusicLoop('musicGame');
		PokiSDK.rewardedBreak(() => {
		}).then((success) => {
			if (success) {
				skipLevel();
				playMusicLoop('musicGame');
				PokiSDK.gameplayStart();
				gameStarted = true
			} else {
				playMusicLoop('musicGame');
				PokiSDK.gameplayStart();
				gameStarted = true;
			}
		});
	});

	for (var n = 0; n < gameSettings.colors.length; n++) {
		gameData.colors.push(n);
	}
	shuffle(gameData.colors);

	setupStageEvents();
	buildSelectLevel();
}

function checkFirstInteraction() {
    return new Promise((resolve) => {
        if (firstInteraction) {
            firstInteraction = false;
            PokiSDK.gameplayStart();
            gameStarted = true;
            // Add a small delay to ensure proper sequencing
            setTimeout(() => {
                resolve(true);
            }, 100);
        } else {
            resolve(false);
        }
    });
}

function skip2() {
	gameData.life = 3;
	saveLevelData();
	skipLevel();
	goPage('game');
	for (var i = 1; i <= 3; i++) {
		const lifeDot = lifeContainer.children[i];
		// Animate scale up
		TweenMax.to(lifeDot, 0.2, {
			scaleX: 1.5,
			scaleY: 1.5,
			ease: "Power2.easeOut",
			onComplete: function () {
				// Change color to yellow
				this.target.graphics.clear().beginFill("yellow").drawCircle(0, 0, 15);
				// Animate back to normal size with bounce
				TweenMax.to(this.target, 0.3, {
					scaleX: 1,
					scaleY: 1,
					ease: "Bounce.easeOut"
				});
			}
		});
	}
}

function revive() {
	gameData.life = 3;
	saveLevelData();
	goPage('game');
	for (var i = 1; i <= 3; i++) {
		const lifeDot = lifeContainer.children[i];
		// Animate scale up
		TweenMax.to(lifeDot, 0.2, {
			scaleX: 1.5,
			scaleY: 1.5,
			ease: "Power2.easeOut",
			onComplete: function () {
				// Change color to yellow
				this.target.graphics.clear().beginFill("yellow").drawCircle(0, 0, 15);
				// Animate back to normal size with bounce
				TweenMax.to(this.target, 0.3, {
					scaleX: 1,
					scaleY: 1,
					ease: "Bounce.easeOut"
				});
			}
		});
	}
}

/*!
 * 
 * SELECT LEVEL - This is the function that runs to display select levels
 * 
 */
function buildSelectLevel() {
	selectData.total = levelSettings.length / selectData.max;

	if (String(selectData.total).indexOf('.') > -1) {
		selectData.total = Math.floor(selectData.total) + 1;
	}
	toggleSelect(false);
	for (var r = 0; r < selectData.row; r++) {
		for (var c = 0; c < selectData.column; c++) {
			$.level[r + '_unlock_' + c].cursor = "pointer";
			$.level[r + '_unlock_' + c].addEventListener("click", function (evt) {
				gameData.levelNum = Number(evt.target.text.text) - 1;
				playSound('soundButton');
				stopMusicLoop('musicMain');
				PokiSDK.commercialBreak(() => {
				}).then(() => {
					goPage('game');
				});
			});
			$.level[r + '_skip_' + c].cursor = "pointer";
			$.level[r + '_skip_' + c].addEventListener("click", function (evt) {
				gameData.levelNum = Number(evt.target.text.text) - 1;
				playSound('soundButton');
				stopMusicLoop('musicMain');
				PokiSDK.commercialBreak(() => {
				}).then(() => {
					goPage('game');
				});
			});
			$.level[r + '_current_' + c].cursor = "pointer";
			$.level[r + '_current_' + c].addEventListener("click", function (evt) {
				gameData.levelNum = Number(evt.target.text.text) - 1;
				playSound('soundButton');
				stopMusicLoop('musicMain');
				PokiSDK.commercialBreak(() => {
				}).then(() => {
					goPage('game');
				});
			});
		}
	}
}

function toggleSelect(con) {
	if (con) {
		selectData.page++;
		selectData.page = selectData.page > selectData.total ? selectData.total : selectData.page;
	} else {
		selectData.page--;
		selectData.page = selectData.page < 1 ? 1 : selectData.page;
	}
	selectPage(selectData.page);
}

function selectPage(num) {
	selectData.page = num;
	selectData.page = selectData.page < 1 ? 1 : selectData.page;

	var startNum = (selectData.page - 1) * selectData.max;
	for (var r = 0; r < selectData.row; r++) {
		for (var c = 0; c < selectData.column; c++) {
			$.level[r + '_unlock_' + c].visible = false;
			$.level[r + '_current_' + c].visible = false;
			$.level[r + '_' + c].visible = false;
			$.level[r + '_skip_' + c].visible = false;
			$.level[r + '_iconX_' + c].visible = false;
			$.level[r + '_iconTick_' + c].visible = false;
			if (startNum < levelSettings.length) {
				if (gameData.skippedLevels.includes(startNum)) {
					$.level[r + '_' + c].visible = false;
					$.level[r + '_skip_' + c].visible = true;
					$.level[r + '_iconX_' + c].visible = true;
					$.level[r + '_iconX_' + c].scaleX = 0.70;
					$.level[r + '_iconX_' + c].scaleY = 0.70;
				} else {
					$.level[r + '_' + c].visible = true;
					$.level[r + '_skip_' + c].visible = false;
					$.level[r + '_iconX_' + c].visible = false;
					$.level[r + '_iconTick_' + c].visible = true;
					$.level[r + '_iconTick_' + c].scaleX = 0.70;
					$.level[r + '_iconTick_' + c].scaleY = 0.70;
				}
				$.level[r + '_text_' + c].text = startNum + 1;
				$.level[r + '_unlock_' + c].text.visible = true;
				$.level[r + '_current_' + c].text.visible = true;



			} else {
				$.level[r + '_' + c].visible = false;
				$.level[r + '_unlock_' + c].text.visible = false;
				$.level[r + '_current_' + c].text.visible = false;
			}

			if (gameData.levelCompleted == 0 && startNum == 0) {
				$.level[r + '_current_' + c].visible = true;
				$.level[r + '_text_' + c].text = 1;
				$.level[r + '_iconTick_' + c].visible = false;
			} else if ((startNum) < gameData.levelCompleted) {
				if ((startNum) == (gameData.levelCompleted - 1)) {
					$.level[r + '_current_' + c].visible = true;
					$.level[r + '_text_' + c].text = startNum + 1;
					$.level[r + '_iconTick_' + c].visible = false;
				} else {
					$.level[r + '_unlock_' + c].visible = true;
				}
			} else {
				$.level[r + '_text_' + c].text = '';
				$.level[r + '_iconTick_' + c].visible = false;
			}
			startNum++;
		}
	}

	if (selectData.page == 1) {
		buttonLevelArrowL.visible = false;
	} else {
		buttonLevelArrowL.visible = true;
	}

	if (selectData.page == selectData.total || selectData.total == 1) {
		buttonLevelArrowR.visible = false;
	} else {
		buttonLevelArrowR.visible = true;
	}
}

function unlockLevelTween(r, c) {
	gameData.revealLevel = false;
	$.level[r + '_current_' + c].visible = true;
	$.level[r + '_current_' + c].alpha = 0;
	$.level[r + '_text_' + c].alpha = 0;

	TweenMax.to($.level[r + '_current_' + c], .5, {
		delay: .5, alpha: 1, scaleX: 1.2, scaleY: 1.2, overwrite: true, onStart: function () {
			//playSound('soundUnlock');
		}, onComplete: function () {
			TweenMax.to($.level[r + '_current_' + c], .5, { scaleX: 1, scaleY: 1, overwrite: true });
		}
	});
	TweenMax.to($.level[r + '_text_' + c], .5, { delay: .5, alpha: 1, overwrite: true });
}

function findSelectPage(level) {
	for (var n = 0; n < 10; n++) {
		var startNum = (n + 1) * selectData.max;
		if (level <= startNum) {
			selectData.page = n + 1;
			n = 10;
		}
	}
}

/*!
 * 
 * TOGGLE POP - This is the function that runs to toggle popup overlay
 * 
 */
function togglePop(con) {
	confirmContainer.visible = con;
}

var gameStarted = false;
/*!
 * 
 * DISPLAY PAGES - This is the function that runs to display pages
 * 
 */
var curPage = ''
function goPage(page) {
	curPage = page;

	levelContainer.visible = false;
	gameContainer.visible = false;
	resultContainer.visible = false;
	confirmContainer.visible = false;
	homeButton.visible = true;
	homeBg.visible = true;
	levelSelectContainer.visible = false;
	bgResultContainer.visible = false;
	optionsContainer.visible = false;
	gameOverContainer.visible = false;

	var targetContainer = null;
	switch (page) {

		case 'level':
			if (gameData.life <= 0) {
				gameData.life = 1;
			}
			targetContainer = levelContainer;
			stopMusicLoop('musicGame');
			playMusicLoop('musicMain');
			if (gameStarted) {
				PokiSDK.gameplayStop();
				gameStarted = false;
			}
			homeButton.visible = false;
			homeBg.visible = false;
			levelSelectContainer.visible = true;
			selectPage(selectData.page);
			break;

		case 'game':
			targetContainer = gameContainer;
			if (!$.editor.enable) {
				stopMusicLoop('musicMain');
				playMusicLoop('musicGame');
			}

			startGame();
			break;

		case 'result':
			targetContainer = resultContainer;
			bgResultContainer.visible = true;
			stopGame();
			togglePop(false);
			showConfetti();
			stopMusicLoop('musicGame');
			playSound('soundResult');

			playerData.score = gameData.levelNum;
			resultDescTxt.text = textDisplay.resultDesc.replace('[NUMBER]', gameData.levelNum + 1)

			saveGame(playerData.score);
			break;

		case 'gameover':
			targetContainer = confirmContainer;
			gameOverContainer.visible = true;
			stopGame();
			stopMusicLoop('musicGame');
			playSound('soundResult');
			break;
	}

	if (targetContainer != null) {
		targetContainer.visible = true;
		targetContainer.alpha = 0;
		TweenMax.to(targetContainer, .5, { alpha: 1, overwrite: true });
	}

	resizeCanvas();
}

/*!
 * 
 * START GAME - This is the function that runs to start game
 * 
 */
function startGame() {
	gameData.paused = false;
	if (!firstInteraction && !gameStarted) {
		PokiSDK.gameplayStart();
		gameStarted = true;
	}

	if (!$.editor.enable) {
		preparePuzzle();
		playSound('soundStart');
	}
}

function reduceLife() {
	if (gameData.life > 0) {
		gameData.life--;
		saveLevelData();
		// Update the color of the life dot to grey
		const lifeDot = lifeContainer.children[gameData.life + 1];

		// Create animation sequence
		TweenMax.to(lifeDot, 0.2, {
			scaleX: 1.5,
			scaleY: 1.5,
			ease: "Power2.easeOut",
			onComplete: function () {
				// Change color to gray
				lifeDot.graphics.clear().beginFill("#D3D3D3").drawCircle(0, 0, 15);
				// Animate back to normal size with a slight bounce
				TweenMax.to(lifeDot, 0.3, {
					scaleX: 1,
					scaleY: 1,
					ease: "Bounce.easeOut"
				});
			}
		});

		if (gameData.life === 0) {
			// No more lives, show confirm container
			goPage('gameover');

		}
	}
}

function resizePuzzle() {
	levelContainer.x = canvasW / 2;
	levelContainer.y = canvasH / 2;

	puzzleContainer.x = canvasW / 2;
	puzzleContainer.y = canvasH / 2;


	buttonLevelArrowL.x = -260;
	buttonLevelArrowR.x = 260;

	if (viewport.isLandscape) {


		var baseWidth = 1024; // Base width for reference
		var scale = Math.min(1, Math.max(0.8, window.innerWidth / baseWidth));
		puzzleContainer.scaleX = scale;
		puzzleContainer.scaleY = scale;



		buttonUndoContainerPortrait.visible = false;
		buttonUndoContainer.visible = true;
		buttonRetryContainerPortrait.visible = false;
		buttonRetryContainer.visible = true;
		buttonSkipContainerPortrait.visible = false;
		buttonSkipContainer.visible = true;

		if (gameData.levelNum === 49) {
			buttonSkipContainer.visible = false;
			buttonSkipContainerPortrait.visible = false;
			buttonSkip2Container.visible = false;
		}
	

		buttonUndoContainer.x = offset.x + 56;
		buttonUndoContainer.y = (canvasH - offset.y) - 90;

		buttonRetryContainer.x = offset.x + 220;
		buttonRetryContainer.y = (canvasH - offset.y) - 90;

		buttonSkipContainer.x = (canvasW - offset.x) - 200;
		buttonSkipContainer.y = (canvasH - offset.y) - 90;

		lifeContainer.x = canvasW / 2 + 100;
		lifeContainer.y = offset.y + 30;


		resultButtonContainer.x = (canvasW / 2);
		resultButtonContainer.y = (canvasH / 2 + 50);
		resultDescTxt.x = buttonContinue.x - 40;
		resultDescTxt.y = buttonContinue.y + 15;
		iconPlay.x = buttonContinue.x + 90;
		iconPlay.y = buttonContinue.y;
		levelCompleteText.x = canvasW / 2;
		levelCompleteText.y = offset.y + 180;

		scoreContainer.x = canvasW / 2 - 240;
		scoreContainer.y = offset.y + 30;

		levelNumberContainer.x = canvasW / 2;
		levelNumberContainer.y = offset.y + 30;

	} else {

		buttonUndoContainerPortrait.visible = true;
		buttonUndoContainer.visible = false;
		buttonRetryContainerPortrait.visible = true;
		buttonRetryContainer.visible = false;
		buttonSkipContainerPortrait.visible = true;
		buttonSkipContainer.visible = false;

		if (gameData.levelNum === 49) {
			buttonSkipContainer.visible = false;
			buttonSkipContainerPortrait.visible = false;
			buttonSkip2Container.visible = false;
		}
	


		buttonUndoContainerPortrait.x = offset.x + 26;
		buttonUndoContainerPortrait.y = canvasH - 150;

		buttonRetryContainerPortrait.x = offset.x + 126;
		buttonRetryContainerPortrait.y = canvasH - 150;

		buttonSkipContainerPortrait.x = (canvasW - offset.x) - 182;
		buttonSkipContainerPortrait.y = canvasH - 150;

		lifeContainer.x = canvasW / 2 - 10;
		lifeContainer.y = offset.y + 65;

		scoreContainer.x = canvasW / 2 - 170;
		scoreContainer.y = offset.y + 65;

		levelNumberContainer.x = canvasW / 2;
		levelNumberContainer.y = offset.y + 120;


		resultButtonContainer.x = (canvasW / 2);
		resultButtonContainer.y = (canvasH / 2 + 50);
		resultDescTxt.x = buttonContinue.x - 40;
		resultDescTxt.y = buttonContinue.y + 15;
		iconPlay.x = buttonContinue.x + 90;
		iconPlay.y = buttonContinue.y;
		levelCompleteText.x = canvasW / 2;
		levelCompleteText.y = canvasH / 100 * 25;
	}
}

/*!
* 
* STOP GAME - This is the function that runs to stop play game
* 
*/
function stopGame() {
	gameData.paused = true;
	if (!firstInteraction) {
		if (gameStarted) {
			PokiSDK.gameplayStop();
			gameStarted = false;
		}
	}
	TweenMax.killAll(false, true, false);
}

function saveGame(score) {
	// Save score to localStorage
	var scoreData = {
		score: score,
		date: new Date().getTime()
	};

	// Get existing scores or initialize empty array
	var scores = JSON.parse(localStorage.getItem(storageKey + '_scores') || '[]');

	// Add new score
	scores.push(scoreData);

	// Sort by score (highest first)
	scores.sort((a, b) => b.score - a.score);

	// Keep only top 10 scores
	scores = scores.slice(0, 10);

	// Save back to localStorage
	localStorage.setItem(storageKey + '_scores', JSON.stringify(scores));

	if (typeof toggleScoreboardSave == 'function') {
		$.scoreData.score = score;
		if (typeof type != 'undefined') {
			$.scoreData.type = type;
		}
		toggleScoreboardSave(true);
	}
}

/*!
 * 
 * LOAD PUZZLE - This is the function that runs to load puzzle
 * 
 */
function preparePuzzle() {
	gameData.drawing = false;
	gameData.complete = false;

	puzzleGuideContainer.removeAllChildren();
	puzzleAnimateContainer.removeAllChildren();
	puzzleStrokeContainer.removeAllChildren();
	puzzleDotContainer.removeAllChildren();

	var gamePlay = true;
	buttonRetryContainer.visible = true;
	buttonUndoContainer.visible = true;
	buttonSkipContainer.visible = true;
	scoreContainer.visible = true;
	lifeContainer.visible = true;

	if (gameData.levelNum === 49) { // Index 50 is level 51
		buttonSkipContainer.visible = false;
		buttonSkipContainerPortrait.visible = false;
		buttonSkip2Container.visible = false;
	} else {
		buttonSkipContainer.visible = true;
		buttonSkipContainerPortrait.visible = true;
		buttonSkip2Container.visible = true;
	}

	if ($.editor.enable) {
		if (edit.option != 'play') {
			gamePlay = false;
			buttonRetryContainer.visible = false;
			buttonUndoContainer.visible = false;
			buttonSkipContainer.visible = false;
			buttonSkipContainerPortrait.visible = false;
			scoreContainer.visible = false;
		}
	}
	gameData.strokes = [];
	gameData.shapeIndex = [];
	gameData.strokesHistory = [];



	for (var n = 0; n < levelSettings[gameData.levelNum].strokes.length; n++) {
		gameData.strokes.push({ index: n, complete: false, sX: levelSettings[gameData.levelNum].strokes[n].sX, sY: levelSettings[gameData.levelNum].strokes[n].sY, eX: levelSettings[gameData.levelNum].strokes[n].eX, eY: levelSettings[gameData.levelNum].strokes[n].eY });

		var colorIndex = gameData.colors[gameData.colorIndex];
		var strokeColor = gameSettings.colors[colorIndex].guide;
		var dotColor = gameSettings.colors[colorIndex].drawDot;

		$.puzzle[n + 'start'] = new createjs.Shape();
		$.puzzle[n + 'start'].graphics.beginFill(dotColor).drawCircle(0, 0, gameSettings.dotRadius);
		$.puzzle[n + 'start'].x = levelSettings[gameData.levelNum].strokes[n].sX;
		$.puzzle[n + 'start'].y = levelSettings[gameData.levelNum].strokes[n].sY;

		$.puzzle[n + 'end'] = new createjs.Shape();
		$.puzzle[n + 'end'].graphics.beginFill(dotColor).drawCircle(0, 0, gameSettings.dotRadius);
		$.puzzle[n + 'end'].x = levelSettings[gameData.levelNum].strokes[n].eX;
		$.puzzle[n + 'end'].y = levelSettings[gameData.levelNum].strokes[n].eY;

		if (gamePlay) {
			$.puzzle[n + 'start'].cursor = "pointer";
			$.puzzle[n + 'start'].addEventListener("mousedown", function (evt) {
				addStroke(evt.target.x, evt.target.y);
			});

			$.puzzle[n + 'end'].cursor = "pointer";
			$.puzzle[n + 'end'].addEventListener("mousedown", function (evt) {
				addStroke(evt.target.x, evt.target.y);
			});
		}

		$.puzzle[n + 'stroke'] = new createjs.Shape();
		$.puzzle[n + 'stroke'].graphics.ss(gameSettings.strokeSize, "round").s(strokeColor);
		$.puzzle[n + 'stroke'].graphics.mt(levelSettings[gameData.levelNum].strokes[n].sX, levelSettings[gameData.levelNum].strokes[n].sY);
		$.puzzle[n + 'stroke'].graphics.lt(levelSettings[gameData.levelNum].strokes[n].eX, levelSettings[gameData.levelNum].strokes[n].eY);

		puzzleGuideContainer.addChild($.puzzle[n + 'stroke']);
		puzzleDotContainer.addChild($.puzzle[n + 'start'], $.puzzle[n + 'end']);
	}

	if (gameData.levelNum === 0) {
		drawGuide.visible = true;
		var firstPointX = $.puzzle['0start'].x + 30;
		var firstPointY = $.puzzle['0start'].y + 40;
		var secondPointX = $.puzzle['0end'].x + 30;
		var secondPointY = $.puzzle['0end'].y + 40;

		// Position hand at first point
		drawGuide.x = firstPointX;
		drawGuide.y = firstPointY;

		// Create timeline for hand movement
		var tutorialTimeline = new TimelineMax({ repeat: -1 });
		tutorialTimeline.to(drawGuide, 1, {
			x: secondPointX,
			y: secondPointY,
			ease: Power2.easeInOut
		}).to(drawGuide, 1.5, {
			x: firstPointX,
			y: firstPointY,
			ease: Power2.easeInOut
		});

		// Store timeline reference
		gameData.tutorialTimeline = tutorialTimeline;
	} else {
		drawGuide.visible = false;
		if (gameData.tutorialTimeline) {
			gameData.tutorialTimeline.kill();
			gameData.tutorialTimeline = null;
		}
	}

	updateScore();
}

/*!
 * 
 * STAGE EVENTS - This is the function that runs to build stage events
 * 
 */
function setupStageEvents() {
	stage.addEventListener("mousedown", function (evt) {
		toggleStageEvent(evt, 'down')
	});

	stage.addEventListener("pressmove", function (evt) {
		toggleStageEvent(evt, 'move')
	});

	stage.addEventListener("pressup", function (evt) {
		toggleStageEvent(evt, 'release')
	});
}

function removeStageEvents() {
	stage.removeAllEventListeners("mousedown");
	stage.removeAllEventListeners("pressmove");
	stage.removeAllEventListeners("pressup");
}

/*!
 * 
 * TOGGLE STEGE EVENTS - This is the function that runs to toggle stage events
 * 
 */
function toggleStageEvent(obj, con) {
	switch (con) {
		case 'down':

			break;

		case 'move':
			if (gameData.drawing) {
				updateStrokeDrawing();
			}
			break;

		case 'release':
			if (gameData.drawing) {
				timeData.startDate = new Date();
				removeStroke();
			}
			break;
	}
}

/*!
 * 
 * DRWAING GUIDE - This is the function that runs to follow drawing guide
 * 
 */

function addStroke(x, y) {
	if (gameData.complete) {
		return;
	}

	if (gameData.levelNum === 0 && gameData.tutorialTimeline) {
		drawGuide.visible = false;
		gameData.tutorialTimeline.kill();
		gameData.tutorialTimeline = null;
	}

	var proceedStroke = true;
	if (gameData.strokesHistory.length != 0) {
		if (x == gameData.strokesHistory[gameData.strokesHistory.length - 1].eX && y == gameData.strokesHistory[gameData.strokesHistory.length - 1].eY) {

		} else {
			proceedStroke = false;
		}
	}

	if (proceedStroke) {
		playSound('soundSelect');
		animateDot(x, y, false);
		gameData.drawing = true;

		gameData.strokeData.x = x;
		gameData.strokeData.y = y;

		$.puzzle[gameData.shapeIndex] = new createjs.Shape();
		puzzleStrokeContainer.addChild($.puzzle[gameData.shapeIndex]);
	} else {
		playSound('soundError');
	}
}

function updateStrokeDrawing() {
	var movePos = puzzleContainer.globalToLocal(stage.mouseX, stage.mouseY);
	var drawGuideSize = 10;
	movePos.x = movePos.x <= -(gameData.drawGuideW / 2 - drawGuideSize) ? -(gameData.drawGuideW / 2 - drawGuideSize) : movePos.x;
	movePos.x = movePos.x >= (gameData.drawGuideW / 2 - drawGuideSize) ? (gameData.drawGuideW / 2 - drawGuideSize) : movePos.x;
	movePos.y = movePos.y <= -(gameData.drawGuideH / 2 - drawGuideSize) ? -(gameData.drawGuideH / 2 - drawGuideSize) : movePos.y;
	movePos.y = movePos.y >= (gameData.drawGuideH / 2 - drawGuideSize) ? (gameData.drawGuideH / 2 - drawGuideSize) : movePos.y;

	drawStroke(movePos.x, movePos.y);
	for (var n = 0; n < gameData.strokes.length; n++) {
		if (!gameData.strokes[n].complete) {
			if (gameData.strokeData.x == gameData.strokes[n].sX && gameData.strokeData.y == gameData.strokes[n].sY) {
				var checkDistance = getDistance(movePos.x, movePos.y, gameData.strokes[n].eX, gameData.strokes[n].eY);
				if (checkDistance <= gameSettings.dotRadius) {
					gameData.strokes[n].complete = true;
					drawStroke(gameData.strokes[n].eX, gameData.strokes[n].eY);
					gameData.shapeIndex++;
					gameData.strokesHistory.push({ index: n, shape: gameData.shapeIndex, sX: gameData.strokeData.x, sY: gameData.strokeData.y, eX: gameData.strokes[n].eX, eY: gameData.strokes[n].eY });
					addStroke(gameData.strokes[n].eX, gameData.strokes[n].eY);
					checkPuzzleComplete();
				}
			}
			if (gameData.strokeData.x == gameData.strokes[n].eX && gameData.strokeData.y == gameData.strokes[n].eY) {
				var checkDistance = getDistance(movePos.x, movePos.y, gameData.strokes[n].sX, gameData.strokes[n].sY);
				if (checkDistance <= gameSettings.dotRadius) {
					gameData.strokes[n].complete = true;
					drawStroke(gameData.strokes[n].sX, gameData.strokes[n].sY);
					gameData.shapeIndex++;
					gameData.strokesHistory.push({ index: n, shape: gameData.shapeIndex, sX: gameData.strokeData.x, sY: gameData.strokeData.y, eX: gameData.strokes[n].sX, eY: gameData.strokes[n].sY });
					addStroke(gameData.strokes[n].sX, gameData.strokes[n].sY);
					checkPuzzleComplete();
				}
			}
		}
	}
}

function drawStroke(x, y) {
	var colorIndex = gameData.colors[gameData.colorIndex];
	var strokeColor = gameData.complete == true ? gameSettings.colors[colorIndex].completeStroke : gameSettings.colors[colorIndex].drawStroke;

	$.puzzle[gameData.shapeIndex].graphics.clear();
	$.puzzle[gameData.shapeIndex].graphics.ss(gameSettings.strokeSize, "round").s(strokeColor);
	$.puzzle[gameData.shapeIndex].graphics.mt(gameData.strokeData.x, gameData.strokeData.y);
	$.puzzle[gameData.shapeIndex].graphics.lt(x, y);
}

function removeStroke() {
	gameData.drawing = false;
	puzzleStrokeContainer.removeChild($.puzzle[gameData.shapeIndex]);
}

/*!
 * 
 * STROKE EVENTS - This is the function that runs for stroke events
 * 
 */
function undoStrokes() {
	if (gameData.complete) {
		return;
	}

	playSound('soundUndo');
	if (gameData.strokesHistory.length == 1) {
		resetStrokes("undo");
	} else if (gameData.strokesHistory.length > 0) {
		var historyIndex = gameData.strokesHistory.length - 1;
		puzzleStrokeContainer.removeChild($.puzzle[historyIndex]);

		gameData.strokes[gameData.strokesHistory[historyIndex].index].complete = false;
		gameData.strokesHistory.splice(historyIndex, 1);
		gameData.shapeIndex = gameData.strokesHistory.length;
	}
	updateScore();
}

function resetStrokes(sound) {
	if (gameData.complete) {
		return;
	}

	if (sound == "retry") {
		playSound('soundReset');
		reduceLife();
	}
	if (sound == "notmatched") {
		playSound('soundReset');
		reduceLife();
	}

	gameData.drawing = false;
	puzzleStrokeContainer.removeAllChildren();
	gameData.shapeIndex = 0;
	gameData.strokesHistory = [];

	for (var n = 0; n < gameData.strokes.length; n++) {
		gameData.strokes[n].complete = false;
	}
	updateScore();
}

/*!
 * 
 * CHECK PUZZLE COMPLETE - This is the function that runs to check puzzle complete
 * 
 */
function checkPuzzleComplete() {
	updateScore();
	var puzzleComplete = 0;
	for (var n = 0; n < gameData.strokes.length; n++) {
		if (gameData.strokes[n].complete) {
			puzzleComplete++;
		}
	}

	if (puzzleComplete == gameData.strokes.length) {
		gameData.complete = true;
		buttonRetryContainer.visible = false;
		buttonRetryContainerPortrait.visible = false;
		buttonUndoContainer.visible = false;
		buttonUndoContainerPortrait.visible = false;
		buttonSkipContainer.visible = false;
		buttonSkipContainerPortrait.visible = false;

		gameData.loopStrokeIndex = 0;
		loopCompleteStroke();
	} else {
		var isPlayable = false;
		var lastHistoryIndex = gameData.strokesHistory.length - 1;
		for (var n = 0; n < gameData.strokes.length; n++) {
			var isMatched = false;
			if (gameData.strokesHistory[lastHistoryIndex].eX == gameData.strokes[n].sX && gameData.strokesHistory[lastHistoryIndex].eY == gameData.strokes[n].sY) {
				isMatched = true;
			}
			if (gameData.strokesHistory[lastHistoryIndex].eX == gameData.strokes[n].eX && gameData.strokesHistory[lastHistoryIndex].eY == gameData.strokes[n].eY) {
				isMatched = true;
			}
			if (isMatched) {
				if (!gameData.strokes[n].complete) {
					isPlayable = true;
				}
			}
		}
		if (!isPlayable) {
			resetStrokes("notmatched");
		}
	}
}

function loopCompleteStroke() {
	if (gameData.loopStrokeIndex < gameData.strokesHistory.length) {
		var colorIndex = gameData.colors[gameData.colorIndex];
		var strokeColor = gameSettings.colors[colorIndex].completeStroke;

		var newStroke = new createjs.Shape();
		puzzleAnimateContainer.addChild(newStroke);

		var startX = gameData.strokesHistory[gameData.loopStrokeIndex].sX;
		var startY = gameData.strokesHistory[gameData.loopStrokeIndex].sY;
		var nextX = gameData.strokesHistory[gameData.loopStrokeIndex].eX;
		var nextY = gameData.strokesHistory[gameData.loopStrokeIndex].eY;
		var moveData = { x: startX, y: startY };

		playSound('soundStroke');
		TweenMax.to(moveData, .2, {
			x: nextX, y: nextY, overwrite: true, onUpdate: function () {
				newStroke.graphics.clear();
				newStroke.graphics.ss(gameSettings.strokeSize, "round").s(strokeColor);
				newStroke.graphics.mt(startX, startY);
				newStroke.graphics.lt(moveData.x, moveData.y);
			}, onComplete: function () {
				gameData.loopStrokeIndex++;
				loopCompleteStroke();
			}
		});
	} else {
		updateScore();
		for (var n = 0; n < levelSettings[gameData.levelNum].strokes.length; n++) {
			var colorIndex = gameData.colors[gameData.colorIndex];
			var dotColor = gameSettings.colors[colorIndex].completeDot;

			$.puzzle[n + 'start'].graphics.clear().beginFill(dotColor).drawCircle(0, 0, gameSettings.dotRadius);
			$.puzzle[n + 'end'].graphics.clear().beginFill(dotColor).drawCircle(0, 0, gameSettings.dotRadius);

			animateDot($.puzzle[n + 'start'].x, $.puzzle[n + 'start'].y, true);
			animateDot($.puzzle[n + 'end'].x, $.puzzle[n + 'end'].y, true);
		}
		if (!$.editor.enable) {
			endGame();
		}
	}
}

/*!
 * 
 * ANIMATE SHAPE - This is the function that runs to animate shape
 * 
 */
function animateDot(x, y, complete) {
	var colorIndex = gameData.colors[gameData.colorIndex];
	var dotColor = complete == true ? gameSettings.colors[colorIndex].completeDot : gameSettings.colors[colorIndex].drawDot;

	var newShape = new createjs.Shape();
	newShape.graphics.beginFill(dotColor).drawCircle(0, 0, gameSettings.dotRadius);
	newShape.x = x;
	newShape.y = y;
	puzzleAnimateContainer.addChild(newShape);

	TweenMax.to(newShape, .5, {
		scaleX: 3, scaleY: 3, alpha: 0, overwrite: true, onComplete: function () {
			puzzleAnimateContainer.removeChild(newShape);
		}
	});
}

function updateScore() {
	scoreTxt.text = gameData.strokesHistory.length + '/' + gameData.strokes.length;

	var colorIndex = gameData.colors[gameData.colorIndex];
	var strokeColor = gameData.complete == true ? gameSettings.colors[colorIndex].completeStroke : gameSettings.colors[colorIndex].drawStroke;
	gameData.fillCommand.style = strokeColor;

	levelNumberTxt.text = "LEVEL " + (gameData.levelNum + 1);
}

/*!
 * 
 * UPDATE GAME - This is the function that runs to loop game update
 * 
 */
function updateGame() {
	if (!gameData.paused && !$.editor.enable) {
		if (!gameData.drawing && !gameData.complete) {
			if (timeData.startDate == null) {
				timeData.startDate = new Date();
			}

			timeData.nowDate = new Date();
			timeData.elapsedTime = Math.floor((timeData.nowDate.getTime() - timeData.startDate.getTime()));
			if (timeData.elapsedTime > 1000) {
				timeData.startDate = new Date();

				if (gameData.strokesHistory.length > 0) {
					var lastHistoryIndex = gameData.strokesHistory.length - 1;
					animateDot(gameData.strokesHistory[lastHistoryIndex].eX, gameData.strokesHistory[lastHistoryIndex].eY, false);
				}
			}
		}
	}
}


/*!
 * 
 * END GAME - This is the function that runs for game end
 * 
 */
function endGame() {
	playSound('soundComplete');
	gameData.paused = true;

	gameData.colorIndex++;
	if (gameData.colorIndex > gameData.colors.length - 1) {
		gameData.colorIndex = 0;
		shuffle(gameData.colors);
	}

	gameData.revealLevel = false;
	gameData.levelNum++;

	if (gameData.levelNum >= gameData.levelCompleted && gameData.levelNum < levelSettings.length) {
		gameData.revealLevel = true;
	}
	var nextLevel = gameData.levelNum + 1;
	nextLevel = nextLevel > levelSettings.length ? levelSettings.length : nextLevel;
	findSelectPage(nextLevel);

	if (gameData.skippedLevels && gameData.skippedLevels.length > 0) {
		const index = gameData.skippedLevels.indexOf(gameData.levelNum - 1);
		if (index > -1) {
			gameData.skippedLevels.splice(index, 1);
		}
	}
	saveLevelData();

	TweenMax.to(puzzleContainer, .5, {
		scaleX: 1.2, scaleY: 1.2, overwrite: true, onComplete: function () {
			TweenMax.to(puzzleContainer, .5, {
				scaleX: 1, scaleY: 1, overwrite: true, onComplete: function () {
					TweenMax.to(gameContainer, 2, {
						overwrite: true, onComplete: function () {
							if (gameData.levelNum === 50) { // Index 50 is level 51
								goPage('level');
	
							}else{
								goPage('result');
							}
							
						}
					});
				}
			});
		}
	});
}

/*!
 * 
 * MILLISECONDS CONVERT - This is the function that runs to convert milliseconds to time
 * 
 */
function millisecondsToTimeGame(milli) {
	var milliseconds = milli % 1000;
	var seconds = Math.floor((milli / 1000) % 60);
	var minutes = Math.floor((milli / (60 * 1000)) % 60);

	if (seconds < 10) {
		seconds = '0' + seconds;
	}

	if (minutes < 10) {
		minutes = '0' + minutes;
	}

	return minutes + ':' + seconds;
}

/*!
 * 
 * OPTIONS - This is the function that runs to toggle options
 * 
 */

function toggleOption() {
	if (optionsContainer.visible) {
		optionsContainer.visible = false;
	} else {
		optionsContainer.visible = true;
	}
}


/*!
 * 
 * OPTIONS - This is the function that runs to mute and fullscreen
 * 
 */
function toggleSoundMute(con) {
	buttonSoundOff.visible = false;
	buttonSoundOn.visible = false;
	toggleSoundInMute(con);
	if (con) {
		buttonSoundOn.visible = true;
	} else {
		buttonSoundOff.visible = true;
	}
}

function toggleMusicMute(con) {
	buttonMusicOff.visible = false;
	buttonMusicOn.visible = false;
	toggleMusicInMute(con);
	if (con) {
		buttonMusicOn.visible = true;
	} else {
		buttonMusicOff.visible = true;
	}
}


/*!
 * 
 * SHARE - This is the function that runs to open share url
 * 
 */


function showConfetti() {
	// Create confetti container
	var confettiContainer = new createjs.Container();
	stage.addChild(confettiContainer);

	// Confetti settings
	var colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
	var totalConfetti = 100;

	// Create confetti pieces
	for (var i = 0; i < totalConfetti; i++) {
		var confetti = new createjs.Shape();
		var color = colors[Math.floor(Math.random() * colors.length)];

		// Random size between 5-10
		var size = 5 + (Math.random() * 5);

		// Draw confetti piece
		confetti.graphics.beginFill(color).drawRect(-size / 2, -size / 2, size, size);

		// Set initial position
		confetti.x = canvasW / 2;
		confetti.y = canvasH / 2;

		// Random rotation
		confetti.rotation = Math.random() * 360;

		confettiContainer.addChild(confetti);

		// Animate each piece
		TweenMax.to(confetti, 1 + (Math.random() * 2), {
			x: confetti.x + (Math.random() * canvasW - canvasW / 2),
			y: confetti.y + (Math.random() * canvasH - canvasH / 2),
			rotation: confetti.rotation + (Math.random() * 360),
			alpha: 0,
			ease: Power2.easeOut,
			onComplete: function () {
				confettiContainer.removeChild(this.target);
				// Remove container when all confetti are gone
				if (confettiContainer.children.length == 0) {
					stage.removeChild(confettiContainer);
				}
			}
		});
	}
}
