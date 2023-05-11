// canvas library provides full canvas (load/draw/write) functionality for nodejs
// must be installed manually as it just a demo dependency and not actual face-api dependency
const canvas = require('canvas'); // eslint-disable-line node/no-missing-require
const fs = require('fs');
const path = require('path');
const process = require('process');
const log = require('@vladmandic/pilogger');
const tf = require('@tensorflow/tfjs-node'); // in nodejs environments tfjs-node is required to be loaded before face-api
//const faceapi = require('../dist/face-api.node.js'); // use this when using face-api in dev mode
 const faceapi = require('@vladmandic/face-api'); // use this when face-api is installed as module (majority of use cases)

 const AWS = require('aws-sdk');
 const express = require('express');
 const mongoose = require('mongoose');
 const fileUpload = require('express-fileupload');
 
 const https = require('http');


 const port=process.env.PORT||3200;
 mongoose.connect("mongodb+srv://robfernandez06929:Admin123@appalcaldia.fcs8nin.mongodb.net/?retryWrites=true&w=majority").
 then(()=>console.log("Conectado a MongoDB"));

 //const upload = multer({ dest:'../images/'});
 const app=express();

 app.use(fileUpload());
app.use(express.json());
app.use(express.urlencoded({extended:false}));

AWS.config.update({
  
});

var s3 = new AWS.S3();

const userSchema = require("../src/models/user");

app.post('/api/setUser',(req,res)=>{
  //const {_ci} = req.params;
//  userSchema.findOne({ci:_ci})
  const user=userSchema(req.body);
  user.save()
  .then((data=>res.json(data)))
  .catch((error)=>console.log(error));

  //res.send("api funcionando").status(200);
  console.log("end point SET USER successfull")
})

app.get('/api/getUser/:_ci',(req,res)=>{
  const {_ci} = req.params;
  userSchema.findOne({ci:_ci})
  .then((data=>res.json(data)))
  .catch((error)=>console.log(error));

  //res.send("api funcionando").status(200);
  console.log("end point GET USER successfull")
})

app.post('/api/verification-login', (req,res)=>{
  
  const { file } = req.files;
  const {ci} = req.body;
  let path_image_reference;
  let path_image_test;
  if (!file) return res.sendStatus(400);
  path_image_test="image_test.jpg";
  file.mv("./images/"+path_image_test);
  
  userSchema.findOne({ci:ci})
  .then(((data)=>{
    path_image_reference="image_reference.jpg";
    var params = {
      Bucket: "ex-software1",
      Key: data.url_img
    };
    var file = fs.createWriteStream("./images/"+path_image_reference);
    file.on('close', function(){
        console.log('done'); 
        main('./images/'+path_image_reference, './images/'+path_image_test).then((data)=>{
          console.log(data);
          if (data>0.5) {
            
            res.send("no coincidencia").status(400);
          }else{
            res.send("coincidencia").status(200);
          }
        });
        
    });
    s3.getObject(params).createReadStream().on('error', function(err){
        console.log(err);
    }).pipe(file);  
    console.log(file.path);    

    //res.sendStatus(200);
  
  }))
  .catch((error)=>console.log(error));
 
});

app.post('/api/verification-registro', (req,res)=>{
  
  const { file } = req.files;
  const {name} = req.body;
  let path_image_reference;
  let path_image_test;
  if (!file) return res.sendStatus(400);
  path_image_test="image_test.jpg";
  file.mv("./images/"+path_image_test);

  https.get('http://localhost:8000/api/actions/get-user/'+name, response => {
  let data =[];
  response.on('data', chunk => {
    data.push(chunk);
    console.log("on Response")
    
  });

  response.on('end', () => {
    data=JSON.parse(Buffer.concat(data).toString());;
    console.log("data re"+data);
    path_image_reference="image_reference.jpg";
    var params = {
      Bucket: "ex-software1",
      Key: data["url_foto"]
    };
    var file = fs.createWriteStream("./images/"+path_image_reference);
    file.on('close', function(){
        console.log('done'); 
        main('./images/'+path_image_reference, './images/'+path_image_test).then((data)=>{
          console.log(data);
          if (data>0.5) {
            
            res.send("no coincidencia").status(400);
          }else{
            res.send("coincidencia").status(200);
          }
        });
        
    });
    s3.getObject(params).createReadStream().on('error', function(err){
        console.log(err);
    }).pipe(file);  
    console.log(file.path);    


    console.log("request end")
  });
  }).on('error', err => {
    console.log('Error: ', err.message);
  });


    //res.sendStatus(200);
  
 
 
});

