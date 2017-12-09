var fs = require('fs');
var readline = require('readline');
const sqlite3 = require('sqlite3').verbose();


let db = new sqlite3.Database('youtube_history.db', sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error(err.message);
  }
});

db.serialize(() => {
  db.each(`SELECT title, author_id, COUNT(title) as totalCount
          FROM videoshistory
          GROUP BY title
          HAVING totalCount > 10
          ORDER BY totalCount DESC;`, (err, row) => {
    if (err) {
      console.error(err.message);
    }
    console.log(row.title + "\t" + row.totalCount);
  });
});
