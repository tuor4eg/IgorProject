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

const query = {
    user: {
        auth: '/user/auth',
        list: '/user/list',
        add: '/user/add'
    },
    group: {
        list: '/group/list',
        add: '/group/add'
    },
    student: {
        add: '/student/add',
        edit: '/student'
    },
    getData: '/data',
    postData: '/data/post',
    patchData: '/data/patch/',
    deleteData: '/data/delete/'
}

const connection = mysql.createConnection({
  host: process.env.HOST,
  user: process.env.USERNAME,
  password: process.env.PASSWORD,
  database: process.env.DATABASE
});

const app = new Express;

//=====Middleware=====

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

//=====User's section=====

//==Authorize user==

app.post(query.user.auth, (req, res) => {
    const {login, pass} = req.body;
    const md5 = hash(pass);
    const makeQuery = `select name, role from users where login = '${login}' and md5password = '${md5}'`;
    connection.query(makeQuery, (error, results) => {
        if (error) throw error;
        res.send(JSON.stringify(results));
    })
})

//==Return list of users==

app.get(query.user.list, (req, res) => {
    const makeQuery = `select id, name, login, role from users`
    connection.query(makeQuery, (error, results) => {
        if (error) throw error;
        res.send(JSON.stringify(results));
    });
  });

//==Add user==

app.post(query.user.add, (req, res) => {
    const {userName, login, role, openPassword} = req.body;
    const md5 = hash(openPassword);
    const makeQuery = `insert into users (name, login, role, md5password) values ('${userName}', '${login}', '${role}', '${md5}')`;
    connection.query(makeQuery, (error, results) => {
        if (error) throw error;
        res.send(results);
    });
});

//=====Group's section=====

//==Return list of groups==

app.get(query.group.list, (req, res) => {
    const makeQuery = `select groups.id as groups_id, groups.name as groups_name, users.name as users_name from groups join users on groups.trainerId = users.id`
    connection.query(makeQuery, (error, results) => {
        if (error) throw error;
        res.send(JSON.stringify(results));
    });
  });

//==Add group==

app.post(query.group.add, (req, res) => {
    const {groupName, trainerId} = req.body;
    const makeQuery = `insert into groups (name, trainerId) values ('${groupName}', '${trainerId}')`;
    connection.query(makeQuery, (error, results) => {
        if (error) throw error;
        res.send(results);
    });
});

//==Return list of group's students==

app.get(`${query.group.list}/:id`, (req, res) => {
    const { id } = req.params;
    const makeQuery = `select * from students where groupId = '${id}'`;
    connection.query(makeQuery, (error, results) => {
        if (error) throw error;
        res.send(JSON.stringify(results));
    });
});

//==Add student into group==

app.post(`${query.student.add}/:id`, (req, res) => {
    const { id } = req.params;
    const {studentName} = req.body;
    const makeQuery = `insert into students (name, groupId) values ('${studentName}', '${id}')`;
    connection.query(makeQuery, (error, results) => {
        if (error) throw error;
        res.send(results);
    });
});

//==Edit student==

app.post(`${query.student.edit}/:id`, (req, res) => {
    const { id } = req.params;
    const {studentName, groupId} = req.body;
    const makeQuery = `update students set name = '${studentName}', groupId = '${groupId}' where id = '${id}'`;
    connection.query(makeQuery, (error, results) => {
        if (error) throw error;
        res.send(results);
    });
});

//==delete student==

app.delete(`${query.student.edit}/:id`, (req, res) => {
    console.log('kek');
    const { id } = req.params;
    const makeQuery = `delete from students where id = '${id}'`;
    connection.query(makeQuery, (error, results) => {
        if (error) throw error;
        res.send(results);
    });
});

//=====NADO VSE PEREPISAT!!!!!!!=====

app.get('/data', (req, res) => {
    connection.query('select * from users_test', (error, results) => {
        if (error) throw error;
        res.send(JSON.stringify(results));
    });
  });

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