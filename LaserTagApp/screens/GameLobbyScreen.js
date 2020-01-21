import React, { Component } from 'react';
import {StyleSheet,View,NativeEventEmitter,AppState,NativeModules, ActivityIndicator, FlatList, Dimensions} from 'react-native';
import { Text,Button, Icon, ThemeProvider, Input, Divider, ListItem,Card,Overlay} from 'react-native-elements';
import { LaserTheme } from '../components/Custom_theme';
import CustomHeader from '../components/CustomHeader';
import GunStatusDisplay from '../components/GunStatusDisplay'
import { stringToBytes, bytesToString } from 'convert-string';
import BleManager, { connect } from 'react-native-ble-manager';
import {Web_Urls} from '../constants/webUrls';
import { Item,Toast, Picker } from 'native-base';
import { ScrollView, TouchableHighlight } from 'react-native-gesture-handler';
import ModalDropdown from 'react-native-modal-dropdown';
import { ColorPicker, TriangleColorPicker, fromHsv } from 'react-native-color-picker'
import BluetoothManager from '../components/Ble_manager';
import { NavigationEvents } from 'react-navigation';
 
const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);
//import Title from '../components/Ghs_Comps/Title'


export default class GameLobbyScreen extends Component {
  static navigationOptions = {
    title: 'Game lobby', // Where all players will hang out before game starts
  };
  /**
   * Data to Load:
   * players: /players/{gameID} -- All players assigned to game
   * teams: /teams/{gameID} -- Teams and playerUsername list within team
   * All TEams: /team -- All teams 
   * userData: (Internal) -- Username
   * gameData: /game/{gameID}/{username}/{gunID} -- Game data, user data
   */
  constructor(){
    super()
    this.state = {
      nextAppState:null,
      scanning:false,
      gameError: '',
      key: '',
      appState: '',
      connectedGun: null,
      keyError: '',
      discoveredP: false,
      loading: true,     
      needColor: false,
      editMyColor:false,
      gameData: {},
      teamData: [],
      userData: {},
      gunData: {},
      detailedTeamData: [],
      playerList: [],
      isHost: false,
      editTeam: null,
      teamNameInput: null,
      temColorInput: null,
      createTeam: false,
      availibleTeams: [],
      setColor: 'gray',
      curColor: 'green',
      hue: 0,
      sat: 0,
      val: 1,
    }
    console.log("construct");
    //this.loadStorage()  // CCan load storage but really not nexessary for now
   
    this.onColorChange = this.onColorChange.bind(this);
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
  .then(userData => {
  this.setState({userData})
  if (this.state.userData.username == this.state.gameData.game.host){
    this.setState({isHost: true});
  }
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
    // Host functions
  editGamekey = key => {
    this.setState({ key });
  };

  getGunData = (gunData) =>{
    //console.log("Recieved GunData",gunData);
    this.setState({gunData});
  } 

  componentDidMount(){
    const userData = this.props.navigation.getParam("userData", null);
    const gameData = this.props.navigation.getParam("gameData", null);
    const teamData = this.props.navigation.getParam("teamData",null);
    const gunData = this.props.navigation.getParam("gunData",null);
    
    this.setState({userData,gameData,teamData});
    //const 
    //const dummyGameData = {"id":10,"starttime":null,"endtime":null,"maxammo":-1,"style":"team","timedisabled":30,"maxLives":5,"pause":false,"winners":null,"date":"01-16-2020","code":"","num_teams":2,"players_alive":null,"team_selection":"manual","teams_alive":null,"locked":false,"name":"Rock the house","host":"Canthony"}
    //const dummyTeamData = [{"id":8,"name":"New Team 21","color":"#12543F","league_id":null,"players":[/*{"id":3,"username":"Thirty Thousand Leagues","password":"12345"},{"id":6,"username":"Green Machine","password":"RedIsDead"}*/]},{"id":13,"name":"Coherent Light","color":"#3E47AE","league_id":null,"players":[/*{"id":4,"username":"Nurkbook","password":"Ecuador"},{"id":5,"username":"Dr. You","password":"Me&You"}*/]}]
    //const dummyPlayerData = [{"id":3,"username":"Thirty Thousand Leagues","password":"12345"},{"id":6,"username":"Green Machine","password":"RedIsDead"},{"id":4,"username":"Nurkbook","password":"Ecuador"},{"id":5,"username":"Dr. You","password":"Me&You"}]
    
    if (userData == null){
      console.log("No user Data");
      this.loadStorage();
    } else{
      if (userData.username == gameData.game.host){
        this.setState({isHost: true});
      }
    }
    if (gameData == null){
      console.log("Error No Game Data");
      // Fetch game data? 
    }else{
      //console.log("Laoded game data",gameData)
      if (gameData.game.style == "solo"){
        const playerList = gameData.game.individuals
        this.setState({playerList});
        //console.log("SET A LIST",playerList)
        if (gameData.needColor || gameData.game.individuals.length ===0){
          console.log("Need a color");
          this.setState({needColor: true})
        } else{
          console.log("Find playerlist",playerList)
          var isInlist = playerList.find(player => {
            return player.player_username === userData.username;
          })
          if (isInlist != undefined){
            console.log("Youre in!",isInlist);
            const player = isInlist;
            this.setState({needColor: false, editMyColor: false,curColor:player.color,setColor: player.color});
          } else{
            this.setState({needColor: true});
          }
        }
      } else{
        console.log("Team data load?")
        if (teamData == null && gameData.game.style == "team"){
          console.log("No teamData");
          this.requestTeamData(gameData.game.id)
        } else{
          console.log("either solo or have teamData",teamData)
        }
      }
      //this.refreshAllData(gameData.game.id,userData.username);
    }

    
      
    //this.setState({gameData: dummyGameData,teamData: dummyTeamData,playerList: dummyPlayerData}); // FIX THIS LATEWR
    this.refreshLoop = setInterval(()=> { // Dont forget to destroy (clearintercal)
      //onsole.log("Callin gcheckup");
      if (this.state.needColor || this.state.editMyColor){

      } else{
        this.refreshAllData();
      }
    
    }, 10000);
    //console.log("Loading data",gameData,userData,teamData);
    //this.requestGameData(gameData.id); // Maybe move to constructor?
    if (gunData == null){
      console.log("GunData null")
    } else{
      console.log("Error Reading gunData");
      // Get Gun data or force checkGunConnection
    }
  } 


  refreshAllData(){
    const gameID = this.state.gameData.game.id;
    const username = this.state.userData.username;
    this.requestGameData(gameID,username)
    //this.requestTeamData(gameID)
    //this.requestPlayerData(gameID)
  }


  componentWillUnmount() { // cancel all async tasks herere? Appstate change?
      console.log("Unmounting lobbyy screen");
      clearInterval(this.refreshLoop); // Possibly add to blur as well
  }
  
  gameLobbyHandleAppStateChange(nextAppState) {
    if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
      console.log('gameLobby Screen has come to the foreground!')
    }
    this.setState({appState: nextAppState});
  }


  requestTeamData(game_id){
    console.log("Requesting teams")
    this.setState({loading: true,
    })
    var getURL = Web_Urls.Host_Url + "/teams/"+game_id
    console.log("Sending request to ",getURL)
    var request = new XMLHttpRequest();
    request.onreadystatechange = (e) => {
      if (request.readyState !== 4) {
        return;
      }
      if (request.status === 200) {
        teamList = JSON.parse(request.response);
        this.setState({teamData: teamList, loading: false})
      } else {
        console.log("Trouble fetching team data") // Needs more error handling
        this.setState({loading: false});     
      }
    }
    request.open('GET', getURL);
    request.send();
  }


  requestGameData(game_id,username) { // Rewquest specific game data
    this.setState({loading: true,                
    })
    var getURL = Web_Urls.Host_Url + "/checkup/"+username+"/"+game_id // For somereason not returning evertyih
    console.log("Sending request to ",getURL)
    var request = new XMLHttpRequest();
      request.onreadystatechange = (e) => {
        if (request.readyState !== 4) {
          return;
        }
        if (request.status === 200) {
          gameData = JSON.parse(request.response);
          //console.log("Got GAME======== Data",gameData); // Gets strange on team games
          if (gameData.game.style == 'solo'){
            const individuals = gameData.game.individuals;
            var isInlist = individuals.find(player => {
              return player.player_username === this.state.userData.username;
            })
            if (isInlist!= undefined){
              //console.log("Youre in!",isInlist);
              const player = isInlist;
              this.setState({needColor: false,editMyColor: false,curColor:player.color,setColor:player.color});
            } else{
              //console.log("Youre not in");
              this.setState({needColor: true});
            }  
            this.setState({loading: false, gameData: gameData, playerList: individuals});
          } else{
            console.log("Set up teams here")
          }
          this.setState({loading: false, gameData: gameData});
          
          
        } else {
          console.log("Erroe when Sdearching for game data",request)
          this.setState({gameError: "Could not connect to server, Please try again later",
                        loading: false});     
        }
      }
      request.open('GET', getURL);
      request.send();
  }

  requestPlayerData(game_id) { // Rewquest specific game data
    this.setState({loading: true,                
    })
    var getURL = Web_Urls.Host_Url + "/players/"+game_id
    console.log("Sending request to ",getURL)
    var request = new XMLHttpRequest();
      request.onreadystatechange = (e) => {
        if (request.readyState !== 4) {
          return;
        }
        if (request.status === 200) {
          playerList = JSON.parse(request.response);
          console.log("playerData",playerList);
          this.setState({loading: false, playerList: playerList})
        } else {
          console.log("Erroe when Sdearching for player liust",request)
          this.setState({gameError: "Could not connect to server, Please try again later",
                        loading: false});     
        }
      }
      request.open('GET', getURL);
      request.send();
  }

  requestAssignColor(color){
    const gameID = this.state.gameData.game.id
    const username = this.state.userData.username;    
    //console.log("Assigning color",gameID,username,color,this.state.curColor)
    if (this.state.curColor == color){
      //console.log("ASame color: returnrting")
      this.setState({editMyColor: false});
      return;
    }
    this.setState({loading:true,curColor: color});
    var getURL = Web_Urls.Host_Url + "/color/"+username+"/"+gameID;
    const payload = {
      color: color
    }
    console.log("Sending request to ",getURL,payload);
    var request = new XMLHttpRequest();
    request.onreadystatechange = (e) => {
      if (request.readyState !== 4) {
        return;
      }
      if (request.status === 200) {
        assignmentResponse = JSON.parse(request.response);
        //console.log("OCLORREDP",assignmentResponse);
        if (assignmentResponse.ok){
          //console.log("Setting Player color",assignmentResponse);
          this.refreshAllData(); // Not sure if this should be called just yet
        } else{
          console.log("Something went wrong",assignmentResponse);
          alert(assignmentResponse.message);
        }
        // update TeamData to contain that state
        this.setState({loading: false});
      } else {
        console.log("Color setting error",request)
        this.setState({loading: false});     
      }
    }
    request.open('POST', getURL);
    request.setRequestHeader("Content-type","application/json");
    request.send(JSON.stringify(payload));
  }

  requestAssignPlayer(team,player){ // Can be array of players
    this.setState({loading: true }); // Different loading types??
    const payload = [{team_id: team.id, player_username: player.username}];
    const getURL = Web_Urls.Host_Url + "/createbatch/assignment"
    console.log("Sending request to ",getURL)
    var request = new XMLHttpRequest();
    request.onreadystatechange = (e) => {
      if (request.readyState !== 4) {
        return;
      }
      if (request.status === 200) {
        assignmentResponse = JSON.parse(request.response);
        //console.log("Success assigning player to team",assignmentResponse)
        // update TeamData to contain that state
        this.setState({loading: false})
      } else {
        console.log("assignment Errorr",request)
        this.setState({loading: false});     
      }
    }
    request.open('POST', getURL);
    request.setRequestHeader("Content-type","application/json");
    request.send(JSON.stringify(payload));
 }
  
 requestPatchTeam(team,newName) {
  this.setState({loading: true });
  const teamId = team.id;
  const payload = {name: newName, color: team.color};
  const getURL = Web_Urls.Host_Url + "/change/team/"+teamId;
  console.log("Sending request to ",getURL)
  var request = new XMLHttpRequest();
  request.onreadystatechange = (e) => {
    if (request.readyState !== 4) {
      return;
    }
    if (request.status === 200) {
      updatedTeam = JSON.parse(request.response);
      console.log("Success for editing team",updatedTeam)
      // update TeamData to contain that state
      this.setState({loading: false})
    } else {
    console.log("Team change error",request)
    this.setState({loading: false});     
    }
  }
  request.open('PATCH', getURL);
  request.send(JSON.stringify(payload));
 }

  editTeam = (team) =>{
    //console.log("Editing team",team);
    if (this.state.editTeam != null){
      //console.log("Toggling edit",team.name,this.state.editTeam.name);
      if (this.state.editTeam.name == team.name){
        console.log("Sending request to edit team",team.name,this.state.teamNameInput);
        this.requestPatchTeam(team,this.state.teamNameInput);
        this.setState({editTeam:null});
      } else{
        //console.log("Editing a different team");
        this.setState({editTeam:team});
      }
    } else{
      console.log("Opening up edit Team");
      this.setState({editTeam:team});
    }
    
  }


  onColorChange(setColor) {
    //console.log("Setting color",fromHsv(setColor));
    // Send Message to Gun to change RGB
    this.setState({ setColor })
  }

  refresh = (mode) => {
   this.refreshAllData();// And mor
  }

  isEmptyObject = (obj) => {
    return (Object.entries(obj).length === 0 && obj.constructor === Object)
  }
    
  keyExtractor = (item, index) => { // Remove??
  }
      
  renderGameError = () => { // Remove??
    if (this.state.gameError != ''){
      return (
      <Text style = {{backgroundColor: 'red', textAlign: 'center', color: 'white'}}>{this.state.gameError}</Text>
      )
    }else{
      return 
    }
  }

  renderColorPicker = () =>{
    let editColor = false;
    if (this.state.needColor || this.state.editMyColor){ // Todo, change from not to todo
      console.log("Showing up Color Picker",this.state.needColor,this.state.editMyColor);
      editColor = true
    }else{
      editColor = false
    }
    
    return (
      <Overlay isVisible = {editColor}>
      <View style={{flex: 5, padding: 45, backgroundColor: '#212021'}}>
              <Text style={{color: 'white'}}>Pick Your Color!</Text>
              <TriangleColorPicker
                oldColor={this.state.curColor}
                color={this.state.setColor}
                onColorChange={this.onColorChange}
                onColorSelected={color => this.requestAssignColor(color)}
                onOldColorSelected={color => this.requestAssignColor(color)}
                style={{flex: 1}}
              />
            </View>
    </Overlay>
    )
  } 
  
  
  getTeamFromUsername = (username) =>{
    teamList = this.state.teamData;
    myTeam = 'none';
    //return "none" // TODO: REMOVE THISSS------------------------------------------------------=-=-=-=-=-=-
    if (teamList == null || teamList == undefined || teamList.length == 0){
      console.log("No Teams")
      return {name: "None", color: "#EEEEEE"}
    } else{
      if (teamList.length == 0){ // No teams have been created/assigned to game yet
        console.log("No Teams");
        return {name: "None", color: "#EEEEEE"}
      } else{
        for (var i = 0; i < teamList.length; i++){
          let team = teamList[i];
          let playerList = team.players;
          for (var j = 0; j < playerList.length; j ++){
            let mplayer = playerList[j];
            pusername = mplayer.username;
            if (pusername == username) {
              myTeam = team;
              break;
            }
          }
        }
      }
    }
    return myTeam;
  }
// Team Picking and Adssignment!!!




unassignTeam = (team,player) =>{
  console.log("Removing team assignment");

  //this.requestUnassignPlayer() /DELETE /player/team/username/team_id
}

assignTeam = (teamIndex,player) =>{ // Assign a player to a team, send request, then refresh list?
  const teamList = this.state.teamData
  selectedTeam = teamList[teamIndex];
  //console.log("Assigntin",player,selectedTeam.name);
  if (false){ // Extra validation here?
    console.log("No");
    // Put Toast?
    return false;
  }
  // Append player to team
  selectedTeam.players.push(player);
  teamList[teamIndex] = selectedTeam;
  this.setState({teamData: teamList});
  console.log("Updated Team",teamList,"---",selectedTeam);
  this.requestAssignPlayer(selectedTeam,player);
  // Refreash at end of rewquest // Or have Button at end that to click assign
}

  renderTeamPicker = (playerTeam,player) => {
    const gameData = this.state.gameData.game;
    let teamItems = [];
    if (playerTeam == ''){
      //console.log("Solo game?");
    }else{
        teamItems = this.state.teamData.map( (team, index) =>{
        return team.name
      });
    }
    // Use populated availible teams instyed??
    //console.log("Picker for player",player,this.state.userData.username);
    if (this.state.isHost){
      if (playerTeam == "none"){ // Then check if needs team and if teamPicking is manual
        if (gameData.team_selection == 'manual') {
          // Also check if needsName or something is true
          //console.log("Displaying team picker");
          /*return(
            <View>
            <Picker
                selectedValue={0}
                onValueChange={ (teamSelect) => {console.log("TReamSelct",teamSelect);} } >
                {teamItems}
            </Picker>
            </View>
          )*/
          return (
            <ModalDropdown 
            defaultValue = "Assign"
            onSelect = { selectedTeamIndex => this.assignTeam(selectedTeamIndex,player)}
            options={teamItems}/> 
          )
        }
      } else if (playerTeam == ''){
        if (player.player_username == this.state.userData.username){
          //console.log("Can edit self team");
          return (
            <Button title = "Color" titleStyle= {{ fontSize:9}} onPress = {()=> this.setState({editMyColor: true})}></Button>
          )
        }
      }
    } else{

    }
    return (
      <Text></Text>
    )
  }
      renderPlayer= ({ item }) => {
        //console.log(this.state.playerList,this.state.teamData);
        gameStyle = this.state.gameData.game.style;
        //console.log("STYLE",gameStyle);        
        let gameIcon = '';
        let teamData = ''
        //console.log("TEaminfo",teamData);
        if (gameStyle == 'solo'){ // Dont render Team, render color
          gameIcon = 'user';
          teamInfo = item
        } else if(gameStyle == 'team'){ // Render Team info, allow host to alter teams
          gameIcon = 'users';
          teamData = this.getTeamFromUsername(item.player_username)
          teamInfo = item.num_teams + ' Teams'
        }
        let teamColor = teamInfo.color; // adjust for solo?
        return (      
        <ListItem
          style= {{borderColor: teamColor, borderWidth: 1}}
          key = {item.id}
          title={item.player_username}
          titleStyle = {{fontSize: 14,color: 'black'}}
          containerStyle = {{
            backgroundColor: "#EEEEEE"
          }}
         // subtitle={(teamData == '') ? '' : teamData.name} // Chage?
          subtitleStyle = {{
            fontSize: 9,
            color: teamColor
            
          }}
          rightSubtitle = {this.renderTeamPicker(teamData,item)}
          leftIcon={{ name: gameIcon, type: 'feather', color: teamColor} /*Could be Avatar as well? or team/League indicator */}
          bottomDivider
        />
      )}
      renderSpinner = () => {
        if (this.state.loading == true){
          return(
            <Spinner style = {{height:5,
              paddingTop: 43,
              paddingLeft: 15,
              justifyContent: 'center', 
              alignContent: 'center'
              }} size='small' color='blue' />
          )
        } else{
          return (<View/>)
        }
      }
      renderPlayers = (playerList,type) => {
        //const playerList = this.state.playerList;
        //console.log("reneer players",playerList,type)
        if (playerList == undefined || playerList == null){
          return (
            <ActivityIndicator size="large" color="#61578b"
              style = {{
              paddingTop: 25,
              justifyContent: 'center', 
              alignContent: 'center'
             }} />
          )
        }
          if (playerList.length == 0){ /* Should be impossible because host is joined */ // If it is A tem list, have it say players assinged instead of joined
            return (
                  <Text>No Players Assigned</Text>
            )
          } else{
            return(
              <FlatList
                listKey= {"player"+type}
                keyExtractor={this.PlayerKeyExtractor}
                data={playerList}
                renderItem={this.renderPlayer}
                extraData={this.state}
              />

            )
          }
        }
      
      
      renderGameDataCard = () =>{ /* More to come!!! */
        var gameData = this.state.gameData.game;
        if (gameData == null || gameData == undefined){
          return( 
          <View>
            <Card title="Game Data">
              <ActivityIndicator size="large" color="#61578b"
                style = {{
                    paddingTop: 30,
                    justifyContent: 'center', 
                    alignContent: 'center'
                }} />
            </Card>
          </View>
          )
        } else {
          var ammoText = gameData.maxammo
          if (gameData.maxammo <=0){
              ammoText = "Infinite"
          } else{
            ammoText = gameData.maxammo
          }
          var gameMode = gameData.style
          if (gameData.style =='solo'){
            gameMode = "Free For All"
          } else if (gameData.style == 'team'){
            gameMode = "Team Battle"
          }
          
          const playerCount = this.state.playerList.length // Acount for when it is null
          const gameIcon = (gameMode == "Free For All") ? 'user' : 'users';
          const liveCount = (gameData.liveCount <= 0) ? 'Infinite Lives' : gameData.maxLives + ' Lives'
          const playerList = this.state.playerList;
          return(
            <View>
                <Card title={gameData.name} titleStyle= {{ fontSize: 20}}>
                  <View style = {{flexDirection: 'row'}}>                
                    <View style = {{flex: 1, flexDirection: 'row', backgroundColor: '#EEEEEE' }}>
                      <Icon name = {gameIcon} size = {18}  color= "black"  type = 'feather'/> 
                      <Text style = {{fontSize: 18, fontWeight: 'bold'}}> {gameMode} </Text>
                    </View>

                    <View style = {{flex: 0.7, flexDirection: 'row', backgroundColor: '#EEEEEE' }} >
                      <Icon name = 'ios-person' size = {18}  color= "black"  type = 'ionicon'/> 
                      <Text style = {{fontSize: 18, fontWeight: 'bold'}}> {playerCount} Players</Text>
                    </View>
                  </View>
                  
                  <View style = {{flexDirection: 'row', marginTop: 5}}>                
                    <View style = {{flex: 1, flexDirection: 'row', backgroundColor: '#EEEEEE' }}>
                      <Icon name = 'heart' size = {18}  color= "black"  type = 'feather'/> 
                      <Text style = {{fontSize: 18, fontWeight: 'bold'}}> {liveCount} </Text>
                    </View>

                    <View style = {{flex: 0.7, flexDirection: 'row', backgroundColor: '#EEEEEE' }} >
                      <Icon name = 'ammunition' size = {18}  color= "black"  type = 'material-community'/> 
                      <Text style = {{fontSize: 18, fontWeight: 'bold'}}> {ammoText} </Text>
                    </View>
                  </View>
              
                <View style = {{alignItems: 'center'}}>
                <Text style ={{fontWeight: 'bold', fontSize: 18}}>Players:</Text>
                </View>
                <Divider/>

                {this.renderPlayers(playerList,"full")}
                </Card>
                {this.renderTeamCards()}
              </View>
          )
        }
      }
      PlayerKeyExtractor=(item, index) => index.toString()
      TeamKeyExtractor = (item, index) => index.toString()
      DataKeyExtractor = (item, index) => index.toString()
      TeamCardExtractor = (item, index) =>index.toString()
      
      renderTeamCard = ({item}) =>{
        const teamName = item.name;
        const teamColor = item.color;
        const teamPlayers = item.players;
        let canEdit = false;
        let isEditing = false;
        if (this.state.editTeam != null){
           isEditing = (item.name == this.state.editTeam.name);
        }
        let iconName = ''
        //console.log("IsEditing",isEditing);
        if (isEditing){
          iconName = "check" 
        } else{
          iconName = "square-edit-outline"
        }
        let cardTitle = <View></View>

        //Can Edit team checking
        // Do a PATCH /name/{username}/{game_id}/{team_id} to psuh change to server
        //console.log(teamName.slice(0,8));
        if (teamName.slice(0,8) === "New Team"){ // && teamInfo.temp == true (If not league team)
          canEdit = true;
        }
        if (this.state.isHost && canEdit && !isEditing){ // HOSTTEST        
           cardTitle = <View style = {{flex: 1, flexDirection: 'column', backgroundColor: '#FFFFFF', justifyContent: 'center'}} >
                            <Icon raised 
                              onPress={()=> this.editTeam(item)} 
                              name = {iconName} 
                              size = {16}  
                              containerStyle={{flex: 1, alignSelf: 'flex-end'}} 
                              color= "black"  
                              type = 'material-community'/> 
                              <Text style = {{ color: teamColor, marginTop: -35, alignSelf: 'center', fontSize: 18, fontWeight: 'bold'}}> {teamName} </Text>
                        
                        </View>
        } else if (this.state.isHost && canEdit && isEditing){ // HOSTTEST  
          cardTitle = <View style = {{flex: 1, flexDirection: 'column', backgroundColor: '#FFFFFF', justifyContent: 'center'}} >
                          <Input style={{ height: 15}}
                              value = {this.state.teamNameInput}
                              autoCompleteType = 'off'
                              placeholder='teamName'
                              returnKeyType='done'                     
                              onChangeText={teamNameInput => this.setState({teamNameInput})} 
                            />
                           <Icon raised 
                             onPress={()=> this.editTeam(item)} 
                             name = {iconName} 
                             size = {16}  
                             containerStyle={{flex: 1, alignSelf: 'flex-end'}} 
                             color= "black"  
                             type = 'material-community'/> 
                       </View>
        } else{
           cardTitle = <View style = {{flex: 0.5, flexDirection: 'row', backgroundColor: '#FFFFFF' }} >
                            <Text style = {{fontSize: 18, fontWeight: 'bold', color: teamColor}}> {teamName} </Text> 
                        </View>
        }
        return (
          <Card containerStyle={{borderColor: teamColor}} title={cardTitle} titleStyle= {{ fontSize: 20}}>
              <Divider style={{marginTop:20}} />
              {this.renderPlayers(teamPlayers,teamName)}
          </Card>
        )
      }

      renderTeamCards = () =>{ /* More to come!!! */
        const gameData = this.state.gameData.game;
        const teamData = this.state.teamData;
        const userData = this.state.userData;
        var teamList = [];
        if (gameData.style == 'solo'){ // Add solo details here?
          return <View></View>
        }
        if (gameData == null || this.isEmptyObject(gameData)){
          return( 
          <View>
              <ActivityIndicator size="large" color="#61578b"
                style = {{
                    paddingTop: 30,
                    justifyContent: 'center', 
                    alignContent: 'center'
                }} />
          </View>
          )
        } else {
          const numTeams = gameData.num_teams;
          if (teamData == null){
            //console.log("No teams loaded yet");
            return( 
              <View>
                  <ActivityIndicator size="large" color="#61578b"
                    style = {{
                        paddingTop: 30,
                        justifyContent: 'center', 
                        alignContent: 'center'
                    }} />
              </View>
            )
          }else{
            if (teamData.length == 0){
              console.log("NO Teams")
              for (i = 1; i <=numTeams; i ++){
                teamList.push({id:i, name:"Team "+i, key:"t"+i});
              }
            } else {
            teamList = teamData
            }
          }
          return(
            <FlatList
              listKey = "team"
              keyExtractor={this.TeamCardExtractor}
              data={teamList}
              renderItem={this.renderTeamCard}
              extraData={this.state}
            />
          )
        }
      }


      render() {
        flatListData = [{id: 0, name:"GameData", key: 1}];
        return(
          <ThemeProvider {...this.props}  theme={LaserTheme}>
           <CustomHeader {...this.props} refresh = {this.refresh} headerText= "Game Lobby" headerType = "lobby" />
           <BluetoothManager {...this.props} getGunData = {this.getGunData} screen= "Lobby"></BluetoothManager>
            {/*this.renderJoinError()*/}

             {this.renderColorPicker()}       
            <FlatList
              listKey = "main"
              keyExtractor={this.DataKeyExtractor}
              data={flatListData}
              renderItem={this.renderGameDataCard}
              extraData={this.state}
            />
            {/*this.renderGameDataCard()*/}
            </ThemeProvider>
          );
        }
      }
  
      
  