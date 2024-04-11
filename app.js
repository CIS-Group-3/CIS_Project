const express = require('express');
const http = require('http');
const bcrypt = require('bcrypt');
const path = require("path");
const bodyParser = require('body-parser');
const users = require('./data').userDB;
const oracledb = require('oracledb');

const app = express();
const server = http.createServer(app);

app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname,'./public')));
const oracledb = require('oracledb');


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

let con; // Declare con at a higher scope

app.get('/data', async (req, res) => {
    try {
        con = await oracledb.getConnection({
            user: "abigail.lin",
            password: "7yxtZs9hKMS0WxR0XV5MlrnE",
            connectString: "oracle.cise.ufl.edu:1521/orcl"
        });

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        // Prompt user for month input
        const startMonth = await promptUser(rl, 'Enter start month (1-12): ');
        const endMonth = await promptUser(rl, 'Enter end month (1-12): ');

        // Prompt user for year input
        const startYear = await promptUser(rl, 'Enter start year: ');
        const endYear = await promptUser(rl, 'Enter end year: ');

        // Close readline interface
        rl.close();

        // SQL query
        const query = `
        SELECT 
        IR.cpiYear AS Year,
        IR.cpiMonth AS Month,
        IR.cpiValue,
        SUM(LF.TotalUnemployment) AS TotalUnemployment_AllStates
    FROM 
        "NCHINTALAPATI"."USINFLATIONRATES" IR
    INNER JOIN 
        "S.KARANTH"."LABORFORCE" LF ON IR.cpiYear = LF.LYEAR AND IR.cpiMonth = LF.LMONTH
    WHERE 
        (IR.cpiYear >= 2020 AND IR.cpiYear <= 2023) AND
        (IR.cpiMonth >= 1 AND IR.cpiMonth <= 12) AND
        LF.FIPS_Code BETWEEN 1 AND 50  -- Considering FIPS Code 1-50 for states
    GROUP BY 
        IR.cpiYear, IR.cpiMonth, IR.cpiValue
    ORDER BY 
        IR.cpiYear, IR.cpiMonth;
    `;

        // Define bind variables
        const bindVars = {
            startMonth: startMonth,
            endMonth: endMonth,
            startYear: startYear,
            endYear: endYear
        };

        // Execute query
        const result = await con.execute(query, bindVars);

        console.log(result.rows);
    } catch (err) {
        console.error(err);
    } finally {
        if (con) {
            try {
                await con.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
},

function promptUser(rl, question) {
    return new Promise((resolve, reject) => {
        rl.question(question, (answer) => {
            const input = parseInt(answer);
            if (!isNaN(input)) {
                resolve(input);
            } else {
                console.log('Please enter a valid number.');
                promptUser(rl, question).then(resolve);
            }
        });
    });
}
);

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