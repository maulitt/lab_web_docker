const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('users', 'regina', 'qwerty', {
    host: 'localhost',
    dialect: 'postgres'
});

async function connecting() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}
exports.Sequelize = Sequelize;
exports.sequelize = sequelize;
exports.connecting = connecting;