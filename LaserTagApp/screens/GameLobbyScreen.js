import React, { Component } from 'react';
import {StyleSheet,View,NativeEventEmitter,AppState,NativeModules, ActivityIndicator, FlatList} from 'react-native';
import { Text,Button, ThemeProvider, Input, Divider, ListItem} from 'react-native-elements';
import { LaserTheme } from '../components/Custom_theme';
import CustomHeader from '../components/CustomHeader';
import GunStatusDisplay from '../components/GunStatusDisplay'
import { stringToBytes, bytesToString } from 'convert-string';
import BleManager, { connect } from 'react-native-ble-manager';
import {Web_Urls} from '../constants/webUrls';
import { Item } from 'native-base';
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
      gameData: null,
      userData: null,
      memberList: undefined
    }
    //console.log("construct");
    //this.loadStorage()  // CCan load storage but really not nexessary for now
    
    this.gameLobbyHandleDiscoverPeripheral = this.gameLobbyHandleDiscoverPeripheral.bind(this);
    this.gameLobbyHandleStopScan = this.gameLobbyHandleStopScan.bind(this);
    this.gameLobbyHandleUpdateValueForCharacteristic = this.gameLobbyHandleUpdateValueForCharacteristic.bind(this);
    this.gameLobbyHandleDisconnectedPeripheral = this.gameLobbyHandleDisconnectedPeripheral.bind(this);
    this.gameLobbyHandleAppStateChange = this.gameLobbyHandleAppStateChange.bind(this);

  }
  
  loadStorage = () => {
    console.log("loading storage"); // Necessary?
    global.storage.load ({
    key: 'gunData',
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
      this.setState({connectedGun: ret.conGun,
                  })
    })
    .catch(err => {
    // any exception including data not found
    // goes to catch()
      console.log(err.message);
      switch (err.name) {
        case 'NotFoundError':
          return false;
        case 'ExpiredError': // Gun only lasts for so long
          return false;
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
      this.setState({userData});
      this.setState({gameData});
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
      this.loadGameData(gameData.game_id); // Maybe move to constructor?
        
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
        var getURL = Web_Urls.Host_Url + "/game"
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
      renderTeam = (player) => {
        console.log("rendering team",player);
        /* Get fancy usernames here */
        return (
          <Text>Player Team!</Text>
        )
      }
      renderPlayer= ({ item }) => {
        console.log("Rendering Player");
        let teamInfo = ''
        let gameIcon = ''
        if (gameStyle == 'solo'){ // Dont render Team, render color
          gameIcon = 'user';
          teamInfo = 'FFA'
        } else if(gameStyle == 'team'){ // Render Team info, allow host to alter teams
          gameIcon = 'users';
          teamInfo = item.num_teams + ' Teams'
        }
        return (      
        <ListItem
          key = {Item.id}
          title={item.username}
          subtitle={item.gunID}
          subtitleStyle = {{
            fontSize: 12,
            color: 'gray' // Make dynamic so that close times are red?
          }}
          leftIcon={{ name: 'user', type: 'feather' } /*Could be Avatar as well? or team/League indicator */}
          rightTitle = {this.renderTeam()}
          rightTitleStyle = {{
            fontSize: 12
          }}
          rightSubtitle = {teamInfo}
          bottomDivider
          chevron
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
          if (gameList.length == 0){ /* Should be impossible because host is joined */
            return (
                  <Text>No Players Joined</Text>
            )

          } else{
            return(
              <FlatList
                keyExtractor={this.keyExtractor}
                data={playerList}
                renderItem={this.renderPlayer}
              />

            )
          }
        }
      
      
      renderGameDataCard = () =>{ /* More to come!!! */
        const gameData = this.state.gameData;
        var ammoText = gameData.ammo
        if (gameData.ammo <=0){
            ammoText = "Infinite"
        }
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
            <View>
                <Card title={gameData.name}>
                <ListItem 
                  title= "Gamemode"
                  subtitlle = {gameData.style /*game mode*/}
                />
                <ListItem 
                  title= "Lives"
                  subtitlle = {gameData.num_lives /*game mode*/}
                />
                <ListItem 
                  title= "ammo"
                  subtitlle = {ammoText /*game mode*/}
                />
                <ListItem 
                  title= "Host"
                  subtitlle = {gameData.host /*game mode*/}
                />

                <Divider/>
                <Text>Players</Text>
                {this.renderPlayers()}
                </Card>
            </View>
          )
        }
      }
      renderGameDataCard = () =>{ /* More to come!!! */
        const gameData = this.state.gameData;
        var ammoText = gameData.ammo
        if (gameData.ammo <=0){
            ammoText = "Infinite"
        }
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
            <View>
                <Card title={gameData.name}>
                <ListItem 
                  title= "Gamemode"
                  subtitlle = {gameData.style /*game mode*/}
                />
                <ListItem 
                  title= "Lives"
                  subtitlle = {gameData.num_lives /*game mode*/}
                />
                <ListItem 
                  title= "ammo"
                  subtitlle = {ammoText /*game mode*/}
                />
                <ListItem 
                  title= "Host"
                  subtitlle = {gameData.host /*game mode*/}
                />
                </Card>
            </View>
          )
        }
      }


      render() {
        return(
          <ThemeProvider {...this.props}  theme={LaserTheme}>
           <CustomHeader {...this.props} refresh = {this.refresh} headerText= "Game Lobby" headerType = "lobby" />
            <GunStatusDisplay updateConStatus = {this.updateConnectionStatus}></GunStatusDisplay>
            <FlatList>
            {this.renderJoinError()}
            {this.renderGameDataCard()}
            </FlatList>
            </ThemeProvider>
          );
        }
      }
  
      
  