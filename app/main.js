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

    mainWindow.webContents.on('new-window', function(e, url) {
      e.preventDefault();
      require('electron').shell.openExternal(url);
    });
});

global.start = function(){
  mainWindow.loadURL(url.format({ pathname: path.join(__dirname,'getcookie.html'), protocol: 'file:'}));

}

global.scrape = function(){
  mainWindow.loadURL(url.format({ pathname: path.join(__dirname,'scraping.html'), protocol: 'file:'}));

}
