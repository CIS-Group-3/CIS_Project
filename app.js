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

app.get('/dataDJ', async (req, res) => {
    try {

        //Get the user values
        var startMonth = req.query.sm;
        var startYear = req.query.sy;
        var endMonth = req.query.em;
        var endYear = req.query.ey;
        var statesString = req.query.states;
        var indexChoices = JSON.parse(req.query.userIndices);
        var stringStartMonth;
        var stringEndMonth;

        //Format the startMonth and endMonth to work with SQL query
        if (startMonth.length === 1) {
            stringStartMonth = '0' + startMonth;
        }

        if (endMonth.length === 1) {
            stringEndMonth = '0' + endMonth;
        }

        //Format the startDate and endDate to work with SQL query
        const startDate = `${startYear}-${stringStartMonth}-01`;
        const endDate = `${endYear}-${stringEndMonth}-01`;

        var states = JSON.parse(statesString);

        //Empty string for where clause
        let whereClause = '';
        //Build the where statement dynamically based on user's input states, aka :state1, :state2...
        if (states.length > 0) {
            whereClause = `AND cd.StateName IN (${states.map((_, index) => `:state${index + 1}`).join(', ')})`;
        }

        //Since this query requires all user inputs to run, I have default values in html for user inputs

        //Connect to the database
        const con = await connectToDatabase();

        // Construct SQL Query dynamically
        //const indexChoices = ['Low', 'High']; // Include all index choices
        //const statePlaceholders = states.map((_, index) => `:state${index + 1}`).join(', ');
        const query = `
            --Used two with statements to make sure that deaths and index months align
            WITH AverageIndices AS (
                SELECT
                    d.dateMonth AS aiMonth,
                    d.dateYear AS aiYear,
                    ${indexChoices.map(choice => `AVG(CASE WHEN '${choice}' IN (${indexChoices.map(choice => `'${choice}'`).join(', ')}) THEN d.${choice} END) AS avg${choice}`).join(', ')}
                FROM "ABIGAIL.LIN".DJIndex d
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
                --Where clause from top if statement
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

        //Add user-specified input to bind variables for the where clause
        states.forEach((state, index) => {
            bindVars[`state${index + 1}`] = state;
        })

        //Execute the query
        const result = await con.execute(query, bindVars);

        //Close connection
        await con.close();

        //Send response
        res.json(result);
    } catch (error) {
        //In case error happens
        res.status(500).json({ error: error.message });
    }
});

app.get('/inflation', async (req, res) => {

    try {
        var startMonth = req.query.sm;
        var startYear = req.query.sy;
        var endMonth = req.query.em;
        var endYear = req.query.ey;

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
                (IR.cpiYear BETWEEN :startYear AND :endYear) AND
                (IR.cpiMonth BETWEEN :startMonth AND :endMonth) AND
                LF.FIPSCode BETWEEN 1 AND 50 
            GROUP BY 
                IR.cpiYear, IR.cpiMonth, IR.cpiValue
            ORDER BY
                IR.cpiYear, IR.cpiMonth`

        // Define bind variables
        const bindVars = {
            startMonth: startMonth,
            endMonth: endMonth,
            startYear: startYear,
            endYear: endYear
        };

        const con = await connectToDatabase();
        const result = await con.execute(query, bindVars);

        await con.close();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.get('/unemployment', async (req, res) => {
    try {
        var startMonth = req.query.sm;
        var startYear = req.query.sy;
        var endMonth = req.query.em;
        var endYear = req.query.ey;
        var statesString = req.query.states;

        var states = JSON.parse(statesString);

        console.log("states are: "+states);

        whereClause = ``; 

        if (Object.keys(states).length >= 1){
            whereClause = `(StateOrArea = '${states[0]}'`;
        }
        
        for (i =1; i<Object.keys(states).length; i++){
            whereClause += ` OR `;
            whereClause += `StateOrArea = '${states[i]}'`; 
        }

        if (Object.keys(states).length >= 1){
            whereClause += `) AND `;
        }

        
        if (startYear < endYear){
            whereClause += ` ((LYear = ${startYear} AND LMonth >= ${startMonth})
            OR (LYear > ${startYear} AND LYear < ${endYear})
            OR (LYear = ${endYear} AND LMonth <= ${endMonth}))`;
        }
        else{
            whereClause += ` ((LYear = ${startYear} AND LMonth >= ${startMonth} AND LMonth <= ${endMonth}))`;
        }

        console.log("where: " +whereClause);

        const con = await connectToDatabase();
        const result = await con.execute(
            `SELECT StateOrArea, LYear, LMonth, Average_Unemployment_Rate, Conditiongroup, Deaths
            FROM(
                SELECT StateOrArea, LYear, LMonth, AVG(PercentUnemployment) AS Average_Unemployment_Rate 
                FROM "S.KARANTH"."LABORFORCE" 
                WHERE (${whereClause})
                GROUP BY StateOrArea, LYear, LMonth
                ORDER BY LYear, LMonth
            ) query1
            INNER JOIN(
                SELECT YEARCOVID, MONTHCOVID, Statename, Conditiongroup, SUM(Covid19deaths) AS Deaths
                FROM "B.NAKASONE"."COVIDDEATHREPORT"
                WHERE Statename != 'United States'  
                GROUP BY YEARCOVID, MONTHCOVID, Statename, Conditiongroup
                ORDER BY YEARCOVID, MONTHCOVID, Statename
            ) query2
            ON query1.LYear = query2.YEARCOVID
            AND query1.LMonth = query2.MONTHCOVID
            AND query1.StateOrArea = query2.Statename`
        );

        await con.close();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/crimerate', async (req, res) => {
    try {
        var startMonth = req.query.sm;
        var startYear = req.query.sy;
        var endMonth = req.query.em;
        var endYear = req.query.ey;

        whereClause = ``; 

        if (startYear < endYear){
            whereClause = ` ((LYear = ${startYear} AND LMonth >= ${startMonth})
            OR (LYear > ${startYear} AND LYear < ${endYear})
            OR (LYear = ${endYear} AND LMonth <= ${endMonth}))`;
        }
        else{
            whereClause = ` ((LYear = ${startYear} AND LMonth >= ${startMonth} AND LMonth <= ${endMonth}))`;
        }

        console.log("where: " +whereClause);

        const con = await connectToDatabase();
        const result = await con.execute(
            `SELECT lmonth, lyear, "USAvgUnemployment", "CRCount" 
            FROM (SELECT lmonth, lyear, ROUND(AVG(totalunemployment)/100000, 2) as "USAvgUnemployment" 
            FROM "S.KARANTH"."LABORFORCE" WHERE lyear >= 2020 GROUP BY lmonth, lyear ORDER BY lyear, lmonth ASC) lf, 
            (SELECT monthocc, yearocc, COUNT(*) as "CRCount" FROM 
            "ABIGAIL.LIN"."CRIMEREPORT" WHERE yearocc <= 2022 GROUP BY monthocc, yearocc ORDER BY yearocc, monthocc ASC)cr 
            WHERE lmonth = monthocc AND lyear = yearocc AND (${whereClause})
            ORDER BY lyear, lmonth`
        );

        await con.close();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/totTuples', async (req, res) => {
    try {
        const con = await connectToDatabase();
        const result = await con.execute(
            `SELECT SUM(c1 + c2 + c3 + c4 + c5)
            FROM
            (SELECT
            (SELECT COUNT(*) FROM "S.KARANTH"."LABORFORCE") as c1,
            (SELECT COUNT(*) FROM "ABIGAIL.LIN"."CRIMEREPORT") as c2,
            (SELECT COUNT(*) FROM  "ABIGAIL.LIN"."DJINDEX") as c3,
            (SELECT COUNT(*) FROM "B.NAKASONE"."COVIDDEATHREPORT") as c4,
            (SELECT COUNT(*) FROM "NCHINTALAPATI"."USINFLATIONRATES") as c5
            FROM dual)`
        );
        await con.close();
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