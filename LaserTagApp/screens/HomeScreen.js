import React, { Component } from 'react';
import {Text} from 'react-native';
import ButtonMenu from '../components/Button_menu'
//import Icon from 'react-native-vector-icons/AntDesign';
import { Dimensions, ActivityIndicator } from 'react-native';
import { Container, Content, Footer, FooterTab, Button, Body} from 'native-base';
import CustomHeader from '../components/CustomHeader';
import { ThemeProvider } from 'react-native-elements';
import {LaserTheme} from '../components/Custom_theme';
import BleManager, { connect } from 'react-native-ble-manager';

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

 onMenuPress = (menuVal) => {
  const menuTranslater = this.state.menuTranslater
  let optDic = menuTranslater[menuVal]
  let optText = optDic.text
  let optVal =  optDic.value
  //console.log(optDic, optText, optVal)
  //alert("pressed "+optText)
  this.props.navigation.navigate(optVal)
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
        <Container style= {{backgroundColor: 'gray'}}>
        <ButtonMenu 
              menuOptions = {menuOptions}
              onPressItem = {this.onMenuPress}
        />
        </Container>
        <Footer>
          <FooterTab>
            <Button full>
              <Text>?</Text>
            </Button>
          </FooterTab>
        </Footer>
        </ThemeProvider>
      )
  }
}
