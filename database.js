const oracledb = require('oracledb');

async function QueryOne(userStartYear, userStartMonth, userEndYear, userEndMonth, userStates, userAgeRange) {
    let con;

    try {

        con = await oracledb.getConnection({
            user: "abigail.lin",
            password: "7yxtZs9hKMS0WxR0XV5MlrnE",
            connectString: "oracle.cise.ufl.edu:1521/orcl"
        });

        const statePlaceholders = userStates.map((_, index) => `:state${index}`).join(', ');

        const query = userAgeRange ?
            `SELECT StateName, AgeRange, SUM(COVID19Deaths) AS TotalDeaths
            FROM "B.NAKASONE"."COVIDDEATHREPORT"
            WHERE (YEARCOVID BETWEEN :startYear AND :endYear)
                AND (MONTHCOVID BETWEEN :startMonth AND :endMonth) 
                AND StateName IN (${statePlaceholders}) 
                AND AgeRange = :ageRange
            GROUP BY StateName, AgeRange 
            ORDER BY StateName, AgeRange` :
            `SELECT StateName, SUM(COVID19Deaths) AS TotalDeaths
            FROM "B.NAKASONE"."COVIDDEATHREPORT"
            WHERE (YEARCOVID BETWEEN :startYear AND :endYear)
                AND (MONTHCOVID BETWEEN :startMonth AND :endMonth) 
                AND StateName IN (${statePlaceholders})
            GROUP BY StateName`;

        const bindVars = {
            startYear: userStartYear,
            startMonth: userStartMonth,
            endYear: userEndYear,
            endMonth: userEndMonth,
            ...(userAgeRange && { ageRange: userAgeRange }) // Includes ageRange in bindVars only if it's provided
        };
        
        userStates.forEach((state, index) => {
            bindVars[`state${index}`] = state;
        });
        
        const data = await con.execute(query, bindVars);
        console.log(data.rows);

    } catch (err) {
        console.error(err);

    }
}

const userStartYear = parseInt(process.argv[2], 10); // The third command line argument
const userStartMonth = parseInt(process.argv[3], 10); // The fourth command line argument
const userEndYear = parseInt(process.argv[4], 10); // The fifth command line argument
const userEndMonth = parseInt(process.argv[5], 10); // The sixth command line argument
const userStatesInput = process.argv[6]; // The seventh command line argument
const userStates = userStatesInput.split(',');
const userAgeRange = process.argv[7]; // The eigth command line argument (optional depending on input)

if (!isNaN(userStartYear) && !isNaN(userStartMonth) && !isNaN(userEndYear) && !isNaN(userEndMonth) && userStates.length > 0) {
    QueryOne(userStartYear, userStartMonth, userEndYear, userEndMonth, userStates, userAgeRange);
} else {
    console.error('Please provide valid integers for year and month, and at least one state.');
}

//Tutorial - https://www.youtube.com/watch?v=e_J8Q8YatB8
