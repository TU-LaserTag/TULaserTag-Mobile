import React, { Component } from 'react';
import { StyleSheet, Text, View, AppRegistry, Image, TouchableOpacity, ScrollView } from 'react-native';
import MenuItem from './Menu_item'
import { Container, Header, Content, Card, CardItem, Body, Right, Button, Left} from 'native-base';
import Icon from 'react-native-vector-icons/AntDesign';

export default class ButtonMenu extends Component{
    renderItem = (text, i) => {
        const {onPressItem} = this.props
        //{console.log("Rendering",text,i)}
        const iconMap = ['link','earth','plussquareo']
        return ( 
                <Button raised={true} full iconLeft primary key={i} style = {styles.button} onPress={ () => onPressItem(i)}>
                <Icon name={iconMap[i]}/>
               
                <Text style = {styles.buttonText} key={i}> {text}</Text>
                </Button>
            
        )
    }

    render(){
        const {menuOptions} = this.props
        return (
            <View style= {styles.MenuStyle}>
                {menuOptions.map(this.renderItem)}
            </View>
        )
    }
}

const styles = StyleSheet.create({
    MenuStyle: {
        //flex: 10,
        flexDirection: 'column',  
        marginTop: 20,
        marginBottom: 20,
        justifyContent: 'space-evenly',
        alignItems: 'center',
        backgroundColor: 'gray',
    },  
    button: {
        marginTop: 10,
        marginBottom: 30,
        alignItems: "center",
        justifyContent: 'center',
        backgroundColor: 'purple',
        borderRadius: 20, // 0-50
        borderColor: 'white'
    },
    buttonText: {
        color: 'white',
        fontSize: 24
    }
  
  });