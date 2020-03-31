const functions = require('firebase-functions');
const express = require("express");
const app = express();
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');
const cookieParser = require('cookie-parser');
const flash = require('express-flash');
const passport = require('passport');
const session = require('express-session');
const fs = require("fs");
var firebase = require("firebase");
var admin = require("firebase-admin");
var serviceAccount = require('./serviceAccount.json');
const bodyParser = require("body-parser");
var urlencodedParser = bodyParser.urlencoded({extended: true});
var nodemailer = require("nodemailer");

///var MemoryStore = require('memorystore')(session);

/*app.use(session({
    cookie: { maxAge: 86400000 },
    store: new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    secret: 'keyboard cat',
    resave:true,
    saveUninitialized:true
}));*/


/*app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false ,
          maxAge: 86400000}
}));

const firebaseConfig = {
  apiKey: "AIzaSyCDzfXOOIzlCy8jk10WcM-Ix6cnAkIe32g",
  authDomain: "celtic-iridium-234908.firebaseapp.com",
  databaseURL: "https://celtic-iridium-234908.firebaseio.com",
  projectId: "celtic-iridium-234908",
  storageBucket: "celtic-iridium-234908.appspot.com",
  messagingSenderId: "166848493036",
  appId: "1:166848493036:web:5d80e02fa073a7a9"
};
*/
const firebaseConfig = {
  apiKey: "AIzaSyAC2bOkvmHvjoEGJ5hU43xPB5wEwg34RDo",
  authDomain: "bloggers-94c4d.firebaseapp.com",
  databaseURL: "https://bloggers-94c4d.firebaseio.com",
  projectId: "bloggers-94c4d",
  storageBucket: "bloggers-94c4d.appspot.com",
  messagingSenderId: "591148768677",
  appId: "1:591148768677:web:ff7a7dca4e0aecb9c1dc4c",
  measurementId: "G-V8PNMT9Y1R"
};
firebaseConfig.credential = admin.credential.cert(serviceAccount);

//Firebase app initialization
admin.initializeApp(firebaseConfig);
//console.log(Project);
// Get a database reference to our blog
var db = admin.firestore();
var me = admin.database();

var ref1 = me.ref("/flag");
var ref2 = me.ref("/count");

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

let User = db.collection('users');
let Blog = db.collection('blogs');
let Publicpost = db.collection('publicposts');
let Subscriber = db.collection('subscribers');
let Newpost = db.collection('newpost');
const port = 3000;

app.set("view engine", "ejs");

app.use(cookieParser('keyboard cat'));
app.use(express.static(__dirname + '/uploads'));

const FirestoreStore = require( 'firestore-store' )(session);

//setting session middleware
app.use(session({
  store: new FirestoreStore({
         database: admin.firestore()
    }),
  name: '__session',
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: {maxAge : 8640000,
      secure: false,
      httpOnly: false}
}));
app.use(flash());

///Express messages Middleware
app.use(function(req, res, next){
  res.locals.messages = require('express-messages')(req, res);
  next();
});

var domain = "";
//Passport config
require('./config/passport')(passport);

//Passport Middleware
app.use(passport.initialize());
app.use(passport.session());



app.get('*',function(req, res, next){
  res.locals.user = req.user|| null;
  next();
});

app.post('*',function(req, res, next){
  res.locals.user = req.user|| null;
  next();
});


