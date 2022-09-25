"use strict"
var vars = {
    DEBUG: false,

    version: 0.98,

    todo: [
        ['Finish implementing fly over then fleet'],
        ['When going to the options screen after the game was lost/won it doesnt get rid of the loss/win game screen'],
        ['After clicking new game/ start game it should show a new screen saying that its generating the board']
    ],

    boardSize: { width: 10, widthMin: 6, widthMax: 78, height: 10, heightMin: 6, heightMax: 42 },
    boardSizes: {
        small:  { width: 10, height: 10 },
        medium: { width: 16, height: 16 },
        big:    { width: 24, height: 24 },
        vbig:   { width: 40, height: 30 },
        insur:  { width: 60, height: 40 }
    },
    boardSetSize: (_w,_h)=> {
        vars.DEBUG && console.log(`Setting the board size to ${_w},${_h}`);
        vars.boardSize.width = _w;
        vars.boardSize.height = _h;
    },
    boardSizeWidthIncrease: (_inc=true)=> {
        let bS = vars.boardSize;
        let lV = vars.localStorage;
        let uW = lV.userDefinedWidth;
        if (_inc) {
            uW < bS.widthMax ? lV.userDefinedWidth+=2 : null;
        } else {
            uW > bS.widthMin ? lV.userDefinedWidth-=2 : null;
        };
        bS.width = lV.userDefinedWidth;
        vars.localStorage.updateUserDefinedWidth();
        vars.UI.updateOptionsBoardSizeWidth();
    },
    boardSizeHeightIncrease: (_inc=true)=> {
        let bS = vars.boardSize;
        let lV = vars.localStorage;
        let uH = lV.userDefinedHeight;
        if (_inc) {
            uH < bS.heightMax ? lV.userDefinedHeight+=2 : null;
        } else {
            uH > bS.heightMin ? lV.userDefinedHeight-=2 : null;
        };
        bS.height = lV.userDefinedHeight;
        vars.localStorage.updateUserDefinedHeight();
        vars.UI.updateOptionsBoardSizeHeight();
    },
    boardTileSizes: null,
    difficulty: {
        current: 'easy',
        minePercent: {
            easy: 0.1,
            medium: 0.2,
            hard: 0.3,
            veryhard: 0.4
        },
        getMinePercentage: ()=> {
            let difficulty = vars.difficulty;
            return difficulty.minePercent[difficulty.current];
        }
    },
    fonts: {
        default: { fontFamily: 'Consolas', fontSize: '32px', color: '#00ff00', stroke: '#AA', strokeThickness: 3, shadow: { offsetX: 3, offsetY: 3, blur: 5 } },
        number:  { fontFamily: 'Consolas', fontSize: '60px', color: '#ffffff', stroke: '#000000', strokeThickness: 2, shadow: { offsetX: 1, offsetY: 1, blur: 2 } }
    },

    reveal: {
        count: 0, revealing: [], instant: true,
        all: ()=> {
            vars.containers.unclicked.list.forEach((_c)=> { _c.alpha=0; });
        },
        reset: ()=> {
            vars.revealCount=0;
            vars.revealing = [];
        }
    },

    tileSizes:  [ 32, 48, 64 ],
    tileType: 'water', // water/grass (must be lower case!)
    maxWHs:  [ [78,42], [52,28], [39,20]],

    phaserObjects: { }, // populated when building the gameboard etc

    make2DArray: (_cols,_rows)=>{
        let arr = new Array(_cols);
        for (let i = 0; i < arr.length; i++) {
            arr[i] = new Array(_rows);
        }
        return arr;
    },

    init: function(_phase) {
        switch (_phase) {
            case 'PRELOAD': // PRELOADS
                vars.UI.iniLoadingScreen();
                vars.files.loadAssets();
                vars.localStorage.init();
                break;
            case 'CREATE': // CREATES
                vars.audio.init();
                vars.anims.init();
                vars.camera.init();
                vars.containers.init(true);
                vars.groups.init();
                vars.input.init();
                vars.particles.init();
                vars.UI.init();
                break;
            case 'STARTAPP': // GAME IS READY TO PLAY
                // destroy the loading screen
                scene.tweens.add({ targets: vars.containers.loadingScreen, alpha: 0, delay: 1000, duration: 1000, onComplete: ()=> { vars.containers.loadingScreen.destroy(); }})
            break;

            default:
                console.error(`Phase (${_phase}) was invalid!`);
                return false;
            break;
        }
    },

    files: {
        audio: {
            load: function() {
                scene.load.audio('explosionWater', 'sounds/explosionWater.ogg');
                scene.load.audio('aircraftDrone', 'sounds/aircraftDrone.ogg');
            }
        },

        fonts: {
            load: ()=> {
                scene.load.bitmapFont('defaultFont', 'font/rdFont.png', 'font/rdFont.xml');
                scene.load.bitmapFont('defaultFontSmall', 'font/rdFontSmall.png', 'font/rdFontSmall.xml');
            }
        },

        images: {
            load: function() {
                // scene.load.image('keyName', 'folder/file.png');
                scene.load.atlas('mapPieces', 'images/mapPieces.png', 'images/mapPieces.json');
                scene.load.atlas('options', 'images/options.png', 'images/options.json');
                scene.load.atlas('ui', 'images/ui.png', 'images/ui.json');
                scene.load.image('whitepixel', 'images/whitepixel.png');
            }
        },

        loadAssets: function() {
            scene.load.setPath('assets');

            let fV = vars.files;
            fV.audio.load();
            fV.images.load();
            fV.fonts.load();
        }
    },

    containers: {
        init: function(_firstTime=false) {
            vars.DEBUG && console.log(`%cFN: containers > init`, `${consts.console.defaults} ${consts.console.colours.functionCall}`);

            let depths = consts.depths;

            !scene.containers ? scene.containers = { } : null;

            // this container sits under the clickable positions on the board and holds the bombs and position "numbers" (amount of bombs near this position)
            vars.containers.clicked = scene.containers.clicked = scene.add.container().setName('clicked').setDepth(depths.clicked);
            // this container holds the clickable portion of the game board. It sits above the clicked container
            vars.containers.unclicked = scene.containers.unclicked = scene.add.container().setName('unclicked').setDepth(depths.unclicked);
            // flag container, sits above the unclicked's
            vars.containers.flags = scene.containers.flags = scene.add.container().setName('flags').setDepth(depths.flags);
            
            _firstTime ? vars.containers.gameUI = scene.containers.gameUI = scene.add.container().setName('gameUI').setDepth(depths.gameUI) : null;
            // options screen
            _firstTime ? vars.containers.options = scene.containers.options = scene.add.container().setName('options').setDepth(depths.options) : null;

            // generating map pop up
            _firstTime ? vars.containers.generatingMap = scene.containers.generatingMap = scene.add.container().setName('generatingMap').setDepth(depths.generatingMap) : null;


            // DEBUG container. sits above everything
            _firstTime && vars.DEBUG ? vars.containers.debug = scene.containers.debug = scene.add.container().setName('debug').setDepth(depths.debug) : null;
        },

        showGenMap: (_show=true)=> {
            scene.containers.generatingMap.setVisible(_show);
        }
    },

    groups: {
        init: function() {
            scene.groups = { };
            //scene.groups.groupName = scene.add.group().setName('groupName');
        },
        createGroupsForColumns: ()=> {
            vars.DEBUG && console.log(`Generating groups for map`);
            let bS = vars.boardSize;
            let w = bS.width;
            //let h = bS.height;
            for (let c=0; c<w; c++) {
                vars.groups[`colGroup_${c}`] = scene.add.group().setName(`colGroup_${c}`);
            }
        }
    },

    localStorage: {
        userDefinedWidth: null,
        userDefinedHeight: null,
        uData: { l: 0, w: 0, i: 0 },
        pre: 'mS',

        init: function() {
            let lS = window.localStorage;
            let lV = vars.localStorage;

            // user defined width and height
            !lS[`${lV.pre}_userDefinedWidth`] ? lS[`${lV.pre}_userDefinedWidth`] = 10 : null;
            lV.userDefinedWidth = lS[`${lV.pre}_userDefinedWidth`]|0;

            !lS[`${lV.pre}_userDefinedHeight`] ? lS[`${lV.pre}_userDefinedHeight`] = 10 : null;
            lV.userDefinedHeight = lS[`${lV.pre}_userDefinedHeight`]|0;

            // game losses
            !lS[`${lV.pre}_losses`] ? lS[`${lV.pre}_losses`] = 0 : null;
            lV.uData.l = lS[`${lV.pre}_losses`]|0;

            // game wins
            !lS[`${lV.pre}_wins`] ? lS[`${lV.pre}_wins`] = 0 : null;
            lV.uData.w = lS[`${lV.pre}_wins`]|0;

            // game wins
            !lS[`${lV.pre}_instaDeaths`] ? lS[`${lV.pre}_instaDeaths`] = 0 : null;
            lV.uData.i = lS[`${lV.pre}_instaDeaths`]|0;
        },

        incrementInstaDeaths: ()=> {
            // if the player only took 1 or 2 moves before dying, its counted as an "insta death"
            let lS = window.localStorage;
            let lV = vars.localStorage;
            lV.uData.i++;
            lS[`${lV.pre}_instaDeaths`] = lV.uData.i;
        },

        incrementLosses: ()=> {
            let lS = window.localStorage;
            let lV = vars.localStorage;
            lV.uData.l++;
            lS[`${lV.pre}_losses`] = lV.uData.l;
            
            // Player died (clicked on a mine). If theyve taken < 3 shots, its counted as an insta death
            vars.game.move<3 ? lV.incrementInstaDeaths() : null;

            vars.UI.updateStats();
        },

        incrementWins: ()=> {
            let lS = window.localStorage;
            let lV = vars.localStorage;
            lV.uData.w++;
            lS[`${lV.pre}_wins`] = lV.uData.w;

            vars.UI.updateStats();
        },

        resetAll: ()=> {
            vars.DEBUG && console.log(`Reseting user data...`);
            let lV = vars.localStorage;
            lV.uData = { l: 0, w: 0, i: 0 };

            let lS = window.localStorage;
            lS[`${lV.pre}_userDefinedWidth`] = 10;
            lS[`${lV.pre}_userDefinedHeight`] = 10;
            lS[`${lV.pre}_losses`] = 0;
            lS[`${lV.pre}_wins`] = 0;
            lS[`${lV.pre}_instaDeaths`] = 0;
        },

        updateUserDefinedHeight: ()=> {
            let lS = window.localStorage;
            let lV = vars.localStorage;
            lS[`${lV.pre}_userDefinedHeight`] = vars.boardSize.height;
            vars.DEBUG && console.log(`Saved user defined height`);
        },
        updateUserDefinedWidth: ()=> {
            let lS = window.localStorage;
            let lV = vars.localStorage;
            lS[`${lV.pre}_userDefinedWidth`] = vars.boardSize.width;
            vars.DEBUG && console.log(`Saved user defined width`);
        }
    },



    // GAME/APP
    anims: {
        init: ()=> {
            let aV = vars.anims;
            aV.initExplosion();
        },
        initExplosion: ()=> {
            scene.anims.create({ key: 'explosion', frames: scene.anims.generateFrameNames('mapPieces', { prefix: 'explosion_', end: 23 })});
        },
        revealTiles: ()=> {
            let rV = vars.reveal;
            if (!rV.count) {
                // actually, we can just return? (as count WILL is 0 and the array WILL be empty)
                return;
            };

            let instant = vars.reveal.instant;
            let delayIndex=0;
            let totalIndex=rV.revealing.length;
            while (rV.revealing.length) {
                let gO = rV.revealing.shift();
                !instant ? delayIndex++ : null;
                gO.idx=delayIndex;
                scene.tweens.add({
                    targets: gO,
                    useFrames: true,
                    delay: delayIndex,
                    duration: 4,
                    alpha: 0,
                    onComplete: (_t,_o)=> {
                        if (_o[0].idx===totalIndex-1) { // last position to show
                            vars.input.enable();
                        }
                    }
                });
            };
        },

        rippleTiles: (_col)=> {
            if (!checkType(_col,'int')) return false;
            // get the width of the board
            let width = vars.boardSize.width;
        
            // get the blocks left of this one
            let left = _col-1;
            let lInt = 1;
            while (left>=0) {
                //console.log(`L: Getting col ${left}`);
                let kiddiewinks = vars.groups[`colGroup_${left}`].children.entries;
                scene.tweens.add({
                    targets: kiddiewinks,
                    scale: 3,
                    useFrames: true, delay: lInt, duration: 10, yoyo: true
                });
                left--; lInt++;
            }
        
            // get the blocks right of this one
            let right = _col+1;
            let rInt = 1;
            while (right<width) {
                //console.log(`R: Getting col ${right}`);
                let kiddiewinks = vars.groups[`colGroup_${right}`].children.entries;
                scene.tweens.add({
                    targets: kiddiewinks,
                    scale: 3,
                    useFrames: true, delay: rInt, duration: 10, yoyo: true
                });
                right++; rInt++;
            };
        }
    },
    audio: {
        init: ()=> {
            vars.DEBUG && console.log(`%cFN: audio > init`, `${consts.console.defaults} ${consts.console.colours.functionCall}`);

            scene.sound.volume=0.2;
        },

        playAircraftDrone: ()=> {
            vars.audio.playSound('aircraftDrone');
        },

        playExplosion: ()=> {
            vars.audio.playSound('explosionWater');
        },

        playSound: (_key)=> {
            vars.DEBUG && console.log(`%c .. FN: audio > playSound`, `${consts.console.defaults} ${consts.console.colours.functionCall}`);

            scene.sound.play(_key);
        },
    },

    camera: {
        currentZoom: 10,
        minZoom: 7, // note, we div this by 10 to get the real zoom, same below (otherwise, we'd be using +0.1 which WILL cause problems and require checks)
        maxZoom: 20,
        zoomInc: 1,

        mainCam: null,

        init: function() {
            vars.DEBUG && console.log(`%cFN: camera > init`, `${consts.console.defaults} ${consts.console.colours.functionCall}`);

            vars.camera.mainCam = scene.cameras.main;
        },

        shake: function(_duration=1000, _force=null) {
            vars.DEBUG ? console.log(`%cFN: camera > shake`, `${consts.console.defaults} ${consts.console.colours.functionCall}`) : null;

            if (!checkType(_duration, 'int')) return false;
            if (!_force) { // we base the force on the size of the map (small maps require a smaller force)
                let boardSize = vars.game.visibleCount.total;
                if (boardSize<=10*10) { // small board (100 positions)
                    _force = 0.002;
                } else if (boardSize<=20*20) { // medium board (400 positions)
                    _force = 0.005;
                } else if (boardSize<=30*20) { // large board (600 positions)
                    _force = 0.01;
                } else { // massive board
                    _force = 0.03;
                };
            };

            vars.camera.mainCam.shake(_duration,_force);
        },
        zoomIn: (_in=true)=> {
            let cV = vars.camera;
            if (_in && cV.currentZoom<cV.maxZoom) {
                cV.currentZoom += cV.zoomInc;
            } else if (!_in && cV.currentZoom>cV.minZoom) {
                cV.currentZoom -= cV.zoomInc;
            };

            cV.mainCam.setZoom(cV.currentZoom/10);
        },

        zoomReset: ()=> {
            vars.camera.mainCam.zoomTo(1);
        }
    },

    game: {
        boatCount: 0,
        grid: null,
        totalMines: 0,
        flags: [],
        mines: [],
        mineNames: [],
        move: 0,
        ready: false, // only enabled after the player clicks the start button

        getMineByPosition: (_col,_row)=> {
            if (!checkType(_col,'int') || !checkType(_row,'int')) return false;

            // we have a valid looking col and row
            return vars.game.mines.find(c=>c.name.endsWith(`_${_col}_${_row}`));
        },

        visibleCount: {
            unlocked: 0, // for the stats section (eg shown on screen as "48 of 144 complete = 33%")
            total: 0, // simply holds the rows*cols
            
            reset: ()=> {
                vars.game.visibleCount.unlocked=0;
            },
            update: ()=> {
                vars.game.visibleCount.unlocked++;
                vars.UI.updateVisibleCount();
            }
        },

        init: ()=> {
            vars.DEBUG && console.log(`\n%cFN: game > init`, `${consts.console.defaults.replace('14', '16')} ${consts.console.colours.important}`);
            //console.clear();

            let gV = vars.game;

            // delete grid if it exists
            gV.grid ? gV.grid = null : null;

            // GENERATE A NEW BOARD
            gV.setWidthHeightOfBoard();
            vars.groups.createGroupsForColumns(); // groups used for animating the board pieces (by COLUMN)
            vars.make2DArray(); // init the 2D array
            gV.generateNewGrid(); // generate the new grid ("REAL" BOARD)

            // SHOW THE "FAKE" BOARD (water/grass) WHICH SITS ABOVE THE "REAL" BOARD
            let UI = vars.UI;
            UI.generateNewBoard();

            // update the ui
            UI.updateVisibleCount(true);

            // THE BOARD HAS NOW BEEN BUILT!
            vars.containers.showGenMap(false);

            // if the options container is visible we need to fade it out
            vars.containers.options.alpha && gV.ready ? UI.hideOptions() : null;
        },

        convertRedFlagsToGreenFlags: ()=> {
            let gV = vars.game;
            let flags = gV.flags;

            let greenFlags = vars.containers.flags;

            flags.forEach((_f)=> {
                let tempPositionData = _f.name.split('_');
                let pD = { col: ~~tempPositionData[1], row: ~~tempPositionData[2] };
                
                // check if this position does indeed hold a mine
                let mine = gV.getMineByPosition(pD.col,pD.row);
                let width = _f.width;
                let x = _f.x+width/2; let y = _f.y+width/2;
                if (mine) {
                    //console.log(`This is a mine ${mine.name}, converting it to a green flag`);
                    let greenFlag = scene.add.image(x,y,'mapPieces',`greenflag${width}`).setScale(0.9); // this is annoying. ive named the flag files without camel case :S
                    greenFlags.add(greenFlag);
                } else { // this wasnt a mine... lol
                    let redFlag = scene.add.image(x,y,'mapPieces',`redflag${width}`).setScale(0.9); // this is annoying. ive named the flag files without camel case :S
                    greenFlags.add(redFlag);
                };
            });
        },

        generateNewGrid: ()=> {
            vars.DEBUG && console.log(`Generating New Grid`);
            let cols = vars.boardSize.width;
            let rows = vars.boardSize.height;
            vars.game.visibleCount.total = cols*rows;

            let w = vars.boardTileSizes.x;
            let totalMines = vars.game.totalMines = ~~(vars.difficulty.getMinePercentage() * (cols*rows));
            let options = [];
            vars.game.grid = vars.make2DArray(cols, rows);
            for (let col = 0; col < cols; col++) {
                for (let row = 0; row < rows; row++) {
                    vars.game.grid[col][row] = new Cell(col, row, w);
                    options.push([col, row]);
                };
            };

            for (let n = 0; n < totalMines; n++) {
                let index = getRandom(0,options.length-1);
                let selected = options.splice(index,1)[0];
                let col = selected[0];
                let row = selected[1];
                vars.game.grid[col][row].mine = true;
            };

            for (let col = 0; col < cols; col++) {
                for (let row = 0; row < rows; row++) {
                    vars.game.grid[col][row].countMines();
                };
            };


            // NOW DRAW EVERYTHING
            vars.UI.generateRevealedTiles();
        },

        new: ()=> {
            vars.DEBUG && console.log(`+++ Starting a new game! +++`);
            vars.containers.showGenMap(true);

            scene.tweens.addCounter({ // wait a few frames, so we can show the generating map container
                from: 0, to: 1, useFrames: true, duration: 5, onComplete: ()=> {
                    // reset everything
                    let gV = vars.game;
                    gV.move = 0;
                    gV.mines = [];
                    gV.flags = [];
                    gV.visibleCount.reset();

                    let UI = vars.UI;
                    UI.updateVisibleCount(true);

                    // hide the game over screen
                    UI.gameOverFadeIn(false);
                    UI.gameWinFadeIn(false);

                    // destroy everything in the clicked and unclicked containers
                    let c = vars.containers;
                    ['clicked','unclicked','flags'].forEach((_container)=> {
                        c[_container].destroy();
                    });

                    // create the containers again
                    c.init();
                    // READY TO DRAW THE NEW BOARD
                    gV.init();
                }
            })
            
        },

        over: (_col,_row)=> { // clicking on a mine calls this function
            vars.DEBUG && console.log(`💀💀💀 %cPlayer hit a mine, showing all the things%c 💀💀💀`,'font-size: 14px; color: red;','font-size: default');
            vars.camera.zoomReset();
            vars.reveal.all();
            vars.localStorage.incrementLosses();
            vars.camera.shake(1000);
            vars.audio.playExplosion(); // this is the initial explosion, it should be repeated for the amount of bombs
            
            // convert the flags to green (valid mine position) and red (the other)
            vars.game.convertRedFlagsToGreenFlags();
            
            // find all the bombs and explode them
            //let delayInFrames = vars.UI.blowUpAllMines();
            let delayInFrames = vars.UI.blowUpAllMinesByColumn(_col,_row); // as we ignore the initial clicked bomb, we must pass in the row as well to generate its name
            vars.anims.rippleTiles(_col);
            
            scene.tweens.addCounter({
                from: 0, to: 1, useFrames: true, duration: delayInFrames+30, onComplete: ()=> { vars.UI.gameOverFadeIn(); }
            });
        },

        placeFlag: (_col, _row, _w)=> {
            vars.DEBUG && console.log(`Placing flag at col,row: ${_col},${_row}`);
            let container = vars.containers.unclicked;
            let flags = vars.game.flags;

            //  x position       y position
            let x = _col*_w; let y = _row*_w;
            let name = `redFlag_${_col}_${_row}`;
            let flag = scene.add.image(x,y,'mapPieces', `redflag${_w}`).setName(name).setOrigin(0).setScale(0.9).setInteractive();
            flags.push(flag);
            container.add(flag);
            vars.UI.updateVisibleCount();
        },

        setWidthHeightOfBoard: ()=> {
            let positions = vars.boardSize;
            let tileSizes = vars.tileSizes; // in pixels
            let maxWHs =  vars.maxWHs;
            let tS = { x: 0, y: 0, xIndex: null, yIndex: null };

            tS.xIndex = positions.width <= maxWHs[2][0] ? 2 : positions.width <= maxWHs[1][0] ? 1 : 0;
            tS.yIndex = positions.height <=maxWHs[2][1] ? 2 : positions.height <= maxWHs[1][1] ? 1 : 0;

            let sI = tS.xIndex>tS.yIndex ? tileSizes[tS.yIndex] : tileSizes[tS.xIndex];
            vars.boardTileSizes = {...tS, ...{ x: sI, y: sI }};
        },

        sortMinesIntoColumns: ()=> {
            // sort mines into columns
            if (!vars.game.mines.length) return false;

            let bombCols = {};
            vars.game.mines.forEach((_m)=> {
                let col = ~~(_m.name.split('_')[1]);
                !bombCols[col] ? bombCols[col]=[]: null;
                bombCols[col].push(_m);
            });

            return bombCols;
        },

        win: ()=> {
            vars.DEBUG && console.log(`Player has won!`);
            vars.camera.zoomReset();

            vars.localStorage.incrementWins();
            vars.game.visibleCount.reset();
            vars.reveal.all();

            let UI = vars.UI;
            UI.generateFlyOver();
            UI.generateFleet();
        }
    },

    input: {
        enabled: false,
        isEnabled: ()=> {
            return vars.input.enabled;
        },
        enable: (_enable=true)=> {
            vars.DEBUG && console.log(`%c${_enable ? 'Enabling' : 'Disabling'} input`, `color: ${_enable ? '#4dff4d' : '#ff4d4d'}`);
            vars.input.enabled = _enable;
        },
        init: ()=> {
            vars.DEBUG && console.log(`%cFN: input > init`, `${consts.console.defaults} ${consts.console.colours.functionCall}`);

            vars.input.initCombos();

            scene.input.on('gameobjectdown', function (pointer, gameObject) {
                if (gameObject.alpha!==1) return false;

                let name = gameObject.name;

                if (name.startsWith('boardPosition')) {
                    if (gameObject.alpha!==1) return false;
                    vars.game.move++;
                    // get the position data for the clicked on piece
                    let positionData = name.split('_');
                    let col = ~~positionData[1];
                    let row = ~~positionData[2];
                    let w = gameObject.width;

                    if (pointer.button===2) {
                        vars.game.placeFlag(col, row, w);
                        return;
                    };
                    !vars.reveal.instant ? vars.input.enable(false) : null; // // if instant is false, disable input
                    gameObject.alpha = 0.99; // quickly set the alpha below 1, so it isnt triggered to hide again by the reveal function

                    // deal with the real board
                    // its already visible underneath the grass/water tiles, so we dont have to "show" it. We just have to hide this object
                    // flood fill will do the rest
                    // deal with the tile that was clicked on
                    scene.tweens.add({
                        targets: gameObject,
                        useFrames: true, duration: 5, alpha: 0,
                        onComplete: ()=> { // now that weve hidden this tile, decide if it was a good move or not
                            vars.DEBUG && console.log(`Testing boardPosition`);
                            if (vars.game.grid[col][row].reveal()==='dead') {
                                vars.game.over(col,row);
                                return;
                            };
                            // set the alpha of every revealed (in locked and unlocked containers)
                            vars.anims.revealTiles();
                        }
                    });

                    return;
                };

                if (name==='newGame') {
                    vars.game.new();
                    return;
                };

                if (name.startsWith('redFlag_')) {
                    vars.DEBUG && console.log(`Red Flag (${name}) clicked on`);
                    if (pointer.button===2) { // remove this redFlag
                        gameObject.destroy();
                        let gV = vars.game;
                        let flagIndex = gV.flags.findIndex(c=>c.name===name);
                        gV.flags.splice(flagIndex,1);
                        vars.UI.updateVisibleCount();
                        return;
                    };
                    return;
                };

                if (name.startsWith('options_')) {
                    vars.DEBUG && console.log(`Options button clicked`);
                    name = name.replace('options_','');

                    if (name.startsWith('bS_')) { // board size option
                        let sizes = name.split('_')[1].split('x');
                        let w = sizes[0]|0;
                        let h = sizes[1]|0;

                        vars.boardSetSize(w,h);

                        // move the selected tick
                        vars.phaserObjects.options_selectedTick.y = vars.phaserObjects.options_newSelectionTick.y;
                        
                        return;
                    };

                    if (name.startsWith('bD_')) { // difficulty
                        name = name.split('_')[1].toLowerCase();
                        vars.difficulty.current = name;

                        // move the selected tick
                        vars.phaserObjects.options_selectedDTick.y = vars.phaserObjects.options_newSelectionDTick.y;

                        return true;
                    };

                    // otherwise...
                    switch(name) {
                        case 'upWidth':
                            vars.DEBUG && console.log('  > Increasing the width var');
                            vars.boardSizeWidthIncrease();
                            return;
                        break;
                        
                        case 'downWidth':
                            vars.DEBUG && console.log('  > Decreasing the width var');
                            vars.boardSizeWidthIncrease(false);
                            return;
                        break;
                        
                        case 'upHeight':
                            vars.DEBUG && console.log('  > Increasing the height var');
                            vars.boardSizeHeightIncrease();
                            return;
                        break;
                        
                        case 'downHeight':
                            vars.DEBUG && console.log('  > Decreasing the height var');
                            vars.boardSizeHeightIncrease(false);
                            return;
                        break;

                        case 'startGame':
                            vars.DEBUG && console.log(`Starting game`);
                            !vars.game.ready ? vars.game.ready=!0 : null;

                            // if we get here we have a non-default layout... THIS ALWAYS HAPPENS, NOW!
                            vars.game.new();
                        break;

                        default:
                            vars.DEBUG && console.log(`  > Unknown option button with name ${name}`);
                        break;
                        
                    };
                    return;
                };

                if (name=='optionsButton') {
                    vars.UI.hideOptions(false);
                    return;
                };

                if (!name) return;

                console.warn(`Unknown button ${name}!`);

                
            });

            scene.input.on('gameobjectover', function (pointer, gameObject) {
                if (vars.containers.options.alpha) {
                    if (gameObject.name==='playerstats') { // is it the player stats the user is over?
                        vars.phaserObjects.iDI.setVisible(true);
                        return;
                    };

                    vars.input.overOption(gameObject);
                    return;
                }

                if (gameObject.name.startsWith('boardPosition_')) {
                    // move the highlighter
                    vars.phaserObjects.highlight.setPosition(gameObject.x,gameObject.y);
                    return;
                };
            });

            scene.input.on('gameobjectout', function (pointer, gameObject) {
                if (vars.containers.options.alpha) { // hide the select tick behind the current value tick
                    if (gameObject.name==='playerstats') { // is it the player stats the user is over?
                        vars.phaserObjects.iDI.setVisible(false);
                        return;
                    };

                    vars.phaserObjects.options_newSelectionTick.y = vars.phaserObjects.options_selectedTick.y;
                    vars.phaserObjects.options_newSelectionDTick.y = vars.phaserObjects.options_selectedDTick.y;
                    return;
                };
            });

            // mouse scroll (zoom in / out)
            scene.input.on('wheel', function (pointer, gameObjects, deltaX, deltaY, deltaZ) {
                return false;
                if (deltaY<0) { // scroll up
                    vars.camera.zoomIn();
                } else { // scroll down
                    vars.camera.zoomIn(false);
                };
            });
        },
        initCombos: ()=> {
            let sIK = scene.input.keyboard;
            sIK.createCombo('reset', { resetOnMatch: true });

            sIK.on('keycombomatch', function (event) {
                let comboName = '';
                event.keyCodes.forEach( (cC)=> {
                    comboName += String.fromCharCode(cC);
                });
                switch (comboName) {
                    case 'RESET': vars.localStorage.resetAll(); vars.UI.updateStats(); break;
                };
            });
        },

        overOption: (_object)=> {
            // move the new selection tick
            let name = _object.name;
            if (!name.startsWith('options_')) return false;

            name = name.replace('options_','');

            if (name.startsWith('bS_')) {
                vars.phaserObjects.options_newSelectionTick.y = _object.y+30;
                return;
            };

            if (name.startsWith('bD_')) {
                vars.phaserObjects.options_newSelectionDTick.y = _object.y+30;
                return;
            };
        }
    },

    particles: {
        init: ()=> {
            vars.DEBUG && console.log(`%cFN: particles > init`, `${consts.console.defaults} ${consts.console.colours.functionCall}`);

            scene.particles = {}
        },

        new: ()=> {
            /* EXAMPLE PARTICLE EMITTER
            // let name = 'particleName';
            // scene.particles[name] = scene.add.particles(name);

            // Create Emitter
            scene.particles[name].createEmitter({
                x: x, y: y,
                speedX: { min: 10, max: 100},
                lifespan: 1000,
                frequency: 10, quantity: 1
                blendMode: 'ADD',
                deathZone: { type: 'onLeave', source: square }
            }); */
        }
    },

    phaser: {
        convertHSLToTint: (_h=null)=> {
            if (!checkType(_h,'number')) { console.error(`Invalid hue ${_h}`);}
            return Phaser.Display.Color.HSLToColor(_h/360,1,0.5).color;
        }
    },

    UI: {
        //       INIT UI        \\
        init: function() {
            vars.DEBUG && console.log(`%cFN: ui > init`, `${consts.console.defaults} ${consts.console.colours.functionCall}`);

            let UI = vars.UI;

            UI.initGameUI();
            UI.initOptions();
            UI.initGeneratingMap();

        },
        initGameUI: ()=> {
            let cC = consts.canvas;
            let container = vars.containers.gameUI;

            let font = vars.fonts.default;
            let unlockedText = vars.phaserObjects.unlockedText = scene.add.text(cC.cX, cC.height-10, `Mines: 0. Flags: 0. Cleared 0 of 0 (0%)`,font).setOrigin(0.5,1);
            container.add(unlockedText);

            // now add the black background
            let bg = vars.phaserObjects.gameOverBG = scene.add.image(cC.cX,cC.cY,'whitepixel').setScale(cC.width*(1/0.7),cC.height*(1/0.7)).setTint(0).setAlpha(0);
            container.add(bg);

            // add the win popup
            let winLogo = vars.phaserObjects.winPopUp = scene.add.image(cC.cX, cC.height*0.4, 'ui', 'winner').setAlpha(0);
            winLogo.hMin = 30;
            winLogo.hMax = 150;

            winLogo.h1 = 30; winLogo.h1Reverse = false;
            winLogo.h2 = 90; winLogo.h2Reverse = false;
            container.add(winLogo);

            winLogo.tween = scene.tweens.add({
                targets: winLogo,
                duration: 3000,
                scale: 1.2,
                yoyo: true, repeat: -1,
                ease: 'Bounce',
                onUpdate: (_t,_o)=> {
                    if (!_o.alpha) return false;

                    let inc = 0.25;

                    // the win logo is visible update the h1 and h2 vars
                    let logo = _o;
                    if (!logo.h1Reverse) {
                        logo.h1+inc <= logo.hMax ? logo.h1+=inc : logo.h1Reverse=!logo.h1Reverse;
                    } else {
                        logo.h1-inc >= logo.hMin ? logo.h1-=inc : logo.h1Reverse=!logo.h1Reverse;
                    };

                    if (!logo.h2Reverse) {
                        logo.h2+inc <= logo.hMax ? logo.h2+=inc : logo.h2Reverse=!logo.h2Reverse;
                    } else {
                        logo.h2-inc >= logo.hMin ? logo.h2-=inc : logo.h2Reverse=!logo.h2Reverse;
                    };

                    // convert hsl to tint
                    let h1 = vars.phaser.convertHSLToTint(logo.h1);
                    let h2 = vars.phaser.convertHSLToTint(logo.h2);
                    _o.setTint(h1,h2,h2,h1);
                }
            });

            // LOSS POP UP
            let loseLogo = vars.phaserObjects.losePopUp = scene.add.image(cC.cX, cC.height*0.4, 'ui', 'loser').setAlpha(0);
            loseLogo.hMin = 30;
            loseLogo.hMax = 150

            loseLogo.h1 = 30; loseLogo.h1Reverse = false;
            loseLogo.h2 = 90; loseLogo.h2Reverse = false;
            container.add(loseLogo);

            loseLogo.tween = scene.tweens.add({
                targets: loseLogo,
                duration: 3000,
                scale: 1.2,
                yoyo: true, repeat: -1,
                ease: 'Bounce',
                onUpdate: (_t,_o)=> {
                    if (!_o.alpha) return false;

                    let inc = 0.25;

                    // the lose logo is visible update the h1 and h2 vars
                    let logo = _o;
                    if (!logo.h1Reverse) {
                        logo.h1+inc <= logo.hMax ? logo.h1+=inc : logo.h1Reverse=!logo.h1Reverse;
                    } else {
                        logo.h1-inc >= logo.hMin ? logo.h1-=inc : logo.h1Reverse=!logo.h1Reverse;
                    };

                    if (!logo.h2Reverse) {
                        logo.h2+inc <= logo.hMax ? logo.h2+=inc : logo.h2Reverse=!logo.h2Reverse;
                    } else {
                        logo.h2-inc >= logo.hMin ? logo.h2-=inc : logo.h2Reverse=!logo.h2Reverse;
                    };

                    // convert hsl to tint
                    let h1 = vars.phaser.convertHSLToTint(logo.h1);
                    let h2 = vars.phaser.convertHSLToTint(logo.h2);
                    _o.setTint(h1,h2,h2,h1);
                }
            });


            // NEW GAME BUTTON
            let version = vars.tileType;
            switch (version) {
                case 'water': var frame = 'Water'; break;
                case 'grass': var frame = 'Grass'; break;
            };
            let newGame = vars.phaserObjects.newGameButton = scene.add.image(cC.cX, cC.height*0.75, 'ui', `newGame${frame}`).setName('newGame').setAlpha(0).setInteractive();

            // OPTION BUTTON THAT SITS ABOVE THE GAME
            let optionsButton = vars.phaserObjects.optionsButton = scene.add.image(cC.width-10, 0+10, 'options', `optionsIcon`).setName('optionsButton').setOrigin(1,0).setInteractive();

            container.add([newGame, optionsButton]);
        },
        initGeneratingMap: ()=> {
            let cC = consts.canvas;
            let container = scene.containers.generatingMap;

            let bg = scene.add.image(cC.cX, cC.cY, 'whitepixel').setScale(cC.width, cC.height).setTint(0x0).setInteractive();

            let tint = 0xff8000;
            let genText = scene.add.bitmapText(cC.cX, cC.height*0.2, 'defaultFont', 'GENERATING MINEFIELD\n\nPLEASE WAIT', 96,1).setOrigin(0.5).setTint(tint).setLetterSpacing(10);
            let genTextWarning = scene.add.bitmapText(cC.cX, cC.height*0.75, 'defaultFont', `Don't Panic if the game looks like it has crashed. It hasn't :)\n\nGenerating Large Maps can take between\n5 and 10s depending on the speed of your CPU`, 32,1).setOrigin(0.5).setTint(tint).setLetterSpacing(10);

            container.add([bg, genText, genTextWarning]);

            // NOW ADD THE SPINNER
            let spinner = vars.phaserObjects.spinner = scene.add.image(cC.cX, cC.height*0.5,'ui','spinner');
            spinner.tweens = {}
            spinner.tweens.rotation = scene.tweens.add({
                targets: spinner,
                angle: 360,
                diration: 1000,
                repeat: -1
            });

            container.add(spinner);

            vars.containers.showGenMap(false);
        },
        iniLoadingScreen: ()=> {
            let cC = consts.canvas;
            !vars.containers ? vars.containers = {} : null;
            let c = vars.containers.loadingScreen = scene.add.container().setName('loadingScreen').setDepth(999);
            
            let loadingBG = scene.add.image(0,0,'loadingScreen','bgTile').setScale(cC.width,1).setOrigin(0);
            c.add(loadingBG);

            // add the mines
            let xInc = cC.width*0.1;
            let x = xInc-100;
            let y = 350; let yMod=150;
            let delay=50;
            let up=true;
            'mine'.split('').forEach((_l)=> {
                let yOff = (up|0)*yMod;
                let a = scene.add.image(x,y-yOff,'loadingScreen',`${_l}Mine`).setOrigin(0);
                a.tween = scene.add.tween({ targets: a, delay: delay, duration: 1000, y: a.y-80, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
                c.add(a);
                x+=xInc; up=!up; delay+=50;
            });
            
            x=cC.width*0.3-100; delay=50;
            y+=400;
            'sweeper'.split('').forEach((_l)=> {
                let yOff = (up|0)*yMod;
                let a = scene.add.image(x,y+yOff,'loadingScreen',`${_l}Mine`).setOrigin(0);
                a.tween = scene.add.tween({ targets: a, delay: delay, duration: 1000, y: a.y-80, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
                c.add(a);
                x+=xInc; up=!up; delay+=50;
            });
        },
        initOptions: ()=> {
            let cC = consts.canvas;
            let container = vars.containers.options;

            // BLACK BACKGROUND
            let bg = scene.add.image(cC.cX,cC.cY,'whitepixel').setScale(cC.width*(1/0.7),cC.height*(1/0.7)).setTint(0x4E95AF, 0x4E95AF, 0x000040, 0x000040).setInteractive();
            container.add(bg);
            // VERSION TEXT
            let vMsg = vars.version<1 ? `${vars.version}beta` : vars.version;
            let vMHD = 3000;
            let vText = scene.add.bitmapText(10, cC.height-10, 'defaultFontSmall', `${config.title}\nVersion ${vMsg}\nBuilt in javascript by offer0 - AUG 2022\nUses the PHASER game engine`, 24).setOrigin(0,1).setTint(0xff8000).setDepth(consts.depths.debug).setLetterSpacing(10);
            vText.tween = scene.tweens.add({ targets: vText, alpha: 0.25, delay: vMHD, duration: vMHD, hold: vMHD*10, yoyo: true, repeat: -1 });

            // floating mines header
            let delay = 0;
            let x = 480; let xInc = 150;
            let y=160;
            let scale = 0.5;
            'minesweeper'.split('').forEach((_l)=> {
                let a = scene.add.image(x,y,'loadingScreen',`${_l}Mine`).setOrigin(0).setScale(scale);
                a.tween = scene.add.tween({ targets: a, useFrames: true, delay: delay, duration: 120, y: a.y-80, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
                container.add(a);
                x+=xInc; delay+=10;
            });

            
            // BACKGROUND FOR BOARD SIZES
            let xDec = 370;
            x = cC.cX-xDec;
            
            // BOARD SIZES
            let upperBG = scene.add.image(x, 400, 'options', 'optionsSection_upper').setOrigin(0.5,0);
            let middleBG = scene.add.image(x, upperBG.y+upperBG.height, 'options', 'optionsSection_mid').setOrigin(0.5,0).setScale(1,600);
            let lowerBG = scene.add.image(x, middleBG.y+middleBG.displayHeight, 'options', 'optionsSection_lower').setOrigin(0.5,0);
            container.add([upperBG,middleBG,lowerBG]);

            // DIFFICULTY SETTINGS
            let height = 300;
            let xOD = 780;
            let upperDBG = scene.add.image(x+xOD, 400, 'options', 'optionsSection_upper').setOrigin(0.5,0);
            let middleDBG = scene.add.image(x+xOD, upperDBG.y+upperDBG.height, 'options', 'optionsSection_mid').setOrigin(0.5,0).setScale(1,height);
            let lowerDBG = scene.add.image(x+xOD, middleDBG.y+middleDBG.displayHeight, 'options', 'optionsSection_lower').setOrigin(0.5,0);
            container.add([upperDBG,middleDBG,lowerDBG]);

            // START BUTTON
            height = 100;
            xOD = 780;
            let upperSBG = scene.add.image(x+xOD, 900, 'options', 'optionsSection_upper').setOrigin(0.5,0);
            let middleSBG = scene.add.image(x+xOD, upperSBG.y+upperSBG.height, 'options', 'optionsSection_mid').setOrigin(0.5,0).setScale(1,height);
            let lowerSBG = scene.add.image(x+xOD, middleSBG.y+middleSBG.displayHeight, 'options', 'optionsSection_lower').setOrigin(0.5,0);
            container.add([upperSBG,middleSBG,lowerSBG]);
            
            
            // IMAGES (for changing the board size manually)
            x -= 150;
            let xOffset = 160;
            y = 850;
            y+=60;
            let upWidth = scene.add.image(x-10,y,'options','upButton').setName('options_upWidth').setInteractive();
            let upHeight = scene.add.image(x+xOffset,y,'options','upButton').setName('options_upHeight').setInteractive();
            y+=130;
            let downWidth = scene.add.image(x-10,y,'options','downButton').setName('options_downWidth').setInteractive();
            let downHeight = scene.add.image(x+xOffset,y,'options','downButton').setName('options_downHeight').setInteractive();
            
            container.add([upWidth,upHeight,downWidth,downHeight]);
            
            let tint = 0xB0C8DF;
            let bS = vars.boardSizes;
            let origin = 0;
            y = 460;
            let count=0;
            let fontSize = 45;
            let letterSpacing=6;
            let headingLowerBorder = 48;
            
            // BOARD SIZE HEADER
            let header = 'BOARD SIZE';
            let optionsHeader = scene.add.bitmapText(cC.cX-xDec, y,'defaultFontSmall', header, fontSize).setOrigin(0.5).setTint(tint).setLetterSpacing(letterSpacing).setInteractive();
            // DIFFICULTY HEADER
            let headerD = 'DIFFICULTY';
            let optionsDHeader = scene.add.bitmapText(cC.cX-xDec+xOD, y,'defaultFontSmall', headerD, fontSize).setOrigin(0.5).setTint(tint).setLetterSpacing(letterSpacing).setInteractive();
            container.add([optionsHeader,optionsDHeader]);
            y+=headingLowerBorder;
            let tickXOffset = 320;

            // BOARD SIZE OPTIONS
            for (let option in bS) {
                let size = bS[option];
                let optionString = `${size.width} x ${size.height}`;
                let thisY = y + count*72;
                let name = `options_bS_${optionString.replaceAll(' ','')}`;
                let optionText = vars.phaserObjects[name] = scene.add.bitmapText(x-60, thisY,'defaultFontSmall', optionString, fontSize).setName(name).setOrigin(origin).setTint(tint).setLetterSpacing(letterSpacing).setInteractive();
                if (!count) {
                    optionText.selected=true;
                    let newSelectionTick = vars.phaserObjects.options_newSelectionTick = scene.add.image(x+tickXOffset, thisY+30, 'options', 'selected').setTint(0xdddddd).setAlpha(0.5);
                    let selectedTick = vars.phaserObjects.options_selectedTick = scene.add.image(x+tickXOffset, thisY+30, 'options', 'selected').setTint(tint);
                    container.add([newSelectionTick,selectedTick]);
                }
                optionText.input.hitArea.width=400; // widen the hit area
                container.add(optionText);
                count++;
            };

            // NOW ADD THE USER DEFINED SIZE
            let lS = vars.localStorage;
            let userDefinedSize = [lS.userDefinedWidth, lS.userDefinedHeight];
            y = 940;
            let widthText = vars.phaserObjects.userWidthText = scene.add.bitmapText(x-10, y, 'defaultFontSmall', userDefinedSize[0], fontSize).setOrigin(0.5,0).setTint(tint).setLetterSpacing(letterSpacing).setInteractive();
            let xText = scene.add.bitmapText(x+60, y, 'defaultFontSmall', 'x', fontSize-10).setOrigin(origin).setTint(tint);
            let heightText = vars.phaserObjects.userHeightText = scene.add.bitmapText(x+160, y, 'defaultFontSmall', userDefinedSize[1], fontSize).setOrigin(0.5,0).setTint(tint).setLetterSpacing(letterSpacing).setInteractive();
            container.add([widthText,xText,heightText]);


            // DIFFICULTY SETTINGS
            let dS = vars.difficulty.minePercent;
            count = 0;
            y = 460+headingLowerBorder;
            for (let option in dS) {
                let optionString = option.toUpperCase();;
                let thisY = y + count*72;
                let name = `options_bD_${optionString}`;
                let optionText = vars.phaserObjects[name] = scene.add.bitmapText(x-60+xOD, thisY,'defaultFontSmall', optionString, fontSize-10).setName(name).setOrigin(origin).setTint(tint).setLetterSpacing(letterSpacing).setInteractive();
                if (!count) {
                    optionText.selected=true;
                    let newSelectionDTick = vars.phaserObjects.options_newSelectionDTick = scene.add.image(x+tickXOffset+xOD, thisY+30, 'options', 'selected').setTint(0xdddddd).setAlpha(0.5);
                    let selectedDTick = vars.phaserObjects.options_selectedDTick = scene.add.image(x+tickXOffset+xOD, thisY+30, 'options', 'selected').setTint(tint);
                    container.add([newSelectionDTick,selectedDTick]);
                };
                optionText.input.hitArea.width=400; // widen the hit area
                container.add(optionText);
                count++;
            };

            // START GAME BUTTON
            let name = `options_startGame`;
            let startButton = vars.phaserObjects.startButton = scene.add.bitmapText(x+xOD-10, upperSBG.y+upperSBG.height+20,'defaultFontSmall', 'BEGIN !', fontSize+10).setName(name).setOrigin(origin).setTint(tint).setLetterSpacing(letterSpacing).setInteractive();
            container.add(startButton);


            // PLAYERS STATS
            let uData = vars.localStorage.uData;
            let wins = uData.w;
            let loss = uData.l;
            let insta = uData.i;
            let stats = vars.phaserObjects.stats = scene.add.bitmapText(cC.width*0.654, cC.height*0.9, 'defaultFontSmall', `${wins} WINS.\n${loss} LOSSES.\n${insta} INSTA DEATHS*`, fontSize).setOrigin(0.5).setTint(tint).setName('playerstats').setInteractive();
            vars.phaserObjects.stats.hasOver=true;

            let instaDeathsInfo = vars.phaserObjects.iDI = scene.add.bitmapText(cC.width-10, cC.height-10, 'defaultFontSmall', `* losses where you had less than 3 total moves`, fontSize/2).setOrigin(1).setTint(tint).setVisible(false);
            container.add([stats,instaDeathsInfo]);
            //container.setAlpha(0);

        },
        // -------------------- \\



        blowUpAllMinesByColumn: (_col)=> {
            let gV = vars.game;

            // sort the mines into columns
            let mines = gV.sortMinesIntoColumns();
            
            // get this columns bombs and start the destruction
            let kiddiewinks = mines[_col];
            if (kiddiewinks) {
                kiddiewinks.forEach((_k)=> {
                    _k.play('explosion');
                })
            }
            
            
            if (mines) { // we have a valid mine set
                let width = vars.boardSize.width;


                // get the mines left of this one
                let left = _col-1;
                let lInt = 1;
                while (left>=0) {
                    let kiddiewinks = mines[left];
                    scene.tweens.addCounter({
                        from: 0, to: 1,
                        useFrames: true, delay: lInt*5, duration: 10,
                        onComplete: ()=> {
                            if (kiddiewinks) {
                                kiddiewinks.forEach((_k)=> {
                                    _k.play('explosion');
                                });
                            };
                        }
                    });
                    left--; lInt++;
                };
            
                // get the blocks right of this one
                let right = _col+1;
                let rInt = 1;
                while (right<width) {
                    let kiddiewinks = mines[right];
                    scene.tweens.addCounter({
                        from: 0, to: 1,
                        useFrames: true, delay: rInt*5, duration: 10,
                        onComplete: ()=> {
                            if (kiddiewinks) {
                                kiddiewinks.forEach((_k)=> {
                                    _k.play('explosion');
                                });
                            };
                        }
                    });
                    right++; rInt++;
                };
                return rInt>lInt ? rInt*5 : lInt*5;
            };

            return false;
        },

        gameOverFadeIn: (_fadeIn=true)=> {
            let toAlpha = _fadeIn ? 1 : 0;
            let duration = toAlpha ? 2000 : 500;
            vars.DEBUG && console.log(`Fading ${toAlpha ? 'in': 'out'} game over screen`);
            let bgAlpha = toAlpha ? 0.7 : 0;
            // deal with the background
            scene.tweens.add({
                targets: vars.phaserObjects.gameOverBG,
                alpha: bgAlpha,
                duration: 1000
            });
            // deal with the lose pop up
            if (!toAlpha) {
                scene.tweens.add({
                    targets: vars.phaserObjects.newGameButton,
                    alpha: toAlpha,
                    duration: 500
                });
            };

            scene.tweens.add({
                targets: vars.phaserObjects.losePopUp,
                alpha: toAlpha,
                duration: duration,
                onComplete: ()=> {
                    // now show or hide the new game button
                    if (toAlpha) {
                        scene.tweens.add({
                            targets: vars.phaserObjects.newGameButton,
                            alpha: toAlpha,
                            duration: 500
                        });
                    };
                }
            });
        },
        gameWinFadeIn: (_fadeIn=true)=> {
            let toAlpha = _fadeIn ? 1 : 0;
            let duration = toAlpha ? 2000 : 500;
            vars.DEBUG && console.log(`Fading ${toAlpha ? 'in': 'out'} game win screen`);
            let bgAlpha = toAlpha ? 0.7 : 0;
            scene.tweens.add({
                targets: vars.phaserObjects.gameOverBG,
                alpha: bgAlpha,
                duration: 500
            });
            scene.tweens.add({
                targets: vars.phaserObjects.winPopUp,
                alpha: toAlpha,
                duration: duration,
                onComplete: ()=> {
                    // now show or hide the new game button
                    scene.tweens.add({
                        targets: vars.phaserObjects.newGameButton,
                        alpha: toAlpha,
                        duration: 500
                    });
                }
            });
        },

        generateFleet: ()=> {
            let cC = consts.canvas;
            let gV = vars.game;
            let depth = consts.depths.gameUI;
            let bH = vars.boardSize;
            let cY = vars.containers.clicked.y;
            let w = vars.boardTileSizes.x;
            for (let b=0; b<bH.height; b++) {
                let bFrame = `battleship_${getRandom(0,2)}`;
                let startX = getRandom(2,6)*100;
                let battleship = scene.add.image(-startX, b*w+cY+16, 'mapPieces', bFrame).setOrigin(0).setDepth(depth);
                gV.boatCount++;

                scene.tweens.add({
                    targets: battleship,
                    useFrames: true,
                    x: cC.width+200+startX/2,
                    delay: getRandom(1,30),
                    duration: 800,
                    onComplete: (_t,_o)=> {
                        _o[0].destroy();
                        gV.boatCount--;
                        if (!gV.boatCount) {
                            vars.UI.gameWinFadeIn();
                        };
                    }
                });
            };
        },
        generateFlyOver: ()=> {
            let cC = consts.canvas;
            let cdC = vars.containers.clicked;
            let cH = cdC.height;
            let cX = cdC.x;

            let w = vars.boardTileSizes.x; // 64,48,32

            let yInc = w*2;
            // Scale - we need to figure out the scale of the plane (at 1x its 256px high)
            let pHeight = 256;
            let pScale = yInc/pHeight; // it covers 2 rows (eg 0&1, 2&3 etc)
            

            let bWidth = vars.boardSize.width;
            let totalPlanes = (cH/yInc+0.5)|0;

            let y = cdC.y;
            for (let p=0; p<totalPlanes; p++) {
                let xOffset = getRandom(0,4)*100;
                let plane = scene.add.image(-200-xOffset,y,'mapPieces','b17_256').setName(`plane_${p}`).setOrigin(0).setScale(pScale).setDepth(consts.depths.gameUI);
                plane.currentlyOver = -1;
                scene.tweens.add({
                    targets: plane, x: cC.width+128+xOffset/2, delay: getRandom(0,10)*100, duration: 4000, onComplete: (_t,_o)=> { _o[0].tween.remove(); _o[0].destroy(); },
                    onUpdate: (_t,_o)=> {
                        if (_o.x+w*2<cX) return false; // we arent flying over the board yet

                        // update the currentOver
                        let row = (_o.name.split('_')[1]|0)*2;
                        let col = ((_o.x-cX)/w)|0;
                        if (col>=bWidth) return false; // we ignore anything over the board width (-1)
                        if (_o.currentlyOver!==col) { // new column, check for mines
                            _o.currentlyOver=col;
                            //console.log(`Currently Over ${_o.currentlyOver}. This plane deals with rows ${`${row} and ${row+1}`}`);
                            // check if theres a bomb under the plane
                            // TOP ROW
                            let found = false;
                            if (vars.game.getMineByPosition(_o.currentlyOver,row)) {
                                vars.DEBUG && console.log(`Mine found at row ${row}, col ${_o.currentlyOver}`);
                                vars.game.getMineByPosition(_o.currentlyOver,row).play('explosion');
                                found=true;
                            };
                            // LOWER ROW
                            if (vars.game.getMineByPosition(_o.currentlyOver,row+1)) {
                                vars.DEBUG && console.log(`Mine found at row ${row}, col ${_o.currentlyOver}`);
                                vars.game.getMineByPosition(_o.currentlyOver,row+1).play('explosion');
                                found=true;
                            };

                            found && vars.audio.playExplosion();
                        };
                    }
                });
                // bob the planet up and down
                plane.tween = scene.tweens.add({
                    targets: plane, scale: 0.6, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
                });
                y+=yInc;
            };

            // start the bomber drone sound effect
            vars.audio.playAircraftDrone();
        },

        generateNewBoard: ()=> {
            let cC = consts.canvas;
            let widthOfScreen = cC.width;
            let heightOfScreen = cC.height;
            
            // these vars are only needed if we generate the max wH's (we currently have them hard coded)
            /* let border = 32;
            let wOS = widthOfScreen - border*2;
            let hOS = heightOfScreen - border*2; */

            // FIGURE OUT THE BOARD SIZE AND POSITION
            let bTS = vars.boardTileSizes;
            let bS = vars.boardSize;
            let boardSizeInPx = [bTS.x*bS.width, bTS.y*bS.height];

            let containerLeftBorder = (widthOfScreen - boardSizeInPx[0]) / 2;
            let containerTopBorder = (heightOfScreen - boardSizeInPx[1]) / 2;

            // NOW MOVE EACH GAME CONTAINER INTO PLACE
            let container = vars.containers.unclicked;
            container.width  = boardSizeInPx[0]; container.height = boardSizeInPx[1];
            container.setPosition(containerLeftBorder, containerTopBorder);

            // quickly set the clicked to the same
            let cdC = vars.containers.clicked;
            cdC.setPosition(containerLeftBorder, containerTopBorder);
            cdC.width = container.width; cdC.height = container.height;
            // and the flag container
            let cF = vars.containers.flags;
            cF.setPosition(containerLeftBorder, containerTopBorder);
            cF.width = container.width; cF.height = container.height;

        },
        generateRevealedTiles: ()=> {
            let startTime = new Date();

            let gV = vars.game;
            let cV = vars.containers;

            let boardSize = vars.boardSize;
            let cols = boardSize.width;
            let rows = boardSize.height;
            let grid = gV.grid;
            let mines = gV.mines;

            let nFont = vars.fonts.number;
            let c = cV.clicked;
            let container = cV.unclicked;
            let xyOff = 0;
            let xInc = vars.boardTileSizes.x;

            let groups = vars.groups;

            for (let col = 0; col < cols; col++) {
                let group = groups[`colGroup_${col}`];
                for (let row = 0; row < rows; row++) {
                    let position = grid[col][row];
                    let neighbourCount = position.neighbourCount;
                    let mine = position.mine;

                    let width = position.w;
                    let x = position.x;
                    let y = position.y;

                    !xyOff ? xyOff = width/2 : null; // if xOff is still 0, set it to half width as we need it below
                    nFont.fontSize!==`${width-4}px` ? nFont.fontSize=`${width-4}px` : null; // same with font size

                    if (mine) { // this position has a mine in it
                        let mine = scene.add.sprite(x+xyOff, y+xyOff, 'mapPieces', `mine${width}`).setName(`mine_${col}_${row}`).setScale(0.9);
                        mines.push(mine);
                        c.add(mine);
                        group.add(mine);

                        // now add the unclicked above this tile
                        let positionBlock = scene.add.image(x,y, 'mapPieces', `water${xInc}`).setName(`boardPosition_${col}_${row}`).setOrigin(0).setInteractive();
                        container.add(positionBlock);
                        continue;
                    };

                    // if we get here its a number (ie not a mine)
                    let string = !neighbourCount ? '' : neighbourCount;

                    // draw the outline of the position
                    if (neighbourCount) { // if its not a 0, give it an outline
                        let pBG = scene.add.image(x,y,'mapPieces',`waterUL${width}`).setOrigin(0);
                        c.add(pBG);
                        group.add(pBG);
                    } else { // no neighbours, show a low alpha copy of the water
                        let pBG = scene.add.image(x,y,'mapPieces',`water${width}`).setAlpha(0.2).setOrigin(0);
                        c.add(pBG);
                        group.add(pBG);
                    };
                    let number = scene.add.text(x+xyOff, y+xyOff, string, nFont).setOrigin(0.5);
                    c.add(number);
                    group.add(number);

                    // now add the unclicked above this tile
                    let positionBlock = scene.add.image(x,y, 'mapPieces', `water${xInc}`).setName(`boardPosition_${col}_${row}`).setOrigin(0).setInteractive();
                    container.add(positionBlock);
                };
                vars.DEBUG && console.log('Column Time: ' + ~~((new Date() - startTime)/10)/100);
            };

            // add a highlighter for the positions
            vars.phaserObjects.highlight = scene.add.image(0,0,'mapPieces', `highlightWater${xInc}`).setOrigin(0);
            container.add(vars.phaserObjects.highlight);

            let totalTime = ~~((new Date() - startTime)/10)/100;
            vars.DEBUG && console.log(`Generate Revealed Tiles took ${totalTime}s`);
        },

        hideOptions: (_hide=true)=> {
            let finalAlpha = _hide ? 0 : 1;
            scene.tweens.add({
                targets: vars.containers.options,
                alpha: finalAlpha,
                duration: 500
            })
        },



        //  UI UPDATE FUNCTIONS  \\
        updateOptionsBoardSizeHeight: ()=> {
            vars.phaserObjects.userHeightText.setText(vars.boardSize.height);
        },
        updateOptionsBoardSizeWidth: ()=> {
            vars.phaserObjects.userWidthText.setText(vars.boardSize.width);
        },
        updateStats: ()=> {
            let uData = vars.localStorage.uData;
            let wins = uData.w;
            let loss = uData.l;
            let insta = uData.i;
            let msg = `${wins} WINS.\n${loss} LOSSES.\n${insta} INSTA DEATHS*`;
            vars.phaserObjects.stats.setText(msg);
        },
        updateVisibleCount: (_reset=false)=> {
            let vCG = vars.game.visibleCount;
            let unlocked = vCG.unlocked;
            let total = vCG.total;
            let totalMines = vars.game.totalMines;
            let percent = unlocked/(total-totalMines);
            vars.phaserObjects.unlockedText.setText(`Mines: ${vars.game.mines.length}. Flags: ${vars.game.flags.length}. Cleared ${unlocked} of ${total-totalMines} (${~~(percent*100)}%)`);

            !_reset && unlocked===total-totalMines ? vars.game.win() : null;
        }
        // --------------------- \\
    }
}