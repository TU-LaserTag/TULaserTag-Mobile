import React, { Component } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import {Icon } from 'react-native-elements';

export default class SignupIcon extends Component {
  onPress = () => {
    this.props.onPress();
  }
 
  render() {
    return (
      <Icon
      //reverse
      name='user-plus'
      type='feather'
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