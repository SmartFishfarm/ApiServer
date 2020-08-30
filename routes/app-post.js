var express = require('express');
var router = express.Router();
var pool = require('../config/dbconn');
var urlencode = require('urlencode');
var passport = require('passport');


router.put('/analyzer/name/:id', passport.authenticate('jwt', { session: false }), function(req,res) {

  const id = req.params.id,
      newname = req.body.name;

  let update_query = "UPDATE appdb.analyzer SET name_tag = ? WHERE id = ?;";

  pool.query(update_query, [newname, id], function(err, rows) {
        if (err) {
          res.status(500).json({error: "error occur"});
        } else {
          return res.status(200).json({success: "수조명 이름이 변경되었습니다."});
        }
  });
});


router.post('/fcm', passport.authenticate('jwt', { session: false }), function(req,res) {

  const username = req.body.username,
      token = req.body.token;
  //let update_query = "INSERT INTO appdb.users(username, fcmToken) values(?, ?) ON DUPLICATE KEY UPDATE fcmToken = ?;";
  let update_query = "UPDATE appdb.users SET fcmToken = ? WHERE username = ?;";

  pool.query(update_query, [token, username], function(err, rows) {
        if (err) {
          res.status(500).json({error: "error occur"});
        } else {
          return res.status(200).json({success: "토큰이 등록되었습니다."});
        }
  });
});


router.post('/limits/:userid/:analyzer_id', passport.authenticate('jwt', { session: false }), function(req, res) {

  const analyzer_id = req.params.analyzer_id || '';
  const user_id = req.params.userid || '';

  const value_max = req.body.value_max || '';
  const value_min = req.body.value_min || '';

  let select_query = "SELECT id, value_min, value_max FROM appdb.limits WHERE user_id = ? AND analyzer_id = ?;";

  pool.query(select_query, [user_id, analyzer_id])
  .then(rows => {
     if(rows[0] != null) {
       const max = value_max ? value_max : rows[0].value_max;
       const min = value_min ? value_min : rows[0].value_min;

       let update_query = "UPDATE appdb.limits SET value_max = ?, value_min = ? WHERE user_id = ? AND analyzer_id = ?";
	return pool.query(update_query, [max, min, user_id, analyzer_id]);
     } else {
       let insert_query = "INSERT INTO appdb.limits (user_id, analyzer_id, value_max, value_min) VALUES (?, ?, ?, ?)";
       return pool.query(insert_query, [user_id, analyzer_id, value_max, value_min]);
     }
  }, err => {
     res.status(500).json({error: "error occur"});
  })
  .then(rows => {
     return res.json({success: "변경되었습니다."});

  }, err => {
    res.status(500).json({error: "error occur"});
  });
});


router.post('/limits/bool', passport.authenticate('jwt', { session: false }), function(req,res) {

  const bool = req.body.bool,
	position = req.body.position,
	analyzer_id = req.body.analyzer_id,
	user_id = req.body.user_id;

  let limits_select = "SELECT id, bool_min, bool_max FROM appdb.limits WHERE user_id = ? AND analyzer_id = ?;";

  pool.query(limits_select, [user_id, analyzer_id])
  .then(rows => {
     if(rows[0] != null) {
	let update_query = "";
        if(position == "max") {
	  update_query = "UPDATE appdb.limits SET bool_max = ? WHERE id = ?;";
        } else if(position == "min") {
          update_query = "UPDATE appdb.limits SET bool_min = ? WHERE id = ?;";
        }
 	return pool.query(update_query, [bool, rows[0].id]);
     } else {
	let insert_query = "";
	if(position == "max") {
          insert_query = "INSERT INTO appdb.limits (user_id, analyzer_id, bool_max) VALUES (?, ?, ?);";
	} else if (position == "min") {
	  insert_query = "INSERT INTO appdb.limits (user_id, analyzer_id, bool_min) VALUES (?, ?, ?);";
	}

        return pool.query(insert_query, [user_id, analyzer_id, bool]);
     }
  }, err => {
     res.status(500).json({error: "error occur"});
  })
  .then(rows => {
     return res.json({success: "변경되었습니다."});

  }, err => {
    res.status(500).json({error: "error occur"});
  });

});


router.post('/condition/:analyzer_id', passport.authenticate('jwt', { session: false }), function(req, res) {

  const analyzer_id = req.params.analyzer_id || '';

  const datetime = req.body.datetime || '',
        fishes = req.body.fishes || '',
        length = req.body.length || '',
        weight = req.body.weight || '';
 
  let select_query = `SELECT * FROM appdb.conditions WHERE analyzer_id = ?;`;
  let update_query = `INSERT INTO appdb.conditions (analyzer_id, datetime, fishes, length, weight) VALUES (?, ?, ?, ?, ?)  ON DUPLICATE KEY UPDATE datetime=VALUES(datetime), fishes=VALUES(fishes), length=VALUES(length), weight=VALUES(weight);`;

  pool.query(select_query, [analyzer_id])
  .then(rows => {
       const dd = datetime ? datetime : rows[0].datetime;
       const ff = fishes ? fishes : rows[0].fishes;
       const ll = length ? length : rows[0].length;
       const ww = weight ? weight : rows[0].weight;

     return pool.query(update_query, [analyzer_id, dd, ff, ll, ww]);
  }, err => {
     res.status(500).json({error: 'error occur'});
  })
  .then(rows => {
     return res.json({success: "변경되었습니다."});
  }, err => {
    res.status(500).json({error: "error occur"});
  });

});


router.put('/push-setting/:userid', passport.authenticate('jwt', { session: false }), function(req, res) {
  const user_id = req.params.userid || '';
  const column = req.body.column;
  const bool = req.body.bool;

  let update_query = `UPDATE appdb.alarms SET ${column} = ? WHERE user_id = ?;`;

  pool.query(update_query, [bool, user_id])
  .then(rows => {
     return res.json({success: "변경되었습니다."});
  }, err => {
     res.status(500).json({error: "error occur"});
  });

});


module.exports = router;
