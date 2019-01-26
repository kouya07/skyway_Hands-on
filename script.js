/* eslint-disable require-jsdoc */
$(function() {
  // Connect to SkyWay, have server assign an ID instead of providing one
  // Showing off some of the configs available with SkyWay :).
  const peer = new Peer({
    // Set API key for cloud server (you don't need this if you're running your
    // own.
    key:         '9b4cb63a-fbe5-44af-aa8a-1a3ac56abde6',
    // Set highest debug level (log everything!).
    debug:       3,
    // Set a logging function:
    logFunction: args => {
      const copy = [...args].join(' ');
      $('.log').append(copy + '<br>');
    },
  });
  const connectedPeers = {};

  // Show this peer's ID.
  peer.on('open', id => {
    $('#pid').text(id);
  });
  // Await connections from others
  peer.on('connection', connect);
  peer.on('error', err => console.log(err));

  // Connect to a room
  $('#connect').on('submit', e => {
    e.preventDefault();
    const roomName = $('#roomName').val();
    if (!roomName) {
      return;
    }
    if (!connectedPeers[roomName]) {
      // Create 2 connections, one labelled chat and another labelled file.
      var room = peer.joinRoom('sfu_text_' + roomName, {mode: 'sfu'});
      room.on('open', function() {
        connect(room);
        connectedPeers[roomName] = room;
        getMyPlace(room, null);
      });
    }
  });

  // Close a connection.
  $('#close').on('click', () => {
    eachActiveRoom((room, $c) => {
      room.close();
      $c.remove();
    });
  });

  // Send a chat message to all active connections.
  $('#send').on('submit', e => {
    e.preventDefault();
    // For each active connection, send the message.
    const msg = $('#text').val();

    eachActiveRoom((room, $c) => {
      console.log(room);
      room.send(msg);
      $c.find('.messages').append('<div><span class="you">You: </span>' + msg
        + '</div>');
      addMessage('you',msg);
    });
    $('#text').val('');
    $('#text').focus();
  });

  // Show browser version
  $('#browsers').text(navigator.userAgent);

  // Make sure things clean up properly.
  window.onunload = window.onbeforeunload = () => {
    if (!!peer && !peer.destroyed) {
      peer.destroy();
    }
  };

  // Handle a connection object.
  function connect(room) {
    // Handle a chat connection.
    $('#text').focus();
    const chatbox = $('<div></div>').addClass('connection').addClass('active').attr('id', room.name);
    const roomName = room.name.replace('sfu_text_', '');
    const header = $('<h1></h1>').html('Room: <strong>' + roomName + '</strong>');
    const messages = $('<div><em>Peer connected.</em></div>').addClass('messages');
    chatbox.append(header);
    chatbox.append(messages);
    // Select connection handler.
    chatbox.on('click', () => {
      chatbox.toggleClass('active');
    });

    $('.filler').hide();
    $('#connections').append(chatbox);

    room.getLog();
    room.once('log', logs => {
      for (let i = 0; i < logs.length; i++) {
        const log = JSON.parse(logs[i]);

        switch (log.messageType) {
          case 'ROOM_DATA':
            messages.append('<div><span class="peer">' + log.message.src + '</span>: ' + log.message.data + '</div>');
            addMessage(log.message.src,log.message.data);
            break;
          case 'ROOM_USER_JOIN':
            if (log.message.src === peer.id) {
              break;
            }
            messages.append('<div><span class="peer">' + log.message.src + '</span>: has joined the room </div>');
            addMessage(log.message.src,"入室");
            break;
          case 'ROOM_USER_LEAVE':
            if (log.message.src === peer.id) {
              break;
            }
            messages.append('<div><span class="peer">' + log.message.src + '</span>: has left the room </div>');
            addMessage(log.message.src,"退室");
            break;
        }
      }
    });

    room.on('data', message => {

      if(message.data.indexOf('latitude') != -1) {
      getMyPlace(room, message.data);
    }

      if (message.data instanceof ArrayBuffer) {
        const dataView = new Uint8Array(message.data);
        const dataBlob = new Blob([dataView]);
        const url = URL.createObjectURL(dataBlob);
        messages.append('<div><span class="file">' +
          message.src + ' has sent you a <a target="_blank" href="' + url + '">file</a>.</span></div>');
      } else {
        messages.append('<div><span class="peer">' + message.src + '</span>: ' + message.data + '</div>');
        addMessage(log.message.src,message.data);
      }
    });

    room.on('peerJoin', peerId => {
      messages.append('<div><span class="peer">' + peerId + '</span>: has joined the room </div>');
      addMessage(log.message.src,"入室");
    });

    room.on('peerLeave', peerId => {
      messages.append('<div><span class="peer">' + peerId + '</span>: has left the room </div>');
      addMessage(log.message.src,"退室");
    });
  }

  // Goes through each active peer and calls FN on its connections.
  function eachActiveRoom(fn) {
    const actives = $('.active');
    const checkedIds = {};
    actives.each((_, el) => {
      const peerId = $(el).attr('id');
      if (!checkedIds[peerId]) {
        const room = peer.rooms[peerId];
        fn(room, $(el));
      }
      checkedIds[peerId] = 1;
    });
  }
});

