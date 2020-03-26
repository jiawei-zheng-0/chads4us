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
    //Register
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
                if (results.rowCount == 0) {
                    callback(err);//no user exist
                }
                else {
                    //Return just the password field
                    callback(null, results.rows[0].password);
                }
            }
        })
    },
    //Get profile
    getProfile: (username, callback) => {
        const getProfileQuery = 'SELECT * FROM studentdata WHERE userid = $1';
        userDB.query(getProfileQuery, [username], (err, results) => {
            if (err) {
                callback(err);
            }
            else {
                if (results.rowCount == 0) {
                    callback(err);
                }
                else {
                    callback(null, results.rows[0]);
                }
            }
        })
    },
    //Edit profile
    editProfile: (username, residenceState, highSchoolName, highSchoolCity, highSchoolState, GPA, collegeClass,
        major1, major2, satEBRW, satMath, actEnglish, actMath, actReading, actScience, actComposite,
        satLiterature, satUSHistory, satWorldHistory, satMath1, satMath2, satEcoBio, satMolBio,
        satChem, satPhysics, numPassedAPs, callback) => {
        let parmArray = [username, residenceState, highSchoolName, highSchoolCity, highSchoolState, GPA, collegeClass,
            major1, major2, satEBRW, satMath, actEnglish, actMath, actReading, actScience, actComposite,
            satLiterature, satUSHistory, satWorldHistory, satMath1, satMath2, satEcoBio, satMolBio,
            satChem, satPhysics, numPassedAPs];
        let counter = 2;
        let editQuery = `UPDATE studentData SET residencestate = $2, highschoolname = $3, highschoolcity = $4, highschoolstate = $5, GPA = $6,
        collegeclass = $7, major1 = $8, major2 = $9, satebrw = $10, satmath = $11, actenglish = $12, actmath = $13, actreading = $14, 
        actscience = $15, actcomposite = $16, satliterature = $17, satushistory = $18, satworldhistory = $19, satmath1 = $20, satmath2 = $21, 
        satecobio = $22, satmolbio = $23, satchem = $24, satphysics = $25, numpassedaps = $26 WHERE userid = $1`;
        userDB.query(editQuery, parmArray, (err, results) => {
            if (err) {
                callback(err);
            }
            else {
                if (results.rowCount == 0) {
                    callback(null, results);
                }
                else {
                    callback(null, results);
                }
            }
        })
    },
    //Delete profiles (admin)
    deleteProfiles: (callback) => {
        const deleteProfilesQuery = 'DELETE FROM studentdata';
        userDB.query(deleteProfilesQuery, (err, results) => {
            if (err) {
                callback(err);
            }
            else {
                callback(null);
            }
        })
    },
    //Import student profiles from csv
    importProfiles: (callback) => {
        let csv = './students-1.csv';
        const tempTableQuery = 'CREATE TEMP TABLE x AS SELECT * FROM studentData LIMIT 0';
        const alterTableQuery = 'ALTER TABLE x ADD COLUMN password varchar';
        const copyCSVQuery = `COPY x FROM ${csv} DELIMITER ',' CSV HEADER`;
        const wipeProfilesQuery = 'DELETE FROM studentData';
        const importProfilesQuery = 'INSERT INTO studentData (userid,residencestate,highschoolname, highschoolcity, highschoolstate, gpa, collegeclass, major1, major2, satebrw, satmath, actenglish, actmath, actreading, actscience, actcomposite, satliterature, satushistory, satworldhistory, satmath1, satmath2, satecobio, satmolbio, satchem, satphysics, numpassedaps) SELECT (userid,residencestate,highschoolname, highschoolcity, highschoolstate, gpa, collegeclass, major1, major2, satebrw, satmath, actenglish, actmath, actreading, actscience, actcomposite, satliterature, satushistory, satworldhistory, satmath1, satmath2, satecobio, satmolbio, satchem, satphysics, numpassedaps) FROM x';
        userDB.query(tempTableQuery, (err, results) => {
            if (err) {
                callback(err);
            }
            else {
                userDB.query(alterTableQuery, (err, results) => {
                    if (err) {
                        callback(err);
                    }
                    else {
                        userDB.query(copyCSVQuery, (err, results) => {
                            if (err) {
                                callback(err);
                            }
                            else {
                                userDB.query(wipeProfilesQuery, (err, results) => {
                                    if (err) {
                                        callback(err);
                                    }
                                    else {
                                        userDB.query(importProfilesQuery, (err, results) => {
                                            if (err) {
                                                callback(err);
                                            }
                                            else {
                                                callback(results);
                                            }
                                        })
                                    }
                                })
                            }
                        })
                    }
                })
            }
        })
    }
};