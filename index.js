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
        edit: '/training',
        marks: '/training/marks'
    },
    cashflows: {
        list: '/cashflows/list',
        add: '/cachflows/add',
        edit: '/cashflows/edit'
    }
}

const connection = mysql.createConnection({
    multipleStatements: true,
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
    return res.status(403).send('Unacceptable');
};

const hash = pass => crypto.createHash('md5').update(pass).digest('hex');

const insertArrayDb = (array, id) => array.filter(element => !(!element.cash_id && !element.sum && !element.notice && !element.checkbox)).map(element => {
    if (element.cash_id) {
        let query = '';
        query = element.sum ? `sum = '${element.sum}',` : query;
        query = element.notice ? `${query} notice = '${element.notice}',` : query;
        query = element.checkbox !== null ? `${query} checkbox = '${element.checkbox}',` : query;  
        const makeQuery = `update cashflows set ${query} studentID = '${element.id}', trainingId = '${id}' where id = ${element.cash_id}`;
        return makeQuery;
    }
    let values = '';
    let params ='';
    values = element.sum ? `'${element.sum}',` : values;
    values = element.notice ? `${values} '${element.notice}',` : values;
    values = element.checkbox !== null ? `${values} '${element.checkbox}',` : values;
    params = element.sum ? `sum,` : params;
    params = element.notice ? `${params} notice,` : params;
    params = element.checkbox !== null ? `${params} checkbox,` : params;  
    const makeQuery = `insert into cashflows (${params} studentId, trainingId) values (${values} '${element.id}', '${id}')`;
    return makeQuery;
});

const makeTwoDigits = digit => digit.toString().length === 2 ? digit : `0${digit}`;

const markCounter = array => array.reduce((acc, element) => {
    const clearTime = new Date(new Date().setTime(element.date));
    const timeToString = `${clearTime.getFullYear()}-${makeTwoDigits(clearTime.getMonth() + 1)}-${makeTwoDigits(clearTime.getDate())}`;
    if (acc[timeToString]) {
        acc[timeToString] += 1;
        return acc;
    }
    return { ...acc, [timeToString]: 1}
}, {});

app.use(checkToken);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//=====User's section=====

//==Authorize user==

app.post(query.user.auth, (req, res) => {
    const {login, pass} = req.body;
    const md5 = pass ? hash(pass) : hash('');
    const makeQuery = `select name, role from users where login = '${login}' and md5password = '${md5}' and isDel = '0'`;
    connection.query(makeQuery, (error, results) => {
        if (error) throw error;
        if (results.length === 0) {
            return res.status(401).send('Auth incorrect');
        }
        res.status(200).send(JSON.stringify(results));
    })
})

//==Return list of users==

app.get(query.user.list, (req, res) => {
    const makeQuery = `select id, name, login, role from users where isDel = '0'`
    connection.query(makeQuery, (error, results) => {
        if (error) throw error;
        res.send(JSON.stringify(results));
    });
  });

//==Add user==

app.post(query.user.add, async (req, res) => {
    const {userName, login, role, openPassword} = req.body;
    const md5 = hash(openPassword);
    const checkQuery = `select id from users where name = '${userName}' or login = '${login}' and isDel = 0`;
    const makeQuery = `insert into users (name, login, role, md5password) values ('${userName}', '${login}', '${role}', '${md5}')`;
    const checkExist = await new Promise(resolve => connection.query(checkQuery, (error, results) => {
        if (error) throw error;
        resolve(results);
    }));
    if (checkExist.length !== 0) {
        return res.status(409).send('User exists');
    }
    connection.query(makeQuery, (error, results) => {
        if (error) throw error;
        res.send(results);
    });
});

//==Edit user==

app.patch(`${query.user.edit}/:id`, async (req, res) => {
    const { id } = req.params;
    const {name, login, role, openPassword} = req.body;
    const isPass = openPassword ? `, md5password = '${hash(openPassword)}'` : '';
    const checkQuery = `select id from users where role = 'admin' and id != ${id} and isDel = 0`;
    const checkAdmin = await new Promise(resolve => connection.query(checkQuery, (error, results) => {
        if (error) throw error;
        resolve(results);
    }));
    if (checkAdmin.length === 0) {
        return res.status(600).send('No more admins');
    }
    const makeQuery = `update users set name = '${name}', login = '${login}', role = '${role}'${isPass} where id = '${id}'`;
    connection.query(makeQuery, (error, results) => {
        if (error) throw error;
        res.send(results);
    });
});

//==Delete user==

app.delete(`${query.user.edit}/:id`, async (req, res) => {
    const { id } = req.params;
    const checkQuery = `select id from users where role = 'admin' and id != ${id} and isDel = 0`;
    const checkAdmin = await new Promise(resolve => connection.query(checkQuery, (error, results) => {
        if (error) throw error;
        resolve(results);
    }));
    if (checkAdmin.length === 0) {
        return res.status(601).send('Don\'t delete the only admin');
    }
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
    where groups.isDel = '0' order by groups_name`
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
    const {firstdate, lastdate} = req.headers;
    let condition = '';
    condition = firstdate === 'none' ? condition : `and trainings.date >= ${firstdate}`;
    condition = lastdate === 'none' ? condition : `${condition} and trainings.date <= ${lastdate}`;
    const makeQuery = `select 
    trainings.id as training_id, 
    trainings.date as training_date,
    groups.id as groups_id, 
    groups.name as group_name,
    users.name as trainer_name, 
    users.id as trainer_id from trainings 
    join users on trainings.trainerId = users.id
    join groups on trainings.groupId = groups.id
    where trainings.isDel = '0' ${condition} order by date`;
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

app.get(`${query.training.marks}`, (req, res) => {
    const makeQuery = `select date from trainings where isDel = '0' order by date`;
    connection.query(makeQuery, (error, results) => {
        if (error) throw error;
        const getArray = JSON.stringify(results);
        const countMarks = markCounter(JSON.parse(getArray));
        res.send(JSON.stringify(countMarks));
    });
});

//=====Cashflow's section=====

app.get(`${query.cashflows.list}/:trainingId`, async (req, res) => {
    const { trainingId } = req.params;
    const checkQuery = `select groupId from trainings where id = ${trainingId} and isDel = 0`;
    const [checkGroup] = await new Promise(resolve => connection.query(checkQuery, (error, results) => {
        if (error) throw error;
        resolve(results);
    }));
    const {groupId} = JSON.parse(JSON.stringify(checkGroup));
    const makeQuery = `select 
    id, name, cash_id, sum, notice, checkbox 
    from students left join 
    (select id as cash_id, studentId, sum, notice, checkbox from cashflows where trainingId = '${trainingId}') as cat
    on (students.id = cat.studentId) 
    left join
    (select groupId from trainings where id = '${trainingId}') as groupSelect
    on (students.groupId = groupSelect.groupId) where students.isDel = 0 and students.groupId = '${groupId}' order by name`
    connection.query(makeQuery, (error, results) => {
        if (error) throw error;
        res.send(JSON.stringify(results));
    });
  });

  app.post(`${query.cashflows.edit}/:trainingId`, (req, res) => {
    const { trainingId } = req.params;gr
    const makeQuery = `${insertArrayDb(req.body, trainingId).join('; ')};`;
    connection.query(makeQuery, (error, results) => {
        if (error) throw error;
        res.send(results);
    });
});

//==Start backend server==

app.listen(3000, () => {
    console.log('Welcome to modern new fucking awesome backend!');
  });