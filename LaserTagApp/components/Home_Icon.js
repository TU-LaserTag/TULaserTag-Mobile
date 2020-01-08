import React, { Component } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import {Icon } from 'react-native-elements';

export default class HomeIcon extends Component {
  onPress = () => {
    console.log("OnPressed");
    this.props.onPress();
  }
 
  render() {
    const {children} = this.props

    return (
      <Icon
      //reverse
      name='home'
      type='FontAwesome'
      color='white'
      onPress={() => this.onPress()}
    />
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