import React, { Component } from 'react';
import ButtonMenu from '../components/Button_menu'
//import Icon from 'react-native-vector-icons/AntDesign';
import { Dimensions, ActivityIndicator } from 'react-native';
import { Container, Footer, FooterTab} from 'native-base';
import CustomHeader from '../components/CustomHeader';
import {LaserTheme} from '../components/Custom_theme';
import BleManager, { connect } from 'react-native-ble-manager';
import { Text,Button, ThemeProvider, Input, Divider, ListItem} from 'react-native-elements';
//import LaserTheme from '../components/Custom_theme'
export default class HomeScreen extends Component {
  static navigationOptions = {
    title: 'Home', // Possibly have it dynamic to name
  };
 state = {
  menuOptions: ["Manage Gun","Join Game", "Host Game"],
  menuTranslater: [{text:"Connect To Blaster",value: "Gun"}, {text:'Join Game', value: "Join"},{text:'Host Game', value: "Host"}],
  loginData: this.props.navigation.getParam("loginData", '')
}
componentDidMount() {
  console.log("HomeScreenMoubnt");
  //AppState.addEventListener('change', this.handleAppStateChange);

  //const updateListeners = bleManagerEmitter.listeners('BleManagerDidUpdateValueForCharacteristic');
  //const disconnectListeners = bleManagerEmitter.listeners('BleManagerDisconnectPeripheral');
  //const discoverListeners = bleManagerEmitter.listeners('BleManagerDiscoverPeripheral');
  //const stopListeners = bleManagerEmitter.listeners('BleManagerStopScan');

  //if (discoverListeners.length <= 1) {
  //    console.log("added discover listener");
   //   this.handlerDiscover = bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', this.handleDiscoverPeripheral );
  //}
  //if (stopListeners.length <= 1) {
    //console.log("added stop listener");
   // this.handlerStop = bleManagerEmitter.addListener('BleManagerStopScan', this.handleStopScan );
  //}
  //if (disconnectListeners.length <= 1) {
   // console.log("added disconnect listener");
  //  this.handlerDisconnect = bleManagerEmitter.addListener('BleManagerDisconnectPeripheral', this.handleDisconnectedPeripheral );
  //}
  //if (updateListeners.length <= 1) {
    //console.log("added updateListener");
    //this.handlerUpdate = bleManagerEmitter.addListener('BleManagerDidUpdateValueForCharacteristic', this.handleUpdateValueForCharacteristic );
  //}
}
 onMenuPress = (menuVal) => {
  const menuTranslater = this.state.menuTranslater
  let optDic = menuTranslater[menuVal]
  let optText = optDic.text
  let optVal =  optDic.value
  //console.log(optDic, optText, optVal)
  //alert("pressed "+optText)
  this.props.navigation.navigate(optVal,{userData: this.state.loginData});
}

renderWelcome(){
  const username = this.state.loginData.username
  return (
    <Text 
      style={{
      color: 'white',
      fontSize: 18,
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
        
        <ButtonMenu 
              menuOptions = {menuOptions}
              onPressItem = {this.onMenuPress}
        />
        <Footer>
          <FooterTab>
            
          </FooterTab>
        </Footer>
        </ThemeProvider>
      )
  }
}
