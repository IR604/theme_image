var express = require('express');
var ejs = require("ejs");
var app = express();

app.engine('ejs',ejs.renderFile);

app.use(express.static('public'));

var multer = require('multer');
var item_id;
var storage = multer.diskStorage({
  //ファイルの保存先を指定
  destination: function(req, file, cb){
    cb(null, './public/images/')
  },
  //ファイル名を指定
  filename: function(req, file, cb){
    cb(null, 'image.jpg')
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

    var connection = mysql.createConnection(mysql_setting);

    connection.connect();    
    connection.query('SELECT * from theme',function (error, results, fields){
        if (error == null){
            res.render('index.ejs',
            {
                title: 'ホームページ',
                name: msg,
                themeinfo: results,
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
app.get("/image", (req, res) => {
    var msg = 'IR604'
    var akauntolink = '/akaunto'
    var themelink = '/theme'
    res.render('sample.ejs',
    {
        title: 'イラストページ',
        theme: 'テーマ',
        gaiyou: '概要',
        akauntolink: akauntolink,
        themelink: themelink,
        name: msg,
        like: 0
    });
});

// themeページ
app.get("/tm:themelink", (req, res) => {
    var themelink = req.params.themelink
    var msg = 'IR604'
    var akauntolink = '/akaunto'

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

    var connection = mysql.createConnection(mysql_setting);

    connection.connect();    
    connection.query('SELECT * from user_information where item_id=?',akauntolink ,function (error, results, fields){
        if (error == null){
            res.render('akaunto.ejs',
            {
                akauntoinfo: results[0]
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
// imageuploadページ
app.get("/imageupload", (req, res) => {
    var theme = 'テーマ'
    var themeid = req.query.id

    var connection = mysql.createConnection(mysql_setting);

    connection.connect();    
    connection.query('SELECT contents from theme where item_id=?',themeid ,function (error, results, fields){
        if (error == null){
            res.render('image_upload.ejs',
            {
                theme: theme,
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
    res.render('research.ejs',
    {
        title: 'イラストページ',
        search: word
    });
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
        var data = {'contents':theme, 'tag':tag, 'account_id': 5}

        var connection = mysql.createConnection(mysql_setting);

        connection.connect();
        connection.query('insert into theme set ?', data, function (error, results, fields){
            res.redirect('/');
        });
        
        connection.end();
    }
});

// イラストアップロード処理
app.post('/imageupload',upload.single('file'),(req, res) => {
    // var imagename = req.body.imagename;
    var title = req.body.title;
    var gaiyou = req.body.gaiyou;
    res.redirect('/');
});

var server = app.listen(3000, () => {
    console.log('Start server port:3000')
});