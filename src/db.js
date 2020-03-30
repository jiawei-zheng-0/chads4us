const { Pool } = require('pg')
const config = require('../data/config.json');

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
        userDB.query(registerQuery, [username, hash], (err) => {
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
        userDB.query(registerQuery, [username, hash], (err) => {
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
        userDB.query(changePasswordQuery, [username, password], (err, results) => {
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
    searchColleges: (isStrict, collegename, lowadmissionrate, highadmissionrate, costofattendanceinstate, costofattendanceoutofstate, location, major1,
        major2, lowranking, highranking, lowsize, highsize, lowsatmath, highsatmath, lowsatebrw, highsatebrw, lowactcomposite, highactcomposite, callback) => {
        let params = [];
        let counter = 1;
        let searchQuery = 'SELECT * FROM colleges WHERE 1=1';
        if (collegename) {
            params.push(`%${collegename}%`);
            searchQuery += ` AND collegename LIKE $${counter++}`;
        }
        if (lowadmissionrate && highadmissionrate) {
            params.push(lowadmissionrate);
            params.push(highadmissionrate);
            if (isStrict)
                searchQuery += ` AND admissionrate IS NOT NULL AND admissionrate BETWEEN $${counter++} AND $${counter++}`;
            else
                searchQuery += ` AND admissionrate IS NULL OR admissionrate BETWEEN $${counter++} AND $${counter++}`;
        }
        if (costofattendanceinstate) {
            params.push(costofattendanceinstate);
            if (isStrict)
                searchQuery += ` AND costofattendanceinstate IS NOT NULL AND costofattendanceinstate <= $${counter++}`;
            else
                searchQuery += ` AND costofattendanceinstate IS NULL OR costofattendanceinstate <= $${counter++}`;
        }
        if (costofattendanceoutofstate) {
            params.push(costofattendanceoutofstate);
            if (isStrict)
                searchQuery += ` AND costofattendanceoutofstate IS NOT NULL AND costofattendanceoutofstate <= $${counter++}`;
            else
                searchQuery += ` AND costofattendanceoutofstate IS NULL OR costofattendanceoutofstate <= $${counter++}`;
        }
        if (location) {
            params.push(location);
            if (isStrict)
                searchQuery += ` AND location IS NOT NULL AND location=$${counter++}`;
            else
                searchQuery += ` AND location IS NULL OR location=$${counter++}`;
        }
        if (major1) {
            params.push(`%${major1}%`);
            if (isStrict)
                searchQuery += ` AND majors IS NOT NULL AND ${major1} = ANY (majors)`;
            else
                searchQuery += ` AND majors IS NULL OR ${major1} = ANY (majors)`;
        }
        if (major2) {
            params.push(`%${major2}%`);
            if (isStrict)
                searchQuery += ` AND majors IS NOT NULL AND array_to_string(majors, ',') LIKE $${counter++}`;
            else
                searchQuery += ` AND majors IS NULL OR array_to_string(majors, ',') LIKE $${counter++}`;
        }
        if (lowranking && highranking) {
            params.push(lowranking);
            params.push(highranking);
            if (isStrict)
                searchQuery += ` AND ranking IS NOT NULL AND ranking BETWEEN $${counter++} AND $${counter++}`;
            else
                searchQuery += ` AND ranking IS NULL OR ranking BETWEEN $${counter++} AND $${counter++}`;
        }
        if (lowsize && highsize) {
            params.push(lowsize);
            params.push(highsize);
            if (isStrict)
                searchQuery += ` AND size IS NOT NULL AND size BETWEEN $${counter++} AND $${counter++}`;
            else
                searchQuery += ` AND size IS NULL OR size BETWEEN $${counter++} AND $${counter++}`;
        }
        if (lowsatmath && highsatmath) {
            params.push(lowsatmath);
            params.push(highsatmath);
            if (isStrict)
                searchQuery += ` AND satmath IS NOT NULL AND satmath BETWEEN $${counter++} AND $${counter++}`;
            else
                searchQuery += ` AND satmath IS NULL OR satmath BETWEEN $${counter++} AND $${counter++}`;
        }
        if (lowsatebrw && highsatebrw) {
            params.push(lowsatebrw);
            params.push(highsatebrw);
            if (isStrict)
                searchQuery += ` AND satebrw IS NOT NULL AND satebrw BETWEEN $${counter++} AND $${counter++}`;
            else
                searchQuery += ` AND satebrw IS NULL OR satebrw BETWEEN $${counter++} AND $${counter++}`;
        }
        if (lowactcomposite && highactcomposite) {
            params.push(lowactcomposite);
            params.push(highactcomposite);
            if (isStrict)
                searchQuery += ` AND actcomposite IS NOT NULL AND actcomposite BETWEEN $${counter++} AND $${counter++}`;
            else
                searchQuery += ` AND actcomposite IS NULL OR actcomposite BETWEEN $${counter++} AND $${counter++}`;
        }
        console.log(searchQuery);
        console.log(params);
        collegeDB.query(searchQuery, params, (err, results) => {
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
        userDB.query(deleteProfilesQuery, (err) => {
            if (err) {
                callback(err);
            }
            else {
                userDB.query(deleteAccountsQuery, (err) => {
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

    //import colleges
    importColleges: (colleges, callback) => {
        let importCollegeRankingsQuery = 'INSERT INTO colleges (collegename) VALUES ';
        let counter = 1;
        for (let i = 0; i < colleges.length; i++) {
            importCollegeRankingsQuery += `($${counter++}), `;
        }
        importCollegeRankingsQuery = importCollegeRankingsQuery.slice(0, -2);
        importCollegeRankingsQuery += 'ON CONFLICT DO NOTHING'
        collegeDB.query(importCollegeRankingsQuery, colleges, (err) => {
            if (err) {
                console.log(err);
                callback(err);
            }
            else {
                callback(null);
            }
        })
    },

    //delete colleges data
    deleteCollegeData: (colleges, callback) => {
        let deleteCollegeData = 'DELETE FROM colleges';
        collegeDB.query(deleteCollegeData, (err) => {
            if (err) {
                console.log(err);
                callback(err);
            }
            else {
                let importCollegeRankingsQuery = 'INSERT INTO colleges (collegename) VALUES ';
                let counter = 1;
                for (let i = 0; i < colleges.length; i++) {
                    importCollegeRankingsQuery += `($${counter++}), `;
                }
                importCollegeRankingsQuery = importCollegeRankingsQuery.slice(0, -2);
                importCollegeRankingsQuery += 'ON CONFLICT DO NOTHING'
                collegeDB.query(importCollegeRankingsQuery, colleges, (err) => {
                    if (err) {
                        console.log(err);
                        callback(err);
                    }
                    else {
                        callback(null);
                    }
                })
            }
        })
    },

    //Import college rankings, on conflict, repalce ranking
    importCollegeRankings: (collegeRankings, callback) => {
        let importCollegeRankingsQuery = 'INSERT INTO colleges (collegename, ranking) VALUES ';
        let counter = 1;
        for (let i = 0; i < collegeRankings.length / 2; i++) {
            importCollegeRankingsQuery += `($${counter++}, $${counter++}), `;
        }
        importCollegeRankingsQuery = importCollegeRankingsQuery.slice(0, -2);
        importCollegeRankingsQuery += ' ON CONFLICT (collegename) DO UPDATE SET ranking = EXCLUDED.ranking';

        collegeDB.query(importCollegeRankingsQuery, collegeRankings, (err) => {
            if (err) {
                console.log(err);
                callback(err);
            }
            else {
                callback(null);
            }
        })
    },

    importCollegeData: (collegename, graduationrate, costOfAttendanceInState, costOfAttendanceOutOfState, majors, satMathAvg, satEBRWAvg, actAvg, callback) => {
        let importCollegeDataQuery = 'UPDATE colleges SET completionrate=$2, costofattendanceinstate = $3, costofattendanceoutofstate = $4, majors = $5, satmath = $6, satebrw = $7, actcomposite=$8 WHERE collegename = $1';
        collegeDB.query(importCollegeDataQuery, [collegename, graduationrate, costOfAttendanceInState, costOfAttendanceOutOfState, majors, satMathAvg, satEBRWAvg, actAvg], (err) => {
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
        let getAllCollegesQuery = 'SELECT * FROM colleges ORDER BY ranking';
        collegeDB.query(getAllCollegesQuery, (err, results) => {
            if (err) {
                console.log(err);
                callback(err);
            }
            else {
                callback(null, results.rows);
            }
        })
    }
};