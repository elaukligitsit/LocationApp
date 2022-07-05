var express = require('express'); //Ensure our express framework has been added
var bodyParser = require('body-parser'); //Ensure our body-parser tool has been added
var session = require('express-session');
var bcrypt = require('bcrypt');
var { errors } = require('pg-promise');
var flash = require("connect-flash");
var router = express.Router();
var xml = require('xml');
var path = require('path');

var app = express();

/**********************
  Database Connection information
  host: This defines the ip address of the server hosting our database.
  port: This defines what port we can expect to communicate to our database.
  database: This is the name of  database. 
  user: default postgres username
  password: This the password for accessing the database. 

  access to db for testing:  docker-compose exec db psql -U postgres
**********************/
//Create Database Connection
var pgp = require('pg-promise')();

const dev_dbConfig = {
 	host: 'db',
 	port: 5432,
 	database: 'users_db',
 	user:  'postgres',
 	password: 'pwd'
};

/** If we're running in production mode (on heroku), the we use DATABASE_URL
  * to connect to Heroku Postgres.
*/
const isProduction = process.env.NODE_ENV === 'production';
const dbConfig = isProduction ? process.env.DATABASE_URL : dev_dbConfig;

// Heroku Postgres patch for v10
// fixes: https://github.com/vitaly-t/pg-promise/issues/711
if (isProduction) {
    pgp.pg.defaults.ssl = {rejectUnauthorized: false};
}

var db = pgp(dbConfig);


/**********************
 
    Middleware section

**********************/

app.use(express.json());
app.use(bodyParser.json());  // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: false })); // support encoded bodies
app.use(express.urlencoded({ extended: true }));



// set the view engine to ejs
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));
app.use(express.static(__dirname + '/'));// use relative paths and access resources directory

const TWO_HOURS = 1000 * 60 * 60 * 2;

// session information
const {
    PORT = 3000,
    NODE_ENV = 'development',
    SESS_NAME = 'sid',
    SESS_LIFETIME = TWO_HOURS,
    SESS_SECRET = 'keyboardcat'
} = process.env;

const IN_PROD = NODE_ENV === 'production' ? true : false;

// Session middleware
app.use(session({
    name: SESS_NAME,
    resave: false,
    saveUnititialized: true,
    secret: SESS_SECRET,

    cookie: {
        maxAge: SESS_LIFETIME,
        sameSite: true,
        secure: false,
        httpOnly: false,
        expires: new Date(Date.now() + SESS_LIFETIME) 
    }
}));

app.set('trust proxy', true);

// connect flash middleware
app.use(flash());

app.use(function(req, res, next){
    res.locals.flash = req.flash;
    next();
})

// redirects a user to login page if they attempt to 
// access a feature that requires sign in and a session id
const redirectLogin = (req, res, next) => {
    if(!req.session.userid){
        console.log('No active session, redirecting to login');
        res.render('pages/loginpage',{
            local_css:"loginpage.css",
            my_title:"Login Page",
            error: true,
            message: 'You need to sign in to access this feature! If you dont have an account, click register to sign up.',
            loggedin: false
        });
    }
    else{
        console.log('Session active');
        next();
    }
}

//redirects a logged in user to homepage if they try to access login page or register page
const redirectHome = (req, res, next) => {
    if(req.session.userid){
        console.log('Session exists, redirecting to home');
        res.render('pages/homepage',{
            local_css:"",
            my_title:"Home Page",
            error: false,
            message: '',
            loggedin: true
        });
    }
    else{
        console.log('no active session');
        next();
    }
}

const checkLoginForLikes = (req, res, next) =>{
    if(req.session.userid){
        res.redirect('back');
        res.send({message: 'You are not logged in!'})
    }
    else{
        console.log('not logged in');
        next();
    }
}




