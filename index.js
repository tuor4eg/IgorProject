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
        add: '/user/add',
        edit: '/user'
    },
    group: {
        list: '/group/list',
        add: '/group/add',
        edit: '/group'
    },
    student: {
        add: '/student/add',
        edit: '/student'
    },
    training: {
        list: '/training/list',
        add: '/training/add',
        edit: '/training'
    },
    cashflows: {
        list: '/cashflows/list',
        add: '/cachflows/add',
        edit: '/cashflows/edit'
    }
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
    const md5 = pass ? hash(pass) : hash('');
    const makeQuery = `select name, role from users where login = '${login}' and md5password = '${md5}'`;
    connection.query(makeQuery, (error, results) => {
        if (error) throw error;
        res.send(JSON.stringify(results));
    })
})

//==Return list of users==

app.get(query.user.list, (req, res) => {
    const makeQuery = `select id, name, login, role, isDel from users where isDel = '0'`
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

//==Edit user==

app.patch(`${query.user.edit}/:id`, (req, res) => {
    const { id } = req.params;
    const {name, login, role, openPassword} = req.body;
    const isPass = openPassword ? `, md5password = '${hash(openPassword)}'` : '';
    const makeQuery = `update users set name = '${name}', login = '${login}', role = '${role}'${isPass} where id = '${id}'`;
    connection.query(makeQuery, (error, results) => {
        if (error) throw error;
        res.send(results);
    });
});

//==Delete user==

app.delete(`${query.user.edit}/:id`, (req, res) => {
    const { id } = req.params;
    const makeQuery = `update users set isDel = '1' where id = '${id}'`;
    connection.query(makeQuery, (error, results) => {
        if (error) throw error;
        res.send(results);
    });
});

//=====Group's section=====

//==Return list of groups==

app.get(query.group.list, (req, res) => {
    const makeQuery = `select 
    groups.id as groups_id, 
    groups.name as groups_name, 
    users.name as users_name, 
    users.id as users_id 
    from groups join users on groups.trainerId = users.id
    where groups.isDel = '0'`
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
    const makeQuery = `select * from students where groupId = '${id}' and isDel = '0' order by name`;
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

app.patch(`${query.student.edit}/:id`, (req, res) => {
    const { id } = req.params;
    const {studentName, groupId} = req.body;
    const makeQuery = `update students set name = '${studentName}', groupId = '${groupId}' where id = '${id}'`;
    connection.query(makeQuery, (error, results) => {
        if (error) throw error;
        res.send(results);
    });
});

//==Delete student==

app.delete(`${query.student.edit}/:id`, (req, res) => {
    const { id } = req.params;
    const makeQuery = `update students set isDel = '1' where id = '${id}'`;
    connection.query(makeQuery, (error, results) => {
        if (error) throw error;
        res.send(results);
    });
});

//==Edit group==

app.patch(`${query.group.edit}/:id`, (req, res) => {
    const { id } = req.params;
    const {groupName, trainerId} = req.body;
    const makeQuery = `update groups set name = '${groupName}', trainerId = '${trainerId}' where id = '${id}'`;
    connection.query(makeQuery, (error, results) => {
        if (error) throw error;
        res.send(results);
    });
});

//==Delete group==

app.delete(`${query.group.edit}/:id`, (req, res) => {
    const { id } = req.params;
    const makeQuery = `update groups set isDel = '1' where id = '${id}'`;
    connection.query(makeQuery, (error, results) => {
        if (error) throw error;
        res.send(results);
    });
});

app.get(`${query.training.list}`, (req, res) => {
    const {startdate, enddate} = req.headers;
    var condition = 'and trainings.date';
    if (enddate === 'none') {
        condition = `${condition} >= ${startdate}`;
    }
    const makeQuery = `select 
    trainings.id as training_id, 
    trainings.date as training_date,
    groups.id as groups_id, 
    groups.name as group_name,
    users.name as trainer_name, 
    users.id as trainer_id from trainings 
    join users on trainings.trainerId = users.id
    join groups on trainings.groupId = groups.id
    where trainings.isDel = '0' ${condition}`;
    connection.query(makeQuery, (error, results) => {
        if (error) throw error;
        const map = results.map(item => {
            const tmpDate = new Date();
            tmpDate.setTime(item.training_date);
            item.training_date = tmpDate.toString();
            return item;
          });
        res.send(JSON.stringify(map));
    });
});

app.post(`${query.training.add}`, (req, res) => {
    const {trainerId, groupId, date} = req.body;
    const makeQuery = `insert into trainings (date, trainerId, groupId) values ('${date}', '${trainerId}', '${groupId}')`;
    connection.query(makeQuery, (error, results) => {
        if (error) throw error;
        res.send(results);
    });
});

app.patch(`${query.training.edit}/:id`, (req, res) => {
    const { id } = req.params;
    const {trainerId, date} = req.body;
    const makeQuery = `update trainings set trainerId = '${trainerId}', date = '${date}' where id = '${id}'`;
    connection.query(makeQuery, (error, results) => {
        if (error) throw error;
        res.send(results);
    });
});

app.delete(`${query.training.edit}/:id`, (req, res) => {
    const { id } = req.params;
    const makeQuery = `update trainings set isDel = '1' where id = '${id}'`;
    connection.query(makeQuery, (error, results) => {
        if (error) throw error;
        res.send(results);
    });
});

//=====Cashflow's section=====

app.get(`${query.cashflows.list}/:trainingId`, (req, res) => {
    const { trainingId } = req.params;
    const makeQuery = `select 
    id, name, cash_id, sum, notice, checkbox 
    from students left join 
    (select id as cash_id, studentId, sum, notice, checkbox from cashflows where trainingId = ${trainingId}) as cat 
    on (students.id = cat.studentId) where students.isDel = 0 order by name`
    connection.query(makeQuery, (error, results) => {
        if (error) throw error;
        res.send(JSON.stringify(results));
    });
  });

//==Start backend server==

app.listen(3000, () => {
    console.log('Welcome to modern new fucking awesome backend!');
  });