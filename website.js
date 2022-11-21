var express = require('express');
var ejs = require("ejs");
const fs = require('fs');
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

// タグ
function insert_tag(id, tag){
    var tagArr = tag.split(',');

    var connection = mysql.createConnection(mysql_setting);

    connection.connect();
    for(var i in tagArr){
        var data = {'tag':tagArr[i], 'theme_id': id}
        connection.query('insert into tags set ?', data, function (error, results, fields){
        });        
    }
    connection.end();
}

// ページ一覧
var sidemenu=''
app.all("*", (req, res, next) => {
    // メニュー
    var connection = mysql.createConnection(mysql_setting);
    connection.connect();
    if(account_id==0){
        sidemenu='<ul>'
        +'<h2>ページ</h2>'
        +'<a href="/">'
        +'<li><span class="material-symbols-outlined">home</span>　トップページ</li>'
        +'</a>'
        +'<h2>設定</h2>'
        +'<a href="/login">'
        +'<li><span class="material-symbols-outlined">login</span>　ログイン</li>'
        +'</a>'
        +'</ul>'
    }else{
        var follow=0
        var follower=0
        
        const follow_connect='SELECT X.account_id, '
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
                    follow=0;
                    follower=0;
                }else{
                    follow=results[0].follow
                    follower=results[0].follower
                }
            }
        });
        connection.query('SELECT name from user_information where item_id=?',account_id ,function (error, results, fields){
            sidemenu='<div class="menu_user">'
            +'<div class="menu_icon">'
            +'<img src="images/icons/'+account_id+'.jpg"  id="avatar" alt=""  width="100" height="100">'
            +'</div>'
            +'<div class="menu_right">'
            +'<div class="menu_name">'
            +results[0].name
            +'</div>'
            +'<div class="menu_follow">'
            +'<a href="/follow?id='+account_id+'" class="followlink">フォロー：'+follow+'</a><br>'
            +'<a href="/follower?id='+account_id+'" class="followlink">フォロワー：'+follower
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
            +'<a href="/follow_content?type=theme">'
            +'<li><span class="material-symbols-outlined">article</span>　フォローユーザーのテーマ</li>'
            +'</a>'
            +'<a href="/follow_content?type=image">'
            +'<li><span class="material-symbols-outlined">image</span>　フォローユーザーのイラスト</li>'
            +'</a>'
            +'<a href="/likes">'
            +'<li><span class="material-symbols-outlined">star</span>　いいね一覧</li>'
            +'</a>'
            +'<h2>設定</h2>'
            +'<a href="/setting_user">'
            +'<li><span class="material-symbols-outlined">settings</span>　設定</li>'
            +'</a>'
            +'<form action="/logout" method="post">'
            +'<li><button type="submit" class="logout_button"><span class="material-symbols-outlined">logout</span>　ログアウト</button></li>'
            +'</form>'
            +'</ul>'
        });
    }
    connection.end();
    next();
});

