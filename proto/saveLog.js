var moment = require('moment');
require('moment-timezone');
var conn = require('../config/tsdb');

var az_ids = ['1032', '1033', '1034', '1035', '1036', '1037', '1038', '1039', '1040', '1041'];

function saveAnalyzer() {

  for (let i = 0; i < az_ids.length; i++) {
    let table_name = `ts${az_ids[i]}`;
    let insert_query = `INSERT INTO ${table_name} (timestamp, analyzer_id, type, unit, state, value, ph, temp) SELECT timestamp, analyzer_id, type, unit, state, value, ph, temp FROM appdb.realtime WHERE appdb.realtime.analyzer_id = ?;`;
 
    conn.query(insert_query, [az_ids[i]])
    .then(rows => {
       console.log("done");
       return true;
    }, err => {
      console.log(err);
    });
  }
}

//saveAnalyzer();

setInterval(saveAnalyzer, 5*60*1000);
