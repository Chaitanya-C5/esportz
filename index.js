const express = require('express');
const bodyParser = require('body-parser');
const { createConnection } = require('net');
const nodemailer = require('nodemailer');
const EventEmitter = require('node:events');
const mysql = require('mysql');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const multer = require('multer');
const path = require('path');
const cors = require('cors');

class MyEmitter extends EventEmitter {}

const myEmitter = new MyEmitter();

const app = express(); 
const port = 3000;

const db = mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"",
    database:"esportz"
});

db.connect((err) =>{
    if(err){
        console.log("Error");
    }
    else
    {
        console.log("Connection established");
    }
});

const sessionStore = new MySQLStore({
    expiration: 86400000 // session expiration time (ms)
  }, db);

// app.get('/',(req,res)=>{
//     let sql = "CREATE DATABASE esportz";
//     db.query(sql,(err,result)=>{
//         if(err) throw err;
//         console.log("Database created");
//         res.send("Database created");
//     });
// });

app.use(express.static('./'));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/vid.html');
});

app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true,
    store: sessionStore,
    cookie: { secure: false }
  }));

  var flag = false;

app.use(bodyParser.json());
//app.use(cors());

// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'ejs');

app.post('/submit-form', function(req, res) {
    const formData = req.body;
  

    db.query("INSERT INTO signup (username,email,password,phno,role,age,gender,country,favsport) VALUES (?,?,?,?,?,?,?,?,?)",
    [formData.name,formData.email,formData.password,formData.phone,formData.role,formData.age,formData.gender,
    formData.country,formData.favouriteSport],(err,result) =>{
        if(err) 
            myEmitter.emit('error', new Error('Something went wrong --Signup'));
        console.log("records inserted in signup"+result.affectedRows);

    });

    if(formData.role === "coach"){
        db.query("INSERT INTO coach (username,email,sport,achievements,bio) VALUES (?,?,?,?,?)",
            [formData.name,formData.email,formData.favouriteSport,"Enter your achievements","Enter your bio"],(err,result) =>{
                if(err)
                    myEmitter.emit('error', new Error('Something went wrong --coach'));
                console.log("records inserted in coach"+result.affectedRows);
            }
        );
    }
    res.send({message: formData.email});
  });


app.post('/submit-lform', function(req, res) {
    const fd = req.body;
    let sql = `SELECT * FROM signup WHERE email = '${fd.email}'`;
    db.query(sql,(err,result) => {

        if(err || result.length === 0)
        {
            res.send({ message: "Invalid , try to signup if you are a new user" });
        }
        else
        {
            let str = JSON.parse(JSON.stringify(result));
            let p1 = str[0].password;
        
            if(p1 !== fd.password) res.send({ message: "Incorrect password" });
            else
            {
                req.session.isLoggedIn = true;
                req.session.username = str[0].username;
                req.session.email = fd.email;
                req.session.role = str[0].role;
                req.session.sport = str[0].favsport.toLowerCase();
                flag  = true;
                res.send({message: req.session.role});
            }
        }

    });
});

app.post("/fetchName", function(req,res) {
    res.send({message: req.session.username});
})

app.post('/checkLogin', (req,res) => {
    
    if(req.session.isLoggedIn)
        res.send({ message: "true" });
    else
        res.send({ message: "false" });

});

app.post('/checkDB', (req,res) => {
    let name = req.body.uname;
    let sql = `SELECT username FROM signup where username = '${name}'`;
    db.query(sql,(err,result) =>{
        if(err) 
        {
            console.log("ERROR");
            throw err;
        }
        if(result.length === 0) res.send({ message: "false" });
        else res.send({ message: "true" });
    })
});

app.post('/profile', (req,res) => {
    if(flag === false) {
        res.send({ message: "Please login" });
    }
    else
    {
        let sql = `SELECT * FROM signup where email = '${req.session.email}'`;
            db.query(sql, (err,result)=>{
                if(err)
                {
                    myEmitter.emit('error', new Error('Something went wrong'));
                }
                else
                { 
                    let str3 = JSON.parse(JSON.stringify(result));
                    let msg = {name: req.session.username, email: str3[0].email, gender: str3[0].gender,
                            phno: str3[0].phno, country: str3[0].country, favsport: str3[0].favsport};  
                    if(req.session.role === "coach")
                    {
                        let sql1 = `SELECT achievements,bio FROM coach where username ='${req.session.username}'`;
                        db.query(sql1, (err,result)=>{
                            
                            let str4 = JSON.parse(JSON.stringify(result));
                            
                            msg.achievements = str4[0].achievements , msg.bio = str4[0].bio;
                            //res.send(msg);
                            res.send({ message: msg });
                        });  
                    }
                    else
                        res.send({ message: msg });
                }
            });
    }
    
});

