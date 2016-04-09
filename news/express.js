/**
 * Created by lenovo on 2016/4/8.
 */
var express = require('express');
var path = require('path');
var fs = require('fs');

var app = express();

app.set('view engine', 'ejs');
app.set('views',__dirname);

function serveStatic(root){
    return function (req, res, next) {
        var file = req.originalUrl.slice(req.baseUrl.length + 1);
        file = path.resolve(root, file);

        var stream = fs.createReadStream(file);
        stream.pipe(res);
    };
}

app.use('/public',serveStatic(__dirname + '/public'));
//app.use('/public', express.static(__dirname + '/public'));

function getNewsList(){
    var list = [];
    for(var i =0; i < 5; i++){
        list.push(getNewsById(i+1));
    }
    return list;
}

function getNewsById(id){
    return{
        id: id,
        title: '第'+ id + '篇新闻标题',
        content: '第' + id + '篇新闻内容'
    };
}

app.get('/', function (req, res){
    res.render('index.ejs',{
        list: getNewsList()
    });
});

app.get('/news/:id', function(req, res){
    res.render('news.ejs',{
        news:getNewsById(req.params.id)
    });
});

app.listen(3001);