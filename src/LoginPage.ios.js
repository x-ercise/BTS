import React from 'react'
import { 
    Alert, Image, StyleSheet, 
    View, Text, Linking, 
    TouchableOpacity
} from 'react-native'
import * as Keychain      from 'react-native-keychain'
import { Actions }        from 'react-native-router-flux'
import FingerprintScanner from 'react-native-fingerprint-scanner'
import RNExitApp          from 'react-native-exit-app'
import Loader             from './Components/Loader'
import ApiUtils           from './Services//ApiUtils'
import ShakingText        from './Components/ShakingText'

export default class LoginPageIOS extends React.Component {
    
    constructor(props) {
        super(props)
        this.state = {
            user           : '',
            endpoint       : '',
            password       : '',
            accessToken    : '',
            errorMessage   : undefined,
            sensorPrompted : false,
            loading        : false,
            jsonObj        : {}
        }
    }

    handleFingerprintMessageShowed = () => {
        this.setState({ sensorPrompted: false })
    }

    handleFingerprintMessageDismissed = () => {
        
        if (this.state.accessToken.length > 0) {
            this.setState({ sensorPrompted: true, errorMessage: '' })
            this.onFingerListening()
        } else {

        }
        
    }

    componentWillUnmount() {
        FingerprintScanner.release()
    }
    componentDidMount() {

        Promise.all([
            this.getCredential(), 
            FingerprintScanner.isSensorAvailable().catch(error => this.setState({ errorMessage: error.message }))
        ])
        .then(() => {
            this.onFingerListening()
        })
        .catch(error => {
            RNExitApp.exitApp()
        })
    }
    handleAuthenticationAttempted = (error) => {
        this.setState({errorMessage: error.message})
        this.onFingerListening()
    }
    onFingerListening = () => {
        FingerprintScanner
        .authenticate({ onAttempt: this.handleAuthenticationAttempted })
        .then(() => this.onRedirect())
        .catch((error) => this.setState({ sensorPrompted: false, errorMessage: error.message }))
    }
    
    async onFetch(queryString) {
        const strUrl = queryString
        await fetch(strUrl, ApiUtils.optionPOST)
            .then(ApiUtils.checkStatus)
            .then(response => response.json())
            .then(json => {
                this.setState({
                    jsonObj : json,
                    loading : false
                })
            })
            .catch((error) => this.onProxyError(error))
    }

    onRedirect = () => {
        try {
            this.setState({ loading : true })
            const { user, endpoint, accessToken } = this.state
            let strUrl = endpoint + ApiUtils.urlLogin + accessToken

            Promise.all([this.onFetch(strUrl)])
            .then(() => {
                const objJson = this.state.jsonObj
                if (objJson)
                    this.onProxyDone(objJson)
            })

        } catch (error) {
            Alert.alert("error", error)
        }
    }
    onProxyDone = (objJson) => {
        let jsonError = objJson.ErrorView  //IsError, Code, Message, Detail, Api, Verb, StackTrace, ErrorObject
        let jsonData = objJson.Datas.Data1 //Message,UserName, Password, FingerPrint1, FingerPrint2, MobileToken, RedirectUrl, SampleMobileToken
        
        if (jsonError.IsError) {
            Alert.alert('Error', jsonError.Message,
                [{ text: 'DISMISS', onPress: () =>  this.onFingerListening() }]
            )
        } else {
            this.openBrowser(jsonData.RedirectUrl)
        }
    }
    onProxyError = (error) => {
        if (error.response && !error.response.ok) {
            Alert.alert('Network error', error.response.status + ' access service', [{ text : 'Dismiss' }])
        } else {
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
    openBrowser = (url) => {
        Linking.canOpenURL(url).then(supported => {
            if (!supported) {
                Alert.alert('Can\'t handle url: ' + url)
            } else {

                Linking.openURL(url)
                .then(resolve => {
                    RNExitApp.exitApp()
                })
                
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
                            onPress={this.handleFingerprintMessageDismissed}>
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
        flex           : 1,
        flexGrow       : 0.3,
        flexDirection  : 'row',
        alignItems     : 'center',
    },
    rowBody: {
        flex           : 1,
        flexGrow       : 0.7,
        flexDirection  : 'row',
        alignItems     : 'center',
        justifyContent : 'center',
        marginBottom   : 10,
    },
    rowFooter: {
        flex           : 0.1,
        flexGrow       : 0.1,
        flexDirection  : 'row',
        justifyContent : 'flex-end',
        
    },
    logo: {
        //marginTop : 70,
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