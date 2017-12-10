'use strict';

const {app, BrowserWindow} = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');

var mainWindow = null

const util = require('util');
require('util.promisify').shim();

process.chdir('./Youtube-Watch-History-Scraper-master/');

const { spawn, exec } = require('child_process');
const readline = require('readline');
const command = null;

//make contains a method
String.prototype.contains = function(it) { return this.indexOf(it) != -1; };

var videosDownloaded = 0;

var bufferData = "";

function startScrape() {
  command = exec('scrapy crawl yth_spider');

  process.on('exit', function () {
    a.kill();
    b.kill();
  });

  command.stdout.on('data', newScrapeMessage);

  command.stderr.on('data', newScrapeMessage);
}

function newScrapeMessage(data) {
  bufferData += data.toString();
  if(bufferData.contains("'time': ")){
    videosDownloaded ++;
    console.log(videosDownloaded);

    bufferData = "";
  }
}

// readline.createInterface({
//   input     : child.stdout,
//   terminal  : false
// }).on('line', function(line) {
//   console.log(line + " | ");
// });

// use child.stdout.setEncoding('utf8'); if you want text chunks
// child.stdout.setEncoding('utf8');
// child.stdout.on('data', (chunk) => {
//   // data from standard output is here as buffers
//   console.log(chunk + " | ");
// });

// since these are streams, you can pipe them elsewhere
// child.stderr.pipe(dest);

// child.on('close', (code) => {
//   console.log(`child process exited with code ${code}`);
// });

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

global.scrape = function() {
  mainWindow.loadURL(url.format({ pathname: path.join(__dirname,'scraping.html'), protocol: 'file:'}));
}
