import React, { Component } from 'react';
import {StyleSheet} from 'react-native';
import {
  Text,
  View,
  FlatList,
  Switch
} from 'native-base';
import CustomHeader from '../components/CustomHeader';

import { Button, ThemeProvider, Input } from 'react-native-elements'; 
import { LaserTheme } from '../components/Custom_theme';
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
  }
  _renderItem(item){

    return(<View style={styles.deviceNameWrap}>
            <Text style={styles.deviceName}>{item.item.name}</Text>
          </View>)
  }
  render() {

    return (
      <ThemeProvider theme= {LaserTheme}>
        <CustomHeader headerText = "Connect to Gun" headerType = "gun"/>
        <BluetoothManager>
          </BluetoothManager>
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