//Home GET route
app.get("/", (req, res) => {
  var newpost;
  var blogs = [];
  var subscribed = 0;
  var length = 0;
  Newpost.doc('length').get().then((newp)=>{
      var blength = parseInt(newp.data().blength);
      var plength = parseInt(newp.data().plength);
      console.log("blength=> ",blength);

      Blog.get().then((blog)=>{
        blog.forEach((doc)=>{
          length++;
        });
        if(blength < length){
          console.log("length=> ",length);
          Subscriber.get().then((subscriber)=>{
            subscriber.forEach((docl)=>{
              var email = docl.data().email;

              if(email){
                console.log(email);
                var mailOptions={
                 to : email,
                 subject : "New Blog Update",
                 html : "<h3>Hey we got a new Blog for you! Check out at our website</h3><h3><a href='https://celtic-iridium-234908.firebaseapp.com/blogs/page/1'>Books Your Brain</a></h3>"
              }

              smtpTransport.sendMail(mailOptions, function(error, response){
              if(error){
              console.log(error);
              res.end("error");
              }else{
                console.log("mail is sent to ", email);
              }
              });
              }
            });
            blength = length;
            Newpost.doc('length').update({blength:blength});
          });
        }
      });
  });

  Blog.get().then((blog)=>{
    blog.forEach((doc)=>{
      blogs.push(doc.data());
    });
    var l = blogs.length;
    l = l - 1;
    console.log(blogs[l-1]);
    Subscriber.get().then((subscriber)=>{
      subscriber.forEach((doci)=>{
        if(doci.data().email == req.user)subscribed = 1;
      });
        res.render("home",{blog1:blogs[l],blog2:blogs[l-1],errors:[],subscribed:subscribed});
    });
  });
});

//GET recent blog
app.get("/blog/recent", (req, res) => {
  var blogs = [];
  Blog.get().then((blog)=>{
    blog.forEach((doc)=>{
      blogs.push(doc.data());
    });
    var l = blogs.length;
    var url = domain + "/blog/" + blogs[l-1].postn;
    res.redirect(url);
  });
});

//GET mostLiked blog
app.get("/blog/mostLiked", (req, res) => {
  var likes = 0;
  var id = 0;
  Blog.get().then((blog)=>{
    blog.forEach((doc)=>{
    if(likes < parseInt(doc.data().likes)){
      likes = parseInt(doc.data().likes);
      id = parseInt(doc.data().postn);
    }
    });
    var url = domain + "/blog/" + id;
    res.redirect(url);
  });
});

//GET mostViewed blog
app.get("/blog/mostViewed", (req, res) => {
  var views = 0;
  var id = 0;
  Blog.get().then((blog)=>{
    blog.forEach((doc)=>{
    if(views < parseInt(doc.data().views)){
      views = parseInt(doc.data().views);
      id = parseInt(doc.data().postn);
    }
    });
    var url = domain + "/blog/" + id;
    console.log(url);
    res.redirect(url);
  });
});

//GET blogs
app.get('/blogs/page/:no',(req, res) =>{
  var no = req.params.no;
  var title = [];
  var body = [];
  var views = [];
  var likes =[];
  var postn = [];
  var len = 0;
//  console.log(req.user.email);
  Blog.get().then((blog)=>{
    blog.forEach((doc)=>{
      title.push(doc.data().title);
      body.push(doc.data().body);
      views.push(doc.data().views);
      likes.push(doc.data().likes);
      postn.push(doc.data().postn);
      len++;
    });
    console.log(len);
    if(len % 5 == 0) len = len/5;
    else len = len/5 + 1;
  res.render("blogs",{title: title, body: body,views: views,likes:likes,postn:postn,no:no,len:len});
  });

});

//Views Badao
app.get("/blog/:id/viewsbadao", (req, res)=>{
  var id = req.params.id;
  //views should increase on that post
  Blog.get().then((blog)=>{
    blog.forEach((doc)=>{
      if(id == doc.data().postn){
        views = parseInt(doc.data().views);
        views++;
        console.log("views = " ,views);
        data = doc.data();
        Blog.doc(doc.id).update({views:views});
      }
    });
  });
  var url = domain + "/blog/" + id;
  res.redirect(url);
});