/**********************
    
    Callbacks and Requests
    These handle db queries, page loading, and form requests, etc
    formatted using pg-promise to query database


    loggedin field REQUIRED to load menu! if false: login button || if true: logout button
    error field REQUIRED!
    message field REQUIRED!
    my_title field only required when partials/header is fully implemented
    

**********************/
// home page 
app.get('/', function(req, res) {
	res.render('pages/homepage',{
		local_css:"",
		my_title:"Home Page",
        error: false,
        message: '',
        loggedin: false
	});
});

// home page 
app.get('/homepage', redirectHome, function(req, res) {
    console.log('req.session.userid: ', req.session.userid);
    console.log(req.session);
	res.render('pages/homepage',{
		local_css:"",
		my_title:"Home Page",
        error: false,
        message: '',
        loggedin: false
	});
});

app.get('/about', function(req, res) {
    var isloggedin;  // loggedin field REQUIRED to load menu. if false: login button || if true: logout button
    if(req.session.userid){
        isloggedin = true;
    }
    else{
        isloggedin = false;
    }
	res.render('pages/about',{
		local_css:"",
		my_title:"About Page",
        error: false,
        message: '',
        loggedin: isloggedin
	});
});

// login page get request (loads login page)
app.get('/loginpage', redirectHome, function(req, res) {
	res.render('pages/loginpage',{
		local_css:"loginpage.css",
		my_title:"Login Page",
        error: false,
        message: '',
        loggedin: false
	});
});

// load regstration page
app.get('/register', redirectHome, function(req, res) {
	res.render('pages/register',{
		local_css:"loginpage.css",
		my_title:"Register Page",
        error: false,
        message: '',
        loggedin: false
	});
});

// map page
// app.get('/engMap', function(req, res) {
// 	res.render('pages/engMap',{
// 		local_css:"EngineeringMap.css",
// 		my_title:"Map Test",
//         loggedin: false
// 	});
// });
const ops = [];
for (var i = 0; i < 1000; i++) {
     ops.push ({id: i,},);
}

app.get("/locations", (request, response) => {
response.send(ops);
});

app.get('/locations/:id', function(req,res) {
    
    var isloggedin;  // loggedin field REQUIRED to load menu. if false: login button || if true: logout button
    if(req.session.userid){
        isloggedin = true;
    }
    else{
        isloggedin = false;
    }

    const id = req.params.id;
	var locName = `SELECT nameLoc FROM locations WHERE location_id = '${id}';`;
	var zoom = `SELECT zoom FROM locations WHERE location_id = '${id}';`;
	var lats = `SELECT lats FROM locations WHERE location_id = '${id}';`;
	var longs = `SELECT longs FROM locations WHERE location_id = '${id}';`;
    var commentQ = `SELECT * FROM comments WHERE location_id = '${id}';`; 
    var blurb = `SELECT blurb FROM locations WHERE location_id = '${id}';`;
	db.task('get-everything', task => {
		return task.batch([
			task.any(locName),
			task.any(zoom),
			task.any(lats),
            task.any(longs),
            task.any(commentQ),
            task.any(blurb),
		]);
	})
        
    .then(info => {
            console.log(info[0][0]);
            console.log(info[1][0]);
            console.log(info[2][0]);
            console.log(info[3][0]);
            console.log(info[4]);
            console.log(info[5][0]);
            
		res.render('pages/indLoc',{
            local_css:"EngineeringMap.css",
            loc_ID: id,
			my_title: info[0][0],
            location_name:[0][0],
			zoom1: info[1][0],
			lats1: info[2][0],
			longs1: info[3][0],
            comments: info[4],
            message: info[5][0],
            error: false,
            loggedin: isloggedin  // loggedin field REQUIRED to load menu. if false: login button || if true: logout button
		})
        
	})
	.catch(err => {
		console.log('error',err);
		res.render('pages/indLoc', {
            local_css:"EngineeringMap.css",
			my_title: 'location not found',
			zoom1: '',
			lats1: '',
			longs1: '',
            comments: '',
            message: 'could not load',
            error: false,
            loggedin: isloggedin  // loggedin field REQUIRED to load menu. if false: login button || if true: logout button
		})
	})
});


