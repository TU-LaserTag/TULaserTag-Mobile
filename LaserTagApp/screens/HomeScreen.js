import React, { Component } from 'react';
import ButtonMenu from '../components/Button_menu'
//import Icon from 'react-native-vector-icons/AntDesign';
import { Dimensions, NativeEventEmitter,ActivityIndicator,NativeModules } from 'react-native';
import { Container, Footer, FooterTab} from 'native-base';
import CustomHeader from '../components/CustomHeader';
import {LaserTheme} from '../components/Custom_theme';
import BluetoothManager from '../components/Ble_manager'
import { Text,Button, ThemeProvider, Input, Divider, ListItem} from 'react-native-elements';
//const BleManagerModule = NativeModules.BleManager;
//const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);
export default class HomeScreen extends Component {
  static navigationOptions = {
    title: 'Home', // Possibly have it dynamic to name
  };
 state = {
  gunData: null,
  menuOptions: ["Manage Gun","Join Game", "Host Game"],
  menuTranslater: [{text:"Connect To Blaster",value: "Gun"}, {text:'Join Game', value: "Join"},{text:'Host Game', value: "Host"}],
  userData: this.props.navigation.getParam("userData", null)
}
componentDidMount() {
  console.log("HomeScreenMoubnt");
  
}
getGunData = (gunData) =>{
  this.setState({gunData});
} 
componentWillUnmount() { // cancel all async tasks herere?
  console.log("Unmounting HomeScreen")
 // var updateListeners = bleManagerEmitter.listeners('BleManagerDidUpdateValueForCharacteristic');
 // var disconnectListeners = bleManagerEmitter.listeners('BleManagerDisconnectPeripheral');
 // var discoverListeners = bleManagerEmitter.listeners('BleManagerDiscoverPeripheral');
 // var stopListeners = bleManagerEmitter.listeners('BleManagerStopScan');
  //console.log(updateListeners,disconnectListeners,discoverListeners,stopListeners);
}
 onMenuPress = (menuVal) => {
  const menuTranslater = this.state.menuTranslater
  let optDic = menuTranslater[menuVal]
  let optText = optDic.text
  let optVal =  optDic.value
  //console.log(optDic, optText, optVal)
  //alert("pressed "+optText)
  this.props.navigation.navigate(optVal,{userData: this.state.userData, gunData: this.state.gunData});
}

renderWelcome(){
  const username = this.state.userData.username
  return (
    <Text 
      style={{
      color: 'white',
      fontSize: 15,
      margin: 0,
      backgroundColor: 'black',
      textAlign: 'center'
      }}
       >
      Welcome Back, {username}!
  </Text>
  )
}

  render() {
    const {menuOptions} = this.state
    const dimensions = Dimensions.get('window');
    //const imageHeight = Math.round(dimensions.width * 0.20);
    const imageWidth = dimensions.width;
    return (
      <ThemeProvider theme={LaserTheme}>
       <CustomHeader {...this.props} headerType = 'home' headerText= "Home" />
       {this.renderWelcome()}
       <BluetoothManager {...this.props} getGunData = {this.getGunData} screen= "Home" ></BluetoothManager>

        
        
        <ButtonMenu 
              menuOptions = {menuOptions}
              onPressItem = {this.onMenuPress}
        />
        
        </ThemeProvider>
      )
  }
}
