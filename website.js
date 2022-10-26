var express = require('express');
var ejs = require("ejs");
var app = express();

app.engine('ejs',ejs.renderFile);

app.use(express.static('public'));

var multer = require('multer');
var filename;
var account_id=0;
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
var icon_storage = multer.diskStorage({
    //ファイルの保存先を指定
    destination: function(req, file, cb){
        cb(null, './public/images/icons')
    },
    //ファイル名を指定
    filename: function(req, file, cb){
        cb(null, account_id+'.jpg')
    }
})
var header_storage = multer.diskStorage({
    //ファイルの保存先を指定
    destination: function(req, file, cb){
        cb(null, './public/images/header')
    },
    //ファイル名を指定
    filename: function(req, file, cb){
        cb(null, account_id+'.jpg')
    }
})

var upload = multer({storage:storage})
var upload_icon = multer({storage:icon_storage})
var upload_header = multer({storage:header_storage})

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

// firebaseの設定
const firebase = require('firebase/app')
const firebase_auth = require('firebase/auth');
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
};

firebase.initializeApp(firebaseConfig);

// 関数
// ログインリンクかアイコンを設置
function judge_function() {
    var judge
    if(account_id==0){
        judge='<a href="login">ログイン</a>'
    }else{
        judge='<a href="us'+account_id+'">'
        +'<img src="images/icons/'+account_id+'.jpg"  id="avatar" alt=""  width="40" height="40">'
        +'</a>'
    }
    return judge;
}

// メニューの表示内容を設置
var menu_follow
var menu_follower
var menu_name
function menu_db(){
    var connection = mysql.createConnection(mysql_setting);
    connection.connect();
    follow_connect='SELECT X.account_id, '
    +'SUM(CASE X.kbn WHEN "follow" THEN X.cnt ELSE 0 END) AS follow,'
    +'SUM(CASE X.kbn WHEN "follower" THEN X.cnt ELSE 0 END) AS follower '
    +'FROM'
    +'(SELECT "follow" AS kbn, fl.account_id AS account_id, count(fl.follow_id) AS cnt '
    +'FROM follow fl '
    +'GROUP BY fl.account_id '
    +'UNION ALL '
    +'SELECT "follower" AS kbn, flw.follow_id AS account_id, count(flw.account_id) AS cnt '
    +'FROM follow flw '
    +'GROUP BY flw.follow_id'
    +') X '
    +'GROUP BY X.account_id '
    +'HAVING X.account_id= ?'
    connection.query(follow_connect,account_id ,function (error, results, fields){
        if (error == null){
            if(results[0]==null){
                menu_follow=0;
                menu_follower=0;
            }else{
                menu_follow=results[0].follow
                menu_follower=results[0].follower
            }
        }
    });
    connection.query('SELECT name from user_information where item_id=?',account_id ,function (error, results, fields){
        if (error == null){
            menu_name=results[0].name;
        }
    });
    connection.end();
}
function menu_summary(){
    var judge
    if(account_id==0){
        judge='<ul>'
        +'<h2>ページ</h2>'
        +'<a href="/">'
        +'<li><span class="material-symbols-outlined">home</span>　トップページ</li>'
        +'</a>'
        +'<h2>設定</h2>'
        +'<a href="/login">'
        +'<li><span class="material-symbols-outlined">login</span>　ログイン</li>'
        +'</a>'
        +'</ul>'
        return judge
    }else{
        menu_db()
        judge='<div class="menu_user">'
        +'<div class="menu_icon">'
        +'<img src="images/icons/'+account_id+'.jpg"  id="avatar" alt=""  width="100" height="100">'
        +'</div>'
        +'<div class="menu_right">'
        +'<div class="menu_name">'
        +menu_name
        +'</div>'
        +'<div class="menu_follow">'
        +'<a href="/follow?id='+account_id+'" class="followlink">フォロー：'+menu_follow+'</a><br>'
        +'<a href="/follower?id='+account_id+'" class="followlink">フォロワー：'+menu_follower
        +'</a></div>'
        +'</div>'
        +'</div>'
        +'<h2>ページ</h2>'
        +'<ul>'
        +'<a href="/">'
        +'<li><span class="material-symbols-outlined">home</span>　トップページ</li>'
        +'</a>'
        +'<a href="/us'+account_id+'">'
        +'<li><span class="material-symbols-outlined">person</span>　マイページ</li>'
        +'</a>'
        +'<h2>コンテンツ</h2>'
        +'<a href="#">'
        +'<li><span class="material-symbols-outlined">article</span>　フォローユーザーのテーマ</li>'
        +'</a>'
        +'<a href="#">'
        +'<li><span class="material-symbols-outlined">image</span>　フォローユーザーのイラスト</li>'
        +'</a>'
        +'<a href="#">'
        +'<li><span class="material-symbols-outlined">star</span>　いいね一覧</li>'
        +'</a>'
        +'<h2>設定</h2>'
        +'<a href="/setting_user">'
        +'<li><span class="material-symbols-outlined">settings</span>　設定</li>'
        +'</a>'
        +'<a href="#">'
        +'<li><span class="material-symbols-outlined">logout</span>　ログアウト</li>'
        +'</a>'
        +'</ul>'
        return judge
    }
}

