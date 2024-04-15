const express = require('express');
const oracledb = require('oracledb');
const http = require('http');
const bcrypt = require('bcrypt');
const path = require("path");
const bodyParser = require('body-parser');
const users = require('./data').userDB;

const app = express();
const server = http.createServer(app);

app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname,'./public')));


app.get('/',(req,res) => {
    res.sendFile(path.join(__dirname,'./public/index.html'));
});

async function connectToDatabase() {
    try {
        const con = await oracledb.getConnection({
            user: "abigail.lin",
            password: "7yxtZs9hKMS0WxR0XV5MlrnE",
            connectString: "oracle.cise.ufl.edu:1521/orcl"
        });
        return con;
    } catch (error) {
        console.error("Error connecting to database:", error);
        throw error;
    }
}

app.get('/data', async (req, res) => {
    var startMonth = req.query.sm;
    var startYear = req.query.sy;
    var endMonth = req.query.em;
    var endYear = req.query.ey;
    var statesString = req.query.states;
    var ageRange = req.query.ageRange || null;

    var states = JSON.parse(statesString);

    let whereClause = "";

    if (states.length > 0) {
        whereClause = `(StateName IN ('${states.join("', '")}')`;
    }

    if (startYear < endYear) {
        whereClause += ` AND (YEARCOVID > ${startYear} AND YEARCOVID < ${endYear})`;
    } else if (startYear === endYear) {
        whereClause += ` AND (YEARCOVID = ${startYear} AND MONTHCOVID >= ${startMonth} AND MONTHCOVID <= ${endMonth})`;
    }

    whereClause += `)`;

    try {
        const con = await connectToDatabase();
        const query = ageRange ?
            `SELECT StateName, AgeRange, SUM(COVID19Deaths) AS TotalDeaths
             FROM "B.NAKASONE"."COVIDDEATHREPORT"
             WHERE ${whereClause} AND AgeRange = :ageRange
             GROUP BY StateName, AgeRange
             ORDER BY StateName, AgeRange` :
            `SELECT StateName, SUM(COVID19Deaths) AS TotalDeaths
             FROM "B.NAKASONE"."COVIDDEATHREPORT"
             WHERE ${whereClause}
             GROUP BY StateName`;
    
        const bindVars = {
            startYear: startYear,
            startMonth: startMonth,
            endYear: endYear,
            endMonth: endMonth,
            ...(ageRange && { ageRange })
        };
            
        states.forEach((state, index) => {
            bindVars[`state${index}`] = state;
        });
    
        const result = await con.execute(query, bindVars);
        await con.close();
        res.json(result);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/register', async (req, res) => {
    try{
        let foundUser = users.find((data) => req.body.email === data.email);
        if (!foundUser) {
    
            let hashPassword = await bcrypt.hash(req.body.password, 10);
    
            let newUser = {
                id: Date.now(),
                username: req.body.username,
                email: req.body.email,
                password: hashPassword,
            };
            users.push(newUser);
            console.log('User list', users);
    
            res.send("<div align ='center'><h2>Registration successful</h2></div><br><br><div align='center'><a href='./login.html'>login</a></div><br><br><div align='center'><a href='./registration.html'>Register another user</a></div>");
        } else {
            res.send("<div align ='center'><h2>Email already used</h2></div><br><br><div align='center'><a href='./registration.html'>Register again</a></div>");
        }
    } catch{
        res.send("Internal server error");
    }
});

app.post('/login', async (req, res) => {
    try{
        let foundUser = users.find((data) => req.body.email === data.email);
        if (foundUser) {
    
            let submittedPass = req.body.password; 
            let storedPass = foundUser.password; 
    
            const passwordMatch = await bcrypt.compare(submittedPass, storedPass);
            if (passwordMatch) {
                let usrname = foundUser.username;
                res.send(`<div align ='center'><h2>login successful</h2></div><br><br><br><div align ='center'><h3>Hello ${usrname}</h3></div><br><br><div align='center'><a href='./login.html'>logout</a></div>`);
            } else {
                res.send("<div align ='center'><h2>Invalid email or password</h2></div><br><br><div align ='center'><a href='./login.html'>login again</a></div>");
            }
        }
        else {
    
            let fakePass = `$2b$$10$ifgfgfgfgfgfgfggfgfgfggggfgfgfga`;
            await bcrypt.compare(req.body.password, fakePass);
    
            res.send("<div align ='center'><h2>Invalid email or password</h2></div><br><br><div align='center'><a href='./login.html'>login again<a><div>");
        }
    } catch{
        res.send("Internal server error");
    }
});


server.listen(3000, function(){
    console.log("server is listening on port: 3000");
});

//https://medium.com/swlh/basic-login-system-with-node-js-99acf02275b9