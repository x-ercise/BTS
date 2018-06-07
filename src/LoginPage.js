import React, { Component, PropTypes } from 'react'
import { 
    Alert, Image, StyleSheet, 
    View, Text, Linking, ViewPropTypes, 
    Platform, Dimensions, TouchableOpacity
} from 'react-native'
import * as Keychain      from 'react-native-keychain'
import { Actions }        from 'react-native-router-flux'
import FingerprintScanner from 'react-native-fingerprint-scanner'
import RNExitApp          from 'react-native-exit-app'
import Loader             from './Components/Loader'
import ApiUtils           from './Services//ApiUtils'
import ShakingText        from './Components/ShakingText'

export default class LoginPage extends React.Component {
    
    constructor(props) {
        super(props)
        this.state = {
            user           : '',
            endpoint       : '',
            password       : '',
            accessToken    : '',
            errorMessage   : undefined,
            sensorPrompted : false,
            loading        : false
        }
    }

    handleFingerprintMessageShowed = () => {
        this.setState({ sensorPrompted: false })
    }

    handleFingerprintMessageDismissed = () => {
        this.setState({ sensorPrompted: true, errorMessage: '' })
    }

    componentWillUnmount() {
        FingerprintScanner.release()
    }
    componentDidMount() {
        this.getCredential()
        .then(() => {
            FingerprintScanner
            .isSensorAvailable()
            .catch(error => this.setState({ errorMessage: error.message }))
        })
        this.onFingerListening()
    }
    handleAuthenticationAttempted = (error) => {
        this.setState({errorMessage: error.message})
        this.onFingerListening()
    }
    onFingerListening = () => {
        FingerprintScanner
        .authenticate({ onAttempt: this.handleAuthenticationAttempted })
        .then(() => this.onRedirect())
        .catch((error) => { this.handleAuthenticationAttempted(error) })
    }
    
    onRedirect = async() => {
        try {
            const { user, endpoint, accessToken } = this.state
            let strUrl = endpoint + ApiUtils.urlLogin + accessToken

            this.setState({ loading : true })
            let objJson = await fetch(strUrl, ApiUtils.optionPOST)
                                .then(ApiUtils.checkStatus)
                                .then(response => response.json())
                                .catch((error) => this.onProxyError(error))
            

            setTimeout(() => {
                if (objJson)
                    this.onProxyDone(objJson)
            }, 2500)
        
        } catch (error) {
            Alert.alert("error", error)
        }
    }
    onProxyDone = (objJson) => {
        this.setState({ loading : false })
        let jsonError = objJson.ErrorView  //IsError, Code, Message, Detail, Api, Verb, StackTrace, ErrorObject
        let jsonData = objJson.Datas.Data1 //Message,UserName, Password, FingerPrint1, FingerPrint2, MobileToken, RedirectUrl, SampleMobileToken
        
        if (jsonError.IsError) {
            Alert.alert('Error', jsonError.Message,
                [{ text: 'DISMISS', onPress: () =>  this.onFingerListening() }]
            )
        } else {
            /*
            Alert.alert(
                'Authentication', jsonData.Message,
                [
                    { text: 'LET\'s GO', onPress: () => this.openBrowser(jsonData.RedirectUrl)},
                    { text: 'DISMISS', onPress: () =>  this.onFingerListening() }
                ]
            )
            */
            this.openBrowser(jsonData.RedirectUrl)
        }
    }
    onProxyError = (error) => {
        this.setState({ loading : false })
        if (error.response && !error.response.ok)
            Alert.alert('Network error', error.response.status + ' access service', [{ text : 'Dismiss' }])
        else {
            Alert.alert('Network error', error.message, [{ text : 'Dismiss' }])
            Actions.register()
        }
    }
    getCredential = async() => {

        try {
            const credentials = await Keychain.getGenericPassword()
            if (credentials) {
                const { endpoint, accessToken } = JSON.parse(credentials.password)
                if ( endpoint && accessToken ) {
                    this.setState({
                        user       : credentials.username,
                        accessToken: accessToken,
                        endpoint   : endpoint
                    })
                } else {
                    //console.log('No credentials stored')
                    Actions.register()
                }
            } else {
                //console.log('No credentials stored')
                Actions.register()
            }
        } catch (error) {
            Alert.alert('Keychain couldn\'t be accessed!', error)
            if(error === 'INVALID_CREDENTIALS')
                Keychain.resetGenericPassword()
            Actions.register()
        }
      
    }
    removeCredential = async() => {
        await Keychain.resetGenericPassword()
    }
    openBrowser = async (url) => {
        Linking.canOpenURL(url).then(supported => {
            if (!supported) {
                Alert.alert('Can\'t handle url: ' + url)
            } else {
                return Linking.openURL(url) && RNExitApp.exitApp()
            }
        }).catch(error => Alert.alert('An error occurred', error))
    }

    render() {
        const { 
            user           ,
            accessToken    ,
            errorMessage   ,
            sensorPrompted ,
            loading
         } = this.state
 
        return (

            <View style={styles.container}>
                <Loader loading={loading} />
                <View style={styles.rowHeader}>
                    <Image  
                        style     ={styles.logo} 
                        resizeMode='contain' 
                        source    ={require('./assets/bts_logo.png')} />
                </View>
                <View style={styles.rowBody}>
                    <View style={{
                        flexDirection : 'column',
                        alignItems     : 'center',
                        justifyContent : 'center',
                        }}>
                        <TouchableOpacity
                            style  ={styles.fingerprint}
                            onPress={this.handleFingerprintMessageShowed}>
                            <Image source={require('./assets/finger_print.png')} />
                        </TouchableOpacity>
                        <Text>{ sensorPrompted? 'Touch sensor': 'Touch sensor again' }</Text>
                        {errorMessage && (
                            <View style={styles.messageContainner}>
                                <Text style={styles.errorMessage}>
                                    <ShakingText ref={(instance) => { this.description = instance }}>
                                        {errorMessage || 'Scan your fingerprint on the\ndevice scanner to continue'}
                                    </ShakingText>
                                </Text>
                            </View>
                        )}
                    </View>
                    
                </View>
                <View style={styles.rowFooter}>
                    <TouchableOpacity onPress={Actions.register}>
                        <Text>go to register</Text>
                    </TouchableOpacity>
                </View>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex           : 1,
        flexDirection  : 'column',
        justifyContent : 'center',
        alignItems     : 'center',
        backgroundColor: '#F5FCFF',
    },
    rowHeader: {
        flex           : 0.3,
        flexDirection  : 'row',
    },
    rowBody: {
        flexGrow       : 1,
        flexDirection  : 'row',
    },
    rowFooter: {
        flex           : 0.1,
        flexDirection  : 'row',
        justifyContent : 'flex-end',
        marginBottom   : 10,
    },
    logo: {
        marginTop : 20,
        width : 500,
        height: 90,
    },
    fingerprint: {
        padding       : 20,
        marginVertical: 30,
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
    }

})