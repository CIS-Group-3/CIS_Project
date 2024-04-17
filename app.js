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

app.get('/covid', async (req, res) => {
    console.log('Covid data request received:', req.query);

    try {
        const con = await connectToDatabase();
        var startMonth = req.query.sm;
        var startYear = req.query.sy;
        var endMonth = req.query.em;
        var endYear = req.query.ey;
        var statesString = req.query.states;
        var ageRange = req.query.ageRange || null;

        var states = JSON.parse(statesString);

        console.log("states are: "+states);

        const statePlaceholders = states.map((_, index) => `:state${index}`).join(', ');
    
        // Here we ensure the type of parameters are what we expect
        if (isNaN(startYear) || isNaN(startMonth) || isNaN(endYear) || isNaN(endMonth)) {
            return res.status(400).json({ error: "Invalid date parameters" });
        }
    
        if (!Array.isArray(states)) {
            return res.status(400).json({ error: "States parameter must be an array" });
        }
    
        if (ageRange && typeof ageRange !== 'string') {
            return res.status(400).json({ error: "Invalid age range parameter" });
        }

        const query = ageRange ?
            `SELECT YEARCOVID, MONTHCOVID, StateName, AgeRange, SUM(COVID19Deaths) AS TotalDeaths
            FROM "B.NAKASONE"."COVIDDEATHREPORT"
            WHERE (YEARCOVID BETWEEN :startYear AND :endYear)
                AND (MONTHCOVID BETWEEN :startMonth AND :endMonth) 
                AND StateName IN (${statePlaceholders}) 
                AND AgeRange = :ageRange
            GROUP BY YEARCOVID, MONTHCOVID, StateName, AgeRange 
            ORDER BY StateName, AgeRange` :
            `SELECT YEARCOVID, MONTHCOVID, StateName, SUM(COVID19Deaths) AS TotalDeaths
            FROM "B.NAKASONE"."COVIDDEATHREPORT"
            WHERE (YEARCOVID BETWEEN :startYear AND :endYear)
                AND (MONTHCOVID BETWEEN :startMonth AND :endMonth) 
                AND StateName IN (${statePlaceholders})
            GROUP BY YEARCOVID, MONTHCOVID, StateName`;
    
        const bindVars = {
            startYear: startYear,
            startMonth: startMonth,
            endYear: endYear,
            endMonth: endMonth,
            ...(ageRange && { ageRange : ageRange })
        };
            
        states.forEach((state, index) => {
            bindVars[`state${index}`] = state;
        });
    
        const result = await con.execute(query, bindVars);

        if (!result || !result.rows || result.rows.length === 0) {
            console.log("No data found for parameters:", bindVars); // Log the parameters if no rows are found
            res.status(404).json({ error: "No data found" });
            return;
        }

        await con.close();

        res.json({ rows: result.rows });
    } catch (error) {
        console.error('Error fetching data app.js:', error);
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
