import React, { Component } from 'react';
import {StyleSheet,View} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { Button, ThemeProvider, Input } from 'react-native-elements';
import { LaserTheme } from '../components/Custom_theme';
import { Container } from 'native-base';
import CustomHeader from '../components/CustomHeader';

//import Title from '../components/Ghs_Comps/Title'


export default class JoinGameScreen extends Component {
  static navigationOptions = {
    title: 'Join Game', // Possibly have it dynamic to name
  };
    state = {
      loading: false,
      key: '',
      keyError:''
    }

    
    editGamekey = key => {
      this.setState({ key });
    };
    componentDidMount(){
        //console.log("Mount")
        //const data = this.props.navigation.getParam("varName", "None") or else none
        
    } 
    
    joinPressed = () => {
      var error = false;
      console.log("Joining Game");
      console.log(this.state);

      if (this.state.key == '') {
        console.log( "Empty key");
        this.setState({key: ''})
        this.requestGames()
      } else{
        this.requestJoin()
      }
      if (error = true){
        return // Breaks out of sending data
      } else{
       console.log("ERRR?")
      }
    };
  
      requestGames() {
        this.setState({loading: true})
        var getURL = "Https://tuschedulealerts.com/game"
        console.log("Sending request to ",getURL)

        fetch(getURL,{ 
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          }
        })
        .then(this.handleResponse)
        .then(this.parseResponse)
        .catch((error) => {console.log("OOF:"); console.error(error);});
      }
    
      requestJoin(){
        this.setState({loading: true})
        const key =this.state.key;
        var getURL = "Https://tuschedulealerts.com/game/code/"+key
        console.log("Sending request to ",getURL)
        fetch(getURL,{ 
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          }
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

      getGameStatus = () => {
        console.log("Getting game status",this.state)
        if (this.state.key == "") {
          return "View Games"
        } else{
          return "Join Game"
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
           <CustomHeader {...this.props} headerText= "Join Game" />
            <Container>
            <Input
              placeholder='Game Key (optional)'
              keyboardType='number-pad'
              returnKeyType='done'
              leftIcon={{ type: 'entypo', name: 'key' }}
              errorMessage= {this.state.keyError}
              onChangeText={this.editGamekey}
            />
            <Button 
              title= {this.getGameStatus()}
              onPress={() => this.joinPressed()}
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