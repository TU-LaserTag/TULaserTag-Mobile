import React, { Component } from 'react';
import { StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/AntDesign';
import LaserTheme from './Custom_theme'
import {Content } from 'native-base';
import { Text, ThemeProvider, Button, Card, Image, ListItem} from 'react-native-elements';
import AppImages from "../assets/index"

export default class ButtonMenu extends Component{
    renderItem = (text, i) => {
        const {onPressItem} = this.props
        {console.log("Rendering",text,i)}
        const iconMap = ['link','earth','plussquareo'] // Maybe remove Icons in future 
        const imageMap = [AppImages['manage'],AppImages['join'],AppImages['host']] // TODO: Replace these
        const descriptionMap = ['Connect, disconnect, or manage laser gun','View public games or search for private games','Create and edit settings for a game'] // Maybe remove Icons in future
        console.log("Rendering")
        return ( 
            <Content>
                <Card
                    title={text}
                    image={<Image 
                                source = { imageMap[i]}
                                style = {{ width: 200, height: 200}}
                    
                            />}>
                    <Text style={{marginBottom: 10}}>
                        {descriptionMap[i]}
                    </Text>
                
                <Button 
                icon={
                    <Icon
                    name = {iconMap[i]}
                    size=  {15}
                    color= "white"
                    type = 'antDesign'
                    />}
                title= {text}
                onPress={ () => onPressItem(i)}>
                </Button>
                </Card>
                </Content>
               
            
        )
    }

    render(){
        const {menuOptions} = this.props
        return (
            <ThemeProvider theme={LaserTheme}>
            <View style= {styles.MenuStyle}>
                {menuOptions.map(this.renderItem)}
            </View>
            </ThemeProvider>
        )
    }
}

const styles = StyleSheet.create({
    MenuStyle: {
        flex: 10,
        flexDirection: 'column',  
        marginTop: 20,
        marginBottom: 20,
        justifyContent: 'space-evenly',
        alignItems: 'center',
        backgroundColor: 'white',
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