/*
 * Image Uploader
 *
 * Copyright (c) 2014 Nathan Martin
 * Licensed under the MIT license.
 */

'use strict';

var express = require('express'),
    AWS     = require('aws-sdk'),
    fs      = require('fs'),
    path    = require('path');

var app = express();
var port = Number(process.env.PORT || 5000);

app.use(express.static('app'));
app.use(express.bodyParser());

app.get('/', function(request, response){
    response.sendfile('./app/views/index.html');
});

app.get('/images', function(request, response) {

    fs.readdir('./images/', function(error, files) {
        if(error) {
            response.send(500, error);
        }

        response.json({images: files});
    });
});

app.get('/images/:name', function(request, response) {

    var filename = request.params.name;

    response.sendfile('./images/' + filename, function(error) {
        response.send(404, 'Sorry, we could not find that image!');
    });
});

app.post('/upload', function(request, response) {

    var image = request.files.image;

    if (typeof image === 'undefined' || typeof image.size === 'undefined' || !(image.size)) {
        return response.send(400, "Image not found.");
    }

    var random   = (Math.floor(Math.random()*100) + 100).toString(),
        fileExt  = path.extname(image.path).toLowerCase(),
        fileName = random + new Date().getTime() + fileExt;

    fs.rename(image.path, './images/' + fileName, function(error) {
        if (error) {
            return response.send(500, error);
        }

        if (request.body.noRedirect) {
            return response.send(201, "Upload Successful.");
        }

        return response.redirect('/');
    });
});

var server = app.listen(port, function() {
    console.log('Listening on port %d', server.address().port);
});