app.get('/engMap', function(req,res) {
    var isloggedin;  // loggedin field REQUIRED to load menu. if false: login button || if true: logout button
    if(req.session.userid){
        isloggedin = true;
    }
    else{
        isloggedin = false;
    }

    var select = req.body.search;
	var locName = `SELECT nameLoc FROM locations WHERE nameLoc = 'Home Test';`;
	var zoom = `SELECT zoom FROM locations WHERE nameLoc = 'Home Test';`;
	var lats = `SELECT lats FROM locations WHERE nameLoc = 'Home Test';`;
	var longs = `SELECT longs FROM locations WHERE nameLoc = 'Home Test';`;
	db.task('get-everything', task => {
		return task.batch([
			task.any(locName),
			task.any(zoom),
			task.any(lats),
            task.any(longs),
		]);
	})       
    .then(info => {
            console.log(info[0]);
            console.log(info[1][0]);
        console.log(info[2][0]);
        console.log(info[3][0]);
            
		res.render('pages/engMap',{
			loc_name: info[0],
			zoom1: info[1][0],
			lats1: info[2][0],
			longs1: info[3][0],
            message: '',
            error: false,
            loggedin: isloggedin  // loggedin field REQUIRED to load menu. if false: login button || if true: logout button
		})
        
	})
	.catch(err => {
		console.log('error',err);
		res.render('pages/engMap', {
			loc_name: 'location not found',
			zoom1: '',
			lats1: '',
			longs1: '',
            message: '',
            error: false,
            loggedin: isloggedin  // loggedin field REQUIRED to load menu. if false: login button || if true: logout button
		})
	})
});

app.get('/homeMap', function(req, res) {
    var load = "SELECT * FROM comments;";
    var location = `SELECT * FROM locations WHERE location_id = 2;`
    var isloggedin;
    if(req.session.userid){
        isloggedin = true;
    }
    else{
        isloggedin = false;
    }  
    db.task('get-everything', task => {  // comments table reloaded with new comment at bottom
		return task.batch([
			task.any(load),
			task.any(location)
		]);
	}) 
    .then(comments =>{
        res.render('pages/homeMap',{
            local_css:"EngineeringMap.css",
            my_title: 'Map Test',
            comments: comments[0],
            location: comments[1],
            error: false,
            message: '',
            loggedin: isloggedin  // loggedin field REQUIRED to load menu. if false: login button, if true: logout button
        })
    })
    .catch(err =>{  // throws error in console if reload query is unsuccessful
        console.log(err);
        res.render('pages/homeMap',{
            local_css:"EngineeringMap.css",
            my_title: 'Map Test',
            comments: '',
            error: true,
            message: 'Comments could not be loaded',
            loggedin: isloggedin
        })
    })
});


// search for comments, called when user hits submit
app.get('/search', function (req, res) {
    var commentQuery = `SELECT * FROM comments WHERE UPPER(comment) LIKE UPPER('%${req.query.comments}%')`;
    var location = `SELECT * FROM locations WHERE UPPER(nameloc) LIKE UPPER('%${req.query.comments}%')`;
    
    // checks for valid session id (if user has logged in)
    // loggedin field REQUIRED to load menu. if false: login button || if true: logout button
    var isloggedin;
    if(req.session.userid){
        isloggedin = true;
    }
    else{
        isloggedin = false;
    }
    if(req.query.comments){
        db.task('get-everything', task => {
            return task.batch([
                task.any(commentQuery),
                task.any(location),
            ]);
        }) 
        .then(info => { // load search results (currently redirects to searchTest)
            res.render('pages/search', {
                local_css: "EngineeringMap.css",
                my_title: "Search Test",
                key: req.query.comments,
                comments: info[0],
                locations: info[1],
                message: '',
                error: false,
                loggedin: isloggedin  // loggedin field REQUIRED to load menu. if false: login button || if true: logout button
            })
        })
        .catch(err => {  // query error thrown if backend error occurs 
            console.log(err);
            res.render('pages/search', {
                local_css: "EngineeringMap.css",
                my_title: "Search Test",
                key: '',
                comments: '',
                locations: '',
                message: 'Could not load comments or locations',
                error: true,
                loggedin: isloggedin
            });

        })
    }
    // error thrown if user searches without typing in the search bar
    else {
        res.render('pages/search', {
            local_css: "EngineeringMap.css",
            my_title: "Search Test",
            key: '',
            comments: '',
            locations: '',
            message: 'Could not find any results! Try using a different search term.',
            error: true,
            loggedin: isloggedin
        });
    }
});

