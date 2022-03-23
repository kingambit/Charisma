
var express = require('express'),
    path = require('path'),
    fs = require('fs'),
    formidable = require('formidable'),
    readChunk = require('read-chunk'),
    fileType = require('file-type'),
    http = require('http');

const utf8 = require('utf8');

var multer = require('multer');
var app = express();
 
var crypto = require('crypto');
var expressMongoDb = require('express-mongo-db');


const { nextTick } = require('process');
const { raw } = require('express');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(expressMongoDb('mongodb://localhost/Charisma'));

var mDb = require('mongodb');

// var publicDir = require('path').join(__dirname,'/public');
app.use(express.static(__dirname + '/public'));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));


console.log("Running in :"  + process.env.NODE_ENV);


app.get('/', function(req, res) {
    //res.send('Hello Express');
    res.sendFile(path.join(__dirname + '/index0.html'));
    //res.render();
});

// Upload files 
app.post('/upload_files', function (req, res) {

    console.log(req.body);

    var ffiles = [],
        form = new formidable.IncomingForm();

    form.multiples = true;
    form.uploadDir = path.join(__dirname, 'tmp_uploads');

    //userid = req.query.userid;
    //datatype = req.query.datatype;

    form.on('file', function (name, file) {        

        console.log("name ", name);
        console.log("file ", file.name);

	    var filename = '';
        const buffer = readChunk.sync(file.path, 0, 262);
        //console.log("file path [",file.path,"]");
        //console.log("buffer [",buffer,"]");
        ftype = fileType(buffer);
        var fileExt;
        // Check the file type as it must be either png,jpg or jpeg
        if ( (ftype !== null && (ftype.ext === 'xml' || ftype.ext === 'csv' || ftype.ext === 'dzt' || ftype.ext === 'txt' )) ||
             (ftype == null && (file.type == 'text/xml' || file.type == 'text/csv' || file.type == 'text/plain' || file.type == 'application/octet-stream') ) ) {
            fileExt = file.name.split('.').pop();
        }
        if ( fileExt != "" ) {
            filename = Date.now() + '-' + file.name;
            var sfile_name = path.join(__dirname, 'uploads/' + filename);
            fs.renameSync(file.path, sfile_name);
        
            var ll = ffiles.push({
                status: 1,
                header: (name == "file_h" ? 1 : 0),
                filename: file.name,
                type: fileExt,
                size: file.size,
                publicPath: sfile_name
            });

         } else {
            ffiles.push({ 
                status: 0,
                filename: file.name,
                message: 'Invalid file type'
            });
            fs.unlinkSync(file.path);
        }
    }); 
    form.on('error', function(err) {
        console.log('Error occurred during processing - ' + err);
    });
    form.on('end', function() {
        console.log('All the request fields have been processed.');
    });
    //form.on('field', function(name, field) {
        //console.log('Got a field:', field);
        //console.log('Got a field name:', name);
        
        
    //});
    form.parse(req, function (err, fields, files) {
          
        ll = ffiles.length;
        // post data as string

        postObj = { fields, ffiles };
        //postObj.ffiles[0]['objId'] = "6666";

        postData = utf8.encode(JSON.stringify(postObj));

        console.log(postData);

        const options = { 
            hostname: 'localhost',
            port: 8081,
            path: '/upload',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': postData.length
            }
        }
        
        const req_http = http.request(options, (res) => {
            res.setEncoding('utf8');
            let data = '';
        
            console.log('Status Code:', res.statusCode);
        
            res.on('data', (chunk) => {
                data += chunk;
            });
        
            res.on('end', () => {
                console.log("Return ", data);
                var retObj = JSON.parse(data);
                console.log('Result Body: ', data);
                ffiles[0].objId = retObj.objId;
            });
        
        }).on("error", (err) => {
            console.log("Error: ", err.message);
            ffiles[0].status = 0;
        });
        req_http.write(postData);
        req_http.end();

        var ll = ffiles.length;
        res.status(200).json(ffiles);
    });
});

//app.post("/uploadFile", upload.single("myFile"), (req, res, next) => { // myFile should be the same value as used in HTML name attribute of input
    //const file = req.file; // We get the file in req.file
    //const fname = path.join(__dirname + '/uploads/' + file.originalname);
    //const username = req.body.username;
    //const userid = req.body.userid;
 
    //console.log("uploadFile " + fname);
    //if (!file) { // in case we do not get a file we return
    //  const error = new Error("Please upload a file");
    //  error.httpStatusCode = 400;
    //  return next(error);
    //}
    //const multerText = Buffer.from(file.buffer).toString("utf-8"); // this reads and converts the contents of the text file into string

    //const result = { // the final object which will hold the content of the file under fileText key.
    //  fileText: multerText,
    //};

    //res.send(result);
//});

app.get('/OpenTab', function(req, res) {
    const tabname = req.query.tabname;
    const fname = __dirname + '/' + tabname + '.html';
    console.log("openTab " + tabname);

    fs.access(fname, fs.F_OK, (err) => {
        if (err) {
            //console.error(err)
            res.send('<body><h2>Opening Tab ' + tabname + '</h2></body>');
        } else {
            //file exists
            res.sendFile(path.join(fname));
        }
    });
});

