'use strict';

const {app, BrowserWindow} = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');

var mainWindow = null

const util = require('util');
require('util.promisify').shim();

process.chdir(__dirname)

process.chdir('../Youtube-Watch-History-Scraper-master/');

const { spawn, exec } = require('child_process');
const readline = require('readline');
var command = null;

//make contains a method
String.prototype.contains = function(it) { return this.indexOf(it) != -1; };

global.fixScrapyExe = function(){
  let data = fs.readFileSync('./Python35/Scripts/scrapy.exe');
  let content = data.toString();
  let oldPath = content.split('#!"')[1].split('"')[0];
  content = content.replace(oldPath, __dirname.replace('\\app', '\\') + 'Youtube-Watch-History-Scraper-master\\Python35\\python.exe');
  console.log(content);
  fs.writeFileSync('./Python35/Scripts/scrapy.exe', content);
}

var videosDownloaded = 0;

global.videosDownloaded = function() {
  return videosDownloaded;
}

var bufferData = "";

function startScrape() {
  console.log("SADsadasdsadsad");
  command = spawn('./Python35/python', [ './Python35/Scripts/scrapy-portable.py', 'crawl', 'yth_spider']);

  command.stdout.on('data', newScrapeMessage);

  command.stderr.on('data', newScrapeMessage);

  child.on('close', (code) => {
    global.startStatisticsView();
  });

}

function newScrapeMessage(data) {
  console.log("SADsadasdsadsad");
  bufferData += data.toString();
  if(bufferData.contains("'time': ")){
    videosDownloaded ++;
    console.log(videosDownloaded);

    if(mainWindow !== null){ //will become null if someone closes the window and ends the program
      mainWindow.webContents.executeJavaScript('updateVideoAmount();');
    }

    bufferData = "";
  }
  console.log("rwerwerwerw");

}

app.on('ready', function() {
    mainWindow = new BrowserWindow({
        height: 600,
        width: 800
    });

    mainWindow.on('closed', function () {
      mainWindow = null; //make it null because it is destroyed
    })

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

  startScrape();
}

global.startStatisticsView = function() {

  if(command !== null){
    command.kill();
  }

  mainWindow.loadURL(url.format({ pathname: path.join(__dirname,'statistics.html'), protocol: 'file:'}));
}

global.print = function(message){
  console.log(message);
}
