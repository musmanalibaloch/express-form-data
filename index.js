const functions = require('firebase-functions');
const express = require("express");
const app = express();
const admin = require("firebase-admin");
const cors = require("cors"); 
const uuidv4 = require('uuid/v4'); //to give unique name to each file
//allow cross origin access
app.use(cors(
    {
        'allowedHeaders': ['sessionId', 'Content-Type'],
        'exposedHeaders': ['sessionId'],
        'origin': '*',
        'methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
        'preflightContinue': false
      }
));
const {
    Storage
} = require('@google-cloud/storage');
var service = require("service.json"); // path to service.json file obtained from firebase server for firebase admin access
const {
    fileParser
} = require('express-multipart-file-parser');  //
app.use(fileParser({
    rawBodyOptions: {
        limit: '15mb',  //file size limit
    },
    busboyOptions: {
        limits: {
            fields: 20   //Number text fields allowed 
        }
    },
}))


admin.initializeApp({
    credential: admin.credential.cert(service), //service.json
    databaseURL:""                             //DATABASE_URL
});

const bucket = storage.bucket("bucket url"); //BUCKET_URL from firebase console
app.post('/v1/createPost', (req, res) => {
    const {
        fieldname,
        originalname,
        encoding,
        mimetype,
        buffer,
    } = req.files[0]
    if (req.files[0]) {
        uploadImageToStorage(req.files[0]).then((success) => {
                 //req.file[0]   access file at 0 index
                 //req.body.username text field with name 'username' is accessible like this
            })
            .catch(err=>{
                res.send({status: false,
                    data: "Post failed to add"});
            })
        }else {
    res.send('image not provided');
    }
})

/**
 * Upload the image file to Google Storage
 * @param {File} file object that will be uploaded to Google Storage
 */
const uploadImageToStorage = (file) => {
    let prom = new Promise((resolve, reject) => {
        if (!file) {
            reject('No image file');
        }
        let newFileName = uuidv4() + file.originalname; //uqiue name

        let fileUpload = bucket.file(newFileName);
        const blobStream = fileUpload.createWriteStream({
            metadata: {
                contentType: file.mimetype
            }
        });

        blobStream.on('error', (error) => {
            reject('Something is wrong! Unable to upload at the moment.');
        });

        blobStream.on('finish', () => {
            const url = `https://storage.googleapis.com/${bucket.name}/${fileUpload.name}`; //image url from firebase server
            resolve(url);

        });

        blobStream.end(file.buffer);
    });
    return prom;
}

exports.api = functions.https.onRequest(app);