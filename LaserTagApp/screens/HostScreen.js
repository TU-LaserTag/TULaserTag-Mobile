import React, { Component } from 'react';
import {StyleSheet,View} from 'react-native';
import { ThemeProvider , Header, Icon, Button} from 'react-native-elements';

//import Title from '../components/Ghs_Comps/Title'
export default class HostScreen extends Component {
  static navigationOptions = {
    title: 'Host Game', // Possibly have it dynamic to name
  };
    state = {
      loading: false,
      
    }
  
    componentDidMount(){
        console.log("Host Screen Mount")
        //const data = this.props.navigation.getParam("varName", "None") or else none
        
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
          return (
            <ThemeProvider {...this.props}  theme={LaserTheme}>
            <CustomHeader {...this.props} refresh = {this.refresh} headerText= "Host Game" headerType = "joihost" />
              
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