app.get('/Register', function(req, res, next) {
    var username = req.query.username;
    var password = req.query.password;
    var email = req.query.email;
    if ( ! username ) { 
        username = email;
    }
    if ( ! username ) {
        // No username/password specified
        console.log("No Username/Email specified");
        //next("No Username/Email specified");
        return;
    }
    // check same email address
    var Users = req.db.collection("Users");
    Users.findOne({username: username }, function(err, result) {
        if (err) next(err);
        if ( result ) {
            // username already exist error message
            var User = new Object();
            User.err_code = 401;
            User.err_message = "Username " + username + " is already taken";
            res.json(User);
        } else {
            Users.findOne({email: email }, function(err, result) {
                if (err) next(err);
                if ( result ) {
                    // username already exist error message
                    var User = new Object();
                    User.err_code = 401;
                    User.err_message = "Email " + email + " is already taken";
                    res.json(User);
                } else {
                     // encrypt the username/password
                    var salt = crypto.randomBytes(128).toString('base64');
                    var iterations = 512; //10000;
                    var derivedKey = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512');
                    var hash = derivedKey.toString('hex');
                    // create a document
                    Users.insertOne( {username : username, salt : salt, iterations : iterations, hash : hash, email: email, type : "tester"}, function(err, ret) {
                        if (err) next(err);
                        console.log("User account added");
                        var User = new Object();
                        User.username = username;
                        User.userid = ret.insertedId;
                        User.email = email;
                        User.type = "tester";
                        res.json(User);         // return the document
                    });
                }
            });
        }
    });
 });

function matchResultPassword(password, result, res) {
    //var savedHash = pbkdf2(password, result.salt, result.iterations);
    var savedHash = crypto.pbkdf2Sync(password, result.salt, result.iterations, 64, 'sha512');
    var hstring = savedHash.toString('hex');
    if ( hstring == result.hash ) {
        // login successful
        var User = new Object();
        User.username = result.username;
        User.userid = result._id;
        User.email = result.email;
        User.type = result.type;
        res.json(User);         // return the document
    } else {
        var User = new Object();
        User.err_code = 401;
        User.err_message = "User name/password does not match.";
        res.json(User);

        //var err = new Error("Username/password does not match.");
        //err.status = 400;
        //return next(err);
    }
};

app.get('/Login', function(req, res, next) {
    var username = req.query.username;
    var password = req.query.password;
    if ( ! username || ! password ) {
        //var err = new Error("Email & password are required.");
        //err.status = 400;
        var User = new Object();
        User.err_code = 400;
        User.err_message = "User name & password are required.";
        //return next("Email & password are required.");
        res.json(User);
        //res.status(500).send("No Username specified") ;
        //next("No Username specified");
    } else {
        var dbUsers = req.db.collection("Users");
        dbUsers.findOne({"username": username }, function(err, result) {
            if (err)  {
                next(err);
            } else if ( ! result ) {
                // username not found, lets find email
                dbUsers.findOne({"email": username }, function(err, result) {
                    if (err)  {
                        next(err);
                    } else if ( ! result ) {
                        var User = new Object();
                        User.err_code = 401;
                        User.err_message = "User name/email are not found.";
                        //return next("Email & password are required.");
                        res.json(User);
                    } else {
                        matchResultPassword(password, result, res);
                    }
                });
                //var err = new Error("A profile does not exist with the email used.");
                //err.status = 401;
                // This seems to be where the 'next' method is not defined...
                //return next(err);
            } else {
                matchResultPassword(password, result, res);
            }
        });
    }
});

app.get('/CheckUser', function(req, res, next) {
    var sessionId = req.query.userid;
    if ( ! sessionId ) {
        //var err = new Error("Email & password are required.");
        //err.status = 400;
        var User = new Object();
        User.err_code = 401;
        User.err_message = "User account does not exist.";
        //return next("Email & password are required.");
        res.json(User);
        //res.status(500).send("No Username specified") ;
        //next("No Username specifi
    } else {
        var dbUsers = req.db.collection("Users");
        var oid = mDb.ObjectId(sessionId);
        dbUsers.findOne({"_id": oid }, function(err, result) {
            if (err)  {
                next(err);
            } else if ( ! result ) {
                var User = new Object();
                User.err_code = 401;
                User.err_message = "User account does not exist.";
                //return next("Email & password are required.");
                res.json(User);

                //var err = new Error("A profile does not exist with the email used.");
                //err.status = 401;
                // This seems to be where the 'next' method is not defined...
                //return next(err);
            } else {
                // login successful
                var User = new Object();
                User.username = result.username;
                User.userid = result._id;
                User.email = result.email;
                User.type = result.type;
                res.json(User);         // return the document
            }
        });
    }
});

app.get('/DeleteUser', function(req, res, next) {
    var sessionId = req.query.userid;
    if ( ! sessionId ) {
        //var err = new Error("Email & password are required.");
        //err.status = 400;
        var User = new Object();
        User.err_code = 401;
        User.err_message = "User account does not exist.";
        //return next("Email & password are required.");
        res.json(User);
        //res.status(500).send("No Username specified") ;
        //next("No Username specifi
    } else {
        var dbUsers = req.db.collection("Users");
        var oid = mDb.ObjectId(sessionId);
        dbUsers.deleteOne({"_id": oid }, function(err, result) {
            if (err)  {
                next(err);
            } else if ( ! result ) {
                var User = new Object();
                User.err_code = 401;
                User.err_message = "User account does not exist.";
                //return next("Email & password are required.");
                res.json(User);

                //var err = new Error("A profile does not exist with the email used.");
                //err.status = 401;
                // This seems to be where the 'next' method is not defined...
                //return next(err);
            } else if ( result.deletedCount > 0 ) {
                res.send(true);         // return the OK sign
            } else {

            }
        });
    }
});

app.listen(3000, function() {
    console.log("Server is running at 3000 port!");
});
//# sourceURL=charisma.js
