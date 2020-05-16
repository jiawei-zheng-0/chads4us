const express = require('express');
const fs = require('fs');
const app = express();
// const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
// const urlencodedParser = bodyParser.urlencoded({ extended: true })
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
// const { Pool, Client } = require('pg')
const config = require('../data/config.json');
const db = require('./db.js');
const cors = require('cors');
const csv = require('fast-csv');
const csvParser = require('csv-parser');
const axios = require('axios');

app.use(cors());
app.use(express.static(path.join(__dirname, '../public')));
//app.get('*', function (request, response) {
//    response.sendFile(path.resolve(__dirname, '../public', 'index.html'))
//})
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

let collegeList = fs.readFileSync(config.collegeFile).toString().split(/\r?\n/);
collegeList = collegeList.filter(function (removeEmpty) {
    return removeEmpty != '';
});
db.importColleges(collegeList, (err) => {
    if (err) {
        console.log('Error importing all colleges');
    }
    else {
        console.log('All colleges imported');
    }
});
console.log(collegeList);

let highSchoolList = fs.readFileSync(config.highSchoolFile).toString().split(/\r?\n/);
collegeList = collegeList.filter(function (removeEmpty) {
    return removeEmpty != '';
});

function number(val) {
    if (val == '') { return null; }
    else { return Number(val); }
}
function detectNull(val) {
    if (val == '') { return null; }
    else { return (val); }
}
// API

// REGISTER
app.post('/register', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    bcrypt.hash(password, 10, (err, hash) => {
        db.register(username, hash, (err) => {
            if (err) {
                console.log('Username already exists');
                res.status(500).send({
                    error: 'Username already exists',
                });
            }
            else {
                console.log(`New user ${username} registered`);
                res.status(200).send();
            }
        });
    });
});

// LOGIN
app.post('/login', function (req, res) {
    const username = req.body.username;
    const password = req.body.password;
    if (username === config.adminUsername) {
        bcrypt.compare(password, config.adminPW, (err, result) => {
            if (result) {
                res.status(200).send({
                    isAdmin: true
                });
            } else {
                console.log('Wrong password');
                res.status(500).send({
                    error: 'Wrong password',
                });
            }
        });
    }
    else {
        db.login(username, (err, hashedPW) => {
            if (err) {
                console.log('Username does not exist');
                res.status(500).send({
                    error: 'Username does not exist',
                });

            }
            else {
                bcrypt.compare(password, hashedPW, (err, result) => {
                    if (result) {
                        res.status(200).send({
                            isAdmin: false
                        });
                    } else {
                        console.log('Wrong password');
                        res.status(500).send({
                            error: 'Wrong password',
                        });
                    }
                });
            }
        });
    }
});

// GET STUDENT PROFILE
app.get('/profile/:username', function (req, res) {
    // let username = req.body.username;
    const username = req.params.username;
    db.getProfile(username, (err, result) => {
        if (err) {
            console.log(err);
            res.status(500).send({
                error: err,
            });
        }
        else {
            res.status(200).send(result);
        }
    });
});

//Given a high school name, converts it to proper format, checks if in highschools.txt, scrapes data from niche, inserts into db
function importHighSchool(highschoolname, highschoolcity, highschoolstate, callback) {
    if (highschoolname == null) {
        callback(null);
        return;
    }
    const hsname = `${highschoolname.replace(/ /g, '-')}-${highschoolcity.replace(/ /g, '-')}-${highschoolstate}`.toLowerCase();
    console.log(hsname);
    if (!highSchoolList.includes(hsname)) {//if high school does not exist
        console.log(`high school does not exist ${hsname}`);
        callback(`high school does not exist ${highschoolname}`);
    } else {//if high school does exist in hs.txt
        db.checkHighSchoolExists(highschoolname, (err, result) => {//check if hs data already in db
            if (err) {
                //console.log(err)
                res.status(500).send({
                    error: 'error in checking if hs exists in db',
                });
            }
            else {
                if (result.length == 0) {//if high school is not in db, scrape from niche
                    axios.get(`${config.highSchoolSite}${hsname}`)
                        .then((hspage) => {
                            axios.get(`${config.highSchoolSite}${hsname}`)
                                .then((academicspg) => {
                                    //console.log(response.data);
                                    //Get niche score
                                    const grade = hspage.data.match(/\w[+-]?(?=<\/div>Overall Grade<\/span>)/gim)[0];
                                    //console.log(grade);
                                    const avgSAT = Number(academicspg.data.match(/(?<=Average SAT composite score out of 1600, as reported by Niche users from this school\.<\/div><\/div><\/div><div class="scalar__value">)\d+/gim));
                                    //console.log(avgSAT);
                                    const avgACT = Number(academicspg.data.match(/(?<=Average ACT composite score out of 36, as reported by Niche users from this school\.<\/div><\/div><\/div><div class="scalar__value">)\d+/gim));
                                    //console.log(avgACT);
                                    const graduationRate = Number(academicspg.data.match(/(?<=graduation rates differently, use caution when comparing this data to data from another state\.<\/div><\/div><\/div><div class="scalar__value"><span>)\d+(?=%)/gim));
                                    //console.log(graduationRate);
                                    db.addHighSchool(highschoolname, highschoolcity, highschoolstate, grade, avgSAT, graduationRate, avgACT, (err, result) => {
                                        if (err) {
                                            callback(`error in adding hs ${highschoolname} to db`);
                                        }
                                        else {
                                            console.log(`${highschoolname} added to db`);
                                            callback(null);
                                        }
                                    });

                                })
                                .catch(function (error) {
                                    console.error(error);
                                    callback(`high school page does not exist ${highschoolname}`);
                                });
                        })
                        .catch(function (error) {
                            console.error(error);
                            callback(`high school page does not exist ${highschoolname}`);
                        });

                }
                else {//if hs is already in db no need to scrape
                    callback(null);
                }
            }
        });
    }
}

