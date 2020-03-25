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

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

const userDB = new Pool({
    user: config.userDBusername,
    host: config.userDBhost,
    database: config.userDBdatabase,
    password: config.userDBpassword,
    port: config.userDBport,
    ssl: true
})
console.log(config.userDBusername);

app.use(session({
    key: 'user_sid',
    secret: 'secretstuff',
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

app.get('/', sessionChecker, function (req, res) {
    res.sendFile(__dirname + "/public/" + "index.html");
})

app.post('/posttest', function (req, res) {
    res.status(200).send({
        status: "post response"
    });
})

app.get('/gettest', function (req, res) {
    res.status(200).send({
        status: "get response"
    });
})

//API

app.post('/register', function (req, res) {
    let username = req.body.username;
    let password = req.body.password;
    console.log(`username is ${username}`);
    console.log(`password is ${password}`);
    bcrypt.hash(password, 10, function (err, hash) {
        console.log(`pw hash is ${hash}`);
        userDB.query('INSERT INTO users(userid,password) VALUES($1, $2)', [username, hash], (error, results) => {
            if (error) {
                console.log(error);
                res.status(500).send();
            }
            res.status(200).send();
          })

    });
})

app.post('/login', function (req, res) {
    let username = req.body.username;
    let password = req.body.password;

    res.status(200).send({
        status: "post response"
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