//GET blog - Full Reading
app.get("/blog/:id", function(req, res){
  var id = req.params.id;
  var views;
  var blogs;
  var data;
  var docid=[];
  var comments=[];
  var active = false;

  if(req.user){
    console.log("user is  present");
  //check is user has already liked or commented that post
  User.get().then((user)=>{
    user.forEach((doc)=>{
      if(doc.data().email == req.user.email){

        User.doc(doc.id).collection('liked-commented').doc('liked').get().then((like)=>{
          blogs = like.data().blogs;
          for(var i = 0; i < blogs.length; i++){
            if(blogs[i] == id){
              active = true;
            }
          }
          //console.log("checking");
          Blog.get().then((blog)=>{
            blog.forEach((doci)=>{
              if(doci.data().postn == id){
                data  = doci.data();
                console.log(active);
                //Load comments
                Blog.doc(doci.id).collection('comments').get().then((comment)=>{
                  comment.forEach((user)=>{
                    comments.push(user.data());
                    docid.push(user.id);
                  });
                  console.log(comments,"hola hola");
                  res.render("fullblog",{blog: data, active: active,comments:comments,docid:docid});
                  res.end();
                });
              }
            });
              });
        });
            }
    });
  });}
  else{
    Blog.get().then((blog)=>{
      blog.forEach((doci)=>{
        if(doci.data().postn == id){
          data  = doci.data();
          //console.log(active);
          Blog.doc(doci.id).collection('comments').get().then((comment)=>{
            comment.forEach((user)=>{
              comments.push(user.data());
            });
            console.log(comments,"hola hola");
            res.render("fullblog",{blog: data, active: active,comments:comments});
          });
        }
      });

    });
  }
});

//GET blog likesBadao
app.get("/blog/:postn/likesbadao", (req, res)=>{
  var postn = req.params.postn;
  var postnu = "postn" + postn;
  console.log(postn, postnu);
  User.get().then((user)=>{
    user.forEach((doci)=>{
      //console.log(req.user, " ", doci.data().email);
      if(doci.data().email == req.user.email){
        //console.log("1111");
        User.doc(doci.id).collection('liked-commented').doc('liked').get().then((like)=>{
          var blogs = like.data().blogs;
          blogs.push(postn);
          console.log(blogs);
          User.doc(doci.id).collection('liked-commented').doc('liked').update({blogs:blogs});
        });

        Blog.get().then((blog)=>{
          blog.forEach((docu)=>{
            if(postn == docu.data().postn){
              var likes = parseInt(docu.data().likes);
              likes++;
              //console.log(likes);
              Blog.doc(docu.id).update({
              "likes": likes });
              //res.render("fullblog", {blog: docu.data()});
            }
          });
            var url = domain + "/blog/"+ postn;
            res.redirect(url);
            //res.render("fullblog", {blog: docdata});
        });
      }
    });
  });
});

//Delete COMMENT
app.get("/deleteComment/:postn/:user/:docid", (req, res)=>{
  var username = req.params.user;
  var postn = req.params.postn;
  var commentid = req.params.docid;
  var data=[];
  Blog.get().then((blog)=>{
    blog.forEach((doc)=>{
      if(doc.data().postn == postn){
        data = doc.data();
        var comments = parseInt(doc.data().comments);
        comments--;
        Blog.doc(doc.id).update({comments:comments});
        Blog.doc(doc.id).collection('comments').get().then((comment)=>{
          comment.forEach((doci)=>{
            if(doci.data().username == username && doci.id == commentid){
              Blog.doc(doc.id).collection('comments').doc(doci.id).delete();
            }
          });
        });
      }
    });
    var url = domain + "/blog/" + postn;
    res.redirect(url);
  });

});

