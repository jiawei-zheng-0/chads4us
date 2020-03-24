var express = require('express');
var fs = require("fs");
var app = express();
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');
var urlencodedParser = bodyParser.urlencoded({ extended: true })

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', function (req, res) {
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
var server = app.listen(PORT, () => console.log(`Listening on ${ PORT }`));

