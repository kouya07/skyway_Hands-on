/* eslint-disable require-jsdoc */
$(function() {
  // Connect to SkyWay, have server assign an ID instead of providing one
  // Showing off some of the configs available with SkyWay :).
  const peer = new Peer({
    // Set API key for cloud server (you don't need this if you're running your
    // own.
    key:         "9b4cb63a-fbe5-44af-aa8a-1a3ac56abde6",
    // Set highest debug level (log everything!).
    debug:       3,
    // Set a logging function:
    logFunction: args => {
      const copy = [...args].join(' ');
      $('.log').append(copy + '<br>');
    },
  });
  const connectedPeers = {};

  var userName = window.prompt("ユーザー名を入力してください", "");

  // Show this peer's ID.
  peer.on('open', id => {
    $('#pid').text(id);
  });
  // Await connections from others
  peer.on('connection', connect);
  peer.on('error', err => console.log(err));

  // Prepare file drop box.
  const box = $('#box');
  box.on('dragenter', doNothing);
  box.on('dragover', doNothing);
  box.on('drop', e => {
    e.originalEvent.preventDefault();
    const [file] = e.originalEvent.dataTransfer.files;
    eachActiveRoom((room, $c) => {
      room.send(file);
      $c.find('.messages').append('<div><span class="file">You sent a file.</span></div>');
    });
  });
  function doNothing(e) {
    e.preventDefault();
    e.stopPropagation();
  }

// Connect to a 逃げる人room 
  $('#connect').on('submit', e => {
    document.getElementById("actions").style.display="none";
    document.getElementById("connect").style.display="none";
    document.getElementById("connect1").style.display="none";
    e.preventDefault();
    const roomName = "逃げる人";
    if (!roomName) {
      return;
    }
    if (!connectedPeers[roomName]) {
      // Create 2 connections, one labelled chat and another labelled file.
      const room = peer.joinRoom(roomName);
      room.on('open', function() {
        connect(room);
        connectedPeers[roomName] = room;
      });
    }
  });

  // Connect to a 鬼room 
  $('#connect1').on('submit', e => {
    document.getElementById("actions").style.display="none";
    document.getElementById("connect").style.display="none";
    document.getElementById("connect1").style.display="none";
    e.preventDefault();
    const roomName = "鬼";
    if (!roomName) {
      return;
    }
    if (!connectedPeers[roomName]) {
      // Create 2 connections, one labelled chat and another labelled file.
      const room = peer.joinRoom(roomName);
      room.on('open', function() {
        connect(room);
        connectedPeers[roomName] = room;
      });
    }
  });


  // Close a connection.
  $('#close').on('click', () => {
    eachActiveRoom(function(room, $c) {
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
      if(msg != "") {
      room.send(msg); //メッセージ送信
      $c.find('.messages').append('<div><span class="you">あなた: </span>' + msg
        + '</div>');
    }
    });
    $('#text').val('');
    $('#text').focus();
  });

  // Show browser version
  $('#browsers').text(navigator.userAgent);

  // Make sure things clean up properly.
  window.onunload = window.onbeforeunload = function(e) {
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
    const header = $('<h1></h1>').html('部屋名: <strong>' + roomName + '</strong>');
    const messages = $('<div><em>接続されました</em></div>').addClass('messages');
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
            break;
          case 'ROOM_USER_JOIN':
            if (log.message.src === peer.id) {
              break;
            }
            messages.append('<div><span class="peer">' + log.message.src + '</span>が入室しました</div>');
            break;
          case 'ROOM_USER_LEAVE':
            if (log.message.src === peer.id) {
              break;
            }
            messages.append('<div><span class="peer">' + log.message.src + '</span>が退室しました</div>');
            break;
        }
      }
    });

    room.on('data', message => {
      if (message.data instanceof ArrayBuffer) {
        const dataView = new Uint8Array(message.data);
        const dataBlob = new Blob([dataView]);
        const url = URL.createObjectURL(dataBlob);
        messages.append('<div><span class="file">' +
          message.src + ' has sent you a <a target="_blank" href="' + url + '">file</a>.</span></div>');
      } else {
        messages.append('<div><span class="peer">' + message.src + '</span>: ' + message.data + '</div>');
      }
    });

    room.on('peerJoin', peerId => {
      messages.append('<div><span class="peer">' + peerId + '</span>が入室しました</div>');
    });

    room.on('peerLeave', peerId => {
      messages.append('<div><span class="peer">' + peerId + '</span>が退室しました</div>');
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

function getMyPlace() {
  var output = document.getElementById("result");
  if (!navigator.geolocation){//Geolocation apiがサポートされていない場合
    output.innerHTML = "<p>Geolocationはあなたのブラウザーでサポートされておりません</p>";
    return;
  }
  function success(position) {
    var latitude  = position.coords.latitude;//緯度
    var longitude = position.coords.longitude;//経度
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
  };
  function error() {
    //エラーの場合
    output.innerHTML = "座標位置を取得できません";
  };
  navigator.geolocation.getCurrentPosition(success, error);//成功と失敗を判断
}


