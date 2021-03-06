import React, { Component } from 'react';
import './App.css';
import io from 'socket.io-client';
import Peer from 'simple-peer';

class App extends Component {
  constructor() {
    super()
    this.state = {
      message: '',
      room: '',
      whatIsHappening: ''
    }
    this.initiator = false
    this.myIpData = {}
  }

  componentDidMount(){
    this.setSocketListeners()
  }

  setSocketListeners = () => {
    this.socket = io()

    this.socket.on('callPeer', (data) => {
      console.log('hit')
      if(!this.initiator){
        console.log(data)
        this.setState({whatIsHappening: "someone is calling you!"})
        this.gettingCall(data.ipData)
      }
    })

    this.socket.on('answerPeer', (data) => {
      if(this.initiator){
        this.setState({whatIsHappening: "other party answered you!"})
        this.gettingAnswer(data.ipData)
      }
    })
  }

  setRtcListeners = () => {
    this.rtc.on('error', function (err) { console.log('error', err) })

    this.rtc.on('connect', () => {
      console.log('CONNECT')
      this.rtc.send('whatever' + Math.random())
    })

    this.rtc.on('data', (data) => {
      console.log(""+data.message)
      this.setState({whatIsHappening: ""+data.message})
    })

    this.rtc.on('stream', function (stream) {
      var video = document.querySelector('video')
      video.srcObject = stream
      video.play()
    })
  }

  joinRoom = () => {
    this.socket.emit('joinRoom', this.state.room)
  }

  call = () => {
    this.initiator = true
    navigator.getUserMedia({video:true, audio:true}, this.gotMedia, function(){})
  }

  gettingCall = (ipData) => {
    navigator.getUserMedia({video:true, audio:true}, (stream) => this.gotMediaAfterBeingCalled(stream, ipData), function(){})
  }

  answer = () => {
    this.socket.emit('answerPeer', {room:this.state.room, initiator:this.initiator, ipData: JSON.stringify(this.myIpData)})
  }

  gettingAnswer = (ipData) => {
    this.rtc.signal(ipData)
  }

  gotMedia = (stream) => {
    this.rtc = new Peer({initiator: this.initiator, trickle:false, stream:stream})

    this.rtc.on('signal', (ipData) => {
      this.myIpData = ipData
      this.socket.emit('callPeer', {room:this.state.room, initiator:this.initiator, ipData:JSON.stringify(ipData)})
    })

    this.setRtcListeners()
  }

  gotMediaAfterBeingCalled = (stream, ipData) => {
    this.rtc = new Peer({initiator: this.initiator, trickle:false, stream:stream})

    this.rtc.on('signal', (data) => {
      if(data.renegotiate){return}
      this.myIpData = data
    })

    this.rtc.signal(JSON.parse(ipData))

    this.setRtcListeners()
  }

  sendMessage = () => {
    this.rtc.send({type: 'MSG', message: this.state.message})
  }

  render() {
    return (
      <div className="App">
        <p>{this.state.whatIsHappening}</p>
        <input onChange={(e) => this.setState({ room: e.target.value })} placeholder="room" />
        <button onClick={this.joinRoom}>Join Room</button>
        <button onClick={this.call}>Call</button>
        <button onClick={this.answer}>Answer</button>
        <video></video>
        <input onChange={(e) => this.setState({message: e.target.value})}/>
        <button onClick={this.sendMessage}>Send Message</button>
      </div>
    );
  }
}

export default App;