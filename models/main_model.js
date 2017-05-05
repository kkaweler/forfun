let mysql = require('mysql');
let config = require("../config.js");
let db = mysql.createConnection(config.mysqlConfig);
let squel = require("squel");
let dateTime = require('node-datetime');

let SetRows = function (sql, data) {
    for (var index in data) {
        sql.set(index, data[index] == 'null' ? null : data[index]);
    }
};

class model {
    constructor() {
        db.connect();
    }

    GetUser(username, callback) {
        try {
            db.query("SELECT t1.ID, t2.typename, t1.password FROM users as t1 LEFT JOIN user_types as t2 ON t1.type = t2.id where username = " + db.escape(username),
                function (error, result) {
                    if (error) throw error;
                    callback(result[0]);
                });
        } catch (err) {
            console.log(err);
            callback(false);
        }
    }

    GetCoursesInfo(callback) {
        try {
            db.query("SELECT * FROM cource_types", function (err, result) {
                if (err) throw err;
                let toReturn = {types: result};
                db.query("SELECT * FROM countries", function (err, result) {
                    if (err) throw err;
                    toReturn.countries = result;
                    callback(toReturn);
                });
            });
        } catch (err) {
            console.log(err);
            callback(false);
        }
    }

    GetRegions(countryID, callback) {
        try {
            db.query("SELECT * FROM regions WHERE CountryID = " + db.escape(countryID), function (err, result) {
                if (err) throw err;
                callback(result)
            });
        } catch (err) {
            console.log(err);
            callback(false);
        }
    }

    GetCities(regionID, callback) {
        try {
            db.query("SELECT * FROM cities WHERE RegionID = " + db.escape(regionID), function (err, result) {
                if (err) throw err;
                callback(result)
            });
        } catch (err) {
            console.log(err);
        }
    }


    AddCourse(data, callback) {
        try {
            let sql = squel.insert();
            sql.into('courses');
            SetRows(sql, data);
            db.query(sql.toString(), function (err) {
                if (err) throw err;
                callback();
            });
        } catch (err) {
            console.log(err);
            callback(false);
        }
    }

    UpdateCourse(id, data, callback) {
        try {
            let sql = squel.update()
                .table('courses');

            SetRows(sql, data);

            sql.where('ID = ?', id);
            db.query(sql.toString(), function (err) {
                if (err) throw err;
                callback();
            });
        } catch (err) {
            console.log(err);
            callback(false);
        }
    }

    GetCourse(id, session, callback) {
        try {
            let sql = squel.select()
                .from('course')
                .where('ID = ?', id);

            db.query(sql.toString(), function (err, result) {
                if (err) throw err;
                if (result) {
                    let data = {course: result[0], requests: []};
                    if (session.logined) {
                        sql = squel.select().field('CourseID').from('requests').where('UserID = ?', session.userID);
                        db.query(sql.toString(), function (err, rows) {
                            if (err) throw err;
                            if (rows.length) {
                                for (let index in rows) {
                                    data.requests.push(rows[index].CourseID);
                                }
                            }
                            callback(data);
                        });
                    } else callback(data);
                } else callback(false);
            });

        } catch (err) {
            console.log(err);
            callback(false);
        }
    }

    GetCourseEdit(id, userID, callback) {
        try {
            let self = this;
            let sql = squel.select()
                .from('course')
                .where('ID = ?', id)
            db.query(sql.toString(), function (err, result) {
                if (err) throw err;
                if (result.length > 0) {
                    if (result[0].TeacherID == userID) {
                        let data = {course: result[0]};
                        self.GetRegions(result[0].CountryID, function (result) {
                            data.regions = result;
                            self.GetCities(data.course.RegionID, function (result) {
                                data.cities = result;
                                callback(data);
                            });
                        })
                    } else callback(false);
                } else callback(false);
            });
        } catch (err) {
            console.log(err);
            callback(false);
        }
    }

    GetCourses(session, callback) {
        try {
            let sql = squel.select()
                .from('Course');
            db.query(sql.toString(), function (err, result) {
                if (err) throw err;
                let data = {courses: result, requests: []};
                if (session.logined) {
                    sql = squel.select().field('CourseID').from('requests').where('UserID = ?', session.userID);
                    db.query(sql.toString(), function (err, rows) {
                        if (err) throw err;
                        if (rows.length) {
                            for (let index in rows) {
                                data.requests.push(rows[index].CourseID);
                            }
                        }
                        callback(data);
                    });
                } else callback(data);
            });
        } catch (err) {
            console.log(err);
            callback(false);
        }
    }

