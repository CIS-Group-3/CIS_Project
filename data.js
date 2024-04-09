const userDB = [];
  
module.exports = { userDB };

// const oracledb = require('oracledb');

// async function fun() {
//     let con;

//     try {

//         con = await oracledb.getConnection({
//             user: "abigail.lin",
//             password: "7yxtZs9hKMS0WxR0XV5MlrnE",
//             connectString: "oracle.cise.ufl.edu:1521/orcl"
//         });

//         //Example query to show connection to database
//         const data = await con.execute(
//             'SELECT * FROM DJIndex',
//         );
//         console.log(data.rows);

//     } catch (err) {
//         console.error(err);

//     }
// }

// fun();

//https://medium.com/swlh/basic-login-system-with-node-js-99acf02275b9