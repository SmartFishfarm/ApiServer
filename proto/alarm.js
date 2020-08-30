var pool = require('../config/dbconn');
var moment = require('moment');
var conn = require('../config/eventdb');
 
require('moment-timezone');

if (typeof localStorage === "undefined" || localStorage === null) {
  var LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage('./scratch');
}

function stateAlarm() {
 
  var key = "";
  var value = 0;
  var list = [];
  var companies = [];

  let select_query = `SELECT az.company_id, rt.analyzer_id, ss.name_tag, rt.timestamp, rt.state FROM realtime AS rt JOIN analyzer AS az ON rt.analyzer_id = az.id ORDER BY az.id;`;

  pool.query(select_query, null)
  .then(rows => {

    rows.forEach(function(element) {
      
      key = `${element.az_id}_state`;
      value = element.state;

      if((value != localStorage.getItem(key)) && (value != '00') && (value != '-1')) {
	console.log(element.sensor_id);
        if(element.state == '02') {
	  companies.push(element.company_id);
          list.push([element.sensor_id, '1', element.timestamp, element.state, 'network']);
        } else {
          list.push([element.sensor_id, '1', element.timestamp, element.state, 'state']);
        }

      }

      if(list.length) {
        let insert_query = `INSERT INTO log${element.company_id} (sensor_id, common, timestamp, state, category) VALUES ?;`;
	
        conn.query(insert_query, [list], function(err, rows) {
 	  if (err) {
	    console.log(err);
	    return false;
	  }
	  return true;
	});
      } 

      list = [];
      localStorage.setItem(key, value);

    });

    return true;
  }, err => {
    console.log(err);
  });
}



function rangeLog() {

  let select_query = `SELECT az.company_id, rt.sensor_id, li.user_id,  rt.timestamp, rt.value, rt.unit, li.value_max, li.value_min, li.bool_max, li.bool_min FROM limits AS li JOIN realtime AS rt ON rt.sensor_id = li.sensor_id JOIN sensor AS ss ON ss.id = li.analzyer_id`;

  var keyMax = "";
  var keyMin = "";
  var valueMax = 0;
  var valueMin = 0;

  var list = [];

  pool.query(select_query, null)
  .then(rows => {

    rows.forEach(function(element) {

      keyMax = `${element.analyzer_id}_${element.user_id}_max`;
      keyMin = `${element.analyzer_id}_${element.user_id}_min`;

      valueMax = element.value_max;
      valueMin = element.value_min;

      if((element.bool_max) && (valueMax != localStorage.getItem(keyMax)) && (valueMax < element.value)) {
        list.push([element.analyzer_id, element.user_id, element.timestamp, element.value, element.unit, 'range']);
        localStorage.setItem(keyMax, valueMax);
 
      } else if((element.bool_min) && (valueMin != localStorage.getItem(keyMin)) && (element.value < valueMin)) {
        list.push([element.analyzer_id, element.user_id, element.timestamp, element.value, element.unit, 'range']);
       localStorage.setItem(keyMin, valueMin);

      } else if((element.value >= valueMin) && (valueMax >= element.value)) {
        localStorage.setItem(keyMin, 0);
        localStorage.setItem(keyMax, 0);

      }

    if(list.length) {
	console.log(list);
        let insert_query = `INSERT INTO log${element.company_id} (analyzer_id, user_id, timestamp, value, unit, category) VALUES ?;`;
	
        conn.query(insert_query, [list], function(err, rows) {
 	  if (err) {
	    console.log(err);
	    return false;
	  }
	  return true;
	});
      } 

      list = [];

    });

    return true;
   }, err => {
    console.log(err);
  });
}

//stateAlarm();
//rangeLog();
setInterval(rangeLog, 2*30*1000);
//setInterval(stateAlarm, 1*30*1000);
