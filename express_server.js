const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require('bcrypt');
const { getUserByEmail, checkEmail } = require("./helpers");

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'session',
  keys: ['bc195cdc919cf3edc1fac2d25f768236', 'cd44ea8345b0d0b91bade4f25f768298'],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

function genShortURL() {
  return Math.random().toString(36).substr(2, 6);
}

const urlDatabase = {

};

const users = {
  // "userRandomID": {
  //   id: "userRandomID",
  //   email: "user@example.com",
  //   password: "1"
  // },
  // "user2RandomID": {
  //   id: "user2RandomID",
  //   email: "user2@example.com",
  //   password: "dishwasher-funk"
  // }
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  let userURLs = {};
  for (const url in urlDatabase) {
    if (req.session.user_id === urlDatabase[url].userID) {
      userURLs[url] = urlDatabase[url];
    }
  }
  const templateVars = {urls: userURLs, user: users[req.session.user_id]};
  templateVars.user ? res.render("urls_index", templateVars) : res.redirect("/login");
});

app.post("/urls", (req, res) => {
  let shortURL = genShortURL();
  urlDatabase[shortURL] =  {longURL: req.body.longURL, userID: req.session.user_id};
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/new", (req, res) => {
  if (!req.session.user_id) {
    return res.redirect("/login");
  }
  const templateVars = {
    user: users[req.session.user_id]
  };
  res.render("urls_new", templateVars);
});

app.post(`/urls/:shortURL/delete`, (req, res) => {
  if (req.session.user_id === urlDatabase[req.params.shortURL].userID) {
    delete urlDatabase[req.params.shortURL];
    return res.redirect("/urls");
  } else {
    return res.redirect("/login");
  }
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL]["longURL"];
  res.redirect(longURL);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    user: users[req.session.user_id]
  };
  
  if (!templateVars.user) {
    return res.redirect("/login");
  } else {
  
    const templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL]["longURL"],
      user: users[req.session.user_id]
    };
    //res.render("urls_show", templateVars);
    templateVars.user ? res.render("urls_show", templateVars) : res.redirect("/login");
  }
});

app.post("/urls/:shortURL", (req, res) => {
  if (req.session.user_id === urlDatabase[req.params.shortURL].userID) {
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    res.redirect("/urls/");
  } else {
    res.redirect("/login");
  }
});

app.post("/login", (req, res) => {
  if (req.body.email === "" || req.body.password === "") {
    return res.status(403).send("Please enter a valid email and/or password");
  }
  if (checkEmail(req.body.email, users)) {
    for (let user in users) {
      if (bcrypt.compareSync(req.body.password, users[user].password)) {
        req.session.user_id = users[user].id;
        return res.redirect("/urls/");
      }
    }
  }
  return res.status(403).send("Email and/or password not found");
  
});

app.post("/logout", (req, res) => {
  req.session.user_id = null;
  res.redirect("/urls/");
});

app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id]
  };
  res.render("urls_reg", templateVars);
});

app.post("/register", (req, res) => {
  let newID = genShortURL();
  if (req.body.email === "" || req.body.password === "") {
    return res.status(400).send("Please enter a valid email and/or password");
  }
  if (checkEmail(req.body.email, users)) {
    return res.status(400).send("Email is already in use");
  }
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  users[newID] = {
    id: newID,
    email: req.body.email,
    password: hashedPassword
  };
  req.session.user_id = newID;
  res.redirect("/urls/");
});

app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id]
  };
  res.render("urls_login", templateVars);
});

