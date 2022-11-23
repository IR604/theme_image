var mysql = require('mysql');
const fs = require('fs');

var mysql_setting = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ir604'
};

function add_user(loop){
     for(var i=0;i<loop;i++){
          var data = {'name': 'name', 'summary':'sample', 'uid': 'XXX'}

          var connection = mysql.createConnection(mysql_setting);
          connection.connect(); 
          connection.query('insert into user_information set ?', data, function (error, results, fields){
               fs.copyFile('./public/images/icons/default_icon.jpg', './public/images/icons/'+results.insertId+'.jpg', (err) => {
                    if (err) {
                        console.log(err.stack);
                    }
                    else {
                        console.log('Done.');
                    }
                });
    
                fs.copyFile('./public/images/header/default_header.jpg', './public/images/header/'+results.insertId+'.jpg', (err) => {
                    if (err) {
                        console.log(err.stack);
                    }
                    else {
                        console.log('Done.');
                    }
                });
          });
          connection.end();
     }
}

function add_theme(id, loop){
     for(var i=0;i<loop;i++){
          var connection = mysql.createConnection(mysql_setting);

          connection.connect();
          const insert_contents='insert into theme set '
          +'contents="sample"'
          +',date=now()'
          +',account_id='+id
          connection.query(insert_contents, function (error, results, fields){
               add_tag(results.insertId, 'tag,sample')
          });
          
          connection.end();
     }
}
function add_tag(id, tag){
     var tagArr = tag.split(',');
     for(var i in tagArr){
          var data = {'tag':tagArr[i], 'theme_id': id}
     
          var connection = mysql.createConnection(mysql_setting);

          connection.connect();
          connection.query('insert into tags set ?', data, function (error, results, fields){
          });
          
          connection.end();
     }
}

function add_image(id, theme_id, loop){
     for(var i=0;i<loop;i++){
          var items = ['index1.png', 'index2.png', 'index3.png'];
          //最大値は配列の「要素数」にする
          var random = Math.floor( Math.random() * items.length );
          
          const insert_contents='insert into image set '
          +'name="'+items[random]+'"'
          +',title="sample"'
          +',contents="sample"'
          +',views=0'
          +',date=now()'
          +',theme_id='+theme_id
          +',account_id='+id

          var connection = mysql.createConnection(mysql_setting);
     
          connection.connect();
          connection.query(insert_contents, function (error, results, fields){
          });
     
          connection.end();
     }
}

function add_list(id, type, loop){
     var connection = mysql.createConnection(mysql_setting);
     connection.connect();
     var lists_data = {'title':'sample', 'type':type, 'account_id': id}
     connection.query('insert into lists set ?', lists_data, function (error, results, fields){
          add_list_contents(results.insertId, loop)
     })
     connection.end();
}
function add_list_contents(id, loop){
     var connection = mysql.createConnection(mysql_setting);
     connection.connect();
     for(var i=0;i<loop;i++){
          var list_contents_data = {'list_id':id, 'contents_id':i+1}
          connection.query('insert into list_contents set ?', list_contents_data, function (error, results, fields){
          });
     }
     connection.end();
}

function add_comment(id, image_id, loop){
     for(var i=0;i<loop;i++){
          var data = {'summary':'sample', 'image_id':image_id, 'account_id': id}
     
          var connection = mysql.createConnection(mysql_setting);

          connection.connect();
          connection.query('insert into comment set ?', data, function (error, results, fields){
          });

          connection.end();
     }
}

function add_likes(id, loop){
     for(var i=0;i<loop;i++){
          var data = {'contents_id': i+1, 'account_id':id}
     
          var connection = mysql.createConnection(mysql_setting);

          connection.connect();
          connection.query('insert into likes set ?', data, function (error, results, fields){
          });

          connection.end();
     }
}

function increase_likes(id, loop){
     for(var i=0;i<loop;i++){
          var data = {'contents_id': id, 'account_id':i+1}
     
          var connection = mysql.createConnection(mysql_setting);

          connection.connect();
          connection.query('insert into likes set ?', data, function (error, results, fields){
          });

          connection.end();
     }
}

function add_follow(id, loop){
     for(var i=0;i<loop;i++){
          var data = {'account_id': id, 'follow_id':i+1}
     
          var connection = mysql.createConnection(mysql_setting);
      
          connection.connect();
          connection.query('insert into follow set ?', data, function (error, results, fields){
          });
      
          connection.end();
     }
}
function increase_follow(id, loop){
     for(var i=0;i<loop;i++){
          var data = {'account_id': i+1, 'follow_id':id}
     
          var connection = mysql.createConnection(mysql_setting);
      
          connection.connect();
          connection.query('insert into follow set ?', data, function (error, results, fields){
          });
      
          connection.end();
     }
}

