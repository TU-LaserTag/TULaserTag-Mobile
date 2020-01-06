import React, { Component } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Container } from 'native-base';

export default class Title extends Component {

  render() {
    const {children} = this.props

    return (
        <View style={styles.header}>
            <Text style={styles.title}>{children}</Text>
        </View>
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