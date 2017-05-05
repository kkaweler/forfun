function createConfg() {
    var config = {};
    config.modulesPath = "";
    config.mysqlConfig = {
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'forfun',
        port: '3306'
    };
    return config
}

module.exports = createConfg();