
var sqlite3 = null;

var google = null;
var youtube = null;

var print = remote.getGlobal("print");

var db = null;

var fs = null;

var categories = null;

var videoListExcludingMusic = [];
var videoListExcludingMusicOrder = []; //list of index numbers
var videoListExcludingMusicIndex = 0;
var videoListExcludingMusicIncreaseAmount = 100;
var videoListExcludingMusicAmountDisplayed = 0;
var amountChecked = 0;
var tries = 0;

var includesMusic = true;

var smallVideoList = [];
var smallVideoListData = [];
var smallVideoListIndex = 0;
var smallVideoListLoadedAmount = 0;
var smallVideoListAmountDisplayed = 0;

var smallChannelList = [];
var smallChannelListIndex = 0;
var smallChannelListLoadedAmount = 0;
var smallChannelListAmountDisplayed = 0;

var topNonMusicChannelTries = 0;

var readDatabase = function(){

  fs = remote.require('fs');

  function fsExistsSync(myDir) {
    try {
      fs.accessSync(myDir);
      return true;
    } catch (e) {
      return false;
    }
  }

  //delete .db-journal file if it exists
  if (fsExistsSync('./youtube_history.db-journal')) {
    fs.unlinkSync('./youtube_history.db-journal');
  }

  //delete YouTube cookies for security purposes
  fs.writeFile("./youtube_cookies.json", "", function(err) {

  });

  fs.readFile('../app/youtube_categories.json', function processClientSecrets(err, content) {
    if (err) {
      print(err);
      return;
    }
    categories = JSON.parse(content);
  });

  sqlite3 = remote.require('sqlite3').verbose();

  google = require('googleapis');
  youtube = google.youtube({
     version: 'v3',
     auth: "AIzaSyCbYxlw8o4YvE_9mA04oaBpxX9DIY_P2ac"
  });

  print = remote.getGlobal("print");
  //make contains a method
  String.prototype.contains = function(it) { return this.indexOf(it) != -1; };

  var categoryList = [];

  db = new sqlite3.Database('./youtube_history.db', sqlite3.OPEN_READONLY, (err) => {
    if (err) {
      console.error(err.message);
    }
  });
  console.log("SADsadsad");

  db.serialize(() => {

    db.each(`SELECT COUNT(*) as totalCount
            FROM videoshistory`, (err, row) => {
      if (err) {
        print(err.message);
      }
      document.getElementById("vidAmount").innerHTML = row.totalCount;
    });

    db.each(`SELECT vid, COUNT(title) as totalCount, title, author_id
            FROM videoshistory
            GROUP BY title
            ORDER BY totalCount DESC
            LIMIT 1;`, (err, row) => {
      if (err) {
        print(err.message);
      }
      document.getElementById("topvideo").innerHTML = row.title + " by " + row.author_id;

      let callback = function(response, index, row){
        var videos = response.items;
        if (videos.length == 0) {
          print('No video found.');
        } else {
          document.getElementById("topvideo").innerHTML = videos[0].snippet.title + " by " + videos[0].snippet.channelTitle + "<br/> <center> <img style=\"margin-right: 10px;\" src=\"" + videos[0].snippet.thumbnails.medium.url + "\"/> <br/> Watched " + row.totalCount + " times </center>";
        }
      }

      if(row.vid.contains("&")){
        row.vid = row.vid.substring(0, row.vid.indexOf("&"));
      }

      getVideoData({
          part: 'snippet',
          id: row.vid.replace("/watch?v=", "")
      }, callback, 0, row);

    });

    includeMusic();

    topChannel();
    topNonMusicChannel();

    loadChannels();

    //Top Categories
    db.each(`SELECT author_id, COUNT(author_id) as totalCount
            FROM videoshistory
            GROUP BY author_id
            ORDER BY totalCount DESC
            LIMIT 7;`, (err, row) => {
      if (err) {
        print(err.message);
      }

      db.each(`SELECT vid, COUNT(title) as totalCount
              FROM videoshistory
              WHERE author_id='` + row.author_id + `'
              GROUP BY title
              ORDER BY totalCount DESC
              LIMIT 1;`, (err, row) => {
          if (err) {
            print(err.message);
          }

          let callback = function(response, index, row){
            var videos = response.items;
            if (videos.length == 0) {
              print('No video found.');
            } else {
              categoryList.push(getCategoryName(videos[0].snippet.categoryId));

              if(categoryList.length >= 7){
                //done adding them all

                //remove duplicates
                categoryList = categoryList.filter( function( item, index, inputArray ) {
                    return inputArray.indexOf(item) == index;
                });

                var categories = "";

                for(var i=0;i<categoryList.length;i++){
                  if(i == categoryList.length - 1){
                    categories += "and "
                  }
                  categories += categoryList[i] + ", ";
                }

                categories = categories.substring(0,categories.length - 2);

                document.getElementById("topcategory").innerHTML = categories;

              }

            }
          };

          print(row.vid);

          if(row.vid.contains("&")){
            row.vid = row.vid.substring(0, row.vid.indexOf("&"));
          }

          getVideoData({
              part: 'snippet',
              id: row.vid.replace("/watch?v=", "")
          }, callback, 0, row);

      });
    });

  });

}

