var bcrypt = require('bcrypt');

module.exports = (sequelize, type) => {
  var Admins = sequelize.define('admins', {
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
    email: {
      type: type.STRING,
      allowNull: false,
    },
    password: {
      type: type.STRING,
      allowNull: false,
    },
    resetPasswordToken: type.STRING,
    resetPasswordExpires: type.DATE,

  });

// methods ======================
      // generating a hash
 Admins.generateHash = function(password) {
   return bcrypt.hashSync(password, bcrypt.genSaltSync(10), null);
 };

      // checking if password is valid
 Admins.prototype.validPassword = function(password) {
   return bcrypt.compareSync(password, this.password);
 };

 return Admins;

}
