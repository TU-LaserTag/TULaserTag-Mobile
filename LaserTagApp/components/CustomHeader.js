import React, { Component } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { ThemeProvider , Header, Icon, Button} from 'react-native-elements';
import { LaserTheme } from './Custom_theme';
import HomeIcon from './Home_Icon'
import { Title } from 'native-base';
export default class CustomHeader extends Component {
  goHome = () => {
    console.log("Going home")
    this.props.navigation.navigate("Home")
  }
  render() {
    const {children} = this.props
    //console.log(this)
    return (
        <ThemeProvider theme = {LaserTheme}>
        <Header>
        <HomeIcon {...children} onPress = {() => this.goHome()}/>
        <Title><Text>{this.props.headerText}</Text></Title>
        <Button type="clear" onPress={() => this.props.navigation.navigate("Home")}>
      </Button>
      </Header>
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