app.get('/allLocations', function (req, res) {
    var location = 'SELECT * FROM locations';
    
    // checks for valid session id (if user has logged in)
    // loggedin field REQUIRED to load menu. if false: login button || if true: logout button
    var isloggedin;
    if(req.session.userid){
        isloggedin = true;
    }
    else{
        isloggedin = false;
    }

        db.task('get-everything', task => {
            return task.batch([
                task.any(location),
            ]);
        }) 
        .then(info => { // load search results (currently redirects to searchTest)
            res.render('pages/allLocations', {
                my_title: "All Locations",
                key: req.query.comments,
                locations: info[0],
                message: '',
                error: false,
                loggedin: isloggedin  // loggedin field REQUIRED to load menu. if false: login button || if true: logout button
            })
        })
        .catch(err => {  // query error thrown if backend error occurs 
            console.log(err);
            res.render('pages/allLocations', {
                my_title: "All Locations",
                key: '',
                comments: '',
                locations: '',
                message: 'Could not load comments or locations',
                error: true,
                loggedin: isloggedin
            });

        })
    // error thrown if user searches without typing in the search bar

});

// increment like of comment in database
app.put('/likeComment/:id', async (req,res) => {
    // get comment id from url above
    var id_ = req.params.id;
    var addLike = `UPDATE comments SET likes= likes + 1 WHERE comment_id= '${id_}';`;
    var addLike2 = `UPDATE comments SET likes= likes + 2 WHERE comment_id= '${id_}';`;
    var reload = `SELECT likes FROM comments WHERE comment_id= '${id_}';`;
    var addLikeToUser = `UPDATE users SET liked_comments= array_append(liked_comments, '${id_}') WHERE username='${req.session.userid}';`;
    var removeFromUser = `UPDATE users SET disliked_comments= array_remove(disliked_comments, ${id_})  WHERE username='${req.session.userid}';`;
    var checkUserLike = `SELECT comment_id FROM comments WHERE ${id_} IN (SELECT UNNEST(liked_comments) FROM users WHERE username='${req.session.userid}');`;
    var checkUserDislike = `SELECT comment_id FROM comments WHERE ${id_} IN (SELECT UNNEST(disliked_comments) FROM users WHERE username='${req.session.userid}');`;
    
    // check for user likes and dislikes
    await db.task('like', task =>{
        return task.manyOrNone(checkUserLike)  // get likes from user
        .then(check =>{
            console.log(check);
            if(check == ''){ // check if user has NOT liked the post
                return task.manyOrNone(checkUserDislike) // get dislikes from user
                .then(check => {
                    if(check != ''){  // check if the user HAS disliked the post
                        return task.any(addLike2)  // increment comment likes by 2
                        .then(data => {
                            console.log('like counter +2');
                            return task.any(reload)
                            .then(data =>{
                                console.log(data);
                                res.send(data[0].likes.toString()); // send updated like count to badge on webpage frontend
                                return task.any(removeFromUser)
                                .then(data =>{
                                    console.log('removed dislike from user');
                                    return task.any(addLikeToUser) // add like to array in users
                                    .then(data =>{
                                        console.log('like added'); 
                                    })
                                })
                            })     
                        })
                    }
                    else{
                        return task.any(addLike)    // increment comment likes by 1
                        .then(data => {
                            console.log('like counter +1');
                            return task.any(reload)
                            .then(data =>{
                                console.log(data);
                                res.send(data[0].likes.toString());  // send updated like count to badge on webpage frontend
                                return task.any(addLikeToUser) // add comment id to likes array in users
                                .then(data =>{
                                    console.log('like added'); 
                                })
                            })
                        })
                    }
                })
            }
            else{ // already disliked, do nothing
                console.log('already liked');
            }
        })
    })
    .then(check =>{
        console.log('sucess');
    })
    .catch(err =>{
        console.log('failure: ', err);
    })
})

