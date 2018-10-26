/**
 * Igor Project backend server and database
 * https://github.com/tuor4eg/
 *
 * @format
 * @flow
 */

require('dotenv').config();

const mysql = require('mysql');
const Express = require('express');
const bodyParser = require("body-parser");
const crypto = require('crypto');

const connection = mysql.createConnection({
  host: process.env.HOST,
  user: process.env.USERNAME,
  password: process.env.PASSWORD,
  database: process.env.DATABASE
});

const app = new Express;

const checkToken = (req, res, next) => {
    if (req.headers.token === process.env.TOKEN) {
        return next();
    }
    return res.end('fuck off');
};

const hash = pass => crypto.createHash('md5').update(pass).digest('hex');

app.use(checkToken);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/data', (req, res) => {
    connection.query('select * from users_test', (error, results) => {
        if (error) throw error;
        res.send(JSON.stringify(results));
    });
  });

app.post('/data/login', (req, res) => {
    const {login, pass} = req.body;
    const md5 = hash(pass);
    const makeQuery = `select name, role from users where login = '${login}' and md5password = '${md5}'`;
    connection.query(makeQuery, (error, results) => {
        if (error) throw error;
        res.send(JSON.stringify(results));
    })
})

app.post('/data/post', (req, res) => {
    const {name, sum, text} = req.body;
    const makeQuery = `insert into users_test (name, sum, text) values ('${name}', '${sum}', '${text}')`;
    connection.query(makeQuery, (error, results) => {
        if (error) throw error;
        res.send(results);
    });
});

app.patch('/data/patch/:id', (req, res) => {
    const { id } = req.params;
    const {name, sum, text} = req.body;
    const makeQuery = `update users_test set name = '${name}', sum = '${sum}', text = '${text}' where id = '${id}'`;
    connection.query(makeQuery, (error, results) => {
        if (error) throw error;
        res.send('ok');
    });
});

app.delete('/data/delete/:id', (req, res) => {
    const { id } = req.params;
    const makeQuery = `delete from users_test where id = ${id}`;
    connection.query(makeQuery, (error, results) => {
        if (error) throw error;
        res.send('ok');
    });
})
  
app.listen(3000, () => {
    console.log('Example Express app listening on port 3000!');
  });