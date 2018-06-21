var express = require("express");
var app = express();
var cookieSession = require('cookie-session');
var PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const bcrypt = require('bcryptjs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + '/public'));
app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}))

// #######################################################################
// database to store shortened URLs
var urlDatabase = {
  "b2xVn2": {shortURL: 'b2xVn2', longURL: "http://www.lighthouselabs.ca", userID: 'user1'},
  "bwrVn2": {shortURL: 'b2xVn2', longURL: "http://www.yahoo.ca",          userID: 'user1'},
  "9sm5xK": {shortURL: '9sm5xK', longURL: "http://www.google.com",        userID: 'user2'},
  "7hmef4": {shortURL: '7hmef4', longURL: "http://www.msn.com",           userID: 'user2'},
};

// database to store users INFO
const usersDatabase = {
  "user1": {
    userID  : "user1",
    email   : "user@example.com",
    password: "$2a$10$p8JoJA72kcL9rPfFRyo4vOQwtBROtkBkNKkueMDi9y7wvOmKztqdO"
  },
  "user2": {
    userID  : "user2",
    email   : "user2@example.com",
    password: "$2a$10$p8JoJA72kcL9rPfFRyo4vOQwtBROtkBkNKkueMDi9y7wvOmKztqdO"
  },
};

// #######################################################################
//Generates a random 6 digit number for the shortURL.
function urlGenerator() {
  let text = "";
  let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 6; i++){
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}
// #######################################################################
//Filters the database by logged in user.
const urlListForUser = (userID) => {
  let tempDB = [];
  for(var eachUrl in urlDatabase) {
    if(urlDatabase[eachUrl].userID === userID)  {
      tempDB.push(urlDatabase[eachUrl]);
    }
  }
  return tempDB;
}
// #######################################################################
// checking user if is logged in
const checkUser = (unKnownUserID) => {
  for (let eachUser in usersDatabase) {
    if (usersDatabase[eachUser].userID === unKnownUserID) {
      return true;
    }
  }
};
// ########################################################################
// User validation by email
const emailValidation = (req) => {
  for (var user in usersDatabase) {
    if (usersDatabase[user].email === req.body.email) {
      return usersDatabase[user].userID;
    }
  }
};
// #######################################################################
app.get("/", (req, res) => {
  if(checkUser(req.session.userID)) {
    res.redirect(302, "/urls");
  }
  else {
    res.redirect(302, "/login");
  }
});

// res.json(urlDatabase);
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// res.json(usersDatabase);
app.get("/users.json", (req, res) => {
  res.json(usersDatabase);
});

// entry point for get /login
app.get("/login", (req, res) => {
    tempVar={
      userINFO: {email: 'guest'},
      btn_status: {login_btn: false, reg_btn: true, logout_btn: false}
    }
    res.render("login",tempVar);
});

// entry point for get /urls
app.get("/urls", (req, res) => {
  if (checkUser(req.session.userID)) {
    tempVar={
      shortUrlList: urlListForUser(req.session.userID),
      userINFO: usersDatabase[req.session.userID],
      btn_status: {login_btn: false, reg_btn: false, logout_btn: true}
    }
    res.render("urls_index",tempVar);
  }else{
    res.redirect(302, "login");
  }
});

// entry point for get /urls
app.get("/urls/new", (req, res) => {
  if (checkUser(req.session.userID)) {
    tempVar={
      shortUrlList: urlListForUser(req.session.userID),
      userINFO: usersDatabase[req.session.userID],
      btn_status: {login_btn: false, reg_btn: false, logout_btn: true}
    }
    res.render("urls_new",tempVar);
  }else{
    res.redirect("login");
  }
});

// entry point for get /urls
app.get("/urls/:id", (req, res) => {
  if (checkUser(req.session.userID)) {
      let templateVars = {
          userINFO : {
                      shortURL: urlDatabase[req.params.id].shortURL, 
                      longURL: urlDatabase[req.params.id].longURL, 
                      userID: req.session.userID,
                      email: usersDatabase[req.session.userID].email
                    },
          btn_status: {login_btn: false, reg_btn: false, logout_btn: true}
        };

      res.render("urls_show", templateVars);
  } else {
    res.status(401).send("Please login first!");
  }
});

// entry point for get /register
app.get("/register", (req, res) => {
    tempVar={
      userINFO: {email: 'guest'},
      btn_status: {login_btn: true, reg_btn: false, logout_btn: false}
    }
    res.render("register",tempVar);
});

// adds a website to the database while generating new URL
app.post("/urls", (req, res) => {
  let shortURL = urlGenerator();
  while (urlDatabase[shortURL] !== undefined) {
    let shortURL = urlGenerator();
  }
  let longURL = req.body.longURL;
  if (!longURL.startsWith("http://") && !longURL.startsWith("https://")) {
    longURL = `http://${longURL}`;
  }
  urlDatabase[shortURL] = {shortURL: shortURL, longURL: longURL, userID: req.session.userID};
  res.redirect(302, `/urls/${shortURL}`);
});

// entry point for post /urls/:id/edit
app.post("/urls/:id/edit", (req, res) => {
  let longURL = req.body.upUrl;
  let shortURL = req.params.id;
  if (!longURL.startsWith("http://") && !longURL.startsWith("https://")) {
    longURL = `http://${longURL}`;
  }
  urlDatabase[shortURL] = {
                            shortURL: shortURL, 
                            longURL: longURL, 
                            userID: req.session.userID
                          };
  res.redirect(302, `/urls/${shortURL}`);
});

// entry point for post /urls/:id/delete
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect(302, `/urls`);
});

// entry point for post /register
app.post("/register", (req, res) => {
  if ((req.body.email === "") || (req.body.password === "")) {
    res.status(400).send("Please fill up email and password");
    return;
  }
  for (let eachUser in usersDatabase) {
    if (usersDatabase[eachUser].email === req.body.email) {
      res.status(400).send("Email already registered");
      return;
    }
  }

  let index_at = req.body.email.indexOf('@', 0);
  var userID = req.body.email.substr(0, index_at);
  let password = bcrypt.hashSync(req.body.password, 10);
  usersDatabase[userID] = {userID: userID, email: req.body.email, password: password};
  req.session.userID = userID;
  res.redirect(302, "/urls");
});

// entry point for post /login
app.post("/login", (req, res) => {
  validUserID = emailValidation(req);
  if (validUserID) {
    if (bcrypt.compareSync(req.body.password, usersDatabase[validUserID].password)) {
      req.session.userID = validUserID;
      res.redirect(302, "/urls");
    } else {
      res.status(403).send("Invalid password");
    }
  } else {
    res.status(403).send("Email not found");
  }
});

// entry point for post /logout
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect(302, "/");
});

// redirect tinylink to longURL from database
app.get("/u/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    res.status(404).send("Link is broken ");
  } else {
    res.redirect(302, urlDatabase[req.params.id].longURL);
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});