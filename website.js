var express = require('express');
var ejs = require("ejs");
var app = express();

app.engine('ejs',ejs.renderFile);

app.use(express.static('public'));

var multer = require('multer');
var filename;
var account_id=1;
var storage = multer.diskStorage({
    //ファイルの保存先を指定
    destination: function(req, file, cb){
        cb(null, './public/images/images')
    },
    //ファイル名を指定
    filename: function(req, file, cb){
        var original_name = file.originalname;
        filename  =Date.now()+'_'+account_id+'.'+original_name.split('.').pop();
        cb(null, filename)
    }
})

var upload = multer({storage:storage})

var mysql = require('mysql');

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: false}));

var mysql_setting = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ir604'
};

var { check, validationResult } = require('express-validator');

// トップページ
app.get("/", (req, res) => {
    var msg = 'IR604'
    var imagelink = '/image'
    var akauntolink = '/akaunto'
    var imageinfo;

    var connection = mysql.createConnection(mysql_setting);

    connection.connect();
    connection.query('SELECT * from image',function (error, results, fields){
        if (error == null){
            imageinfo = results
        }
    });
    connection.query('SELECT * from theme',function (error, results, fields){
        if (error == null){
            res.render('index.ejs',
            {
                title: 'ホームページ',
                name: msg,
                themeinfo: results,
                imageinfo: imageinfo,
                imagelink: imagelink,
                akauntolink: akauntolink
            });
        }
    });
    connection.end();
});

// ログインページ
app.get("/login", (req, res) => {
    res.render('login.ejs',
    {
        title: 'ホームページ'
    });
});

// imageページ
app.get("/im:imagelink", (req, res) => {
    var imagelink = req.params.imagelink
    var msg = 'IR604'
    var akauntolink = '/us1'
    var comments;
    var likejudge;
    var judgeresult = 0
    var follow_id = 0

    var connection = mysql.createConnection(mysql_setting);
    
    connection.connect(); 
    connection.query('SELECT * from likes where contents_id= ? and account_id= ?'
    ,[imagelink, account_id],function (error, results, fields){
        if (error == null){
            if(results[0]==null){
                likejudge='<form action="/likes" method="post">'
                +'<input type="hidden" name="id" value="'+imagelink+'">'
                +'<input type="hidden" name="link" value="/im'+imagelink+'">'
                +'<button type="submit" class="likebutton">'
                +'<span class="material-symbols-outlined">grade</span>'
                +'</button>'
                +'</form>';
            }else{
                likejudge='<form action="/deletelikes" method="post">'
                +'<input type="hidden" name="id" value="'+results[0].item_id+'">'
                +'<input type="hidden" name="link" value="/im'+imagelink+'">'
                +'<button type="submit" class="likebutton">'
                +'<span class="material-symbols-outlined" id="star-font">grade</span>'
                +'</button>'
                +'</form>';
            }
        }
    });

    connection.query('SELECT follow.* from follow INNER JOIN image ON follow.follow_id=image.account_id where follow.account_id= ? and image.item_id= ?'
    , [account_id, imagelink],function (error, results, fields){
        if (error == null){
            if(results[0]==null){
                judgeresult=0
            }else{
                judgeresult=1
                follow_id=results[0].item_id
            }
        }
    });

    connection.query('SELECT *, comment.summary as su1 FROM comment INNER JOIN user_information ON comment.account_id=user_information.item_id where image_id=?',imagelink ,function (error, results, fields){
        if (error == null){
            comments=results;
        }
    });   
    connection.query('SELECT image.*, theme.contents as c2, theme.tag as tag, user_information.name as username from image INNER JOIN theme ON image.theme_id=theme.item_id INNER JOIN user_information ON image.account_id=user_information.item_id where image.item_id=?',
    imagelink ,function (error, results, fields){
        if (error == null){
            var judgement
            var tag = results[0].tag;
            var tagArr = tag.split(',');

            if (judgeresult==0){
                judgement='<form action="/follow" method="post">'
                +'<input type="hidden" name="id" value="'+results[0].account_id+'">'
                +'<input type="hidden" name="link" value="/im'+imagelink+'">'
                +'<input type="submit" value="フォロー" class="follow-button">'
                +'</form>';
            }else{
                judgement='<form action="/deletefollow" method="post">'
                +'<input type="hidden" name="id" value="'+follow_id+'">'
                +'<input type="hidden" name="link" value="/im'+imagelink+'">'
                +'<input type="submit" value="フォロー解除" class="deletefollow-button">'
                +'</form>';
            }
            res.render('sample.ejs',
            {
                akauntolink: akauntolink,
                name: msg,
                comments: comments,
                imageinfo: results[0],
                tag: tagArr,
                judgement: judgement,
                likejudge: likejudge
            });
        }
    });
    connection.end();
});

