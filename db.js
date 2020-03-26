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
        let parmArray = [username];
        let counter = 2;
        let editQuery = 'UPDATE studentData SET ';
        editQuery += `residencestate = $${counter++}, `;
        parmArray.push(residenceState);
        editQuery += `highschoolname = $${counter++}, `;
        parmArray.push(highSchoolName);
        editQuery += `highschoolcity = $${counter++}, `;
        parmArray.push(highSchoolCity);
        editQuery += `highschoolstate = $${counter++}, `;
        parmArray.push(highSchoolState);
        editQuery += `GPA = $${counter++}, `;
        parmArray.push(GPA);
        editQuery += `collegeclass = $${counter++}, `;
        parmArray.push(collegeClass);
        editQuery += `major1 = $${counter++}, `;
        parmArray.push(major1);
        editQuery += `major2 = $${counter++}, `;
        parmArray.push(major2);
        editQuery += `satebrw = $${counter++}, `;
        parmArray.push(satEBRW);
        editQuery += `satmath = $${counter++}, `;
        parmArray.push(satMath);
        editQuery += `actenglish = $${counter++}, `;
        parmArray.push(actEnglish);
        editQuery += `actmath = $${counter++}, `;
        parmArray.push(actMath);
        editQuery += `actreading = $${counter++}, `;
        parmArray.push(actReading);
        editQuery += `actscience = $${counter++}, `;
        parmArray.push(actScience);
        editQuery += `actcomposite = $${counter++}, `;
        parmArray.push(actComposite);
        editQuery += `satliterature = $${counter++}, `;
        parmArray.push(satLiterature);
        editQuery += `satushistory = $${counter++}, `;
        parmArray.push(satUSHistory);
        editQuery += `satworldhistory = $${counter++}, `;
        parmArray.push(satWorldHistory);
        editQuery += `satmath1 = $${counter++}, `;
        parmArray.push(satMath1);
        editQuery += `satmath2 = $${counter++}, `;
        parmArray.push(satMath2);
        editQuery += `satecobio = $${counter++}, `;
        parmArray.push(satEcoBio);
        editQuery += `satmolbio = $${counter++}, `;
        parmArray.push(satMolBio);
        editQuery += `satchem = $${counter++}, `;
        parmArray.push(satChem);
        editQuery += `satphysics = $${counter++}, `;
        parmArray.push(satPhysics);
        editQuery += `numpassedaps = $${counter++}, `;
        parmArray.push(numPassedAPs);
        editQuery = editQuery.slice(0, -2);
        editQuery += ' WHERE userid = $1';
        console.log(editQuery);
        console.log(parmArray);
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
    }
};