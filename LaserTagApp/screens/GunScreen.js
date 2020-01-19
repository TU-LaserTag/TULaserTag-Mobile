import React, { Component } from 'react';
import {StyleSheet,NativeEventEmitter,NativeModules} from 'react-native';
import {
  Text,
  View,
  FlatList,
  Switch
} from 'native-base';
import CustomHeader from '../components/CustomHeader';

import { Button, ThemeProvider, ListItem,Divider, Input} from 'react-native-elements'; 
import { LaserTheme } from '../components/Custom_theme';
import BluetoothManager from '../components/Ble_manager'
//const BleManagerModule = NativeModules.BleManager;
//const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);
//import BluetoothSerial from 'react-native-bluetooth-serial'
//import "../components/Blue_tooth"
export default class GunScreen extends Component {
  constructor (props) {
    //BM  = new BluetoothManager();
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
    console.log("Gun Screden Mount");
    //this.setState({BluetoothM.state})
  }
  
  componentWillUnmount() { // cancel all async tasks herere?
    console.log("Unmounting gunscreen")
    //var updateListeners = bleManagerEmitter.listeners('BleManagerDidUpdateValueForCharacteristic');
    //var disconnectListeners = bleManagerEmitter.listeners('BleManagerDisconnectPeripheral');
    //var discoverListeners = bleManagerEmitter.listeners('BleManagerDiscoverPeripheral');
    //var stopListeners = bleManagerEmitter.listeners('BleManagerStopScan');
    //console.log(updateListeners,disconnectListeners,discoverListeners,stopListeners);
  }

  _renderItem(item){

    return(<View style={styles.deviceNameWrap}>
            <Text style={styles.deviceName}>{item.item.name}</Text>
          </View>)
  }
  render() {
   
    return (
      <ThemeProvider theme={LaserTheme}>
        <CustomHeader {...this.props} headerText = "Connect to Gun" headerType = "gun"/>
        <ThemeProvider theme={LaserTheme}>
        <BluetoothManager {...this.props} screen= "Gun"></BluetoothManager>
        
        
        </ThemeProvider>
       
      </ThemeProvider>
    )
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