window.addEventListener("load", readDatabase);

function topNonMusicChannel(){ //TODO Only trigger this when the top channel is a music channel
  db.each(`SELECT author_id, COUNT(author_id) as totalCount
          FROM videoshistory
          GROUP BY author_id
          ORDER BY totalCount DESC
          LIMIT ` + topNonMusicChannelTries + ', 1;', (err, row) => {
    if (err) {
      print(err.message);
    }

    db.each(`SELECT vid, COUNT(title) as totalCount
            FROM videoshistory
            WHERE author_id='` + row.author_id + `'
            GROUP BY title
            ORDER BY totalCount DESC
            LIMIT 1;`, (err, vidrow) => {
        if (err) {
          print(err.message);
        }

        // document.getElementById("topchannelnonmusic").innerHTML = row.author_id;

        let callback = function(response, index, row){
          var videos = response.items;
          if (videos.length == 0) {
            print('No channel found.');
          } else {

            if(videos[0].snippet.categoryId === '10'){
              topNonMusicChannelTries ++;
              topNonMusicChannel();
            }else{
              if(topNonMusicChannelTries == 0){
                document.getElementById("topchannelnonmusiclabel").innerHTML = "";
                document.getElementById("topchannelnonmusic").innerHTML = "";
              }else{
                let callback2 = function(response, index, row){
                  var channel = response.items;
                  if (channel.length == 0) {
                    print('No channel found.');
                  } else {
                    document.getElementById("topchannelnonmusic").innerHTML = "<img style=\"margin-right: 10px;\" src=\"" + channel[0].snippet.thumbnails.default.url + "\"/> <p style=\"display:inline-block;\">" + channel[0].snippet.title + "<br/> Watched " + row.totalCount + " videos </p>";
                  }
                }

                if(row.author_id.contains("/user/")){
                  getChannelData({
                      part: 'snippet',
                      forUsername: row.author_id.replace("/user/", "")
                  }, callback2, 0, row);
                }else{ //must be channel id
                  getChannelData({
                      part: 'snippet',
                      id: row.author_id.replace("/channel/", "")
                  }, callback2, 0, row);
                }
              }
            }
          }
        }

        getVideoData({
            part: 'snippet',
            id: vidrow.vid.replace("/watch?v=", "")
        }, callback, 0, row);

      });
  });
}