// decrement dislike of comment in database
app.put('/dislikeComment/:id', async (req,res) => {
    var id_ = req.params.id;
    var dislike = `UPDATE comments SET likes= likes - 1 WHERE comment_id= '${id_}';`;
    var dislike2 = `UPDATE comments SET likes= likes - 2 WHERE comment_id= '${id_}';`;
    var reload = `SELECT likes FROM comments WHERE comment_id= '${id_}';`;
    var addDislikeToUser = `UPDATE users SET disliked_comments= array_append(disliked_comments, '${id_}') WHERE username='${req.session.userid}';`;
    var removeFromUser = `UPDATE users SET liked_comments= array_remove(liked_comments, ${id_})  WHERE username='${req.session.userid}';`;
    var checkUserLike = `SELECT comment_id FROM comments WHERE ${id_} IN (SELECT UNNEST(liked_comments) FROM users WHERE username='${req.session.userid}');`;
    var checkUserDislike = `SELECT comment_id FROM comments WHERE ${id_} IN (SELECT UNNEST(disliked_comments) FROM users WHERE username='${req.session.userid}');`;

    await db.task('dislike', task =>{
        return task.manyOrNone(checkUserDislike)  // get dislikes from user
        .then(check =>{
            console.log(check);
            if(check == ''){ // check if user has NOT disliked the post
                return task.manyOrNone(checkUserLike) // get likes from user
                .then(check => {
                    if(check != ''){  // check if the user HAS liked the post
                        return task.any(dislike2)  // decrement comment likes by 2
                        .then(data => {
                            console.log('like counter -2');
                            return task.any(reload)
                            .then(data =>{
                                console.log(data);
                                res.send(data[0].likes.toString()); // send updated like count to badge on webpage frontend
                                return task.any(removeFromUser)
                                .then(data =>{
                                    console.log('removed like from user');
                                    return task.any(addDislikeToUser) // add dislike to array in users
                                    .then(data =>{
                                        console.log('dislike added'); 
                                    })
                                })
                            })     
                        })
                    }
                    else{
                        return task.any(dislike)    // decrement comment likes by 1
                        .then(data => {
                            console.log('like counter -1');
                            return task.any(reload)
                            .then(data =>{
                                console.log(data);
                                res.send(data[0].likes.toString());  // send updated like count to badge on webpage frontend
                                return task.any(addDislikeToUser) // add comment id to dislikes array in users
                                .then(data =>{
                                    console.log('dislike added'); 
                                })
                            })
                        })
                    }
                })
            }
            else{ // already disliked, do nothing
                console.log('already disliked');
            }
        })
    })
    .then(check =>{
        console.log('sucess');
    })
    .catch(err =>{
        console.log('failure: ', err);
    })
})

