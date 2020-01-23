import React, { Component } from 'react';
import {View, AppRegistry} from 'react-native';
import { createAppContainer } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';

import { Font } from 'expo';
import { Ionicons } from '@expo/vector-icons';
//Screens --
import HomeScreen from './screens/HomeScreen'
import GunScreen from './screens/GunScreen'
import LoginScreen from './screens/LoginScreen'
import HostScreen from './screens/HostScreen'
import JoinGameScreen from './screens/JoinGameScreen';
import SignupScreen from './screens/SignupScreen';
import GameLobbyScreen from './screens/GameLobbyScreen';
import InGameScreen from './screens/InGameScreen';

// Screen setup
const RootStack = createStackNavigator(
  {
    Login: LoginScreen,
    Signup: SignupScreen,
    Home: HomeScreen,
    Join: JoinGameScreen,
    Host: HostScreen,
    Gun: GunScreen,
    Lobby: GameLobbyScreen,
    Game: InGameScreen 
  },
  {
    initialRouteName: "Login",
    headerMode: 'none',
    navigationOptions: {
          headerVisible: true,
          gestureEnabled: false,
    }
  }
);

const AppContainer = createAppContainer(RootStack);
console.disableYellowBox = false;

//---------------- Exported data---------------------- \\
export default class App extends React.Component {
  componentWillUnmount(){
    console.log("UNMOUNTIHNG APP");
  }
  render() {
    return <AppContainer />;
  }
}

