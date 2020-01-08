import React, { Component } from 'react';
import {View, AppRegistry} from 'react-native';
import { createAppContainer } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';

import { Font } from 'expo';
import { Ionicons } from '@expo/vector-icons';
//Screens --
import HomeScreen from './screens/HomeScreen'
import GunScreen from './screens/GunScreen'
import UserScreen from './screens/UserScreen'
import LoginScreen from './screens/LoginScreen'
import ServerScreen from './screens/ServerScreen'

// Screen setup
const RootStack = createStackNavigator(
  {
    Login: LoginScreen,
    Home: HomeScreen,
    User: UserScreen,
    Server: ServerScreen,
    Gun: GunScreen    
  },
  {
    initialRouteName: "Login",
    headerMode: 'none',
    navigationOptions: {
          headerVisible: true,
    }
  }
);

const AppContainer = createAppContainer(RootStack);
console.disableYellowBox = false;

//---------------- Exported data---------------------- \\
export default class App extends React.Component {
  
  render() {
    return <AppContainer />;
  }
}