// EDIT PROFILE
app.post('/editprofile/:username', function (req, res) {
    const username = req.params.username;
    // if password in body, password is getting changed
    const password = req.body.password;

    db.getProfile(username, (err, result) => {
        if (err) {
            console.log(err);
            res.status(500).send({
                error: 'no user exists',
            });
        }
        else {
            console.log(result);
            const originalHS = result.highschoolname;
            const newHS = req.body.highschoolname;
            const oldGPA = result.gpa;
            // Replaces old profile values with new values
            Object.keys(result).forEach((key) => {
                result[key] = req.body[key];
            });
            console.log(result);
            // edit profile
            let highschoolstate = req.body.residencestate;
            if (!config.Northeast.includes(highschoolstate) && !config.Midwest.includes(highschoolstate) && !config.South.includes(highschoolstate) && !config.West.includes(highschoolstate)) {//if invalid state
                res.status(500).send({
                    error: 'Invalid state',
                });
            }
            else {
                db.editProfile(username, result.residencestate, result.highschoolname, result.highschoolcity, result.highschoolstate, result.gpa, result.collegeclass,
                    result.major1, result.major2, result.satebrw, result.satmath, result.actenglish, result.actmath, result.actreading, result.actscience, result.actcomposite,
                    result.satliterature, result.satushistory, result.satworldhistory, result.satmath1, result.satmath2, result.satecobio, result.satmolbio,
                    result.satchem, result.satphysics, result.numpassedaps, (err) => {
                        if (err) {
                            console.log('error in editing profile');
                            console.log(err);
                            res.status(500).send({
                                error: 'error in editing profile',
                            });
                        }
                        else {
                            console.log(`User ${username} profile updated`);
                            //If user's gpa changed, update avg gpa of high school
                            //console.log(`${result.gpa} = ${ req.body.gpa}`)
                            if (oldGPA != req.body.gpa) {
                                db.recalculateHSGPA(result.highschoolname, (err, result) => {
                                    if (err) {
                                        console.log('error in caluclating HS GPA');
                                        res.status(500).send({
                                            error: 'error in importing hs',
                                        });
                                    }
                                });
                            }
                            //If new HS, do import new HS func
                            if (newHS != originalHS) {
                                importHighSchool(req.body.highschoolname, req.body.highschoolcity, req.body.highschoolstate, (err, result) => {
                                    if (err) {
                                        console.log('error in importing hs');
                                        res.status(500).send({
                                            error: 'error in importing hs',
                                        });
                                    }
                                    else {
                                        console.log(`${newHS} imported`);
                                        //Now update GPAs of old and new HS
                                        db.recalculateHSGPA(newHS, (err, result) => {
                                            if (err) {
                                                console.log('error in caluclating HS GPA');
                                                res.status(500).send({
                                                    error: 'error in caluclating HS GPA',
                                                });
                                            }
                                            else {
                                                console.log(`${newHS} GPA reacalulated`);
                                                db.recalculateHSGPA(originalHS, (err, result) => {
                                                    if (err) {
                                                        console.log('error in caluclating HS GPA');
                                                        res.status(500).send({
                                                            error: 'error in caluclating HS GPA',
                                                        });
                                                    }
                                                    else {
                                                        console.log(`${originalHS} GPA recalulated`);
                                                        if (password) {//if password needs to be changed
                                                            bcrypt.hash(password, 10, (err, hash) => {
                                                                db.changePassword(username, hash, (err) => {
                                                                    if (err) {
                                                                        console.log(`error in changing password for ${username}`);
                                                                        res.status(500).send({
                                                                            error: 'error in changing password',
                                                                        });
                                                                    }
                                                                    else {
                                                                        console.log(`User ${username} password changed`);
                                                                        res.status(200).send();
                                                                    }
                                                                });
                                                            });
                                                        }
                                                        else {//if password unmodified
                                                            res.status(200).send();
                                                        }
                                                    }
                                                });
                                            }
                                        });
                                    }

                                });
                            }

                            else if (password) {//if hs is same and password needs to be changed
                                bcrypt.hash(password, 10, (err, hash) => {
                                    db.changePassword(username, hash, (err) => {
                                        if (err) {
                                            console.log(`error in changing password for ${username}`);
                                            res.status(500).send({
                                                error: 'error in changing password',
                                            });
                                        }
                                        else {
                                            console.log(`User ${username} password changed`);
                                            res.status(200).send();
                                        }
                                    });
                                });
                            }
                            else {//if password unmodified
                                res.status(200).send();
                            }

                        }
                    });
            }
        }
    });
});

