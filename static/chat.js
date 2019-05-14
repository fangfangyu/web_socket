/*模拟用户数据*/
var _users = [{
	name: "a",
	pic: "0.jpg",
	state: "0"
}, {
	name: "b",
	pic: "1.jpg",
	state: "0"
}, {
	name: "c",
	pic: "2.jpg",
	state: "0"
}, {
	name: "d",
	pic: "3.jpg",
	state: "0"
}, ];

window.onload = function() {
	//昵称设置的确定按钮

	document.getElementById('nicknameInput').focus();
	document.getElementById('loginBtn').addEventListener('click', function() {
		var nickName = document.getElementById('nicknameInput').value;
		//检查昵称输入框是否为空
		if(nickName.trim().length != 0) {
			for(var j = 0; j < _users.length; j++) {
				if(_users[j].name == nickName) {
					//实例并初始化我们的hichat程序
					var hichat = new HiChat();
					hichat.init(_users[j]);
				}
			}
		} else {
			//否则输入框获得焦点
			alert("请输入正确账号");
			document.getElementById('nicknameInput').focus();
		};
	}, false);
	document.getElementById('nicknameInput').addEventListener('keyup', function(e) {
		if(e.keyCode == 13) {
			var nickName = document.getElementById('nicknameInput').value;
			if(nickName.trim().length != 0) {
				for(var j = 0; j < _users.length; j++) {
					if(_users[j].name == nickName) {
						//实例并初始化我们的hichat程序
						var hichat = new HiChat();
						hichat.init(_users[j]);
					}
				}
			};
		};
	}, false);
	document.getElementsByClassName("menu-btn")[0].addEventListener('click', function() {
		if(!this.parentNode.parentNode.classList.contains("ac")) {
			this.parentNode.parentNode.classList.add("ac");

		} else {
			this.parentNode.parentNode.classList.remove("ac");

		}

	});
	

};

//定义我们的hichat类
var HiChat = function() {
	this.socket = null;
};

