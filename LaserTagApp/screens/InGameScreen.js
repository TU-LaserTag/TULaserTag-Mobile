import React, { Component } from 'react';
import {StyleSheet,View,NativeEventEmitter,AppState,NativeModules, ActivityIndicator, FlatList, Dimensions} from 'react-native';
import { Text,Button, Icon, ThemeProvider, Input, Divider, ListItem,Card,Overlay} from 'react-native-elements';
import { LaserTheme } from '../components/Custom_theme';
import CustomHeader from '../components/CustomHeader';
import GunStatusDisplay from '../components/GunStatusDisplay'
import { stringToBytes, bytesToString } from 'convert-string';
import BluetoothManager from '../components/Ble_manager'
import {Web_Urls} from '../constants/webUrls';
import { Item } from 'native-base';
import storage from '../Storage'
import { startAsync } from 'expo/build/AR';

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);
const dimensions = Dimensions.get('window');
const window_width = Math.round(dimensions.width);

export default class InGameScreen extends Component {
  static navigationOptions = {
    title: 'In Match', // Possibly have it dynamic to name
  };

  constructor(){
    super()
    this.state = {
      loading: false,
      userData: null,
      gunData: {},
      gameData: {},
      teamData: {},
      playerList: null,
      loggedIn: true,
      gameError: '',
      gameClock: null,
      gameLength:  null,
      gameOver: false,
      endGameStats: null,
      winners: null,
    }
    this.renderSoloLeaderBoard = this.renderSoloLeaderBoard.bind(this);

  }
  
  componentDidMount(){
    console.log("InGame Mount")
    const userData = this.props.navigation.getParam("userData", null);
    const gunData = this.props.navigation.getParam("gunData", null);
    const gameData = this.props.navigation.getParam("gameData", null);
    const gameLength = this.props.navigation.getParam("gameLength", null);

    //console.log("Got data:",userData,gunData,gameData)
    this.setState({userData, gunData,gameData,gameLength});
    if (gameData == null){
      console.log("No Game Data");
      // How to get game ID?  
    }

    if (userData == null){
      console.log("no userData")
      this.loadStorage();
    }

    // Set refreshInterval interval
    if (gameLength != null){
      console.log('gameLength',gameLength);
      // Convert from here?
      // set gamelentgh
    }
    this.refresh();

    // Start gameClock
    this.gameClockLoop = setInterval(()=> { // Dont forget to destroy (clearintercal)
      const curClock = this.state.gameClock;
      if (curClock == null){
        return;
      }
      if (curClock <= 0){
        const gameID = this.state.gameData.game.id;
        this.requestGameOver(gameID);
        
      
      }else{
        
        this.setState({gameClock: curClock -1});
      }

    }, 1000);

    this.gameDataRefreshLoop = setInterval(()=> { // Dont forget to destroy (clearintercal)
        //this.bleManager.sendMessage("f:")
      this.refresh();

    }, 5000);
  } 

  componentWillUnmount() { // cancel all async tasks herere? Appstate change?
    console.log("unmouting inGame ");
    clearInterval(this.gameClockLoop);
    clearInterval(this.gameDataRefreshLoop);
  }

  // * Helpers*--------######-- ***//


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




  refresh(){
    const gameData = this.state.gameData;
    //console.log("Refreshing",gameData);
    // Things needed to check
    /**Gameover
     * game/info
     * hits?
     * fire?
     */
    if (this.isEmptyObject(gameData)){
      console.log("May have error getting data");
    } else{
      const gameID = this.state.gameData.game.id;
      this.requestGameInfo(gameID); // Stores game data into gameData
      if (this.state.userData != null){
        this.requestGameOver(gameID);
      }
    }
  }
  pointsCompare(a, b) {
    // Use toUpperCase() to ignore character casing
    const pointsA = a.points;
    const pointsB = b.points;
  
    let comparison = 0;
    if (pointsA > pointsB) {
      comparison = 1;
    } else if (pointsA < pointsB) {
      comparison = -1;
    }
    return comparison;
  }
  /** Sorts the rankings of the players */
  sortRankStats(ranks){
   const sortedRanks = ranks.sort(this.pointsCompare);
    return sortedRanks;
  }

