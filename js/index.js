var setIntervalId;
var setIntervalMsgId;
var OmsgNum = {},
	msgNum = 0,
	privateChatNames = [],
	isPrivateShow = false,
	showFlag = {};
var toName = '',
	toSexClass = '',
	toHeadSrc = '';
$(function(){

	console.log("jQuery编写前端\n\nnode.js与socket.io编写后台")

	var headSrc = 'images/4.jpg';  //登录框头像Src
	var onlineUserHtml = "";       //在线用户列表的完整HTML

	var socket = io.connect();
	socket.emit('chatroomIn')

	//未读消息功能
	function unReadMsg(num){
		if (num > 0) {
			$('.msgNum').text(num);
		}else{
			$('.newMsgList').hide();
		}
	}

	//“在线列表”的显示与隐藏---start
	var onlineUserFlag = true;
	$('.left-nav li:eq(1)').on('click',function(){
		if (onlineUserFlag) {
			$('.onlineList').animate({
				width : 250
			},1000);
			onlineUserFlag = false;
		}else{
			$('.onlineList').animate({
				width : 0
			},1000);
			onlineUserFlag = true;
		}

	})
	//“在线列表”的显示与隐藏---end

	// 头像列表的显示与隐藏---start
	$('.head').on('click',function(){
		$('.sj').toggle();
		$('.headList').toggle();
	})
	// 头像列表的显示与隐藏---end

	//判断性别的class
	function judgeSex(sex){
		if (sex == 'female') {
			return "fa fa-venus";
		}else if(sex == "male"){
			return "fa fa-mars";
		}
	}

	//选择头像---start
	$('.headList div').on('click',function(){
		headSrc = $(this).children('img').attr('src')
		$('.head').children('img').attr('src',headSrc)
		$('.sj').toggle();
		$('.headList').toggle();
	})
	//选择头像---end

	//用户名检测
	var isUsedFlag = false;
	$('#userNameInput').on('keyup',function(){
		if ($('#userNameInput').val() != "") {
			var socket = io.connect();
			socket.emit('searchUserName',$('#userNameInput').val())
			socket.on('isUsed',function(data){
				if(data){
					$('#userNameInput').css("border","1px solid red")
					$('.userNameInfo').text("用户名已被占用").css("color","red")
					isUsedFlag =false;
				}else if(data == false){
					$('#userNameInput').css("border","1px solid #00ff00")
					$('.userNameInfo').text("用户名可以使用").css("color","#00ff00")
					isUsedFlag = true
				}
			})
		}else if ($('#userNameInput').val() == "") {
			$('#userNameInput').css("border","1px solid red")
			$('.userNameInfo').text("请正确输入用户名").css("color","red")
			isUsedFlag =false;
		}
	})

	//Enter按钮的点击---start
	$('.loginFooter a').on('click',function(){
		if (isUsedFlag) {
			var socket = io.connect();
			var userName = $('#userNameInput').val();
			var userSex = $('.sex input:radio:checked').val()
			var sexClass = judgeSex(userSex);
			// alert(userSex)
			socket.emit('userInfo',{userName:userName,userSex:userSex,headSrc:headSrc})
			$('.onlineUser div').prepend($("<li><img src='"+headSrc+"'><span>我</span>&nbsp<i class='"+judgeSex(userSex)+"'></i></li>"))
			onlineUserHtml = $('.onlineUser div').html();
			//接收在线人数并显示在线列表
			socket.on('onlineNum',function(data){
				$('.number').html(data.onlineNum)
				//如果在线用户列表有内容，就把内容遍历显示
				if (data.userList.length != 0) {
					for (var i = 0; i < data.userList.length; i++) {
						$('.onlineUser div').append($("<li><img src='"+data.userList[i].headSrc+"'><span>"+data.userList[i].userName+"</span>&nbsp<i class='"+judgeSex(data.userList[i].userSex)+"'></i></li>"))
						OmsgNum[data.userList[i].userName] = 0;
					}
				}
			})


			//隐藏登录框和遮罩
			$('.mask').hide();
			$('.login').hide();
			$('#chatroom').removeClass('onblur')
			$('.welcome').show()
			function welHide(){
				$('.welcome').fadeOut()
				clearTimeout(st);
			}
			var st = setTimeout(welHide,1500)

			//时间转换函数
			function checkTime(i){
				if(i < 10){
					return "0"+i;
				}
				return i;
			}

			//发送功能
			function send(){
				var newMsg = $('#msgText').val();
				var mydate = new Date(),
					hour = mydate.getHours(),
					minute = mydate.getMinutes(),
					shi = checkTime(hour),
					fen = checkTime(minute),
					sendTime = ""+shi+":"+fen;
				if ($('#msgText').val() != "") {
					socket.emit('newMsg',{userName:userName,userSex:userSex,headSrc:headSrc,newMsg:newMsg,sendTime:sendTime})
					$('.msgShow').append("<div class='msgItem myMsg'><div class='userHead'><img src='"+headSrc+"'></div><div class='msg-content'><h5>我 <i class='"+judgeSex(userSex)+"'></i></h5><p>"+newMsg+"</p></div><div class='tools'><p>"+sendTime+"</p><i class='fa fa-ban delMessage'></i></div><div class='clear'></div></div>")
					$('#msgText').val("");
					$('.msgShow').scrollTop(10000);
				}
			}

			//点击发送按钮触发start
			$('#msgSend').on('click',function(){
				send()
			})

			//回车发送
			$('#msgText').on('keyup',function(event){
				if (event.keyCode == 13) {
					send()
				}
			})

			//收到新消息
			socket.on('newMsg',function(data){
				$('.msgShow').append("<div class='msgItem'><div class='userHead'><img src='"+data.headSrc+"'></div><div class='msg-content'><h5>"+data.userName+"<i class='"+judgeSex(data.userSex)+"'></i></h5><p>"+data.newMsg+"</p></div><div class='tools'><p>"+data.sendTime+"</p><i class='fa fa-ban delMessage'></i></div><div class='clear'></div></div>")
				if (windowFlat) {
					$('title').text("【您有新消息】")
					 	setIntervalMsgId = setInterval(function(){
						var text=document.title
						var timerID
						document.title=text.substring(1,text.length)+text.substring(0,1)
						text=document.title.substring(0,text.length)
					}, 10)
				}
				$('.msgShow').scrollTop(10000);
			})
			
			
				

			//新用户加入的提示start
			socket.on('new friend join',function(data){
				$('.number').html(data.onlineNum)
				$('.msgShow').append($("<div class='newFriendJoin'>"+data.userName+"&nbsp<i class='"+judgeSex(data.userSex)+"'></i>&nbsp加入聊天室</div><br>"))
				$('.onlineUser div').append($("<li><img src='"+data.headSrc+"'><span>"+data.userName+"</span>&nbsp<i class='"+judgeSex(data.userSex)+"'></i></li>"))
				onlineUserHtml = $('.onlineUser div').html();
				if (windowFlat) {
					$('title').text("【有新成员加入】")
					 	setIntervalUserId = setInterval(function(){
						var text=document.title
						var timerID
						document.title=text.substring(1,text.length)+text.substring(0,1)
						text=document.title.substring(0,text.length)
					}, 10)
				}
				$('.msgShow').scrollTop(10000);
				OmsgNum[data.userName] = 0;
				showFlag[data.userName] = false;
			})

			//用户退出
			socket.on('someone out',function(data){
				$('.msgShow').append($("<div class='newFriendJoin'>"+data.newUserObj.userName+"&nbsp<i class='"+judgeSex(data.newUserObj.userSex)+"'></i>&nbsp退出聊天室</div><br>"))
				$(".onlineUser span:contains("+data.newUserObj.userName+")").parent().remove()
				$('.number').html(data.onlineNum)
				$('.msgShow').scrollTop(10000);

			})

			//删除消息功能
			$('.msgShow').on('click','.delMessage',function(){
				$(this).parent().parent().remove();
			})

			//私聊
				//点击用户头像，显示私聊窗口并更改窗口头
				
				$('.onlineUser div').on('click','li:not(li:first)',function(){
					toName = $(this).find('span').text();
					toSexClass = $(this).find('i').attr('class');
					toHeadSrc = $(this).find('img').attr('src');

					$('.privateHead img').attr("src",toHeadSrc);
					$('.privateHead span').text(toName);
					$('.privateHead i:first').addClass(toSexClass+" sex");
						//显示私聊窗口
					$('.private').css("transform","translate(-133%,-113%)");
					$('.privateMsgShow>div').hide();
					$('.privateMsgShow>.'+toName).show();
					showFlag[toName] = true;
					$('#privateMask').show();

					//未读消息列表删除此人
					$(".newMsgList ul li .userInfo p:contains("+toName+")").parent().parent().remove()
					msgNum = msgNum - OmsgNum[toName];
					OmsgNum[toName] = 0;
					unReadMsg(msgNum);
				})

				//右侧未读消息列表的点击事件
				$('.newMsgList ul').on('click','li:not(li:first)',function(){
					toName = $(this).find('p').text();
					toSexClass = $(this).find('i').attr('class');
					toHeadSrc = $(this).find('img').attr('src');

					$('.privateHead img').attr("src",toHeadSrc);
					$('.privateHead span').text(toName);
					$('.privateHead i:first').addClass(toSexClass+" sex");
						//显示私聊窗口
					$('.private').css("transform","translate(-133%,-113%)");
					$('.privateMsgShow>div').hide();
					$('.privateMsgShow>.'+toName).show();
					showFlag[toName] = true;
					$('#privateMask').show();

					//未读消息列表删除此人
					$(".newMsgList ul li .userInfo p:contains("+toName+")").parent().parent().remove()
					msgNum = msgNum - OmsgNum[toName];
					OmsgNum[toName] = 0;
					unReadMsg(msgNum);
				})

					//关闭私聊窗口
				$('.fa-close').on('click',function(){
					var closeName = $(this).parent().find('span').text();
					showFlag[closeName] = false;
					for (var i = 0; i < privateChatNames.length; i++) {
						if (privateChatNames[i] == closeName) {
							privateChatNames.splice(i,1);
							break;
						}
					}
					$('.private').css("transform","translate(0%,0%)");
					$('#privateMask').hide();
				})
				//点击私聊的发送按钮发送privateChat事件到服务器
				$('.privateMsgInput button').on('click',function(){
						var mydate = new Date(),
						hour = mydate.getHours(),
						minute = mydate.getMinutes(),
						shi = checkTime(hour),
						fen = checkTime(minute),
						sendTime = ""+shi+":"+fen;
					if ($('.privateMsgInput textarea').val() != "") {
						socket.emit('privateChat',{
							fromName:userName,
							fromSexClass:sexClass,
							fromHeadSrc:headSrc,
							toName:toName,
							toSexClass:toSexClass,
							toHeadSrc:toHeadSrc,
							privateMsg:$('.privateMsgInput textarea').val(),
							privateSendTime:sendTime
						})
						$('.privateMsgInput textarea').val("");

					}
				})

				//接收私聊事件
				socket.on('to'+userName,function(data){
					if (data.fromName == userName) {
						$('.privateMsgShow').append("<div class='"+data.toName+"'><div class='privateItemWrap myMsg'><div class='privateItemHead'><img src='"+data.fromHeadSrc+"'></div><div class='privateItemBody'><p>"+data.fromName+"<i class='"+data.fromSexClass+"'></i></p><p>"+data.privateMsg+"</p></div><div class='privateItemInfo'><p>"+data.privateSendTime+"</p><i class='fa fa-ban delMessage'></i></div></div></div>")
						$('.privateMsgShow').scrollTop(10000);
					}else if (data.fromName != userName) {
						
						//遍历用户名数组
						var hasThisName = false;
						for (var i = 0; i < privateChatNames.length; i++) {
							if (privateChatNames[i] == data.fromName) {			//有此人
								if (!showFlag[data.fromName]) { //没点开私聊窗口
									msgNum ++;
									$('.msgNum').text(msgNum);
									OmsgNum[data.fromName]++;
									$('.privateMsgShow').append("<div class='"+data.fromName+"'><div class='privateItemWrap'><div class='privateItemHead'><img src='"+data.fromHeadSrc+"'></div><div class='privateItemBody'><p>"+data.fromName+"<i class='"+data.fromSexClass+"'></i></p><p>"+data.privateMsg+"</p></div><div class='privateItemInfo'><p>"+data.privateSendTime+"</p><i class='fa fa-ban delMessage'></i></div></div></div>")
									$('.privateMsgShow').scrollTop(10000);
									$(".b"+data.fromName).text(OmsgNum[data.fromName]);
									$('.newMsgList').show();
									hasThisName = true;
									
								}else if (showFlag[data.fromName]) {  //点开私聊窗口，且有此人
		  							$('.privateMsgShow').append("<div class='"+data.fromName+"'><div class='privateItemWrap'><div class='privateItemHead'><img src='"+data.fromHeadSrc+"'></div><div class='privateItemBody'><p>"+data.fromName+"<i class='"+data.fromSexClass+"'></i></p><p>"+data.privateMsg+"</p></div><div class='privateItemInfo'><p>"+data.privateSendTime+"</p><i class='fa fa-ban delMessage'></i></div></div></div>")
									$('.privateMsgShow').scrollTop(10000);
									hasThisName = true;
								}
							}
						}
						//如果遍历完没有此用户名，用数组记录用户名
						if (!showFlag[data.fromName]) { //没点开私聊窗口，
							if (!hasThisName) {							//且无此人
								msgNum ++;
								$('.msgNum').text(msgNum);
								OmsgNum[data.fromName]++;
								privateChatNames.push(data.fromName)
								$('.privateMsgShow').append("<div class='"+data.fromName+"'><div class='privateItemWrap'><div class='privateItemHead'><img src='"+data.fromHeadSrc+"'></div><div class='privateItemBody'><p>"+data.fromName+"<i class='"+data.fromSexClass+"'></i></p><p>"+data.privateMsg+"</p></div><div class='privateItemInfo'><p>"+data.privateSendTime+"</p><i class='fa fa-ban delMessage'></i></div></div></div>")
								$('.privateMsgShow').scrollTop(10000);
								$('.newMsgList ul').append("<li><div class='img'><img src='"+data.fromHeadSrc+"'></div><div class='userInfo'><i class='"+data.fromSexClass+"'></i><span class='privateMsgNum b"+data.fromName+"'></span><p>"+data.fromName+"</p></div></li>")
								$(".b"+data.fromName).text(OmsgNum[data.fromName]);
								$('.newMsgList').show();
							}
						}else if (showFlag[data.fromName]) {  //点开私聊窗口，且无此人
							if (!hasThisName) {
								$('.privateMsgShow').append("<div class='"+data.fromName+"'><div class='privateItemWrap'><div class='privateItemHead'><img src='"+data.fromHeadSrc+"'></div><div class='privateItemBody'><p>"+data.fromName+"<i class='"+data.fromSexClass+"'></i></p><p>"+data.privateMsg+"</p></div><div class='privateItemInfo'><p>"+data.privateSendTime+"</p><i class='fa fa-ban delMessage'></i></div></div></div>")
								$('.privateMsgShow').scrollTop(10000);
							}
						}
						
						
						
						
					}
				})


		}else{
			$('#userNameInput').css("border","1px solid red")
			$('.userNameInfo').text("请正确输入用户名").css("color","red")
		}
	})

	//点击未读消息的头像显示私聊窗口功能


	//清空消息按钮
	$('.left-nav li:last').on('click',function(){
		$('.msgShow').empty()
	})

	$('.left-nav li:first').on('click',function(){
		$('.private').css("transform","translate(-133%,-113%)");
		$('#privateMask').show();
	})

	
})
var windowFlat = false;
window.onfocus = function(){
	clearInterval(setIntervalUserId);
	clearInterval(setIntervalMsgId);
	$('title').text("chat room")
	windowFlat = false;
}
window.onblur = function(){
	windowFlat = true;
}