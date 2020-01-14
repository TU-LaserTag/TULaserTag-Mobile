import React, { Component } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { ThemeProvider , Header, Icon, Button} from 'react-native-elements';
import { LaserTheme } from './Custom_theme';
import { Title } from 'native-base';
export default class CustomHeader extends Component {
  goHome = () => {
    this.props.navigation.navigate("Home")
  }

  goSignup = () => {
    console.log("Signup")
    this.props.navigation.navigate("Signup")
  }

  goLogin = () => {
    this.props.navigation.navigate("Login")
  }
  logout = () => {
    // Erase/reset session data
    this.props.navigation.navigate("Login")
    console.log("Logging out");
  }
  goSettings = () => {
    console.log("opening settings")
  }
  goBack = () => {
    this.props.navigation.goBack()
  }
  

  getHeader = () => { 
    const type = this.props.headerType
    
    console.log("getting header",type)
    if (type == "login"){
      return (
        <Header>
        <Text></Text>
        <Title><Text>{this.props.headerText}</Text></Title>
        <Icon name='user-plus' type='feather' color='white' onPress={() => this.goSignup()} />
        
      </Header>)
    } else if (type == "signup") {
      return (
        <Header>
        <Text></Text>
        <Title><Text>{this.props.headerText}</Text></Title>
        <Icon name='login' type='feather' color='white' onPress={() => this.goLogin()} />
      </Header>
      )
    } else if (type == "home") {
      return (
        <Header>
        <Icon name='settings' type='feather' color='white' onPress={() => this.goSettings()} />
        <Title><Text>{this.props.headerText}</Text></Title>
        <Icon name='log-out' type='feather' color='white' onPress={() => this.logout()} />
      </Header>
      )
    } else if (type == "gun") {
      return (
        <Header>
        <Icon name='chevron-left' type='fontAwesome' color='white' onPress={() => this.goBack()} />
        <Title><Text>{this.props.headerText}</Text></Title>
        <Icon name='home' type='fontAwesome' color='white' onPress={() => this.goHome()} />
      </Header>
      )
    } else if (type == "join") {
    return (
      <Header>
      <Icon name='chevron-left' type='fontAwesome' color='white' onPress={() => this.goBack()} />
      <Title><Text>{this.props.headerText}</Text></Title>
      <Icon name='home' type='fontAwesome' color='white' onPress={() => this.goHome()} />
    </Header>
    )
  }
  }

  render() {
    //console.log(this)
    return (
        <ThemeProvider theme = {LaserTheme}>
          {this.getHeader()}
      </ThemeProvider>
      
    )
  }
}

const styles = StyleSheet.create({
  header: {
    //flex:1,
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    color: 'darkblue',
    fontSize: 23,
    fontWeight: 'bold'
  },
})