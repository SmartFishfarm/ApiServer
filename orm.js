var Sequelize = require('sequelize');
var UserModel = require('./models/users');
var CompanyModel = require('./models/company');
var AdminsModel = require('./models/admins');
const Config = require('./config/config');

const sequelize = new Sequelize(Config.db_name, Config.db_user, Config.db_pass, {
  host: 'localhost',
  dialect: 'mysql',
  pool: {
    max: 100,
    min: 1,
    idle: 10000
  },

});

const Users = UserModel(sequelize, Sequelize);
const Company = CompanyModel(sequelize, Sequelize);
const Admins = AdminsModel(sequelize, Sequelize);


/*
sequelize.sync().then(() => {
  console.log('appdb and users table have been created');
});
*/

sequelize.sync();

module.exports = {
   Users,
   Company,
   Admins
};

