var express=require('express');
var app=express();
var server=require('http').Server(app);
var io=require('socket.io')(server);
var users=[];
app.use('/',express.static('./static'));
server.listen(9090);

io.on('connect',function(socket){
	socket.on('login',function(curuser){
		if (users.indexOf(curuser.name) > -1) {
	         socket.emit('nickExisted');
	     } else {
	     
	         socket.userIndex = users.length;
	         socket.nickname = curuser.name;	  
	         socket.pic=curuser.pic;
	         socket.emit('loginSuccess',socket.id,users);
	         users.push({name:curuser.name,id:socket.id,pic:curuser.pic});   
	         //通知除自己以外的所有人
	    	 socket.broadcast.emit('other', 'login',socket.id, socket.nickname,socket.pic);
	         //通知所有人
	         io.sockets.emit('system', curuser.name, users.length, 'login', socket.id);
	         
	         
	     };
	});
	//断开连接的事件
	socket.on('disconnect', function() {
	    //将断开连接的用户从users中删除
	    users.splice(socket.userIndex, 1);
	    //通知除自己以外的所有人
	    socket.broadcast.emit('system', socket.nickname, users.length,'logout', socket.id);
		socket.broadcast.emit('other', 'logout',socket.id);
	});
	 //接收新消息
    socket.on('postMsg', function(msg) {
        //将消息发送到除自己外的所有用户
        socket.broadcast.emit('newMsg', socket.nickname, msg,socket.pic);
    });
    //接收用户发来的图片
	 socket.on('img', function(imgData) {
	    //通过一个newImg事件分发到除自己外的每个用户
	     socket.broadcast.emit('newImg', socket.nickname, imgData,socket.pic);
	 });
	 
	 //接收具体用户发来的消息
	 socket.on('personChat',function(msg,id){
	 	io.to(id).emit('personMsg',socket.nickname, msg,socket.id,socket.pic);

	 });
	  //接收具体用户发来的图片
	 socket.on('personChatImg',function(msg,id){
	 	io.to(id).emit('personChatImg',socket.nickname, msg,socket.id,socket.pic);

	 });
})
