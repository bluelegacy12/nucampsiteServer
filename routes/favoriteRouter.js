const express = require('express');
const Favorite = require('../models/favorite');
const authenticate = require('../authenticate');
const favoriteRouter = express.Router();
const cors = require('./cors');
const usersRouter = require('../routes/users');

// had an issue using req.user._id so I had usersRouter track the id as
// a variable upon login and then exported it over to this file


favoriteRouter.route('/')
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.cors, (req, res, next) => {
        Favorite.findOne({ user: usersRouter.userId })
            // .populate('user')
            // .populate('campsites')
            .then(favorites => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorites);
            })
            .catch(err => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorite.findOne({ user: usersRouter.userId })
            .then(favorites => {
                if (favorites) {
                    //changed implementation because it would allows duplicate favorites otherwise
                    req.body.forEach(campsite => {
                        let bool = false;
                        favorites.campsites.forEach(favCamp => {
                            console.log("in array ---", favCamp, "in body ----", campsite);
                            if (favCamp == campsite._id) {
                                bool = true;
                            }
                        })
                        if (!bool) {
                            favorites.campsites.unshift(campsite);
                        }
                    });
                    favorites.save()
                        .then(favorites => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(favorites);
                        });
                } else {
                    Favorite.create({ user: usersRouter.userId, campsites: req.body })
                        .then(favorites => {
                            favorites.save();
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(favorites);
                        })
                        .catch(err => next(err));
                }
            })
            .catch(err => next(err));

    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
        res.statusCode = 403;
        res.end('PUT operation not supported on /favorites');
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorite.deleteMany({ user: usersRouter.userId })
            .then(favorites => {
                if (favorites) {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorites);
                } else {
                    res.setHeader('Content-Type', 'text/plain');
                    res.end('You do not have any favorites to delete.');
                }
            })
            .catch(err => next(err));
    });

favoriteRouter.route('/:campsiteId')
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.cors, (req, res) => {
        res.statusCode = 403;
        res.end('GET operation not supported on /favorites');
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorite.findOne({ user: usersRouter.userId })
            .then(favorites => {
                const camp = req.params.campsiteId;
                // changed implementation because it would allows duplicate favorites otherwise
                if (!favorites) {
                    Favorite.create({ user: usersRouter.userId, campsites: [camp] })
                        .then(favorites => {
                            favorites.save();
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(favorites);
                        })
                        .catch(err => next(err));
                } else {
                    console.log("attempting post");
                    let bool = false;
                    favorites.campsites.forEach(campsite => {
                        if (camp == campsite) {
                            bool = true;
                        }
                    });
                    if (!bool) {
                        favorites.campsites.unshift(camp);
                        favorites.save()
                            .then(favorites => {
                                console.log(favorites);
                                res.statusCode = 200;
                                res.setHeader('Content-Type', 'application/json');
                                res.json(favorites);
                            });
                    } else {
                        res.setHeader('Content-Type', 'text/plain');
                        res.end('That campsite is already in your list of favorites!');
                    }
                };
            })
            .catch(err => next(err));
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
        res.statusCode = 403;
        res.end('PUT operation not supported on /favorites');
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorite.findOne({ user: usersRouter.userId })
            .then(favorites => {
                const camp = req.params.campsiteId;
                let bool = false;

                if (!favorites) {
                    res.setHeader('Content-Type', 'text/plain');
                    res.end('There are no favorites to delete');
                } else {
                    favorites.campsites.forEach(id => {
                        if (id == camp) {
                            bool = true;
                            favorites.campsites.splice(favorites.campsites.indexOf(camp), 1);
                            favorites.save()
                                .then(favorites => {
                                    res.statusCode = 200;
                                    res.setHeader('Content-Type', 'application/json');
                                    res.json({ "Removed from favorites:": camp });
                                });
                        }
                    });
                }
                if (!bool) {
                    res.setHeader('Content-Type', 'text/plain');
                    res.end('That campsite was not in your favorites.');
                }
            })
            .catch(err => next(err));
    });

module.exports = favoriteRouter;