function topChannel(){
  db.each(`SELECT author_id, COUNT(author_id) as totalCount
          FROM videoshistory
          GROUP BY author_id
          ORDER BY totalCount DESC
          LIMIT 1;`, (err, row) => {
    if (err) {
      print(err.message);
    }
    document.getElementById("topchannel").innerHTML = row.author_id;
    // row.author_id = "/user/enyay";

    let callback = function(response, index, row){
      var channel = response.items;
      if (channel.length == 0) {
        print('No channel found.');
      } else {
        document.getElementById("topchannel").innerHTML = "<img style=\"margin-right: 10px;\" src=\"" + channel[0].snippet.thumbnails.default.url + "\"/> <p style=\"display:inline-block;\">" + channel[0].snippet.title + "<br/> Watched " + row.totalCount + " videos </p>";
      }
    }

    if(row.author_id.contains("/user/")){
      getChannelData({
          part: 'snippet',
          forUsername: row.author_id.replace("/user/", "")
      }, callback, 0, row);
    }else{ //must be channel id
      getChannelData({
          part: 'snippet',
          id: row.author_id.replace("/channel/", "")
      }, callback, 0, row);
    }

  });
}

function loadChannels(){
  document.getElementById("seemorechannelsbutton").innerHTML = "LOADING CHANNELS...";
  smallChannelListLoadedAmount = 0;
  smallChannelListIndex = 0;
  smallChannelList = [];

  db.each(`SELECT author_id, COUNT(author_id) as totalCount
          FROM videoshistory
          GROUP BY author_id
          ORDER BY totalCount DESC
          LIMIT ` + smallChannelListAmountDisplayed + `, 25;`, (err, row) => {
    if (err) {
      print(err.message);
    }
    // row.author_id = "/user/enyay";

    let callback = function(response, index, row){
      var channel = response.items;
      if (channel.length == 0) {
        print('No channel found.');
      } else {

        smallChannelList[index] = "<img style=\"margin-right: 10px;\" src=\"" + channel[0].snippet.thumbnails.default.url + "\"/> <p style=\"display:inline-block;\">" + channel[0].snippet.title + "<br/> Watched " + row.totalCount + " videos </p> <br/>";

        smallChannelListLoadedAmount++;

        print(index + " " + smallChannelListAmountDisplayed);

        if(smallChannelListLoadedAmount == 25){
          for(var i=0;i<smallChannelList.length;i++){
            if(i == 0 && smallChannelListAmountDisplayed == 0){
              document.getElementById("channellist").innerHTML = "";
            }

            document.getElementById("channellist").innerHTML += smallChannelList[i].replace("undefined", "");
          }

          smallChannelListAmountDisplayed += 25;

          document.getElementById("seemorechannelsbutton").innerHTML = "<div id=\"seemorechannels\" class=\"button\" onclick=\"loadChannels()\" > Load More </div>";

        }

      }
    }

    if(row.author_id.contains("/user/")){
      getChannelData({
          part: 'snippet',
          forUsername: row.author_id.replace("/user/", "")
      }, callback, smallChannelListIndex, row);
    }else{ //must be channel id
      getChannelData({
          part: 'snippet',
          id: row.author_id.replace("/channel/", "")
      }, callback, smallChannelListIndex, row);
    }

    smallChannelListIndex++;

  });
}

function loadMore(){
  document.getElementById("seemorebutton").innerHTML = "LOADING VIDEOS...";

  let callbackFunction = function() {
    document.getElementById("seemorebutton").innerHTML = "<div id=\"seemore\" class=\"button\" onclick=\"loadMore()\" > Load More </div>";
  };

  if(includesMusic){
    smallVideoListLoadedAmount = 0;
    includeMusic(callbackFunction);
    print("loading more")
  }else{
    videoListExcludingMusic = []
    videoListExcludingMusicOrder = []
    excludeMusic(callbackFunction)
  }

}

