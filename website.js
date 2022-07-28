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

    var connection = mysql.createConnection(mysql_setting);
    
    connection.connect(); 
    connection.query('SELECT *, comment.summary as su1 FROM comment INNER JOIN user_information ON comment.account_id=user_information.item_id where image_id=?',imagelink ,function (error, results, fields){
        if (error == null){
            comments=results;
        }
    });   
    connection.query('SELECT *, image.contents as c1, image.item_id as id1 from image INNER JOIN theme ON image.theme_id=theme.item_id where image.item_id=?',
    imagelink ,function (error, results, fields){
        if (error == null){
            var tag = results[0].tag;
            var tagArr = tag.split(',');
            res.render('sample.ejs',
            {
                akauntolink: akauntolink,
                name: msg,
                comments: comments,
                imageinfo: results[0],
                tag: tagArr
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

    var connection = mysql.createConnection(mysql_setting);

    connection.connect();    
    connection.query('SELECT * from theme where item_id=?',themelink ,function (error, results, fields){
        if (error == null){
            var tag = results[0].tag;
            var tagArr = tag.split(',');
            res.render('theme_page.ejs',
            {
                akauntolink: akauntolink,
                name: msg,
                themeinfo: results[0],
                tag: tagArr
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
    var connection = mysql.createConnection(mysql_setting);

    connection.connect();
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
                name:name
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

var server = app.listen(3000, () => {
    console.log('Start server port:3000')
});