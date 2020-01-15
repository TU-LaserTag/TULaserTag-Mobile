import React, { Component } from 'react';
import {StyleSheet,View} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import EntypoI from 'react-native-vector-icons/Entypo'

import { Button, ThemeProvider, Input, Header } from 'react-native-elements';
import { LaserTheme } from '../components/Custom_theme';
import { Container, Content, Spinner, Body,Left, Right } from 'native-base';

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
    editConfirmPass = key => {
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
       // error =true;
      }
      if (this.state.pass == '') {// Also run through alphanumeric validator
        console.log("Empty Password");
        this.setState({passError: "Must Input Password"});
        //error = true
      } 
      if (this.state.conFirmPassError == '') {// Also run through alphanumeric validator
        console.log("Empty Password");
        this.setState({conFirmPassError: "Must Confirm Password"});
        //error = true
      } else if (this.state.confirmPass != this.state.pass){
        console.log("Unmatching password")
        this.setState({conFirmPassError: "Passwords Do not match"});

      }

     
      if (error == true){
        return // Breaks out of sending data
      } else{
        this.sendRequest()
        this.props.navigation.navigate("Home");
      }
    };
  
      sendRequest(sValue) {
        this.setState({loading: true})
        const username = this.state.username;
        const password = this.state.pass;
        var getURL = "Https://tuschedulealerts.com/player/"
        fetch(getURL,{ 
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: username,
            password: password 
          })
        })
        .then(this.handleResponse)
        .then(this.parseResponse)
        .catch((error) => {console.log("OOF:"); console.error(error);});
      }
    
      handleResponse = response => {
        this.setState({loading: false})
        if (response.ok){
          //console.log(response)
          // If data - no data or no type
          //display error on screen
          if (response == "none"){
            console.log("error in data")
            this.setState({loading: false})
            return "error"
            
          } else if ( response == "error") { // Or no echem search data
            console.log("More errors")
            this.setState({loading: false})
            return "Big sad" // From here submit request for echem search
          }else{
              return response.text()
          } // Happy path
  
        } else{
          //console.log(response)
          this.setState({loading: false})
          throw new Error ('Data retrieval Fail',response.error)
        }
      }
    
      parseResponse = data => {
        //console.log("parsing data",data)
        if (data == "error"){
          console.log("nooo")
          this.setState({chemData: "Something Went wrong"})
        }
         else if (data == "noData"){
          console.log("no data found")
        }
        else if (data == "notType"){
          console.log("Input type not recognized")
        }
        else{
          this.setState({errorStat: [false,"loading"]})
          var data = JSON.parse(data)            
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
              />
             </Container>
          </ThemeProvider>
          );
        }
      }
