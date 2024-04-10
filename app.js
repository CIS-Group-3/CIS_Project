const express = require('express');
const oracledb = require('oracledb');
const http = require('http');
const bcrypt = require('bcrypt');
const path = require("path");
const bodyParser = require('body-parser');
const users = require('./data').userDB;

const app = express();
const server = http.createServer(app);
let tuples; 

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

let startMonth;
let startYear;
let endMonth; 
let endYear;

app.post('/data', async (req, res) => {
    try{
        startMonth = req.body.StartMonth;
        startYear = req.body.StartYear;
        endMonth = req.body.EndMonth;
        endYear = req.body.EndYear;
        res.send("<div><h2>Dates successfully entered</h2><a href='./individualpage.html'>Back to the Chart</a></div>")
    }
    catch {
        res.send("Error has occurred please try again.");
    }
})

app.get('/individualpage', async (req, res) => {
    try {
<<<<<<< Updated upstream
    
=======
        var startMonth = req.query.sm;
        var startYear = req.query.sy;
        var endMonth = req.query.em;
        var endYear = req.query.ey;
        // var statesString = req.query.states;

        // var states = JSON.parse(statesString);

        // console.log("states are: "+states);

        // whereClause = ``; 

        // if (Object.keys(states).length >= 1){
        //     whereClause = `(StateOrArea = '${states[0]}'`;
        // }
        
        // for (i =1; i<Object.keys(states).length; i++){
        //     whereClause += ` OR `;
        //     whereClause += `StateOrArea = '${states[i]}'`; 
        // }

        // if (Object.keys(states).length >= 1){
        //     whereClause += `) AND `;
        // }

        
>>>>>>> Stashed changes
        if (startYear < endYear){
            whereClause = ` ((LYear = ${startYear} AND LMonth >= ${startMonth})
            OR (LYear > ${startYear} AND LYear < ${endYear})
            OR (LYear = ${endYear} AND LMonth <= ${endMonth}))`;
        }
        else{
            whereClause = ` ((LYear = ${startYear} AND LMonth >= ${startMonth} AND LMonth <= ${endMonth}))`;
        }

        const con = await connectToDatabase();
        const result = await con.execute(
            `SELECT lmonth, lyear, "USAvgUnemployment", "CRCount" 
<<<<<<< Updated upstream
            FROM (SELECT lmonth, lyear, ROUND(AVG(totalunemployment), 2) as "USAvgUnemployment" 
=======
            FROM (SELECT lmonth, lyear, ROUND(AVG(totalunemployment)/100000, 2) as "USAvgUnemployment" 
>>>>>>> Stashed changes
            FROM "S.KARANTH"."LABORFORCE" WHERE lyear >= 2020 GROUP BY lmonth, lyear ORDER BY lyear, lmonth ASC) lf, 
            (SELECT monthocc, yearocc, COUNT(*) as "CRCount" FROM 
            "ABIGAIL.LIN"."CRIMEREPORT" WHERE yearocc <= 2022 GROUP BY monthocc, yearocc ORDER BY yearocc, monthocc ASC)cr 
            WHERE lmonth = monthocc AND lyear = yearocc AND (${whereClause})
<<<<<<< Updated upstream
            ORDER BY lyear, lmonth`,
=======
            ORDER BY lyear, lmonth`
>>>>>>> Stashed changes
        );
        tuples = result;
        await con.close();
        res.json(result.rows);
        console.log(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/data', async (req, res) => {
    try{
        let StartDate = req.body.StartDate;
        let EndDate = req.body.EndDate;
        console.log(StartDate);
        console.log(EndDate);
        res.send("<div><h2>Dates successfully entered</h2><a href='./individualpage.html'>Back to the Chart</a></div>")
    }
    catch {
        res.send("Error has occurred please try again.");
    }
})
app.post('/data', async (req, res) => {
    try{
        let StartDate = req.body.StartDate;
        let EndDate = req.body.EndDate;
        console.log(StartDate);
        console.log(EndDate);
        res.send("<div><h2>Dates successfully entered</h2><a href='./individualpage.html'>Back to the Chart</a></div>")
    }
    catch {
        res.send("Error has occurred please try again.");
    }
})
app.post('/data', async (req, res) => {
    try{
        let StartDate = req.body.StartDate;
        let EndDate = req.body.EndDate;
        console.log(StartDate);
        console.log(EndDate);
        res.send("<div><h2>Dates successfully entered</h2><a href='./individualpage.html'>Back to the Chart</a></div>")
    }
    catch {
        res.send("Error has occurred please try again.");
    }
})
app.post('/data', async (req, res) => {
    try{
        let StartDate = req.body.StartDate;
        let EndDate = req.body.EndDate;
        console.log(StartDate);
        console.log(EndDate);
        res.send("<div><h2>Dates successfully entered</h2><a href='./individualpage.html'>Back to the Chart</a></div>")
    }
    catch {
        res.send("Error has occurred please try again.");
    }
})
app.post('/data', async (req, res) => {
    try{
        let StartDate = req.body.StartDate;
        let EndDate = req.body.EndDate;
        console.log(StartDate);
        console.log(EndDate);
        res.send("<div><h2>Dates successfully entered</h2><a href='./individualpage.html'>Back to the Chart</a></div>")
    }
    catch {
        res.send("Error has occurred please try again.");
    }
})
app.post('/data', async (req, res) => {
    try{
        let StartDate = req.body.StartDate;
        let EndDate = req.body.EndDate;
        console.log(StartDate);
        console.log(EndDate);
        res.send("<div><h2>Dates successfully entered</h2><a href='./individualpage.html'>Back to the Chart</a></div>")
    }
    catch {
        res.send("Error has occurred please try again.");
    }
})
app.post('/data', async (req, res) => {
    try{
        let StartDate = req.body.StartDate;
        let EndDate = req.body.EndDate;
        console.log(StartDate);
        console.log(EndDate);
        res.send("<div><h2>Dates successfully entered</h2><a href='./individualpage.html'>Back to the Chart</a></div>")
    }
    catch {
        res.send("Error has occurred please try again.");
    }
})

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