const oracledb = require('oracledb');
const readline = require('readline');

async function fun() {
    let con;

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
                LF.PercentUnemployment,
                LF.TotalUnemployment
            FROM 
                "NCHINTALAPATI"."USINFLATIONRATES" IR
            INNER JOIN 
                "S.KARANTH"."LABORFORCE" LF ON IR.cpiYear = LF.LYEAR AND IR.cpiMonth = LF.LMONTH
            WHERE 
                (IR.cpiYear BETWEEN :startYear AND :endYear) AND
                (IR.cpiMonth BETWEEN :startMonth AND :endMonth)
            ORDER BY 
                IR.cpiYear, IR.cpiMonth`;

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
}

// Function to prompt user for input
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

fun();