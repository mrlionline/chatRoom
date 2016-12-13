var express = require("express"),
	app = express(),
	server = require("http").createServer(app),
	io = require("socket.io").listen(server),
	onlineNum = 0,
	userNames = [],
	userList = [],
	uSocket = {},
	uName = {};

app.use(express.static('public'));

app.get('/',function(req,res){
	res.sendfile(__dirname + '/index.html')
})

io.sockets.on('connection',function(socket){
	//检查用户名是否被使用
	socket.on('searchUserName',function(data){
		if (userList.length != 0) {
			var isUsedFlag = false;
			for (var i = 0; i < userList.length; i++) {
				if (userList[i].userName == data) {
					isUsedFlag = true;
					socket.emit("isUsed",true)
					break;
				}
			}
			if (!isUsedFlag) {
				socket.emit("isUsed",false)
			}
		}else{
			socket.emit("isUsed",false)
		}
	})
	socket.on('userInfo',function(data){
		onlineNum ++;
		socket.emit('onlineNum',{onlineNum:onlineNum,userList:userList})  //有新用户连接就把连接之前的用户数组发给它
		userList.push({userName:data.userName,userSex:data.userSex,headSrc:data.headSrc});
		var newUserObj = {userName:data.userName,userSex:data.userSex,headSrc:data.headSrc,onlineNum:onlineNum}
		socket.broadcast.emit('new friend join',newUserObj)
		console.log('新成员加入，姓名:'+data.userName)
		console.log('当前在线人数：'+onlineNum)
		console.log("");
		uSocket[data.userName] = socket;
		uName[data.userName] = data.userName;
		//断开连接
		socket.on('disconnect', function() {
			onlineNum--;
			var index ;  //记录退出成员在userList中的坐标
			socket.broadcast.emit('someone out',{newUserObj:newUserObj,onlineNum:onlineNum})
			for (var i = 0; i < userList.length; i++) {
				if (userList[i].userName == data.userName) {
					index = i;
					break;
				}
			}
			userList.splice(index,1);
			console.log(data.userName+"已退出");
			console.log("当前在线人数："+onlineNum);
			console.log("");
		})

		socket.on('newMsg',function(data){
			socket.broadcast.emit('newMsg',data)
		})
	})

	//私聊
	socket.on('privateChat',function(data){
		uSocket[data.toName].emit('to'+data.toName,data)
		uSocket[data.fromName].emit('to'+data.fromName,data)
	})
	

})




server.listen(8800,function(){
	console.log("server is running on : 8800")
})