
module.exports = (sequelize, type) => {
  var Company = sequelize.define('company_info', {
    id: {
      type: type.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    company: {
      type: type.STRING,
      allowNull: false,
    }
  });

 return Company;

}
