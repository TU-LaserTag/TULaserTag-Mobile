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
import ServerScreen from './screens/ServerScreen'

// Screen setup
const RootStack = createStackNavigator(
  {
    Home: HomeScreen,
    User: UserScreen,
    Server: ServerScreen,
    Gun: GunScreen    
  },
  {
    initialRouteName: "Home",
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

