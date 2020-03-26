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
})

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

app.post('/editprofile', function (req, res) {
    let username = req.body.username;
    let residenceState;
    if (req.body.residenceState) {
        residenceState = req.body.residenceState;
    }
    let highSchoolName;
    if (req.body.highSchoolName) {
        highSchoolName = req.body.highSchoolName;
    } 
    let highSchoolCity;
    if (req.body.highSchoolCity) {
        highSchoolCity = req.body.highSchoolCity;
    }
    let highSchoolState;
    if (req.body.highSchoolState) {
        highSchoolState = req.body.highSchoolState;
    }     
    let GPA = req.body.GPA;
    if (req.body.GPA) {
        GPA = req.body.GPA;
    }
    let collegeClass;
    if (req.body.collegeClass) {
        collegeClass = req.body.collegeClass;
    }
    let satEBRW;
    if (req.body.satEBRW) {
        satEBRW = req.body.satEBRW;
    }
    let satMath;
    if (req.body.satMath) {
        satMath = req.body.satMath;
    }
    let major1;
    if (req.body.major1) {
        major1 = req.body.major1;
    }
    let major2;
    if (req.body.major2) {
        major2 = req.body.major2;
    }
    let actEnglish;
    if (req.body.actEnglish) {
        actEnglish = req.body.actEnglish;
    }
    let actMath;
    if (req.body.actMath) {
        actMath = req.body.actMath;
    }
    let actReading;
    if (req.body.actReading) {
        actReading = req.body.actReading;
    }
    let actScience;
    if (req.body.actScience) {
        actScience = req.body.actScience;
    }
    let actComposite;
    if (req.body.actComposite) {
        actComposite = req.body.actComposite;
    }
    let satLiterature;
    if (req.body.satLiterature) {
        satLiterature = req.body.satLiterature;
    }
    let satUSHistory;
    if (req.body.satUSHistory) {
        satUSHistory = req.body.satUSHistory;
    }
    let satWorldHistory;
    if (req.body.satWorldHistory) {
        satWorldHistory = req.body.satWorldHistory;
    }
    let satMath1;
    if (req.body.satMath1) {
        satMath1 = req.body.satMath1;
    }
    let satMath2;
    if (req.body.satMath2) {
        satMath2 = req.body.satMath2;
    }
    let satEcoBio;
    if (req.body.satEcoBio) {
        satEcoBio = req.body.satEcoBio;
    }
    let satMolBio;
    if (req.body.satMolBio) {
        satMolBio = req.body.satMolBio;
    }
    let satChem;
    if (req.body.satChem) {
        satChem = req.body.satChem;
    }
    let satPhysics;
    if (req.body.satPhysics) {
        satPhysics = req.body.satPhysics;
    }
    let numPassedAPs;
    if (req.body.numPassedAPs) {
        numPassedAPs = req.body.numPassedAPs;
    }
    db.editProfile(username, residenceState, highSchoolName, highSchoolCity, highSchoolState, GPA, collegeClass, 
        major1, major2, satEBRW, satMath, actEnglish, actMath, actReading, actScience, actComposite, 
        satLiterature, satUSHistory, satWorldHistory, satMath1, satMath2, satEcoBio, satMolBio, 
        satChem, satPhysics, numPassedAPs, (err, result) => {
        if (err) {
            res.status(500).send({
                status: "error",
                error: 'err'
            });
        }
        else {
            res.status(500).send({
                status: "error",
                error: "Cannot edit profile"
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