  getSecondsUntilEndTime(startTime,endTime){ // Easy to understand and not clever way to get seconds from timestamps
    //console.log("Finding seconds until end time",endTime); /** 15:29:73  why is this 73??*/
    startArray = startTime.split(":");
    endArray = endTime.split(":");
    // Do validation here??
    //console.log(startArray,endArray);
    var date = new Date();
    var startHours = Number(startArray[0])*3600;
    var startMinutes= Number(startArray[1]*60);
    var startSeconds = Number(startArray[2])

    var endHours = Number(endArray[0])*3600;
    var endMinutes= Number(endArray[1]*60);
    var endSeconds = Number(endArray[2]);

    var totalHours = endHours - startHours;
    var totalMinutes =endMinutes- startMinutes ;
    var totalSeconds = endSeconds -startSeconds;

    var totaltime = totalHours*3600 + totalMinutes *60 + totalSeconds;
    console.log("TIME",totaltime);
    return totaltime;
  }


  getSecondsLeft(endTime){ // Easy to understand and not clever way to get seconds from a timestamp
    //console.log("Finding seconds until end time",endTime);
    var today = new Date();
    var h = today.getHours();
    var m = today.getMinutes();
    var s = today.getSeconds();
    var startArray = [h,m,s];
    //console.log("CurrentTime",startArray);
    //currentArray = currentTime.split(":");

    endArray = endTime.split(":");
    // Do validation here??
    //console.log(startArray,endArray);
    var date = new Date();
    var startHours = Number(startArray[0]);
    var startMinutes= Number(startArray[1]);
    var startSeconds = Number(startArray[2])

    var endHours = Number(endArray[0]);
    var endMinutes= Number(endArray[1]);
    var endSeconds = Number(endArray[2]);
  
    var totalHours = (endHours - startHours); 
    var totalMinutes =endMinutes- startMinutes ;
    var totalSeconds = endSeconds -startSeconds;

    var totaltime = totalHours*3600 + totalMinutes *60 + totalSeconds;
    //console.log("TIME",totaltime);
    return totaltime;
  }

  
  getSecondsFromMinutes(minutes){ //? probably not necessary
    console.log("Finding seconds until end time",endTime);
    return minutes*60;
  }

leaveGame = () =>{
  const username = this.state.userData.username;
  const gameID = this.state.gameData.game.id;
  console.log("Leaving Game",username,gameID);
  this.requestLeaveGame(username,gameID);
}
  keyExtractor = (item, index) =>index.toString()

showGameOver = (gameOverData) =>{
  alert("Game Finished");
  console.log("GameoverData",gameOverData)
  this.bleManager.sendMessage("f:")
  clearInterval(this.gameClockLoop)
  clearInterval(this.gameDataRefreshLoop);
  this.setState({gameOver:true})
}

  fireGun = () =>{
    console.log("pew pew");
    this.bleManager.sendMessage("s:"+1) // Ammo lift
    // Gather Needed info here first and pass it along
    const gameData = this.state.gameData;
    const gameMode = gameData.game.style;
    const username = this.state.userData.username;
    const gameID = gameData.game.id;
    const timestamp = new Date().getTime(); /** todo:  ASK WHAt time format is needed */
    const rounds_fired = 5; // Get Info from Gun...
    this.requestFireGun(gameMode,username,gameID,timestamp,rounds_fired);
  }
  
  gotHit = () =>{

  }