// themeページ
app.get("/tm:themelink", (req, res) => {
    var themelink = req.params.themelink
    var msg = 'IR604'
    var akauntolink = '/us1'
    var judgeresult = 0
    var follow_id = 0

    var connection = mysql.createConnection(mysql_setting);

    connection.connect();
    connection.query('SELECT follow.* from follow INNER JOIN theme ON follow.follow_id=theme.account_id where follow.account_id= ? and theme.item_id= ?'
    , [account_id, themelink],function (error, results, fields){
        if (error == null){
            if(results[0]==null){
                judgeresult=0
            }else{
                judgeresult=1
                follow_id=results[0].item_id
            }
        }
    });
    
    connection.query('SELECT theme.*, user_information.name as username from theme INNER JOIN user_information ON theme.account_id=user_information.item_id where theme.item_id=?',themelink ,function (error, results, fields){
        if (error == null){
            var judgement
            var tag = results[0].tag;
            var tagArr = tag.split(',');
            
            if (judgeresult==0){
                judgement='<form action="/follow" method="post">'
                +'<input type="hidden" name="id" value="'+results[0].account_id+'">'
                +'<input type="hidden" name="link" value="/tm'+themelink+'">'
                +'<input type="submit" value="フォロー" class="follow-button">'
                +'</form>';
            }else{
                judgement='<form action="/deletefollow" method="post">'
                +'<input type="hidden" name="id" value="'+follow_id+'">'
                +'<input type="hidden" name="link" value="/tm'+themelink+'">'
                +'<input type="submit" value="フォロー解除" class="deletefollow-button">'
                +'</form>';
            }
            res.render('theme_page.ejs',
            {
                akauntolink: akauntolink,
                name: msg,
                themeinfo: results[0],
                tag: tagArr,
                judgement: judgement
            });
        }
    });
    connection.end();
});

// アカウントページ
app.get("/us:akauntolink", (req, res) => {
    var akauntolink = req.params.akauntolink
    var themeinfo;
    var imageinfo;
    var name = 'ir604'
    var judgement
    var connection = mysql.createConnection(mysql_setting);

    connection.connect();
    connection.query('SELECT * from follow where account_id= ? and follow_id= ?'
    ,[account_id, akauntolink],function (error, results, fields){
        if (error == null){
            if(results[0]==null){
                judgement='<form action="/follow" method="post">'
                +'<input type="hidden" name="id" value="'+akauntolink+'">'
                +'<input type="hidden" name="link" value="/us'+akauntolink+'">'
                +'<input type="submit" value="フォロー" class="follow-button">'
                +'</form>';
            }else{
                judgement='<form action="/deletefollow" method="post">'
                +'<input type="hidden" name="id" value="'+results[0].item_id+'">'
                +'<input type="hidden" name="link" value="/us'+akauntolink+'">'
                +'<input type="submit" value="フォロー解除" class="deletefollow-button">'
                +'</form>';
            }
        }
    });

    connection.query('SELECT * from theme where account_id=?',akauntolink ,function (error, results, fields){
        if (error == null){
            themeinfo=results
        }
    });
    connection.query('SELECT * from image where account_id=?',akauntolink ,function (error, results, fields){
        if (error == null){
            imageinfo=results
        }
    });

    connection.query('SELECT * from user_information where item_id=?',akauntolink ,function (error, results, fields){
        if (error == null){
            res.render('akaunto.ejs',
            {
                akauntoinfo: results[0],
                themeinfo:themeinfo,
                imageinfo:imageinfo,
                name:name,
                judgement:judgement
            });
        }
    });
    connection.end();
});

// themeuploadページ
app.get("/themeupload", (req, res) => {
    res.render('theme_upload.ejs',
    {
        error:'',
        form:{theme:''}
    });
});
// illustuploadページ
app.get("/illustupload", (req, res) => {
    var themeid = req.query.id
    
    var connection = mysql.createConnection(mysql_setting);

    connection.connect();    
    connection.query('SELECT contents from theme where item_id=?',themeid ,function (error, results, fields){
        if (error == null){
            res.render('image_upload.ejs',
            {
                themeid: themeid,
                themename: results[0]
            });
        }
    });
    connection.end();
});