// アップロード用の通知
function upload_mytheme(item_id, visited_id){
    var connection = mysql.createConnection(mysql_setting);

    connection.connect();
    const bell='insert into notification set '
    +'visiter_id='+account_id
    +',visited_id='+visited_id
    +',contents_id='+item_id
    +',type="image",contents_post=false'
    +', summary=(SELECT CONCAT(name, "さんがあなたのテーマで投稿しました。") FROM user_information where item_id='+account_id+')'
    connection.query(bell, function (error, results, fields){
    });
    connection.end();
}
function upload_notification(item_id, title, type){
    var connection = mysql.createConnection(mysql_setting);

    connection.connect();
    const bell='insert into notification set '
    +'visiter_id='+account_id
    +',visited_id=0'
    +',contents_id='+item_id
    +',type="'+type+'",contents_post=true'
    +', summary=(SELECT CONCAT(name, "さんが「'+title+'」をアップロードしました。") FROM user_information where item_id='+account_id+')'
    connection.query(bell, function (error, results, fields){
    });
    connection.end();
}

// ページ一覧
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
                akauntolink: akauntolink,
                header_icon: judge_function(),
                header_menu:menu_summary()
            });
        }
    });
    connection.end();
});

// ログイン・アカウント制作関係
// ログインページ
app.get("/login", (req, res) => {
    res.render('login.ejs',
    {
        title: 'ホームページ'
    });
});
// アカウント作成ページ
app.get("/making_account", (req, res) => {
    res.render('account_make.ejs',
    {
        title: 'ホームページ'
    });
});
// 確認コード入力ページ
app.get("/enter_code", (req, res) => {
    res.render('account_code.ejs',
    {
        title: 'ホームページ'
    });
});

