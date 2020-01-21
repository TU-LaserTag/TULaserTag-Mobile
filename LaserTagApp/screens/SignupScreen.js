import React, { Component } from 'react';
import {StyleSheet,View} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import EntypoI from 'react-native-vector-icons/Entypo'

import { Button, ThemeProvider, Input, Header } from 'react-native-elements';
import { LaserTheme } from '../components/Custom_theme';
import { Container, Content, Spinner, Body,Left, Right } from 'native-base';
import {Web_Urls} from '../constants/webUrls';

import CustomHeader from '../components/CustomHeader';
import HomeScreen from './HomeScreen';
import Title from '../components/Title'


export default class SignupScreen extends Component {
  static navigationOptions = {
    title: 'Sign up', // Possibly have it dynamic to name
  };
    state = {
      loading: false,
      username: '',
      usernameError: '',
      pass: '',
      passError: '',
      confirmPass: '',
      conFirmPassError: ''
    }

    editUsername = username => {
      this.setState({ username });
    };
    editPassword = pass => {
      this.setState({ pass });
    };
    editConfirmPass = confirmPass => {
      this.setState({ confirmPass });
    };
    componentDidMount(){
        //const data = this.props.navigation.getParam("varName", "None") or else none
        
    } 
    
    signupPressed = () => {
      var error = false;
      console.log("Pressed Signup");
      console.log(this.state);
      if (this.state.username == '') {// Also run through alphanumeric validator
        console.log("Empty usname");
        this.setState({usernameError: "Must Input Username"});
        error =true;
      }
      if (this.state.pass == '') {// Also run through alphanumeric validator
        console.log("Empty Password");
        this.setState({passError: "Must Input Password"});
        error = true
      } 
      if (this.state.conFirmPass == '') {// Also run through alphanumeric validator
        console.log("Empty Password");
        this.setState({conFirmPassError: "Must Confirm Password"});
        error = true
      } else if (this.state.confirmPass != this.state.pass){
        console.log("Unmatching password")
        this.setState({conFirmPassError: "Passwords Do not match"});
        error = true
      }

     
      if (error == true){
        return // Breaks out of sending data
      } else{
        this.requestCreatePlayer()
        
      }
    };
    requestCreatePlayer(gameData){ 
      this.setState({loading: true})
      const username = this.state.username;
      const password = this.state.pass;
      const payload = {
        player_username: username,
        password: password
      }
      var getURL = Web_Urls.Host_Url + "/create/player";
      var request = new XMLHttpRequest();
        request.onreadystatechange = (e) => {
          if (request.readyState !== 4) {
            return;
          }
          if (request.status === 200) {
            playerResponse = JSON.parse(request.response);
            //console.log("Creating player",playerResponse)
            this.handleCreatePlayerResponse(playerResponse);
          } else {
            console.log("Got Error",request);
            // Needs more error handling
            this.setState({usernameError: "An error has occured Please try again later"});
          }
        }
        request.open('POST',getURL);
        request.setRequestHeader("Content-type","application/json");
        request.send(JSON.stringify(payload)); // Strigify?
    }
    
    handleCreatePlayerResponse = response => {
        this.setState({loading: false})
        if (response.ok){
          this.setState({usernameError: '', passError: '', conFirmPassError: ''});
          userData = response.body;
          console.log("UserData",userData)
          // Save user data 
          global.storage.save({
          key: 'userData',
            data: {
              username: userData.username,
              password: this.state.confirmPass,
            }
          })
          // Navigate to HomeScreen
          this.props.navigation.navigate("Login",{userData:userData});
        } else{
          console.log("OOF",response);
          this.setState({usernameError: response.message})
        }
      }
    
      renderSpinner = () => {
        if (this.state.loading == true){
          return(
            <Spinner style = {{height:5,
              paddingTop: 23,
              paddingLeft: 15,
              justifyContent: 'center', 
              alignContent: 'center'
              }} size='small' color='blue' />
          )
        } else{
          return (<View/>)
        }
      }
      render() {
        return(
          <ThemeProvider theme={LaserTheme}>
           <CustomHeader {...this.props} headerType = 'signup' headerText= "Sign Up" />
            <Container>
            <Input
              //autoCompleteType = 'username'
              placeholder='Username'
              returnKeyType='done'
              leftIcon={{ type: 'font-awesome', name: 'user' }}
              errorMessage= {this.state.usernameError}
              onChangeText={this.editUsername}
            />
            <Input
              //autoCompleteType = 'password'
              secureTextEntry = {true}
              password={true}
              placeholder='Password'
              returnKeyType='done'
              leftIcon={{ type: 'font-awesome', name: 'lock' }}
              errorMessage= {this.state.passError}
              onChangeText={this.editPassword}
            />
            <Input
              //autoCompleteType = 'password'
              secureTextEntry = {true}
              password={true}
              placeholder='Confirm Password'
              returnKeyType='done'
              leftIcon={{ type: 'font-awesome', name: 'lock' }}
              errorMessage= {this.state.conFirmPassError}
              onChangeText={this.editConfirmPass}
            />
            <Button 
              style = {{
                marginTop: 3
              }}
              title= 'Sign Up'
              onPress={() => this.signupPressed()}
              loading = {this.state.loading}
              />
             </Container>
          </ThemeProvider>
          );
        }
      }
