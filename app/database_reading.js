

var readDatabase = function(){

  const sqlite3 = remote.require('sqlite3').verbose();

  var google = require('googleapis');
  var youtube = google.youtube({
     version: 'v3',
     auth: "AIzaSyCbYxlw8o4YvE_9mA04oaBpxX9DIY_P2ac"
  });

  const print = remote.getGlobal("print");
  //make contains a method
  String.prototype.contains = function(it) { return this.indexOf(it) != -1; };


  var smallVideoList = [];
  var smallVideoListIndex = 0;

  var smallChannelList = [];
  var smallChannelListIndex = 0;
  var startedChannelReadout = false;

  let db = new sqlite3.Database('./youtube_history.db', sqlite3.OPEN_READONLY, (err) => {
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
      print(row.title)
      document.getElementById("vidAmount").innerHTML = row.totalCount;
    });

    db.each(`SELECT title, vid, author_id, COUNT(title) as totalCount
            FROM videoshistory
            GROUP BY title
            ORDER BY totalCount DESC
            LIMIT 1;`, (err, row) => {
      if (err) {
        print(err.message);
      }
      print(row.title)
      document.getElementById("topvideo").innerHTML = row.title + " by " + row.author_id;

      let callback = function(response, index){
        var videos = response.items;
        if (videos.length == 0) {
          print('No video found.');
        } else {
          document.getElementById("topvideo").innerHTML = videos[0].snippet.title + " by " + videos[0].snippet.channelTitle + "<br/> <center> <img style=\"margin-right: 10px;\" src=\"" + videos[0].snippet.thumbnails.medium.url + "\"/> </center>";
        }
      }

      getVideoData({
          part: 'snippet',
          id: row.vid.replace("/watch?v=", "")
      }, callback, 0);

    });

    db.each(`SELECT vid, COUNT(title) as totalCount
            FROM videoshistory
            GROUP BY title
            ORDER BY totalCount DESC
            LIMIT 25;`, (err, row) => {
      if (err) {
        print(err.message);
      }

      let callback = function(response, index){
        var videos = response.items;
        if (videos.length == 0) {
          print('No video found.');
        } else {

          smallVideoList[index] = "<img style=\"margin-right: 10px;\" src=\"" + videos[0].snippet.thumbnails.default.url + "\"/>" + videos[0].snippet.title + " by " + videos[0].snippet.channelTitle + "<br/>";



          if(smallVideoList.length >= 25){
            for(var i=0;i<25;i++){
              if(document.getElementById("videolist").innerHTML === "LOADING..."){
                document.getElementById("videolist").innerHTML = "";
              }

              document.getElementById("videolist").innerHTML += smallVideoList[i].replace("undefined", "");
            }
          }
        }
      }

      getVideoData({
          part: 'snippet',
          id: row.vid.replace("/watch?v=", "")
      }, callback, smallVideoListIndex);

      smallVideoListIndex++;

    });

    db.each(`SELECT author_id, COUNT(author_id) as totalCount
            FROM videoshistory
            GROUP BY author_id
            ORDER BY totalCount DESC
            LIMIT 1;`, (err, row) => {
      if (err) {
        print(err.message);
      }
      print(row.title)
      document.getElementById("topchannel").innerHTML = row.author_id;
      row.author_id = "/user/enyay";

      let callback = function(response, index){
        var channel = response.items;
        if (channel.length == 0) {
          print('No channel found.');
        } else {
          document.getElementById("topchannel").innerHTML = "<img style=\"margin-right: 10px;\" src=\"" + channel[0].snippet.thumbnails.default.url + "\"/>           " + channel[0].snippet.title;
        }
      }

      if(row.author_id.contains("/user/")){
        getChannelData({
            part: 'snippet',
            forUsername: row.author_id.replace("/user/", "")
        }, callback, 0);
      }else{ //must be channel id
        getChannelData({
            part: 'snippet',
            id: row.author_id.replace("/channel/", "")
        }, callback, 0);
      }

    });

    db.each(`SELECT author_id, COUNT(author_id) as totalCount
            FROM videoshistory
            GROUP BY author_id
            ORDER BY totalCount DESC
            LIMIT 25;`, (err, row) => {
      if (err) {
        print(err.message);
      }
      print(row.title)
      document.getElementById("topchannel").innerHTML = row.author_id;
      // row.author_id = "/user/enyay";

      let callback = function(response, index){
        var channel = response.items;
        if (channel.length == 0) {
          print('No channel found.');
        } else {

          smallChannelList[index] = "<img style=\"margin-right: 10px;\" src=\"" + channel[0].snippet.thumbnails.default.url + "\"/>           " + channel[0].snippet.title + "<br/>";

          if(smallChannelList.length >= 25 && !startedChannelReadout){
            startedChannelReadout = true;
            for(var i=0;i<25;i++){
              if(document.getElementById("channellist").innerHTML === "LOADING..."){
                document.getElementById("channellist").innerHTML = "";
              }

              document.getElementById("channellist").innerHTML += smallChannelList[i].replace("undefined", "");
            }
          }

        }
      }

      if(row.author_id.contains("/user/")){
        getChannelData({
            part: 'snippet',
            forUsername: row.author_id.replace("/user/", "")
        }, callback, smallChannelListIndex);
      }else{ //must be channel id
        getChannelData({
            part: 'snippet',
            id: row.author_id.replace("/channel/", "")
        }, callback, smallChannelListIndex);
      }

      smallChannelListIndex++;

    });

  });

  function getChannelData(params, callback, index){

    youtube.channels.list(params, function(err, response) {
      if (err) {
        print('The API returned an error: ' + err);
        return;
      }
      callback(response, index)
    });
  }

  function getVideoData(params, callback, index){

    youtube.videos.list(params, function(err, response) {
      if (err) {
        print('The API returned an error: ' + err);
        return;
      }
      callback(response, index)
    });
  }
}

// readDatabase();

window.addEventListener("load", readDatabase);