app.put('/addFavoriteComment/:id', async (req,res) => {
    var id_ = req.params.id;
    var fav = `UPDATE comments SET favorites= favorites + 1 WHERE comment_id= '${id_}';`;
    var unfav = `UPDATE comments SET favorites= favorites - 1 WHERE comment_id= '${id_}';`;
    var reload = `SELECT favorites FROM comments WHERE comment_id= '${id_}';`;
    var addFavorite = `UPDATE users SET favorite_comments= array_append(favorite_comments, '${id_}') WHERE username='${req.session.userid}';`;
    var removeFromUser = `UPDATE users SET favorite_comments= array_remove(favorite_comments, ${id_})  WHERE username='${req.session.userid}';`;
    var checkFav = `SELECT comment_id FROM comments WHERE ${id_} IN (SELECT UNNEST(favorite_comments) FROM users WHERE username='${req.session.userid}');`
    await db.any(checkFav)
    .then(status =>{
        console.log(status);
        if(status == ''){
            db.any(addFavorite)
            .then(sucess => {
                console.log('add sucess: ', sucess);
                console.log('sucessfully added favorite to user table!');
            })
            .catch(err =>{
                console.log(err);
            })
            db.any(fav)
            .then(info => {
                console.log(info);
                db.any(reload)
                .then(data => {
                    console.log('reload: ', data);
                    // send data back to webpage
                    res.send(data[0].favorites.toString());
                })
                .catch(err => {
                    console.log(err);
                })
            })
            .catch(err => {
                console.log(err);
            })
        }
        else{
            console.log('Already favorited! Removing favorite from DB');
            db.any(removeFromUser)
            .then(sucess => {
                console.log('sucessfully removed favorite');
            })
            .catch(err =>{
                console.log(err);
            })
            db.any(unfav)
            .then(info => {
                db.any(reload)
                .then(data => {
                    // send data back to webpage
                    res.send(data[0].favorites.toString());
                })
                .catch(err => {
                    console.log(err);
                })
            })
            .catch(err => {
                console.log(err);
            })
        }
    })
    .catch(err =>{
        console.log(err);
    })
})

// queries database for username, email, and password submitted by user on login page
app.post('/login', (req, res) => {
    var email = req.body.email;
    var password = req.body.password;
    var queryE = "SELECT username, email, password FROM users WHERE email=  '"+email+"';";

    db.one(queryE)
    .then(info => {
        // store query result 
        //  info.password gets password string from password field of SQL query result
        //  this temp var exists to test var allocation within promise...       .then(...=>{})
        var hash = info.password;
        
        // compare hashed password in database to user submitted password
        //  returns true: user login successful, redirects to home
        //  returns false: throws 'incorrect password' alert, reloads lofin page
        bcrypt.compare(password, hash)
        .then(data => {
            console.log(data);
            if(!data){
                res.render('pages/loginpage',{
                    local_css:"loginpage.css",
                    my_title:"Login Page",
                    error: true,
                    message: 'Incorrect Password!',
                    loggedin: false
                });
            }
            else{
                // creates a unique session id using a user's username
                req.session.userid = info.username;
                req.session.save(err =>{
                    res.render('pages/homepage',{
                        local_css:"",
                        my_title:"Home Page",
                        error: false,
                        message: '',
                        loggedin: true  // logged in is now true, logout button will show in nav bar
                    });
                })
                .catch(err => {
                    console.log(err);
                })
                console.log('sess id: ', req.session.userid);
                console.log( req.session);
                
            }
        })
        .catch(err => {
            console.log(err);
        })
    })
    .catch((err) => {
        console.log(err);
        res.render('pages/loginpage',{
            local_css:"loginpage.css",
            my_title:"Login Page",
            error: true,
            message: 'Email is incorrect or not registered!',
            loggedin: false
        });
    });
});


