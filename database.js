const mysql = require('mysql')

const connection = mysql.createConnection({
    host: 'localhost',
    database: 'database',
    user: 'username',
    password: 'password',
    
});
