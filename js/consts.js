"use strict";
const consts = {
    canvas: {
        width: 2560, height: 1440,
        cX: 2560/2, cY: 1440/2
    },

    console: {
        colours: {
            functionCall: '#4DA6FF',
            important: '#FFFF00',
            bad: '#FF0000', warn: '#FF0000',
            good: '#63e763'
        },

        defaults: 'font-weight: bold; font-size: 12px; font: \'consolas\'; color:'
    },

    depths: {
        clicked: 5,
        unclicked: 10,
        flags: 15,
        gameUI: 20,
        options: 50,
        generatingMap: 70,
        loadingScreen: 100,
        debug: 666
    }
}