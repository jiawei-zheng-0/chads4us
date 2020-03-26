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
                res.status(500).send();
            }
            else {
                console.log(`New user ${username} registered`);
                res.status(200).send();
            }
        });
    });
})

//LOGIN
app.post('/login', function (req, res) {
    let username = req.body.username;
    let password = req.body.password;
    db.login(username, (err, hashedPW) => {
        if (err) {
            console.log('Username does not exist');
            res.status(500).send();
        }
        else {
            bcrypt.compare(password, hashedPW, (err, result) => {
                if (result) {
                    res.status(200).send();
                } else {
                    console.log('Wrong password');
                    res.status(500).send();
                }
            });
        }
    });
})

app.post('/editprofile', function (req, res) {
    let username = req.body.username;
    let password;
    if (req.body.password) {
        password = req.body.password;
    }
    let GPA = req.body.GPA;
    if (req.body.GPA) {
        GPA = req.body.GPA;
    }
    let SATMath;
    if (req.body.SATMath) {
        SATMath = req.body.SATMath;
    }
    let SATEBRW;
    if (req.body.SATEBRW) {
        SATEBRW = req.body.SATEBRW;
    }
    let highSchool;
    if (req.body.HighSchool) {
        HighSchool = req.body.HighSchool;
    }
    let state;
    if (req.body.State) {
        state = req.body.State;
    }
    let collegeClass;
    if (req.body.CollegeClass) {
        collegeClass = req.body.CollegeClass;
    }
    let major1;
    if (req.body.Major1) {
        major1 = req.body.Major1;
    }
    let major2;
    if (req.body.Major2) {
        major2 = req.body.Major2;
    }
    let ACTComp;
    if (req.body.SATEBRW) {
        ACTComp = req.body.ACTComposite;
    }
    let ACTMath;
    if (req.body.ACTMath) {
        ACTMath = req.body.ACTMath;
    }
    let ACTReading;
    if (req.body.ACTReading) {
        ACTReading = req.body.ACTReading;
    }
    let ACTScience;
    if (req.body.ACTScience) {
        ACTScience = req.body.ACTScience;
    }
    let ACTEnglish;
    if (req.body.ACTEnglish) {
        ACTEnglish = req.body.ACTEnglish;
    }
    let ACTWriting;
    if (req.body.ACTWriting) {
        ACTWriting = req.body.ACTWriting;
    }
    let SATLiterature;
    if (req.body.SATLiterature) {
        SATLiterature = req.body.SATLiterature;
    }
    let SATUSHistory;
    if (req.body.SATUSHistory) {
        SATUSHistory = req.body.SATUSHistory;
    }
    let SATWorldHistory;
    if (req.body.SATWorldHistory) {
        SATWorldHistory = req.body.SATWorldHistory;
    }
    let SATMath1;
    if (req.body.SATMath1) {
        SATMath1 = req.body.SATMath1;
    }
    let SATMath2;
    if (req.body.SATMath2) {
        SATMath2 = req.body.SATMath2;
    }
    let SATEcoBio;
    if (req.body.SATEcoBio) {
        SATEcoBio = req.body.SATEcoBio;
    }
    let SATMolBio;
    if (req.body.SATMolBio) {
        SATMolBio = req.body.SATMolBio;
    }
    let SATChemistry;
    if (req.body.SATChemistry) {
        SATChemistry = req.body.SATChemistry;
    }
    let SATPhysics;
    if (req.body.SATPhysics) {
        SATPhysics = req.body.SATPhysics;
    }
    let NumOfPassedAPS;
    if (req.body.NumOfPassedAPS) {
        NumOfPassedAPS = req.body.NumOfPassedAPS;
    }
    db.editprofile(username, password, (err, result) => {
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