function add_notification(visit_id, contents_id, type, contents_post, loop){
     summary="testさんがあなたのイラストにいいねしました。"
     var connection = mysql.createConnection(mysql_setting);
      
     connection.connect();
     for(var i=0;i<loop;i++){
          var data = {'visiter_id': i+1, 'visited_id':visit_id, 'contents_id':contents_id, 'type':type, 'contents_post':contents_post,'summary':summary}
          connection.query('insert into notification set ?', data, function (error, results, fields){
          });
     }
     connection.end();
}


function public_user(){
     var data = {'name': 'name', 'summary':'sample', 'uid': 'XXX'}

     var connection = mysql.createConnection(mysql_setting);
     connection.connect(); 
     connection.query('insert into user_information set ?', data, function (error, results, fields){
          fs.copyFile('./public/images/icons/default_icon.jpg', './public/images/icons/'+results.insertId+'.jpg', (err) => {
               if (err) {
                   console.log(err.stack);
               }
               else {
                   console.log('Done.');
               }
           });

           fs.copyFile('./public/images/header/default_header.jpg', './public/images/header/'+results.insertId+'.jpg', (err) => {
               if (err) {
                   console.log(err.stack);
               }
               else {
                   console.log('Done.');
               }
           });
          add_theme(results.insertId, 3);
          add_image(results.insertId, 1, 2);
          add_list(results.insertId, 'theme', 3);
          add_list(results.insertId, 'image', 3);
          add_comment(results.insertId, 2, 4);
          add_likes(results.insertId, 3);
          add_follow(results.insertId, 2);
     });
     connection.end();
}

function reset_user(){
     var data1={'name': 'IR604', 'summary':'', 'uid': 'X3DzCttyDuY9KRaCnw3URBRnabT2'}
     var data2={'name': 'sub_account', 'summary':'', 'uid': 'mmc38o3BMKYjBrMoG00s1iUteg32'}

     var connection = mysql.createConnection(mysql_setting);
     connection.connect(); 
     connection.query('insert into user_information set ?', data1, function (error, results, fields){});
     connection.query('insert into user_information set ?', data2, function (error, results, fields){});
     connection.end();
}
function reset(){
     var connection = mysql.createConnection(mysql_setting);
     connection.connect(); 
     connection.query('TRUNCATE TABLE user_information', function (error, results, fields){});
     connection.query('TRUNCATE TABLE theme', function (error, results, fields){});
     connection.query('TRUNCATE TABLE tags', function (error, results, fields){});
     connection.query('TRUNCATE TABLE image', function (error, results, fields){});
     connection.query('TRUNCATE TABLE lists', function (error, results, fields){});
     connection.query('TRUNCATE TABLE list_contents', function (error, results, fields){});
     connection.query('TRUNCATE TABLE comment', function (error, results, fields){});
     connection.query('TRUNCATE TABLE likes', function (error, results, fields){});
     connection.query('TRUNCATE TABLE follow', function (error, results, fields){});
     connection.query('TRUNCATE TABLE notification', function (error, results, fields){
          reset_user()
     });
     connection.end();
}

function all(id){
     var connection = mysql.createConnection(mysql_setting);
      
     connection.connect();
     switch(id){
          case 'user':
               connection.query('SELECT * from user_information', function (error, results, fields){
                    console.log(results)
               });
               break;
          case 'theme':
               connection.query('SELECT * from theme', function (error, results, fields){
                    console.log(results)
               });
               break;
          case 'image':
               connection.query('SELECT * from image', function (error, results, fields){
                    console.log(results)
               });
               break;
          case 'lists':
               connection.query('SELECT * from lists', function (error, results, fields){
                    console.log(results)
               });
               break;
          case 'list_contents':
               connection.query('SELECT * from list_contents', function (error, results, fields){
                    console.log(results)
               });
               break;
          case 'comment':
               connection.query('SELECT * from comment', function (error, results, fields){
                    console.log(results)
               });
               break;
          case 'likes':
               connection.query('SELECT * from likes', function (error, results, fields){
                    console.log(results)
               });
               break;
          case 'follow':
               connection.query('SELECT * from follow', function (error, results, fields){
                    console.log(results)
               });
               break;
          case 'notification':
               connection.query('SELECT * from notification', function (error, results, fields){
                    console.log(results)
               });
               break;
          case 'tags':
               connection.query('SELECT * from tags', function (error, results, fields){
                    console.log(results)
               });
               break;
     }
      
     connection.end();
}
all('tags')