// EDIT APPLICATIONS
app.post('/editapplication/:username', function (req, res) {
    const username = req.params.username;
    // edit applications
    if (!collegeList.includes(req.body.collegename)) {
        res.status(500).send({
            error: 'Invalid College',
        });
    }
    else {
        db.editApplications(username, req.body.collegename, req.body.status, (err, result) => {
            if (err) {
                console.log(err);
                res.status(500).send({
                    error: 'Error in editing applications',
                });
            }
            else {
                res.status(200).send({
                    questionable: result
                });
            }
        });
    }
});

// Search for colleges
app.post('/searchcolleges', function (req, res) {
    db.getState(req.body.username, (err, result) => {
        db.searchColleges(req.body.isStrict, req.body.collegename, req.body.lowadmissionrate, req.body.highadmissionrate,
            result, req.body.costofattendance, req.body.location, req.body.isRegion, req.body.major1, req.body.major2, req.body.lowranking,
            req.body.highranking, req.body.lowsize, req.body.highsize, req.body.lowsatmath, req.body.highsatmath,
            req.body.lowsatebrw, req.body.highsatebrw, req.body.lowactcomposite, req.body.highactcomposite, (err, result) => {
                if (err) {
                    console.log(err);
                    res.status(500).send({
                        error: 'Error in searching for colleges',
                    });
                }
                else {
                    res.status(200).send(result.rows);
                }
            });
    });
});

// College Recommendation Score
app.post('/collegerecommender/:username', function (req, res) {
    let counter = 0;
    let collegeScores = {}
    collegeList.forEach(college => {
        db.collegeRecommender(req.params.username, college, (err, result) => {
            if (err) {
                console.log(err);
                res.status(500).send({
                    error: `Error in calculating college recommendation score for ${college}`,
                });
            }
            else {
                //console.log(collegeScores)
                counter++;
                collegeScores[college] = result;
            }
        });
    });

    let timeoutCounter = 0;
    const intervalID = setInterval(() => {
        if (counter >= collegeList.length) {
            clearInterval(intervalID);
            res.status(200).send(collegeScores);
        }
        timeoutCounter++;
        if (timeoutCounter >= collegeList.length) {// if func takes long time, timeouut
            clearInterval(intervalID);
            res.status(500).send({
                error: 'Error in calculating college scores',
            });
        }
    }, 1000);

});
// Find similar high schools
app.post('/findsimilarhs', function (req, res) {
    db.highSchoolExists(req.body.highschool, (err, result) => {
        if (err || !result) {
            res.status(500).send({
                error: 'High school does not exist',
            });
        }
        else {
            db.getAllHighSchoolsExcept(req.body.highschool, (err, result) => {
                if (err) {
                    console.log(err);
                    res.status(500).send({
                        error: 'Error in finding similar high schools',
                    });
                }
                else {
                    let highSchools = result
                    let counter = 0;
                    result.forEach(highschool => {
                        //console.log(`calculateing score between ${req.body.highschool} and ${highschool.hsname}`)
                        db.calculateHSSimilarScore(req.body.highschool, highschool.hsname, (err, result) => {
                            if (err) {
                                console.log(err);
                                res.status(500).send({
                                    error: 'Error in finding similar high schools',
                                });
                            }
                            else {
                                let index = highSchools.indexOf(highschool);
                                highSchools[index].score = result;
                                counter++;
                            }
                        });
                    });
                    let timeoutCounter = 0;
                    const intervalID = setInterval(() => {
                        if (counter >= result.length) {
                            clearInterval(intervalID);
                            highSchools.sort((a, b) => {
                                var x = a.score; var y = b.score;
                                return ((x > y) ? -1 : ((x < y) ? 1 : 0));
                            });
                            res.status(200).send(result);
                        }
                        timeoutCounter++;
                        if (timeoutCounter >= result.length + 3) {
                            clearInterval(intervalID);
                            res.status(500).send({
                                error: 'Error in calculating similarity scores',
                            });
                        }
                    }, 1000);
                }
            });
        }
    });
});

