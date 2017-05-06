var md5 = require('md5');
var dateTime = require('node-datetime');
let path = require('path');

let main_model = require('./models/main_model');
main_model = new main_model();

let bodyParser = require('body-parser');

let multer = require('multer');
let storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, __dirname + '/public/images/uploads')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

let upload = multer({storage: storage});

let express = require('express');
let app = express();

let session = require("express-session")({
        secret: "my-secret",
        resave: true,
        saveUninitialized: true
    }),
    sharedsession = require("express-socket.io-session");

app.use(express.static('public'));

app.set('trust proxy', 1);
app.set('view engine', 'ejs');
app.use(session);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.get('/', function (req, res) {
    main_model.GetCourses(req.session, function (data) {
        res.render(__dirname + '/views/main.ejs', {
            courses: data.courses,
            requests: data.requests,
            session: req.session
        }, function (err, html) {
            res.render(__dirname + '/templates/main.ejs', {session: req.session, data: html});
        });
    });
});

app.get('/main/course/:id', function (req, res) {
    main_model.GetCourse(req.params.id, req.session, function (data) {
        if (data) {
            res.render(__dirname + '/views/course.ejs', {
                item: data.course,
                comments: data.comments,
                requests: data.requests,
                session: req.session
            }, function (err, html) {
                res.render(__dirname + '/templates/main.ejs', {session: req.session, data: html});
            });
        } else res.redirect('back');
    });
});

app.get('/main/my_courses', function (req, res) {
    if (req.session.logined) {
        main_model.GetUserCourses(req.session, function (data) {
            res.render(__dirname + '/views/main.ejs', {
                courses: data.courses,
                requests: data.requests,
                session: req.session
            }, function (err, html) {
                res.render(__dirname + '/templates/main.ejs', {session: req.session, data: html});
            });
        });
    } else res.redirect('back');
});

app.get('/main/my_requests', function (req, res) {
    if (req.session.logined) {
        main_model.GetUserRequests(req.session, function (data) {
            res.render(__dirname + '/views/main.ejs', {
                courses: data.courses,
                requests: data.requests,
                session: req.session
            }, function (err, html) {
                res.render(__dirname + '/templates/main.ejs', {session: req.session, data: html});
            });
        });
    } else res.redirect('back');
});

app.get('/main/my_courses_requests', function (req, res) {
    if (req.session.logined) {
        main_model.GetUserCoursesRequests(req.session, function (data) {
            res.render(__dirname + '/views/requests.ejs', {
                requests: data,
                session: req.session
            }, function (err, html) {
                res.render(__dirname + '/templates/main.ejs', {session: req.session, data: html});
            });
        });
    } else res.redirect('back');
});

app.get('/main/add_course', function (req, res) {
    main_model.GetCoursesInfo(function (result) {
        res.render(__dirname + '/views/add_course.ejs', {data: result, session: req.session}, function (err, html) {
            res.render(__dirname + '/templates/main.ejs', {session: req.session, data: html});
        });
    });
});

app.post('/main/save_course', upload.single('image'), function (req, res) {
    if (req.session.logined) {
        try {
            if (typeof req.file != 'undefined') req.body.image = req.file.filename;
            main_model.AddCourse(req.body, function () {
                res.redirect('/');
            });
        } catch (err) {
            console.log(err);
        }
    } else {
        res.redirect('back');
    }
});

app.get('/main/edit_course/:id', function (req, res) {
    if (req.session.logined) {
        main_model.GetCourseEdit(req.params.id, req.session.userID, function (result) {
            if (result) {
                let data = result;
                main_model.GetCoursesInfo(function (result) {
                    data.types = result.types;
                    data.countries = result.countries;
                    res.render(__dirname + '/views/edit_course.ejs', {
                        data: data,
                        session: req.session
                    }, function (err, html) {
                        res.render(__dirname + '/templates/main.ejs', {session: req.session, data: html});
                    });
                });
            } else res.redirect('back');
        });
    } else res.redirect('back');
});

app.post('/main/update_course/:id', upload.single('image'), function (req, res) {
    if (req.session.logined) {
        if (typeof req.file != 'undefined') req.body.image = req.file.filename;
        main_model.UpdateCourse(req.params.id, req.body, function () {
            res.redirect('back');
        });
    } else {
        res.redirect('back');
    }
});


app.post('/main/apply', function (req, res) {
    try {
        if (req.session.logined) {
            req.body.userID = req.session.userID;
            main_model.AddRequest(req.body, function (result) {
                res.redirect('back');
            });
        } else  res.redirect('back');
    } catch (error) {
        console.log(error);
        res.redirect('back');
    }
});

app.post('/main/dismiss', function (req, res) {
    try {
        if (req.session.logined) {
            req.body.userID = req.session.userID;
            main_model.DismissRequest(req.body, function (result) {
                res.redirect('back');
            });
        } else  res.redirect('back');
    } catch (error) {
        console.log(error);
        res.redirect('back');
    }
});

app.post('/main/confirm/:id', function (req, res) {
    try {
        if (req.session.logined) {
            main_model.ConfirmRequest(req.params.id, req.session, function (result) {
                res.redirect('back');
            });
        } else  res.redirect('back');
    } catch (error) {
        console.log(error);
        res.redirect('back');
    }
});

app.get('/auth/logout', function (req, res) {
    req.session.destroy();
    res.redirect('back');
});

app.post('/auth/login', upload.array(), function (req, res) {
    try {
        main_model.GetUser(req.body.username, function (user) {
            if (user) {
                if (md5(req.body.password) == user.password) {
                    req.session.logined = true;
                    req.session.userID = user.ID;
                    req.session.userType = user.type;
                    req.session.save();
                    res.redirect('back');
                } else res.redirect('back');
            } else res.redirect('back');
        });
    } catch (error) {
        console.log(error);
        res.redirect('back');
    }
});

app.post('/auth/register', function (req, res) {
    if (req.body.username && req.body.password && req.body.password_confirm
        && req.body.email && req.body.password == req.body.password_confirm) {
        delete req.body.password_confirm;
        req.body.password = md5(req.body.password);
        main_model.AddUser(req.body, function (result) {
            if (result) {
                req.session.logined = true;
                req.session.userID = result;
                req.session.userType = 2;
                req.session.save();
            }
            res.redirect('back');
        });
    }
});

app.post('/main/add_comment', function (req, res) {
    if (req.session.logined) {
        let table = req.body.to;
        delete req.body.to;
        req.body.SenderID = req.session.userID;
        main_model.AddComment(table, req.body, function () {
            res.redirect('back');
        });
    }
});

let server = require('http').createServer(app);
let io = require('socket.io')(server);
io.use(sharedsession(session));

io.on('connection', function (socket) {

    socket.on('GetRegions', function (countryID) {
        main_model.GetRegions(countryID, function (regions) {
            io.to(socket.client.id).emit('Regions', regions);
        });
    });

    socket.on('GetCities', function (regionID) {
        main_model.GetCities(regionID, function (cities) {
            io.to(socket.client.id).emit('Cities', cities);
        });
    });
});
server.listen(80);

