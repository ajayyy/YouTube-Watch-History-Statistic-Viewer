'use strict';

const {app, BrowserWindow} = require('electron')
const path = require('path')
const url = require('url');

var mainWindow = null;

app.on('ready', function() {
    mainWindow = new BrowserWindow({
        height: 600,
        width: 800
    });

    mainWindow.loadURL(url.format({ pathname: path.join(__dirname,'index.html'), protocol: 'file:'}));
});

global.start = function(){
  mainWindow.loadURL(url.format({ pathname: path.join(__dirname,'getcookie.html'), protocol: 'file:'}));

}
