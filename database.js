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
            'SELECT COUNT(*) FROM "B.NAKASONE"."COVIDDeathReport"',
        );
        console.log(data.rows);

    } catch (err) {
        console.error(err);

    }
}

fun();

//Tutorial - https://www.youtube.com/watch?v=e_J8Q8YatB8
