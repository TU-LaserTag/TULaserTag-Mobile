import React, { Component } from 'react';
import {StyleSheet,View,NativeEventEmitter,AppState,NativeModules, ActivityIndicator, FlatList, ViewBase} from 'react-native';
import { Text,Button, Icon, ThemeProvider, Input, Divider, ListItem,Card} from 'react-native-elements';
import { LaserTheme } from '../components/Custom_theme';
import CustomHeader from '../components/CustomHeader';
import GunStatusDisplay from '../components/GunStatusDisplay'
import { stringToBytes, bytesToString } from 'convert-string';
import BleManager, { connect } from 'react-native-ble-manager';
import {Web_Urls} from '../constants/webUrls';
import { Item,Toast, Picker } from 'native-base';
import { ScrollView, TouchableHighlight } from 'react-native-gesture-handler';
import ModalDropdown from 'react-native-modal-dropdown';
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
      scanning:false,
      key: '',
      appState: '',
      connectedGun: null,
      keyError: '',
      discoveredP: false,
      loading: true,     
      seachMode: 'public',
      gameData: {},
      teamData: [],
      userData: {},
      playerList: [],
      isHost: false
    }
    console.log("construct");
    this.loadStorage()  // CCan load storage but really not nexessary for now
    
    //this.gameLobbyHandleDiscoverPeripheral = this.gameLobbyHandleDiscoverPeripheral.bind(this);
    //this.gameLobbyHandleStopScan = this.gameLobbyHandleStopScan.bind(this);
    //this.gameLobbyHandleUpdateValueForCharacteristic = this.gameLobbyHandleUpdateValueForCharacteristic.bind(this);
    //this.gameLobbyHandleDisconnectedPeripheral = this.gameLobbyHandleDisconnectedPeripheral.bind(this);
    //this.gameLobbyHandleAppStateChange = this.gameLobbyHandleAppStateChange.bind(this);

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
  console.log(userData);
  this.setState({userData})
  if (this.state.userData.username == this.state.gameData.host){
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

    componentDidMount(){
      const userData = this.props.navigation.getParam("userData", null);
      const gameData = this.props.navigation.getParam("gameData", null);
      const dummyGameData = {"id":10,"starttime":null,"endtime":null,"maxammo":-1,"style":"team","timedisabled":30,"maxLives":5,"pause":false,"winners":null,"date":"01-16-2020","code":"","num_teams":3,"players_alive":null,"team_selection":"manual","teams_alive":null,"locked":false,"name":"Rock the house","host":"Dranderson"}
      const dummyTeamData = [{"id":8,"name":"Horace Greely","color":"#12543F","league_id":null,"players":[{"id":3,"username":"Thirty Thousand Leagues","password":"12345"},{"id":6,"username":"Green Machine","password":"RedIsDead"}]},{"id":13,"name":"Coherent Light","color":"#3E47AE","league_id":null,"players":[{"id":4,"username":"Nurkbook","password":"Ecuador"},{"id":5,"username":"Dr. You","password":"Me&You"}]}]
      const dummyPlayerData = [{"id":3,"username":"Thirty Thousand Leagues","password":"12345"},{"id":6,"username":"Green Machine","password":"RedIsDead"},{"id":4,"username":"Nurkbook","password":"Ecuador"},{"id":5,"username":"Dr. You","password":"Me&You"}]
    
      //this.setState({userData});
      this.setState({gameData: dummyGameData}); // FIX THIS LATEWR
      this.setState({teamData: dummyTeamData}); // FIX THIS LATEWR
      this.setState({playerList: dummyPlayerData}); // FIX THIS LATEWR
      

      console.log("Lobyy Mounted")
      /*AppState.addEventListener('change', this.gameLobbyHandleAppStateChange);
      //const data = this.props.navigation.getParam("varName", "None") or else none
      const updateListeners = bleManagerEmitter.listeners('BleManagerDidUpdateValueForCharacteristic');
      const disconnectListeners = bleManagerEmitter.listeners('BleManagerDisconnectPeripheral');
      const discoverListeners = bleManagerEmitter.listeners('BleManagerDiscoverPeripheral');
      const stopListeners = bleManagerEmitter.listeners('BleManagerStopScan');

      if (discoverListeners.length <= 1) {
          console.log("Joinscreen discover listener");
          this.gameLobbyHandlerDiscover = bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', this.gameLobbyHandleDiscoverPeripheral );
      }
      if (stopListeners.length <= 1) {
        console.log("Joinscreen Stop listener");
        this.gameLobbyHandlerStop = bleManagerEmitter.addListener('BleManagerStopScan', this.gameLobbyHandleStopScan );
      }
      if (disconnectListeners.length <= 1) {
        console.log("JoinScreen disconnect listener");
        this.gameLobbyHandlerDisconnect = bleManagerEmitter.addListener('BleManagerDisconnectPeripheral', this.gameLobbyHandleDisconnectedPeripheral );
      }
      if (updateListeners.length <= 1) {
        console.log("JoinScreen updateListener");
        this.jgameLobbyHandlerUpdate = bleManagerEmitter.addListener('BleManagerDidUpdateValueForCharacteristic', this.jgameLobbyHandleUpdateValueForCharacteristic );
      }*/
      console.log("Loading gameData",gameData)
      //this.loadGameData(gameData.id); // Maybe move to constructor?
        
    } 

    componentWillUnmount() { // cancel all async tasks herere? Appstate change?
      console.log("unmouting JoinScreen status");
     /* var updateListeners = bleManagerEmitter.listeners('BleManagerDidUpdateValueForCharacteristic');
      var disconnectListeners = bleManagerEmitter.listeners('BleManagerDisconnectPeripheral');
      var discoverListeners = bleManagerEmitter.listeners('BleManagerDiscoverPeripheral');
      var stopListeners = bleManagerEmitter.listeners('BleManagerStopScan');
      console.log(updateListeners,disconnectListeners,discoverListeners,stopListeners);
  
      if (discoverListeners.length > 0){
          this.gameLobbyHandlerDiscover.remove('BleManagerDiscoverPeripheral');
      }
      if (stopListeners.length >0){
        this.gameLobbyHandlerStop.remove('BleManagerStopScan');
      }
      if (disconnectListeners.length > 0){
        this.gameLobbyHandlerDisconnect.remove('BleManagerDisconnectPeripheral');
      }
      if (updateListeners.length > 0){
        this.gameLobbyHandlerUpdate.remove('BleManagerDidUpdateValueForCharacteristic');
      }*/
    }

    // Handlers
    gameLobbyHandleDisconnectedPeripheral(gun) {
      let connectedGun = this.state.connectedGun;
      if (connectedGun.id == gun.peripheral) { 
        connectedGun.connected = false;
        this.setState({connectedGun})
        this.saveGunConnection(this.state);
      }
      console.log('gameLobby Disconnected from ' + gun.peripheral);
    }
  
    gameLobbyHandleUpdateValueForCharacteristic(data) {
      const command = bytesToString(data.value);
      this.gameLobbyHandleGunCommand(command);
      //console.log('Received data from ' + data.peripheral + ' characteristic ' + data.characteristic, data.value);
    }
  
    gameLobbyHandleStopScan() {
      console.log('gameLobby Scan is stopped');
      this.setState({ scanning: false });
      if (this.state.searchID != null && this.state.foundMatch == false){
        console.log("No matching gun found")
        this.setState({connectionError: 'Gun Not Found'})
      }
    }
  
    gameLobbyHandleGunCommand (command) {
      console.log("Join Game handling command",command)
    }
  
    gameLobbyHandleDiscoverPeripheral(peripheral){
      if (!this.state.discoveredP){
        this.setState({discoveredP: true});
      }
      if (!peripheral.name || peripheral.name != "TULGN") {
        return;
      }
      
    }
    gameLobbyHandleAppStateChange(nextAppState) {
      if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
        console.log('gameLobby Screen has come to the foreground!')
      }
      this.setState({appState: nextAppState});
    }

  
      loadGameData() { // Request all games (Game Id)
        this.setState({loading: true,
                        gameList: [],
                        searchMode: 'public',
                        gameListHeader: "Public Games:"
        })
        var getURL = Web_Urls.Host_Url + "/game/"+game_id
        console.log("Sending request to ",getURL)
        var request = new XMLHttpRequest();
          request.onreadystatechange = (e) => {
            if (request.readyState !== 4) {
              return;
            }
            if (request.status === 200) {
              responseList = JSON.parse(request.response);
              this.handleGameListResponse(responseList);
            } else {
              // Needs more error handling
              this.setState({joinGameError: "Could not connect to server, Please try again later",
                            loading: false});     
            }
          }
          request.open('GET', getURL);
          request.send();
      }

      requestPrivateGames() { // Request private game(s) accoring to key
        const searchKey = this.state.key;
        this.setState({
          loading: true,
          gameList: [],
          searchMode: 'private',
          gameListHeader: "Private Games: "+searchKey
        });
        var getURL = Web_Urls.Host_Url +"/game/code/" + searchKey
        console.log("Sending request to ",getURL)

        var request = new XMLHttpRequest();
          request.onreadystatechange = (e) => {
            if (request.readyState !== 4) {
              return;
            }
            if (request.status === 200) {
              responseList = JSON.parse(request.response);
              this.handleGameListResponse(responseList);
            } else {
              console.log("Error",request)
              this.setState({joinGameError: "Could not connect to server, Please try again later",
                            loading: false});     
            }
          }
          request.open('GET', getURL);
          request.send();
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
        .then(handleGameListResponse)
        .catch((error) => {console.log("OOF:"); console.error(error);});
      }


      handleGameListResponse(response) {
        const gameList = response
        console.log("Handling",response)
        if (gameList.length < 1){
          this.setState({joinGameError: "No Games Found",
                        loading: false});     
        } else{
        //console.log("Setting game List",gameList)
          this.setState({gameList: response,   
                        loading: false,
                        joinGameError: ""});
          }            
      }
    
      switchSearchMode = () => {
        const newMode =  ((this.state.searchMode == 'private') ? 'public' : 'private');
        if (newMode == 'public'){
          this.setState({searchMode: 'public',
                        key: ''
          });
        } else{
            this.setState({searchMode: 'private'})
          
        }
        this.refresh(newMode)
      }

      refresh = (mode) => {
        
        if (this.state.key == ''){
          mode = 'public'
        }
        if (mode == 'public'){
          this.requestGames();
        } else{
          if (!this.getKeyStatus()){
            this.requestPrivateGames()
          }
        }
      }
      getGameStatus = () => {
        if (this.state.key == "") {
          return "View Games"
        } else{
          return "Join Game"
        }
      }
      getKeyStatus = () => {
        if (this.state.key == "") {
          return true;
        } else{
          return false;
        }
      }
      keyExtractor = (item, index) => {
      }
      renderGameList = () => {
        const gameList = this.state.gameList;
        if (gameList == undefined){
          return (
            <ActivityIndicator size="large" color="#0000ff"
            style = {{
              paddingTop: 30,
              justifyContent: 'center', 
              alignContent: 'center'
             }} />
          )
        }
        if (this.state.loading == true){
          return (
            <ActivityIndicator size="large" color="#0000ff"
            style = {{
              paddingTop: 30,
              justifyContent: 'center', 
              alignContent: 'center'
             }} />
          )
        } else{
          if (gameList.length == 0){
            return (
                  <Text></Text>
            )

          } else{
            return(
              <FlatList
                keyExtractor={this.keyExtractor}
                data={gameList}
                renderItem={this.renderGame}
              />

            )
          }
        }
      }
      renderJoinError = () => {
        if (this.state.joinGameError != ''){
          return (
          <Text style = {{backgroundColor: 'red', textAlign: 'center', color: 'white'}}>{this.state.joinGameError}</Text>
          )
        }else{
          return 
        }
      }
      rendergameListHeader = () => {
        const searchMode = this.state.searchMode
        const headerText = this.state.gameListHeader;
        let searchIcon = '';
        let searchType = '';
        if (searchMode == 'public'){
          searchIcon = 'earth'
          searchType = 'antdesign'
        } else{
          searchIcon = 'key'
          searchType = 'entypo'
        }
        return (
            <ListItem
              containerStyle = {{
                backgroundColor: '#ae936c',
                margin: 0
              }}
              onPress={() => this.switchSearchMode()}
              title={headerText}
              leftIcon={{ name: searchIcon, type: searchType }}
              bottomDivider
            />
          )    
      }
      getTeamFromUsername = (username) =>{
        teamList = this.state.teamData;
        myTeam = 'none';
        return "none"
        if (teamList == null || teamList == undefined){
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
                  console.log("Fouhnd match", username);
                  myTeam = team;
                  break;
                }
              }
            }
          }
        }
        return myTeam;
      }

      renderTeamPicker = (playerTeam) => {
        const gameData = this.state.gameData;
        console.log("renderi",gameData.team_selection);
        let teamItems = this.state.teamData.map( (team, index) =>{
          return team.name
        });
        console.log(teamItems)
        if (!this.state.isHost){
          console.log(" Yourea host");
          if (playerTeam == "none"){ // Then check if needs team and if teamPicking is manual
            if (gameData.team_selection == 'manual') {
              console.log("Displaying team picker");
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
                defaultValue = "Select Team"
                options={teamItems}/> 
              )
            }
          }
        } else{

        }
        return (
          <Text>Player Team!</Text>
        )
      }
      renderPlayer= ({ item }) => {
        //console.log(this.state.playerList,this.state.teamData);
        gameStyle = this.state.gameData.style;
        let teamData = this.getTeamFromUsername(item.username)
        let gameIcon = ''
        console.log("TEaminfo",teamData);
        if (gameStyle == 'solo'){ // Dont render Team, render color
          gameIcon = 'user';
          teamData = 'item.color?'
        } else if(gameStyle == 'team'){ // Render Team info, allow host to alter teams
          gameIcon = 'users';
          teamInfo = item.num_teams + ' Teams'
        }
        let teamColor = teamInfo.color;
        return (      
        <ListItem
          style = {{c: teamColor}}
          key = {Item.id}
          title={item.username}
          titleStyle = {{fontSize: 11}}
          containerStyle = {{
            backgroundColor: "#EEEEEE"
          }}
          subtitle={teamData.name}
          subtitleStyle = {{
            fontSize: 9,
            color: teamData.color,
            
          }}
          rightSubtitle = {this.renderTeamPicker(teamData)}
          leftIcon={{ name: 'user', type: 'feather', color: teamData.color} /*Could be Avatar as well? or team/League indicator */}
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
      renderPlayers = () => {
        const playerList = this.state.playerList;
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
          if (playerList.length == 0){ /* Should be impossible because host is joined */
            return (
                  <Text>No Players Joined Yet</Text>
            )
          } else{
            return(
              <FlatList
                keyExtractor={this.PlayerKeyExtractor}
                data={playerList}
                renderItem={this.renderPlayer}
              />

            )
          }
        }
      
      
      renderGameDataCard = () =>{ /* More to come!!! */
        var gameData = this.state.gameData;
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

                {this.renderPlayers()}
                </Card>
              </View>
          )
        }
      }
      PlayerKeyExtractor=(item, index) => index.toString()
      TeamKeyExtractor = (item, index) => index.toString()
      DataKeyExtractor = (item, index) => index.toString()

      renderTeamCards = () =>{ /* More to come!!! */
        const gameData = this.state.gameData;
        const teamData = this.state.teamData;
        if (gameData == null){
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
          return(
            <FlatList
              keyExtractor={this.keyExtractor}
              data={list}
              renderItem={this.renderItem}
            />
          )
        }
      }


      render() {
        flatListData = [{id: 0, name:"GameData", key: 1}];
        return(
          <ThemeProvider {...this.props}  theme={LaserTheme}>
           <CustomHeader {...this.props} refresh = {this.refresh} headerText= "Game Lobby" headerType = "lobby" />
            <GunStatusDisplay updateConStatus = {this.updateConnectionStatus}></GunStatusDisplay>
            {/*this.renderJoinError()*/}
            <FlatList
              keyExtractor={this.DataKeyExtractor}
              data={flatListData}
              renderItem={this.renderGameDataCard}
            />
            {/*this.renderGameDataCard()*/}
            </ThemeProvider>
          );
        }
      }
  
      
  