// APPLICATIONS TRACKER
app.post('/apptracker', function (req, res) {
    if (!collegeList.includes(req.body.collegename)) {
        res.status(500).send({
            error: 'Invaild College',
        });
    }
    else {
        db.appTracker(req.body.isStrict, req.body.collegename, req.body.lowcollegeclass,
            req.body.highcollegeclass, req.body.highschools, req.body.appstatuses, (err, studentProfiles, applications) => {
                if (err) {
                    console.log(err);
                    res.status(500).send({
                        error: 'Error in processing applications tracker',
                    });
                }
                else {
                    applications.forEach(application => {
                        studentProfiles.forEach(profile => {
                            if (profile.username === application.username) {
                                profile.status = application.status;
                            }
                        });
                    });
                    res.status(200).send(studentProfiles);
                }
            });
    }
});

// DELETE ALL STUDENT PROFILES
app.post('/deleteprofiles', function (req, res) {
    db.deleteProfiles((err, result) => {
        if (err) {
            res.status(500).send({
                error: 'Error in deleting profiles',
            });
        }
        else {
            res.status(200).send(result);
        }
    });
});

// GET ALL COLLEGE DATA
app.post('/getallcolleges', function (req, res) {
    db.getAllColleges((err, result) => {
        if (err) {
            res.status(500).send({
                error: 'Error in retrieving all colleges',
            });
        }
        else {
            res.status(200).send(result);
        }
    });
});

