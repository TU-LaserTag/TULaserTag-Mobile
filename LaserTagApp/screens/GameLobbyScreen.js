import React, { Component } from 'react';
import {StyleSheet,View,NativeEventEmitter,AppState,NativeModules, ActivityIndicator, FlatList, ViewBase} from 'react-native';
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
import { ColorPicker,toHsv, fromHsv } from 'react-native-color-picker'
 
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
      isHost: false,
      editTeam: null,
      teamNameInput: null,
      temColorInput: null,
      createTeam: false,
      hue: 0,
      sat: 0,
      val: 1,
    }
    console.log("construct");
    this.loadStorage()  // CCan load storage but really not nexessary for now
    
    //this.gameLobbyHandleDiscoverPeripheral = this.gameLobbyHandleDiscoverPeripheral.bind(this);
    //this.gameLobbyHandleStopScan = this.gameLobbyHandleStopScan.bind(this);
    //this.gameLobbyHandleUpdateValueForCharacteristic = this.gameLobbyHandleUpdateValueForCharacteristic.bind(this);
    //this.gameLobbyHandleDisconnectedPeripheral = this.gameLobbyHandleDisconnectedPeripheral.bind(this);
    //this.gameLobbyHandleAppStateChange = this.gameLobbyHandleAppStateChange.bind(this);
    this.onSatValPickerChange = this.onSatValPickerChange.bind(this);
    this.onHuePickerChange = this.onHuePickerChange.bind(this);
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
    
      this.setState({userData});
      this.setState({gameData});
      const isHost
      //this.setState({gameData: dummyGameData}); // FIX THIS LATEWR
      //this.setState({teamData: dummyTeamData}); // FIX THIS LATEWR
      //this.setState({playerList: dummyPlayerData}); // FIX THIS LATEWR
      

      console.log("Lobyy Mounted")
      /*AppState.addEventListener('change', this.gameLobbyHandleAppStateChange);*/
      console.log("Loading gameData",gameData)
      //this.loadGameData(gameData.id); // Maybe move to constructor?
        
    } 

    componentWillUnmount() { // cancel all async tasks herere? Appstate change?
      console.log("unmouting JoinScreen status");
    }
    updateConnectionStatus(data){
      console.log("Updating Connection Status",data);
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

      editTeam = (team) =>{
        console.log("Editing team",team);
        if (this.state.editTeam != null){
          console.log("Toggling edit",team.name,this.state.editTeam.name);
          if (this.state.editTeam.name == team.name){
            console.log("Sending request to edit team",team,this.state.teamNameInput, this.state.temColorInput)
            this.setState({editTeam:null});
          } else{
            console.log("Editing a different team");
            this.setState({editTeam:team});
          }
        } else{
          console.log("Opening up edit Team");
          this.setState({editTeam:team});
        }
        
      }
      onSatValPickerChange({ saturation, value }) {
        this.setState({
          sat: saturation,
          val: value,
        });
      }
    
      onHuePickerChange({ hue }) {
        this.setState({
          hue,
        });
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

      isEmptyObject = (obj) => {
        return (Object.entries(obj).length === 0 && obj.constructor === Object)
      }
     
      

      keyExtractor = (item, index) => {
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


      renderColorPicker = () =>{
        const { hue, sat, val } = this.state;
        return (
          <Overlay isVisible>
            <Text>Hello from Overlay!</Text>
    
         <View style={{flex: 1, padding: 45, backgroundColor: '#212021'}}>
          <Text style={{color: 'white'}}>React Native Color Picker - Controlled</Text>
          <ColorPicker
            oldColor='purple'
            color={this.state.color}
            onColorChange={this.onColorChange}
            onColorSelected={color => alert(`Color selected: ${color}`)}
            onOldColorSelected={color => alert(`Old color selected: ${color}`)}
            style={{flex: 1}}
          />
        </View>
        </Overlay>
        )
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
        return "none" // TODO: REMOVE THISSS------------------------------------------------------=-=-=-=-=-=-
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
        let teamItems = this.state.teamData.map( (team, index) =>{
          return team.name
        });
        if (!this.state.isHost){
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
      renderPlayers = (playerList,type) => {
        //const playerList = this.state.playerList;
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
        console.log("rendering team card")
        const teamName = item.name;
        const teamColor = item.color;
        const teamPlayers = item.players;
        let isEditing = false;
        if (this.state.editTeam != null){
            console.log("Checking isEid");
           isEditing = (item.name == this.state.editTeam.name);
        }
        let iconName = ''
        console.log("IsEditing",isEditing);
        if (isEditing){
          iconName = "check" 
        } else{
          iconName = "square-edit-outline"
        }
        let cardTitle = <View></View>
        if (!this.state.isHost && !isEditing){ // TODO: CHANGE FROM NOT HOST          
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
        } else if (!this.state.isHost && isEditing){ // TODO: CHANGE FROM NOT HOST          
          cardTitle = <View style = {{flex: 1, flexDirection: 'column', backgroundColor: '#FFFFFF', justifyContent: 'center'}} >
                          <Input style={{ height: 15}}
                              value = {this.state.teamNameInput}
                              autoCompleteType = 'off'
                              placeholder='teamName'
                              returnKeyType='done'                     
                              onChangeText={teamNameInput => this.setState({teamNameInput})} 
                            />
                            <View>
                              {this.renderColorPicker()}
                            </View>
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
        const gameData = this.state.gameData;
        const teamData = this.state.teamData;
        const userData = this.state.userData;
        var teamList = [];
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
          if (teamData.length == 0){
            console.log("NO Teams")
            for (i = 1; i <=numTeams; i ++){
              teamList.push({id:i, name:"Team "+i, key:"t"+i});
            }
        } else {
          teamList = teamData
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
            <GunStatusDisplay updateConStatus = {this.updateConnectionStatus}></GunStatusDisplay>
            {/*this.renderJoinError()*/}
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
  
      
  