//向原型添加业务方法
HiChat.prototype = {
	init: function(curuser) { //此方法初始化程序
		var that = this;
		var chatMenu = document.getElementById("chatMenu");

		//建立到服务器的socket连接
		this.socket = io.connect("http://localhost:9090");
		//监听socket的connect事件，此事件表示连接已经建立
		this.socket.on('connect', function() {

		});
		//触发登录
		this.socket.emit('login', curuser);

		document.getElementById('sendBtn').addEventListener('click', function() {
			var messageInput = document.getElementById('messageInput'),
				pic = document.getElementsByClassName("cur-person")[0].getElementsByTagName("img")[0].getAttribute("src");
			msg = messageInput.innerHTML,
				//获取颜色值
				color = document.getElementById('colorStyle').value;
			messageInput.innerHTML = '';

			messageInput.focus();
			if(msg.trim().length != 0) {
				//显示和发送时带上颜色值参数
				that.socket.emit('personChat', msg, messageInput.getAttribute("data-id"));
				/*that.socket.emit('postMsg', msg);*/
				that._displayNewMsg('me', msg, pic, color);
			};

		}, false);
		document.getElementById('sendImage').addEventListener('change', function() {
			//检查是否有文件被选中
			if(this.files.length != 0) {
				var messageInput = document.getElementById('messageInput'),
					pic = document.getElementsByClassName("cur-person")[0].getElementsByTagName("img")[0].getAttribute("src");
				//获取文件并用FileReader进行读取
				var file = this.files[0],
					reader = new FileReader();
				if(!reader) {
					that._displayNewMsg('system', '!your browser doesn\'t support fileReader', 'red');
					this.value = '';
					return;
				};
				reader.onload = function(e) {
					//读取成功，显示到页面并发送到服务器
					this.value = '';
					/*that.socket.emit('img', e.target.result);*/
					that.socket.emit('personChatImg', e.target.result, messageInput.getAttribute("data-id"));
					that._displayImage('me', e.target.result, pic);
				};
				reader.readAsDataURL(file);
			};
		}, false);

		this.socket.on('nickExisted', function() {
			document.getElementById('info').textContent = '!nickname is taken, choose another pls'; //显示昵称被占用的提示
		});

		this.socket.on('loginSuccess', function(id, users) {
			//插入当前成员信息
			var _div = document.createElement("div");
			_div.innerHTML = '<img src="content/avatar/' + curuser.pic + '"/>';
			_div.className = 'cur-person';
			_div.id = id;
			chatMenu.appendChild(_div);
			//获取其他登录成员信息	
			for(var i = 0; i < users.length; i++) {
				var _div2 = document.createElement("div");
				_div2.innerHTML = '<img src="content/avatar/' + users[i].pic + '"/>' + users[i].name;
				_div2.className = 'person';
				_div2.id = users[i].id;
				chatMenu.appendChild(_div2);
			}

			document.title = 'hichat | ' + document.getElementById('nicknameInput').value;
			document.getElementById('loginWrapper').style.display = 'none'; //隐藏遮罩层显聊天界面

			document.getElementById('messageInput').focus(); //让消息输入框获得焦点
		});
		this.socket.on('other', function(type, id, name, pic) {
			if(type == 'login') {
				var _div = document.createElement("div");
				_div.innerHTML = '<img src="content/avatar/' + pic + '"/>' + name;
				_div.className = 'person';
				_div.id = id;
				chatMenu.appendChild(_div);

			} else if(type == 'logout') {
				var child_per = document.getElementById(id);
				chatMenu.removeChild(child_per);
			}
		});
		this.socket.on('system', function(nickName, userCount, type) {
			var msg = nickName + (type == 'login' ? ' joined' : ' leave');
			//指定系统消息显示为红色
			/*that._displayNewMsg('system ', msg, 'red');*/
			document.getElementById('status').textContent = userCount;
		});
		this.socket.on('newMsg', function(user, msg, pic, color) {
			that._displayNewMsg(user, msg, pic, color);
		});
		this.socket.on('personMsg', function(user, msg, id, pic, color) {
			that._getNewMsg(user, msg, id, pic, color);
		});
		this.socket.on('newImg', function(user, img) {
			that._displayImage(user, img, pic);
		});
		this.socket.on('personChatImg', function(user, img, id, pic) {
			that._getImage(user, img, id, pic);
		});
		this._initialEmoji();
		document.getElementById('emoji').addEventListener('click', function(e) {
			var emojiwrapper = document.getElementById('emojiWrapper');
			emojiwrapper.style.display = 'block';
			e.stopPropagation();
		}, false);
		document.body.addEventListener('click', function(e) {
			var emojiwrapper = document.getElementById('emojiWrapper');
			if(e.target != emojiwrapper) {
				emojiwrapper.style.display = 'none';
				that.setFocus(messageInput);
			};
			//点击成员聊天
			if(e.target.classList.contains("person")) {
				that.chatings(e.target.id);
			};
		});
		document.getElementById('emojiWrapper').addEventListener('click', function(e) {
			//获取被点击的表情
			var target = e.target;
			if(target.nodeName.toLowerCase() == 'img') {
				var messageInput = document.getElementById('messageInput');
				//messageInput.focus();
				that.setFocus(messageInput);
				var str = messageInput.innerHTML + '<img src="content/emoji/' + target.title + '.gif "/>';
				messageInput.innerHTML = str;

			};
		}, false);
		//阻止默认回车
		document.getElementById('messageInput').addEventListener('keydown', function(e) {
			if(e.keyCode == 13) {
				event.preventDefault();
			}

		}, false);
		document.getElementById('messageInput').addEventListener('keyup', function(e) {
			var messageInput = document.getElementById('messageInput'),
				msg = messageInput.innerHTML;
			if(e.keyCode == 13 && msg.trim().length != 0) {
				var pic = document.getElementsByClassName("cur-person")[0].getElementsByTagName("img")[0].getAttribute("src"),
					color = document.getElementById('colorStyle').value;
				messageInput.innerHTML = '';
				that.socket.emit('personChat', msg, messageInput.getAttribute("data-id"));
				/*that.socket.emit('postMsg', msg, color);*/
				that._displayNewMsg('me', msg, pic, color);
			};
		}, false);
	},
	//发送给对方
	_getNewMsg: function(user, msg, id, pic, color) {
		var container = document.getElementById('historyMsg'),
			inp_container = document.getElementsByClassName("controls")[0],
			messageInput = document.getElementById('messageInput'),
			msgToDisplay = document.createElement('p'),
			date = new Date().toTimeString().substr(0, 8),
			//将消息中的表情转换为图片
			msg = this._showEmoji(msg);
		inp_container.style.display = "block";

		msgToDisplay.classList.add("msg-other");
		messageInput.setAttribute("data-id", id);
		document.getElementById(id).classList.add("person-ac");
		msgToDisplay.style.color = color || '#000';
		msgToDisplay.innerHTML = '<p class="icons"><img src="content/avatar/' + pic + '"></p><div class="info-list"><p class="char-txt"><span class="char-s">' + user + ' ： </span><span>' + msg + '</span><br><span class="char-t">' + date + '</span></p></div>';
		container.appendChild(msgToDisplay);
		var line = document.createElement('p');
		line.className = "line-char";
		container.appendChild(line);
		container.scrollTop = container.scrollHeight;
	},
	//发送给自己
	_displayNewMsg: function(user, msg, pic, color) {
		var container = document.getElementById('historyMsg'),
			msgToDisplay = document.createElement('div'),
			date = new Date().toTimeString().substr(0, 8),
			//将消息中的表情转换为图片
			msg = this._showEmoji(msg);

		msgToDisplay.classList.add("msg-me");
		msgToDisplay.style.color = color || '#000';
		msgToDisplay.innerHTML = '<p class="icons"><img src="' + pic + '"></p><div class="info-list"><p class="char-txt"><span class="char-s">' + user + ' ： </span><span>' + msg + '</span><br><span class="char-t">' + date + '</span></p></div>';
		container.appendChild(msgToDisplay);
		var line = document.createElement('p');
		line.className = "line-char";
		container.appendChild(line);
		container.scrollTop = container.scrollHeight;
	},
	//发送给对方图片
	_getImage: function(user, imgData, id, pic, color) {
		var container = document.getElementById('historyMsg'),
			inp_container = document.getElementsByClassName("controls")[0],
			messageInput = document.getElementById('messageInput'),
			msgToDisplay = document.createElement('div'),
			date = new Date().toTimeString().substr(0, 8);
		inp_container.style.display = "block";
		msgToDisplay.classList.add("msg-other");
		messageInput.setAttribute("data-id", id);
		document.getElementById(id).classList.add("person-ac");

		msgToDisplay.innerHTML = '<p class="icons"><img src="content/avatar/' + pic + '"></p><div class="info-list"><p class="char-txt"><span class="char-s">' + user + ' ： </span><a href="' + imgData + '" target="_blank"><img src="' + imgData + '"/></a><br><span class="char-t">' + date + '</span></p></div>';
		container.appendChild(msgToDisplay);
		var line = document.createElement('p');
		line.className = "line-char";
		container.appendChild(line);
		container.scrollTop = container.scrollHeight;
	},
	//发送给自己图片
	_displayImage: function(user, imgData, pic) {
		var container = document.getElementById('historyMsg'),
			msgToDisplay = document.createElement('div'),
			date = new Date().toTimeString().substr(0, 8);

		msgToDisplay.classList.add("msg-me");
		msgToDisplay.innerHTML = '<p class="icons"><img src="' + pic + '"></p><div class="info-list"><p class="char-txt"><span class="char-s">' + user + ' ： </span><a href="' + imgData + '" target="_blank"><img src="' + imgData + '"/></a><br><span class="char-t">' + date + '</span></p></div>';
		container.appendChild(msgToDisplay);
		var line = document.createElement('p');
		line.className = "line-char";
		container.appendChild(line);
		container.scrollTop = container.scrollHeight;
	},
	_initialEmoji: function() {
		var emojiContainer = document.getElementById('emojiWrapper'),
			docFragment = document.createDocumentFragment();
		for(var i = 69; i > 0; i--) {
			var emojiItem = document.createElement('img');
			emojiItem.src = 'content/emoji/' + i + '.gif';
			emojiItem.title = i;
			docFragment.appendChild(emojiItem);
		};
		emojiContainer.appendChild(docFragment);
	},
	_showEmoji: function(msg) {
		var match, result = msg,
			reg = /\[emoji:\d+\]/g,
			emojiIndex,
			totalEmojiNum = document.getElementById('emojiWrapper').children.length;
		while(match = reg.exec(msg)) {
			emojiIndex = match[0].slice(7, -1);
			if(emojiIndex > totalEmojiNum) {
				result = result.replace(match[0], '[X]');
			} else {
				result = result.replace(match[0], '<img class="emoji" src="../content/emoji/' + emojiIndex + '.gif" />');
			};
		};
		return result;
	},
	chatings: function(id) {
		var messageInput = document.getElementById('messageInput'),
			container = document.getElementById('historyMsg'),
			inp_container = document.getElementsByClassName("controls")[0];

		messageInput.setAttribute("data-id", id);
		container.innerHTML = "";
		inp_container.style.display = "block";
		document.getElementById(id).classList.add("person-ac");
	},
	//处理光标置于末尾
	setFocus: function(el) {
		el.focus();
		var range = document.createRange();
		range.selectNodeContents(el);
		range.collapse(false);
		var sel = window.getSelection();
		//判断光标位置，如不需要可删除
		if(sel.anchorOffset != 0) {
			return;
		};
		sel.removeAllRanges();
		sel.addRange(range);
	}

};