// post request for registration
// inserts registration info into users table in user_db
// throws errors if username or email aleady exist
// redirects to login page and throws success alert if registration is successful
app.post('/register', async (req, res) => {
    var username = req.body.username;
    var email = req.body.email;
    var password = req.body.password;
    var userExists = "SELECT username FROM users WHERE username= '"+username+"';";
    var emailExists = "SELECT email FROM users WHERE email= '"+email+"';";

    //encrypt user password before entering it into database
    //  TODO:  add salt to password for extra layer of security
    let hashedPassword = await bcrypt.hash(password, 10);

    var insert = "INSERT INTO users(username, email, password) VALUES('"+username+"', '"+email+"', '"+hashedPassword +"');";
    
    // query db to check if user exits
    db.task('check-if-user-exists', task => {
		return task.batch([
			task.any(userExists),
			task.any(emailExists)
		]);
	})
    .then(info => {
        console.log(info[0]);
        console.log(info[1]);

        // if query returns a username in first array index, username already exists
        //  this block throws error message and reloads register page
        if(info[0] != ''){
            res.render('pages/register', {
                my_title: "Registration Page",
                error: true,
                message: 'This username is already registered',
                loggedin: false
            })
        }
        // if the query doent return empty string (returns an email address string)
        //  the email is already registered: reloads register page and throws error message
        else if(info[1] != ''){
            res.render('pages/register', {
                my_title: "Registration Page",
                error: true,
                message: 'This email is already registered',
                loggedin: false
            })
        }
        else{  // if no existing username or email found in DB, run query with @param insert declared above
            console.log(hashedPassword);
            db.any(insert)
            .then(function () {
                res.render('pages/loginpage',{
                    my_title: "Login Page",
                    data: '',
                    error: false,
                    message: 'Thank you for registering! Please log in',
                    loggedin: false
                })
            })
            .catch(error => { // throws error if insert was unsuccessful
                console.log(error);
                res.render('pages/register', {
                    my_title: 'Registration Page',
                    data: '',
                    error: true,
                    message: error,
                    loggedin: false
                })
            })
        }
    })
    .catch(err => {
        console.log(err);
    })
});

// load temporary comments page 
// This page is a testing environment for our comment featurs]
// ...will be integrated into homepage and map page 
// pull comments from db and populate table when page loads
app.get('/temp_comments', (req, res) => {
	var load = "SELECT * FROM comments;";

    var isloggedin;
    if(req.session.userid){
        isloggedin = true;
    }
    else{
        isloggedin = false;
    }
    
	db.any(load)  // comments table reloaded with new comment at bottom
    .then(comments =>{
        //console.log(comments);
        res.render('pages/temp_comments',{
            my_title: "Comment Page",
            comments: comments,
            error: false,
            message: '',
            loggedin: isloggedin  // loggedin field REQUIRED to load menu. if false: login button || if true: logout button
        })
    })
    .catch(err =>{  // throws error in console if reload query is unsuccessful
        console.log(err);
        res.render('pages/temp_comments',{
            my_title: 'Comment Page',
            comments: '',
            error: true,
            message: 'Comments could not be loaded',
            loggedin: isloggedin
        })
    })
});


// called when user submits a comment.  
// Inserts comment and username into comments table in DB, 
// then requeries to add new comment to UI table
// if user is not logged in (no session id exists), redirect to login page
app.post('/post_comments/:id', redirectLogin, (req, res) =>{
    var newComment = req.body.comments;
    var username = req.session.userid;
    var locationID = req.params.id;
    console.log("locationID:");
    console.log(locationID);
    var reload = `SELECT * FROM comments;`;
    var getLocationName = `SELECT nameloc FROM locations WHERE location_id= ${locationID};`;
    // if comment is not empty, insert it into database and reload page
    // new comment will be appended to the bottom
    if(newComment != '' || newComment != ' ' || newComment.length > 3){
        db.any(getLocationName)
        .then(data => {
            console.log(data);
            db.any(`INSERT INTO comments(location_id, location_name, username, comment, likes, dislikes, favorites) VALUES('${locationID}', '${data[0].nameloc}', '${username}', '${newComment}', '${0}', '${0}', '${0}');`)  // new comment and username added to comments table
            .then(info => {
                console.log('successfully added comment');
                db.any(reload)  // comments table reloaded with new comment at bottom
                .then(comments =>{
                    res.redirect('back');
                })
                .catch(err =>{  // throws error in console if reload query is unsuccessful
                    console.log(err);
                    res.redirect('back');
                })
            })
            .catch(err => { // throws error of insert query is unsuccessful
                console.log(err);
                res.redirect('back');
            })
        })
        .catch(err =>{
            console.log(err);
            res.redirect('back');
        })
    }
    // If user tries to submitt an empty comment, warning message thrown and page is reloaded
    else{
        db.any(reload)  // comments table reloaded with new comment at bottom
        .then(comments =>{
            res.redirect('back');
        })
        .catch(err =>{  // throws error in console if reload query is unsuccessful
            console.log(err);
            res.redirect('back');
        })
    }
});


