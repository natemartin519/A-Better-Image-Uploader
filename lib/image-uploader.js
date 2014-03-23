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

// Needed for dev
fs.exists('./config.json', function(exists) {
    if (exists) {
        AWS.config.loadFromPath('./config.json');
    }
});

var app = express();
var port = Number(process.env.PORT || 8000);

app.use(express.static('app'));
app.use(express.bodyParser());

app.get('/', function(request, response) {
    response.sendfile('./app/views/index.html');
});

app.get('/info', function(request, response) {
    response.send(200);
});

app.get('/images', function(request, response) {

    var s3 = new AWS.S3();
    s3.listObjects({ Bucket: 'Nate-Images' }, function(error, data) {
        if (error) {
            return response.send(500, 'An error occurred!');
        }

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

app.post('/upload', function(request, response) {

    var image = request.files.image;

    if (typeof image === 'undefined' || typeof image.size === 'undefined' || !(image.size)) {
        return response.send(400, 'Image not found.');
    }

    var random   = (Math.floor(Math.random()*100) + 100).toString(),
        fileExt  = path.extname(image.path).toLowerCase(),
        fileName = random + new Date().getTime() + fileExt;

    fs.readFile(image.path, function(error, data) {
        if (error) {
            response.send(500, error);
        }

        var fileBuffer = new Buffer(data, 'binary');

        var s3 = new AWS.S3();
        var params = {
            Bucket: 'Nate-Images',
            Key: fileName,
            Body: fileBuffer
        };

        s3.putObject(params, function(error, data) {
            if (error) {
                response.send(500, error);
            }

            response.send(201, 'Upload Successful');
        });
    });




});

var server = app.listen(port, function() {
    console.log('Listening on port %d', server.address().port);
});