// Chat用
$(function() {
  //インスタンスの作成
  // var ui = new BotUI('chat-app');
  // //ボット側のチャット処理
  // ui.message.bot({
  //   //メッセージを表示する
  //   content: 'こんにちは、ボットです！'
  // }).then(function() {


  //   //ユーザー側のチャット処理
  //   ui.message.human({
  //     content: 'こんにちは、ユーザーです！'
  //   });
  // });

  // ui.message.add({
  //   type: 'html', // this is 'text' by default
  //   content: 'Hello, this is a <b>bold message</b>.'
  // });
  // let chat_test = document.getElementById('chat_test');
  // let text = '';
  // let message = 'test';
  // // 自分
  // text+='<div class="chat-box">';
  // text+='<div class="chat-face"><img src="/images/chat/my.png" alt="" /></div>';
  // text+='<div class="chat-area">';
  // text+='<div class="chat-hukidashi" id = "text">'+message+'</div>';
  // text+='</div>';
  // text+='</div>';

  // // 他人
  // text+='<div class="chat-box2">';
  // text+='<div class="chat-face2"><img src="/images/chat/someone.png" alt="" /></div>';
  // text+='<div class="chat-area2">';
  // text+='<div class="chat-hukidashi2">'+message+'</div>';
  // text+='</div>';
  // text+='</div>';

  // chat_test.innerHTML=text;
  // addMessage('aaa',"hello");
});

function addMessage(user,message){
  let chat_test = document.getElementById('chat_test');
  let text = '';
  // 自分
  if(user == 'you'){
    text = '<div class="chat-box">\
      <div class="chat-face"><img src="/images/chat/my.png" alt="" /></div>\
      <div class="chat-area">\
      <div class="chat-hukidashi" id = "aaa">'+message+'</div>\
      </div>\
      </div>';
  }
  // 他人
  else{
    text = '<div class="chat-box2">\
      <div class="chat-area2">\
      <div class="chat-hukidashi2">'+message+'</div>\
      </div>\
      <div class="chat-face2"><img src="/images/chat/someone.png" alt="" /></div>\
      </div>\
      <div class="chat-username">' + user + '</div>';
  }
  console.log(text);
  chat_test.innerHTML += text;
}

function getMyPlace(room, location) {
  var output = document.getElementById("result");
  if (!navigator.geolocation){//Geolocation apiがサポートされていない場合
    output.innerHTML = "<p>Geolocationはあなたのブラウザーでサポートされておりません</p>";
    return;
  }

  var self = this;
  function success(position) {
    var latitude  = position.coords.latitude;//緯度
    var longitude = position.coords.longitude;//経度

    //room.send("latitude" + latitude);
    //room.send("longitude" + longitude);

    var location = {
      lat: latitude,
      lng: longitude
    };

    room.send(location);

        // 位置情報
    var latlng = new google.maps.LatLng( latitude , longitude ) ;
    // Google Mapsに書き出し
    var map = new google.maps.Map( document.getElementById( 'map' ) , {
        zoom: 18 ,// ズーム値
        center: latlng ,// 中心座標
    } ) ;    

    // マーカーの新規出力
    new google.maps.Marker( {
        map: map ,
        position: latlng ,
    } ) ;

        new google.maps.Marker( {
        map: map ,
        position: location ,
    } ) ;
  };
  function error() {
    //エラーの場合
    output.innerHTML = "座標位置を取得できません";
  };
  navigator.geolocation.getCurrentPosition(success, error);//成功と失敗を判断
}
