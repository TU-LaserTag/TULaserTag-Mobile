import React, { Component } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { ThemeProvider , Header, Icon, Button} from 'react-native-elements';
import { LaserTheme } from './Custom_theme';
import HomeIcon from './Home_Icon'
import SignupIcon from './Signup_Icon'
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
        <Icon name='login' type='entypo' color='white' onPress={() => this.goLogin()} />
      </Header>
      )
    } else if (type == "home") {
      return (
        <Header>
        <Text></Text>
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