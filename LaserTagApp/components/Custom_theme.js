import { ThemeProvider} from 'react-native-elements';
// Color pallet
//#ae936c gold-brown
//#61578b -- Default Purple
//#209cee -- Main Blue
// #4a4a4a TExt colot
export const LaserTheme = {
    Button: {
      raised: true,
      titleStyle: {
        color: 'white',
      },
      buttonStyle: {
        backgroundColor: '#209cee',
        // Types of bluues
        //#00aeef
        //#6ecff6
        //#209cee -- Main blue
      }
    },
    Container: {
        backgroundColor: '#ae936c'
    },
    Header:{
        backgroundColor:'#61578b'
        // Types of purples:
        //#61578b -- Default
        //#4d2c4c
        //#5a3358
    },
    Input:{
        errorStyle:{
            color:'red'
        },
        containerStyle:{
            backgroundColor: 'white'
        },
        leftIconContainerStyle:{
            backgroundColor: 'white',
            marginRight: 8,
            marginLeft: 3

        },
        backgroundColor: 'white'
    },
    Footer:{
      backgroundColor: '#61578b'
    }
    
  };
