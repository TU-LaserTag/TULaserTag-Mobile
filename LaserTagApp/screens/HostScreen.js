import React, { Component } from 'react';
import {NativeModules,View,Dimensions, NativeEventEmitter} from 'react-native';
import { ThemeProvider , Input, Icon, Text, Button, Slider, ListItem, ButtonGroup,Card} from 'react-native-elements';
import { LaserTheme } from '../components/Custom_theme';
import CustomHeader from '../components/CustomHeader'
import { Container } from 'native-base';
import { FlatList } from 'react-native-gesture-handler';
import {Web_Urls} from '../constants/webUrls';
import DateTimePicker from '@react-native-community/datetimepicker';
import NumericInput from 'react-native-numeric-input'
import BluetoothManager from '../components/Ble_manager'
import ModalDropdown from 'react-native-modal-dropdown';
import { toHsv } from 'react-native-color-picker';

const dimensions = Dimensions.get('window');
const Container_Width = Math.round(dimensions.width *1/3);
const Container_Height = Math.round(dimensions.height * 1/20);
const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);
export default class HostScreen extends Component {
  static navigationOptions = {
    title: 'Host Game', // Possibly have it dynamic to name
    gestureEnabled: false,
  };
  constructor(){
    super()
    this.state = {
      hostLoading: false,
      userData: null,
      scanning:false,
      key: '',
      appState: '',
      connectedGun: null,
      keyError: '',
      discoveredP: false,
      loading: true,
      gameList: [],
      joinGameError: false,
      teamLoadError: '',
      teamList: [],
      availibleTeams: [],

      gameModeIndex: 0,
      gameModeText: 'solo',
      selectionIndex:1,
      selectionText: 'manual',
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
      host: '',
      gunData: null,
      gameData: null,
      teamData: null,
     
    }
    //console.log("construct");
    //this.checkBLE(); Should get ran in GunStatusDisplay
    //this.loadStorage()  // Checks storage and then builds upon startBLEManager
    
    
    this.updateIndex = this.updateIndex.bind(this)
  }
  componentDidMount(){
    //console.log("Host Screen Mount")
    const userData = this.props.navigation.getParam("userData", null);
    const gunData = this.props.navigation.getParam("gunData", null);
    const host = userData.username;
    this.setState({host, userData,gunData})
    this.requestAllTeams();
    this.populateTemplateTeams();
    
  } 

  componentWillUnmount() { // cancel all async tasks herere?
    console.log("Unmounting host")
  }

