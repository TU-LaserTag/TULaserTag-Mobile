import React, { Component } from 'react';
import {StyleSheet,View,NativeEventEmitter,AppState,NativeModules, ActivityIndicator, FlatList} from 'react-native';
import { Text,Button, ThemeProvider, Input, Divider, ListItem} from 'react-native-elements';
import { LaserTheme } from '../components/Custom_theme';
import CustomHeader from '../components/CustomHeader';
import GunStatusDisplay from '../components/GunStatusDisplay'
import { stringToBytes, bytesToString } from 'convert-string';
import BluetoothManager from '../components/Ble_manager'
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
      userData: null,
      scanning:false,
      key: '',
      appState: '',
      connectedGun: null,
      keyError: '',
      discoveredP: false,
      loading: true,
      loadingGame: false,
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
        const userData = this.props.navigation.getParam("userData", null);
        this.setState({userData})
        this.refresh();
        
    } 

    componentWillUnmount() { // cancel all async tasks herere? Appstate change?
      console.log("unmouting JoinScreen ");
      var updateListeners = bleManagerEmitter.listeners('BleManagerDidUpdateValueForCharacteristic');
      var disconnectListeners = bleManagerEmitter.listeners('BleManagerDisconnectPeripheral');
      var discoverListeners = bleManagerEmitter.listeners('BleManagerDiscoverPeripheral');
      var stopListeners = bleManagerEmitter.listeners('BleManagerStopScan');
      console.log(updateListeners,disconnectListeners,discoverListeners,stopListeners);
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
              //console.log
              this.handleGameListResponse(responseList);
            } else {
              // Needs more error handling
              
              this.setState({joinGameError: "Could not connect to server, Please try again later",
                           loading: false}); 
              // FOR USE OFFLINE    
              responseList =[{"id":11,"starttime":null,"endtime":null,"maxammo":10,"style":"solo","timedisabled":10,"maxLives":2,"pause":false,"winners":null,"date":"01-17-2020","code":"","num_teams":0,"players_alive":null,"team_selection":"automatic","teams_alive":null,"locked":false,"name":"Skilled Shooting","host":"Caleb Anthony"},{"id":10,"starttime":null,"endtime":null,"maxammo":-1,"style":"team","timedisabled":30,"maxLives":5,"pause":false,"winners":null,"date":"01-17-2020","code":"","num_teams":3,"players_alive":null,"team_selection":"manual","teams_alive":null,"locked":false,"name":"Rock the house","host":"Dranderson"}]
              this.handleGameListResponse(responseList);
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
    
      requestJoin(game){
        this.setState({loadingGame: true})
        var getURL = Web_Urls.Host_Url +"/game/"+game.id+"/"+this.state.userData.username+"/"+ this.state.userData.gun_address
        console.log("Sending request to ",getURL)
        var request = new XMLHttpRequest();
          request.onreadystatechange = (e) => {
            if (request.readyState !== 4) {
              return;
            }
            if (request.status === 200) {
              response = JSON.parse(request.response);
              console.log("Joining Game?",response)
              this.handleJoinGame(response);
            } else {
              console.log("Error",request)
              this.setState({joinGameError: "Could not Join Game",
                            loading: false});     
            }
          }
          request.open('GET', getURL);
          request.send();
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
      
      keyExtractor = (item, index) =>index.toString()
      renderGameList = () => {
        const gameList = this.state.gameList;
        if (gameList == undefined){
          return (
            <ActivityIndicator size="large" color="#61578b"
            style = {{
              paddingTop: 30,
              justifyContent: 'center', 
              alignContent: 'center'
             }} />
          )
        }
        if (this.state.loading == true){
          return (
            <ActivityIndicator size="large" color="#61578b"
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
                listKey = "gameList"
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
              key="header"
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
        console.log("RENDERGAM",item.id)
        return (      
        <ListItem
          key = {"Game"+item.id}
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
            <Spinner 
              key="spiner"
              style = {{height:5,
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
           <BluetoothManager {...this.props} updateConStatus = {this.updateConnectionStatus} screen= "Join"></BluetoothManager>
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
  
      
  