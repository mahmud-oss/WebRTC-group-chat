var config = {'iceServers': []};
var peer = new RTCPeerConnection(config);

var me;
var other;

var channel;

peer.ondatachannel = function (e) {
  console.log("data channel : ",e.channel)
  channel = e.channel;
  channel.onopen = e => console.log('channel opened', e);
  channel.onclose = e => console.log('channel closed', e);
  channel.onmessage = e => console.log('got message', e);
  channel.onerror = e => console.log("error creating data channel ",e);
}

peer.onicecandidate = function (e) {
  if (!e.candidate) return
  console.log('got ice candidate', e)
  ws.send(JSON.stringify({
    action: 'candidate',
    to: other,
    data: e.candidate
  }))
}

var ws = new WebSocket('ws://127.0.0.1:80')
ws.onopen = e => console.log('websocket opened')
ws.onclose = e => console.log('websocket closed')
ws.onmessage = e => {
  console.log('websocket message', e.data)
  var data = JSON.parse(e.data);
  console.log("received nessage type : ", data.action)
  if (data.to === me) {
    console.log(me, " received ",data);
    switch (data.action) {
      case 'candidate':
        console.log("received candidate")
        peer.addIceCandidate(new RTCIceCandidate(data.data))
          .then(() => console.log('added ice candidate'))
          .catch(e => console.log('add ice error', e))
        break
      case 'offer':
        console.log("received offer")
        peer.setRemoteDescription(new RTCSessionDescription(data.data))
          .then(() => peer.createAnswer())
          .then(sdp => {
            ws.send(JSON.stringify({
              action: 'answer',
              to: other,
              data: sdp
            }))
            peer.setLocalDescription(sdp)
          })
          .then(() => console.log('offer handled'))
          .catch(e => console.log('error handling offer', e))
        break
      case 'answer':
        console.log("received answer")
        peer.setRemoteDescription(new RTCSessionDescription(data.data))
          .then(() => console.log('answer handled'))
          .catch(e => console.log('error handling answer', e))
        break
    }
  }
}

// trigger connection
function connect () {
  channel = peer.createDataChannel('main-channel')
  channel.onopen = e => console.log('channel opened', e)
  channel.onclose = e => console.log('channel closed', e)
  channel.onmessage = e => console.log('got message', e)

  peer.createOffer()
    .then(sdp => {
      peer.setLocalDescription(sdp)
      console.log("Sending offer to server : ", JSON.stringify({action: 'offer',to: other,data: sdp}))
      ws.send(JSON.stringify({
        action: 'offer',
        to: other,
        data: sdp
      }))
    })
    .catch(e => console.log('error creating and sending offer', e))
}