  createGame = () =>{
    this.setState({hostLoading: true});
    // Set 0s to -1 for infinite here
    let ammo = this.state.ammo;
    let lives = this.state.num_lives;
    let gamemode = this.state.gameModeText; // I should not have to validate this but here we are...
    let selectionText = this.state.selectionText;
    let numTeams = this.state.num_teams;
    if (gamemode == 'solo'){
      selectionText = 'manual';
      numTeams = 0;
    }

    if (ammo == 0){
      ammo = -1
    }
    if (lives == 0){
      lives = -1 // Ask about this
    }
    // Do empty String validation errors here
    const date = this.state.gameDate;
    var dd = date.getDate();
    var mm = date.getMonth()+1; 
    var yyyy = date.getFullYear();
    if(dd<10){
        dd='0'+dd;
    } 
    if(mm<10){
        mm='0'+mm;
    } 
    today = mm+'-'+dd+'-'+yyyy;
     
    const GamePayload = {
      maxammo: ammo,
      style: this.state.gameModeText,
      timedisabled: this.state.timeDisabled,
      maxLives: lives,
      pause: false,
      date: today,
      code: this.state.gameCode,
      num_teams: numTeams,
      team_selection: selectionText,
      name: this.state.gameName,
      host: this.state.host,
    }

    console.log("Gamepayload",GamePayload)
    this.sendCreateGameRequest(GamePayload);
    //this.handleCreateGameResponse("noope");
  }
  requestAllTeams() { // Request all Teams
    this.setState({loading: true,
                    all_teams: [],
                    teamLoading: true,
    })
    var getURL = Web_Urls.Host_Url + "/team"
    console.log("Sending request to ",getURL)
    var request = new XMLHttpRequest();
      request.onreadystatechange = (e) => {
        if (request.readyState !== 4) {
          return;
        }
        if (request.status === 200) {
          responseList = JSON.parse(request.response);
          //console.log
          this.handleTeamListResponse(responseList);
        } else {
        
          this.setState({teamLoadError: "Could not load teams,",
                       loading: false}); 
          // FOR USE OFFLINE    
          //responseList =[{"id":8,"name":"Horace Greely","color":"#12543F","league_id":null},{"id":13,"name":"Coherent Light","color":"#3E47AE","league_id":null},{"id":18,"name":"Copycats","color":"#109876","league_id":null},{"id":20,"name":"","color":"#09ff11","league_id":null},{"id":21,"name":"","color":"#0bf5ee","league_id":null},{"id":22,"name":"","color":"#497c21","league_id":null},{"id":23,"name":"","color":"#f1f40b","league_id":null},{"id":24,"name":"","color":"#f10b0b","league_id":null},{"id":19,"name":"Hogan's Heroes","color":"#fa7c18","league_id":null}]
          //this.handleTeamListResponse(responseList);
        }
      }
      request.open('GET', getURL);
      request.send();
  }

  sendCreateGameRequest(payload) {
    var getURL = Web_Urls.Host_Url + "/create/game"  
    var request = new XMLHttpRequest();
      request.onreadystatechange = (e) => {
        if (request.readyState !== 4) {
          return;
        }
        if (request.status === 200) {
          gameResponse = JSON.parse(request.response);
          this.handleCreateGameResponse(gameResponse);
        } else {
          console.log("Got Error",request);
          this.setState({hostLoading: false});
          alert("Something went wrong while creating your game");
          //this.setState({joinGameError: "Could not connect to server, Please try again later",
          //              loading: false});     
        }
      }
      console.log("SCreating Game at",getURL); 
      request.open('POST',getURL);
      request.setRequestHeader("Content-type","application/json");
      request.send(JSON.stringify(payload)); // Strigify?
  }
  
  requestCreateTeams(gameData){ 
    gameID = gameData.id;
    payload = this.state.teamList; // TEams sent
    console.log
    var getURL = Web_Urls.Host_Url + "/createbatch/team/"+gameID;  
    var request = new XMLHttpRequest();
      request.onreadystatechange = (e) => {
        if (request.readyState !== 4) {
          return;
        }
        if (request.status === 200) {
          teamResponse = JSON.parse(request.response);
          console.log("GOT BatchTeam",teamResponse)
          this.handleCreateTeamsResponse(teamResponse,gameData);
        } else {
          console.log("Got Error",request);
          alert("Something went wrong while Connecting teams to the game"),
          this.setState({hostLoading: false});
          //this.setState({joinGameError: "Could not connect to server, Please try again later",
          //              loading: false});     
        }
      }
      
      request.open('POST',getURL);
      request.setRequestHeader("Content-type","application/json");
      console.log("Sending",payload)
      request.send(JSON.stringify(payload)); // Strigify?
  }

