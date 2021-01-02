var express = require('express');
const multer = require('multer');
const helpers = require('./helper');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var AWS = require("aws-sdk");

var app = express();
//AWS.config.loadFromPath("./aws_config.json");
const rekognition = new AWS.Rekognition();


const storage = multer.memoryStorage();
const urlRegexExp = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s][^)]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s][^)]{2,}|www\.[a-zA-Z0-9]+\.[^\s][^)]{2,})/gi;
const regex = new RegExp(urlRegexExp);

app.post('/', (req, res) => {
    let upload = multer({ storage: storage, fileFilter: helpers.imageFilter }).single('takePictureField');

    upload(req, res, function (err) {

        var params = {
            Image: {
                Bytes: req.file.buffer
            }
        };

        rekognition.detectText(params, function (err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else {
                console.log(data);
                for (var i = 0; i < data.TextDetections.length; i++) {
                    var matches = data.TextDetections[i].DetectedText.match(regex)
                    if (matches) {
                        var url = matches[0];
                        if (!url.startsWith("https") && !url.startsWith("http"))
                            url = "http://" + url;
                        return res.status(301).redirect(url);
                    }
                }
                res.redirect("/?message=No result found! Please try again.");
            };
        });

        if (req.fileValidationError) {
            return res.send(req.fileValidationError);
        }
        else if (!req.file) {
            return res.send('Please select an image to upload');
        }
        else if (err instanceof multer.MulterError) {
            return res.send(err);
        }
        else if (err) {
            return res.send(err);
        }
    });
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

module.exports = app;
