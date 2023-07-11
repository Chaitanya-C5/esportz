//const cors = require('cors');
// https://weak-rose-springbok-tutu.cyclic.app/Sign_up_page.html

require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const bodyParser = require('body-parser');
const { createConnection } = require('net');
const nodemailer = require('nodemailer');
const { EventEmitter } = require('events');

const mysql = require('mysql');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const multer = require('multer');
const path = require('path');

// Loading environment variables
const dbHost = process.env.DB_HOST;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbDatabase = process.env.DB_DATABASE;
const dbPort = process.env.PORT || 3000;

class MyEmitter extends EventEmitter {}

const myEmitter = new MyEmitter();

const app = express(); 

const db = mysql.createConnection({
    host: dbHost,
    user: dbUser,
    password: dbPassword,
    database: dbDatabase
});

db.connect((err) =>{
    if(err){
        console.log(err);
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

// Rest of the code...
// const db = mysql.createConnection({
    //          host:"sql108.infinityfree.com",
    //          user:"if0_34384390",
    //          password:"atae45WRq9ij",
    //          database:"if0_34384390_esportz"
    //     });

// });


// app.get('/',(req,res)=>{
//     let sql = "CREATE DATABASE esportz";
//     db.query(sql,(err,result)=>{
//         if(err) throw err;
//         console.log("Database created");
//         res.send("Database created");
//     });
// });

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use(express.static('./'));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true,
    store: sessionStore,
    cookie: { secure: false }
  }));

  var flag = false;

app.post('/submit-form', function(req, res) {
    const formData = req.body;

    let sql = `SELECT * FROM signup where username = '${formData.name}' or email = '${formData.email}'`;

    db.query(sql,(err,result)=>{
        if(err){
            console.log(err);
        }
        else
        {
            if(result.length === 0) 
            {
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
                const obj = {
                    code: 1,
                    message: formData.email
                };
                res.send({obj});
            }
            else
            {
                const obj = {
                    code: 2,
                    message:"Username or Email already exists"
                };
                res.send(obj);
            }
        }
    });
  

    
  });


app.post("/loginuser", function(req, res) {
    const fd = req.body;

    let sql = `SELECT * FROM signup WHERE email = '${fd.email}'`;
    db.query(sql,(err,result) => {
        if(err) throw err;
        console.log(result);

        if(result.length === 0) res.send("<html><body><center> <h1> INVALID </h1> </center></body></html>");
        else 
        {
            console.log(result[0].password," ",fd.password);
            if(result[0].password === fd.password)
            {
                req.session.isLoggedIn = true;
                req.session.username = result[0].username;
                req.session.email = fd.email;
                req.session.role = result[0].role;
                req.session.sport = result[0].favsport.toLowerCase();
                flag  = true;
                

                if(req.session.role === "coach")
                    res.sendFile(__dirname+ '/coach_page.html');
                else
                    res.sendFile(__dirname+ '/index2.html');
            }
            else
            {
                res.send("<html><body><center> <h1> INVALID </h1> </center></body></html>");
            }
        }
    });

});

app.post('/submit-lform', function(req, res) {
    const fd = req.body;

    let sql = `SELECT * FROM signup WHERE email = '${fd.email}'`;
    db.query(sql,(err,result) => {
        if(err) throw err;
        console.log(result);

        if(result.length === 0) res.send({message: "Invalid"});
        else 
        {
            if(result[0].password === fd.password)
            {
                req.session.isLoggedIn = true;
                req.session.username = result[0].username;
                req.session.email = fd.email;
                req.session.role = result[0].role;
                req.session.sport = result[0].favsport.toLowerCase();
                flag  = true;
                //console.log(result[0]);
                res.send({message: result[0].role});
            }
            else
            {
                res.send({message: "Invalid"});
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
    if(req.session.isLoggedIn === false) {

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
        try {
            const title = req.body.title;
            const description = req.body.description;
            const filename = req.file.filename;
        
            // Insert video metadata into database
            let sql = `INSERT INTO videos (username, sport, title, description, filename) VALUES (?, ?, ?, ?, ?)`;
            db.query(sql, [req.session.username, req.session.sport, title, description, filename], function(err, result) {
                if (err) throw err;
                console.log('Video uploaded successfully!');
        
                // Check if there are members associated with the coach
                let sql2 = 'SELECT COUNT(*) AS memberCount FROM members WHERE coach_username = ?';
                db.query(sql2, [req.session.username], (err, result) => {
                if (err) throw err;
        
                    if (result[0].memberCount === 0) {
                        console.log("No members");
                        const data = {
                        flag: false
                        };
                        res.send(data);
                    } 
                    else 
                    {
                        // Retrieving emails of members associated with the coach
                        let sql1 = `SELECT stud_email FROM members WHERE coach_username = '${req.session.username}'`;
                        db.query(sql1, (err, result) => {
                            if (err) throw err;
                
                            const emails = result.map((row) => row.stud_email);
                
                            const data = {
                                flag: true,
                                uname: req.session.username,
                                emails: emails
                            };
            
                            res.send(data);
                        });
                    }
                });
            });
        } 
        catch (error) {
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
            let sql2 = `INSERT INTO members (coach_username, stud_username, stud_email) VALUES (?, ?, ?)`;
            db.query(sql2,[coach,stud_name,req.session.email], (err,result) =>{
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

app.post('/sendmsg', (req,res)=>{
    let msg = req.body.msg;
    
    let sql = `INSERT INTO messages (stud_username,coach_username,message) VALUES (?,?,?)`;
    db.query(sql,[req.session.username,req.session.cname,msg], (err,result)=>{
        if(err) throw err;

        console.log("Message Sent");
    });
});

app.post('/showdoubts', (req,res) =>{
    let sql = `SELECT * FROM messages where coach_username = '${req.session.username}'`;
    db.query(sql,(err,result) =>{
        if (err) throw err;

        console.log(result);
        res.json(result);
    });
});

app.post('/sendReply',(req,res) =>{
    let sql = `UPDATE messages SET reply = ? WHERE No = ?`;
    db.query(sql,[req.body.msg,req.body.id],(err,result)=>{
        if(err) throw err;

        console.log("Reply Sent");
    });
    // console.log(req.body.id);
});

app.post('/showreplies',(req,res)=>{
    const name = req.session.username;

    let sql = `SELECT * FROM messages where stud_username = '${name}'`;
    db.query(sql,(err,result)=>{
        if(err) console.log(err);

        console.log(result);
        res.json(result);
    });
});
  
app.get('/logout', (req, res) => {
    flag = false;
    req.session.destroy();
    res.redirect('/');
  });

app.listen(dbPort,() =>{
    console.log(`Server is successfully running on port ${dbPort}`);
});


// app.get('/data', (req, res) => {
//     const messages = ['Hello', 'World', 'from', 'EJS'];
//     res.render('indeex', { messages });
//   });