// imageページ
app.get("/im:imagelink", (req, res) => {
    var imagelink = req.params.imagelink
    var msg = 'IR604'
    var sametheme;
    var comments;
    var likejudge;
    var judgeresult = 0
    var follow_id = 0
    var like;

    var connection = mysql.createConnection(mysql_setting);
    
    connection.connect(); 
    var list_add=''
    if(account_id==0){
        list_add='<a href="login">ログインが必要です。</a>'
    }else{
        list_add='<form action="/contents_insert" method="post">'
        +'<input type="hidden" name="contents_id" value="'+imagelink+'">'
        +'<input type="hidden" name="link" value="/im'+imagelink+'">'
        connection.query('SELECT * from lists where account_id=? and type="image"',account_id,function (error, results, fields){
            if (error == null){
                for(var i in results){
                    list_add+='<div class="setting_sample"><input type="radio" class="decided" name="list_id" value='+results[i].item_id+'>'+results[i].title+'</div>';
                }
                list_add+='<input type="submit" value="投稿"></input>'
                +'</form>'
            }
        });
    }

    var user_id=0
    connection.query('SELECT account_id from image where item_id= ?'
    ,imagelink,function (error, results, fields){
        if (error == null){
            user_id=results[0].account_id;
        }
    });
    connection.query('SELECT * from likes where contents_id= ? and account_id= ?'
    ,[imagelink, account_id],function (error, results, fields){
        if (error == null){
            if(results[0]==null){
                likejudge='<form action="/likes" method="post">'
                +'<input type="hidden" name="id" value="'+imagelink+'">'
                +'<input type="hidden" name="user_id" value="'+user_id+'">'
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
    connection.query('SELECT contents_id, count(*) as likes FROM likes GROUP BY contents_id HAVING contents_id= ?;'
    ,imagelink ,function (error, results, fields){
        if (error == null){
            if(results[0]==null){
                like=0
            }else{
                like=results[0].likes
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
    connection.query('SELECT * FROM image WHERE theme_id = (SELECT theme_id FROM image WHERE item_id= ?);',imagelink ,function (error, results, fields){
        if (error == null){
            sametheme=results;
        }
    });

    connection.query('SELECT image.*, theme.contents as c2, theme.tag as tag, user_information.name as username from image INNER JOIN theme ON image.theme_id=theme.item_id INNER JOIN user_information ON image.account_id=user_information.item_id where image.item_id=?',
    imagelink ,function (error, results, fields){
        if (error == null){
            var judgement
            var tag = results[0].tag;
            var tagArr = tag.split(',');

            if (results[0].account_id==account_id){
                judgement='';
            }else if (judgeresult==0){
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
                name: msg,
                comments: comments,
                imageinfo: results[0],
                sametheme:sametheme,
                tag: tagArr,
                judgement: judgement,
                likejudge: likejudge,
                like:like,
                list_add: list_add,
                header_icon: judge_function(),
                header_menu:menu_summary()
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
    var imageinfo;
    var judgeresult = 0
    var follow_id = 0

    var connection = mysql.createConnection(mysql_setting);

    connection.connect();

    var list_add=''
    if(account_id==0){
        list_add='<a href="login">ログインが必要です。</a>'
    }else{
        list_add='<form action="/contents_insert" method="post">'
        +'<input type="hidden" name="contents_id" value="'+themelink+'">'
        +'<input type="hidden" name="link" value="/tm'+themelink+'">'
        connection.query('SELECT * from lists where account_id=? and type="theme"',account_id,function (error, results, fields){
            if (error == null){
                for(var i in results){
                    list_add+='<div class="setting_sample"><input type="radio" class="decided" name="list_id" value='+results[i].item_id+'>'+results[i].title+'</div>';
                }
                list_add+='<input type="submit" value="投稿"></input>'
                +'</form>'
            }
        });
    }
    
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
    
    connection.query('SELECT * from image where theme_id= ?'
    , themelink,function (error, results, fields){
        if (error == null){
            imageinfo=results
        }
    });

    connection.query('SELECT theme.*, user_information.name as username from theme INNER JOIN user_information ON theme.account_id=user_information.item_id where theme.item_id=?',themelink ,function (error, results, fields){
        if (error == null){
            var judgement
            var tag = results[0].tag;
            var tagArr = tag.split(',');
            
            if (results[0].account_id==account_id){
                judgement='';
            }else if(judgeresult==0){
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
                imageinfo: imageinfo,
                tag: tagArr,
                judgement: judgement,
                list_add: list_add,
                header_icon: judge_function(),
                header_menu:menu_summary()
            });
        }
    });
    connection.end();
});

// 一覧ページ
// リストに追加されたコンテンツ
app.get("/li:listlink", (req, res) => {
    var listlink = req.params.listlink
    var connection = mysql.createConnection(mysql_setting);

    connection.connect();
    var judge=''
    var title=''
    connection.query('SELECT type, title from lists where item_id=?',listlink,function (error, results, fields){
        if (error == null){
            judge=results[0].type
            title=results[0].title
        }
    });

    
    connection.query('SELECT * FROM theme where item_id IN (SELECT contents_id from list_contents where list_id=?)',listlink,function (error, results, fields){
        if (error == null){
            if(judge=='theme'){
                res.render('theme_list.ejs',
                {
                    title: title,
                    themeinfo: results,
                    header_icon: judge_function(),
                    header_menu:menu_summary()
                });
            }
        }
    });
    connection.query('SELECT * FROM image where item_id IN (SELECT contents_id from list_contents where list_id=?)',listlink,function (error, results, fields){
        if (error == null){
            if(judge=='image'){
                res.render('image_list.ejs',
                {
                    title: title,
                    imageinfo: results,
                    header_icon: judge_function(),
                    header_menu:menu_summary()
                });
            }
        }
    });
    connection.end();
});
app.get("/theme_list", (req, res) => {
    var connection = mysql.createConnection(mysql_setting);

    connection.connect();
    connection.query('SELECT * from theme',function (error, results, fields){
        if (error == null){
            res.render('theme_list.ejs',
            {
                themeinfo: results,
                header_icon: judge_function(),
                header_menu:menu_summary()
            });
        }
    });
    connection.end();
});
app.get("/illust_list", (req, res) => {
    var connection = mysql.createConnection(mysql_setting);

    connection.connect();
    connection.query('SELECT * from image',function (error, results, fields){
           if (error == null){
            res.render('image_list.ejs',
            {
                imageinfo: results,
                header_icon: judge_function(),
                header_menu:menu_summary()
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
    var listinfo;
    var name = 'ir604'
    var judgement
    var follow;
    var follower;
    var make_list='';
    var connection = mysql.createConnection(mysql_setting);

    connection.connect();
    connection.query('SELECT * from follow where account_id= ? and follow_id= ?'
    ,[account_id, akauntolink],function (error, results, fields){
        if (error == null){
            if(akauntolink==account_id){
                make_list='<details>'
                +'<summary class="menuber">'
                +'<div class="make_list"><span class="material-symbols-outlined">add</span>リストを作成</div>'
                +'</summary>'
                +'<div class="setting_summary">'
                +'<form action="/create_list" method="post">'
                +'<input type="text" class="inputfield" name="title" placeholder="タイトル">'
                +'<div class="setting_sample"><input type="radio" class="decided" name="type" value="theme" checked>テーマ</div>'
                +'<div class="setting_sample"><input type="radio" class="decided" name="type" value="image">イラスト</div>'
                +'<input type="submit" value="作成">'
                +'</form>'
                +'</div>'
                +'</details>'
                judgement='';
            }else if(results[0]==null){
                judgement='<form action="/follow" method="post">'
                +'<input type="hidden" name="id" value="'+akauntolink+'">'
                +'<input type="hidden" name="link" value="/us'+akauntolink+'">'
                +'<input type="submit" value="フォロー" class="follow-button">'
                +'</form>';
            }
            else{
                judgement='<form action="/deletefollow" method="post">'
                +'<input type="hidden" name="id" value="'+results[0].item_id+'">'
                +'<input type="hidden" name="link" value="/us'+akauntolink+'">'
                +'<input type="submit" value="フォロー解除" class="deletefollow-button">'
                +'</form>';
            }
        }
    });

    follow_connect='SELECT X.account_id, '
    +'SUM(CASE X.kbn WHEN "follow" THEN X.cnt ELSE 0 END) AS follow,'
    +'SUM(CASE X.kbn WHEN "follower" THEN X.cnt ELSE 0 END) AS follower '
    +'FROM'
    +'(SELECT "follow" AS kbn, fl.account_id AS account_id, count(fl.follow_id) AS cnt '
    +'FROM follow fl '
    +'GROUP BY fl.account_id '
    +'UNION ALL '
    +'SELECT "follower" AS kbn, flw.follow_id AS account_id, count(flw.account_id) AS cnt '
    +'FROM follow flw '
    +'GROUP BY flw.follow_id'
    +') X '
    +'GROUP BY X.account_id '
    +'HAVING X.account_id= ?'
    connection.query(follow_connect,akauntolink ,function (error, results, fields){
        if (error == null){
            if(results[0]==null){
                follow=0;
                follower=0;
            }else{
                follow=results[0].follow
                follower=results[0].follower
            }
        }
    });

    // リスト情報
    connection.query('SELECT *, (CASE WHEN type="theme" THEN "article" WHEN type="image" THEN "image" END)AS icon from lists where account_id=?',akauntolink ,function (error, results, fields){
        if (error == null){
            listinfo=results
        }
    });
    // テーマ情報
    connection.query('SELECT * from theme where account_id=?',akauntolink ,function (error, results, fields){
        if (error == null){
            themeinfo=results
        }
    });
    // イラスト情報
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
                listinfo:listinfo,
                name:name,
                judgement:judgement,
                follow: follow,
                follower: follower,
                make_list: make_list,
                header_icon: judge_function(),
                header_menu:menu_summary()
            });
        }
    });
    connection.end();
});

// themeuploadページ
app.get("/themeupload", (req, res) => {
    if(account_id==0){
        res.redirect('/login');
    }else{
        res.render('theme_upload.ejs',
        {
            error:'',
            form:{theme:''},
            header_icon: judge_function(),
            header_menu:menu_summary()
        });
    }
});
// illustuploadページ
app.get("/illustupload", (req, res) => {
    if(account_id==0){
        res.redirect('/login');
    }else{
        var themeid = req.query.id
        
        var connection = mysql.createConnection(mysql_setting);

        connection.connect();    
        connection.query('SELECT contents from theme where item_id=?',themeid ,function (error, results, fields){
            if (error == null){
                res.render('image_upload.ejs',
                {
                    themeid: themeid,
                    themename: results[0],
                    header_icon: judge_function(),
                    header_menu:menu_summary()
                });
            }
        });
        connection.end();
    }
});

// researchページ
app.get("/research", (req, res) => {
    var word = req.query.search;
    var type = req.query.decide;

    var word_split=word.split(/[ 　]/)
    var title = word + 'の検索結果'
    var name = 'ir604'
    var imageinfo;
    var userinfo;

    var DB_result_theme='SELECT * from theme where '
    var DB_result_image='SELECT image.*, theme.tag from image INNER JOIN theme ON image.theme_id=theme.item_id where '
    var DB_result_name='SELECT * from user_information where '
    var Search_ber=''
    var setting='<div class="setting_sample"><input type="radio" class="decided" name="decide" value="tag" checked>タグ部分一致</div>'
    +'<div class="setting_sample"><input type="radio" class="decided" name="decide" value="title">タイトル部分一致</div>'
    for(var i in word_split){
        Search_ber+=word_split[i]
        if(type=='tag'){
            DB_result_theme+='tag like "%'+word_split[i]+'%"'
            DB_result_image+='theme.tag like "%'+word_split[i]+'%"'
        }else{
            DB_result_theme+='contents like "%'+word_split[i]+'%"'
            DB_result_image+='image.title like "%'+word_split[i]+'%"'
            setting='<div class="setting_sample"><input type="radio" class="decided" name="decide" value="tag">タグ部分一致</div>'
            +'<div class="setting_sample"><input type="radio" class="decided" name="decide" value="title" checked>タイトル部分一致</div>'
        }
        DB_result_name+='name like "%'+word_split[i]+'%"'
        if(i!=word_split.length-1){
            Search_ber+=' '
            DB_result_theme+=' and '
            DB_result_image+=' and '
            DB_result_name+=' and '
        }
    }
    
    var connection = mysql.createConnection(mysql_setting);
    connection.connect();
    // ユーザー
    connection.query(DB_result_name ,function (error, results, fields){
        if (error == null){
            userinfo=results
        }
    });
    // イラスト
    connection.query(DB_result_image ,function (error, results, fields){
        if (error == null){
            imageinfo=results
        }
    });
    // テーマ
    connection.query(DB_result_theme ,function (error, results, fields){
        if (error == null){
            res.render('research.ejs',
            {
                title: title,
                search: Search_ber,
                setting:setting,
                name:name,
                themeinfo: results,
                imageinfo: imageinfo,
                userinfo: userinfo,
                header_icon: judge_function(),
                header_menu:menu_summary()
            });
        }
    });
    connection.end();
});

// 通知ページ
app.get("/notification", (req, res) => {
    if(account_id==0){
        res.redirect('/login')
    }else{
        var connection = mysql.createConnection(mysql_setting);

        connection.connect();
        const bell='SELECT *, (CASE WHEN type="theme" THEN "th" WHEN type="image" THEN "im" WHEN type="user" THEN "us" END)AS typeM from notification '
        +'where (contents_post=false AND visited_id=?) '
        +'OR (contents_post=true AND visiter_id IN (SELECT follow_id FROM follow where account_id=?)) '
        +'ORDER BY item_id desc'
        connection.query(bell, [account_id, account_id], function (error, results, fields){
            res.render('notification.ejs',
            {
                notification:results,
                header_icon: judge_function(),
                header_menu:menu_summary()
            });
        });
        connection.end();
    }
});

// フォロー・フォロワー一覧
// フォロー一覧
app.get("/follow", (req, res) => {
    var user_id = req.query.id;

    var title=''

    var connection = mysql.createConnection(mysql_setting);

    connection.connect();
    connection.query('SELECT name from user_information where item_id=?',user_id ,function (error, results, fields){
        if (error == null){
            title=results[0].name+'がフォローしたユーザー'
        }
    });

    connection.query('SELECT * from user_information where item_id IN '
    +'(SELECT follow_id FROM follow where account_id= ?)',user_id ,function (error, results, fields){
        if (error == null){
            res.render('user_list.ejs',
            {
                title:title,
                userinfo:results,
                header_icon: judge_function(),
                header_menu:menu_summary()
            });
        }
    });
    connection.end();
});
// フォロワー一覧
app.get("/follower", (req, res) => {
    var user_id = req.query.id;

    var title=''

    var connection = mysql.createConnection(mysql_setting);

    connection.connect();
    connection.query('SELECT name from user_information where item_id=?',user_id ,function (error, results, fields){
        if (error == null){
            title=results[0].name+'をフォローしたユーザー'
        }
    });

    connection.query('SELECT * from user_information where item_id IN '
    +'(SELECT account_id FROM follow where follow_id= ?)',user_id ,function (error, results, fields){
        if (error == null){
            res.render('user_list.ejs',
            {
                title:title,
                userinfo:results,
                header_icon: judge_function(),
                header_menu:menu_summary()
            });
        }
    });
    connection.end();
});

// 設定ページ
app.get("/setting_user", (req, res) => {
    if(account_id==0){
        res.redirect('/login')
    }else{
        var connection = mysql.createConnection(mysql_setting);

        connection.connect();
        connection.query('SELECT * from user_information where item_id=?',account_id ,function (error, results, fields){
            if (error == null){
                res.render('setting_user.ejs',
                {
                    userinfo: results[0],
                    header_icon: judge_function(),
                    header_menu:menu_summary()
                });
            }
        });
        connection.end();
    }
});
app.get("/setting_password", (req, res) => {
    if(account_id==0){
        res.redirect('/login')
    }else{
        res.render('setting_password.ejs',
        {
            header_icon: judge_function(),
            header_menu:menu_summary()
        });
    }
});

// ログイン処理
app.post('/login', (req, res) => {
    var email = req.body.email;
    var password = req.body.password;
    
    const auth=firebase_auth.getAuth();
    firebase_auth.signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
        // Signed in
        const user = userCredential.user;
        console.log(user.uid);
        var connection = mysql.createConnection(mysql_setting);

        connection.connect(); 
        connection.query('SELECT item_id from user_information where uid = ?',user.uid,function (error, results, fields){
            account_id=results[0].item_id
            res.redirect('/');
        });
        connection.end();
    })
    .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode);
        console.log(errorMessage);
        res.redirect('/login');
    });
});

app.post('/logout', (req, res) => {
    var email = req.body.email;
    var password = req.body.password;
    
    const auth=firebase_auth.getAuth();
    firebase_auth.signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
        // Signed in
        const user = userCredential.user;
        console.log(user.uid);
        var connection = mysql.createConnection(mysql_setting);

        connection.connect(); 
        connection.query('SELECT item_id from user_information where uid = ?',user.uid,function (error, results, fields){
            account_id=results[0].item_id
            res.redirect('/');
        });
        connection.end();
    })
    .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode);
        console.log(errorMessage);
        res.redirect('/login');
    });
});

app.post('/create_account', (req, res) => {
    var name = req.body.name;
    var email = req.body.email;
    var password = req.body.password;
    

    const auth=firebase_auth.getAuth();
    firebase_auth.createUserWithEmailAndPassword(auth ,email, password)
    .then((userCredential) => {
        // Signed in
        var user = userCredential.user;
        var data = {'name': name, 'summary':'', 'uid': user.uid}

        var connection = mysql.createConnection(mysql_setting);
        connection.connect(); 
        connection.query('insert into user_information set ?', data, function (error, results, fields){
            res.redirect('/login');
        });
        connection.end();
    })
    .catch((error) => {
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log(errorCode);
        console.log(errorMessage);
        res.redirect('/making_account');
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
            form: {theme:req.body.theme},
            header_icon: judge_function()
        });
    } else {
        var theme = req.body.theme;
        var tag = req.body.tag;
        var data = {'contents':theme, 'tag':tag, 'account_id': account_id}
        
        var connection = mysql.createConnection(mysql_setting);

        connection.connect();
        connection.query('insert into theme set ?', data, function (error, results, fields){
            upload_notification(results.insertId, theme, 'theme')
            res.redirect('/tm'+results.insertId);
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

    var theme_account=0
    connection.query('SELECT account_id FROM theme where item_id=?',theme_id, function (error, results, fields){
        theme_account=results[0].account_id
    });

    connection.query('insert into image set ?', data, function (error, results, fields){
        upload_notification(results.insertId, title, 'image', theme_id)
        if(account_id!=theme_account){
            upload_mytheme(results.insertId, theme_account)
        }
        res.redirect('/im'+results.insertId);
    });

    connection.end();
});

// リスト作成処理
app.post('/create_list',(req, res) => {
    var title = req.body.title;
    var type = req.body.type;
    var data = {'title':title, 'type':type, 'account_id': account_id}

    var connection = mysql.createConnection(mysql_setting);

    connection.connect();
    connection.query('insert into lists set ?', data, function (error, results, fields){
        res.redirect('/us'+account_id);
    });

    connection.end();
});
// コンテンツの追加
app.post('/contents_insert',upload.single('file'),(req, res) => {
    var list_id = req.body.list_id;
    var contents_id = req.body.contents_id;
    var link=req.body.link;
    var data = {'list_id':list_id, 'contents_id':contents_id}

    var connection = mysql.createConnection(mysql_setting);

    connection.connect();
    connection.query('insert into list_contents set ?', data, function (error, results, fields){
        res.redirect(link);
    });

    connection.end();
});

// コメントアップロード処理
app.post('/comment',(req, res) => {
    if(account_id==0){
        res.redirect('/login');
    }else{
        var summary = req.body.comment;
        var user_id = req.body.user_id;
        var image_id = req.body.id;
        var redirect_link = req.body.link;
        var data = {'summary':summary, 'image_id':image_id, 'account_id': account_id}

        var connection = mysql.createConnection(mysql_setting);

        connection.connect();
        if(user_id!=account_id){
            const bell='insert into notification set '
            +'visiter_id='+account_id
            +',visited_id=(SELECT account_id FROM image where item_id='+image_id
            +'),contents_id='+image_id
            +',type="image",contents_post=false'
            +', summary=(SELECT CONCAT(name, "さんがあなたのイラストにコメントしました。") FROM user_information where item_id='+account_id+')'
            connection.query(bell, function (error, results, fields){
            });
        }
        
        connection.query('insert into comment set ?', data, function (error, results, fields){
            res.redirect(redirect_link);
        });

        connection.end();
    }
});

// フォロー処理
app.post('/follow',(req, res) => {
    var follow_id = req.body.id;
    var redirect_link = req.body.link;
    if(account_id==0){
        res.redirect('/login');
    }else if(account_id==follow_id){
        res.redirect(redirect_link);
    }
    else{
        var data = {'account_id': account_id, 'follow_id':follow_id}
        var connection = mysql.createConnection(mysql_setting);
    
        connection.connect();
        const bell='insert into notification set '
        +'visiter_id='+account_id
        +',visited_id='+follow_id
        +',contents_id='+account_id
        +',type="user",contents_post=false'
        +', summary=(SELECT CONCAT(name, "さんがあなたをフォローしました。") FROM user_information where item_id='+account_id+')'
        connection.query(bell, function (error, results, fields){
        });
        connection.query('insert into follow set ?', data, function (error, results, fields){
            res.redirect(redirect_link);
        });
    
        connection.end();
    }
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
    if(account_id==0){
        res.redirect('/login');
    }else{
        var contents_id = req.body.id;
        var user_id = req.body.user_id;
        var redirect_link = req.body.link;

        var data = {'contents_id': contents_id, 'account_id':account_id}

        var connection = mysql.createConnection(mysql_setting);

        connection.connect();
        if(user_id!=account_id){
            const bell='insert into notification set '
            +'visiter_id='+account_id
            +',visited_id=(SELECT account_id FROM image where item_id='+contents_id
            +'),contents_id='+contents_id
            +',type="image",contents_post=false'
            +', summary=(SELECT CONCAT(name, "さんがあなたのイラストをいいねしました。") FROM user_information where item_id='+account_id+')'
            connection.query(bell, function (error, results, fields){
            });
        }
        
        connection.query('insert into likes set ?', data, function (error, results, fields){
            res.redirect(redirect_link);
        });

        connection.end();
    }
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

// 設定
app.post('/setting_icon',upload_icon.single('icon'),(req, res) => {
    res.redirect('/setting_user');
});
app.post('/setting_user',upload_header.single('header'),(req, res) => {
    var user_id = req.body.user_id;
    var name = req.body.name;
    var summary = req.body.summary;
    var uid = req.body.uid;
    var data = {'name': name, 'summary':summary, 'uid': uid}
    

    var connection = mysql.createConnection(mysql_setting);

    connection.connect();
    connection.query('update user_information set ? where item_id = ?', [data, user_id], function (error, results, fields){
        res.redirect('/setting_user');
    });

    connection.end();
});
app.post('/setting_password',(req, res) => {
    var email = req.body.email;
    var password = req.body.password;

    const auth=firebase_auth.getAuth();

    firebase_auth.updateEmail(auth.currentUser, email).then(() => {
    }).catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode);
        console.log(errorMessage);
    });

    firebase_auth.updatePassword(auth.currentUser, password).then(() => {
    }).catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode);
        console.log(errorMessage);
    });
    res.redirect('/setting_password');
});
var server = app.listen(3000, () => {
    console.log('Start server port:3000')
});