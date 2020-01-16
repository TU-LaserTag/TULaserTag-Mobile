import React, { Component } from 'react';
import {StyleSheet,View} from 'react-native';
import { ThemeProvider , Input, Icon, Text, Button, Slider, ListItem, ButtonGroup,Card} from 'react-native-elements';
import { LaserTheme } from '../components/Custom_theme';
import CustomHeader from '../components/CustomHeader'
import { Container } from 'native-base';
import { FlatList } from 'react-native-gesture-handler';
import DateTimePicker from '@react-native-community/datetimepicker';
import NumericInput from 'react-native-numeric-input'

export default class HostScreen extends Component {
  static navigationOptions = {
    title: 'Host Game', // Possibly have it dynamic to name
    gestureEnabled: false,
  };
  constructor(){
    super()
    this.state = {
      scanning:false,
      key: '',
      appState: '',
      connectedGun: null,
      keyError: '',
      discoveredP: false,
      loading: true,
      gameList: [],
      joinGameError: false,
      gameListHeader: '',
      gameModeIndex: 0,

      gameName: '',
      gameNameError: '',
      gameCode: '',
      gameCodeError: '',

      ammo: -1,
      today: new Date(),
      date: new Date(),
      showDatePicker: false,

      num_teams: 2,
      host: ''
     
    }
    //console.log("construct");
    //this.checkBLE(); Should get ran in GunStatusDisplay
    //this.loadStorage()  // Checks storage and then builds upon startBLEManager
    
    //this.joinGameHandleDiscoverPeripheral = this.joinGameHandleDiscoverPeripheral.bind(this);
    //this.joinGameHandleStopScan = this.joinGameHandleStopScan.bind(this);
    //this.joinGameHandleUpdateValueForCharacteristic = this.joinGameHandleUpdateValueForCharacteristic.bind(this);
    //this.joinGameHandleDisconnectedPeripheral = this.joinGameHandleDisconnectedPeripheral.bind(this);
    //this.joinGameHandleAppStateChange = this.joinGameHandleAppStateChange.bind(this);
    this.updateIndex = this.updateIndex.bind(this)
  }
  componentDidMount(){
    console.log("Host Screen Mount")
    const userData = this.props.navigation.getParam("userData", null);
    const host = userData.username;
    this.setState({host})
  } 
  updateIndex (gameModeIndex) {
    console.log("updatign index",gameModeIndex)
    this.setState({gameModeIndex})
  }
      
  editGameName = (gameName) =>{
    this.setState({gameName})
  }
  editGameCode = (gameCode) =>{
    this.setState({gameCode})
  }

  setDate = (event, date) => {
    date = date || this.state.date;
    this.setState({
      showDatePicker: Platform.OS === 'ios' ? true : false,
      date: date,
    });
  }
  
