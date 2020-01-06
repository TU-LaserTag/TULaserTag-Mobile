import React, { Component } from 'react';
import {Text} from 'react-native';
import ButtonMenu from '../components/Button_menu'
//import Icon from 'react-native-vector-icons/AntDesign';
import { Dimensions, ActivityIndicator } from 'react-native';
import Title from '../components/Title';

import { Container, Header, Content, Footer, FooterTab, Button, Left, Right, Body } from 'native-base';

export default class HomeScreen extends Component {
 state = {
  menuOptions: ["Gun Communication","Log In", "Server Communication"],
  menuTranslater: [{text:"Gun Communication",value: "Gun"}, {text:'Log In', value: "User"},{text:'Server Communication', value: "Server"}]
 }

 onMenuPress = (menuVal) => {
  const menuTranslater = this.state.menuTranslater
  let optDic = menuTranslater[menuVal]
  let optText = optDic.text
  let optVal =  optDic.value
  console.log(optDic, optText, optVal)
  alert("pressed "+optText)
  this.props.navigation.navigate(optVal)
}

  render() {
    const {menuOptions} = this.state
    const dimensions = Dimensions.get('window');
    //const imageHeight = Math.round(dimensions.width * 0.20);
    const imageWidth = dimensions.width;
    return (
      <Container>
         <Header>
          <Body>
            <Title>Home</Title>
          </Body>
        </Header>
         
        <Content>
        <ButtonMenu 
              menuOptions = {menuOptions}
              onPressItem = {this.onMenuPress}
        />
        </Content>
        <Footer>
          <FooterTab>
            <Button full>
              <Text>?</Text>
            </Button>
          </FooterTab>
        </Footer>
        </Container>

      )
  }
}