// researchページ
app.get("/research", (req, res) => {
    var word = req.query.search;
    var title = word + 'の検索結果'
    var name = 'ir604'
    var imageinfo;
    
    var connection = mysql.createConnection(mysql_setting);

    connection.connect();
    connection.query('SELECT image.*, theme.tag from image INNER JOIN theme ON image.theme_id=theme.item_id where theme.tag like ? ','%'+word+'%' ,function (error, results, fields){
        if (error == null){
            imageinfo=results
        }
    });
    connection.query('SELECT * from theme where tag like ? ','%'+word+'%' ,function (error, results, fields){
        if (error == null){
            res.render('research.ejs',
            {
                title: title,
                search: word,
                name:name,
                themeinfo: results,
                imageinfo: imageinfo
            });
        }
    });
    connection.end();
});

// テーマアップロード処理
app.post('/themeupload',
check('theme', 'テーマは必ず入力してください。').notEmpty(),
(req, res) => {
    const error =validationResult(req);

    if(!error.isEmpty()){
        var re = '<ul>';
        var result_arr=error.array();
        for(var n in result_arr){
            re += '<li>' + result_arr[n].msg + '</li>'
        }
        re += '</ul>';

        res.render('theme_upload.ejs',{
            error: re,
            form: {theme:req.body.theme}
        });
    } else {
        var theme = req.body.theme;
        var tag = req.body.tag;
        var data = {'contents':theme, 'tag':tag, 'account_id': account_id}

        var connection = mysql.createConnection(mysql_setting);

        connection.connect();
        connection.query('insert into theme set ?', data, function (error, results, fields){
            res.redirect('/');
        });
        
        connection.end();
    }
});

// イラストアップロード処理
app.post('/illustupload',upload.single('file'),(req, res) => {
    var title = req.body.title;
    var gaiyou = req.body.gaiyou;
    var theme_id = req.body.id;
    var data = {'name':filename, 'title':title, 'likes':0, 'contents':gaiyou, 'theme_id':theme_id,  'account_id': account_id}

    var connection = mysql.createConnection(mysql_setting);

    connection.connect();
    connection.query('insert into image set ?', data, function (error, results, fields){
        res.redirect('/');
    });

    connection.end();
});

// コメントアップロード処理
app.post('/comment',(req, res) => {
    var summary = req.body.comment;
    var image_id = req.body.id;
    var redirect_link = req.body.link;
    var data = {'summary':summary, 'image_id':image_id, 'account_id': account_id}

    var connection = mysql.createConnection(mysql_setting);

    connection.connect();
    connection.query('insert into comment set ?', data, function (error, results, fields){
        res.redirect(redirect_link);
    });

    connection.end();
});

// フォロー処理
app.post('/follow',(req, res) => {
    var follow_id = req.body.id;
    var redirect_link = req.body.link;
    var data = {'account_id': account_id, 'follow_id':follow_id}

    var connection = mysql.createConnection(mysql_setting);

    connection.connect();
    connection.query('insert into follow set ?', data, function (error, results, fields){
        res.redirect(redirect_link);
    });

    connection.end();
});

app.post('/deletefollow',(req, res) => {
    var item_id = req.body.id;
    var redirect_link = req.body.link;

    var connection = mysql.createConnection(mysql_setting);

    connection.connect();
    connection.query('delete from follow where item_id= ?', item_id, function (error, results, fields){
        res.redirect(redirect_link);
    });

    connection.end();
});

// いいね処理
app.post('/likes',(req, res) => {
    var contents_id = req.body.id;
    var redirect_link = req.body.link;
    var data = {'contents_id': contents_id, 'account_id':account_id}

    var connection = mysql.createConnection(mysql_setting);

    connection.connect();
    connection.query('insert into likes set ?', data, function (error, results, fields){
        res.redirect(redirect_link);
    });

    connection.end();
});

app.post('/deletelikes',(req, res) => {
    var item_id = req.body.id;
    var redirect_link = req.body.link;

    var connection = mysql.createConnection(mysql_setting);

    connection.connect();
    connection.query('delete from likes where item_id= ?', item_id, function (error, results, fields){
        res.redirect(redirect_link);
    });

    connection.end();
});

var server = app.listen(3000, () => {
    console.log('Start server port:3000')
});