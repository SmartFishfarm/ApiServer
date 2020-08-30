var express = require('express');
var router = express.Router();
var pool = require('../config/dbconn');
var urlencode = require('urlencode');
var passport = require('passport');

router.get('/company/:id', passport.authenticate('jwt', { session: false }), function(req, res) {

  const company_id = req.params.id || '';
  let company_query = 'SELECT * FROM appdb.company_infos WHERE id = ?;';
  pool.query(company_query, [company_id], function(err, rows) {
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


router.get('/profile', passport.authenticate('jwt', { session: false }), function(req, res) {

  const username = req.query.username || '';
  let profile_query = 'SELECT us.id, us.username, us.email, co.company FROM appdb.users AS us JOIN appdb.company_infos AS co ON us.company_id = co.id WHERE us.username = ?;';
  pool.query(profile_query, [username], function(err, rows) {
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



router.get('/realtime/:id', passport.authenticate('jwt', { session: false }), (req, res) => {

  const company_id = req.params.id || '';
  let company_query = "SELECT az.id, az.num, az.name_tag, from_unixtime(rt.timestamp, '%Y/%m/%d %H:%i:%S') as timestamp, rt.type, rt.unit, rt.state, rt.value, rt.ph, rt.temp, info.range_min, info.range_max FROM realtime AS rt JOIN analyzer AS az ON rt.analyzer_id = az.id JOIN type_infos AS info ON info.type = rt.type WHERE az.company_id = ? ORDER BY az.num;";

  pool.query(company_query, [company_id], function(err, rows) {
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


router.get('/analyzer/:id', passport.authenticate('jwt', { session: false }), (req, res) => {

  const id = req.params.id || '';
  let company_query = 'SELECT * FROM appdb.analyzer WHERE id = ?;';
  pool.query(company_query, [id], function(err, rows) {
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


router.get('/analyzer-all/:id', passport.authenticate('jwt', { session: false }), (req, res) => {

  const id = req.params.id || '';
  let select_query = `SELECT id, name_tag FROM appdb.analyzer WHERE company_id = ?;`;

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

router.get('/chart', passport.authenticate('jwt', { session: false }), function(req, res) {
  
  const analyzer_id = req.query.analyzer_id || '';
  const user_id = req.query.user_id || '';
  const today = req.query.today || '';
  const yesterday =  req.query.yesterday || '';

  var conn = require('../config/tsdb');
  let select_query = "SELECT timestamp, type, unit, state, value, ph, temp FROM ts" + analyzer_id + " WHERE from_unixtime(timestamp, '%Y-%m-%d') BETWEEN ? AND ? ORDER BY timestamp ASC;";

  conn.query(select_query, [yesterday, today])
  .then(rows => {
     return res.json(rows);
  }, err => {
     res.status(500).json({error: "error occur"});
  });

});


router.get('/chart/update/:id', passport.authenticate('jwt', { session: false }), function(req, res) {

  const id = req.params.id || '';
  const start = req.query.start || '';
  const end = req.query.end || '';

  var conn = require('../config/tsdb');
  let select_query = "SELECT timestamp, unit, value, ph, temp FROM tsdb.ts" + id + " WHERE from_unixtime(timestamp, '%Y-%m-%d') BETWEEN ? AND ? ORDER BY timestamp ASC;"; 
  conn.query(select_query, [start, end])
  .then(rows => {
     return res.json(rows);
  }, err => {
    res.status(500).json({error: "error occur"});
  });

});


router.get('/timeseries', passport.authenticate('jwt', { session: false }), function(req, res) {

  const analyzer_id = req.query.analyzer_id || '';
  const user_id = req.query.user_id || '';
  const start = req.query.start || '';
  const end = req.query.end || '';

  let limits_query = "SELECT li.id, li.value_max, li.value_min, li.bool_max, li.bool_min FROM limits AS li JOIN users AS us ON li.user_id = us.id JOIN realtime AS rt ON rt.analyzer_id = li.analyzer_id WHERE li.analyzer_id = ? AND us.id = ?;";
  let ts_query = "";

  pool.query(limits_query, [analyzer_id, user_id])
  .then(rows => {
     var conn = require('../config/tsdb');
 
     if(!rows.length) {
       ts_query = "SELECT from_unixtime(timestamp, '%Y/%m/%d %H:%i:%S') as timestamp, unit, value, ph, temp FROM tsdb.ts" + analyzer_id + " WHERE from_unixtime(timestamp, '%Y-%m-%d') BETWEEN ? AND ? ORDER BY timestamp DESC;";
       return conn.query(ts_query, [start, end]);
     } else {
       ts_query = "SELECT from_unixtime(ts.timestamp, '%Y/%m/%d %H:%i:%S') as timestamp, ts.unit, ts.value, ts.ph, ts.temp, li.value_max, li.value_min, li.bool_max, li.bool_min FROM tsdb.ts" + analyzer_id + " AS ts JOIN appdb.limits AS li ON li.analyzer_id = ts.analyzer_id WHERE li.user_id = ? AND from_unixtime(timestamp, '%Y-%m-%d') BETWEEN ? AND ? ORDER BY timestamp DESC;";
       return conn.query(ts_query, [user_id, start, end]);
     }
  }, err => {
    res.status(500).json({error: "error occur"});
  })
  .then(rows => {
     return res.json(rows);
  }, err => {
    res.status(500).json({error: "error occur"});
  });
});


router.get('/info/:id', passport.authenticate('jwt', { session: false }), function(req, res) {

  const analyzer_id = req.params.id || '';
  
  let select_query = `SELECT rt.analyzer_id, rt.unit, rt.type, info.range_min, info.range_max, az.name_tag FROM realtime AS rt JOIN analyzer AS az ON az.id = rt.analyzer_id JOIN type_infos AS info ON info.type = rt.type WHERE rt.analyzer_id = ?;`;

  pool.query(select_query, [analyzer_id])
  .then(rows => {
     return res.json(rows);
  }, err => {
    res.status(500).json({error: "error occur"});
  });
});


router.get('/info/condition/:id', passport.authenticate('jwt', { session: false }), function(req, res) {

  const analyzer_id = req.params.id || '';
  
  let select_query = `SELECT cd.analyzer_id, cd.datetime, cd.fishes, cd.length, cd.weight FROM conditions AS cd JOIN analyzer AS az ON az.id = cd.analyzer_id WHERE cd.analyzer_id = ?;`

  pool.query(select_query, [analyzer_id])
  .then(rows => {
     return res.json(rows);
  }, err => {
    res.status(500).json({error: "error occur"});
  });
});


router.get('/info/limits/:analyzer_id/:user_id', passport.authenticate('jwt', { session: false }), function(req, res) {
  
  const user_id = req.params.user_id || '';
  const analyzer_id = req.params.analyzer_id || '';

  let select_query = `SELECT li.id, li.value_max, li.value_min, li.bool_max, li.bool_min FROM limits AS li JOIN users AS us ON li.user_id = us.id JOIN realtime AS rt ON rt.analyzer_id = li.analyzer_id WHERE li.analyzer_id = ? AND us.id = ?;`;
  pool.query(select_query, [analyzer_id, user_id])
  .then(rows => {
     return res.json(rows);
  }, err => {
    res.status(500).json({error: "error occur"});
  });

});


router.get('/all-limits/:id', passport.authenticate('jwt', { session: false }), function(req, res) {

  const user_id = req.params.id || '';

  let select_query = "SELECT analyzer_id, value_max, value_min, bool_max, bool_min FROM appdb.limits WHERE user_id = ? ORDER BY analyzer_id;";

  pool.query(select_query, [user_id])
  .then(rows => {
     return res.json(rows);
  }, err => {
    res.status(500).json({error: "error occur"});
  });

});


router.get('/desktop-limits/:id', passport.authenticate('jwt', { session: false }), function(req, res) {

  const company_id = req.params.id || '';

  let select_query = `SELECT * FROM appdb.desktop WHERE company_id = ?;`;
  pool.query(select_query, [company_id])
  .then(rows => {
     return res.json(rows);
  }, err => {
    res.status(500).json({error: "error occur"});
  });

});



router.get('/notification/:companyid/:userid', passport.authenticate('jwt', { session: false }), function(req, res) {

  const company_id = req.params.companyid || '';
  const user_id = req.params.userid || '';

  let select_query= `SELECT log.id, log.analyzer_id, az.name_tag, from_unixtime(log.timestamp) AS timestamp, from_unixtime(log.timestamp, '%Y/%m/%d') AS date, from_unixtime(log.timestamp, '%H:%i:%S') AS time, log.state, log.value, log.unit, log.category FROM eventdb.log${company_id} AS log JOIN analyzer AS az ON log.analyzer_id = az.id WHERE log.common = true OR log.user_id= ? ORDER BY date DESC;`

  pool.query(select_query, [user_id])
  .then(rows => {
     return res.json(rows);
  }, err => {
    res.status(500).json({error: "error occur"});
  });

});

router.get('/notification/count/:companyid/:userid', passport.authenticate('jwt', { session: false }), function(req, res) {

  const company_id = req.params.companyid || '';
  const user_id = req.params.userid || '';
  
  let select_query = `SELECT COUNT(*) AS count FROM eventdb.log${company_id} WHERE common = true OR user_id = ?;`

  pool.query(select_query, user_id)
  .then(rows => {
     return res.json(rows);
  }, err => {
    res.status(500).json({error: "error occur"});
  });

});


router.get('/push-setting/:userid', passport.authenticate('jwt', { session: false }), function(req, res) {

  const user_id = req.params.userid || '';
  
  let select_query = `SELECT user_id, onoff, state, limits FROM appdb.alarms WHERE user_id = ?;`;

  pool.query(select_query, [user_id])
  .then(rows => {
     return res.json(rows);
  }, err => {
    res.status(500).json({error: "error occur"});
  });

});

module.exports = router;
