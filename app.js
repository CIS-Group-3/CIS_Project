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
    try {
        var startMonth = req.query.sm;
        var startYear = req.query.sy;
        var endMonth = req.query.em;
        var endYear = req.query.ey;
        var statesString = req.query.states;
        var indexChoices = JSON.parse(req.query.userIndices);
        var stringStartMonth;
        var stringEndMonth;

        if (startMonth.length === 1) {
            stringStartMonth = '0' + startMonth;
        }

        if (endMonth.length === 1) {
            stringEndMonth = '0' + endMonth;
        }

        const startDate = `${startYear}-${stringStartMonth}-01`;
        const endDate = `${endYear}-${stringEndMonth}-01`;

        var states = JSON.parse(statesString);




        //Build the where statement dynamically based on user's input parameters
        let whereClause = '';
        if (states.length > 0) {
            whereClause = `AND cd.StateName IN (${states.map((_, index) => `:state${index + 1}`).join(', ')})`;
        }

        //Connect to the database
        const con = await connectToDatabase();




        // Construct SQL Query dynamically
        //const indexChoices = ['Low', 'High']; // Include all index choices
        //const statePlaceholders = states.map((_, index) => `:state${index + 1}`).join(', ');
        const query = `


            WITH AverageIndices AS (
                SELECT
                    d.dateMonth AS aiMonth,
                    d.dateYear AS aiYear,
                    ${indexChoices.map(choice => `AVG(CASE WHEN '${choice}' IN (${indexChoices.map(choice => `'${choice}'`).join(', ')}) THEN d.${choice} END) AS avg${choice}`).join(', ')}
                FROM DJIndex d
                WHERE
                    TO_DATE(d.dateYear || '-' || LPAD(d.dateMonth, 2, '0') || '-' || 01, 'YYYY-MM-DD') BETWEEN TO_DATE(:startDate, 'YYYY-MM-DD') AND TO_DATE(:endDate, 'YYYY-MM-DD')
                GROUP BY
                    d.dateMonth,
                    d.dateYear
            ),
                 Deaths AS (
                     SELECT
                         cd.MonthCOVID AS cdMonth,
                         cd.YearCOVID as cdYear,
                         cd.StateName,
                         SUM(cd.COVID19Deaths) AS totalCOVIDDeaths
                     FROM
                         "B.NAKASONE".COVIDDeathReport cd
                     WHERE
                         TO_DATE(cd.YearCOVID || '-' || LPAD(cd.MonthCOVID, 2, '0') || '-' || 01, 'YYYY-MM-DD') BETWEEN TO_DATE(:startDate, 'YYYY-MM-DD') AND TO_DATE(:endDate, 'YYYY-MM-DD')
                         AND cd.AgeRange = 'All Ages'
                ${whereClause}
            GROUP BY
                cd.MonthCOVID,
                cd.YearCOVID,
                cd.StateName
                )
            SELECT
                ai.aiMonth,
                ai.aiYear,
                d.StateName,
                ${indexChoices.map(choice => `ai.avg${choice}`).join(', ')},
                d.totalCOVIDDeaths
            FROM
                AverageIndices ai JOIN Deaths d ON ai.aiMonth = d.cdMonth AND ai.aiYear = d.cdYear
            GROUP BY
                ai.aiMonth,
                ai.aiYear,
                d.StateName,
                ${indexChoices.map(choice => `ai.avg${choice}`).join(', ')},
                d.totalCOVIDDeaths
            ORDER BY
                ai.aiYear,
                ai.aiMonth
            `;

        //Define bind variables
        const bindVars = {
            startDate,
            endDate
        };

        //Add user-specified input to bind variables
        states.forEach((state, index) => {
            bindVars[`state${index + 1}`] = state;
        });

        //Execute the query
        const result = await con.execute(query, bindVars);

        //Close connection
        await con.close();

        //Send response
        res.json(result);
    } catch (error) {
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