import React, { Component } from 'react';
import {StyleSheet,View,Dimensions, ViewBase} from 'react-native';
import { ThemeProvider , Input, Icon, Text, Button, Slider, ListItem, ButtonGroup,Card} from 'react-native-elements';
import { LaserTheme } from '../components/Custom_theme';
import CustomHeader from '../components/CustomHeader'
import { Container } from 'native-base';
import { FlatList } from 'react-native-gesture-handler';
import DateTimePicker from '@react-native-community/datetimepicker';
import NumericInput from 'react-native-numeric-input'
const dimensions = Dimensions.get('window');
const Container_Width = Math.round(dimensions.width *1/3);
const Container_Height = Math.round(dimensions.height * 1/20);
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
      selectionIndex:0,
      gameName: '',
      gameNameError: '',
      gameCode: '',
      gameCodeError: '',

      ammo: 0,
      today: new Date(),
      gameDate: new Date(),
      game_length: 15,
      lengthLimit: null,
      showDatePicker: false,
      num_teams: 2,
      num_lives: 3,
      timeDisabled: 5,
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
    //console.log("Host Screen Mount")
    const userData = this.props.navigation.getParam("userData", null);
    const host = userData.username;
    this.setState({host})
  } 
  updateIndex (gameModeIndex) {
    this.setState({gameModeIndex})
  }
      
  editGameName = (gameName) =>{
    this.setState({gameName})
  }
  editGameCode = (gameCode) =>{
    this.setState({gameCode})
  }

  setDate = (event, date) => {
    date = date || this.state.gameDate;
    this.setState({
      showDatePicker: Platform.OS === 'ios' ? true : false,
      gameDate: date,
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

  soloButton0 = () => <Text>Free For All</Text>
  teamButton1 = () => <Text>Team</Text>

  selectionButton0 = () => <Text>Manual</Text>
  selectionButton1 = () => <Text>Automatic</Text>

  renderGameModeButtons =() => {
    const buttons = [{ element: this.soloButton0 }, { element: this.teamButton1 }]
    const gameModeIndex  = this.state.gameModeIndex
    const gameIcon = (gameModeIndex == 0) ? 'user' : 'users';
    return (
      <Container style = {{flex: 0.4, backgroundColor: '#EEEEEE', marginTop: 4}}>
      <View style={{ backgroundColor: 'ae93Bf', flexDirection: 'row', marginTop: 0, justifyContent: 'center', alignContent: 'center'}}>
       <Icon name = {gameIcon} size = {18}  color= "black"  type = 'feather' > </Icon>
        <Text style = {{ color: '#4a4a4a',
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
  renderTeamSelectionModeButtons =() => {
    const buttons = [{ element: this.selectionButton0 }, { element: this.selectionButton1 }]
    const selectionIndex  = this.state.selectionIndex
    const gameIcon = (selectionIndex == 0) ? 'gears' : 'pencil';
    const prereqText = ((this.state.gameModeIndex == 0 ) ? "Players":"Teams" );
    if (prereqText == "Players"){
      return(
        <View></View>
      )
    }
    return (
      <Container style = {{flex: 0.4, backgroundColor: '#EEEEEE', marginTop: 4}}>
      <View style={{ backgroundColor: 'ae93Bf', flexDirection: 'row', marginTop: 0, justifyContent: 'center', alignContent: 'center'}}>
       <Icon name = {gameIcon} size = {18}  color= "black"  type = 'font-awesome' > </Icon>
        <Text style = {{
          fontSize: 18, color: '#4a4a4a'
        }}>Team Selection:
        </Text>
        </View>
        <ButtonGroup
          onPress={selectionIndex => this.setState({selectionIndex})}
          selectedIndex={selectionIndex}
          buttons={buttons}
          containerStyle={{height: 25}} />
     </Container>
    )
  }
  renderTeamNumberPicker = () => {
    const prereqText = ((this.state.gameModeIndex == 0 ) ? "Players":"Teams" );
    if (prereqText == "Players"){
      return(
        <View></View>
      )
    }
    return(
      <Container style = {{flex: 0.3, flexDirection: 'row', backgroundColor: '#EEEEEE', marginTop: 4}}>
           <View style={{width: Container_Width, height: Container_Height /*Border? background color?*/}}>
              <Text style={{ margin: 3, fontSize: Container_Height/1.5}}>{prereqText}: </Text>
            </View>
            <NumericInput 
              value={this.state.num_teams} 
              onChange={num_teams => this.setState({num_teams})} 
              onLimitReached={(isMax,msg) => console.log(isMax,msg)}
              totalWidth={Container_Width} 
              totalHeight={Container_Height} 
              iconSize={20}
              minValue={2}
              step={1}
              valueType='integer'
              rounded 
              textColor='#4a4a4a' 
              iconStyle={{ color: 'white' }} 
              rightButtonBackgroundColor='#ae93Bf' 
              leftButtonBackgroundColor='#ae939f'/>
              <View style={{width: Container_Width, height: Container_Height /*Border? background color?*/}}>
              <Text style={{color: 'gray', marginLeft: 4, fontSize: 10}}>Number of {prereqText} in the game</Text>
              </View>
      </Container>
    )
  }
  renderLivesNumberPicker = () => {
    //const liveText = ((this.state.gameModeIndex == 0 ) ? "Number of lives":"Number of lives" );
    const liveText = "Lives :";
    return(
      <Container style = {{flex: 0.3, flexDirection: 'row', backgroundColor: '#EEEEEE', marginTop: 4}}>
           <View style={{width: Container_Width, height: Container_Height /*Border? background color?*/}}>
            <Text style={{ margin: 3, fontSize: Container_Height/1.5}}>{liveText} </Text>
          </View>
            <NumericInput 
              value={this.state.num_lives} 
              onChange={num_lives => this.setState({num_lives})} 
              onLimitReached={(isMax,msg) => console.log(isMax,msg)}
              totalWidth={Container_Width} 
              totalHeight={Container_Height} 
              iconSize={20}
              step={1}
              minValue={0}
              valueType='integer'
              rounded 
              textColor='#4a4a4a' 
              iconStyle={{ color: 'white' }} 
              rightButtonBackgroundColor='#ae93Bf' 
              leftButtonBackgroundColor='#ae939f'/>
            <View style={{width: Container_Width, height: Container_Height /*Border? background color?*/}}>
              <Text style={{color: 'gray', marginLeft: 4, fontSize: 11}}>Lives per game    (0 for infinite)</Text>
            </View>
      </Container>
    )
  }
  renderCooldownNumberPicker = () => {
    //const liveText = ((this.state.gameModeIndex == 0 ) ? "Number of lives":"Number of lives" );
    const liveText = "Cooldown";
    return(
      <Container style = {{flex: 0.3, flexDirection: 'row', backgroundColor: '#EEEEEE', marginTop: 4}}>
           <View style={{width: Container_Width, height: Container_Height /*Border? background color?*/}}>
            <Text style={{ margin: 3, fontSize: Container_Height/1.5}}>{liveText} </Text>
          </View>
            <NumericInput 
              value={this.state.timeDisabled} 
              onChange={timeDisabled => this.setState({timeDisabled})} 
              onLimitReached={(isMax,msg) => console.log(isMax,msg)}
              totalWidth={Container_Width} 
              totalHeight={Container_Height} 
              iconSize={20}
              step={1}
              minValue={0}
              valueType='integer'
              rounded 
              textColor='#4a4a4a' 
              iconStyle={{ color: 'white' }} 
              rightButtonBackgroundColor='#ae93Bf' 
              leftButtonBackgroundColor='#ae939f'/>
            <View style={{width: Container_Width, height: Container_Height /*Border? background color?*/}}>
              <Text style={{color: 'gray', marginLeft: 4, fontSize: 10}}>Seconds disabled after hit</Text>
              </View>
      </Container>
    )
  }

  renderAmmoSelection = () => {
    return (
          <Container style = {{flex: 0.3, flexDirection: 'row', backgroundColor: '#EEEEEE', marginTop: 4}}>
          <View style={{width: Container_Width, height: Container_Height /*Border? background color?*/}}>
           <Text style={{ margin: 3, fontSize: Container_Height/1.5}}>Ammo:</Text>
         </View>
           <NumericInput 
             value={this.state.ammo} 
             onChange={ammo => this.setState({ammo})} 
             onLimitReached={(isMax,msg) => console.log(isMax,msg)}
             totalWidth={Container_Width} 
             totalHeight={Container_Height} 
             iconSize={20}
             step={5}
             minValue={0}
             valueType='integer'
             rounded 
             textColor='black' 
             iconStyle={{ color: 'white' }} 
             rightButtonBackgroundColor='#ae93Bf' 
             leftButtonBackgroundColor='#ae939f'/>
           <View style={{width: Container_Width, height: Container_Height /*Border? background color?*/}}>
             <Text style={{color: 'gray', marginLeft: 4, fontSize: 10}}>Shots per game      (0 for infinite)</Text>
             </View>
     </Container>
      )
  }
  
  renderDatePicker = () => {
    const today = new Date();
    const date = this.state.gameDate
    const dateStr = date.toLocaleDateString();
    const show = this.state.showDatePicker;
    if (show){
      return (
        <Container style= {{ flex:5.3, backgroundColor: '#ffffff'}}>
          <View style={{ alignItems: 'center', justifyContent: 'center', }}>
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
  getTimeLimit = (currentTime) =>{
    var minLim = 0;
    curDate = new Date(currentTime);
    console.log("CurDate",curDate)
    var curHour = curDate.getHours();
    var curMin = curDate.getMinutes();
    console.log("Curmin",curHour,curMin);
    var minutesUntil = ((23 - curHour) * 60) + (59 - curMin);
    console.log("Munites until:",minutesUntil)
    milisUntil = minutesUntil * 60 *1000;
    minLim = currentTime + milisUntil
    var predictedEnd = new Date(minLim)
    console.log("Predicted End",predictedEnd);
    return minutesUntil;
  }
  renderGameLengthPicker = () => {
    const gameTime = this.state.gameDate.getTime();
    console.log("StateDate",this.state.gameDate,this.state.today);
    var gameLength = this.state.game_length * 60 * 1000;
    const potentialEnd = new Date(gameTime + gameLength);
    if (this.state.lengthLimit == null){
        console.log("Getting limit");
        const newLengthLimit = this.getTimeLimit(gameTime)
        console.log('got limit",',newLengthLimit);
        this.setState({lengthLimit: newLengthLimit});
    }
    console.log("Potential End",potentialEnd);
    return (
          <Container style = {{flex: 0.3, flexDirection: 'row', backgroundColor: '#EEEEEE', marginTop: 4}}>
          <View style={{width: Container_Width, height: Container_Height /*Border? background color?*/}}>
           <Text style={{ margin: 3, fontSize: Container_Height/1.6}}>Game Timer:</Text>
         </View>
           <NumericInput 
             value={this.state.game_length} 
             onChange={game_length => this.setState({game_length})} 
             onLimitReached={(isMax,msg) => console.log(isMax,msg)}
             totalWidth={Container_Width} 
             totalHeight={Container_Height} 
             iconSize={20}
             step={1}
             minValue={1}
             maxValue={this.state.lengthLimit}
             valueType='integer'
             rounded 
             textColor='black' 
             iconStyle={{ color: 'white' }} 
             rightButtonBackgroundColor='#ae93Bf' 
             leftButtonBackgroundColor='#ae939f'/>
           <View style={{width: Container_Width, height: Container_Height /*Border? background color?*/}}>
             <Text style={{color: 'gray', marginLeft: 4, fontSize: 10}}>Minutes ( Cannot play through midnight as of right now)</Text>
             </View>
     </Container>
      )
  }

  renderNameCodeInputs = () =>{
    
    return (
    <Container style = {{flex: 0.6, flexDirection: 'column', backgroundColor: '#EEEEEE', marginTop: 4}}>     
      <Input style={{ height: Container_Height}}
            value = {this.state.gameName}
            autoCompleteType = 'off'
            placeholder='Game Name'
            returnKeyType='done'
            leftIcon={{ type: 'font-awesome', name: 'user' }}
            errorMessage= {this.state.gameNameError}
            onChangeText={this.editGameName}
          />
          <Input
            style={{ height: Container_Height}}
            value = {this.state.gameCode}
            autoCompleteType = 'off'
            placeholder='Game Code (If private)'
            returnKeyType='done'
            leftIcon={{ type: 'entypo', name: 'key' }}
            errorMessage= {this.state.codeError}
            onChangeText={this.editGameCode}
          />
          </Container>
    )
  }

  render() {
      return (
        <ThemeProvider {...this.props}  theme={LaserTheme}>
          
          <CustomHeader {...this.props} headerText= "Host Game" headerType = "host" />
          
          {this.renderNameCodeInputs()}
          {this.renderGameModeButtons()}
          {/*No Setting dates for now from the appthis.renderDatePicker()*/}
          {this.renderTeamNumberPicker()}
          {this.renderTeamSelectionModeButtons()}
          {this.renderGameLengthPicker()}

          {this.renderLivesNumberPicker()}
          {this.renderCooldownNumberPicker()}
          {this.renderAmmoSelection()}
          <Button title= "Begin Hosting"/>
         
        </ThemeProvider>
      );
  }
}