app.post('/updateProfile', (req,res) => {
    let val = req.body;   

  const sql = 'UPDATE coach SET achievements = ?, bio = ? WHERE username = ?';
    const values = [val.achievements, val.bio, req.session.username];

    db.query(sql, values, function (err, result) {
        if (err) throw err;
        console.log(result.affectedRows + ' record(s) updated');
    });

    res.send({ message: "Successful" });
});

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        console.log(req.session.sport);
        const sport = req.session.sport;
        const uploadPath = `uploads/${sport}`;
        cb(null, uploadPath);
    },
    filename: function(req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
  });
  
  const upload = multer({ storage: storage });
  
  app.post('/upload', upload.single('video'), async (req, res) => {

    try 
    {
        const title = req.body.title;
        const description = req.body.description;
        const filename = req.file.filename;
        // Insert video metadata into database
        const sql = 'INSERT INTO videos (username, sport, title, description, filename) VALUES (?, ?, ?, ?, ?)';
        db.query(sql, [req.session.username, req.session.sport, title, description, filename], function(err, result) {
        if (err) throw err;
        console.log('Video uploaded successfully!');
        
        });

        let sql1 = `SELECT email FROM members where username = '${req.session.username}'`;
        
    }

    catch (error) 
    {
        console.error(error);
        res.status(500).send('Error uploading video!');
    }
});




app.get('/myvideos', (req, res) => 
{
    const uname =  req.session.username;
    const sport = req.session.sport;

    let sql = `SELECT * from videos where username = '${uname}'`;
    db.query(sql, (err,result) => 
    {
        if (err) {
            console.error(err);
            res.status(500).send('Error retrieving videos');
        } else {
            // Build an array of objects containing the video data and send it back to the client
            const videos = result.map(result => {
            const sport = result.sport.toLowerCase();
            return {
                title: result.title,
                description: result.description,
                filename: result.filename,
                url: `/uploads/${sport}/${result.filename}`
                };
            });
            console.log(videos);
            res.json(videos);
        }
    });
});


app.post('/sport', (req, res) =>{
    const fd = req.body;
    console.log(fd.value);

    req.session.curr_sport = fd.value;

    res.send({ message: fd.value });

});

app.post('/getSportName', (req,res) =>{
    
    //let sql = `SELECT * FROM coach where sport = '${req.session.curr_sport}'`;
    let sql = `SELECT coach.*, COUNT(members.coach_username) AS memberCount FROM coach LEFT JOIN members ON coach.username = members.coach_username WHERE coach.sport = '${req.session.curr_sport}' GROUP BY coach.username`;
    let data;
    db.query(sql,(err,result) =>{
        if(err) throw err;
        data = JSON.parse(JSON.stringify(result)); 
        res.send(data);  
    });
});

app.post('/clkd_sport', (req,res) => {
    req.session.clkd_sport = req.body.sport;
    req.session.cname = req.body.coach;

    console.log(req.session.clkd_sport + " " + req.session.cname);
    res.send("ok");
});

app.get('/coach_videos', (req, res) => 
{
    const uname =  req.session.cname;
    const sport = req.session.clkd_sport;

    let sql = `SELECT * from videos where username = '${uname}'`;
    db.query(sql, (err,result) => 
    {
        if (err) {
            console.error(err);
            res.status(500).send('Error retrieving videos');
        } else {
            console.log(result);
            // Build an array of objects containing the video data and send it back to the client
            const videos = result.map(result => {
            const sport = result.sport.toLowerCase();
            return {
                name: uname,
                title: result.title,
                description: result.description,
                filename: result.filename,
                url: `/uploads/${sport}/${result.filename}`
                };
            });
            console.log(videos);
            res.json(videos);
        }
    });
});

app.post('/teamup', (req, res) =>{
    const coach = req.body.coach_name;
    const stud_name = req.session.username;

    let sql1 = `SELECT COUNT(*) AS memberCount FROM members where coach_username = '${req.session.cname}' AND stud_username = '${req.session.username}'`;
    db.query(sql1,(err,result)=>{
        if(err) throw err;

        if(result[0].memberCount !== 0)
        {

            let delQuery = `DELETE FROM members where coach_username = '${req.session.cname}' AND stud_username = '${req.session.username}'`;
            db.query(delQuery, (err,result)=>{
                if(err) throw err;
            })

            res.send({message: "Already_Member"});
        }
        else
        {
            let sql2 = `INSERT INTO members (coach_username, stud_username) VALUES (?, ?)`;
            db.query(sql2,[coach,stud_name], (err,result) =>{
                if(err)
                {
                    console.error('Error retrieving team members count:', err);
                    res.status(500).json({ error: 'Failed to retrieve team members count' });
                }
                res.json({ message: 'Team up successful' });
            })
        }
            
    })  

    
});

app.post('/checkMember',(req,res)=>{
    let sql = `SELECT COUNT(*) AS memberCount FROM members where coach_username = '${req.session.cname}' AND stud_username = '${req.session.username}'`;
    db.query(sql,(err,result)=>{
        if(err) throw err;

        res.send({message: result[0].memberCount});
    })  
});

  
app.post('/logout', (req, res) => {
    flag = false;
    req.session.destroy();
    res.redirect('/');
  });

app.listen(port,() =>{
    console.log(`Server is successfully running on port ${port}`);
});


// app.get('/data', (req, res) => {
//     const messages = ['Hello', 'World', 'from', 'EJS'];
//     res.render('indeex', { messages });
//   });