'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Articles extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  Articles.init({
    author: DataTypes.STRING,
    title: DataTypes.STRING,
    preview: DataTypes.STRING,
    text: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Articles',
  });
  return Articles;
};