  toggleDatePicker = () =>{
    if (this.state.showDatePicker){
      this.setState({showDatePicker: false})
    } else{
      this.setState({showDatePicker: true})

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
/* INPUTS NEEDED TO CREATE A GAME:::
  General Game Creation: 
    /create/game
    Maxammo: -1 for infinite
    style: 'team'(Team) 'solo'(Free for all)
    timeDisabled: 
    maxLives:
    date:
    code: (make private)
    num_teams:
    team_selection: ?? (auto/manual) Default to manual, have auto pick later
    host: username
  Team Battle, Free for all
  (Prevent from running into midnight/Beyond)
  Team Creation/Picking:
    /Create/team
    Name:, Color
    /createBatch/team/{game_id}
    [name,color,team_id]
    /createbatch/assignment,
    [teamID,username]
  */ // Unsure what to do or how to make these look good
  soloButton = () => <View icon={<Icon name = 'user' size = {15}  color= "white"   type = 'feather' />}
                            title= "Free For All" ></View>
  teamButton = () => <View icon={<Icon name = 'users' size = {15}  color= "white"   type = 'feather' />}
                            title= "Team"></View>

  soloButton0 = () => <Text>Solo</Text>
  teamButton1 = () => <Text> Team </Text>

  renderGameModeButtons =() => {
    const buttons = [{ element: this.soloButton0 }, { element: this.teamButton1 }]
    const gameModeIndex  = this.state.gameModeIndex
    const gameIcon = (gameModeIndex == 0) ? 'user' : 'users';
    return (
      <Container style = {{flex: 0.4, backgroundColor: '#EEEEEE', marginTop: 4}}>
      <View style={{ backgroundColor: 'ae93Bf', flexDirection: 'row', marginTop: 0, justifyContent: 'center', alignContent: 'center'}}>
       <Icon name = {gameIcon} size = {18}  color= "black"  type = 'feather' > </Icon>
        <Text style = {{
          fontSize: 18
        }}>Game Mode:
        </Text>
        </View>
        <ButtonGroup
          onPress={this.updateIndex}
          selectedIndex={gameModeIndex}
          buttons={buttons}
          containerStyle={{height: 25}} />
     </Container>
    )
  }
  renderTeamNumberPicker = () => {
    const prereqText = ((this.state.gameModeIndex == 0 ) ? "Number of Players":"Number of Teams" );
    return(
      <Container style = {{flex: 1, flexDirection: 'row', backgroundColor: '#EEEEEE', marginTop: 4}}>
            <Text style={{ marginLeft: 4, fontSize: 20}}>{prereqText} </Text>
            <NumericInput 
              value={this.state.num_teams} 
              onChange={num_teams => this.setState({num_teams})} 
              onLimitReached={(isMax,msg) => console.log(isMax,msg)}
              totalWidth={100} 
              totalHeight={30} 
              iconSize={20}
              step={1}
              valueType='real'
              rounded 
              textColor='black' 
              iconStyle={{ color: 'white' }} 
              rightButtonBackgroundColor='#ae93Bf' 
              leftButtonBackgroundColor='#ae939f'/>
      </Container>
    )
  }
  renderAmmoSelection = () => {
    return (
          <View style={{ margin: 5,flex:1, alignItems: 'stretch', justifyContent: 'center' }}>
            <Slider
              thumbTintColor ='#61578b'
              step = {5}
              minimumValue = {-1}
              maximumValue = {1000000} 
              value={this.state.ammo}
              onValueChange={ammo => this.setState({ ammo })}
            />
            <Text>Ammo: {(this.state.ammo == -1) ?  "Infinite" : this.state.ammo}</Text>
          </View>
      )
  }
  renderDatePicker = () => {
    const today = new Date();
    const date = this.state.date
    const dateStr = date.toLocaleDateString();
    const show = this.state.showDatePicker;
    if (show){
      return (
        <Container style= {{ flex:5.3, backgroundColor: '#ffffff'}}>
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          <Text style = {{ marginLeft: 4, fontSize: 20, backgroundColor: '#ae93CF' }}>Date: {dateStr}</Text>
          </View>
        <Button onPress={this.toggleDatePicker} title="Done" />
        <DateTimePicker style= {{ flex:3, backgroundColor: '#CFC5FF'}}
                      value={date}
                      minimumDate={today}
                      mode='date'
                      is24Hour={true}
                      display="default"
                      onChange={this.setDate} />
       </Container>
        )
    }
    return (
    <Container style= {{ flex:0.5}}>
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Text style ={{marginLeft: 4, fontSize: 20}}>Date: {dateStr}</Text>
      </View>
    <Button onPress={this.toggleDatePicker} title="Set Date" />    
    </Container>
    )
  }
  render() {
      return (
        <ThemeProvider {...this.props}  theme={LaserTheme}>
          
          <CustomHeader {...this.props} headerText= "Host Game" headerType = "host" />
          <Input
            value = {this.state.gameName}
            autoCompleteType = 'off'
            placeholder='Game Name'
            returnKeyType='done'
            leftIcon={{ type: 'font-awesome', name: 'user' }}
            errorMessage= {this.state.gameNameError}
            onChangeText={this.editGameName}
          />
          <Input
            value = {this.state.gameCode}
            autoCompleteType = 'off'
            placeholder='Game Code (If private)'
            returnKeyType='done'
            leftIcon={{ type: 'entypo', name: 'key' }}
            errorMessage= {this.state.codeError}
            onChangeText={this.editGameCode}
          />
          
          
          {this.renderDatePicker()}
          {this.renderGameModeButtons()}
          {this.renderTeamNumberPicker()}
          
          {this.renderAmmoSelection()}
          <Button title= "Begin Hosting"/>
         
        </ThemeProvider>
      );
  }
}