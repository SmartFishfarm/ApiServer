var bcrypt = require('bcrypt');

module.exports = (sequelize, type) => {
  var Users = sequelize.define('users', {
    id: {
      type: type.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: type.STRING,
      allowNull: false,
    },
    company_id: {
      type: type.INTEGER,
      allowNull: false,
    },
    email: {
      type: type.STRING,
      allowNull: false,
    },
    password: {
      type: type.STRING,
      allowNull: false,
    },
/*
    verify: {
      type: type.INTEGER,
      allowNull: false,
    },
*/
    resetPasswordToken: type.STRING,
    resetPasswordExpires: type.DATE,

  });

// methods ======================
      // generating a hash
 Users.generateHash = function(password) {
   return bcrypt.hashSync(password, bcrypt.genSaltSync(10), null);
   //return bcrypt.hashSync(password, null, null);
 };

      // checking if password is valid
 Users.prototype.validPassword = function(password) {
   return bcrypt.compareSync(password, this.password);
 };

 return Users;


}
