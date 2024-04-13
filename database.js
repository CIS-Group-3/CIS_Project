const oracledb = require('oracledb');

async function fun() {
    let con;

    try {
        con = await oracledb.getConnection({
            user: "abigail.lin",
            password: "7yxtZs9hKMS0WxR0XV5MlrnE",
            connectString: "oracle.cise.ufl.edu:1521/orcl"
        });

        //const indexChoices = ['Low', 'High']; // Include all index choices
        //const userStates = ['Texas'];

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
            startYear: 2022,
            endYear: 2022
        };

        //Add user-specified states to bind variables
        userStates.forEach((state, index) => {
            bindVars[`state${index + 1}`] = state;
        });

        const result = await con.execute(query, bindVars);


    } catch (err) {
        console.error(err);
    }
}

fun();

/*
* // Show chart
    async function fillChart() {
        try {


            await fetchData();

            placeholder.style.display = 'block'; // Make chart visible if needed.

            let datasets = {}; // Groups data by state
            var uniqueMonths = [];

            for (let i = 0; i < data.length; i++) {
                const row = data[i];
                const state = row[2];
                const year = row[1];
                const month = row[0];
                const rate = row[5];

                const monthyear = `${month}/${year}`;
                if (!uniqueMonths.includes(monthyear)) {
                    uniqueMonths.push(monthyear);
                }

                if (!datasets[state]) {
                    datasets[state] = {
                        label: state,
                        data: [],
                        backgroundColor: `rgba(0, 0, 0, 0)`, // Random color for each dataset
                        borderColor: `rgba(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, 1)`, // Random color for each dataset
                        borderWidth: 2
                    };
                }

                datasets[state].data.push({
                    x: `${month}/${year}`,
                    y: rate
                });
            }

            const datasetsArray = Object.values(datasets);

            if (lineChart) {
                // Update chart data and options
                lineChart.data.labels = uniqueMonths;
                lineChart.data.datasets = datasetsArray;
                lineChart.update();
            } else {
                // Create a new chart
                lineChart = new Chart(myChart, {
                    type: 'line',
                    data: {
                        labels: uniqueMonths,
                        datasets: datasetsArray
                    },
                    options: {
                        elements: {
                            point: {
                                radius: 0
                            }
                        } // Remove data point circles
                    }
                });
            }
        } catch (error) {
            console.error('Error filling chart:', error);
        }
    }*/


/*
* app.get('/data', async (req, res) => {
    try {
        var startMonth = req.query.sm;
        var startYear = req.query.sy;
        var endMonth = req.query.em;
        var endYear = req.query.ey;
        var statesString = req.query.states;

        var states = JSON.parse(statesString);

        console.log("states are: "+states);

        const data = await executeSQLQuery(startMonth, startYear, endMonth, endYear, states);

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

        //console.log(sharedStates);

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

        return result;


    } catch (error) {
        console.error("Error executing SQL query:", error);
        throw error;
    }
}*/