// import profiles from file config.studentProfileCSV and config.applicationCSV
app.post('/importprofiles', (req, res) => {
    //import profiles
    function importProfiles() {
        const profiles = [];
        fs.createReadStream(config.studentProfileCSV)
            .pipe(csv.parse({ headers: true }))
            .on('error', error => console.error(error))
            .on('data', row => {
                profiles.push(row);
            })
            .on('end', () => {
                // rename csv columns to database columns
                profiles.forEach(profile => {
                    profile.username = profile.userid;
                    delete profile.userid;
                    profile.residencestate = detectNull(profile.residence_state);
                    delete profile.residence_state;
                    profile.highschoolname = detectNull(profile.high_school_name);
                    delete profile.high_school_name;
                    profile.highschoolcity = detectNull(profile.high_school_city);
                    delete profile.high_school_city;
                    profile.highschoolstate = detectNull(profile.high_school_state);
                    delete profile.high_school_state;
                    profile.gpa = number(profile.GPA);
                    delete profile.GPA;
                    profile.collegeclass = number(profile.college_class);
                    delete profile.college_class;
                    profile.major1 = detectNull(profile.major_1);
                    delete profile.major_1;
                    profile.major2 = detectNull(profile.major_2);
                    delete profile.major_2;
                    profile.satmath = number(profile.SAT_math);
                    delete profile.SAT_math;
                    profile.satebrw = number(profile.SAT_EBRW);
                    delete profile.SAT_EBRW;
                    profile.actenglish = number(profile.ACT_English);
                    delete profile.ACT_English;
                    profile.actmath = number(profile.ACT_math);
                    delete profile.ACT_math;
                    profile.actreading = number(profile.ACT_reading);
                    delete profile.ACT_reading;
                    profile.actscience = number(profile.ACT_science);
                    delete profile.ACT_science;
                    profile.actcomposite = number(profile.ACT_composite);
                    delete profile.ACT_composite;
                    profile.satliterature = number(profile.SAT_literature);
                    delete profile.SAT_literature;
                    profile.satushistory = number(profile.SAT_US_hist);
                    delete profile.SAT_US_hist;
                    profile.satworldhistory = number(profile.SAT_world_hist);
                    delete profile.SAT_world_hist;
                    profile.satmath1 = number(profile.SAT_math_I);
                    delete profile.SAT_math_I;
                    profile.satmath2 = number(profile.SAT_math_II);
                    delete profile.SAT_math_II;
                    profile.satecobio = number(profile.SAT_eco_bio);
                    delete profile.SAT_eco_bio;
                    profile.satmolbio = number(profile.SAT_mol_bio);
                    delete profile.SAT_mol_bio;
                    profile.satchem = number(profile.SAT_chemistry);
                    delete profile.SAT_chemistry;
                    profile.satphysics = number(profile.SAT_physics);
                    delete profile.SAT_physics;
                    profile.numpassedaps = number(profile.num_AP_passed);
                    delete profile.num_AP_passed;

                });
                //console.log(profiles);

                let counter = 0;
                let listOfUpdatedHighSchools = [];
                let listOfUpdatedHighSchoolCity = [];
                let listOfUpdatedHighSchoolState = [];
                profiles.forEach(profile => {
                    bcrypt.hash(profile.password, 10, (err, hash) => {
                        profile.password = hash;
                        db.importProfile(profile.username, hash, (err) => {
                            if (err) {
                                console.log('Username already exists');
                                res.status(500).send({
                                    error: `Username ${profile.username} already exists`,
                                });
                                return;
                            }
                            else {
                                console.log(`New user ${profile.username} registered`);
                                db.editProfile(profile.username, profile.residencestate, profile.highschoolname, profile.highschoolcity, profile.highschoolstate, profile.gpa, profile.collegeclass,
                                    profile.major1, profile.major2, profile.satebrw, profile.satmath, profile.actenglish, profile.actmath, profile.actreading, profile.actscience, profile.actcomposite,
                                    profile.satliterature, profile.satushistory, profile.satworldhistory, profile.satmath1, profile.satmath2, profile.satecobio, profile.satmolbio,
                                    profile.satchem, profile.satphysics, profile.numpassedaps, (err) => {
                                        if (err) {
                                            console.log('error in editing profile');
                                            console.error(err);
                                            res.status(500).send({
                                                error: `Username ${profile.username} already exists`,
                                            });
                                            return;
                                        }
                                        else {
                                            console.log(`User ${profile.username} profile updated`);
                                            if (!listOfUpdatedHighSchools.includes(profile.highschoolname)) {
                                                listOfUpdatedHighSchools.push(profile.highschoolname);
                                                listOfUpdatedHighSchoolCity.push(profile.highschoolcity);
                                                listOfUpdatedHighSchoolState.push(profile.highschoolstate);
                                            }
                                            counter++;
                                        }
                                    });
                            }
                        });

                    });

                });
                let timeoutCounter = 0;
                let started = false;
                const intervalID = setInterval(() => {
                    if (counter >= profiles.length && started === false) {
                        started = true;
                        importApplications();
                        listOfUpdatedHighSchools.forEach(highSchool => {
                            let i = listOfUpdatedHighSchools.indexOf(highSchool);
                            importHighSchool(highSchool, listOfUpdatedHighSchoolCity[i], listOfUpdatedHighSchoolState[i], (err, result) => {
                                if (err) {
                                    console.log(`error in importing hs ${highSchool}`);
                                    res.status(500).send({
                                        error: err,
                                    });
                                }
                                else {
                                    db.recalculateHSGPA(highSchool, (err, result) => {
                                        if (err) {
                                            console.log('error in recaluclating HS GPA');
                                            res.status(500).send({
                                                error: err,
                                            });
                                        }
                                        else {
                                            clearInterval(intervalID);
                                            res.status(200).send();
                                        }
                                    });
                                }
                            });
                        });
                    }
                    timeoutCounter++;
                    if (timeoutCounter >= profiles.length + 5) {// if func takes more than row # of seconds, timeout
                        clearInterval(intervalID);
                        res.status(500).send({
                            error: 'Error in importing profiles',
                        });
                    }
                }, 1000);
            });
    }

    //import applications
    function importApplications() {
        fs.createReadStream(config.applicationCSV)
            .pipe(csv.parse({ headers: true }))
            .on('error', error => console.error(error))
            .on('data', (row) => {
                //console.log(row);
                db.importApplication(row.userid, row.college, row.status, (err) => {
                    if (err) {
                        console.log('Error in importing applications');
                    }
                });
            })
            .on('end', () => {
                console.log('CSV file read finished');
                res.status(200).send();
            });
    }

    importProfiles();
});

app.post('/scraperankings', function (req, res) {
    axios.get(config.collegeRankingSite)
        .then(function (response) {
            const collegeRankings = [];
            response.data.data.forEach(college => {
                if (collegeList.includes(college.name)) {
                    if (college.rank === '401-500') {
                        college.rank = '401';
                    }
                    else if (college.rank === '501-600') {
                        college.rank = '501';
                    }
                    else if (college.rank === '\u003E 600') {
                        college.rank = '601';
                    }
                    collegeRankings.push(college.name);
                    collegeRankings.push(Number(college.rank.replace('=', '')));
                }

            });
            db.importCollegeRankings(collegeRankings, (err) => {
                if (err) {
                    res.status(500).send({
                        error: 'Error in scraping rankings',
                    });
                }
                else {
                    console.log('College Rankings updated');
                    res.status(200).send();
                }
            });
        })
        .catch(function (error) {
            console.error(error);
            res.status(500).send({
                error: 'Error in scraping rankings',
            });
        });
});

