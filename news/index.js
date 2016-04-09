///**
// * Created by lenovo on 2016/4/5.
// */
var http = require('http');
var parseUrl = require('url').parse;
var connect = require('connect');

var NEWS = {
    1:'这里是第一篇新闻的内容',
    2:'这里是第二篇新闻的内容',
    3:'这里是第三篇新闻的内容'
};
function getNews(id){
    return NEWS[id] || '文章不存在';
}
var app = connect();

app.use(function (req, res, next) {
    res.send = function send(html) {
        res.writeHead(200,{
            'content-type':'text/html;charset=utf-8'
        });
        res.end(html);
    }
    next();
});

app.use(function(req, res, next){
    var info = parseUrl(req.url, true);
    req.pathname = info.pathname;
    req.query = info.query;
    next();
});

app.use(function (req, res, next) {
    if(req.pathname === '/'){
        res.send('<url>'+
                '<li><a href="/news?type=1&id=1">新闻一</a></li> '+
                '<li><a href="/news?type=1&id=2">新闻二</a></li> '+
                '<li><a href="/news?type=1&id=3">新闻三</a></li> '+
            '</url>')
    }else{
        next();
    }
});

app.use(function (req, res, next) {
    if(req.pathname ==='/news' && req.query.type === '1'){
        res.send(getNews(req.query.id));
    }else{
        next();
    }
});

app.use(function(req, res, next){
    res.send('<h1>文章不存在！</h1>');
});

app.listen(3001);
//
////
//var server = http.createServer(function(req,res) {
//    //console.log(req.method);
//    //console.log(req.url);
//    //console.log(req.headers);
//    //res.end('hello world');
//    function send(html){
//        res.writeHead(200,{
//            'content-type': 'text/html;charset=utf-8'
//        });
//        res.end(html);
//    }
//    var info = parseUrl(req.url, true);
//    req.pathname = info.pathname;
//    req.query = info.query;
//
//    if(req.url === '/'){
//        send('<url>'+
//                '<li><a href="/news?type=1&id=1">新闻一</a></li> '+
//                '<li><a href="/news?type=1&id=2">新闻二</a></li> '+
//                '<li><a href="/news?type=1&id=3">新闻三</a></li> '+
//            '</url>');
//    }
//    //else if(req.url === '/news?type=1&id=1'){
//    //    send(getNews(1));
//    //}else if(req.url === '/news?type=1&id=2'){
//    //    send(getNews(2));
//    //}else if(req.url === '/news?type=1&id=3'){
//    //    send(getNews(3));
//    //}
//    else if(req.pathname === '/news' && req.query.type ==='1'){
//        send(getNews(req.query.id));
//    }
//    else{
//        send('<h1>文章不存在</h1>');
//    }
//});
//server.listen(3001);