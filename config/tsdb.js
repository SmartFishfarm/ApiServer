var mysql        = require('mysql');
const util = require('util');
var Config = require('./config');

var pool   = mysql.createPool({
  connectionLimit : 10,
  supportBigNumbers: true,
  bigNumberStrings: true,
  host     : Config.hostname,
  user     : Config.db_user,
  password : Config.db_pass,
  database : "tsdb",
  charset : "utf8_general_ci",
  multipleStatements: true
});


pool.getConnection((err, connection) => {
    if (err) {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('Database connection was closed.')
        }
        if (err.code === 'ER_CON_COUNT_ERROR') {
            console.error('Database has too many connections.')
        }
        if (err.code === 'ECONNREFUSED') {
            console.error('Database connection was refused.')
        }
    }
    if (connection) connection.release()
    return
})

pool.query = util.promisify(pool.query);

module.exports = pool;
