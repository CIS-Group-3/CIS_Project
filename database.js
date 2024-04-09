const oracledb = require('oracledb');

async function fun() {
    let con;

    try {
        con = await oracledb.getConnection({
            user: "abigail.lin",
            password: "7yxtZs9hKMS0WxR0XV5MlrnE",
            connectString: "oracle.cise.ufl.edu:1521/orcl"
        });

        const indexChoices = ['Low', 'High']; // Include all index choices
        const userStates = ['Texas', 'New Mexico'];

        //From the userStates array, use map to iterate over each element. Then for each element, generate string for each state
        const statePlaceholders = userStates.map((_, index) => `:state${index + 1}`).join(', ');

        //Generate SQL query dynamically, use "template literal"
        //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
        //https://clhenrick.io/es6-template-strings-sql/

        const query = `
            SELECT
                d.dateMonth,
                d.dateYear,
                cd.StateName,
                --Get the average index values dynamically based on indexChoices array
                --For each element in the indexChoices, can dynamically construct string with template literal
                --Also use CASE WHEN https://www.w3schools.com/sql/sql_case.asp
                ${indexChoices.map(choice => `AVG(CASE WHEN '${choice}' IN (${indexChoices.map(choice => `'${choice}'`).join(', ')}) THEN d.${choice} END) AS avg${choice}`).join(', ')},
                SUM(cd.COVID19Deaths) AS totalCOVIDDeaths
            FROM DJIndex d
            JOIN "B.NAKASONE".COVIDDeathReport cd ON d.dateMonth = cd.MonthCOVID AND d.dateYear = cd.YearCOVID
            WHERE (d.dateMonth BETWEEN :startMonth AND :endMonth)
              AND (d.dateYear BETWEEN :startYear AND :endYear)
              AND cd.StateName IN (${statePlaceholders})
            GROUP BY d.dateMonth, d.dateYear, cd.StateName
            ORDER BY d.dateYear, d.dateMonth`;

        //Define bind variables
        const bindVars = {
            startMonth: 1,
            endMonth: 12,
            startYear: 2023,
            endYear: 2024
        };

        //Add user-specified states to bind variables
        userStates.forEach((state, index) => {
            bindVars[`state${index + 1}`] = state;
        });

        const result = await con.execute(query, bindVars);

        console.log(result.rows);
    } catch (err) {
        console.error(err);
    }
}

fun();
