var pool = require('../config/dbconn');
var moment = require('moment');
var admin = require("firebase-admin");
var serviceAccount = require("../config/dysapp.json");

require('moment-timezone');

if (typeof localStorage === "undefined" || localStorage === null) {
  var LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage('./scratch');
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://dysapp-54b0c.firebaseio.com"
});


function stateAlarm() {
 
  var target_tokens = ['f6qVdTEveKw:APA91bEiQgn1jec1bV5hNRhwX6g2fZvMKYWvWJILN-bgjNyo4xGXcpTUoCKyd0dA_bWsjWCE7emBAU_PmXIgVj93oGmU0oFf-B_jo2kdUcX5mPavLtU4cfDpXnM2u0MqqozOmpYNmxff', 'dzt55ejkf80:APA91bHVJ1nbt647vvULRTNiNaJvRUDGM7LLxGvS2aJCobbB4zWLPI9CdaQr6FKz3pw5ltudhTkx2FUaF8U9BKh6orqGbKlae7jhu1ngMwo1uHLKtCAhIZ4cts5IUwy8JrZu_hjii_bd'];

  var key = "";
  var value = 0;
  var list = [];
  var fcm_message = {};

  let select_query = `SELECT az.company_id, rt.sensor_id, ss.name_tag, rt.timestamp, rt.state FROM realtime AS rt JOIN sensor AS ss ON rt.sensor_id = ss.id JOIN analyzer AS az ON ss.serial_code = az.serial_code  ORDER BY ss.id;`;

  pool.query(select_query, null)
  .then(rows => {

    rows.forEach(function(element) {
      
      key = `${element.sensor_id}_state`;
      value = element.state;

      if((value != localStorage.getItem(key)) && (value != '00') && (value != '-1')) {
	console.log(element.sensor_id);
        if(element.state == '02') {
          list.push([element.sensor_id, '1', element.timestamp, element.state, 'network']);
        } else {
          list.push([element.sensor_id, '1', element.timestamp, element.state, 'state']);
        }

	fcm_message = {
	  notification: {
	    title: '상태 알림',
	    body: `${element.sensor_id}번 ${element.state}`
	  },
	  tokens: target_tokens,
	};

	admin.messaging().sendMulticast(fcm_message)
	  .then(function(response) {
	  console.log(response);
	})
	.catch(function(error) {
	  console.log(error);
	});


      }

      localStorage.setItem(key, value);

    });

    if(list.length) {
      var conn = require('../config/eventdb');
      let insert_query = `INSERT INTO log${rows[0].company_id} (sensor_id, common, timestamp, state, category) VALUES ?;`;
 
      return conn.query(insert_query, [list]);
    } else {
      return 0;
    }

  }, err => {
    console.log(err);
  })
  .then(rows => {
    console.log("Insert Completed");
    return true;
   }, err => {
    console.log(err);
  });

}


stateAlarm();
//setInterval(stateAlarm, 5*30*1000);