//Update comments for a blog
app.post("/blog/:id/updateComment", urlencodedParser,(req, res)=>{
  var id = req.params.id;
  var newComment = req.body.newComment;
  console.log(newComment);
  Blog.get().then((blog)=>{
    blog.forEach((doci)=>{
      if(doci.data().postn == id){
        User.get().then((user)=>{
          user.forEach((doc)=>{
            if(req.user.email == doc.data().email){
              var d = new Date();
              var getdate = d.getDate();
              var getyear = d.getFullYear();
              var getmonth = d.getMonth() + 1;
              var date = getdate + "/" + getmonth + "/" + getyear;
              var hours =  d.getHours();
              var minutes = d.getMinutes();
              var time = hours + ":" + minutes;
              console.log(date," ", time);
              var length = 0;
              var newdata = {body:newComment, username:doc.data().username,date:date,email:doc.data().email,time:time};
              Blog.doc(doci.id).collection('length').doc('length').get().then((length1)=>{
                length =  parseInt(length1.data().length);
                length++;
                  Blog.doc(doci.id).collection('length').doc('length').set({length:length});
                console.log("length =", length);

                var number = 0.000001 * length;
                console.log(number);
                var newdoc = "comm" + number;
                  Blog.doc(doci.id).collection('comments').doc(newdoc).set(newdata);
              });


            }
          });
        });
      }
    });
  });
  var url = domain + "/blog/" + id + "/commentbadao";
  res.redirect(url);
});

//GET requets for comment Badao
app.get("/blog/:id/commentbadao", (req, res)=>{
 var id = req.params.id;
  Blog.get().then((blog)=>{
    blog.forEach((doc)=>{
      if(doc.data().postn == id){
        var comments = doc.data().comments;
        comments++;
        console.log(comments);
        Blog.doc(doc.id).update({comments: comments});
      }
    });
  });
  var url = domain + '/blog/' + id;
  res.redirect(url);
});

//GET fulblog html file
app.get("/blog/fullblog/:page",(req, res)=>{
  var page = req.params.page;
  var url = "b" + page + ".html";
  res.sendFile(url, { root: __dirname });
});




//GET Public Posts
app.get('/publicpost/page/:no',(req, res) =>{
  var no = req.params.no;
  var title = [];
  var body = [];
  var views = [];
  var likes =[];
  var postn = [];
  var len = 0;
  Publicpost.get().then((blog)=>{
    blog.forEach((doc)=>{
      title.push(doc.data().title);
      body.push(doc.data().body);
      views.push(doc.data().views);
      likes.push(doc.data().likes);
      postn.push(doc.data().postn);
      len++;
    });
    console.log(len);
    if(len % 5 == 0) len = len/5;
    else len = len/5 + 1;
  res.render("publicpost",{title: title, body: body,views: views,likes:likes,postn:postn,no:no,len:len});
  });

});

//Views Badao
app.get("/publicpost/:id/viewsbadao", (req, res)=>{
  var id = req.params.id;
  //views should increase on that post
  Publicpost.get().then((blog)=>{
    blog.forEach((doc)=>{
      if(id == doc.data().postn){
        views = parseInt(doc.data().views);
        views++;
        console.log("views = " ,views);
        data = doc.data();
        Publicpost.doc(doc.id).update({views:views});
      }
    });
  });
  var url = domain + "/publicpost/" + id;
  res.redirect(url);
});


//GET publicpost - Full Reading
app.get("/publicpost/:id", function(req, res){
  var id = req.params.id;
  var views;
  var posts;
  var data;
  var docid=[];
  var comments=[];
  var active = false;


  if(req.user){
  //check is user has already liked or commented that post
  User.get().then((user)=>{
    user.forEach((doc)=>{
      if(doc.data().email == req.user.email){

        User.doc(doc.id).collection('liked-commented').doc('liked').get().then((like)=>{
          posts = like.data().posts;
          for(var i = 0; i < posts.length; i++){
            if(posts[i] == id){
              active = true;
            }
          }
          //console.log("checking");
          Publicpost.get().then((blog)=>{
            blog.forEach((doci)=>{
              if(doci.data().postn == id){
                data  = doci.data();
                console.log(active);
                //Load comments
                Publicpost.doc(doci.id).collection('comments').get().then((comment)=>{
                  comment.forEach((user)=>{
                    comments.push(user.data());
                    docid.push(user.id);
                  });
                  console.log(comments);
                  res.render("fullpost",{blog: data, active: active,comments:comments,docid:docid});
                  res.end();
                });
              }
            });
              });
        });
            }
    });
  });}
  else{
    Publicpost.get().then((blog)=>{
      blog.forEach((doci)=>{
        if(doci.data().postn == id){
          data  = doci.data();
          //console.log(active);
          Publicpost.doc(doci.id).collection('comments').get().then((comment)=>{
            comment.forEach((user)=>{
              comments.push(user.data());
            });
            console.log(comments);
            res.render("fullpost",{blog: data, active: active,comments:comments});
          });
        }
      });

    });
  }
});

