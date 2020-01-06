import React, { Component } from 'react';
import { StyleSheet, Text, View, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/AntDesign';

export default class MenuItem extends Component{
    onPressItem(i){
      console.log("MenuItem button pressed",i)
    }
    render(){
      return (
            <View></View>
      );
    }
  
  }

  const styles = StyleSheet.create({
    menuOption: {
      color: 'red',
      fontSize: 24,
      borderWidth: 2,
      borderColor: 'black',
      justifyContent: 'center',
    },
    button: {
      marginBottom: 0,
      width: 260,
      alignItems: "center",
      backgroundColor: '#642693',
      borderRadius: 10, // 0-50
  
    },
    buttonText: {
      padding: 20,
      fontSize: 20,
      color: "white"
    },  
  });