app.post('/scrapecollegedata', (req, res) => {
    const fourYearGradRate = [];
    const costOfAttendanceInState = [];
    const costOfAttendanceOutOfState = [];
    const majors = [];
    const satMathAvg = [];
    const satEBRWAvg = [];
    const actAvg = [];
    const gpa = [];
    let counter = 0;
    collegeList.forEach(college => {
        let index = collegeList.indexOf(college);
        // Replaces ' & ' and ', ' and ' ' with '-'
        if (college.includes('SUNY')) {
            college = college.replace('SUNY', 'State-University-of-New-York');
        }
        let collegeURL = college.replace(/ & |, | /gim, '-');
        // If college name starts with 'The' and not on THE list, remove 'The'
        if (college.startsWith('The ') && !config.collegesWithThe.includes(college)) {
            collegeURL = collegeURL.slice(4);
        }
        // console.log(`${config.collegeDataSite}${collegeURL}`)
        axios.get(`${config.collegeDataSite}${collegeURL}`)
            .then((response) => {
                let percent;
                const match = response.data.match(/<dt>Students Graduating Within 4 Years<\/dt>\s*<dd> *\d{1,2}\.\d{1,2}%<\/dd>/gim);
                if (match) {
                    percent = match[0].match(/\d{1,2}\.\d{1,2}/gim);
                    fourYearGradRate[index] = (Number(percent));
                }
                else {
                    fourYearGradRate[index] = null;
                }
                // Get cost of attendance
                const costMatch = response.data.match(/(<dt>Cost of Attendance<\/dt>\s*<dd>In-state: \$\d*,?\d+<BR>Out-of-state: \$\d*,?\d+<\/dd>)|(<dt>Cost of Attendance<\/dt>\s*<dd>\$\d*,?\d+<\/dd>)/gim);
                if (costMatch) {// if  match, college does report cost of attendance
                    // console.log(`${college} - ${costMatch[0]}`)
                    if (costMatch[0].includes('In-state')) {// college has seperate in state and out of state
                        costOfAttendanceInState[index] = (Number(costMatch[0].match(/\d*,?\d+<BR>/gim)[0].slice(0, -4).replace(',', '')));
                        costOfAttendanceOutOfState[index] = (Number(costMatch[0].match(/\d*,?\d+<\/dd/gim)[0].slice(0, -4).replace(',', '')));
                        // console.log(`${college} - Instate - ${costOfAttendanceInState} Outofstate - ${costOfAttendanceOutOfState}`);
                    }
                    else {// college has one single COA
                        const cost = Number(costMatch[0].match(/\d*,?\d+<\/dd/gim)[0].slice(0, -4).replace(',', ''));
                        costOfAttendanceInState[index] = cost;
                        costOfAttendanceOutOfState[index] = cost;
                        // console.log(`${college} - ${costOfAttendanceInState}`);
                    }
                }
                else {
                    costOfAttendanceInState[index] = null;
                    costOfAttendanceOutOfState[index] = null;
                    // console.log(`${college} - null`);
                }
                // Get Majors
                const majorMatch = response.data.match(/<h3 class="h5">Undergraduate Majors<\/h3>[\s\S]*?Most Popular Disciplines/gim);
                majors[index] = (majorMatch[0].match(/(?<=<li>).+(?=<\/li>)/gim));
                // console.log(majors)
                // Get test avgs
                const testScoresMatch = response.data.match(/SAT Math<\/dt>[\s\S]*<a class="upper-right-sm" data-toggle="toggletab" href="#profile-admission-tab">See more<\/a>/gim);
                // console.log(testScoresMatch)
                if (!(testScoresMatch[0].includes('Not reported'))) {// Test scores are reported
                    const satMathRange = ((testScoresMatch[0].match(/(?<=SAT Math<\/dt>)\s*<dd>\s*.+(?= range)/gim))[0].match(/\d+-\d+/gim))[0].split('-');
                    satMathAvg[index] = (Math.round((Number(satMathRange[0]) + Number(satMathRange[1])) / 2));
                    let satEBRWMatch = (testScoresMatch[0].match(/(?<=SAT EBRW<\/dt>)\s*<dd>\s*.+(?= average)/gim));// Test if EBRW is a number
                    if (satEBRWMatch) {// EBRW is a number
                        satEBRWAvg[index] = (Number(satEBRWMatch[0].match(/\d+/gim)[0]));
                    }
                    else {// EBRW is a range
                        satEBRWMatch = (testScoresMatch[0].match(/(?<=SAT EBRW<\/dt>)\s*<dd>\s*.+(?= range)/gim)[0]).match(/\d+-\d+/gim)[0].split('-');
                        satEBRWAvg[index] = (Math.round((Number(satEBRWMatch[0]) + Number(satEBRWMatch[1])) / 2));
                    }
                    let actMatch = (testScoresMatch[0].match(/(?<=ACT Composite<\/dt>)\s*<dd>.+(?= average)/gim));// Test if ACT is a number
                    if (actMatch) {// ACT is a number
                        actAvg[index] = (Number((actMatch[0]).match(/\d+/gim)));
                    }
                    else {// ACT is a range
                        actMatch = (testScoresMatch[0].match(/(?<=ACT Composite<\/dt>)\s*<dd>.+(?= range)/gim))[0].match(/\d+-\d+/gim)[0].split('-');
                        actAvg[index] = (Math.round((Number(actMatch[0]) + Number(actMatch[1])) / 2));
                    }
                }
                else {// test scores arent reported
                    //console.log(`no test scores reported for ${college}`);
                    satMathAvg[index] = (null);
                    satEBRWAvg[index] = (null);
                    actAvg[index] = (null);
                }
                const gpaMatch = response.data.match(/<dt>Average GPA<\/dt>\s*\S* ?\S*\s* ?<dt>SAT Math<\/dt>/gim);
                if (gpaMatch[0].includes('Not reported')) {//GPA not reported
                    gpa[index] = (null);
                }
                else {
                    gpa[index] = (Number(gpaMatch[0].match(/\d\.\d{2}/gim)));
                }


                // console.log(`${college} - ${satMathAvg} - ${satEBRWAvg} - ${actAvg}`)
                counter++;
            })
            .catch(function (error) {
                console.error(error);
                res.status(500).send({
                    college: `Error in scraping ${college} from collegedata.com`,
                });
                return;
            });
    });


    let timeoutCounter = 0;
    const intervalID = setInterval(() => {
        if (counter >= collegeList.length) {// if data for all colleges retrieved, store in db
            clearInterval(intervalID);
            // success in scraping all data

            collegeList.forEach(college => {
                const i = collegeList.indexOf(college);
                db.importCollegeData(college, fourYearGradRate[i], costOfAttendanceInState[i], costOfAttendanceOutOfState[i], majors[i], satMathAvg[i], satEBRWAvg[i], actAvg[i], gpa[i], (err) => {
                    if (err) {
                        console.log(err);
                        res.status(500).send({
                            error: err,
                        });
                    }
                });
            });
            console.log('collegedata.com data scraped');
            res.status(200).send();
        }
        timeoutCounter++;
        if (timeoutCounter >= collegeList.length + 2) {// if func takes long time, timeout
            clearInterval(intervalID);
            res.status(500).send({
                error: 'Error in scraping from collegeData',
            });
        }
    }, 1000);
});