//GET publicpost likesBadao
app.get("/publicpost/:postn/likesbadao", (req, res)=>{
  var postn = req.params.postn;
  var postnu = "postn" + postn;
  console.log(postn, postnu);
  User.get().then((user)=>{
    user.forEach((doci)=>{
      //console.log(req.user, " ", doci.data().email);
      if(doci.data().email == req.user.email){
        //console.log("1111");
        User.doc(doci.id).collection('liked-commented').doc('liked').get().then((like)=>{
          var posts = like.data().posts;
          posts.push(postn);
          console.log(posts);
          User.doc(doci.id).collection('liked-commented').doc('liked').update({posts:posts});
        });

        Publicpost.get().then((blog)=>{
          blog.forEach((docu)=>{
            if(postn == docu.data().postn){
              var likes = parseInt(docu.data().likes);
              likes++;
              //console.log(likes);
              Publicpost.doc(docu.id).update({
              "likes": likes });
              //res.render("fullblog", {blog: docu.data()});
            }
          });
            var url = domain + "/publicpost/"+ postn;
            res.redirect(url);
            //res.render("fullblog", {blog: docdata});
        });
      }
    });
  });
});

//Delete COMMENT in publicpost
app.get("/publicpost/deleteComment/:postn/:user/:docid", (req, res)=>{
  var username = req.params.user;
  var postn = req.params.postn;
  var commentid = req.params.docid;
  var data=[];
  Publicpost.get().then((blog)=>{
    blog.forEach((doc)=>{
      if(doc.data().postn == postn){
        data = doc.data();
        var comments = parseInt(doc.data().comments);
        comments--;
        Publicpost.doc(doc.id).update({comments:comments});
        Publicpost.doc(doc.id).collection('comments').get().then((comment)=>{
          comment.forEach((doci)=>{
            if(doci.data().username == username && doci.id == commentid){
              Publicpost.doc(doc.id).collection('comments').doc(doci.id).delete();
            }
          });
        });
      }
    });
    var url = domain + "/publicpost/" + postn;
    res.redirect(url);
  });

});

//Update comments for a publicpost
app.post("/publicpost/:id/updateComment", urlencodedParser,(req, res)=>{
  var id = req.params.id;
  var newComment = req.body.newComment;
  console.log(newComment);
  Publicpost.get().then((blog)=>{
    blog.forEach((doci)=>{
      if(doci.data().postn == id){
        User.get().then((user)=>{
          user.forEach((doc)=>{
            if(req.user.email == doc.data().email){
              var d = new Date();
              var getdate = d.getDate();
              var getyear = d.getFullYear();
              var getmonth = d.getMonth() + 1;
              var date = getdate + "/" + getmonth + "/" + getyear;
              var hours =  d.getHours();
              var minutes = d.getMinutes();
              var time = hours + ":" + minutes;
              console.log(date," ", time);
              var length = 0;
              var newdata = {body:newComment, username:doc.data().username,date:date,email:doc.data().email,time:time};
              Publicpost.doc(doci.id).collection('length').doc('length').get().then((length1)=>{
                length =  parseInt(length1.data().length);
                length++;
              Publicpost.doc(doci.id).collection('length').doc('length').set({length:length});
                console.log("length =", length);

                var number = 0.000001 * length;
                console.log(number);
                var newdoc = "comm" + number;
                  Publicpost.doc(doci.id).collection('comments').doc(newdoc).set(newdata);
              });


            }
          });
        });
      }
    });
  });
  var url = domain + "/publicpost/" + id + "/commentbadao";
  res.redirect(url);
});

