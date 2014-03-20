/*
 * Image Uploader
 *
 * Copyright (c) 2014 Nathan Martin
 * Licensed under the MIT license.
 */

'use strict';

var express = require('express'),
    fs      = require('fs');

var app = express();

app.use(express.bodyParser());

app.get('/', function(request, response){
    response.sendfile('./app/views/index.html');
});

app.get('/images', function(request, response) {

    fs.readdir('./images/', function(error, files) {
        if(error) {
            response.send(500, error + "\n");
        }

        response.json({images: files});
    });

});

app.get('/images/:name', function(request, response) {

    var filename = request.params.name;

    response.sendfile('./images/' + filename, function (error) {
        response.send(404, 'Sorry, we could not find that image!');
    });
});

app.post('/upload', function(request, response) {

    var image = request.files.image;

    fs.rename(image.path, './images/' + image.originalFilename, function(error) {
        if (error) {
            console.log(error);
            fs.unlink('./images/' + image.originalFilename);
            fs.rename(image.path, './images/' + image.originalFilename);
        }

        response.redirect('/images');
    });

});

var server = app.listen(8000, function() {
    console.log('Listening on port %d', server.address().port);
});