  isEmptyObject = (obj) => {
    return (Object.entries(obj).length === 0 && obj.constructor === Object)
  }
  getSelfStatsFromUsername(statsList,username){
      //teamList = this.state.teamData;
      //console.log("Set teamlist username",username)
      myStats = 0;
      if (statsList == null || statsList == undefined || statsList.length == 0){
        console.log("No Stats")
        return null;
      } else{
        if (statsList.length == 0){ // No stats created/assigned to game yet
          console.log("No Stats");
          return null;
        } else{
          for (var i = 0; i < statsList.length; i++){
            let player = statsList[i];
            if (player.player_username == undefined){
              console.log("usrname is undefined? - getstats from username");
              // pusername = mplayer.username
            }
            if (player.player_username == username) {
              myStats = player;
              return myStats
            }
          }
        }
        
      }
    return myStats;
  }
  /********* ------ */

//** HTTP REQUESTS----- */
// GET
  

  requestGameInfo(gameID){
    this.setState({loading: true,                
    })
    var getURL = Web_Urls.Host_Url + "/game/info/"+gameID // For somereason not returning evertyih
    console.log("Sending request to ",getURL)
    var request = new XMLHttpRequest();
      request.onreadystatechange = (e) => {
        if (request.readyState !== 4) {
          return;
        }
        if (request.status === 200) {
          const gameData = JSON.parse(request.response);
          //console.log("Got GAMEINFO:",gameInfo); // Gets strange on team games
           
             const gameInfo = gameData.game;
             const startTime = gameInfo.starttime;
             const endTime = gameInfo.endtime;
             //if (this.state.gameClock == null){ /** Should It update every time? */
               //const secsTillEnd = this.getSecondsUntilEndTime(startTime,endTime);
               const timeLeft = this.getSecondsLeft(endTime);
               //console.log("Setting game clock",timeLeft);
              this.setState({gameClock: timeLeft});
             //}
             //console.log("ZGame in",gameInfo.name)
            if (gameInfo.style == 'solo'){ // If solo match
              const players = gameInfo.stats;
              var isInlist = players.find(player => {
                return player.player_username === this.state.userData.username;
              })
              if (isInlist != undefined){
                //console.log("Youre in!",isInlist);
                const player = isInlist;
                this.setState({loggedIn: true});
              } else{
                console.warn("You have been removed from this match");
                this.setState({loggedIn: false});
              }  
              this.setState({loading: false, gameData});
            } else{
              //Refreshes team data, Array gets un sorted however TODO: prevent array shuffling after naming a team
              const playerList = gameInfo.stats;
              const teamData = gameInfo.teams;
              //console.log("TeamData",teamData)
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
  
  requestGameOver(gameID){
    const username = this.state.userData.username;
    this.setState({loading: true,                
    })
    var getURL = Web_Urls.Host_Url + "/gameover/"+username+"/"+gameID // For somereason not returning evertyih
    console.log("Sending request to ",getURL)
    var request = new XMLHttpRequest();
      request.onreadystatechange = (e) => {
        if (request.readyState !== 4) {
          return;
        }
        if (request.status === 200) { // Error 500, Cannot read property 'split' of null db.js:989:52 (when calling gameover on a game with no endTime)
          gameInfo = JSON.parse(request.response);
          //console.log("Got GameoverINfo:",gameInfo); // Gets strange on team game
          this.setState({loading: false, gameData: gameData});
          if (gameInfo.gameOver){
            /** End Game */ // Gets called before local endtime is 0 ~25-30 seconds
            console.log("GAME OVER");
            this.setState({endGameStats: gameInfo.gameStats, winners: gameInfo.winners});
            this.showGameOver(gameInfo);
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
  requestFireGun(gameMode,username,gameID,timestamp,rounds_fired){
    this.setState({loading: true,                
    })
    var getURL = Web_Urls.Host_Url + "/fire/"+gameMode+"/"+username+"/"+gameID+"/"+timestamp+"/"+rounds_fired; // For somereason not returning evertyih
    console.log("Sending request to ",getURL)
    var request = new XMLHttpRequest();
      request.onreadystatechange = (e) => {
        if (request.readyState !== 4) {
          return;
        }
        if (request.status === 200) { // Error 500, Cannot read property 'split' of null db.js:989:52 (when calling gameover on a game with no endTime)
          gameInfo = JSON.parse(request.response);
          console.log("Rounds fired recieved",gameInfo); // Gets strange on team game
          this.setState({loading: false});
          // Format and store hitDictionary to be loaded ad proper stats. also ask why solo game does not have kills array in stats...
        } else {
          console.log("Erroe when Sdearching for game data",request)
          this.setState({gameError: "Could not connect to server, Please try again later",
                        loading: false});     
        }
      }
      request.open('GET', getURL);
      request.send();
  }

  requestLeaveGame(username,gameID) { // Remove player from lobby
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
/*******---------**** */
      
    
   

/** Rendering functions ------ */
  renderGameHeader(gameData){
    //console.log("rendering HEADER",gameData);
    
      return(
        <View  titleStyle= {{ fontSize: 20}} style={{ alignItems: 'center', backgroundColor:'white', borderTopColor: 'white'}}>
              <Text style ={{fontSize: 25, fontWeight: 'bold'}}>{gameData.name} </Text>
        </View>
      );
    
  }


  rendergameTimer(gameTime){
    // Format gameTIme?
    const clientTime = this.state.gameClock;

    var formattedHours= Math.floor(clientTime/60/60);
    var formattedMinutes = Math.floor(clientTime/60) %60;
    var formatedSeconds = clientTime %60
    if (formattedHours < 10){
      formattedHours = "0"+formattedHours;
    }
    if (formattedMinutes < 10){
      formattedMinutes = "0"+formattedMinutes;
    }
    if (formatedSeconds < 10){
      formatedSeconds = "0"+formatedSeconds;
    }
    const endTime = formattedHours + ":" +formattedMinutes + "." + formatedSeconds;
    //console.log(endTime);
    return (
      <View style = {{backgroundColor: 'white', alignItems: 'center'}}><Text style = {{ fontSize: 30, fontWeight: '200'}}>{endTime}</Text></View>
    )
  }


  renderTeamHeader(teamData){
    //console.log("rendering",teamData);
    var teamItemList = [];
    var teamPair = [];
    for (i = 0; i < teamData.length; i ++){
      const team = teamData[i];
      let marginDir = (i%2 == 0) ? -2:2;
      let teamName= team.name;
      let teamColor = team.color; // Make background white to get contrast of text?                          
      teamPair.push(<View style={{borderWidth: 2,borderRadius: 5, marginHorizontal: 3, backgroundColor: teamColor, justifyContent: 'center' }}><Text style={{fontWeight: 'bold', }}>{teamName}</Text><Divider></Divider><Text style = {{ fontWeight:'200', alignSelf: 'center'}}>Score</Text></View>);
      if (marginDir == 2){
        teamItemList.push(<View key={i} style= {{flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 10}}>{teamPair}</View>);
        teamPair = [];
      }
    }
    return (
      <View key="teamRanking" style={{paddingTop:5}}>{teamItemList}</View>
    )
  }
  renderSoloLeaderBoard = () =>{
    const gameData = this.state.gameData.game;
    //console.log("GameDataSolo",gameData)
    ranks = gameData.stats;
    sortedStats = this.sortRankStats(ranks)
    //console.log("Sorted Stats",sortedStats);
    //console.log("rendering",teamData);
    var rankingList = [];
    var rankPair = [];
    for (i = 0; i < sortedStats.length; i ++){
      const player = sortedStats[i];
      let marginDir = (i%2 == 0) ? -2:2;
      let name = player.player_username;
      let color = player.team_color; // Make background white to get contrast of text?   
      let points = player.points;                       
      rankPair.push(<View key={"RankPair"+i} style={{borderWidth: 2,borderRadius: 5, marginHorizontal: 3, marginTop:marginDir, backgroundColor: color, justifyContent: 'center' }}><Text style={{fontWeight: 'bold', }}>{name}</Text><Divider></Divider><Text style = {{ fontWeight:'200', alignSelf: 'center'}}>{points}</Text></View>);
      if (marginDir == 2){
        rankingList.push(<View key={i} style= {{flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 10}}>{rankPair}</View>);
        rankPair = [];
      }
      if (sortedStats.length == 1){
        rankingList.push(<View key={i} style= {{flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 10}}>{rankPair}</View>);
      }
    }
    return (
      <View key="rankingList" style={{paddingTop:5}}>{rankingList}</View>
    )
  }


  renderTeamHeaders(gameData) {
    //console.log("REnderingteam Headers",gameData);
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
      const flatListData = [{id: 0, name:"GameData", key: 1}];
      if (gameData.style == 'solo'){ // Place Leaderboard herec // {this.renderLeaderboard(gameData)}
      //console.log("Rendering solo lB",gameData)
        return (<FlatList
          listKey = "LeaderBoard"
          keyExtractor={this.DataKeyExtractor}
          data={flatListData}
          renderItem={this.renderSoloLeaderBoard}
          extraData={this.state}
        />
        )
      } else{
        const teamData = gameData.teams;
        const numTeams = gameData.num_teams;
        if (teamData == null){
          console.log("No teams loaded yet");
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
            console.warn("NO Teams???")
            this.setState({gameError: 'Error No Teams'})
          } else {
            //console.log("Got Teams")
          }
        }
          return(
            <View style= {{backgroundColor:'white', borderTopColor: 'white'}}>
            {this.renderTeamHeader(teamData)}
            </View>
          
          )
        }
    }
  }
  renderSelfStats(gameData){
    var  gameStats = gameData.stats;
    //console.log("AllStats",gameData.game);
    if (gameData.game == undefined || gameData.game == null){
      console.log("No Stats Defined yet")
    } else{
      gameStats = gameData.game.stats;
    }
    
    const userData = this.state.userData;
    let myStats = null;
    if (userData == null){
      console.log("User Data null")
    }else{
      //console.log("Getting stats",gameStats,this.state.userData)
      myStats = this.getSelfStatsFromUsername(gameStats,this.state.userData.username);
    }
    //console.log("myStats",myStats,gameStats)
    if (myStats == null){
      return(
        <Card title="Loading User Stats.." containerStyle={{borderWidth:1,}}>
            <ActivityIndicator size="large" color="#61578b"
              style = {{
                  paddingTop: 30,
                  justifyContent: 'center', 
                  alignContent: 'center'
              }} />
          </Card>
      )}
      else if (myStats == 0){
        //console.log("youre not in this game");
        return(
          <Card title="Error Loading Your data" containerStyle={{borderWidth:1, borderColor: 'red'}}>
              
            </Card>
        )
    } else{
      
      //console.log("Rendering stats",myStats);
      var numKills = 0;
      if (gameData.style == 'team'){
         numKills = myStats.killed.length;
      }
      const username = myStats.player_username;
      const lives = (myStats.remaining_lives == -1) ? '∞' :myStats.remaining_lives;
      const color = myStats.team_color; // Can get iffy... use individual Color?
      const points = myStats.points;
      const ammoCap = gameData.game.maxammo; // If -1: infinite
      const ammo = (ammoCap <= 0) ? '∞' : (ammoCap - myStats.rounds_fired);
      // Add dynamic color based on lives/points/ammo
      return(
        <View>
        <Card title={username} titleStyle={{fontSize: 25}} containerStyle={{ margin: 4, borderWidth:1, borderTopColor: color, borderTopStartRadius: 10, borderTopEndRadius: 10}}>
          <View style={{flexDirection: 'row', justifyContent: 'space-around', borderColor: "#EEEEEE", borderWidth: 1, borderRadius: 10, borderBottomLeftRadius:0, borderBottomRightRadius:0,  borderBottomColor: "#FFFFFF"}}><Text style={{fontSize: 29, fontWeight: '200'}}>{points}</Text><Text style={{fontSize: 29, fontWeight: '200'}}>{numKills}</Text></View>
          <View style={{flexDirection: 'row', marginTop: -5, justifyContent: 'space-around', borderTopColor: "#FFFFFF", borderWidth: 1, borderRadius: 10, borderTopLeftRadius:0, borderTopRightRadius:0, borderBottomColor: "#EEEEEE", borderRightColor: "#EEEEEE", borderLeftColor: "#EEEEEE"}}><Text style={{fontSize: 15, fontWeight: '300'}}>Points</Text><Text style={{fontSize: 15, fontWeight: '300'}}>Kills</Text></View>
          <View style={{flexDirection: 'row', justifyContent: 'space-around',paddingTop: 5, margin: 5}}><View style={{flexDirection: 'row'}}><Icon color= 'red' name="heart" type="feather" size={40}></Icon><Text style={{fontSize: 35, fontWeight: 'bold'}}> {lives}</Text></View><View style={{flexDirection: 'row'}}><Icon name = 'ammunition' size = {35}  color= "black"  type = 'material-community'/><Text style={{fontSize: 35, fontWeight: 'bold'}}> {ammo}</Text></View></View>
        </Card>
          {this.renderKillFeed(gameData)}
        </View>
      )
    }
  }

  renderKillFeed(gameData){ // REnders kills a player may have
    //console.log("AllStats",gameData.stats); /** TODO: Get a better way to render this data list... new API request? */
    //return (<View></View>);;
    //killed":[{"id":4,"player_username":"Dr. You","killer_stats_id":12}]}
    const myStats = gameData.game.stats;
    //console.log("myStats",gameData);

    if (myStats == null){
      return(
        <Card title="Loading Kill Feed" containerStyle={{borderWidth:1,}}>
            <ActivityIndicator size="large" color="#61578b"
              style = {{
                  paddingTop: 30,
                  justifyContent: 'center', 
                  alignContent: 'center'
              }} />
          </Card>
      )
    } else{
      let kills = [];
      if (gameData.game.style == 'solo'){
        kills = [] /** ASK how to get kill stats  populagte after calling fire? */
      } else{
        kills = myStats.killed;
      }

      //console.log("Kills",kills)
      if (kills.length == 0){
        return (
          <Card title="Kill Feed" titleStyle={{fontSize: 25}} containerStyle={{ margin: 4, marginTop: 15, borderWidth:1, borderBottomStartRadius: 10, borderBottomEndRadius: 10}}>
          <Text>No Kills</Text>
          </Card>
        )
      }
      return(
        <Card title="Kill Feed" titleStyle={{fontSize: 25}} containerStyle={{ margin: 4, marginTop: 15, borderWidth:1, borderBottomStartRadius: 10, borderBottomEndRadius: 10}}>
        <FlatList
          listKey = "Kills"
          keyExtractor={this.DataKeyExtractor}
          data={flatListData}
          renderItem={this.renderKill}
          extraData={this.state}
        />
        </Card>
      )
    }
  }

  renderKill({item}){
    console.log("Rendering kill",item);
    const timeAgo = "3 mins ago";
    return(
      <ListItem
      key="header"
      containerStyle = {{
        backgroundColor: '#ae936c',
        margin: 0
      }}
      title="Kills"
      subtitle = {timeAgo}
      bottomDivider
    />
  )
  }

  renderGameDataCard = () =>{ /* More to come!!! */
    const gameData = this.state.gameData;
    if (gameData == null || gameData == undefined){
      return( 
      <View>
        <Card title="Loading" containerStyle={{borderWidth:20}}>
          <ActivityIndicator size="large" color="#61578b"
            style = {{
                paddingTop: 30,
                justifyContent: 'center', 
                alignContent: 'center'
            }} />
        </Card>
      </View>
      )
    } else { // Show Game Header (basic scoreboard)
      return( 
        <View>
            {this.renderSelfStats(gameData)}
        </View>
      )
    }
  }
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

  renderWinner = ({item}) =>{
    console.log("Renderin gwinere",item)
    // Get Info on winner depending on team or username
    return( /** Or just have the same thing from leaderrboard */
    <ListItem
          style= {{borderColor: "black", borderWidth: 1}}
          key = {item}
          title={item}
          titleStyle = {{fontSize: 14,color: 'black'}}
          containerStyle = {{
            backgroundColor: "#EEEEEE"
          }}
         subtitle="Winner" // Chage?
          subtitleStyle = {{
            fontSize: 9,
            color: "black"
            
          }}
          leftIcon={{ name: "user", type: 'feather', color: 'black'} /*Could be Avatar as well? or team/League indicator */}
        />
    )
  }

  renderGameWinners = (gameWinners) =>{ /** If it is team game, show teams and players?? solo, show playername */
    if (this.state.gameData.game.style == 'solo'){
      console.log("Renderiing winners",gameWinners);
      return (
          <FlatList
          listKey = "main"
          keyExtractor={this.DataKeyExtractor}
          data={gameWinners}
          renderItem={this.renderWinner}
          extraData={this.state}
    />
      )
    } else{
      return(
        <View></View>
      )
    }
    
  }
  renderEndGame = () => { /* Loads Game over data from state and yet*/
    const gameOver = this.state.gameOver;
    if (gameOver){
      const gameStats = this.state.endGameStats;
      const gameWinners = this.state.winners;
      console.log("Gameover visible",gameOver)
      return (
        <Overlay isVisible = {gameOver}>
          <View style={{ justifyContent: 'center', alignItems: 'center', flex: 5, padding: 1, backgroundColor: '#212021'}}>
              <Text style={{fontSize: 32, color: 'white'}}>Game Over</Text>
              <Text>Winners:</Text>
              {this.renderGameWinners(gameWinners)}
            </View>
         </Overlay>
      )
    }

  }
  DataKeyExtractor = (item, index) => index.toString()
  render() {
    flatListData = [{id: 0, name:"GameData", key: 1}];
    //console.log("Initial game Data",this.state.gameData);
    var gameData = this.state.gameData;
    var gameTime = null;
    if (gameData == null || this.isEmptyObject(gameData)){
        console.log("Game Data EMPTY",)
        gameData = {};
    } else{
      //console.log("SETTIng game Data");
      gameTime = gameData.time;
      gameData = gameData.game;
    }
    if (gameTime == null){
      //console.log("No time");
      gameTime = "not Set";
    }
    return(
      <ThemeProvider {...this.props}  theme={LaserTheme}>
        <CustomHeader {...this.props} refresh = {this.refresh} leaveGame = {this.leaveGame} headerText= "Match" headerType = "game" />
        <BluetoothManager ref={bleManager => {this.bleManager = bleManager}} {...this.props} getGunData = {this.getGunData} screen= "Game"></BluetoothManager>
        {this.renderEndGame()}
        {this.rendergameTimer(gameTime)}
        {this.renderGameHeader(gameData)}
        {this.renderTeamHeaders(gameData)}
       
        <FlatList
          listKey = "main"
          keyExtractor={this.DataKeyExtractor}
          data={flatListData}
          renderItem={this.renderGameDataCard}
          extraData={this.state}
        />
        <Button style= {{size: 4,
                        marginHorizontal: 10,
                        marginVertical: 5
                        
        }}
          title= "Fire"
          onPress={() => this.fireGun()}
          />
      
        </ThemeProvider>
      );
    }
  }
  
      
  