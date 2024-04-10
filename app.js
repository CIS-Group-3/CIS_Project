const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const path = require("path");
const oracledb = require('oracledb');

const app = express();
const server = http.createServer(app);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, './public')));

app.get('/data', async (req, res) => {
    try {
        const { sm, sy, em, ey, states } = req.query;
        const app_startMonth = parseInt(sm);
        const app_startYear = parseInt(sy);
        const app_endMonth = parseInt(em);
        const app_endYear = parseInt(ey);
        const userStates = JSON.parse(states);

        const data = await executeSQLQuery(app_startMonth, app_startYear, app_endMonth, app_endYear, userStates);

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

async function executeSQLQuery(startMonth, startYear, endMonth, endYear, userStates) {
    let connection;

    try {
        connection = await oracledb.getConnection({
            user: "abigail.lin",
            password: "7yxtZs9hKMS0WxR0XV5MlrnE",
            connectString: "oracle.cise.ufl.edu:1521/orcl"
        });

        console.log(sharedStates);

        const indexChoices = ['Low', 'High'];

        const statePlaceholders = userStates.map((_, index) => `:state${index + 1}`).join(', ');

        const query = `
            SELECT
                d.dateMonth,
                d.dateYear,
                cd.StateName,
                ${indexChoices.map(choice => `AVG(CASE WHEN '${choice}' IN (${indexChoices.map(choice => `'${choice}'`).join(', ')}) THEN d.${choice} END) AS avg${choice}`).join(', ')},
                SUM(cd.COVID19Deaths) AS totalCOVIDDeaths
            FROM DJIndex d
                     JOIN "B.NAKASONE".COVIDDeathReport cd ON d.dateMonth = cd.MonthCOVID AND d.dateYear = cd.YearCOVID
            WHERE (d.dateMonth BETWEEN :startMonth AND :endMonth)
              AND (d.dateYear BETWEEN :startYear AND :endYear)
              AND cd.StateName IN (${statePlaceholders})
            GROUP BY d.dateMonth, d.dateYear, cd.StateName
            ORDER BY d.dateYear, d.dateMonth`;

        const bindVars = {
            startMonth,
            endMonth,
            startYear,
            endYear
        };

        userStates.forEach((state, index) => {
            bindVars[`state${index + 1}`] = state;
        });

        const result = await connection.execute(query, bindVars);

        // Check if result.rows is defined
        if (result.rows) {
            return result.rows;
        } else {
            throw new Error('No rows returned from the query');
        }
    } catch (error) {
        console.error("Error executing SQL query:", error);
        throw error;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (error) {
                console.error("Error closing connection:", error);
            }
        }
    }
}



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