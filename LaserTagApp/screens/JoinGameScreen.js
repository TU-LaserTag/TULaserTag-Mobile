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


export default class JoinGameScreen extends Component {
  static navigationOptions = {
    title: 'Join Game', // Possibly have it dynamic to name
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
      seachMode: 'public',
    }
    //console.log("construct");
    //this.checkBLE(); Should get ran in GunStatusDisplay
    this.loadStorage()  // Checks storage and then builds upon startBLEManager
    
    this.joinGameHandleDiscoverPeripheral = this.joinGameHandleDiscoverPeripheral.bind(this);
    this.joinGameHandleStopScan = this.joinGameHandleStopScan.bind(this);
    this.joinGameHandleUpdateValueForCharacteristic = this.joinGameHandleUpdateValueForCharacteristic.bind(this);
    this.joinGameHandleDisconnectedPeripheral = this.joinGameHandleDisconnectedPeripheral.bind(this);
    this.joinGameHandleAppStateChange = this.joinGameHandleAppStateChange.bind(this);
  }
  loadStorage = () => {
    console.log("loading storage");
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
    updateConnectionStatus(data){
      console.log("Updating Connection Status",data);
    }
    
    editGamekey = key => {
      this.setState({ key });
    };
    componentDidMount(){
        console.log("Join Game Mount")
        AppState.addEventListener('change', this.joinGameHandleAppStateChange);
        //const data = this.props.navigation.getParam("varName", "None") or else none
        const updateListeners = bleManagerEmitter.listeners('BleManagerDidUpdateValueForCharacteristic');
        const disconnectListeners = bleManagerEmitter.listeners('BleManagerDisconnectPeripheral');
        const discoverListeners = bleManagerEmitter.listeners('BleManagerDiscoverPeripheral');
        const stopListeners = bleManagerEmitter.listeners('BleManagerStopScan');

        if (discoverListeners.length <= 1) {
            console.log("Joinscreen discover listener");
            this.joinGameHandlerDiscover = bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', this.joinGameHandleDiscoverPeripheral );
        }
        if (stopListeners.length <= 1) {
          console.log("Joinscreen Stop listener");
          this.joinGameHandlerStop = bleManagerEmitter.addListener('BleManagerStopScan', this.joinGameHandleStopScan );
        }
        if (disconnectListeners.length <= 1) {
          console.log("JoinScreen disconnect listener");
          this.joinGameHandlerDisconnect = bleManagerEmitter.addListener('BleManagerDisconnectPeripheral', this.joinGameHandleDisconnectedPeripheral );
        }
        if (updateListeners.length <= 1) {
          console.log("JoinScreen updateListener");
          this.joinGameHandlerUpdate = bleManagerEmitter.addListener('BleManagerDidUpdateValueForCharacteristic', this.joinGameHandleUpdateValueForCharacteristic );
        }
        // Temporarily here to test Game display functionality
        this.requestGames();
        
    } 

    componentWillUnmount() { // cancel all async tasks herere? Appstate change?
      console.log("unmouting JoinScreen status");
      var updateListeners = bleManagerEmitter.listeners('BleManagerDidUpdateValueForCharacteristic');
      var disconnectListeners = bleManagerEmitter.listeners('BleManagerDisconnectPeripheral');
      var discoverListeners = bleManagerEmitter.listeners('BleManagerDiscoverPeripheral');
      var stopListeners = bleManagerEmitter.listeners('BleManagerStopScan');
      console.log(updateListeners,disconnectListeners,discoverListeners,stopListeners);
  
      if (discoverListeners.length > 0){
          this.joinGameHandlerDiscover.remove('BleManagerDiscoverPeripheral');
      }
      if (stopListeners.length >0){
        this.joinGameHandlerStop.remove('BleManagerStopScan');
      }
      if (disconnectListeners.length > 0){
        this.joinGameHandlerDisconnect.remove('BleManagerDisconnectPeripheral');
      }
      if (updateListeners.length > 0){
        this.joinGameHandlerUpdate.remove('BleManagerDidUpdateValueForCharacteristic');
      }
    }

    // Handlers
    joinGameHandleDisconnectedPeripheral(gun) {
      let connectedGun = this.state.connectedGun;
      if (connectedGun.id == gun.peripheral) { 
        connectedGun.connected = false;
        this.setState({connectedGun})
        this.saveGunConnection(this.state);
      }
      console.log('JoinGame Disconnected from ' + gun.peripheral);
    }
  
    joinGameHandleUpdateValueForCharacteristic(data) {
      const command = bytesToString(data.value);
      this.joinGameHandleGunCommand(command);
      //console.log('Received data from ' + data.peripheral + ' characteristic ' + data.characteristic, data.value);
    }
  
    joinGameHandleStopScan() {
      console.log('Joingame Scan is stopped');
      this.setState({ scanning: false });
      if (this.state.searchID != null && this.state.foundMatch == false){
        console.log("No matching gun found")
        this.setState({connectionError: 'Gun Not Found'})
      }
    }
  
    joinGameHandleGunCommand (command) {
      console.log("Join Game handling command",command)
    }
  
    joinGameHandleDiscoverPeripheral(peripheral){
      if (!this.state.discoveredP){
        this.setState({discoveredP: true});
      }
      if (!peripheral.name || peripheral.name != "TULGN") {
        return;
      }
      
    }


    joinGameHandleAppStateChange(nextAppState) {
      if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
        console.log('JoinGame Screen has come to the foreground!')
      }
      this.setState({appState: nextAppState});
    }

    joinPressed = (game) => {
      console.log("Tying to join",game);
      if (!this.state.gunConnected){
        console.log("Gun not connected")
        this.setState({joinGameError: "Connect to gun before joining game"});
        return;
      } else{ // any other error/game validateion

      }
      // Finally attempt to join the game
        this.requestJoin(game);
      
    };
  
      requestGames() { // Request all games
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
              // Do more error handling here
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
      renderGame= ({ item }) => {
        let gameStartDate = Date(item.date + ' ' +item.starttime);
        let gameEndDate = Date(item.date + ' ' +item.endtime);
        let startDate = gameStartDate.toString().slice(0,16);
        //let gameStartTime = gameStartDate.toString().slice(16,24);
        //et gameEndTime = gameEndDate.toString().slice(16,24);
        //console.log("gameDates: ",gameStartDate,gameEndDate);
        //console.log("StartIme",gameStartTime,'-',gameEndTime);
        const gameTimeStamp = startDate
        const gameHost= item.host;
        const gameStyle = item.style;
        let teamInfo = ''
        let gameIcon = ''
        if (gameStyle == 'solo'){
          gameIcon = 'user';
          teamInfo = 'FFA'
        } else if(gameStyle == 'team'){
          gameIcon = 'users';
          teamInfo = item.num_teams + ' Teams'
        }
        return (      
        <ListItem
          key = {Item.id}
          onPress={() => this.joinPressed(item) }
          title={item.name}
          subtitle={gameTimeStamp}
          subtitleStyle = {{
            fontSize: 12,
            color: 'gray' // Make dynamic so that close times are red?
          }}
          leftIcon={{ name: gameIcon, type: 'feather' }}
          rightTitle = {gameHost}
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
      render() {
        return(
          <ThemeProvider {...this.props}  theme={LaserTheme}>
           <CustomHeader {...this.props} refresh = {this.refresh} headerText= "Join Game" headerType = "join" />
            <GunStatusDisplay updateConStatus = {this.updateConnectionStatus}></GunStatusDisplay>
            <Input
              placeholder='Game Key (optional)'
              keyboardType='default'
              returnKeyType='done'
              clearButtonMode='always'
              leftIcon={{ type: 'entypo', name: 'key' }}
              errorMessage= {this.state.keyError}
              onChangeText={this.editGamekey}
              underlineColorAndroid = '#FFF'
              style={{marginBottom:4
                      }}
              value={this.state.key}
            />
            <Button style= {{size: 4,
                            marginHorizontal: 10,
                            marginVertical: 5
                            
            }}
              title= "Search Private Games"
              disabled = {this.getKeyStatus()}
              onPress={() => this.requestPrivateGames()}
              />
            
            {this.rendergameListHeader()}
            {this.renderJoinError()}
            {this.renderGameList()}
            </ThemeProvider>
          );
        }
      }
  
      
  