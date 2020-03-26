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
var cors = require('cors');

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

app.get('/profile', function (req, res) {
    let username = req.body.username;
    db.getProfile(username, (err, result) => {
        if (err) {
            console.log(err);
            res.status(500).send({
                error: 'no user exists'
            });
        }
        else {
            res.status(200).send(result);
        }
    });
});

app.post('/editprofile', function (req, res) {
    let username = req.body.username;
    db.getProfile(username, (err, result) => {
        if (err) {
            console.log(err);
            res.status(500).send({
                error: 'no user exists'
            });
        }
        else {
            result.residencestate = req.body.residenceState;
            result.highschoolname = req.body.highSchoolName;
            result.highschoolcity = req.body.highSchoolCity;
            result.highschoolstate = req.body.highSchoolState;
            result.gpa = req.body.GPA;
            result.collegeclass = req.body.collegeClass;
            result.satebrw = req.body.satEBRW;
            result.satmath = req.body.satMath;
            result.major1 = req.body.major1;
            result.major2 = req.body.major2;
            result.actenglish = req.body.actEnglish;
            result.actmath = req.body.actMath;
            result.actreading = req.body.actReading;
            result.actscience = req.body.actScience;
            result.actcomposite = req.body.actComposite;
            result.satliterature = req.body.satLiterature;
            result.satushistory = req.body.satUSHistory;
            result.satworldhistory = req.body.satWorldHistory;
            result.satmath1 = req.body.satMath1;
            result.satmath2 = req.body.satMath2;
            result.satecobio = req.body.satEcoBio;
            result.satmolbio = req.body.satMolBio;
            result.satchem = req.body.satChem;
            result.satphysics = req.body.satPhysics;
            result.numpassedaps = req.body.numPassedAPs;
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