    GetUserCourses(session, callback) {
        try {
            let sql = squel.select()
                .from('Course')
                .where('TeacherID = ?', session.userID);
            db.query(sql.toString(), function (err, result) {
                if (err) throw err;
                let data = {courses: result, requests: []};
                if (session.logined) {
                    sql = squel.select().field('CourseID').from('requests').where('UserID = ?', session.userID);
                    db.query(sql.toString(), function (err, rows) {
                        if (err) throw err;
                        if (rows.length) {
                            for (let index in rows) {
                                data.requests.push(rows[index].CourseID);
                            }
                        }
                        callback(data);
                    });
                } else callback(data);
            });
        } catch (err) {
            console.log(err);
            callback(false);
        }
    }

    GetUserCoursesRequests(session, callback) {
        try {
            let sql = squel.select()
                .from('request')
                .where('TeacherID = ? AND Confirmed = 0', session.userID);
            db.query(sql.toString(), function (err, result) {
                if (err) throw err;
                callback(result);
            });
        } catch (err) {
            console.log(err);
            callback(false);
        }
    }

    GetUserRequests(session, callback) {
        try {
            let sql = squel.select()
                .field('t1.*')
                .from('Course', 't1')
                .left_join('requests', 't2', 't1.ID = t2.CourseID')
                .where('t2.UserID = ? AND t2.Confirmed = 1', session.userID);

            db.query(sql.toString(), function (err, result) {
                if (err) throw err;
                let data = {courses: result, requests: []};
                if (session.logined) {
                    sql = squel.select().field('CourseID').from('requests').where('UserID = ?', session.userID);
                    db.query(sql.toString(), function (err, rows) {
                        if (err) throw err;
                        if (rows.length) {
                            for (let index in rows) {
                                data.requests.push(rows[index].CourseID);
                            }
                        }
                        callback(data);
                    });
                } else callback(data);
            });
        } catch (err) {
            console.log(err);
            callback(false);
        }
    }

    AddUser(data, callback) {
        try {
            let sql = squel.select().field('ID').from('users').where('Username = ?', data.Username);
            db.query(sql.toString(), function (err, rows) {
                if (err) throw err;
                if (rows.length) callback(false);
                else {
                    sql = squel.select().field('ID').from('users').where('Email = ?', data.email);
                    db.query(sql.toString(), function (err, rows) {
                        if (err) throw err;
                        if (rows.length) callback(false);
                        else {

                            sql = squel.insert()
                                .into('users')
                                .set('Type', 2);

                            SetRows(sql, data);

                            db.query(sql.toString(), function (err, result) {
                                if (err) throw err;
                                else callback(result.insertId);
                            });

                        }
                    });
                }
            });
        } catch (err) {
            console.log(err);
            callback(false);
        }
    }

    AddRequest(data, callback) {
        let sql = squel.select().field('id').from('requests').where('CourseId = ? AND UserID = ?', data.courseID, data.userID);
        try {
            db.query(sql.toString(), function (err, rows) {
                if (!rows.length) {
                    data.date = dateTime.create().format('Y-m-d H:M:S');
                    sql = squel.insert().into('requests');
                    SetRows(sql, data);
                    db.query(sql.toString(), function (err) {
                        if (err) throw err;
                        callback(true);
                    });
                } else callback(false);
            });
        } catch (err) {
            console.log(err);
            callback(false);
        }

    }

    DismissRequest(data, callback) {
        try {
            let sql = squel.delete().from('requests').where('CourseID = ? AND UserID = ?', data.courseID, data.userID);
            db.query(sql.toString(), function (err) {
                if (err) throw err;
                callback(true);
            });
        } catch (err) {
            console.log(err);
            callback(false);
        }

    }

    ConfirmRequest(id, session, callback) {
        try {
            let sql = squel.select().field('TeacherID').from('request').where('ID = ?', id);
            db.query(sql.toString(), function (err, row) {
                if (err) throw err;
                if (session.userID == row[0].TeacherID) {
                    sql = squel.update().table('requests').set('Confirmed = 1').where('ID = ?', id);
                    db.query(sql.toString(), function (err) {
                        if (err) throw err;
                        callback(true);
                    });
                } else callback(false);
            });

        } catch (err) {
            console.log(err);
            callback(false);
        }
    }

}

module.exports = model;