function includeMusic(callbackFunction){
  document.getElementById("excludemusicbutton").innerHTML = "LOADING VIDEOS...";

  db.each(`SELECT vid, COUNT(title) as totalCount
          FROM videoshistory
          GROUP BY title
          ORDER BY totalCount DESC
          LIMIT ` + (smallVideoListAmountDisplayed) + ", 25 ;", (err, row) => {
    if (err) {
      print(err.message);
    }

    let callback = function(response, index, row){
      if(row == null){
        return
      }
      let videos = response.items;
      if (videos.length == 0) {
        print('No video found.');
      } else {

        if(smallVideoListLoadedAmount > 25){
          return;
        }

        smallVideoList[index] = "<img style=\"margin-right: 10px;\" src=\"" + videos[0].snippet.thumbnails.default.url + "\"/> <p style=\"display:inline-block;\">" + videos[0].snippet.title + " by " + videos[0].snippet.channelTitle + "<br/> Category: " + getCategoryName(videos[0].snippet.categoryId) + "<br/> Watched " + row.totalCount +  " times</p> <br/>";

        smallVideoListLoadedAmount++;

        if(smallVideoListLoadedAmount == 25){
          smallVideoListLoadedAmount++;
          for(var i=0;i<smallVideoList.length;i++){
            if(i == 0 && smallVideoListAmountDisplayed == 0){
              document.getElementById("videolist").innerHTML = "";
            }

            document.getElementById("videolist").innerHTML += smallVideoList[i].replace("undefined", "");
          }

          document.getElementById("excludemusicbutton").innerHTML = "<div id=\"excludemusic\" class=\"button\" onclick=\"excludeMusic()\"> Exclude Music </div>";

          smallVideoListAmountDisplayed += 25;
          smallVideoListLoadedAmount = 0;
          smallVideoListIndex = 0;
          smallVideoList = [];
          videoListExcludingMusicAmountDisplayed = 0;

          amountChecked = 0;
          tries = 0;
          videoListExcludingMusic = [];

          includesMusic = true;

          if(callbackFunction != null) callbackFunction();

        }
      }
    }

    if(row.vid.contains("&")){
      row.vid = row.vid.substring(0, row.vid.indexOf("&"));
    }

    getVideoData({
        part: 'snippet',
        id: row.vid.replace("/watch?v=", "")
    }, callback, smallVideoListIndex, row);

    smallVideoListIndex++;

  });
}

