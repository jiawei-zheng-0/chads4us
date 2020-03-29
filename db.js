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
        const registerQuery = 'INSERT INTO users (username,password) VALUES($1, $2)';
        const createProfileQuery = 'INSERT INTO studentdata (username) VALUES ($1)';
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
    importProfile: (username, hash, callback) => {
        const registerQuery = 'INSERT INTO users (username,password) VALUES($1, $2)  ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password';
        const createProfileQuery = 'INSERT INTO studentdata (username) VALUES ($1) ON CONFLICT DO NOTHING';
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
        const loginQuery = 'SELECT password FROM users WHERE username=$1';
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
        const getProfileQuery = 'SELECT * FROM studentdata WHERE username = $1';
        userDB.query(getProfileQuery, [username], (err, results) => {
            if (err) {
                callback(err);
            }
            else {
                if (results.rowCount == 0) {
                    callback('Profile does not exist');
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
        satecobio = $22, satmolbio = $23, satchem = $24, satphysics = $25, numpassedaps = $26 WHERE username = $1`;
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
    //Change password
    changePassword: (username, password, callback) => {
        let changePasswordQuery = `UPDATE users SET password = $2 WHERE username = $1`;
        userDB.query(changePasswordQuery, [username,password], (err, results) => {
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
    //Search for colleges
    searchColleges: (isStrict, collegename, lowadmissionrate, highadmissionrate, costofattendance, location, major1,
        major2, lowranking, highranking, lowsize, highsize, lowsatmath, highsatmath, lowsatebrw, highsatebrw, lowactcomposite, highactcompsite, callback) => {
        let searchQuery = 'SELECT * FROM colleges WHERE 1=1';
        if (collegename) {
            if (isStrict)
                searchQuery += ` AND collegename IS NOT NULL AND collegename LIKE '%${collegename}%'`;
            else
                searchQuery += ` AND collegename IS NULL OR collegename LIKE '%${collegename}%'`;
        }
        if (lowadmissionrate && highadmissionrate) {
            if (isStrict)
                searchQuery += ` AND admissionrate IS NOT NULL AND admissionrate BETWEEN ${lowadmissionrate/100} AND ${highadmissionrate/100}`;
            else
                searchQuery += ` AND admissionrate IS NULL OR admissionrate BETWEEN ${lowadmissionrate/100} AND ${highadmissionrate/100}`;
        }
        if (costofattendance) {
            if (isStrict)
                searchQuery += ` AND costofattendance IS NOT NULL AND costofattendance <= ${costofattendance}`;
            else
                searchQuery += ` AND costofattendance IS NULL OR costofattendance <= ${costofattendance}`;
        }
        if (location) {
            if (isStrict)
                searchQuery += ` AND location IS NOT NULL AND location='${location}'`;
            else
                searchQuery += ` AND location IS NULL OR location='${location}'`;
        }
        if (major1) {
            if (isStrict)
                searchQuery += ` AND major1 IS NOT NULL AND array_to_string(majors, ',') LIKE '%${major1}%'`;
            else
                searchQuery += ` AND major1 IS NULL OR array_to_string(majors, ',') LIKE '%${major1}%'`;
        }
        if (major2) {
            if (isStrict)
                searchQuery += ` AND major2 IS NOT NULL AND array_to_string(majors, ',') LIKE '%${major2}%'`;
            else
                searchQuery += ` AND major2 IS NULL OR array_to_string(majors, ',') LIKE '%${major2}%'`;
        }
        if (lowranking && highranking) {
            if (isStrict)
                searchQuery += ` AND ranking IS NOT NULL AND ranking BETWEEN ${lowranking} AND ${highranking}`;
            else
                searchQuery += ` AND ranking IS NULL OR ranking BETWEEN ${lowranking} AND ${highranking}`;
        }
        if (lowsize && highsize) {
            if (isStrict)
                searchQuery += ` AND size IS NOT NULL AND size BETWEEN ${lowsize} AND ${highsize}`;
            else
                searchQuery += ` AND size IS NULL OR size BETWEEN ${lowsize} AND ${highsize}`;
        }
        if (lowsatmath && highsatmath) {
            if (isStrict)
                searchQuery += ` AND satmath IS NOT NULL AND satmath BETWEEN ${lowsatmath} AND ${highsatmath}`;
            else
                searchQuery += ` AND satmath IS NULL OR satmath BETWEEN ${lowsatmath} AND ${highsatmath}`;
        }
        if (lowsatebrw && highsatebrw) {
            if (isStrict)
                searchQuery += ` AND satebrw IS NOT NULL AND satebrw BETWEEN ${lowsatebrw} AND ${highsatebrw}`;
            else
                searchQuery += ` AND satebrw IS NULL OR satebrw BETWEEN ${lowsatebrw} AND ${highsatebrw}`;
        }
        if (lowactcomposite && highactcomposite) {
            if (isStrict)
                searchQuery += ` AND actcomposite IS NOT NULL AND actcomposite BETWEEN ${lowactcomposite} AND ${highactcomposite}`;
            else
                searchQuery += ` AND actcomposite IS NULL OR actcomposite BETWEEN ${lowactcomposite} AND ${highactcomposite}`;
        }
        console.log(searchQuery);
        collegeDB.query(searchQuery, (err, results) => {
            if (err) {
                callback(err);
            } else {
                callback(null, results);
            }
        });
    },
    //Delete profiles (admin)
    deleteProfiles: (callback) => {
        const deleteProfilesQuery = 'DELETE FROM studentdata';
        const deleteAccountsQuery = 'DELETE FROM users';
        userDB.query(deleteProfilesQuery, (err, results) => {
            if (err) {
                callback(err);
            }
            else {
                userDB.query(deleteAccountsQuery, (err, results) => {
                    if (err) {
                        callback(err);
                    }
                    else {
                        callback(null);
                    }
                });
            }
        })
    },
    //import college
    /*
    importColleges: (colleges, callback) => {
        let importCollegeRankingsQuery = 'INSERT INTO colleges (collegename, ranking) VALUES ';
        let counter = 1;
        for (let i = 0; i < collegeRankings.length / 2; i++) {
            importCollegeRankingsQuery += `($${counter++}, $${counter++}), `;
        };
        importCollegeRankingsQuery = importCollegeRankingsQuery.slice(0, -2);
        importCollegeRankingsQuery += ' ON CONFLICT (collegename) DO UPDATE SET ranking = EXCLUDED.ranking';

        collegeDB.query(importCollegeRankingsQuery, collegeRankings, (err, results) => {
            if (err) {
                console.log(err);
                callback(err);
            }
            else {
                callback(null);
            }
        })
    },
    */
    importCollegeRankings: (collegeRankings, callback) => {
        let importCollegeRankingsQuery = 'INSERT INTO colleges (collegename, ranking) VALUES ';
        let counter = 1;
        for (let i = 0; i < collegeRankings.length / 2; i++) {
            importCollegeRankingsQuery += `($${counter++}, $${counter++}), `;
        };
        importCollegeRankingsQuery = importCollegeRankingsQuery.slice(0, -2);
        importCollegeRankingsQuery += ' ON CONFLICT (collegename) DO UPDATE SET ranking = EXCLUDED.ranking';

        collegeDB.query(importCollegeRankingsQuery, collegeRankings, (err, results) => {
            if (err) {
                console.log(err);
                callback(err);
            }
            else {
                callback(null);
            }
        })
    },
    getAllColleges: (callback) => {
        let getAllCollegesQuery = 'SELECT * FROM colleges ORDER BY rank';
        collegeDB.query(getAllCollegesQuery, (err, results) => {
            if (err) {
                console.log(err);
                callback(err);
            }
            else {
                callback(null,results.rows);
            }
        })
    }
};