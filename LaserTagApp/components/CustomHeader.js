import React, { Component } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { ThemeProvider , Header} from 'react-native-elements';
import { LaserTheme } from './Custom_theme';

export default class CustomHeader extends Component {

  render() {
    const {children} = this.props

    return (
        <ThemeProvider theme = {LaserTheme}>
        <Header
        placement="left"
        leftComponent={{ icon: 'menu', color: '#fff' }}
        centerComponent={{ text: this.props.headerText, style: { color: '#fff' } }}
        rightComponent={{ icon: 'home', color: '#fff' }} // Customize thes later
      />
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