const express = require('express');
const fs = require("fs");
const app = express();
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const urlencodedParser = bodyParser.urlencoded({ extended: true })
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const { Pool, Client } = require('pg')
const config = require('./config.json');
const db = require('./db.js');
const cors = require('cors');
const csv = require('fast-csv');
const axios = require('axios');


app.use(cors());
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
/*
app.use(session({
    key: 'chads4me_session',
    secret: 'chads',
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: 600000
    }
}));
app.use((req, res, next) => {
    if (req.cookies.user_sid && !req.session.user) {
        res.clearCookie('user_sid');
    }
    next();
});
//if user is already logged in
let sessionChecker = (req, res, next) => {
    if (req.session.user && req.cookies.user_sid) {
        res.redirect('/public/index.html');
    } else {
        next();
    }
};

app.get('/', sessionChecker, (req, res) => {
    res.sendFile(__dirname + "/public/" + "index.html");
})
*/
app.post('/posttest', (req, res) => {
    res.status(200).send({
        status: "post response"
    });
})

app.get('/gettest', (req, res) => {
    res.status(200).send({
        status: "get response"
    });
})

function number(val) {
    if (val == '')
        return null
    else
        return Number(val)
}
function detectNull(val) {
    if (val == '')
        return null
    else
        return (val)
}
//API

//REGISTER
app.post('/register', (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    bcrypt.hash(password, 10, (err, hash) => {
        db.register(username, hash, (err, result) => {
            if (err) {
                console.log('Username already exists');
                res.status(500).send({
                    error: "Username already exists"
                });
            }
            else {
                console.log(`New user ${username} registered`);
                res.status(200).send();
            }
        });
    });
});

//LOGIN
app.post('/login', function (req, res) {
    let username = req.body.username;
    let password = req.body.password;
    db.login(username, (err, hashedPW) => {
        if (err) {
            console.log('Username does not exist');
            res.status(500).send({
                error: "Username does not exist"
            });

        }
        else {
            bcrypt.compare(password, hashedPW, (err, result) => {
                if (result) {
                    res.status(200).send();
                } else {
                    console.log('Wrong password');
                    res.status(500).send({
                        error: "Wrong password"
                    });
                }
            });
        }
    });
})

//GET STUDENT PROFILE
app.get('/profile/:username', function (req, res) {
    //let username = req.body.username;
    let username = req.params.username;
    db.getProfile(username, (err, result) => {
        if (err) {
            console.log(err);
            res.status(500).send({
                error: err
            });
        }
        else {
            res.status(200).send(result);
        }
    });
});

//EDIT PROFILE
app.post('/editprofile/:username', function (req, res) {
    let username = req.params.username;
    db.getProfile(username, (err, result) => {
        if (err) {
            console.log(err);
            res.status(500).send({
                error: 'no user exists'
            });
        }
        else {
            console.log(result);
            Object.keys(result).forEach((key) => {
                result[key] = req.body[key];
            });
            console.log(result);
            db.editProfile(username, result.residencestate, result.highschoolname, result.highschoolcity, result.highschoolstate, result.gpa, result.collegeclass,
                result.major1, result.major2, result.satebrw, result.satmath, result.actenglish, result.actmath, result.actreading, result.actscience, result.actcomposite,
                result.satliterature, result.satushistory, result.satworldhistory, result.satmath1, result.satmath2, result.satecobio, result.satmolbio,
                result.satchem, result.satphysics, result.numpassedaps, (err, result) => {
                    if (err) {
                        console.log('error in editing profile');
                        console.log(err);
                        res.status(500).send({
                            error: 'error in editing profile'
                        });
                    }
                    else {
                        console.log(`User ${username} profile updated`);
                        res.status(200).send();
                    }
                });
        }
    });
})

//DELETE ALL STUDENT PROFILES
app.post('/deleteprofiles', function (req, res) {
    db.deleteProfiles((err, result) => {
        if (err) {
            res.status(500).send({
                error: 'Error in deleting profiles'
            });
        }
        else {
            res.status(200).send(result);
        }
    });
});

