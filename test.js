var mysql = require('mysql');

var mysql_setting = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ir604'
};

function add_user(){
     var data = {'name': 'name', 'summary':'sample', 'uid': 'XXX'}

     var connection = mysql.createConnection(mysql_setting);
     connection.connect(); 
     connection.query('insert into user_information set ?', data, function (error, results, fields){
          res.redirect('/login');
     });
     connection.end();
}

function add_theme(){
     var data = {'contents':'sample', 'tag':'tag,sample', 'account_id': 3}
 
     var connection = mysql.createConnection(mysql_setting);

     connection.connect();
     connection.query('insert into theme set ?', data, function (error, results, fields){
         res.redirect('/');
     });
     
     connection.end();
}

function add_image(){
     var data = {'name':'dummy', 'title':'sample', 'likes':0, 'contents':'sample', 'theme_id':3,  'account_id': 3}
 
     var connection = mysql.createConnection(mysql_setting);
 
     connection.connect();
     connection.query('insert into image set ?', data, function (error, results, fields){
         res.redirect('/');
     });
 
     connection.end();
}

function add_list(){
     var data = {'title':'sample', 'type':'theme', 'account_id': 3}
 
     var connection = mysql.createConnection(mysql_setting);
 
     connection.connect();
     connection.query('insert into lists set ?', data, function (error, results, fields){
         res.redirect('/us'+account_id);
     });
     connection.query('insert into list_contents set ?', data, function (error, results, fields){
          res.redirect(link);
     });
 
     connection.end();
}

function add_comment(){
     var data = {'summary':'sample', 'image_id':5, 'account_id': 3}
 
     var connection = mysql.createConnection(mysql_setting);

     connection.connect();
     connection.query('insert into comment set ?', data, function (error, results, fields){
         res.redirect(redirect_link);
     });

     connection.end();
}

function add_likes(){
     var data = {'contents_id': 5, 'account_id':3}
 
     var connection = mysql.createConnection(mysql_setting);

     connection.connect();
     connection.query('insert into likes set ?', data, function (error, results, fields){
          res.redirect(redirect_link);
     });

     connection.end();
}

function add_follow(){
     var data = {'account_id': 3, 'follow_id':4}
     
     var connection = mysql.createConnection(mysql_setting);
 
     connection.connect();
     connection.query('insert into follow set ?', data, function (error, results, fields){
         res.redirect(redirect_link);
     });
 
     connection.end();
}

function add_notification(){
     console.log(1+1);
}

function all(){
     for(var i = 0;i<10;i++){
          console.log(1+1);
     }
}

all();
