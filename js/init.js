"use strict";
vars.DEBUG && console.log('Initialising...');

var config = {
    title: "MineSweeperJS",
    version: vars.version,
    url: window.location.href,
    banner: false,
    type: Phaser.WEBGL,

    backgroundColor: '#003474',
    disableContextMenu: true,

    height: consts.canvas.height,
    width: consts.canvas.width,

    loader: { crossOrigin: 'anonymous' },

    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: consts.canvas.width,
        height: consts.canvas.height
    },

    scene: {
        preload: preload,
        create: create,
        pack: {
            files: [
                { type: 'atlas', key: 'loadingScreen' }
            ]
        }
    }
};
var scene;
var game = new Phaser.Game(config);


/*
█████ ████  █████ █      ███  █████ ████  
█   █ █   █ █     █     █   █ █   █ █   █ 
█████ ████  ████  █     █   █ █████ █   █ 
█     █   █ █     █     █   █ █   █ █   █ 
█     █   █ █████ █████  ███  █   █ ████  
*/
function preload() {
    scene = this;
    //scene.add.image(x, y, 'loadingImage').setName('loadingImage');
    vars.init('PRELOAD');
};



/*
█████ ████  █████ █████ █████ █████ 
█     █   █ █     █   █   █   █     
█     ████  ████  █████   █   ████  
█     █   █ █     █   █   █   █     
█████ █   █ █████ █   █   █   █████ 
*/
function create() {
    vars.init('CREATE'); // build the phaser objects, scenes etc
    vars.init('STARTAPP'); // start the app
};