  // Once game is created, Join it as host
  requestJoinGame(game){
    gunMAC = this.state.gunData.advertising.serviceUUIDs[0].slice(-12);
    console.log(gunMAC)
    console.log(this.state.userData);
    const username = this.state.userData.username;
    this.setState({loadingGame: true})
    var getURL = Web_Urls.Host_Url +"/game/"+game.id+"/"+username+"/"+ gunMAC
    console.log("Sending request to ",getURL)
    var request = new XMLHttpRequest();
      request.onreadystatechange = (e) => {
        if (request.readyState !== 4) {
          return;
        }
        if (request.status === 200) {
          response = JSON.parse(request.response);
          console.log("Joining Game?",response)
          this.props.navigation.navigate("Lobby",{
            userData: this.state.userData,
            gameData: response, // or this.state.gameData // This may return different data than expected on lobby
            teamData: this.state.teamData,
            gunData: this.state.gunData,
            gameLength: this.state.game_length,
            });
        } else {
          console.log("Error",request)
          alert("Something went wrong while trying to connect to created game"),
          this.setState({hostLoading: false});   
        }
      }
      request.open('GET', getURL);
      request.send();
    }

  handleCreateGameResponse = (gameResponse) =>{
    console.log("Got Game Cfreations REsponse",gameResponse);
    if (gameResponse.style == 'solo'){
      console.log("Straight up Join in");
      this.requestJoinGame(gameResponse);
    }else{ // Add more clauses depending on game mode
      this.requestCreateTeams(gameResponse); // Just passes it through to prevent state Setting -- REplace with gameResponse
    }
  }

  handleCreateTeamsResponse = (teamData,gameData) => {
    //console.log(" Got Team response",teamResponse);
    // Validate more?
    this.setState({teamData});
    if (this.state.gunData == null){
      console.log("No gun data, connect to gun");

    }else if (this.state.userData == null){
      console.log("No UserData Please login");
      // Attempt force refresh>??
    } else if(gameData == null) {
      console.warn("ALRIGHT WHAT THE HECK ARE YA Doin");
    } else{
      this.requestJoinGame(gameData);
    }
  }
  handleTeamListResponse = (teamResponse) =>{
    //console.log("Handling Respons",teamResponse);
    // Do any other validating/filtering here  ** Possibly dont show ones that are not in a league
    
    this.setState({all_teams: teamResponse});
    this.populateAvailibleTeams();
  }

  updateIndex = (gameModeIndex) => {
    let gameModeText = 'solo';
    if (gameModeIndex == 1){
      gameModeText = 'team';
    }
    this.setState({gameModeIndex,
                    gameModeText});
  }