//GET requets for comment Badao in publicpost
app.get("/publicpost/:id/commentbadao", (req, res)=>{
 var id = req.params.id;
  Publicpost.get().then((blog)=>{
    blog.forEach((doc)=>{
      if(doc.data().postn == id){
        var comments = doc.data().comments;
        comments++;
        console.log(comments);
        Publicpost.doc(doc.id).update({comments: comments});
      }
    });
  });
  var url = domain + '/publicpost/' + id;
  res.redirect(url);
});

//GET fullpost html file
app.get("/publicpost/fullpost/:page",(req, res)=>{
  var page = req.params.page;
  var url = "p" + page + ".html";
  res.sendFile(url, { root: __dirname });
});


//for search results
app.post("/search/query",urlencodedParser,(req, res)=>{
  var query = req.body.query;
  var queries = query.split(" ");
  var l = queries.length;
  var results = [];
  var count = -1,length = 0;
  Blog.get().then((blog)=>{
    blog.forEach((doc)=>{
      var cmp = doc.data().title.toLowerCase();
      for(var i = 0; i < l; i++){
        if(cmp.includes(queries[i].toLowerCase())){
          var index = cmp.indexOf(queries[i].toLowerCase());
          console.log(index + " ," + queries[i].length);
          if((cmp[index - 1] ==" " && cmp[index + queries[i].length] == " " && index !=0 ) || (cmp[index + queries[i].length] == " " && index == 0) || (cmp[index - 1] == " " && index == cmp.length - 1))
            {console.log(queries[i] + " : " + cmp);
            results.push(doc.data());
            count++; length++;
            break;}}}
    });
    Publicpost.get().then((post)=>{
      post.forEach((doci)=>{
        cmp = doci.data().title.toLowerCase();
        for(var i = 0; i < l; i++){
          if(cmp.includes(queries[i].toLowerCase())){
            console.log(queries[i] + " : " + cmp);
            var index = cmp.indexOf(queries[i].toLowerCase());
            if((cmp[index - 1] ==" " && cmp[index + queries[i].length] == " " && index !=0 ) || (cmp[index + queries[i].length] == " " && index == 0) || (cmp[index - 1] == " " && index == cmp.length - 1)){
              results.push(doci.data());
              length++;
              break;}}}
      });
      res.render("results",{results:results,count:count,length:length});
    });});
  });

//GET about page
app.get("/about", (req, res)=>{
  res.render('about');
});

//GET support page
app.get("/support",(req, res)=>{
  res.render("support");
});

app.get("/getdata", (req, res)=>{
  ref1.once("value", function(snapshot) {
    var flag = snapshot.val();
    ref2.once("value", function(snapshot1) {
      var count = snapshot1.val();
      var dataString = flag + ":" + count;
      //console.log(dataString + "\n\n");
      res.writeHead(200, {"Content-Type": "text/plain"});
      res.end(dataString);
    }, function (errorObject) {
      console.log("The read failed: " + errorObject.code);
    });
  }, function (errorObject) {
    console.log("The read failed: " + errorObject.code);
  });
});
app.get("/sae_acc", (req, res)=>{
  // Attach an asynchronous callback to read the data at our posts reference
  /*ref1.once("value", function(snapshot) {
    var flag = snapshot.val();
    ref2.once("value", function(snapshot1) {
      var count = snapshot1.val();
      res.render("akritya", {flag:flag, count:count});
      return;
    }, function (errorObject1) {
      console.log("The read failed: " + errorObject1.code);
    });
  }, function (errorObject) {
    console.log("The read failed: " + errorObject.code);
  });
*/
  res.render("akritya");
});

app.get("/reset_acc", (req, res)=>{
  me.ref("/count").set("0");
  me.ref("/flag").set("-1");
  res.redirect("/sae_acc");
});
//Routes
var users = require("./routes/users");

app.use("/users",users);

app.listen(port, function(){
  console.log("Listening to port "+ port);
});

exports.app = functions.https.onRequest(app);
