var express = require('express');
var ejs = require("ejs");
var app = express();

app.engine('ejs',ejs.renderFile);

// get
app.get("/", (req, res) => {
     res.render('test.ejs',{
	     title:'title'
     });
});

var server = app.listen(3000, () => {
     console.log('Port Number is 3000.');
});
