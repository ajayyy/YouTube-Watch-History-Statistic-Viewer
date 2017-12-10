
var fs = remote.require('fs');
var readline = remote.require('readline');
const sqlite3 = remote.require('sqlite3').verbose();

const print = remote.getGlobal("print");


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

  db.each(`SELECT title, COUNT(title) as totalCount
          FROM videoshistory
          GROUP BY title
          ORDER BY totalCount DESC
          LIMIT 1;`, (err, row) => {
    if (err) {
      print(err.message);
    }
    print(row.title)
    document.getElementById("topvideo").innerHTML = row.title;
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
    document.getElementById("topchannel").innerHTML = "/user/enyay";
  });

});
