var express = require('express');
var router = express.Router();
var passport = require('passport');
var mongoose = require('mongoose');
var User = mongoose.model('User');
var jwt = require('express-jwt');
var auth = jwt({ secret: 'SECRET', userProperty: 'payload' });

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/views/login.html', function (req, res, next) {
  res.sendFile('views/login.html', { root: "./" });
});

router.get('/views/ride.html', function (req, res, next) {
  res.sendFile('views/ride.html', { root: "./" });
});

router.get('/views/register.html', function (req, res, next) {
  res.sendFile('views/register.html', { root: "./" });
});

router.get('/views/information/home.html', function (req, res, next) {
  res.sendFile('views/information/home.html', { root: "./" });
});

router.get('/views/information/about.html', function (req, res, next) {
  res.sendFile('views/information/about.html', { root: "./" });
});

router.get('/views/information/contact.html', function (req, res, next) {
  res.sendFile('views/information/contact.html', { root: "./" });
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
