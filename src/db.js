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
    importApplication: (username, collegename, status, callback) => {
        const importApplicationUpdateQuery = `UPDATE applications SET status = $3 WHERE username = $1 AND collegename = $2`;
        const importApplicationNewQuery = 'INSERT INTO applications (username,collegename,status) VALUES ($1,$2,$3)';
        userDB.query(importApplicationUpdateQuery, [username, collegename, status], (err, results) => {
            if (err) {
                callback(err);
            }
            else {
                if (results.rowCount == 0) {
                    userDB.query(importApplicationNewQuery, [username, collegename, status], (err, results) => {
                        if (err) {
                            callback(err);
                        }
                        else {
                            callback(null, results);
                        }
                    });
                }
                else {
                    callback(null, results);
                }
            }
        });
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
    //Edit applications
    editApplications: (username, collegename, status, callback) => {
        let updateApplicationQuery = `UPDATE applications SET status = $3 WHERE username = $1 AND collegename = $2`;
        let addApplicationQuery = `INSERT INTO applications (username, collegename, status) VALUES ($1,$2,$3)`;

        let studentACTCompQuery = `SELECT actcomposite FROM studentdata WHERE username = $1`;
        let studentSATMathQuery = `SELECT satmath FROM studentdata WHERE username = $1`;
        let studentSATEBRWQuery = `SELECT satebrw FROM studentdata WHERE username = $1`;
        let collegeACTCompQuery = `SELECT actcomposite FROM colleges WHERE collegename = $1`;
        let collegeSATMathQuery = `SELECT satmath FROM colleges WHERE collegename = $1`;
        let collegeSATEBRWQuery = `SELECT satebrw FROM colleges WHERE collegename = $1`;
        let flagQuery = `UPDATE applications SET questionable = $1 WHERE username = $2 AND collegename = $3`;

        let studentactCompScore, studentsatMathScore, studentsatEBRWScore, collegeactCompScore, collegesatMathScore, collegesatEBRWScore;
        let questionable;

        userDB.query(updateApplicationQuery, [username, collegename, status], (err, results) => {
            if (err) {
                callback(err);
            }
            else {
                if (results.rowCount == 0) {
                    userDB.query(addApplicationQuery, [username, collegename, status], (err, results) => {
                        if (err) {
                            callback(err);
                        }
                        else {
                            if (status == 'accepted') {
                                studentTests();
                            }
                            callback(null, questionable);
                        }
                    });
                }
                else {
                    if (status == 'accepted') {
                        studentTests();
                    }
                    callback(null, questionable);
                }
            }
        });

        const studentTests = function () {
            userDB.query(studentACTCompQuery, [username], (err, results) => {
                if (err) {
                    callback(err);
                }
                else {
                    studentactCompScore = results.rows[0].actcomposite;
                    userDB.query(studentSATMathQuery, [username], (err, results) => {
                        if (err) {
                            callback(err);
                        }
                        else {
                            studentsatMathScore = results.rows[0].satmath;
                            userDB.query(studentSATEBRWQuery, [username], (err, results) => {
                                if (err) {
                                    callback(err);
                                }
                                else {
                                    studentsatEBRWScore = results.rows[0].satebrw;
                                    collegeTests();
                                }
                            });
                        }
                    });
                }
            });
        }

        const collegeTests = function () {
            collegeDB.query(collegeACTCompQuery, [collegename], (err, results) => {
                if (err) {
                    callback(err);
                }
                else {
                    collegeactCompScore = results.rows[0].actcomposite;
                    collegeDB.query(collegeSATMathQuery, [collegename], (err, results) => {
                        if (err) {
                            callback(err);
                        }
                        else {
                            collegesatMathScore = results.rows[0].satmath;
                            collegeDB.query(collegeSATEBRWQuery, [collegename], (err, results) => {
                                if (err) {
                                    callback(err);
                                }
                                else {
                                    collegesatEBRWScore = results.rows[0].satebrw;
                                    // report questionable decisions
                                    userDB.query(flagQuery, [flag(), username, collegename]);
                                }
                            });
                        }
                    });
                }
            });
        }

        const flag = function () {
            let decisionScore = Math.max((collegeactCompScore - studentactCompScore) / collegeactCompScore, (collegesatMathScore - studentsatMathScore) / collegesatMathScore, (collegesatEBRWScore - studentsatEBRWScore) / collegesatEBRWScore);
            let flag = decisionScore >= 0.12 ? true : false;
            questionable = flag;
            return flag;
        }
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
    searchColleges: (isStrict, collegename, lowadmissionrate, highadmissionrate, costofattendance, region, major1, major2, lowranking, highranking,
        lowsize, highsize, lowsatmath, highsatmath, lowsatebrw, highsatebrw, lowactcomposite, highactcomposite, callback) => {
        let searchQuery = 'SELECT * FROM colleges WHERE 1=1';
        if (collegename) {
            if (isStrict)
                searchQuery += ` AND collegename IS NOT NULL AND collegename ILIKE '%${collegename}%'`;
            else
                searchQuery += ` AND (collegename IS NULL OR collegename ILIKE '%${collegename}%')`;
        }
        if (lowadmissionrate && highadmissionrate) {
            if (isStrict)
                searchQuery += ` AND admissionrate IS NOT NULL AND admissionrate BETWEEN ${lowadmissionrate / 100.0} AND ${highadmissionrate / 100.0}`;
            else
                searchQuery += ` AND (admissionrate IS NULL OR admissionrate BETWEEN ${lowadmissionrate / 100.0} AND ${highadmissionrate / 100.0})`;
        }
        //TODO : public uni cost 
        if (costofattendance) {
            if (isStrict)
                searchQuery += ` AND costofattendanceinstate IS NOT NULL AND costofattendanceinstate <= ${costofattendance}`;
            else
                searchQuery += ` AND (costofattendanceinstate IS NULL OR costofattendanceinstate <= ${costofattendance})`;
        }
        if (region) {
            if (isStrict)
                searchQuery += ` AND region IS NOT NULL AND region='${region}'`;
            else
                searchQuery += ` AND (region IS NULL OR region='${region}')`;
        }
        if (major1) {
            if (isStrict)
                searchQuery += ` AND majors IS NOT NULL AND array_to_string(majors, ',') ILIKE '%${major1}%'`;
            else
                searchQuery += ` AND (majors IS NULL OR array_to_string(majors, ',') ILIKE '%${major1}%')`;
        }
        if (major2) {
            if (isStrict)
                searchQuery += ` AND majors IS NOT NULL AND array_to_string(majors, ',') ILIKE '%${major2}%'`;
            else
                searchQuery += ` AND (majors IS NULL OR array_to_string(majors, ',') ILIKE '%${major2}%')`;
        }
        if (lowranking && highranking) {
            if (isStrict)
                searchQuery += ` AND ranking IS NOT NULL AND ranking BETWEEN ${lowranking} AND ${highranking}`;
            else
                searchQuery += ` AND (ranking IS NULL OR ranking BETWEEN ${lowranking} AND ${highranking})`;
        }
        if (lowsize && highsize) {
            if (isStrict)
                searchQuery += ` AND size IS NOT NULL AND size BETWEEN ${lowsize} AND ${highsize}`;
            else
                searchQuery += ` AND (size IS NULL OR size BETWEEN ${lowsize} AND ${highsize})`;
        }
        if (lowsatmath && highsatmath) {
            if (isStrict)
                searchQuery += ` AND satmath IS NOT NULL AND satmath BETWEEN ${lowsatmath} AND ${highsatmath}`;
            else
                searchQuery += ` AND (satmath IS NULL OR satmath BETWEEN ${lowsatmath} AND ${highsatmath})`;
        }
        if (lowsatebrw && highsatebrw) {
            if (isStrict)
                searchQuery += ` AND satebrw IS NOT NULL AND satebrw BETWEEN ${lowsatebrw} AND ${highsatebrw}`;
            else
                searchQuery += ` AND (satebrw IS NULL OR satebrw BETWEEN ${lowsatebrw} AND ${highsatebrw})`;
        }
        if (lowactcomposite && highactcomposite) {
            if (isStrict)
                searchQuery += ` AND actcomposite IS NOT NULL AND actcomposite BETWEEN ${lowactcomposite} AND ${highactcomposite}`;
            else
                searchQuery += ` AND (actcomposite IS NULL OR actcomposite BETWEEN ${lowactcomposite} AND ${highactcomposite})`;
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
    //College recommender
    collegeRecommender: (username, collegename, callback) => {
        const rankingQuery = 'SELECT ranking FROM colleges WHERE collegename = $1';
        const stateQuery = 'SELECT highschoolstate FROM studentdata WHERE username = $1';
        const sameStateQuery = 'SELECT * FROM studentdata WHERE highschoolstate = $1 AND username <> $2';
        const sameCollegeQuery = 'SELECT username FROM applications WHERE username = $1 AND collegename = $2';
        const studentGPAQuery = 'SELECT gpa FROM studentdata WHERE username = $1';
        const collegeGPAQuery = 'SELECT gpa FROM colleges WHERE collegename = $1';
        const studentSATQuery = 'SELECT SUM(satmath + satebrw) FROM studentdata WHERE username = $1';
        const studentACTQuery = 'SELECT actcomposite FROM studentdata WHERE username = $1';
        const collegeSATQuery = 'SELECT SUM(satmath + satebrw) FROM colleges WHERE collegename = $1';
        const collegeACTQuery = 'SELECT actcomposite FROM colleges WHERE collegename = $1';
        let ranking, numSimStudents, numSimStudentsSameCollege, studentGPA, collegeGPA, studentSAT, studentACT, collegeSAT, collegeACT;
        let higherTest;
        let rankingPoints, popularityPoints, gpaPoints, satactPoints;

        const getSAT = function () {
            userDB.query(studentSATQuery, [username], (err, results) => {
                if (err) {
                    callback(err);
                }
                else {
                    studentSAT = Number(results.rows[0].sum);
                    collegeDB.query(collegeSATQuery, [collegename], (err, results) => {
                        if (err) {
                            callback(err);
                        }
                        else {
                            collegeSAT = Number(results.rows[0].sum);
                            getACT();
                        }
                    });
                }
            });
        }
        const getACT = function () {
            userDB.query(studentACTQuery, [username], (err, results) => {
                if (err) {
                    callback(err);
                }
                else {
                    studentACT = Number(results.rows[0].actcomposite);
                    collegeDB.query(collegeACTQuery, [collegename], (err, results) => {
                        if (err) {
                            callback(err);
                        }
                        else {
                            collegeACT = Number(results.rows[0].actcomposite);
                            higherTest = studentSAT / 1600.0 >= studentACT / 36.0 ? "SAT" : "ACT";
                            getRanking();
                        }
                    });
                }
            });
        }
        const getRanking = function () {
            collegeDB.query(rankingQuery, [collegename], (err, results) => {
                if (err) {
                    callback(err);
                }
                else {
                    ranking = results.rows[0].ranking;
                    getSimStudents();
                }
            });
        }
        const getSimStudents = function () {
            userDB.query(stateQuery, [username], (err, results) => {
                if (err) {
                    callback(err);
                }
                else {
                    userDB.query(sameStateQuery, [results.rows[0].highschoolstate, username], (err, results) => {
                        if (err) {
                            callback(err);
                        }
                        else {
                            // get similar students
                            numSimStudents = 0;
                            let simStudentsList = [];
                            for (let i = 0; i < results.rows.length; i++) {
                                if (higherTest == "SAT") {
                                    if (studentSAT >= ((results.rows[i].satmath + results.rows[i].satebrw) * 0.9) && studentSAT <= ((results.rows[i].satmath + results.rows[i].satebrw) * 1.1)) {
                                        numSimStudents++;
                                        simStudentsList.push(results.rows[i]);
                                    }
                                }
                                else {
                                    if (studentACT >= (results.rows[i].actcomposite * 0.9) && studentACT <= (results.rows[i].actcomposite * 1.1)) {
                                        numSimStudents++;
                                        simStudentsList.push(results.rows[i]);
                                    }
                                }
                            }
                            // get num of similar students that applied to the same college
                            numSimStudentsSameCollege = 0;
                            for (let j = 0; j < simStudentsList.length; j++) {
                                userDB.query(sameCollegeQuery, [simStudentsList[j].username, collegename], (err, results) => {
                                    if (err) {
                                        callback(err);
                                    }
                                    else {
                                        if (results.rows) {
                                            numSimStudentsSameCollege++;
                                        }
                                    }
                                });
                            }
                        }
                    });
                }
                getGPA();
            });
        }
        const getGPA = function () {
            userDB.query(studentGPAQuery, [username], (err, results) => {
                if (err) {
                    callback(err);
                }
                else {
                    studentGPA = results.rows[0].gpa;
                    collegeDB.query(collegeGPAQuery, [collegename], (err, results) => {
                        if (err) {
                            callback(err);
                        }
                        else {
                            collegeGPA = results.rows[0].gpa;
                            // Calculate points
                            let score = calculateCollegeRecommendationScore();
                            callback(null, score);
                        }
                    });
                }
            });
        }

        function calculateCollegeRecommendationScore() {
            // WSJ has 801 college rankings
            rankingPoints = ((801 - ranking) / 801) * 10;
            // Half points for similar students if there are no similar students
            if (numSimStudents == 0 || numSimStudentsSameCollege == 0) {
                popularityPoints = 15;
            }
            else {
                popularityPoints = (numSimStudentsSameCollege / numSimStudents) * 30;
            }
            // If student GPA >= College GPA, max points
            if (studentGPA >= collegeGPA) {
                gpaPoints = 40;
            }
            // If student GPA <= 0.7 * College GPA, no points
            else if (studentGPA <= 0.7 * collegeGPA) {
                gpaPoints = 0;
            }
            else {
                gpaPoints = 0.4 * ((100 / (0.3 * collegeGPA)) * studentGPA - (700 / 3));
            }
            // Use higher of SAT or ACT
            if (higherTest == "SAT") {
                if (studentSAT >= collegeSAT) {
                    satactPoints = 20;
                }
                else if (studentSAT <= 0.7 * collegeSAT) {
                    satactPoints = 0;
                }
                else {
                    satactPoints = 0.2 * ((100 / (0.3 * collegeSAT)) * studentSAT - (700 / 3));
                }
            }
            else {
                if (studentACT >= collegeACT) {
                    satactPoints = 20;
                }
                else if (studentACT <= 0.7 * collegeACT) {
                    satactPoints = 0;
                }
                else {
                    satactPoints = 0.2 * ((100 / (0.3 * collegeACT)) * studentACT - (700 / 3));
                }
            }
            let overallScore = Math.round(rankingPoints + popularityPoints + gpaPoints + satactPoints);
            return overallScore;
        }

        getSAT();
    },
    //Calculate similarity score
    calculateHSSimilarScore: (highschool1, highschool2, callback) => {
        const gpaQuery = 'SELECT hsavggpa FROM highschools WHERE hsname = $1';
        const nicheGradeQuery = 'SELECT hsnichegrade FROM highschools WHERE hsname = $1';
        const satQuery = 'SELECT hsavgsat FROM highschools WHERE hsname = $1';
        let gpa1, gpa2, niche1, niche2, sat1, sat2;
        let gpaPoints, nichePoints, satPoints;

        const getGPA = function () {
            collegeDB.query(gpaQuery, [highschool1], (err, results) => {
                if (err) {
                    callback(err);
                }
                else {
                    gpa1 = results.rows[0].hsavggpa;
                    collegeDB.query(gpaQuery, [highschool2], (err, results) => {
                        if (err) {
                            callback(err);
                        }
                        else {
                            gpa2 = results.rows[0].hsavggpa;
                            getNicheGrade();
                        }
                    });
                }
            });
        }
        const getNicheGrade = function () {
            collegeDB.query(nicheGradeQuery, [highschool1], (err, results) => {
                if (err) {
                    callback(err);
                }
                else {
                    niche1 = results.rows[0].hsnichegrade;
                    collegeDB.query(nicheGradeQuery, [highschool2], (err, results) => {
                        if (err) {
                            callback(err);
                        }
                        else {
                            niche2 = results.rows[0].hsnichegrade;
                            getSAT();
                        }
                    });
                }
            });
        }
        const getSAT = function () {
            collegeDB.query(satQuery, [highschool1], (err, results) => {
                if (err) {
                    callback(err);
                }
                else {
                    sat1 = results.rows[0].hsavgsat;
                    collegeDB.query(satQuery, [highschool2], (err, results) => {
                        if (err) {
                            callback(err);
                        }
                        else {
                            sat2 = results.rows[0].hsavgsat;
                            // Calculate points
                            let score = calculateSimHSScore();
                            callback(null, score);
                        }
                    });
                }
            });
        }
        function calculateSimHSScore() {
            gpaPoints = (1 - (Math.abs(gpa1 - gpa2)) / 4.0) * 20;
            let nicheGrades = { "A+": 11, "A": 10, "A-": 9, "B+": 8, "B": 7, "B-": 6, "C+": 5, "C": 4, "C-": 3, "D+": 2, "D": 1, "D-": 0 }
            nichePoints = (1 - (Math.abs(nicheGrades[niche1] - nicheGrades[niche2])) / 11) * 30;
            satPoints = (1 - (Math.abs(sat1 - sat2)) / 1600) * 50;
            let overallScore = Math.round(gpaPoints + nichePoints + satPoints);
            return overallScore;
        }

        getGPA();
    },
    // Applications tracker
    applicationsTracker: (isList, isStrict, collegename, lowcollegeclass, highcollegeclass, highschools, appstatuses, callback) => {
        let appTrackerQuery = 'SELECT * FROM studentdata WHERE 1=1';
        
    },
    //Delete profiles (admin)
    deleteProfiles: (callback) => {
        const deleteProfilesQuery = 'DELETE FROM studentdata';
        const deleteAccountsQuery = 'DELETE FROM users';
        const deleteApplicationsQuery = 'DELETE FROM applications';
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
                        userDB.query(deleteApplicationsQuery, (err) => {
                            if (err) {
                                callback(err);
                            }
                            else {
                                callback(null);
                            }
                        });
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

    //Import college rankings, on conflict, replace ranking
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

    importCollegeData: (collegename, graduationrate, costOfAttendanceInState, costOfAttendanceOutOfState, majors, satMathAvg, satEBRWAvg, actAvg, gpa, callback) => {
        let importCollegeDataQuery = 'UPDATE colleges SET completionrate=$2, costofattendanceinstate = $3, costofattendanceoutofstate = $4, majors = $5, satmath = $6, satebrw = $7, actcomposite=$8, gpa=$9 WHERE collegename = $1';
        collegeDB.query(importCollegeDataQuery, [collegename, graduationrate, costOfAttendanceInState, costOfAttendanceOutOfState, majors, satMathAvg, satEBRWAvg, actAvg, gpa], (err) => {
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
    },
    getAllApplications: (username, callback) => {
        const getAllAppsQuery = 'SELECT * FROM applications WHERE username = $1';
        userDB.query(getAllAppsQuery, [username], (err, results) => {
            if (err) {
                callback(err);
            }
            else {
                callback(null, results.rows);
            }
        });
    },
    getAllQuestionableDecisions: (callback) => {
        let getAllQuestionableDecisionsQuery = 'SELECT * FROM applications WHERE questionable = TRUE';
        userDB.query(getAllQuestionableDecisionsQuery, (err, results) => {
            if (err) {
                callback(err);
            }
            else {
                callback(null, results.rows);
            }
        });
    },
    //Validate decisions
    validateDecision: (applicationid, callback) => {
        let validateDecisionQuery = `UPDATE applications SET questionable = FALSE WHERE applicationid = $1`;
        userDB.query(validateDecisionQuery, [applicationid], (err, results) => {
            if (err) {
                callback(err);
            }
            else {
                callback(null, results.rows);
            }
        });
    },
    importCollegeScorecard: (collegename, institutionType, medianDebt, admissionRate, state, region, size, callback) => {
        let importCollegeScorecardQuery = 'UPDATE colleges SET institutiontype=$2, mediandebt = $3, admissionrate = $4, state = $5, region = $6, size = $7 WHERE collegename = $1';
        collegeDB.query(importCollegeScorecardQuery, [collegename, institutionType, medianDebt, admissionRate, state, region, size], (err) => {
            if (err) {
                console.log(err);
                callback(err);
            }
            else {
                callback(null);
            }
        })
    },
    checkHighSchoolExists: (highschool, callback) => {
        let checkHSexistsQuery = 'SELECT * FROM highschools WHERE hsname = $1';
        collegeDB.query(checkHSexistsQuery, [highschool], (err, results) => {
            if (err) {
                console.log(err);
                callback(err);
            }
            else {
                callback(null, results.rows);
            }
        })
    },
    addHighSchool: (highschoolname, highschoolcity, highschoolstate, highschoolgrade, highschoolsat, highschoolgradrate, highschoolact, callback) => {
        let addHighSchoolQuery = 'INSERT INTO highschools (hsname,hscity,hsstate,hsnichegrade,hsavgsat,gradrate,avgact) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING';
        collegeDB.query(addHighSchoolQuery, [highschoolname, highschoolcity, highschoolstate, highschoolgrade, highschoolsat, highschoolgradrate, highschoolact], (err, results) => {
            if (err) {
                console.log(err);
                callback(err);
            }
            else {
                callback(null);
            }
        })
    },
    // Get all high schools
    getAllHighSchools: (callback) => {
        let getAllHSQuery = 'SELECT * FROM highschools';
        collegeDB.query(getAllHSQuery, (err, results) => {
            if (err) {
                console.log(err);
                callback(err);
            }
            else {
                callback(null, results.rows);
            }
        });
    },
    // Get all high schools minus param
    getAllHighSchoolsExcept: (highschool, callback) => {
        let getAllHSQuery = 'SELECT * FROM highschools WHERE hsname!= $1';
        collegeDB.query(getAllHSQuery, [highschool], (err, results) => {
            if (err) {
                console.log(err);
                callback(err);
            }
            else {
                callback(null, results.rows);
            }
        });
    },

    // Calculate HS avg GPA
    recalculateHSGPA: (highschoolname, callback) => {
        if (highschoolname == null) {
            callback(null)
        }
        let getHSGPAQuery = 'SELECT AVG(gpa) FROM studentdata WHERE highschoolname = $1';
        let importHSGPAQuery = 'UPDATE highschools SET hsavggpa = $1 WHERE hsname = $2';

        userDB.query(getHSGPAQuery, [highschoolname], (err, results) => {
            if (err) {
                callback(err);
            }
            else {
                collegeDB.query(importHSGPAQuery, [results.rows[0].avg, highschoolname], (err, results) => {
                    if (err) {
                        callback(err);
                    }
                    else {
                        callback(null, results);
                    }
                });
            }
        });

    },

    // Get all high schools minus param
    getCollegeApplications: (college, startCollegeClassRange, endCollegeClassRange, highschools, statuses, callback) => {
        let getCollegeAppsQuery = 'SELECT * FROM applications WHERE hsname!= $1';
        userDB.query(getCollegeAppsQuery, [], (err, results) => {
            if (err) {
                console.log(err);
                callback(err);
            }
            else {
                callback(null, results.rows);
            }
        });
    },
}
