import React, { Component } from 'react';
import {StyleSheet,View,NativeEventEmitter,AppState,NativeModules, ActivityIndicator, FlatList, Dimensions, ViewBase,Alert} from 'react-native';
import { Text,Button, Icon, ThemeProvider, Input, Divider, ListItem,Card,Overlay} from 'react-native-elements';
import { LaserTheme } from '../components/Custom_theme';
import CustomHeader from '../components/CustomHeader';
import GunStatusDisplay from '../components/GunStatusDisplay'
import { stringToBytes, bytesToString } from 'convert-string';
import BleManager, { connect } from 'react-native-ble-manager';
import {Web_Urls} from '../constants/webUrls';
import { Item,Toast, Picker, Fab } from 'native-base';
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
      gameError: false,
      unassignTeamLoading: false,
      removePlayerLoading: false,
      loading: true,     
      needColor: false,
      editMyColor:false,
      editGame: false,
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
      gameLength: null,
    }
    console.log("construct");
    //this.loadStorage()  // CCan load storage but really not nexessary for now
   
    this.onColorChange = this.onColorChange.bind(this);
  }
  
  

  componentDidMount(){
    const userData = this.props.navigation.getParam("userData", null);
    const gameData = this.props.navigation.getParam("gameData", null);
    const teamData = gameData.game.teams; // Teams are pre populated from previous assignments.....
    const gunData = this.props.navigation.getParam("gunData",null);
    const gameLength = this.props.navigation.getParam("game_length",null)
    console.log("Got game Length",gameLength);
    this.setState({userData,gameData,teamData,gameLength});
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
        // Get preliminary players for host
        if (gameData.game.stats.length != 0){
          // Just set stats array as playerlist for now
          //this.populatePlayerList(gameData.game.stats);
          this.setState({playerList: gameData.game.stats}); // THis is where it goes wrong
        }
        if (teamData == null && gameData.game.style == "team"){
          console.log("No teamData");
          this.requestTeamData(gameData.game.id)
        } else{
          //console.log("Populating playerlist",gameData)
          //console.log("either solo or have teamData",teamData)
        }
      }
      //this.refreshAllData(gameData.game.id,userData.username);
    }

    
      
    //this.setState({gameData: dummyGameData,teamData: dummyTeamData,playerList: dummyPlayerData}); // FIX THIS LATEWR
    this.refreshLoop = setInterval(()=> { // Dont forget to destroy (clearintercal)
      //onsole.log("Callin gcheckup");
      if (this.state.needColor || this.state.editMyColor || this.state.editTeam != null){

      } else{
        this.refreshAllData();
        //console.log(this.state.teamData,this.state.playerList)
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
  componentWillUnmount() { // cancel all async tasks herere? Appstate change?
    console.log("Unmounting lobbyy screen");
    clearInterval(this.refreshLoop); // Possibly add to blur as well
}

/** HElpers */
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


  refreshAllData(){
    const gameID = this.state.gameData.game.id;
    const username = this.state.userData.username;
    this.requestGameData(gameID,username)
    //this.requestTeamData(gameID)
    //this.requestPlayerData(gameID)
  }


  getSelfStatsFromUsername(statsList,username){
    let myStats = null;
    if (statsList == null || statsList == undefined || statsList.length == 0){
      console.log("No Stats")
      return null;
    } else{
      if (statsList.length == 0){ // No teams have been created/assigned to game yet
        console.log("No Stats");
        return null;
      } else{
        for (var i = 0; i < statsList.length; i++){
          let player = statsList[i];
          if (player.player_username == undefined){
            console.log("usrname is undefined? - getSelfstats");
            // pusername = mplayer.username
          }
          if (player.player_username === username) {
            myStats = player;
            return myStats
          }
        }
      }
      
    }
   //console.log("Retrurning myTEam",myTeam)
  return myStats;
}

  checkLoggedIn(username){
    const gameData = this.state.gameData;
    const stats = gameData.game.stats;
    const result = this.getSelfStatsFromUsername(stats,username);
    if (result == null){
      //this.setState({gameError: true});
      return false;
    } else{
      
      return true;
    }

  }

  checkTeamConflict(username){
    const gameData = this.state.gameData;
    const teams = gameData.game.teams;
    const numAssigned = this.countTeamsAssigned(username,teams);
    if (numAssigned > 1){
      //this.setState({gameError: true});
      return true;
    } else{
      return false;
      
    }

  }
  
  
  gameLobbyHandleAppStateChange(nextAppState) {
    if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
      console.log('gameLobby Screen has come to the foreground!')
    }
    this.setState({appState: nextAppState});
  }

  editTeam = (team) =>{
    //console.log("Editing team",team);
    if (this.state.editTeam != null){
      //console.log("Toggling edit",team.name,this.state.editTeam.name);
      if (this.state.editTeam.name == team.name){
        //console.log("Team name", );
        if (this.state.teamNameInput == null|| team == null || team == ""){
          alert("Please input a team name (permanent)");
          return
        }
        console.log("Sending request to edit team",team.name,this.state.teamNameInput);
        this.requestPatchTeam(team,this.state.teamNameInput);
        teamData = this.state.teamData;
        var oldTeam = teamData[0]; // Replace with get index of edited team
        oldTeam.name = this.state.teamNameInput;
        teamData[0] = oldTeam;
        //console.log("NEW TEWASM",oldTeam,teamData)
        this.setState({editTeam:null});
      } else{
        //console.log("Editing a different team");
        this.setState({editTeam:team});
      }
    } else{
      //console.log("Opening up edit Team");

      this.setState({editTeam:team}); // Edit teaamLoading: ttue
    }
    
  }

  editGame = (gameData) =>{
    console.log("Editing game");
    if (this.state.editGame == true){
     this.setState({editGame: false});
     // Send off changes
     this.refreshAllData();  
    } else{
      this.setState({editGame: true})  
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
      

  startMatch(){
    const gameID = this.state.gameData.game.id;
    var gameLength = this.state.gameLength
    if (gameLength == null){
      console.log("Set a gameLength");
      gameLength = "15:00";
    }
    const countDown = 30; // 30 second countdown
    console.log("Starting match",gameLength,gameID,countDown);
    this.requestReadyLock(gameLength,gameID,countDown);
  }


  /** Request HTTP functions */
  requestLeaveLobby(username,gameID) { // Remove player from lobby
    this.setState({loading: true,                
    })
    var getURL = Web_Urls.Host_Url + "/player/game/"+username+"/"+gameID;
    console.log("Sending request to ",getURL)
    var request = new XMLHttpRequest();
      request.onreadystatechange = (e) => {
        if (request.readyState !== 4) {
          return;
        }
        if (request.status === 200) {
          response = JSON.parse(request.response);
          console.log("Deleted from Game",response);
          // Perform state changing stuff here  or in thing abobe
          this.setState({loading: false}) // Delete loading
          this.props.navigation.goBack()
        } else {
          console.log("Error when Leaving lobby",request);
          alert("Something went wrong Leaving lobby");
          this.setState({gameError: "Could not connect to server, Please try again later",
                        loading: false});     
        }
      }
      request.open('DELETE', getURL);
      request.send();
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
        console.log("Got teamList",teamList);
        // Get unassigned players as well
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
          if (gameData.ok){
            if (gameData.game.locked){
              console.log("LOCKED INTO GAME",gameData);
              return;
            }
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
              //console.log("Got team",gameData.game.teams)
              //Refreshes team data, Array gets un sorted however TODO: prevent array shuffling after naming a team
              gameData = gameData;  // Remove this
              //console.log("Set gameDat",gameData,"------",this.state.gameData)
              const teamData = gameData.game.teams;
              const playerList = gameData.game.stats;

              this.setState({loading: false, teamData,gameData,playerList})
            }
            this.setState({loading: false, gameData: gameData});
          } else{
            console.log("Waiting for assigned team",gameData);
            
            this.requestGameInfo();
          }
          
        } else {
          console.log("Erroe when Sdearching for game data",request)
          this.setState({gameError: "Could not connect to server, Please try again later",
                        loading: false});     
        }
      }
      request.open('GET', getURL);
      request.send();
  }

  requestGameInfo(){
    const game_id = this.state.gameData.game.id;
    this.setState({loading: true,                
    })
    var getURL = Web_Urls.Host_Url + "/game/info/"+game_id // For somereason not returning evertyih
    console.log("Sending request to ",getURL)
    var request = new XMLHttpRequest();
      request.onreadystatechange = (e) => {
        if (request.readyState !== 4) {
          return;
        }
        if (request.status === 200) {
          gameInfo = JSON.parse(request.response);
          //console.log("Got GAMEINFO:",gameInfo); // Gets strange on team games
          let  gameData = this.state.gameData;
               gameData.game = gameInfo[0];

            if (gameData.game.style == 'solo'){
              const individuals = gameData.game.individuals;
              var isInlist = individuals.find(player => {
                return player.player_username === this.state.userData.username;
              })
              if (isInlist != undefined){
                //console.log("Youre in!",isInlist);
                const player = isInlist;
                this.setState({needColor: false,editMyColor: false,curColor:player.color,setColor:player.color});
              } else{
                //console.log("Youre not in");
                this.setState({needColor: true});
              }  
              this.setState({loading: false, gameData: gameData, playerList: individuals});
            } else{
              //Refreshes team data, Array gets un sorted however TODO: prevent array shuffling after naming a team
              const playerList = gameData.game.stats;
              const teamData = gameData.game.teams;
              this.setState({teamData,playerList});
            }
            //console.log("Setting state")
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
          //console.log("playerData",playerList);
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
    const payload = [{team_id: team.id, player_username: player.player_username}];
    console.log("new payload",payload,player);
    const getURL = Web_Urls.Host_Url + "/createbatch/assignment"
    console.log("Sending request to ",getURL)
    var request = new XMLHttpRequest();
    request.onreadystatechange = (e) => {
      if (request.readyState !== 4) {
        return;
      }
      if (request.status === 200) {
        assignmentResponse = JSON.parse(request.response);
        console.log("Success assigning player to team",assignmentResponse)
        this.refreshAllData()
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

 requestUnassignPlayer(username,teamID) { // unassigning also does not remove/update team_name/color from stats // Crosscheck
  this.setState({loading: true})
  var getURL = Web_Urls.Host_Url + "/player/team/"+username+"/"+teamID;
  console.log("Sending request to ",getURL)
  var request = new XMLHttpRequest();
    request.onreadystatechange = (e) => {
      if (request.readyState !== 4) {
        return;
      }
      if (request.status === 200) {
        response = JSON.parse(request.response);
        console.log("Deleted from team",response);
        // Perform state changing stuff here  or in thing abobe
        this.refreshAllData()
        this.setState({unassignTeamLoading: false, loading: false});
      } else {
        console.log("Error when deleting player from team",request);
        alert("Something went wrong while removing this player");
        this.setState({gameError: "Could not connect to server, Please try again later",
                      loading: false});     
      }
    }
    request.open('DELETE', getURL);
    request.send();
}
requestRemovePlayer(username,gameID) { // Rewquest specific game data
  this.setState({loading: true})
  var getURL = Web_Urls.Host_Url + "/player/game/"+username+"/"+gameID;
  console.log("Sending request to ",getURL)
  var request = new XMLHttpRequest();
    request.onreadystatechange = (e) => {
      if (request.readyState !== 4) {
        return;
      }
      if (request.status === 200) {
        response = JSON.parse(request.response);
        console.log("Removed From Game",response);
        // Perform state changing stuff here  or in thing abobe
        this.refreshAllData()
        this.setState({removePlayerLoading: false, loading: false});
      } else {
        console.log("Error when deleting player from team",request);
        alert("Something went wrong while removing this player");
        this.setState({gameError: "Could not connect to server, Please try again later",
                      loading: false,
                      removePlayerLoading: false
                    });     
      }
    }
    request.open('DELETE', getURL);
    request.send();
}
  
 requestPatchTeam(team,newName) { // Ask about what to do with this now?
  this.setState({loading: true }); // patchLoading
  const teamId = team.id;
  const payload = {name: newName, primaryColor: null, secondaryColor:null, captain:null};
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
      this.refreshAllData();
      this.setState({loading: false})
    } else {
    console.log("Team change error",request)
    alert("Somethign went wrong while changing team name");
    this.setState({loading: false});     
    }
  }
  request.open('PATCH', getURL);
  request.send(JSON.stringify(payload));
 }


 requestReadyLock(gameLength,gameID,countDown){ // Can be array of players
  this.setState({loading: true }); // Different loading types??
  const payload = {game_length: gameLength, id:gameID, secs_to_start:countDown};
  console.log("Start game payload",payload);
  const getURL = Web_Urls.Host_Url + "/readylock"
  console.log("Sending request to ",getURL)
  var request = new XMLHttpRequest();
  request.onreadystatechange = (e) => {
    if (request.readyState !== 4) {
      return;
    }
    if (request.status === 200) {
      lockResponse = JSON.parse(request.response);
      if (lockResponse.ok){
        console.log("Success ready lock",lockResponse)
        // update TeamData to contain that state
        this.setState({loading: false}); // Starting game = true? or wait until checkup is called;
      } else{
        console.log("REady lock failure",lockResponse);
        this.setState({loading: false});
        
      }
    } else {
      console.log("Lock error Errorr",request)
      this.setState({loading: false});     
    }
  }
  request.open('POST', getURL);
  request.setRequestHeader("Content-type","application/json");
  request.send(JSON.stringify(payload));
}


 /** Rendering functions */

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
      //console.log("Showing up Color Picker",this.state.needColor,this.state.editMyColor);
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
  
  
  getTeamFromUsername = (username,teamList) =>{
    //teamList = this.state.teamData;
    //console.log("Set teamlist username",username)
    myTeam = 'none';
    if (teamList == null || teamList == undefined || teamList.length == 0){
      console.log("No Teams -- null -- getTeam from username")
      return {name: "none", color: "#EEEEEE"}
    } else{
      if (teamList.length == 0){ // No teams have been created/assigned to game yet
        console.log("No Teams Emptu llist, get TEam from username");
        return {name: "none", color: "#EEEEEE"}
      } else{
        for (var i = 0; i < teamList.length; i++){
          let team = teamList[i];
          let playerList = team.players;
          //console.log("PLAYER LEIST",playerList)
          for (var j = 0; j < playerList.length; j ++){
            let mplayer = playerList[j];
            pusername = mplayer.username;
            //console.log(mplayer)
            if (pusername == undefined){
              console.log("pusername is undefined? - getTeam from Usernam")
             // pusername = mplayer.username
            }
            if (pusername == username) {
              myTeam = team;
              break;
            }
          }
        }
      }
    }
    //console.log("Retrurning myTEam",myTeam)
    return myTeam;
  }

  countTeamsAssigned = (username,teamList) =>{
    //teamList = this.state.teamData;
    //console.log("Set teamlist username",username)
    var numTeams = 0;
    if (teamList == null || teamList == undefined || teamList.length == 0){
      console.log("No Teams -- null -- Count teams")
      return 0;
    } else{
      if (teamList.length == 0){ // No teams have been created/assigned to game yet
        console.log("No Teams Empty llist, count teams");
        return 0;
      } else{
        for (var i = 0; i < teamList.length; i++){
          let team = teamList[i];
          let playerList = team.players;
          //console.log("PLAYER LEIST",playerList)
          for (var j = 0; j < playerList.length; j ++){
            let mplayer = playerList[j];
            pusername = mplayer.username;
            //console.log(mplayer)
            if (pusername == undefined){
              console.log("player username is undefined? - getTeam from Usernam")
             // pusername = mplayer.username
            }
            if (pusername == username) {
              numTeams ++;
            }
          }
        }
      }
    }
    //console.log("Retrurning myTEam",myTeam)
    return numTeams;
  }


// Team Picking and Adssignment!!!
getTeamFromTeamName = (teamName,teamList) =>{
  //teamList = this.state.teamData;
  //console.log("Set teamlist username",username)
  myTeam = 'none';
  //return "none" // TODO: REMOVE THISSS------------------------------------------------------=-=-=-=-=-=-
  if (teamList == null || teamList == undefined || teamList.length == 0){
    console.log("No Teams -- Null in GetTEamFromTeamname")
    return {name: "none", color: "#EEEEEE", team_color: '#EFEFEF'}
  } else{
    if (teamList.length == 0){ // No teams have been created/assigned to game yet
      console.log("No Teams List is empty in getTeamFromTeamname");
      return {name: "none", color: "#EFEFEF"}
    } else{
      for (var i = 0; i < teamList.length; i++){
        let team = teamList[i];
        //console.log("checking Team",team.name);
        if (team.name === teamName) {
          myTeam = team;
          break;
        }
      }
    }
  }
  //console.log("Retrurning myTEam",myTeam)
  return myTeam;
}

leaveLobby = () =>{
  const username = this.state.userData.username;
  const gameID = this.state.gameData.game.id;
  console.log("Leaving lobby",username,gameID);
  this.requestLeaveLobby(username,gameID);
}


unassignTeam = (team,player) =>{ // There seems to be an error here TypeError: Cannot read property 'username' of undefined---db.js 1434:98
  console.log("Removing team assignment",team.name,player);
  this.setState({unassignTeamLoading: true});
  const username = player;
  const teamID = team.id
  this.requestUnassignPlayer(username,teamID);
}

removePlayer = (username,gameID) =>{ /**Cannot read property 'username' of undefined at handler (/var/www/html/TULaserTag-Server/db.js:1473:93*/
  this.setState({removePlayerLoading: true});
  Alert.alert(
    'Kick From Lobby',
    'Kick from Lobby?',
    [
      {
        text: 'No',
        onPress: () => console.log('Cancel Pressed'),
        style: 'cancel',
      },
      {text: 'Yes', onPress: () => this.requestRemovePlayer(username,gameID)},
    ],
    {cancelable: true},
  );
}

assignTeam = (teamIndex,player) =>{ // Assign a player to a team, send request, then refresh list?
  const teamList = this.state.teamData;
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
  // setstats as well...

  //console.log("Updated Team",teamList,"---",selectedTeam);
  this.requestAssignPlayer(selectedTeam,player);
  // Refreash at end of rewquest // Or have Button at end that to click assign
}

  renderTeamPicker = (isRenderingTeamPlayer,playerTeam,player) => {
    const gameData = this.state.gameData.game;
    //console.log("TEamPicker",isRenderingTeamPlayer);
    let teamItems = [];
    let isSolo = false;
    if (player.style == 'solo' || playerTeam == 'solo' || gameData.style == 'solo'){ 
      console.log("Solo game");
      isSolo = true;
    }else{
        //console.log("TeamPicker",)
        if (this.state.teamData == null){ // Find way to get all Teams?
          console.log("Waiting for team Data");
        }else{
          teamItems = this.state.teamData.map( (team, index) =>{
          return team.name   
          });
        }
    }
    // Use populated availible teams instyed??
    //console.log("Picker for player",player,this.state.userData.username);
    let username = player.player_username
    if (username == undefined){
      username = player.username;
    }
   // console.log("Got username",username)
    if (playerTeam == "none" && !isSolo){ // If no assinged team and not a solo game
      if (gameData.team_selection == 'manual') {
        if (this.state.isHost){ // If host (Or captain/neadsName?), then allow Player team assignment from dropdown if player team is none   // If not automatic game      
          return ( // Dont forget to style this
            <View>
            <ModalDropdown 
            defaultValue = "Assign Team"
            onSelect = { selectedTeamIndex => this.assignTeam(selectedTeamIndex,player)}
            options={teamItems}/> 
            <Button  title = "Kick" loading = {this.state.removePlayerLoading} titleStyle= {{ color: 'red', fontSize:9}} onPress = {()=> this.removePlayer(username,gameData.id)}></Button>
            </View>
          )
        } else{ // If not host
          return(
             <Text>Wait for assignment</Text>
          )
        }
      } else{ // If is automatic game
          return(
            <Text>Auto Assigned</Text>
          )
      }
    } else if (!isSolo && playerTeam != "none"){ // If There is a player in a team and not a solo game, 
      //console.log("rendering player",player)
      if (this.state.isHost){ // If ur host, remove them from team // Button or trash icon
       if (isRenderingTeamPlayer){
         //console.log("is host and select player")
         return(
            <Button  title = "Unassign" loading = {this.state.unassignTeamLoading} titleStyle= {{ fontSize:9}} onPress = {()=> this.unassignTeam(playerTeam,username)}></Button>
         )
        } else{

          return(
            <View style={{flexDirection: 'row'}}> 
            <Button  title = "Unassign" loading = {this.state.unassignTeamLoading} titleStyle= {{ fontSize:9}} onPress = {()=> this.unassignTeam(playerTeam,username)}></Button>
            <Button  title = "Kick" loading = {this.state.removePlayerLoading} titleStyle= {{ color: 'red', fontSize:9}} onPress = {()=> this.removePlayer(username,gameData.id)}></Button>
          </View>
          );
       }
      } else{
          return (
          <Text>{playerTeam.name}</Text>
          );
      }
    }
    
    if (isSolo){ // If in a solo match, allow editing of own color; button shows up color picker
        if (player.player_username == this.state.userData.username){ // Allow host to change?
          return (
              <Button title = "Pick Color" titleStyle= {{ fontSize:9}} onPress = {()=> this.setState({editMyColor: true})}></Button>
          )
        } else{
          return (
            <View></View>
          )
        }
    }
    
    return ( // Should never Reach here
      <Text></Text>
    )
  }
      renderPlayer= ({ item }) => {
        //console.log("Rendering player",item.player_username);
        let username = item.player_username;
        let isRenderingTeamPlayer = false; // Temporary Data inconsistency fix
        if (username == undefined || username == null){ // If rendering team player
          username = item.username; 
          isRenderingTeamPlayer = true; 
        }
        const gameStyle = this.state.gameData.game.style;
        //console.log("STYLE",gameStyle);        
        let gameIcon = '';
        let teamInfo = ''
        let iconColor = '';
        //console.log("TEaminfo",teamData);
        if (gameStyle == 'solo'){ // Dont render Team, render color
          gameIcon = 'user';
          teamInfo = 'solo'
        } else if(gameStyle == 'team'){ // Render Team info, allow host to alter teams
          // Check logged in 
          const loggedIn = this.checkLoggedIn(username);
          // check team conflict
          const teamConflict = this.checkTeamConflict(username);
          if (teamConflict){
            gameIcon="alert-octagon" // Make Alert in outside function?
            iconColor = 'red';
          } else if( loggedIn == false){
            gameIcon = 'user-x'; 
            iconColor = 'red';
          } else{
            gameIcon = 'users';
            iconColor = 'green'
          }
          
          const teamList = this.state.teamData
          const assignedTeam = item.team_name;
          //console.log(this.state.gameData)
          if (assignedTeam == "" || assignedTeam == null){
            //console.log(" No team assinged to player");
            if (isRenderingTeamPlayer){
              teamInfo = this.getTeamFromUsername(username,teamList); // Grabs team data from username 
              //console.log("Got tem from username",teamInfo)
            }else{
              teamInfo='none';
            }
          }else{
            //console.log("Team name",assignedTeam);
            teamInfo = this.getTeamFromTeamName(assignedTeam,teamList);
            //console.log("MY TEAM",teamInfo)
          }
        }
        let teamColor = teamInfo.color // primary/secondary color?
        //console.log("Preliminary color",teamColor);// or set default
        if (teamInfo != 'solo'){
          teamColor = teamInfo.color;
          //console.log("Set team Color",teamColor)
        } else{
          //console.log("Setting solo color",item.color)
          teamColor = item.color
        }
        return (      
        <ListItem
          style= {{borderColor: teamColor, borderWidth: 1}}
          key = {item.id}
          title={username}
          titleStyle = {{fontSize: 14,color: 'black'}}
          containerStyle = {{
            backgroundColor: "#EEEEEE"
          }}
         subtitle={teamInfo.name} // Chage?
          subtitleStyle = {{
            fontSize: 9,
            color: teamColor
            
          }}
          rightSubtitle = {this.renderTeamPicker(isRenderingTeamPlayer,teamInfo,item)}
          leftIcon={{ name: gameIcon, type: 'feather', color: iconColor} /*Could be Avatar as well? or team/League indicator */}
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
        //console.log("RenderPlayer",playerList,type)
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
          if (this.state.playerList == null){
            console.log("No players");
          }
          const playerList = this.state.playerList;
          const playerCount = playerList.length; // if playerList is undefined/null?
          const gameIcon = (gameMode == "Free For All") ? 'user' : 'users';
          const liveCount = (gameData.liveCount <= 0) ? 'Infinite Lives' : gameData.maxLives + ' Lives'
          let cardTitle = '';
         if (this.state.editGame == false){
          iconName = "square-edit-outline"
          cardTitle = <View style = {{flex: 1, marginBottom: 10, flexDirection: 'column', backgroundColor: '#FFFFFF', justifyContent: 'center'}} >
                            <Icon raised 
                              onPress={()=> this.editGame(gameData)} 
                              name = {iconName} 
                              size = {15}  
                              containerStyle={{flex: 1, alignSelf: 'flex-end'}} 
                              color= "black"  
                              type = 'material-community'/> 
                              <Text style = {{ color: 'black', marginTop: -35, alignSelf: 'center', fontSize: 20, fontWeight: 'bold'}}> {gameData.name} </Text>
                        
                        </View>
         } else{
          iconName = "check";
          cardTitle = <View style = {{flex: 1, marginBottom: 10, flexDirection: 'column', backgroundColor: '#FFFFFF', justifyContent: 'center'}} >
                            <Icon raised 
                              onPress={()=> this.editGame(gameData)} 
                              name = {iconName} 
                              size = {15}  
                              containerStyle={{flex: 1, alignSelf: 'flex-end'}} 
                              color= "black"  
                              type = 'material-community'/> 
                              <Text style = {{ color: 'black', marginTop: -35, alignSelf: 'center', fontSize: 20, fontWeight: 'bold'}}> {gameData.name} </Text>
                        
                        </View> 
         }
          return(
            <View>
                <Card title={cardTitle} titleStyle= {{ fontSize: 20}}>
                
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
                {this.renderReadyLockButton()}
              </View>
          )
        }
      }
      PlayerKeyExtractor=(item, index) => index.toString()
      TeamKeyExtractor = (item, index) => index.toString()
      DataKeyExtractor = (item, index) => index.toString()
      TeamCardExtractor = (item, index) =>index.toString()
      
      renderTeamCard = ({item}) =>{ // What to do if on two teams....?
        //console.log("Rendering TEam Card",item)
        const teamName = item.name;
        const teamColor = item.color;
        const teamPlayers = item.players; // Is a problem because teamData here does not match stats data
        //console.log("Teamplayers",teamPlayers)
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

      renderReadyLockButton = () => {
        return(
        <Button loading = {this.state.loading} disabled = {this.state.loading} style={{marginBottom: 10}}title= "Start Match" onPress={() => this.startMatch()}/>
        )
      }
      render() {
        flatListData = [{id: 0, name:"GameData", key: 1}];
        return(
          <ThemeProvider {...this.props}  theme={LaserTheme}>
           <CustomHeader {...this.props} refresh = {this.refresh} leaveLobby = {this.leaveLobby} headerText= "Game Lobby" headerType = "lobby" />
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
  
      
  