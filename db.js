const { Pool, Client } = require('pg')
const config = require('./config.json');

const userDB = new Pool({
    user: config.userDBusername,
    host: config.userDBhost,
    database: config.userDBdatabase,
    password: config.userDBpassword,
    port: config.userDBport,
    ssl: true
})

const collegeDB = new Pool({
    user: config.collegeDBusername,
    host: config.collegeDBhost,
    database: config.collegeDBdatabase,
    password: config.collegeDBpassword,
    port: config.collegeDBport,
    ssl: true
})

module.exports = {
    register: (username, hash, callback) => {
        const registerQuery = 'INSERT INTO users (userid,password) VALUES($1, $2)';
        const createProfileQuery = 'INSERT INTO studentdata (userid) VALUES ($1)';
        userDB.query(registerQuery, [username, hash], (err, results) => {
            if (err) {
                callback(err);
            }
            else {
                userDB.query(createProfileQuery, [username], (err, results) => {
                    if (err) {
                        callback(err);
                    }
                    else {
                        callback(null, results);
                    }
                })
            }
        })
    },
    //Get hashed password
    login: (username, callback) => {
        const loginQuery = 'SELECT password FROM users WHERE userid=$1';
        userDB.query(loginQuery, [username], (err, results) => {
            if (err) {
                callback(err);
            }
            else {
                if (results.rowCount == 0){
                    callback(results);
                }
                else{
                    //Return just the password field
                    callback(null, results.rows[0].password);
                }
            }
        })
    },
    editProfile: (username, password, GPA, callback) => {
        let editQuery = 'UPDATE studentData SET '
        if (password){
            editQuery += `password = $1`
        }
        if (GPA){
            editQuery += `GPA = $2`
        }
        userDB.query(loginQuery, [username], (err, results) => {
            if (err) {
                callback(err);
            }
            else {
                if (results.rowCount == 0){
                    callback(results);
                }
                else{
                    //Return just the password field
                    callback(null, results.rows[0].password);
                }
            }
        })
    },
};