  updateSelectionIndex = (selectionIndex) =>{
    let selectionText = 'manual'
    if (selectionIndex == 1){
      selectionText = 'automatic';
    }
    this.setState({selectionIndex,
                    selectionText});
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

  renderNameCodeInputs = () =>{
    
    return (
    <Container style = {{flex: 0.5, flexDirection: 'column', backgroundColor: '#EEEEEE', marginTop: 2}}>     
      <Input inputStyle={{ height: Container_Height/1.5}}
            value = {this.state.gameName}
            autoCompleteType = 'off'
            placeholder='Game Name'
            returnKeyType='done'
            leftIcon={{ type: 'font-awesome', name: 'user' }}
            errorMessage= {this.state.gameNameError}
            onChangeText={this.editGameName}
          />
          <Input
            inputStyle={{ height: Container_Height/2}}
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
      <Container style = {{flex: 0.3, backgroundColor: '#EEEEEE', marginTop: 4}}>
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
    const gameIcon = (selectionIndex == 0) ? 'pencil' : 'gears';
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
          onPress={this.updateSelectionIndex}
          selectedIndex={selectionIndex}
          buttons={buttons}
          containerStyle={{height: 25}} />
     </Container>
    )
  }
  populateAvailibleTeams = () => { // Use (FINISH) this if we want dropdown list to shrink with selection
    //console.log("Populatinga vailible teams");
    const all_teams = this.state.all_teams;
    //console.log(all_teams)
    all_teams.push({color: "", name:"New Team", color_name: '', team_id:null});
    let availibleTeams = all_teams.map( (team) =>{
      if (team.name != ""){
        return team.name;
      } else{
        return "Team " + team.id
      }
    });
    this.setState({availibleTeams})
    //console.log("Set teams",this.state.availibleTeams)
  }
  updateAvailibleTeams = () =>{
    // So far just iterates over teamList, reMaps availibleList 
  
  }
  populateTemplateTeams = () => {
    const teamList = this.state.teamList;
    for (i = 1; i <=this.state.num_teams; i ++){
      teamList.push({color: "", name:"New Team "+i, color_name: '', team_id:null});
    }
      this.setState({teamList});
  }
  updateNumTeams = num_teams =>{
    const teamList = this.state.teamList;
    const listlen = teamList.length;
    if (listlen < num_teams){
      for (i = listlen; i <num_teams; i ++){
        let index = i+1;
        teamList.push({color: "", name:"New Team "+index, color_name: '', team_id:null});
      }
    } else if (listlen > num_teams){
      for (i = 0; i < listlen - num_teams; i ++){
        teamList.pop();
      }
    }
    this.setState({teamList,num_teams});
  }
  TeamTempExtractor = (item, index) =>index.toString()
  
  isAlreadySelected = (teamName) =>{
    const teamList = this.state.teamList;
    const found = teamList.some(team => team.name === teamName); // Search by team_id if needed? (null?)
    return found;
  }

  selectTeam = (teamIndex,itemIndex) =>{ // Will need to be aware of filtered lists>? filter directly before/after fetch/state assignment to prevent errors
    const all_teams = this.state.all_teams;
    const teamList = this.state.teamList;
    const availibleTeams = this.state.availibleTeams;
    selectedTeam = all_teams[teamIndex];
    if (this.isAlreadySelected(selectedTeam.name)){
      console.log("No");
      // Put Toast?
      return false;
    }
    newTeaminfo = {name: selectedTeam.name, color:selectedTeam.color, team_id: selectedTeam.team_id, color_name: selectedTeam.color_name}
    // Setting eeach one individually since bulk seting does not seem to work
    teamList[itemIndex].name = newTeaminfo.name;
    teamList[itemIndex].color = newTeaminfo.color;
    teamList[itemIndex].team_id = newTeaminfo.team_id;
    teamList[itemIndex].color_name = newTeaminfo.color_name;
    teamList[itemIndex] = newTeaminfo;
    this.setState({teamList: teamList});
    console.log("TeamList",teamList)
  }

  renderTeamPicker = (index,item) => {
    const all_teams = this.state.all_teams;
    let availibleTeams = this.state.availibleTeams;
    // Clean up undefined teams??
    // For loop that removes items with name of :"" or undefined
    return (
      <ModalDropdown 
      defaultValue = "Select Team"
      style={{
        backgroundColor: '#209cee',
        alignSelf: 'flex-end',
        justifyContent: 'center',
        padding: 2,
        borderWidth: 1,
        borderRadius: 5,
        height: 30,
        borderColor: "#EEEEEE"
      }}
      textStyle=
      {{
        color: 'white',
        fontSize: 10,
      }}
      onSelect = { selectedIndex => this.selectTeam(selectedIndex,index)}
      options={availibleTeams}/> 
    )
  }

  renderTeamItem = (teamTemp) => {
    const index = teamTemp.index;
    const item = teamTemp.item;
    const selectedTeam = this.state.teamList[index];
    /* IF WE WANT TO ALLOW THEM TO EDIT New TeamNames priliminarily, use these*
    return(
      <View>
      <Input style={{ height: 15}}
            value = {this.state.teamList[index].name}
            autoCompleteType = 'off'
            placeholder='Team Name'
            returnKeyType='done'                     
            onChangeText={teamNameInput => {
              const teamList = this.state.teamList;
              teamList[index].name = teamNameInput;
              this.setState({teamList: teamList})}} 
          />
      </View>
    )*/
    let teamColor = "gray";
    let isNewText = 'New Team'
    if (selectedTeam.color != ""){
      teamColor = selectedTeam.color;
      isNewText = "Selected Team"
    }
    
    //console.log("Rendering TEamStu",index,"-----",item);
    return( <View>
        <ListItem
          style = {{color: teamColor /**Would be nice to have preliminary generated colors for new teams to show them here */}}
          key = {item.name}
          title={item.name}
          titleStyle = {{fontSize: 12, color: teamColor}}
          containerStyle = {{
            backgroundColor: "#FFFFFF"
          }}
          subtitle={isNewText}
          subtitleStyle = {{
            fontSize: 10,
            color: 'gray',
            
          }}
          rightSubtitle = {this.renderTeamPicker(index,item)}
          leftIcon={{ name: 'users', type: 'feather', color: teamColor} /*Could be Avatar as well? or team/League indicator */}
          bottomDivider
        />
    </View>
    )
  }

  renderTeamTemplate = (num_teams) =>{
    const prereqText = ((this.state.gameModeIndex == 0 ) ? "Players":"Teams" );
    const teamList = this.state.teamList; // TODO: CHECK Effifciency for starting from scratch or pulling from state
    if (prereqText == "Players"){
      return(
        <View></View>
      )
    }
    
    if (num_teams == 0){
      console.log("Should not be possible");
      return (<Text>You should never see this... hacker</Text>);
    } else{
    }
    //this.setState({teamList});
    return(
      <View style ={{ flex:0.4 }}>
    <FlatList
            listKey = "team"
            keyExtractor={this.TeamTempExtractor}
            data={teamList}
            renderItem={this.renderTeamItem}
            extraData={this.state}
          />
    </View>
    )

    }
  

  renderTeamNumberPicker = () => {
    const prereqText = ((this.state.gameModeIndex == 0 ) ? "Players":"Teams" );
    if (prereqText == "Players"){
      return(
        <View></View>
      )
    }
    const teamList = [];
    
    return(
      <Container style = {{flex: 0.3, flexDirection: 'row', backgroundColor: '#EEEEEE', marginTop: 4}}>
           <View style={{justifyContent: 'center', width: Container_Width, height: Container_Height /*Border? background color?*/}}>
              <Text style={{ alignSelf: 'center', margin: 3, fontSize:22}}>{prereqText}: </Text>
            </View>
            <NumericInput 
              value={this.state.num_teams} 
              onChange={this.updateNumTeams}
              onLimitReached={(isMax,msg) => console.log(isMax,msg)}
              totalWidth={Container_Width} 
              totalHeight={Container_Height} 
              iconSize={20}
              minValue={2}
              maxValue={8}
              step={1}
              valueType='integer'
              rounded 
              textColor='#4a4a4a' 
              iconStyle={{ color: 'white' }} 
              rightButtonBackgroundColor='#ae93Bf' 
              leftButtonBackgroundColor='#ae939f'/>
              <View style={{width: Container_Width, height: Container_Height /*Border? background color?*/}}>
              <Text style={{color: 'gray', marginLeft: 4, fontSize: 10}}>Number of Teams</Text>
              </View>
             
      </Container>
    )
  }
  renderLivesNumberPicker = () => {
    //const liveText = ((this.state.gameModeIndex == 0 ) ? "Number of lives":"Number of lives" );
    const liveText = "Lives :";
    return(
      <Container style = {{flex: 0.3, flexDirection: 'row', backgroundColor: '#EEEEEE', marginTop: 4}}>
           <View style={{justifyContent: 'center', width: Container_Width, height: Container_Height /*Border? background color?*/}}>
            <Text style={{ alignSelf: 'center', margin: 3, fontSize:22}}>{liveText} </Text>
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
              <Text style={{color: 'gray', marginLeft: 4, fontSize: 11}}>Lives per game{"\n"}(0 for infinite)</Text>
            </View>
      </Container>
    )
  }
  renderCooldownNumberPicker = () => {
    const liveText = "Cooldown:";
    return(
      <Container style = {{flex: 0.3, flexDirection: 'row', backgroundColor: '#EEEEEE', marginTop: 4}}>
           <View style={{justifyContent: 'center', width: Container_Width, height: Container_Height /*Border? background color?*/}}>
            <Text style={{ alignSelf: 'center', margin: 3, fontSize:22}}>{liveText} </Text>
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
          <View style={{justifyContent: 'center', width: Container_Width, height: Container_Height /*Border? background color?*/}}>
           <Text style={{justifyContent: 'center', alignSelf: 'center', margin: 3, fontSize:22}} >Ammo:</Text>
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
             textColor='#4a4a4a' 
             iconStyle={{ color: 'white' }} 
             rightButtonBackgroundColor='#ae93Bf' 
             leftButtonBackgroundColor='#ae939f'/>
           <View style={{width: Container_Width, height: Container_Height /*Border? background color?*/}}>
    <Text style={{color: 'gray', marginLeft: 4, fontSize: 10}}>Shots per game{"\n"}(0 for infinite)</Text>
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
          <View style={{ alignItems: 'center', justifyContent: 'center'}}>
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
  getTimeLimit = (currentTime) =>{ // TODO: ASK ABOUT TIME ZONE!!!
    var minLim = 0;
    curDate = new Date(currentTime);
    var curHour = curDate.getHours();
    var curMin = curDate.getMinutes();
    var minutesUntil = ((23 - curHour) * 60) + (59 - curMin);
    milisUntil = minutesUntil * 60 *1000;
    minLim = currentTime + milisUntil
    var predictedEnd = new Date(minLim)
    return minutesUntil;
  }

  renderGameLengthPicker = () => {
    const gameTime = this.state.gameDate.getTime();
    var gameLength = this.state.game_length * 60 * 1000;
    const potentialEnd = new Date(gameTime + gameLength);
    var newLengthLimit = '';
    if (this.state.lengthLimit == null){
      newLengthLimit = this.getTimeLimit(gameTime)
    }
    return (
          <Container style = {{flex: 0.3, flexDirection: 'row', backgroundColor: '#EEEEEE', marginTop: 4}}>
          <View style={{justifyContent: 'center', width: Container_Width, height: Container_Height /*Border? background color?*/}}>
           <Text style={{ alignSelf: 'center', margin: 3, fontSize:24}}>Timer:</Text>
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
             maxValue={newLengthLimit}
             valueType='integer'
             rounded 
             textColor='#4a4a4a' 
             iconStyle={{ color: 'white' }} 
             rightButtonBackgroundColor='#ae93Bf' 
             leftButtonBackgroundColor='#ae939f'/>
           <View style={{width: Container_Width, height: Container_Height /*Border? background color?*/}}>
    <Text style={{color: 'gray', marginLeft: 4, fontSize: 10}}>Minutes{"\n"}Limited to 11:59 PM</Text>
             </View>
     </Container>
      )
  }

  

  render() {
      return (
        <ThemeProvider {...this.props}  theme={LaserTheme}>
          
          <CustomHeader {...this.props} headerText= "Host Game" headerType = "host" />
          <BluetoothManager {...this.props} screen= "Host"></BluetoothManager>
          
          {this.renderNameCodeInputs()}
          {this.renderGameModeButtons()}
          <View style={{flex: 2}}>
          {/*No Setting dates for now from the appthis.renderDatePicker()*/}
          {this.renderTeamNumberPicker()}
          {this.renderTeamTemplate(this.state.num_teams)}
          {this.renderTeamSelectionModeButtons()}
          {this.renderGameLengthPicker()}

          {this.renderLivesNumberPicker()}
          {this.renderCooldownNumberPicker()}
          {this.renderAmmoSelection()}
          <Button loading = {this.state.hostLoading} style={{marginBottom: 15}}title= "Begin Hosting" onPress={() => this.createGame()}/>
          </View>
         
        </ThemeProvider>
      );
  }
}