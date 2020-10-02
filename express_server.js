const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require('bcrypt');
const { checkEmail } = require("./helpers");

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'session',
  keys: ['bc195cdc919cf3edc1fac2d25f768236', 'cd44ea8345b0d0b91bade4f25f768298'],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

// Creates a random 6 character string for URLs and user ID purposes
function genShortURL() {
  return Math.random().toString(36).substr(2, 6);
}

const urlDatabase = {
};

const users = {
};

// Displays Hello! on main page (/)
app.get("/", (req, res) => {
  res.send("Hello!");
});
// Logs into terminal once server is active and listening
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});
// Displays Hello World on hello page (/hello)
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});
// Displays any relevant long and short URLs and permits editing and deletion of URLs
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
// Creates a new short URL using the genShortURL function and adds it to the database
app.post("/urls", (req, res) => {
  let shortURL = genShortURL();
  urlDatabase[shortURL] =  {longURL: req.body.longURL, userID: req.session.user_id};
  res.redirect(`/urls/${shortURL}`);
});
// Displays form with which to create a new short URL
app.get("/urls/new", (req, res) => {
  if (!req.session.user_id) {
    return res.redirect("/login");
  }
  const templateVars = {
    user: users[req.session.user_id]
  };
  res.render("urls_new", templateVars);
});
// Deletes the targeted short URL
app.post(`/urls/:shortURL/delete`, (req, res) => {
  if (req.session.user_id === urlDatabase[req.params.shortURL].userID) {
    delete urlDatabase[req.params.shortURL];
    return res.redirect("/urls");
  } else {
    return res.redirect("/login");
  }
});
// Redirects user to the targeted web page
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL]["longURL"];
  res.redirect(longURL);
});
// Displays the selected short URL, redirected unauthorized users elsewhere
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    user: users[req.session.user_id]
  };
  if (!templateVars.user) {
    return res.redirect("/login");
  } else if (users[req.session.user_id].id !== urlDatabase[req.params.shortURL].userID) {
    return res.status(403).send("No access");
  } else {
    const templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL]["longURL"],
      user: users[req.session.user_id]
    };
    templateVars.user ? res.render("urls_show", templateVars) : res.redirect("/login");
  }
});
// Edits the existing long URL contained within the stated short URL
app.post("/urls/:shortURL", (req, res) => {
  if (req.session.user_id === urlDatabase[req.params.shortURL].userID) {
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    res.redirect("/urls/");
  } else {
    res.redirect("/login");
  }
});
// Allows users to log in if their credentials exist and are corrects, redirects/displays error otherwise
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
// Allows user to log out - deletes cookies as well
app.post("/logout", (req, res) => {
  req.session.user_id = null;
  res.redirect("/urls/");
});
// Creates a registration page
app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id]
  };
  res.render("urls_reg", templateVars);
});
// Allows user to register for account if credentials are valid and new, redirects/displays error if otherwise
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
// Creates a login page
app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id]
  };
  res.render("urls_login", templateVars);
});