//imports college scorecard
app.post('/importscorecard', (req, res) => {
    const colleges = [];
    fs.createReadStream(config.collegeScorecard1)
        .pipe(csv.parse({ headers: true }))
        .on('data', (row) => {
            if (collegeList.includes(row.INSTNM)) {//if row in scorecard is in collegelist, match
                //console.log(row.INSTNM);
                colleges.push(row);
            }
            else if (config.collegeScorecardNames.includes(row.INSTNM)) {//match with different name
                row.INSTNM = config.fixedCollegeNames[config.collegeScorecardNames.indexOf(row.INSTNM)];//change college name
                //console.log(row.INSTNM);
                colleges.push(row);
            }
        })
        .on('end', () => {
            console.log('scorecard1 read finished');

            fs.createReadStream(config.collegeScorecard2)
                .pipe(csv.parse({ headers: true }))
                .on('data', (row) => {
                    if (collegeList.includes(row.INSTNM)) {//if row in scorecard is in collegelist, match
                        //console.log(row.INSTNM);
                        colleges.push(row);
                    }
                    else if (config.collegeScorecardNames.includes(row.INSTNM)) {//match with different name
                        row.INSTNM = config.fixedCollegeNames[config.collegeScorecardNames.indexOf(row.INSTNM)];//change college name
                        //console.log(row.INSTNM);
                        colleges.push(row);
                    }
                })
                .on('end', () => {
                    console.log('scorecard2 read finished');
                    const collegeNames = [];
                    const institutionTypes = [];
                    const medianDebt = [];
                    const admissionRate = [];
                    const state = [];
                    const region = [];
                    const size = [];
                    colleges.forEach(college => {
                        collegeNames.push(college.INSTNM)
                        if (college.CONTROL === '1') {
                            institutionTypes.push('Public');
                        } else if (college.CONTROL === '2') {
                            institutionTypes.push('Private nonprofit');
                        } else if (college.CONTROL === '3') {
                            institutionTypes.push('Private for-profit');
                        }
                        if (college.GRAD_DEBT_MDN != 'NULL') {
                            medianDebt.push(college.GRAD_DEBT_MDN);
                        }
                        else {
                            medianDebt.push(null);
                        }
                        if (college.ADM_RATE != 'NULL') {
                            admissionRate.push(college.ADM_RATE);
                        }
                        else {
                            admissionRate.push(null);
                        }
                        state.push(college.STABBR);
                        if (config.Northeast.includes(college.STABBR)) {
                            region.push('Northeast')
                        } else if (config.Midwest.includes(college.STABBR)) {
                            region.push('Midwest')
                        } else if (config.South.includes(college.STABBR)) {
                            region.push('South')
                        } else if (config.West.includes(college.STABBR)) {
                            region.push('West')
                        }
                        size.push(college.UGDS);
                    });
                    //console.log(collegeNames);
                    //console.log(institutionTypes);
                    //console.log(medianDebt);
                    //console.log(admissionRate);
                    //console.log(state);
                    //console.log(region);
                    //console.log(size);


                    collegeNames.forEach(collegename => {
                        const i = collegeNames.indexOf(collegename);
                        db.importCollegeScorecard(collegename, institutionTypes[i], medianDebt[i], admissionRate[i], state[i], region[i], size[i], (err) => {
                            if (err) {
                                console.log(err);
                                res.status(500).send({
                                    error: err,
                                });
                            }
                        });
                    });
                    console.log("College Scorecard imported");
                    res.status(200).send();

                });
        });
});

