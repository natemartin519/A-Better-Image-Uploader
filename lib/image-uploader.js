/*
 * Image Uploader
 *
 * Copyright (c) 2014 Nathan Martin
 * Licensed under the MIT license.
 */

'use strict';

var express  = require('express'),
    passport = require('passport'),
    AWS      = require('aws-sdk'),
    fs       = require('fs'),
    path     = require('path');

var TwitterStrategy  = require('passport-twitter').Strategy,
    GoogleStrategy   = require('passport-google-oauth').OAuthStrategy,
    FacebookStrategy = require('passport-facebook').Strategy;

var app = express();


// Needed for dev
fs.exists('./config.json', function(exists) {
    if (exists) {
        AWS.config.loadFromPath('./config.json');
    }
});


// Configure App
app.configure(function() {
    app.use(express.static('app'));
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({ secret: "aso65iefucn45lmc" }));
    app.use(passport.initialize());
    app.use(passport.session());
});

var twitterConfig  = {
    consumerKey: "PcGPRA1OZ7Z9BQF1mIivw",
    consumerSecret: "EOMY2n6o6mvoxp3UYABm0VZwW6oGiir8zvZzlvL2A",
    callbackURL: "/auth/twitter/callback"
};

var googleConfig   = {

};

var facebookConfig = {

};


// Twitter Auth
passport.use(new TwitterStrategy(twitterConfig, function(token, tokenSecret, profile, done) {
    return done(null, profile);
}));

app.get('/auth/twitter',
        passport.authenticate('twitter')
);

app.get('/auth/twitter/callback',
        passport.authenticate('twitter',
            { successRedirect: '/', failureRedirect: '/login' }
        )
);


// App auth
app.get('/login', function(request, response) {
    response.sendfile('./app/views/login.html'); // Placeholder
});

app.get('/logout', function(request, response){
    request.logout();
    response.redirect('/');
});

app.get('/user', isAuthenticated, function(request, response) {
    response.send(request.user);
});


// App main
app.get('/', isAuthenticated, function(request, response) {
    response.sendfile('./app/views/index.html');
});

app.get('/images', function(request, response) {

    var s3 = new AWS.S3();
    s3.listObjects({ Bucket: 'Nate-Images' }, function(error, data) {
        if (error) {
            return response.send(500, 'An error occurred!');
        }


        // TODO: use javascript map or reduce

        var imageList = { images: [] };

        for (var index in data.Contents) {
            imageList.images.push(data.Contents[index].Key);
        }

        response.json(imageList);
    });
});

app.get('/images/:name', function(request, response) {

    var s3 = new AWS.S3();
    var params = {
        Bucket: 'Nate-Images',
        Key: request.params.name
    };

    s3.getObject(params)
        .createReadStream()
        .pipe(response);
});

app.delete('/images/:name', isAuthenticated, function(request, response) {

    var s3 = new AWS.S3();
    var params = {
        Bucket: 'Nate-Images',
        Key: request.params.name
    };

    s3.deleteObject(params, function(error, data) {
        if (error) {
            return response.send(500, "Image not found.")
        }

        response.send(201, "Image Deleted.");
    });
});

app.post('/upload', isAuthenticated, function(request, response) {

    var image = request.files.image;

    if (typeof image === 'undefined' || typeof image.size === 'undefined' || !(image.size)) {
        return response.send(400, 'Image not uploaded.');
    }

    var random     = (Math.floor(Math.random()*100) + 100).toString(),
        fileExt    = path.extname(image.path).toLowerCase(),
        fileName   = random + new Date().getTime() + fileExt,
        fileStream = new fs.createReadStream(image.path),
        s3         = new AWS.S3();

    var params = {
        Bucket: 'Nate-Images',
        Key: fileName,
        Body: fileStream,
        ContentType: image.type
    };

    s3.putObject(params, function(error, data) {
        if (error) {
            return response.send(500, error);
        }

        response.send(201, 'Upload Successful');
    });
});


// Start server
var port = Number(process.env.PORT || 8000);
var server = app.listen(port, function() {
    console.log('Listening on port %d', server.address().port);
});


// Helpers
passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(object, done) {
    done(null, object);
});

function isAuthenticated(request, response, next) {
    if (request.isAuthenticated()) {
        return next();
    }

    response.send(401, 'Unauthorised request.');
}
