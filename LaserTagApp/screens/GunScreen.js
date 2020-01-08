import React, { Component } from 'react';
import {StyleSheet} from 'react-native';
import {
  Text,
  View,
  FlatList,
  Switch
} from 'native-base';

import BluetoothManager from '../components/Ble_manager'

//import BluetoothSerial from 'react-native-bluetooth-serial'
//import "../components/Blue_tooth"
export default class GunScreen extends Component {
  constructor (props) {
    super(props)
    this.state = {
      isEnabled: false,
      discovering: false,
      devices: [],
      unpairedDevices: [],
      connected: false,
    }
  }
  componentDidMount(){
    console.log("Mounted")
  /*
    Promise.all([
      BluetoothSerial.isEnabled(),
      BluetoothSerial.list()
    ])
    .then((values) => {
      const [ isEnabled, devices ] = values
      this.setState({ isEnabled, devices })
    })
   
    /*BluetoothSerial.on('bluetoothEnabled', () => console.log("BlueTooth Enabled"))
    BluetoothSerial.on('bluetoothDisabled', () => {
      console.log("Bluetooth disabled")
         this.setState({ devices: [] })
    })
    BluetoothSerial.on('error', (err) => console.log(`Error: ${err.message}`)) 
    BluetoothSerial.on('connectionLost', () => console.log("Connection lost"))*/
  }
  _renderItem(item){

    return(<View style={styles.deviceNameWrap}>
            <Text style={styles.deviceName}>{item.item.name}</Text>
          </View>)
  }
  /*
  enable () {
    BluetoothSerial.enable()
    .then((res) => this.setState({ isEnabled: true }))
    .catch((err) => Toast.showShortBottom(err.message))
  }

  disable () {
    BluetoothSerial.disable()
    .then((res) => this.setState({ isEnabled: false }))
    .catch((err) => Toast.showShortBottom(err.message))
  }

  toggleBluetooth (value) {
    if (value === true) {
      this.enable()
    } else {
      this.disable()
    }
  }
  */
  render() {

    return (
        <BluetoothManager></BluetoothManager>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
  },
  toolbar:{
    paddingTop:30,
    paddingBottom:30,
    flexDirection:'row'
  },
  toolbarButton:{
    width: 50,
    marginTop: 8,
  },
  toolbarTitle:{
    textAlign:'center',
    fontWeight:'bold',
    fontSize: 20,
    flex:1,
    marginTop:6
  },
  deviceName: {
    fontSize: 17,
    color: "black"
  },
  deviceNameWrap: {
    margin: 10,
    borderBottomWidth:1
  }
});