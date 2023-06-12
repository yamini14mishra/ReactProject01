const Pool = require("pg").Pool;

const pool = new Pool({
    host: "localhost",
    user: "postgres",
    port:  5432,
    password: "yamini@1234",
    database: "demo_database"
});
module.exports = pool;