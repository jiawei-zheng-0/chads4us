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
        const registerQuery = 'INSERT INTO users(userid,password) VALUES($1, $2)';
        const createProfileQuery = 'INSERT INTO studentData(userid) VALUES($1)';
        userDB.query(registerQuery, [username, hash], (err, results) => {
            if (err) {
                callback(err);
            }
            else {
                callback(null, results);
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
                else {
                    //Return just the password field
                    callback(null, results.rows[0].password);
                }
            }
        })
    },
    //Edit Profile
    editProfile: (username, residenceState, highSchoolName, highSchoolCity, highSchoolState, GPA, collegeClass, 
        major1, major2, satEBRW, satMath, actEnglish, actMath, actReading, actScience, actComposite, 
        satLiterature, satUSHistory, satWorldHistory, satMath1, satMath2, satEcoBio, satMolBio, 
        satChem, satPhysics, numPassedAPs, callback) => {
        let editQuery = 'UPDATE studentData SET ';
        if (residenceState) {
            editQuery += 'residencestate = $2';
        }
        if (highSchoolName) {
            editQuery += 'highschoolname = $3';
        }
        if (highSchoolCity) {
            editQuery += 'highschoolcity = $4';
        }
        if (highSchoolState) {
            editQuery += 'highschoolstate = $5';
        }
        if (GPA) {
            editQuery += 'GPA = $6'
        }
        if (collegeClass) {
            editQuery += 'collegeclass = $7';
        }
        if (major1) {
            editQuery += 'major1 = $8';
        }
        if (major2) {
            editQuery += 'major2 = $9';
        }
        if (satEBRW) {
            editQuery += 'satebrw = $10';
        }
        if (satMath) {
            editQuery += 'satmath = $11';
        }
        if (actEnglish) {
            editQuery += 'actenglish = $12';
        }
        if (actMath) {
            editQuery += 'actmath = $13';
        }
        if (actReading) {
            editQuery += 'actreading = $14';
        }
        if (actScience) {
            editQuery += 'actscience = $15';
        }
        if (actComposite) {
            editQuery += 'actcomposite = $16';
        }
        if (satLiterature) {
            editQuery += 'satliterature = $17';
        }
        if (satUSHistory) {
            editQuery += 'satushistory = $18';
        }
        if (satWorldHistory) {
            editQuery += 'satworldhistory = $19';
        }
        if (satMath1) {
            editQuery += 'satmath1 = $20';
        }
        if (satMath2) {
            editQuery += 'satmath2 = $21';
        }
        if (satEcoBio) {
            editQuery += 'satecobio = $22';
        }
        if (satMolBio) {
            editQuery += 'satmolbio = $23';
        }
        if (satChem) {
            editQuery += 'satchem = $24';
        }
        if (satPhysics) {
            editQuery += 'satphysics = $25';
        }
        if (numPassedAPs) {
            editQuery += 'numpassedaps = $26';
        }
        userDB.query(editQuery, [username, residenceState, highSchoolName, highSchoolCity, highSchoolState, GPA, collegeClass, 
            major1, major2, satEBRW, satMath, actEnglish, actMath, actReading, actScience, actComposite, 
            satLiterature, satUSHistory, satWorldHistory, satMath1, satMath2, satEcoBio, satMolBio, 
            satChem, satPhysics, numPassedAPs], (err, results) => {
            if (err) {
                callback(err);
            }
            else {
                if (results.rowCount == 0){
                    callback(results);
                }
                else {
                    callback(null, results);
                }
            }
        })
    },
};