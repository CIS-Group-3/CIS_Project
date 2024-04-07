const oracledb = require('oracledb');

async function fun() {
    let con;

    try {

        con = await oracledb.getConnection({
            user: "abigail.lin",
            password: "7yxtZs9hKMS0WxR0XV5MlrnE",
            connectString: "oracle.cise.ufl.edu:1521/orcl"
        });

        //Example query to show connection to database
        const data = await con.execute(
            //'SELECT * FROM "S.KARANTH"."LABORFORCE"',
            `SELECT StateOrArea, LYear, LMonth, AVG(PercentUnemployment) AS Average_Unemployment_Rate 
            FROM "S.KARANTH"."LABORFORCE" 
            WHERE (LYear = 2020 AND LMonth >= 8)
               OR (LYear > 2020 AND LYear < 2022)
               OR (LYear = 2022 AND LMonth <= 3)
            GROUP BY StateOrArea, LYear, LMonth
            ORDER BY LYear, LMonth`,
        );
        console.log(data.rows);

    } catch (err) {
        console.error(err);

    }
}

fun();

//Tutorial - https://www.youtube.com/watch?v=e_J8Q8YatB8
