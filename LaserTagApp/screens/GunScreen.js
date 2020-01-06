import React, { Component } from 'react';
import {StyleSheet,View} from 'react-native';
import { Title, Icon, Subtitle,Container, Header, Spinner, Body, Left, Right, Button } from 'native-base';
//import Title from '../components/Ghs_Comps/Title'


export default class GunScreen extends Component {
  static navigationOptions = {
    title: 'Gun Communication', // Possibly have it dynamic to name
  };
    state = {
      loading: false,
      
    }
  
    componentDidMount(){
      console.log("Mount")
      //const data = this.props.navigation.getParam("varName", "None") or else none
      
    } 

    sendRequest(sValue) {
      this.setState({loading: true})
      fetch('basicAPIRewuesturl',{ 
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputValue: sValue, 
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
      var chemName = this.state.chemName
      var chemCas = this.state.chemCas
      console.log('CHEMNAME:', chemName)   
        return (
            <Container style = {{backgroundColor: 'transparent'}}>
              <Header>
              <Left style={{flex:0.3}}>
                <View style = {{flexDirection: 'row'}}>
                <Button transparent  onPress={() => this.props.navigation.goBack()}>
                <Icon name='arrow-back' />
                </Button>
               {this.renderSpinner()}
            </View>
               </Left>
              <Body>
                <Title style={styles.title}>{this.state.chemName}</Title>
                <Subtitle style={styles.cas}>{this.state.chemCas}</Subtitle>
              </Body>
              <Right style={{flex:0.3}}>
                <Button  transparent>
                <Icon name='menu' />
                </Button>
              </Right>
            </Header>
            
    
            </Container>
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