// トップページ
app.get("/", (req, res) => {
    var msg = 'IR604'
    var imagelink = '/image'
    var akauntolink = '/akaunto'
    var imageinfo;
    var connection = mysql.createConnection(mysql_setting);

    connection.connect();
    connection.query('SELECT image.*, SUM(CASE WHEN likes.item_id IS Null THEN 0 ELSE 1 END) AS "likes" '
    +'from image LEFT JOIN likes ON image.item_id=likes.contents_id GROUP BY item_id ORDER BY likes desc',function (error, results, fields){
        if (error == null){
            imageinfo = results
        }
    });
    connection.query('SELECT theme.*, SUM(A.likes) AS "likes" '
    +'FROM theme LEFT JOIN '
    +'(SELECT image.item_id, image.theme_id AS "theme", SUM(CASE WHEN likes.item_id IS Null THEN 0 ELSE 1 END) AS "likes" '
    +'FROM image LEFT JOIN likes ON image.item_id=likes.contents_id GROUP BY item_id) A ON theme.item_id=A.theme '
    +'GROUP BY theme.item_id ORDER BY likes desc',function (error, results, fields){
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
                header_menu:sidemenu
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
    var connection_image;
    var comments;
    var likejudge;
    var judgeresult = 0
    var follow_id = 0
    var like;
    var tag=''

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

    // フォローボタン
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

    // コメント
    connection.query('SELECT *, comment.summary as su1 FROM comment INNER JOIN user_information ON comment.account_id=user_information.item_id where image_id=? ORDER BY comment.item_id desc',imagelink ,function (error, results, fields){
        if (error == null){
            comments=results;
        }
    });

    // 同テーマのイラスト
    connection.query('SELECT image.*, SUM(CASE WHEN likes.item_id IS Null THEN 0 ELSE 1 END) AS "likes" '
    +'FROM image LEFT JOIN likes ON image.item_id=likes.contents_id WHERE theme_id = (SELECT theme_id FROM image WHERE item_id= ?) GROUP BY item_id ORDER BY likes desc',imagelink ,function (error, results, fields){
        if (error == null){
            sametheme=results;
        }
    });

    // 関連イラスト
    connection.query('SELECT image.*, SUM(CASE WHEN likes.item_id IS Null THEN 0 ELSE 1 END) AS "likes" '
    +'FROM image LEFT JOIN likes ON image.item_id=likes.contents_id WHERE theme_id IN (SELECT theme_id FROM tags WHERE tag IN '
    +'(SELECT tag FROM tags WHERE theme_id=(SELECT theme_id FROM image where item_id=?))) GROUP BY item_id ORDER BY likes desc'
    ,imagelink ,function (error, results, fields){
        if (error == null){
            connection_image=results;
        }
    });

    connection.query('SELECT tag from tags where theme_id=(SELECT theme_id FROM image where item_id=?)'
    , imagelink,function (error, results, fields){
        if (error == null){
            tag=results
        }
    });

    connection.query('SELECT image.*, theme.contents as c2, user_information.name as username from image INNER JOIN theme ON image.theme_id=theme.item_id INNER JOIN user_information ON image.account_id=user_information.item_id where image.item_id=?',
    imagelink ,function (error, results, fields){
        if (error == null){
            var judgement

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
                connection_image:connection_image,
                tag: tag,
                judgement: judgement,
                likejudge: likejudge,
                like:like,
                list_add: list_add,
                header_icon: judge_function(),
                header_menu:sidemenu
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
    var connection_theme;
    var judgeresult = 0
    var follow_id = 0
    var tag=''

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
    
    connection.query('SELECT image.*, SUM(CASE WHEN likes.item_id IS Null THEN 0 ELSE 1 END) AS "likes" '
    +'from image LEFT JOIN likes ON image.item_id=likes.contents_id where theme_id= ? GROUP BY item_id ORDER BY likes desc'
    , themelink,function (error, results, fields){
        if (error == null){
            imageinfo=results
        }
    });

    // 関連テーマ
    connection.query('SELECT theme.*, SUM(A.likes) AS "likes" '
    +'FROM theme LEFT JOIN '
    +'(SELECT image.item_id, image.theme_id AS "theme", SUM(CASE WHEN likes.item_id IS Null THEN 0 ELSE 1 END) AS "likes" '
    +'FROM image LEFT JOIN likes ON image.item_id=likes.contents_id GROUP BY item_id) A ON theme.item_id=A.theme '
    +'where theme.item_id IN (SELECT theme_id FROM tags WHERE tag IN (SELECT tag FROM tags WHERE theme_id=?)) '
    +'GROUP BY theme.item_id ORDER BY likes desc'
    , themelink,function (error, results, fields){
        if (error == null){
            connection_theme=results
        }
    });

    connection.query('SELECT tag from tags where theme_id= ?'
    , themelink,function (error, results, fields){
        if (error == null){
            tag=results
        }
    });

    connection.query('SELECT theme.*, user_information.name as username from theme INNER JOIN user_information ON theme.account_id=user_information.item_id where theme.item_id=?',themelink ,function (error, results, fields){
        if (error == null){
            var judgement
            
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
                connection_theme: connection_theme,
                tag: tag,
                judgement: judgement,
                list_add: list_add,
                header_icon: judge_function(),
                header_menu:sidemenu
            });
        }
    });
    connection.end();
});

// 一覧ページ
// リストに追加されたコンテンツ
app.get("/list:listlink", (req, res) => {
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

    
    connection.query('SELECT theme.*, list_contents.item_id AS list_id FROM theme INNER JOIN list_contents ON theme.item_id=list_contents.contents_id '
    +'where list_contents.list_id=? ORDER BY list_id desc',listlink,function (error, results, fields){
        if (error == null){
            if(judge=='theme'){
                res.render('theme_list.ejs',
                {
                    title: title,
                    themeinfo: results,
                    header_icon: judge_function(),
                    header_menu:sidemenu
                });
            }
        }
    });
    connection.query('SELECT image.*, list_contents.item_id AS list_id FROM image INNER JOIN list_contents ON image.item_id=list_contents.contents_id '
    +'where list_contents.list_id=? ORDER BY list_id desc',listlink,function (error, results, fields){
        if (error == null){
            if(judge=='image'){
                res.render('image_list.ejs',
                {
                    title: title,
                    imageinfo: results,
                    header_icon: judge_function(),
                    header_menu:sidemenu
                });
            }
        }
    });
    connection.end();
});
// 話題のテーマ・イラスト
app.get("/topic", (req, res) => {
    var type=req.query.type

    var connection = mysql.createConnection(mysql_setting);
    connection.connect();
    if(type=='theme'){
        connection.query('SELECT theme.*, SUM(A.likes) AS "likes" '
        +'FROM theme LEFT JOIN '
        +'(SELECT image.item_id, image.theme_id AS "theme", SUM(CASE WHEN likes.item_id IS Null THEN 0 ELSE 1 END) AS "likes" '
        +'FROM image LEFT JOIN likes ON image.item_id=likes.contents_id GROUP BY item_id) A ON theme.item_id=A.theme '
        +'GROUP BY theme.item_id ORDER BY likes desc',function (error, results, fields){
            if (error == null){
                res.render('theme_list.ejs',
                {
                    title:'話題のテーマ',
                    themeinfo: results,
                    header_icon: judge_function(),
                    header_menu:sidemenu
                });
            }
        });
    }else if(type=='image'){
        connection.query('SELECT image.*, SUM(CASE WHEN likes.item_id IS Null THEN 0 ELSE 1 END) AS "likes" '
        +'from image LEFT JOIN likes ON image.item_id=likes.contents_id GROUP BY item_id ORDER BY likes desc',function (error, results, fields){
            if (error == null){
                res.render('image_list.ejs',
                {
                    title:'話題のイラスト',
                    imageinfo: results,
                    header_icon: judge_function(),
                    header_menu:sidemenu
                });
            }
        });
    }else{
        res.redirect('/');
    }
    connection.end();
});
// 各テーマで投稿されたイラスト
app.get("/theme_image", (req, res) => {
    var theme_id=req.query.id

    var connection = mysql.createConnection(mysql_setting);

    connection.connect();
    connection.query('SELECT image.*, SUM(CASE WHEN likes.item_id IS Null THEN 0 ELSE 1 END) AS "likes" '
    +'from image LEFT JOIN likes ON image.item_id=likes.contents_id where theme_id= ? GROUP BY item_id ORDER BY likes desc',theme_id,function (error, results, fields){
        if (error == null){
            res.render('image_list.ejs',
            {
                title:'投稿されたイラスト',
                imageinfo: results,
                header_icon: judge_function(),
                header_menu:sidemenu
            });
        }
    });
    connection.end();
});
// 同テーマのイラスト
app.get("/same_image", (req, res) => {
    var theme_id=req.query.id

    var connection = mysql.createConnection(mysql_setting);

    connection.connect();
    connection.query('SELECT image.*, SUM(CASE WHEN likes.item_id IS Null THEN 0 ELSE 1 END) AS "likes" '
    +'FROM image LEFT JOIN likes ON image.item_id=likes.contents_id WHERE theme_id = ? GROUP BY item_id ORDER BY likes desc',theme_id,function (error, results, fields){
        if (error == null){
            res.render('image_list.ejs',
            {
                title:'同テーマのイラスト',
                imageinfo: results,
                header_icon: judge_function(),
                header_menu:sidemenu
            });
        }
    });
    connection.end();
});
// 各ユーザーがいいねしたイラスト
app.get("/likes", (req, res) => {
    if(account_id==0){
        res.redirect('/login');
    }else{
        var connection = mysql.createConnection(mysql_setting);
        connection.connect();
        connection.query('SELECT image.*, likes.item_id AS "likes_id" '
        +'FROM image INNER JOIN likes ON image.item_id=likes.contents_id WHERE likes.account_id = ? ORDER BY likes_id desc',account_id,function (error, results, fields){
            if (error == null){
                res.render('image_list.ejs',
                {
                    title:'いいねしたイラスト',
                    imageinfo: results,
                    header_icon: judge_function(),
                    header_menu:sidemenu
                });
            }
        });
        connection.end();
    }
});
// 各ユーザーがフォローしているユーザーのテーマ・イラスト
app.get("/follow_content", (req, res) => {
    if(account_id==0){
        res.redirect('/login');
    }else{
        var type=req.query.type

        var connection = mysql.createConnection(mysql_setting);
        connection.connect();
        if(type=='theme'){
            connection.query('SELECT * FROM theme WHERE account_id IN (SELECT follow_id FROM follow where account_id = ?) ORDER BY item_id desc',account_id,function (error, results, fields){
                if (error == null){
                    res.render('theme_list.ejs',
                    {
                        title:'フォローしたユーザーのテーマ',
                        themeinfo: results,
                        header_icon: judge_function(),
                        header_menu:sidemenu
                    });
                }
            });
        }else if(type=='image'){
            connection.query('SELECT * FROM image WHERE account_id IN (SELECT follow_id FROM follow where account_id = ?) ORDER BY item_id desc',account_id,function (error, results, fields){
                if (error == null){
                    res.render('image_list.ejs',
                    {
                        title:'フォローしたユーザーのイラスト',
                        imageinfo: results,
                        header_icon: judge_function(),
                        header_menu:sidemenu
                    });
                }
            });
        }
        connection.end();
    }
});
// 関連テーマ・イラスト
app.get("/connection", (req, res) => {
    var id=req.query.id
    var type=req.query.type

    var connection = mysql.createConnection(mysql_setting);

    connection.connect();
    if(type=='theme'){
        connection.query('SELECT theme.*, SUM(A.likes) AS "likes" '
        +'FROM theme LEFT JOIN '
        +'(SELECT image.item_id, image.theme_id AS "theme", SUM(CASE WHEN likes.item_id IS Null THEN 0 ELSE 1 END) AS "likes" '
        +'FROM image LEFT JOIN likes ON image.item_id=likes.contents_id GROUP BY item_id) A ON theme.item_id=A.theme '
        +'where theme.item_id IN (SELECT theme_id FROM tags WHERE tag IN (SELECT tag FROM tags WHERE theme_id=?)) '
        +'GROUP BY theme.item_id ORDER BY likes desc',id,function (error, results, fields){
            if (error == null){
                res.render('theme_list.ejs',
                {
                    title:'関連テーマ',
                    themeinfo: results,
                    header_icon: judge_function(),
                    header_menu:sidemenu
                });
            }
        });
    }else if(type=='image'){
        connection.query('SELECT image.*, SUM(CASE WHEN likes.item_id IS Null THEN 0 ELSE 1 END) AS "likes" '
        +'FROM image LEFT JOIN likes ON image.item_id=likes.contents_id WHERE theme_id IN '
        +'(SELECT theme_id FROM tags WHERE tag IN (SELECT tag FROM tags WHERE theme_id=(SELECT theme_id FROM image where item_id=?))) GROUP BY item_id ORDER BY likes desc'
        ,id,function (error, results, fields){
            if (error == null){
                res.render('image_list.ejs',
                {
                    title:'関連イラスト',
                    imageinfo: results,
                    header_icon: judge_function(),
                    header_menu:sidemenu
                });
            }
        });
    }
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
    connection.query('SELECT *, (CASE WHEN type="theme" THEN "article" WHEN type="image" THEN "image" END)AS icon from lists where account_id=? ORDER BY item_id desc',akauntolink ,function (error, results, fields){
        if (error == null){
            listinfo=results
        }
    });
    // テーマ情報
    connection.query('SELECT * from theme where account_id=? ORDER BY item_id desc',akauntolink ,function (error, results, fields){
        if (error == null){
            themeinfo=results
        }
    });
    // イラスト情報
    connection.query('SELECT * from image where account_id=? ORDER BY item_id desc',akauntolink ,function (error, results, fields){
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
                header_menu:sidemenu
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
            header_menu:sidemenu
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
                    header_menu:sidemenu
                });
            }
        });
        connection.end();
    }
});

