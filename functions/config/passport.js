const localStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
var firebase = require("firebase");
var admin = require("firebase-admin");
var express = require("express");
var app = express();
// Get a database reference to our blog
var db = admin.firestore();

//var Storage = Project.storage();
let User = db.collection('users');
let Subscriber = db.collection('subscribers');
module.exports = function(passport){
  var flag = 0;
  var subscribed = "0";
  passport.use(new localStrategy({
    usernameField: 'email',
    passwordField:'password'
  },function(email, password, done){
    User.get().then((user) =>{
      user.forEach((doc) => {

        var email1 = doc.data().email;
        if(email == email1){
          console.log(email, email1);

          flag = 1;
          var data = "";
          bcrypt.compare(password, doc.data().password,function(err, isMatch){
            if(err) throw err;
            if(isMatch){
              console.log("User found!!");
              Subscriber.get().then((subscriber)=>{
                subscriber.forEach((doci)=>{
                  if(doci.data().email == email1){ subscribed = "1"; console.log("mila subscriber");}
                });
                data = {email:doc.data().email,
                        subscribed: subscribed};
                return done(null,data,{message: 'Log Inned Successfully!!'});
              });

            }else{
              console.log("password do not match!!");
              return done(null,false,{message: 'Wrong Password!!'});
            }
          });
        }
        });
        console.log(flag);
        if(flag == 0){
          console.log("No user found!!");
          return done(null,false,{message: 'No User Found!!'});
        }
      });
  }));

  passport.serializeUser(function(user, done) {
    console.log("Serializes user");
    done(null, user);
  });

  passport.deserializeUser(function(email, done){
    console.log("Deserializes user");
    User.get().then((user) =>{
      user.forEach((doc) => {
          if(doc.data().email == email.email){
            done(false, email);}
        });
    });
  });
}
