var express = require('express');
var router = express.Router();
var pool = require('../config/dbconn');
var passport = require('passport');
var moment = require('moment');
require('moment-timezone');

/**
 * 사용자 접근 인증
 */
router.put('/users/verify/:id', function(req,res) {

  var user_id = req.params.id,
      bool = req.body.bool;

  let update_query = "UPDATE appdb.users SET verify = ? WHERE id= ?;";
  let insert_query = "INSERT IGNORE INTO appdb.alarms(user_id) VALUES (?);";

  pool.query(update_query, [bool, user_id])
  .then(rows => {
     return pool.query(insert_query, [user_id]);
  }, err => {
     res.status(500).json({error: "error occur"});
  })
  .then(rows => {
     return res.json({success: "변경되었습니다."});
  }, err => {
     res.status(500).json({error: "error occur"});
  });

});

/**
 * 사용자 접근 인증
 */
router.put('/users/delete/:id', function(req,res) {

  const user_id = req.params.id;

  let delete_alarm = `DELETE FROM appdb.alarms WHERE user_id= ?;`;
  let delete_user = `DELETE FROM appdb.users WHERE id= ?;`;

  pool.query(delete_alarm, [user_id])
  .then(rows => {
     return pool.query(delete_user, [user_id])
  }, err => {
     res.status(500).json({error: "error occur"});
  })
  .then(rows => {
     return res.json({success: "삭제되었습니다."});
  }, err => {
     res.status(500).json({error: "error occur"});
  });

});


/**
 * 회사추가
 */
router.post('/add-company', passport.authenticate('jwt-admin', {session: false}), (req, res) => {

  const company = req.body.company || '';
  const address = req.body.address || '';

  let select_query = `SELECT * FROM appdb.company_infos WHERE company = ?;`; 

  let insert_query = `INSERT INTO appdb.company_infos (company, address) VALUES (?, ?);`;

  pool.query(insert_query, [company, address])
  .then(rows => {
    return pool.query(select_query, [company]);
  }, err => {
    res.status(500).json({error: "서버에 에러가 발생했습니다."});
  })
  .then(rows => {
    let create_query = `CREATE TABLE log${ rows[0].id } (
              id int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
              analyzer_id int(11) NOT NULL,
	      user_id int(11) DEFAULT NULL,
	      common tinyint(4) default '0' NOT NULL,
              timestamp int(64) NOT NULL,
	      state varchar(4) DEFAULT NULL,
              value double DEFAULT NULL,
	      unit varchar(45) DEFAULT NULL,
	      category varchar(45) DEFAULT NULL
             ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
             `;

     var conn = require('../config/eventdb');
     return conn.query(create_query, null);

  }, err => {
    res.status(500).json({error: "서버에 에러가 발생했습니다."});
  })
  .then(rows => {
	return res.json(rows);
  }, err => {
    res.status(500).json({error: "서버에 에러가 발생했습니다."});
  });


});



/**
 * 계측기 추가
 */

router.post('/add-analyzer', passport.authenticate('jwt-admin', {session: false}), (req, res) => {

  const company_id = req.body.company_id || '';
  const analyzers = req.body.analyzers || '';

  var values = [];

  let ts_table_insert ='';
  let analyzer_insert = 'INSERT INTO appdb.analyzer (num, company_id, name_tag) VALUES ?;';

  for (var i = 0; i < analyzers.length; i++) {
    values.push([analyzers[i].num, company_id, analyzers[i].name_tag]);

    let str1 = `CREATE TABLE c${company_id}_${analyzers[i].num} (
              timestamp int(64) DEFAULT NULL,
              sensor_id int(11) DEFAULT NULL,
              type varchar(45) DEFAULT NULL,
              unit varchar(45) DEFAULT NULL,
              state tinyint(4) DEFAULT NULL,
              value double DEFAULT NULL,
              temp double DEFAULT NULL,
              UNIQUE (timestamp)
             ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
             `;

    ts_table_insert = ts_table_insert.concat(str1);

  }

  pool.query(analyzer_insert, [values])
  .then(rows => {
     var conn = require('../config/tsdb');
     return conn.query(ts_table_insert, null);
  }, err => {
    res.status(500).json({error: "error occur"});
  })
  .then(rows => {
     return res.json(rows);
  }, err => {
    res.status(500).json({error: "error occur"});
  });

});


/**
 * 회사수정
 */
router.put('/company/:id', passport.authenticate('jwt-admin', {session: false}), function(req,res) {

  const company_id = req.params.id || '';

  const company = req.body.company || '';
  const address = req.body.address || '';
  const latitude = req.body.latitude || '';
  const longitude = req.body.longitude || '';

  let update_query = 'UPDATE appdb.company_infos SET company = ? ,address = ?, lat = ?, lng = ? WHERE id = ?';
  pool.query(update_query, [company, address, latitude, longitude, company_id])
  .then(rows => {
     return res.status(200).json({success: "변경되었습니다."});
  }, err => {
    res.status(500).json({error: "error occur"});
  });

});


/**
 * 계측기 수정
 */
router.put('/analyzer/:id', passport.authenticate('jwt-admin', {session: false}), function(req,res) {

  const analyzer_id = req.params.id || '';
  const name_tag = req.body.name_tag || '';

  let update_query = `UPDATE appdb.analyzer SET name_tag = ? WHERE id = ?;`; 

  pool.query(update_query, [name_tag, analyzer_id])
  .then(rows => {
     return res.status(200).json({success: "변경되었습니다."});
  }, err => {
    res.status(500).json({error: "error occur"});
  });

});


/**
 * 회사삭제
 */
router.delete('/company/:id', passport.authenticate('jwt-admin', {session: false}), function(req,res) {

  var company_id = req.params.id;

  let select_query = 'SELECT * FROM appdb.company_infos WHERE id = ?;';


  pool.query(select_query, [company_id])
  .then(rows => {
     var conn = require('../config/eventdb');
     let table_delete = `DROP TABLE log${rows[0].id};`;

     return conn.query(table_delete, null);
  }, err => {
    res.status(500).json({error: "error occur"});
  })
  .then(rows => {
     let delete_query = 'DELETE FROM appdb.company_infos WHERE id = ?';
     return pool.query(delete_query, [company_id]);
  }, err => {
    res.status(500).json({error: "error occur"});
  })
  .then(rows => {
     return res.status(200).json({success: "삭제되었습니다."});
  }, err => {
    res.status(500).json({error: "error occur"});
  });

});


/**
 * 계측기삭제
 */
router.delete('/analyzer/:id', passport.authenticate('jwt-admin', {session: false}), function(req,res) {
  const analyzer_id = req.params.id || '';

  let delete_query = `DELETE FROM appdb.analyzer WHERE id = ?;`;
  pool.query(delete_query, [analyzer_id])
  .then(rows => {
     return res.status(200).json({success: "삭제되었습니다."});
  }, err => {
    res.status(500).json({error: "error occur"});
  });
});


router.put('/typeinfo/:id', passport.authenticate('jwt-admin', {session: false}), function(req,res) {

  const id = req.params.id || '';
  const min = req.body.min || '';
  const max = req.body.max || '';

  let update_query = 'UPDATE appdb.type_infos SET range_min = ?, range_max = ? WHERE id = ?';
  pool.query(update_query, [min, max, id])
  .then(rows => {
     return res.json(rows);
  }, err => {
    res.status(500).json({error: "error occur"});
  });

});



module.exports = router;
