const express = require("express");
const bodyParser = require("body-parser");
const router = express.Router();
const bcrypt = require('bcryptjs');
//const { check, validationResult } = require('express-validator');
const cookieParser = require('cookie-parser');
const flash = require('express-flash');
const passport = require('passport');
const session = require('express-session');
const fs = require("fs");
var firebase = require("firebase");
var admin = require("firebase-admin");
var nodemailer = require("nodemailer");

//console.log(Project);
// Get a database reference to our blog
var db = admin.firestore();
//console.log(db);
//var ref = db.ref("server/saving-data/fireblog/posts");
//console.log(ref);

//var Storage = Project.storage();
let User = db.collection('users');
let Temp = db.collection('temp');
let Subscriber = db.collection('subscribers');
let smtpTransport = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        type: 'login',
        user: 'booksyourbrain@gmail.com',
        pass: 'books@brain'
    }
});

var app = express();
// parse application/json
app.use(bodyParser.json());
var errors,flag = 0;
var urlencodedParser = bodyParser.urlencoded({extended: true});
//app.use(bodyParser.urlencoded({extended: true}));


//get request for signup
router.get("/signup", (req, res)  => {
  res.render("signup", {errors:[]});
});

//post request for signup
router.post("/signup", urlencodedParser,(req, res)  => {
  var username  = req.body.username;
  var email  = req.body.email;
  var pass1  = req.body.pass1;
  var pass2  = req.body.pass2;
  errors = [];

  //VALIDATION OF INPUTS
  if(username.length < 3 || username.length > 15){
    errors.push({msg:"Username Should Be 3-15 chars long!"});
  }
  else{
    if(!username.match(/^[a-z A-Z0-9\\_\\"]+$/)){
      errors.push({msg:"Username Only Contains Alphabets, Numbers And Underscores!"});
    }}
  if(!email.match(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)){
    errors.push({msg: "Please Enter Valid Email Address!!"});
  }
  if(pass1.length == 0){
    errors.push({msg:"Password Can't Be Empty!"});
  }
  else{
    if(!pass1.match(/^[a-zA-Z0-9@]*$/)){
      errors.push({msg:"Password Only Contains Alphabets, Numbers and @ symbol!"});
    }}
  if(pass2 != pass1){
    errors.push({msg: "Password Do Not Match!"});
  }
  console.log(errors);
  if(errors.length == 0){
     flag = 0;
    //checking if email address is aready registered or not
    User.get().then((user) =>{
      user.forEach((doc) => {
          if(email == doc.data().email) {  console.log(email," = ",doc.data().email);flag = 1;}
        });
        console.log(flag);
        if(flag == 1){
          req.flash("error", "Email Is Already Registered!!");
          res.render("signup", {errors: []});
        }
        else{

        var otp = Math.random();
        otp = otp * 1000000;
        otp = parseInt(otp);
        console.log(otp);

        var mailOptions={
         to : email,
         subject : "OTP Verification",
         html : "<h3>OTP for account verification is </h3>"  + "<h1 style='font-weight:bold;'>" + otp +"</h1>"
      }

      smtpTransport.sendMail(mailOptions, function(error, response){
      if(error){
      console.log(error);
      res.end("error");
      }else{
        var newTemp = {
          username:username,
          email:email,
          password: pass1,
          otp:otp
        };

        //Delete previous any otp entry there in firestore
        Temp.get().then((user)=>{
          user.forEach((doc)=>{
            if(doc.data().email == email){
              Temp.doc(doc.id).delete();
            }
          });
            console.log("deleted!");
            Temp.doc(email).set(newTemp);
        });
        setTimeout(()=>{
          Temp.doc(email).update({otp:""});
          console.log("5 seconds ho gaye!");
        },180000);
        res.render('otpverify', {errors:[], email:email});
      }
      });
      }  });
}
  else {
    res.render("signup", {errors: errors});
  } });


//GET request for resend otp
router.get("/resendOTP/:email", (req, res)=>{
  var email = req.params.email;

          var otp = Math.random();
          otp = otp * 1000000;
          otp = parseInt(otp);
          console.log(otp);

          var mailOptions={
           to : email,
           subject : "OTP Verification",
           html : "<h3>OTP for account verification is </h3>"  + "<h1 style='font-weight:bold;'>" + otp +"</h1>"
        }

        smtpTransport.sendMail(mailOptions, function(error, response){
        if(error){
        console.log(error);
        res.end("error");
        }else{
          Temp.doc(email).update({otp:otp});
          setTimeout(()=>{
            Temp.doc(email).update({otp:""});
            console.log("5 seconds ho gaye!");
          },180000);
          res.render('otpverify', {errors:[], email:email});
        }
        });
});



//POST request otp verify Request
router.post("/otpverify", urlencodedParser,(req, res)=>{
  var otp = req.body.otp;
  var email = req.body.email;
  errors = [];
  if(otp.length < 1 ||otp.length >6){
    res.render("otpverify",{errors:[{msg:"OTP IS ONLY 6 DIGITS LONG!"}], email:email});
  }

  Temp.doc(email).get().then((user)=>{
    console.log(user.data().otp, "  ",otp);
    if(user.data().otp == otp){
      bcrypt.genSalt(10, function(err, salt){
        bcrypt.hash(user.data().password,salt,function(err,hash){
          if(err) console.log(err);
          else {
            var credentials = {
              email :email,
              username: user.data().username,
              password:hash
            };
            User.doc(user.data().username).set(credentials);
            setTimeout(()=>{
              Temp.doc(email).delete();
              console.log("otp entry deleted!");
            },1000);
            User.doc(user.data().username).collection('liked-commented').doc('liked').set({posts:['0'],blogs:['0']});
            req.flash("success","registered successfully");
            res.redirect("/users/login");
        }
      });
    });
  }  else{
    res.render('otpverify', {errors:[{msg:"OTP do not match!!"}],email:email});
  }
  });
});


//GET request for login
router.get("/login", (req, res)=>{
  Temp.get().then((user)=>{
    user.forEach((doc)=>{
      Temp.doc(doc.id).delete();
    });});
  res.render("login", {errors:[]});
});

//POST reuest for login
router.post("/login", urlencodedParser, (req, res, next)=>{
  errors = [];
  //Validation
  console.log(req.body);
  var email = req.body.email;
  var password = req.body.password;
  if(email.length == 0){errors.push({msg:"Email Id Can,t Be Empty!"});}
  else{
    if(!email.match(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)){
      errors.push({msg:"Enter a valid email id!"});
    }
  }
  if(password.length == 0){errros.push({msg:"Password Can't Empty"});}

  if(errors.length == 0){
    //Authenication for user using Passport
    passport.authenticate('local',{
      successRedirect: '/blogs/page/1',
      failureRedirect: '/users/login/#',
      failureFlash: true,
      successFlash:true
    })(req, res, next);
  }
  else{
    res.render('login', {errors:errors});
    req.user = null;
  }
});

//GET Request For Logout
router.get('/logout',function(req, res){
  req.logout();
  req.flash('success','Logged Out Successfully!');
  res.redirect('/users/login');
});


//POST request for query
router.post("/query", urlencodedParser,(req, res)=>{
  var email = req.body.email;
  var query = req.body.query;
  console.log(email,"==>",query);
  errors = [];
  //INPUT VALIDATION
  if(!email.match(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/))
    { req.flash("error","Enter Valid Email Id");
      res.redirect("/");
    }
    var mailOptions={
     to : "booksyourbrain@gmail.com",
     subject : "Query Recieved",
     html : "<h3>Sir you recieved a query from </h3>" + "<h2>"+email+" : </h2><br>" + "<h3>" + query + "</h3>"
  }

  smtpTransport.sendMail(mailOptions, function(error, response){
  if(error){
  console.log(error);
  res.end("error");
  }else{
    console.log("query is sent");
    req.flash("success","Your Query Is Recieved By Us!");
    res.redirect("/");
  }
  });
});


//GET request for subscribe
router.get("/subscribe", (req, res)=>{
  Subscriber.doc('length').get().then((length1)=>{
    var length =  parseInt(length1.data().length);
    length++;
      Subscriber.doc('length').set({length:length});
    console.log("length =", length);

    var number = 0.000001 * length;
    console.log(number);
    var newdoc = "subsc" + number;
    var newdata = {email:req.user.email};
      Subscriber.doc(newdoc).set(newdata);
  });
  //console.log(req.user);
  var mailOptions={
   to : req.user.email,
   subject : "Subscribed Successfully",
   html : "<h3>Congrats, you are BYB subscriber now! </h3>" + "<h2>We hope that you will like our posts</h2>"
}

smtpTransport.sendMail(mailOptions, function(error, response){
if(error){
console.log(error);
res.end("error");
}else{
  req.user.subscribed = "1";
  req.flash("success","You have subscribed successfully");
  res.redirect("/");
}
});
});
module.exports = router;
