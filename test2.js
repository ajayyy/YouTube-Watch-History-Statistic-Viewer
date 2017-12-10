var fs = require('fs');

var google = require('googleapis');

fs.readFile('client_secret.json', function processClientSecrets(err, content) {
  if (err) {
    console.log('Error loading client secret file: ' + err);
    return;
  }
  // Authorize a client with the loaded credentials, then call the YouTube API.
  start(JSON.parse(content));
});

function start(credentials){
  var youtube = google.youtube({
     version: 'v3',
     auth: "AIzaSyCbYxlw8o4YvE_9mA04oaBpxX9DIY_P2ac"
  });


  youtube.channels.list({
    part: 'snippet',
    id: 'UCc1YlgCEN3kMT6nI5suM76Q'
    // order: 'viewCount',
    // type: 'video'
  }, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    var playlist = response.items;
    if (playlist.length == 0) {
      console.log('No channel found.');
    } else {

      //get details of the playlist

      console.log('This channel\'s ID is %s. Its title is \'%s\', and ' +
                  'it has %s views.',
                  playlist[0].id,
                  playlist[0].snippet.title,
                  playlist[0].snippet.thumbnails.default.url);
    }
  });
}