function excludeMusic(callbackFunction){
  db.each(`SELECT vid, COUNT(title) as totalCount
          FROM videoshistory
          GROUP BY title
          ORDER BY totalCount DESC
          LIMIT ` + (amountChecked + videoListExcludingMusicAmountDisplayed) + ', ' + videoListExcludingMusicIncreaseAmount + ' ;', (err, row) => {
    if (err) {
      print(err.message);
    }


    if(videoListExcludingMusic.length > 25){
      return;
    }

    document.getElementById("excludemusicbutton").innerHTML = "LOADING VIDEOS...";

    let callback = function(response, index, row){
      var videos = response.items;
      if (videos.length == 0) {
        print('No video found. ' + row.vid);
      } else {

        if(videoListExcludingMusic.length >= 25){
          return;
        }

        if(videos[0].snippet.categoryId !== '10'){
          videoListExcludingMusic.push("<img style=\"margin-right: 10px;\" src=\"" + videos[0].snippet.thumbnails.default.url + "\"/> <p style=\"display:inline-block;\">" + videos[0].snippet.title + " by " + videos[0].snippet.channelTitle + "<br/> Category: " + getCategoryName(videos[0].snippet.categoryId) + "<br/> Watched " + row.totalCount + " times </p> <br/>")
          videoListExcludingMusicOrder.push(index)

          if(videoListExcludingMusic.length == 25){

            for(let i=0;i<videoListExcludingMusicOrder.length;i++){
              print(videoListExcludingMusicOrder[i]);
            }
            videoListExcludingMusicOrder = normaliseArray(videoListExcludingMusicOrder)
            let lastTimesWatched = -1;
            // let length = videoListExcludingMusicOrder.length
            // for(let i=0;i<length-120;i++){
            //   let timesWatched = videoListExcludingMusic[videoListExcludingMusicOrder.indexOf(i)].split(" Watched ")[1].split(" times")[0];
            //   print(i + ' ' + timesWatched);
            //   if(timesWatched > lastTimesWatched && lastTimesWatched != -1){
            //     videoListExcludingMusic.splice(videoListExcludingMusicOrder.indexOf(i), 1);
            //     videoListExcludingMusicOrder.splice(videoListExcludingMusicOrder.indexOf(i), 1);
            //     // i--; //to make next i be the same
            //   }else{
            //     lastTimesWatched = timesWatched;
            //   }
            // }
            for(let i=0;i<videoListExcludingMusic.length;i++){
              if(i === 0 && videoListExcludingMusicAmountDisplayed == 0){
                document.getElementById("videolist").innerHTML = "";
              }

              // let timesWatched = videoListExcludingMusic[videoListExcludingMusicOrder.indexOf(i)].split(" Watched ")[1].split(" times")[0];
              // if(timesWatched <= lastTimesWatched || lastTimesWatched == -1){ //todo remove this
                document.getElementById("videolist").innerHTML += videoListExcludingMusic[videoListExcludingMusicOrder.indexOf(i)].replace("undefined", "");
              // }
              // document.getElementById("videolist").innerHTML += videoListExcludingMusic[i].replace("undefined", "");
            }

            document.getElementById("excludemusicbutton").innerHTML = "<div id=\"excludemusic\" class=\"button\" onclick=\"includeMusic()\"> Include Music </div>";

            smallVideoListLoadedAmount = 0;
            smallVideoListIndex = 0;
            smallVideoListAmountDisplayed = 0;

            videoListExcludingMusicIndex = 0;

            videoListExcludingMusicAmountDisplayed += 25;

            includesMusic = false;

            if(callbackFunction != null) callbackFunction();

          }
        }else{
          print(videos[0].snippet.title)

          if(amountChecked >= (tries + 1) * videoListExcludingMusicIncreaseAmount - 1){ //the amount it goes by is needed here too

            // videoListExcludingMusicIncreaseAmount = 25 - videoListExcludingMusic.length;

            excludeMusic();
            tries++;

            print('Trying again...')
          }
        }

        amountChecked++;

      }
    }

    if(row.vid.contains("&")){
      row.vid = row.vid.substring(0, row.vid.indexOf("&"));
    }

    getVideoData({
        part: 'snippet',
        id: row.vid.replace("/watch?v=", "")
    }, callback, videoListExcludingMusicIndex, row);
    videoListExcludingMusicIndex++;

  });
}

function getCategoryName(id){

  for(var i=0;i<categories.items.length;i++){
    if(categories.items[i].id === id){
      return categories.items[i].snippet.title;
    }
  }
}

function normaliseArray(array){
  let newArray = array.slice(0);
  let normalisedArray = array.slice(0);
  let smallest = -1;

  for(let s=0;s<array.length;s++){
    smallest = -1;
    for(let i=0;i<newArray.length;i++){
      if(newArray[i] < smallest || smallest == -1){
        smallest = newArray[i];
        // print("set smallest to " + smallest)
      }else{
        // print("didnt set smallest to " + newArray[i])
      }
    }
    normalisedArray[normalisedArray.indexOf(smallest)] = s;
    newArray.splice(newArray.indexOf(smallest), 1);
  }

  return normalisedArray;

}

function getChannelData(params, callback, index, row){

  youtube.channels.list(params, function(err, response) {
    if (err) {
      print('The API returned an error: ' + err);
      return;
    }
    callback(response, index, row)
  });
}

function getVideoData(params, callback, index, row){

  youtube.videos.list(params, function(err, response) {
    if (err) {
      print('The API returned an error: ' + err);
      print(params.id + " caused the error")
      return;
    }
    callback(response, index, row)
  });
}
