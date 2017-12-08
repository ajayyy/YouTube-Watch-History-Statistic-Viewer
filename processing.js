var fs = require('fs');
var readline = require('readline');

fs.readFile('watch-history.json', processHistory);

function processHistory(err, content){
  var watchHistory = JSON.parse(content);

  console.log(watchHistory.length);
}
