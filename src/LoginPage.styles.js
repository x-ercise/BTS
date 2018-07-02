import { Dimensions, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');

export default StyleSheet.create({

    container: {
        flex           : 1,
        flexDirection  : 'column',
        justifyContent : 'center',
        alignItems     : 'center',
        backgroundColor: '#F5FCFF',
    },
    rowHeader: {
        flex           : 1,
        flexGrow       : 0.2,
        alignItems     : 'center',
        justifyContent : 'center',
    },
    rowBody: {
        flex           : 1,
        flexGrow       : 0.7,
        alignItems     : 'center',
        justifyContent : 'center',
        marginBottom   : 10,
    },
    rowFooter: {
        flex           : 0.1,
        flexGrow       : 0.1,
        justifyContent : 'flex-end',
        justifyContent : 'center'
        
    },
    logo: {
        //marginTop : 70,
        width : 500,
        height: 90,
    },
    fingerprint: {
        padding       : 10,
        marginVertical: 10,
    },
    messageContainner: {
        padding       : 20,
        justifyContent: 'flex-end',
    },
    errorMessage: {
        //color           : '#ea3d13',
        color           : '#ea3c00',
        fontSize        : 13,
        textAlign       : 'center',
        marginHorizontal: 10,
        marginTop       : 30,
    },
    popup: {
        width: width * 0.8,
    }

})