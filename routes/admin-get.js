var express = require('express');
var router = express.Router();
var pool = require('../config/dbconn');
var passport = require('passport');

/**
 * 실시간 정보
 */
router.get('/realtime/:id', passport.authenticate('jwt-admin', {session: false}), function(req,res) {
  const id = req.params.id || '';

    let select_query = "SELECT ss.id, az.channel_id, ch.ch_num, ch.ch_name, from_unixtime(rt.timestamp, '%Y/%m/%d %H:%i:%S') as timestamp, rt.type, rt.unit, rt.state, rt.value, rt.temp, ss.serial_code, ss.num, ss.name_tag, info.range_min, info.range_max FROM realtime AS rt JOIN sensor AS ss ON rt.sensor_id = ss.id JOIN analyzer AS az ON ss.serial_code = az.serial_code JOIN channel AS ch ON ch.id = az.channel_id JOIN type_infos AS info ON info.type = rt.type WHERE az.company_id = ? ORDER BY ss.id;";

    pool.query(select_query, [id], function(err, rows) {
	if (err) {
	  res.status(500).json({error: "error occur"});
	} else {
	    if (!rows.length) {
	      res.status(404).json({error: "Not found"});
	      return;
	    } else {
	      return res.status(200).json(rows);
	    }
	}
    });

});

/**
 * 시계열데이터 정보
 */
router.get('/timeseries', passport.authenticate('jwt-admin', {session: false}), function(req, res) {
  let serial_code = req.query.serial_code;
  let ts_query = "SELECT from_unixtime(timestamp, '%Y/%m/%d %H:%i:%S') as timestamp, type, unit, state, value, temp FROM tsdb." + serial_code + ";";
  var conn = require('../config/tsdb');

  conn.query(ts_query, null)
    .then(rows => {
       return res.json(rows);
    }, err => {
       res.status(500).json({error: "error occur"});
    });

});


/**
 * 회사리스트
 */
router.get('/company-list', passport.authenticate('jwt-admin', {session: false}), function(req,res) {

  let list_query = 'SELECT * FROM appdb.company_infos';

  pool.query(list_query, null)
  .then(rows => {
     if(!rows.length) {
	res.status(404).json({error: "Not found"});
        return;
     } else {
    	return res.status(200).json(rows);
     }
  }, err => {
    res.status(500).json({error: "error occur"});
  });

});


router.get('/company/:id', passport.authenticate('jwt-admin', {session: false}), function(req,res) {

  const id = req.params.id || '';

  let company_query = 'SELECT * FROM appdb.company_infos WHERE id = ?';
  pool.query(company_query, [id])
  .then(rows => {
     return res.json(rows);
  }, err => {
    res.status(500).json({error: "error occur"});
  });

});


/**
 * 계측기리스트
 */
router.get('/analyzer/:id', passport.authenticate('jwt-admin', {session: false}), function(req,res) {
  const company_id = req.params.id || '';
  let analyzer_query = `SELECT id, num, company_id, name_tag FROM appdb.analyzer WHERE company_id = ?;`;

  pool.query(analyzer_query, [company_id])
  .then(rows => {
     return res.json(rows);
  }, err => {
    res.status(500).json({error: "error occur"});
  });

});


/**
 * 회사관리 상세정보
 */
router.get('/management/:id', passport.authenticate('jwt-admin', {session: false}), function(req,res) {
  const id = req.params.id || '';

  let manage_query = 'SELECT * FROM appdb.company_infos WHERE id = ?';
  pool.query(manage_query, [id])
  .then(rows => {
     return res.json(rows);
  }, err => {
    res.status(500).json({error: "error occur"});
  });

});


/**
 * 사용자관리
 */
router.get('/users', passport.authenticate('jwt-admin', {session: false}), function(req,res) {

  let users_query = 'SELECT us.id, us.username, us.email, co.company, us.verify FROM users AS us LEFT JOIN company_infos AS co ON us.company_id = co.id;';
  pool.query(users_query, null)
  .then(rows => {
     return res.json(rows);
  }, err => {
    res.status(500).json({error: "error occur"});
  });

});


/**
 * 메인화면
 */
router.get('/dashboard', passport.authenticate('jwt-admin', {session: false}), function(req,res) {
  pool.getConnection(function(err, connection) {

  var pids = ['appdb.company_infos', 'appdb.users'];
  var query = "";
  for ( var i=0;  i<pids.length; i++ ) {
    query += "SELECT COUNT(id) as value FROM " + pids[i] + ';'

  }
    connection.query(query, null, function(err, rows) {
	if (err) {
	  res.status(500).json({error: "error occur"});
	} else {
	    if (!rows.length) {
	      res.status(404).json({error: "Not found"});
	      return;
	    } else {
	      console.log(rows[0]);
	      return res.status(200).json(rows);
	   }
	}
    });

    connection.release();
  });
});


/**
 * 위치기반
 */
router.get('/map', passport.authenticate('jwt-admin', {session: false}), function(req,res) {

  let map_query = 'SELECT id, company, address FROM appdb.company_infos';
  pool.query(map_query, null)
  .then(rows => {
     return res.json(rows);
  }, err => {
    res.status(500).json({error: "error occur"});
  });


});


router.get('/typeinfo', passport.authenticate('jwt-admin', {session: false}), function(req, res) {

  let range_query = "SELECT id, type, unit, range_min, range_max FROM appdb.type_infos;";

  pool.query(range_query, null, function(err, rows) {
        if (err) {
          res.status(500).json({error: "error occur"});
        } else {
            if (!rows.length) {
              res.status(404).json({error: "Not found"});
              return;
            } else {
              return res.status(200).json(rows);
            }
        }
  });

});


module.exports = router;