app.get('/userLikes', redirectLogin, (req, res) => {
    var username = req.session.userid;
    var getlikes = `SELECT unnest(liked_comments) FROM users WHERE username='${username}'`;
    var getcomments = `SELECT * FROM comments WHERE comment_id IN (${getlikes});`;

    db.any(getcomments)
    .then(result => {
        console.log(result);
        res.render('pages/userLikes',{
            local_css:"",
            my_title:"Home Page",
            comments: result,
            error: false,
            message: 'Comments retrieved',
            loggedin: true
        });
    })
    .catch(err => {
        console.log(err);
        res.render('pages/homepage',{
            local_css:"",
            my_title:"Home Page",
            comments: '',
            error: true,
            message: 'Cannot load liked comments!',
            loggedin: true
        });
    })
});

app.get('/favorites', redirectLogin, (req, res) => {
    var username = req.session.userid;
    var getfav = `SELECT unnest(favorite_comments) FROM users WHERE username='${username}'`;
    var getcomments = `SELECT * FROM comments WHERE comment_id IN (${getfav});`;

    db.any(getcomments)
    .then(result => {
        console.log(result);
        res.render('pages/favorites',{
            local_css:"",
            my_title:"Favorites Page",
            comments: result,
            error: false,
            message: 'favorites retrieved',
            loggedin: true
        });
    })
    .catch(err => {
        console.log(err);
        res.render('pages/homepage',{
            local_css:"",
            my_title:"Home Page",
            error: true,
            message: 'Cannot load liked comments!',
            loggedin: true
        });
    })
});

app.get('/profile', redirectLogin, (req, res) => {
    var username = req.session.userid;
    var posts = `SELECT * FROM comments WHERE username='${username}'`;

    db.any(posts)
    .then(data =>{
        console.log(data);
        res.render('pages/profile', {
            local_css:"",
            my_title:"Profile Page",
            comments: data,
            error: false,
            message: 'favorites retrieved',
            loggedin: true
        })
    })
    .catch(err => {
       console.log(err);
    })
})



// the logout button in the nav bar is only vivible when a user is logged in
// this request is called when a user clicks logout
// three layers of protection to ensure a user who is not signed in cant attempt to logout (this scenario would throw wild errors)
//      1: logout button hidden unless user is signed in
//      2: redirectLogin function called, redirects to homepage if user is not signed in
//      3: if non-logged in user happens to get past first 2 layers, error thrown and user redirected to homepage
app.get('/logout', redirectLogin, (req, res) => {
    console.log('Session to be destroyed: ', SESS_NAME, ' id: ', req.session.userid);
    req.session.destroy(err => {
        if(err){
            // this block should never be entered because logout button is not visible to users who arent logged in
            // this is here to ensure a user wont break site should they happen to click logout when not logged in
            res.render('pages/homepage',{ 
                local_css:"",
                my_title:"Home Page",
                error: true,
                message: 'Cannot logout, you are not logged in!',
                loggedin: false
            });
        }
        else{ // session cookie cleared and user redirected to login page
            res.clearCookie(SESS_NAME);
            console.log('Session Destroyed');
            res.render('pages/loginpage',{
                local_css:"loginpage.css",
                my_title:"Login Page",
                error: false,
                message: '',
                loggedin: false
            });
        }
    })
})

const server = app.listen(process.env.PORT || 3000, () => {
    console.log(`Express running → PORT ${server.address().port}`);
});
