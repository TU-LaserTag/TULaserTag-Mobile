import React, { Component } from 'react';
import {StyleSheet,View,NativeEventEmitter,AppState,NativeModules, ActivityIndicator, FlatList} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { Text,Button, ThemeProvider, Input, Divider, ListItem} from 'react-native-elements';
import { LaserTheme } from '../components/Custom_theme';
import { Container } from 'native-base';
import CustomHeader from '../components/CustomHeader';
import GunStatusDisplay from '../components/GunStatusDisplay'
import { stringToBytes, bytesToString } from 'convert-string';
import BleManager, { connect } from 'react-native-ble-manager';

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
      gameListHeader: 'Showing Public Games',
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
  
      requestGames() {
        this.setState({loading: true,
                        searchMode: 'public',
                        gameListHeader: "Showing Public: "
        })
        var getURL = "Https://tuschedulealerts.com/game"
        console.log("Sending request to ",getURL)
        /*fetch(getURL,{ 
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          }
        })
        .then(this.handleResponse)
        .then(this.parseResponse)
        .catch((error) => {console.log("OOF:"); console.error(error);});*/
        const dummyGameData1 = {
          id: 0,
          starttime: '08:19:30',
          endtime: '10:19:30',
          maxammo: -1,
          style: 'team',
          timedisabled: 0,
          maxLives: 2,
          pause: 'f',
          winners: null,
          date: '01-14-2020',
          code: "",
          num_teams: 2,
          players_alive: null,
          team_selection: 'automatic',
          teams_alive: null,
          locked: 'f',
          name: 'Solo Shootout',
          host: 'NurkBook'
        }
        const dummyGameData2 = {
          id: 1,
          starttime: '10:19:30',
          endtime: '14:19:30',
          maxammo: 50294,
          style: 'solo',
          timedisabled: 40,
          maxLives: 3,
          pause: 'f',
          winners: null,
          date: '01-14-2020',
          code: "",
          num_teams: 2,
          players_alive: null,
          team_selection: 'manual',
          teams_alive: null,
          locked: 'f',
          name: 'Biggus Trickus',
          host: 'BoopMaster'
        }
        
        const gameDataList = {
          ok: true, 
          gameList: [
                    dummyGameData1,
                    dummyGameData2
                    ]
        }
        this.handleGameListResponse(gameDataList);
      }

      searchPrivateGames() {
        const searchKey = this.state.key;
        this.setState({
          loading: true,
          gameList: [],
          searchMode: 'private',
          gameListHeader: "Showing Private Games Matching: "+searchKey
        });
        console.log("searching for",searchKey);
        var getURL = "Https://tuschedulealerts.com/game/code/" + searchKey
        console.log("Sending request to ",getURL)

        /*fetch(getURL,{ 
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          }
        })
        .then(this.handleResponse)
        .then(this.parseResponse)
        .catch((error) => {console.log("OOF:"); console.error(error);});*/
        const dummyGameData1 = {
          id: 0,
          starttime: '08:19:30',
          endtime: '10:19:30',
          maxammo: -1,
          style: 'team',
          timedisabled: 0,
          maxLives: 2,
          pause: 'f',
          winners: null,
          date: '01-14-2020',
          code: "privatge",
          num_teams: 2,
          players_alive: null,
          team_selection: 'automatic',
          teams_alive: null,
          locked: 'f',
          name: 'Solo Shootout',
          host: 'NurkBook'
        }
        const dummyGameData2 = {
          id: 1,
          starttime: '10:19:30',
          endtime: '14:19:30',
          maxammo: 50294,
          style: 'solo',
          timedisabled: 40,
          maxLives: 3,
          pause: 'f',
          winners: null,
          date: '01-14-2020',
          code: "private",
          num_teams: 2,
          players_alive: null,
          team_selection: 'manual',
          teams_alive: null,
          locked: 'f',
          name: 'Biggus Trickus',
          host: 'BoopMaster'
        }
        const gameDataList = {
          ok: true, 
          gameList: [
                    dummyGameData1,
                    dummyGameData2
                    ]
        }
        this.handleGameListResponse(gameDataList)
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
        .then(this.handleResponse(response))
        .then(this.parseResponse)
        .catch((error) => {console.log("OOF:"); console.error(error);});
      }

      
    

      handleGameListResponse = (response)=> {
        this.setState({loading: false})
        if (response.ok){
          // If data - no data or no type
          //display error on screen
          if (response == "error"){
            console.warn("error in data")
            return "error"
          }else{
              const gameList = response.gameList;
              console.log("Setting game List",gameList)
              this.setState({gameList});
          } // Happy path
  
        } else{
          //console.log(response)
          
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
      switchSearchMode = () => {
        console.log("Switching search mode to:");
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
      keyExtractor = (item, index) => index.toString();
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
              <Text>No Public Games Availible</Text>
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
          const headerText = this.state.gameListHeader;
          let searchIcon = '';
          let searchType = '';
          if (this.state.seachMode == 'public'){
            searchIcon = 'earth'
            searchType = 'antdesign'
          } else if (this.state.searchMode == 'private'){
            searchIcon = 'key'
            searchType = 'entypo'
          }
          return (
              <ListItem
                containerStyle = {{
                  backgroundColor: 'gray',
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
        let gameStartTime = gameStartDate.toString().slice(16,24);
        let gameEndTime = gameEndDate.toString().slice(16,24);
        console.log("gameDates: ",gameStartDate,gameEndDate);
        console.log("StartIme",gameStartTime,'-',gameEndTime);
        const gameTimeStamp = startDate + gameStartTime + ' - ' + gameEndTime;
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
          <ThemeProvider {...this.props} theme={LaserTheme}>
           <CustomHeader {...this.props} headerText= "Join Game" headerType = "join" />
            <GunStatusDisplay updateConStatus = {this.updateConnectionStatus}></GunStatusDisplay>
            <Input
              placeholder='Game Key (optional)'
              keyboardType='default'
              returnKeyType='done'
              leftIcon={{ type: 'entypo', name: 'key' }}
              errorMessage= {this.state.keyError}
              onChangeText={this.editGamekey}
            />
            <Button style= {{size: 4}}
              title= "Serch Private Games"
              disabled = {this.getKeyStatus()}
              onPress={() => this.searchPrivateGames()}
              />
            <Divider style={{ backgroundColor: 'gray' , paddingTop: 5}} />
            {this.rendergameListHeader()}
            {this.renderJoinError()}
            {this.renderGameList()}
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