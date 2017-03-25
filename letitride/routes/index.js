var express = require('express');
var router = express.Router();
var passport = require('passport');
var mongoose = require('mongoose');
var User = mongoose.model('User');
var jwt = require('express-jwt');
var auth = jwt({ secret: 'SECRET', userProperty: 'payload' });

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index');
});

router.get('/login.html', function (req, res, next) {
  res.sendFile('views/templates/user/login.html', { root: "./" });
});

router.get('/ride.html', function (req, res, next) {
  res.sendFile('views/templates/user/ride.html', { root: "./" });
});

router.get('/register.html', function (req, res, next) {
  res.sendFile('views/templates/user/register.html', { root: "./" });
});

router.get('/home.html', function (req, res, next) {
  res.sendFile('views/templates/information/home.html', { root: "./" });
});

router.get('/about.html', function (req, res, next) {
  res.sendFile('views/templates/information/about.html', { root: "./" });
});

router.get('/contact.html', function (req, res, next) {
  res.sendFile('views/templates/information/contact.html', { root: "./" });
});

router.post('/login', function (req, res, next) {
  if (!req.body.username || !req.body.password) {
    return res.status(400).json({ message: 'Please fill out all fields' });
  }

  passport.authenticate('local', function (err, user, info) {
    if (err) { return next(err); }

    if (user) {
      return res.json({ token: user.generateJWT() });
    } else {
      return res.status(401).json(info);
    }
  })(req, res, next);
});

router.post('/register', function (req, res, next) {
  if (!req.body.username || !req.body.password) {
    return res.status(400).json({ message: 'Please fill out all fields' });
  }

  var user = new User();

  user.username = req.body.username;

  user.setPassword(req.body.password)

  user.save(function (err) {
    if (err) { return next(err); }

    return res.json({ token: user.generateJWT() })
  });
});

module.exports = router;