// @TODO import from admin uplaoded file
app.post('/importprofiles', (req, res) => {
    fs.readFile(config.studentProfileCSV, 'utf-8', (err, data) => {//change to input csv
        if (err) { throw err };

        var newValue = data.replace(/\ *,\ */gim, ',');//removes spaces next to commas in csv

        fs.writeFile('formattedCSV.csv', newValue, 'utf-8', function (err) {
            if (err) { throw err };
            let profiles = []
            fs.createReadStream(path.resolve(__dirname, 'formattedCSV.csv'))
                .pipe(csv.parse({ headers: true }))
                .on('error', error => console.error(error))
                .on('data', row => {
                    profiles.push(row);
                })
                .on('end', rowCount => {
                    //rename csv columns to database columns
                    profiles.forEach(profile => {
                        profile.username = profile.userid
                        delete profile.userid
                        profile.residencestate = detectNull(profile.residence_state)
                        delete profile.residence_state
                        profile.highschoolname = detectNull(profile.high_school_name)
                        delete profile.high_school_name
                        profile.highschoolcity = detectNull(profile.high_school_city)
                        delete profile.high_school_city
                        profile.highschoolstate = detectNull(profile.high_school_state)
                        delete profile.high_school_state
                        profile.gpa = number(profile.GPA)
                        delete profile.GPA
                        profile.collegeclass = number(profile.college_class)
                        delete profile.college_class
                        profile.major1 = detectNull(profile.major_1)
                        delete profile.major_1
                        profile.major2 = detectNull(profile.major_2)
                        delete profile.major_2
                        profile.satmath = number(profile.SAT_math)
                        delete profile.SAT_math
                        profile.satebrw = number(profile.SAT_EBRW)
                        delete profile.SAT_EBRW
                        profile.actenglish = number(profile.ACT_English)
                        delete profile.ACT_English
                        profile.actmath = number(profile.ACT_math)
                        delete profile.ACT_math
                        profile.actreading = number(profile.ACT_reading)
                        delete profile.ACT_reading
                        profile.actscience = number(profile.ACT_science)
                        delete profile.ACT_science
                        profile.actcomposite = number(profile.ACT_composite)
                        delete profile.ACT_composite
                        profile.satliterature = number(profile.SAT_literature)
                        delete profile.SAT_literature
                        profile.satushistory = number(profile.SAT_US_hist)
                        delete profile.SAT_US_hist
                        profile.satworldhistory = number(profile.SAT_world_hist)
                        delete profile.SAT_world_hist
                        profile.satmath1 = number(profile.SAT_math_I)
                        delete profile.SAT_math_I
                        profile.satmath2 = number(profile.SAT_math_II)
                        delete profile.SAT_math_II
                        profile.satecobio = number(profile.SAT_eco_bio)
                        delete profile.SAT_eco_bio
                        profile.satmolbio = number(profile.SAT_mol_bio)
                        delete profile.SAT_mol_bio
                        profile.satchem = number(profile.SAT_chemistry)
                        delete profile.SAT_chemistry
                        profile.satphysics = number(profile.SAT_physics)
                        delete profile.SAT_physics
                        profile.numpassedaps = number(profile.num_AP_passed)
                        delete profile.num_AP_passed

                    });
                    console.log(profiles)

                    let counter = 0;
                    profiles.forEach(profile => {
                        bcrypt.hash(profile.password, 10, (err, hash) => {
                            profile.password = hash;
                            db.register(profile.username, hash, (err, result) => {
                                if (err) {
                                    console.log('Username already exists');
                                }
                                else {
                                    console.log(`New user ${profile.username} registered`);
                                    db.editProfile(profile.username, profile.residencestate, profile.highschoolname, profile.highschoolcity, profile.highschoolstate, profile.gpa, profile.collegeclass,
                                        profile.major1, profile.major2, profile.satebrw, profile.satmath, profile.actenglish, profile.actmath, profile.actreading, profile.actscience, profile.actcomposite,
                                        profile.satliterature, profile.satushistory, profile.satworldhistory, profile.satmath1, profile.satmath2, profile.satecobio, profile.satmolbio,
                                        profile.satchem, profile.satphysics, profile.numpassedaps, (err, result) => {
                                            if (err) {
                                                console.log('error in editing profile');
                                                console.error(err);
                                            }
                                            else {
                                                console.log(`User ${profile.username} profile updated`);
                                                counter++;
                                            }
                                        });
                                }
                            });

                        })

                    });
                    let timeoutCounter = 0;
                    let intervalID = setInterval(() => {
                        if (counter >= profiles.length) {
                            clearInterval(intervalID);
                            res.status(200).send();
                        }
                        timeoutCounter++;
                        if (timeoutCounter >= profiles.length) {//if func takes more than row # of seconds, timeout
                            clearInterval(intervalID);
                            res.status(500).send();
                        }
                    }, 1000);
                });
        });
    });
});

app.post('/deleteprofiles', function (req, res) {

}
/*
app.post('/login', function (req, res) {
	res.status(500).send({
                status: "LOGIN ERROR",
                error: 'err'
            });
	/*
    var username = req.body.username;
    var password = req.body.password;
    console.log(req.body);
    console.log('login request: username:' + username + password);
    db.login(username, password, (err, result) => {
        if (err) {
            res.status(500).send({
                status: "error",
                error: 'err'
            });
        }
        else if (result == 1) {
            req.session.loggedin = true;
            req.session.username = username;
            res.status(200).send({
                status: "OK"
            });
        }
        else {
            res.status(500).send({
                status: "error",
                error: "WRONG LOGIN"
            });
        }
    });
	
})
*/
const PORT = process.env.PORT || 5000
var server = app.listen(PORT, () => console.log(`Listening on ${PORT}`));