// GET ALL COLLEGE DATA
app.get('/getallcolleges', function (req, res) {
    db.getAllColleges((err, result) => {
        if (err) {
            res.status(500).send({
                error: 'Error in retrieving all colleges',
            });
        }
        else {
            res.status(200).send(result);
        }
    });
});

// GET ALL APPS FOR A USER
app.get('/getallapplications/:username', function (req, res) {
    db.getAllApplications(req.params.username, (err, result) => {
        if (err) {
            res.status(500).send({
                error: 'Error in retrieving all applications',
            });
        }
        else {
            res.status(200).send(result);
        }
    });
});

// DELETE ALL COLLEGE DATA
app.delete('/deletecollegedata', function (req, res) {
    db.deleteCollegeData(collegeList, (err, result) => {
        if (err) {
            res.status(500).send({
                error: 'Error in deleting college data',
            });
        }
        else {
            res.status(200).send(result);
        }
    });
});

// GET LIST OF QUESTIONABLE APPLICATIONS
app.get('/reviewdecisions', function (req, res) {
    db.getAllQuestionableDecisions((err, result) => {
        if (err) {
            res.status(500).send({
                error: 'Error in retrieving questionable decisions',
            });
        }
        else {
            res.status(200).send(result);
        }
    });
});

app.post('/validatedecision', function (req, res) {
    let collegename = req.body.collegename;
    let username = req.body.username;
    db.validateDecision(collegename, username, (err, result) => {
        if (err) {
            res.status(500).send({
                error: 'Error in validating questionable acceptance decision'
            });
        }
        else {
            res.status(200).send(result);
        }
    });
});

// Get applications to college
app.get('/getapplications', function (req, res) {
    const college = req.body.college;
    const startCollegeClassRange = req.body.startCollegeClassRange;
    const endCollegeClassRange = req.body.endCollegeClassRange;
    const highschools = req.body.highschools;
    const statuses = req.body.statuses;
    if (collegeList.includes(college)) {
        db.getCollegeApplications(college, startCollegeClassRange, endCollegeClassRange, highschools, statuses, (err, result) => {
            if (err) {
                res.status(500).send({
                    error: `Error in retrieving applications for ${college}`
                });
            }
            else {
                res.status(200).send(result);
            }
        });
    }
    else {
        res.status(500).send({
            error: 'College does not exist'
        });
    }
});

app.get('/getallhs', function (req, res) {
    let hs = [];
    db.getAllHighSchools((err, result) => {
        if (err) {
            res.status(500).send({
                error: `Error in retrieving all high schools`
            });
        }
        else {
            result.forEach(highSchool => {
                hs.push(highSchool.hsname);
            });
            res.status(200).send(hs);
        }
    });
});

app.get('/getfive', function (req, res) {
    db.getAppProfiles((err, result) => {
        if (err) {
            res.status(500).send({
                error: `Error in retrieving profiles`
            });
        }
        else {
            res.status(200).send(result.rows);
        }
    })
});

app.get('/getallcollegenames', function (req, res) {
    res.status(200).send(collegeList);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));