const getDescriptors = async (imageFile) => {
  const buffer = fs.readFileSync(imageFile);
  const tensor = tf.node.decodeImage(buffer, 3);
  const faces = await faceapi.detectAllFaces(tensor, optionsSSDMobileNet)
    .withFaceLandmarks()
    .withFaceDescriptors();
  tf.dispose(tensor);
  return faces.map((face) => face.descriptor);
};

const main = async (file1, file2) => {
  console.log('input images:', file1, file2); // eslint-disable-line no-console
  await tf.ready();
  await faceapi.nets.ssdMobilenetv1.loadFromDisk('model');
  optionsSSDMobileNet = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5, maxResults: 1 });
  await faceapi.nets.faceLandmark68Net.loadFromDisk('model');
  await faceapi.nets.faceRecognitionNet.loadFromDisk('model');
  const desc1 = await getDescriptors(file1);
  const desc2 = await getDescriptors(file2);
  const distance = faceapi.euclideanDistance(desc1[0], desc2[0]); // solo compara la primera cara que se registra en cada imagen
  console.log('distance between most prominant detected faces:', distance); 
  console.log('similarity between most prominant detected faces:', 1 - distance);
  return distance;
};

app.listen(port,()=>console.log(`server is running in port ${port}`));




/*const modelPathRoot = './model';
const imgPathRoot = './images'; // modify to include your sample images
const minConfidence = 0.15;
const maxResults = 5;
let optionsSSDMobileNet;

const getDescriptors = async (imageFile) => {
  const buffer = fs.readFileSync(imageFile);
  const tensor = tf.node.decodeImage(buffer, 3);
  const faces = await faceapi.detectAllFaces(tensor, optionsSSDMobileNet)
    .withFaceLandmarks()
    .withFaceDescriptors();
  tf.dispose(tensor);
  return faces.map((face) => face.descriptor);
};

const main = async (file1, file2) => {
  console.log('input images:', file1, file2); // eslint-disable-line no-console
  await tf.ready();
  await faceapi.nets.ssdMobilenetv1.loadFromDisk('model');
  optionsSSDMobileNet = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5, maxResults: 1 });
  await faceapi.nets.faceLandmark68Net.loadFromDisk('model');
  await faceapi.nets.faceRecognitionNet.loadFromDisk('model');
  const desc1 = await getDescriptors(file1);
  const desc2 = await getDescriptors(file2);
  const distance = faceapi.euclideanDistance(desc1[0], desc2[0]); // only compare first found face in each image
  console.log('distance between most prominant detected faces:', distance); // eslint-disable-line no-console
  console.log('similarity between most prominant detected faces:', 1 - distance); // eslint-disable-line no-console
};

//main('./images/camacho.jpg', './images/foto2.jpg');

//configuring the AWS 
AWS.config.update({
    accessKeyId: 
    secretAccessKey:
  });

var s3 = new AWS.S3();
var filePath = "";//"./images/foto2.jpg";

//configuring parameters

var params = {
  Bucket: 'ex-software1',
  Body : "",//fs.createReadStream(filePath),
  Key : ""+Date.now()+"_"+path.basename(filePath)
};
/*s3.upload(params, function (err, data) {
  //handle error
  if (err) {
    console.log("Error", err);
  }

  //success
  if (data) {
    console.log("Uploaded in:", data);
  }
});

debugger;*/

//lista de objetos en S3
/*(async function(){

  AWS.config.update({
    accessKeyId: 
    secretAccessKey: 
  });
  try {
      AWS.config.setPromisesDependency();
      const response=await s3.listObjectsV2({
        Bucket: "ex-software1"
      }).promise();
      console.log(response);
  } catch (e) {
    console.log(e);
  }
}

);


async function getAWS(key) {
  var params = {
    Bucket: "ex-software1",
    Key: key
  };
  var file = fs.createWriteStream('image_test.jpg');
  file.on('close', function(){
      console.log('done');  //prints, file created
  });
  s3.getObject(params).createReadStream().on('error', function(err){
      console.log(err);
  }).pipe(file);  
  return file.name;
}




/*s3.deleteObject(params, function(err, data) {
  if (err) console.log(err, err.stack);  // error
  else     console.log(data);                 // deleted
});*/


