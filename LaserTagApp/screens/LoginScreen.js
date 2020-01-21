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
import storage from '../Storage'

export default class LoginScreen extends Component {
  static navigationOptions = {
    title: 'Login', // Possibly have it dynamic to name
  };
    state = {
      loading: false,
      username: '',
      usernameError: '',
      pass: '',
      passError: '',
    }

    editUsername = username => {
      this.setState({ username });
    };
    editPassword = pass => {
      this.setState({ pass });
    };
    editGamekey = key => {
      this.setState({ key });
    };
    componentDidMount(){
        console.log("Login mount")
        this.loadStorage()
        //const data = this.props.navigation.getParam("varName", "None") or else none
        
    } 
    
    loadStorage = () => {
        global.storage.load ({
        key: 'userData',
        autoSync: true,
        syncInBackground: true,
        syncParams: {
          extraFetchOptions: {
            // blahblah
          },
          someFlag: true
        }
    })
    .then(ret => {
    console.log(ret);
    this.setState({username: ret.username,
                   pass: ret.password})
    })
    .catch(err => {
      // any exception including data not found
      // goes to catch()
      console.log(err.message);
      switch (err.name) {
        case 'NotFoundError':
          console.log((" Nodata"));
          break;
        case 'ExpiredError':
          // TODO
          break;
      }
    });
    }

    loginPressed = () => {
      var error = false;
      console.log("Pressed login");
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
      if (error == true){
        return // Breaks out of sending data
      } else{
        this.requestLogin();
      }
    };

    loggedIn = (userData) => {
      console.log("Logging in and storing data",userData)
      
      global.storage.save({
        key: 'userData',
        data: {
          username: userData.username,
          userid: userData.id,
          password: this.state.pass,
          role: userData.role,
        }
      })
      this.props.navigation.navigate("Home",{userData: userData});
    }
  
    requestLogin() { // Request all games
      this.setState({loading: true})
      var getURL = Web_Urls.Host_Url + "/player/"+this.state.username+"/"+this.state.pass;
      console.log("Sending request to ",getURL)
      var request = new XMLHttpRequest();
        request.onreadystatechange = (e) => {
          if (request.readyState !== 4) {
            return;
          }
          if (request.status === 200) {
            response = JSON.parse(request.response);
            //console.log
            this.handleLoginResponse(response);
          } else {
            // Needs more error handling
            console.log("Error",request)
            this.setState({usernameError: "Error while Connecting To Server",
                         loading: false}); 
            return false;
          }
        }
        request.open('GET', getURL);
        request.send();
    }
    
      handleLoginResponse = response => {
        this.setState({loading: false})
        if (response.ok){
          this.setState({usernameError: '', passError: ''});
          const userData = response.person
          //console.log("userData",userData)
          this.loggedIn(userData);
        } else{
          console.log("Incorrect Something",response.message);
          // Separate out?
          this.setState({passError: "Incorrect Username or Password"}); 
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
           <CustomHeader {...this.props} headerText= "Login" headerType = "login" />
            <Container>
            <Input
              value = {this.state.username}
              autoCompleteType = 'username'
              placeholder='Username'
              returnKeyType='done'
              leftIcon={{ type: 'font-awesome', name: 'user' }}
              errorMessage= {this.state.usernameError}
              onChangeText={this.editUsername}

            />
            <Input
              value = {this.state.pass}
              autoCompleteType = 'password'
              secureTextEntry = {true}
              password={true}
              placeholder='Password'
              returnKeyType='done'
              leftIcon={{ type: 'font-awesome', name: 'lock' }}
              errorMessage= {this.state.passError}
              onChangeText={this.editPassword}
            />
            <Button 
              style = {{
                marginTop: 3
              }}
              title= 'Login'
              onPress={() => this.loginPressed()}
              loading = {this.state.loading}
              />
             </Container>
          </ThemeProvider>
          );
        }
      }
  
      
  const styles = StyleSheet.create({
    header: {
      //flex:1,
      top: 0, 
      alignItems: 'center',
      marginBottom:1
    },
    title: {
      textAlign: 'center',
      color: '#1E0F2A',
      fontSize: 19,
      fontWeight: 'bold'
    },
    cas: {
      textAlign: 'center',
      color: '#1E0F2A',
      fontSize: 15,
      fontWeight: 'bold'
    },
  })