// researchページ
app.get("/research", (req, res) => {
    var word = req.query.search;

    //SELECT * FROM theme WHERE contents REGEXP("(.*mp.*)|(.*s.*)");
    //SELECT * FROM theme LEFT JOIN tags ON theme.item_id=tags.theme_id;
    //SELECT DISTINCT theme.* FROM theme LEFT JOIN tags ON theme.item_id=tags.theme_id where tags.tag='sample' or tags.tag='tag' ;

    var word_split=word.split(/[ 　.\[\]*+?|^$\(\)\{\}-]/)
    var title = word + 'の検索結果'
    var name = 'ir604'
    var imageinfo;
    var userinfo;

    var research_words='REGEXP("'
    var Search_ber=''
    var setting='<div class="setting_sample"><input type="radio" class="decided" name="decide" value="tag" checked>タグ部分一致</div>'
    +'<div class="setting_sample"><input type="radio" class="decided" name="decide" value="title">タイトル部分一致</div>'
    for(var i in word_split){
        Search_ber+=word_split[i]
        research_words+='(.*'+word_split[i]+'.*)'
        if(i!=word_split.length-1){
            Search_ber+=' '
            research_words+='*'
        }else{
            research_words+='")'
        }
    }
    
    var DB_result_theme='SELECT DISTINCT theme.* from theme LEFT JOIN tags ON theme.item_id=tags.theme_id '
    +'where theme.contents '+research_words
    +'or tags.tag '+research_words
    +'ORDER by item_id desc'
    var DB_result_image='SELECT DISTINCT image.* from image LEFT JOIN tags ON image.theme_id=tags.theme_id '
    +'where image.title '+research_words
    +'or image.contents '+research_words
    +'or tags.tag '+research_words
    +'ORDER by item_id desc'
    var DB_result_name='SELECT * from user_information '
    +'where name '+research_words
    +'or summary '+research_words
    +'ORDER by name'

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
                header_menu:sidemenu
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
                header_menu:sidemenu
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

    connection.query('SELECT user_information.*, follow.item_id AS "follow" from user_information INNER JOIN follow ON user_information.item_id=follow.follow_id '
    +'where account_id=? ORDER BY follow desc',user_id ,function (error, results, fields){
        if (error == null){
            res.render('user_list.ejs',
            {
                title:title,
                userinfo:results,
                header_icon: judge_function(),
                header_menu:sidemenu
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
    
    connection.query('SELECT user_information.*, follow.item_id AS "follow" from user_information INNER JOIN follow ON user_information.item_id=follow.account_id '
    +'where follow_id=? ORDER BY follow desc',user_id ,function (error, results, fields){
        if (error == null){
            res.render('user_list.ejs',
            {
                title:title,
                userinfo:results,
                header_icon: judge_function(),
                header_menu:sidemenu
            });
        }
    });
    connection.end();
});
// いいねユーザー一覧
app.get("/likes_user", (req, res) => {
    var image_id = req.query.id;

    var title=''

    var connection = mysql.createConnection(mysql_setting);

    connection.connect();
    connection.query('SELECT title from image where item_id=?',image_id ,function (error, results, fields){
        if (error == null){
            title=results[0].title+'をいいねしたユーザー'
        }
    });

    connection.query('SELECT user_information.*, likes.item_id AS "likes_item_id" from user_information INNER JOIN likes ON user_information.item_id=likes.account_id '
    +'where contents_id=? ORDER BY likes_item_id desc',image_id ,function (error, results, fields){
        if (error == null){
            res.render('user_list.ejs',
            {
                title:title,
                userinfo:results,
                header_icon: judge_function(),
                header_menu:sidemenu
            });
        }
    });
    connection.end();
});

// 全コメント一覧
app.get("/comments", (req, res) => {
    var image_id = req.query.id;

    var imageinfo

    var connection = mysql.createConnection(mysql_setting);

    connection.connect();
    connection.query('SELECT * FROM image where item_id=?',image_id ,function (error, results, fields){
        imageinfo=results[0]
    });
    connection.query('SELECT comment.*, user_information.name as name FROM comment INNER JOIN user_information ON comment.account_id=user_information.item_id where image_id=? ORDER BY item_id desc',image_id ,function (error, results, fields){
        if (error == null){
            res.render('comment.ejs',
            {
                imageinfo:imageinfo,
                comments:results,
                header_icon: judge_function(),
                header_menu:sidemenu
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
                    header_menu:sidemenu
                });
            }
        });
        connection.end();
    }
});
app.get("/setting_theme", (req, res) => {
    if(account_id==0){
        res.redirect('/login')
    }else{
        var theme_id=req.query.id

        var tags=''

        var connection = mysql.createConnection(mysql_setting);

        connection.connect();
        connection.query('SELECT * FROM tags where theme_id=?',theme_id,function (error, results, fields){
            if (error == null){
                tags=results
            }
        });

        connection.query('SELECT * FROM theme where item_id=?',theme_id,function (error, results, fields){
            if (error == null){
                res.render('setting_theme.ejs',
                {
                    themeinfo:results[0],
                    tags:tags,
                    header_icon: judge_function(),
                    header_menu:sidemenu
                });
            }
        });
        connection.end();
    }
});
app.get("/setting_image", (req, res) => {
    if(account_id==0){
        res.redirect('/login')
    }else{
        var image_id=req.query.id

        var connection = mysql.createConnection(mysql_setting);

        connection.connect();
        connection.query('SELECT * FROM image where item_id=?',image_id,function (error, results, fields){
            if (error == null){
                res.render('setting_image.ejs',
                {
                    imageinfo:results[0],
                    header_icon: judge_function(),
                    header_menu:sidemenu
                });
            }
        });
        connection.end();
    }
});
app.get("/setting_list", (req, res) => {
    if(account_id==0){
        res.redirect('/login')
    }else{
        var list_id=req.query.id

        var judge
        var list_summary

        var connection = mysql.createConnection(mysql_setting);

        connection.connect();
        connection.query('SELECT * from lists where item_id=?',list_id,function (error, results, fields){
            if (error == null){
                judge=results[0].type
                list_summary=results[0]
            }
        });
        
        connection.query('SELECT theme.*, list_contents.item_id AS list_id FROM theme INNER JOIN list_contents ON theme.item_id=list_contents.contents_id '
        +'where list_contents.list_id=? ORDER BY list_id desc',list_id,function (error, results, fields){
            if (error == null){
                if(judge=='theme'){
                    res.render('setting_list_theme.ejs',
                    {
                        
                        list_summary:list_summary,
                        contents:results,
                        header_icon: judge_function(),
                        header_menu:sidemenu
                    });
                }
            }
        });
            connection.query('SELECT image.*, list_contents.item_id AS list_id FROM image INNER JOIN list_contents ON image.item_id=list_contents.contents_id '
            +'where list_contents.list_id=? ORDER BY list_id desc',list_id,function (error, results, fields){
                if (error == null){
                    if(judge=='image'){
                        res.render('setting_list_image.ejs',
                        {
                            list_summary:list_summary,
                            contents:results,
                            header_icon: judge_function(),
                            header_menu:sidemenu
                        });
                    }
                }
            });
        connection.end();
    }
});
app.get("/setting_contents", (req, res) => {
    if(account_id==0){
        res.redirect('/login')
    }else{
        var themeinfo
        var imageinfo

        var connection = mysql.createConnection(mysql_setting);

        connection.connect();
        connection.query('SELECT * FROM theme where account_id=?',account_id,function (error, results, fields){
            if (error == null){
                themeinfo = results
            }
        });
        connection.query('SELECT * FROM image where account_id=?',account_id,function (error, results, fields){
            if (error == null){
                imageinfo = results
            }
        });
        connection.query('SELECT *, (CASE WHEN type="theme" THEN "article" WHEN type="image" THEN "image" END)AS icon FROM lists where account_id=?',account_id,function (error, results, fields){
            if (error == null){
                res.render('setting_contents.ejs',
                {
                    themeinfo:themeinfo,
                    imageinfo:imageinfo,
                    listinfo:results,
                    header_icon: judge_function(),
                    header_menu:sidemenu
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
            header_menu:sidemenu
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
    const auth=firebase_auth.getAuth();
    firebase_auth.signOut(auth)
    .then((userCredential) => {
        // Signed in
        account_id=0
        console.log('signout');
        res.redirect('/login');
    })
    .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode);
        console.log(errorMessage);
        res.redirect('/');
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
            header_icon: judge_function(),
            header_menu:sidemenu
        });
    } else {
        var theme = req.body.theme;
        var tag = req.body.tag;
        var data = {'contents':theme, 'tag':tag, 'account_id': account_id}
        
        var connection = mysql.createConnection(mysql_setting);

        connection.connect();
        connection.query('insert into theme set ?', data, function (error, results, fields){
            if(tag!=''){
                insert_tag(results.insertId, tag)
            }
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
    var password = req.body.password;

    const auth=firebase_auth.getAuth();

    firebase_auth.updatePassword(auth.currentUser, password).then(() => {
    }).catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode);
        console.log(errorMessage);
        res.redirect('/setting_password');
    });
});

// コンテンツ設定
// テーマ
app.post('/setting_theme',(req, res) => {
    var theme_id = req.body.theme_id;
    var tag_id = req.body.tag_id;
    var tag = req.body.tag;

    var connection = mysql.createConnection(mysql_setting);

    connection.connect();
    if(Array.isArray(tag_id)){
        for(var i in tag_id){
            if(tag[i]==''){
                connection.query('delete from tags where item_id= ?', tag_id[i], function (error, results, fields){});
            }else{
                var data = {'tag':tag[i], 'theme_id': theme_id}
                connection.query('update tags set ? where item_id = ?', [data, tag_id[i]], function (error, results, fields){});
            }
        }
    }else{
        if(tag==''){
            connection.query('delete from tags where item_id= ?', tag_id, function (error, results, fields){});
        }else{
            var data = {'tag':tag, 'theme_id': theme_id}
            connection.query('update tags set ? where item_id = ?', [data, tag_id], function (error, results, fields){});
        }
    }
    res.redirect('/setting_contents');
    connection.end();
});
app.post('/tag_insert',(req, res) => {
    var theme_id = req.body.theme_id;
    var tag = req.body.tag;

    insert_tag(theme_id, tag);
    res.redirect('/setting_contents');
});

// イラスト
app.post('/setting_image',(req, res) => {
    var image_id = req.body.image_id;
    var image_name = req.body.name;
    var image_title = req.body.title;
    var image_contents = req.body.contents;
    var theme_id = req.body.theme_id;

    var connection = mysql.createConnection(mysql_setting);

    connection.connect();
    var data = {'name':image_name, 'title':image_title, 'likes':0, 'contents':image_contents, 'theme_id':theme_id, 'account_id': account_id}
    connection.query('update image set ? where item_id = ?', [data,image_id], function (error, results, fields){
        res.redirect('/setting_contents');
    });
    connection.end();
});

// リスト
app.post('/setting_list',(req, res) => {
    var list_id = req.body.list_id;
    var title = req.body.title;
    var type = req.body.type;

    var connection = mysql.createConnection(mysql_setting);

    connection.connect();
    var data = {'title':title, 'type':type, 'account_id': account_id}
    connection.query('update lists set ? where item_id = ?', [data,list_id], function (error, results, fields){
        res.redirect('/setting_contents');
    });
    connection.end();
});
app.post('/delete_listcontents',(req, res) => {
    var list_id = req.body.list_id;
    var contents_id = req.body.contents_id;

    var connection = mysql.createConnection(mysql_setting);

    connection.connect();
    connection.query('delete from list_contents where item_id=?', contents_id, function (error, results, fields){
        res.redirect('/setting_list?id='+list_id);
    });
    connection.end();
});

// コンテンツの削除
// テーマ
app.post('/delete_theme',(req, res) => {
    var theme_id = req.body.theme_id;

    var connection = mysql.createConnection(mysql_setting);

    connection.connect();
    connection.query('delete from theme where item_id=?', theme_id, function (error, results, fields){
        res.redirect('/setting_contents');
    });
    connection.end();
});
// イラスト
app.post('/delete_image',(req, res) => {
    var image_id = req.body.image_id;

    var connection = mysql.createConnection(mysql_setting);

    connection.connect();
    connection.query('delete from image where item_id=?', image_id, function (error, results, fields){
        res.redirect('/setting_contents');
    });
    connection.end();
});
// リスト
app.post('/delete_lists',(req, res) => {
    var list_id = req.body.list_id;

    var connection = mysql.createConnection(mysql_setting);

    connection.connect();
    connection.query('delete from list_contents where list_id=?', list_id, function (error, results, fields){});
    connection.query('delete from lists where item_id=?', list_id, function (error, results, fields){
        res.redirect('/setting_contents');
    });
    connection.end();
});

var server = app.listen(3000, () => {
    console.log('Start server port:3000')
});