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
import styles             from './LoginPage.styles'
import FingerprintPopup   from './Components/FingerprintPopup.android'
import Loader             from './Components/Loader'
import ApiUtils           from './Services/ApiUtils'
import bts_logo           from './assets/bts_logo.png'
import finger_print       from './assets/finger_print.png'

export default class LoginPageAndroid extends React.Component {
      
    constructor(props) {
        super(props)
        this.state = {
            user           : '',
            endpoint       : '',
            password       : '',
            accessToken    : '',
            popupShowed    : false,
            errorMessage   : undefined,
            sensorPrompted : false,
            loading        : false,
            myKeychain     : {},
            apiData        : {}
        }

        this.handleFingerprintShowed = this.handleFingerprintShowed.bind(this)
        this.handleFingerprintDismissed = this.handleFingerprintDismissed.bind(this)
    }

    handleFingerprintShowed = () => {
        this.setState({ popupShowed: true })
    }

    handleFingerprintDismissed = (isAuthenticated) => {
        const { user, endpoint, accessToken } = this.state
        
        if (isAuthenticated === true) {
            this.setState(...this.state, { popupShowed: false })    
            let strUrl = endpoint + ApiUtils.urlLogin + accessToken

            this.onFetch(strUrl)
            .then(() => {
                const apiData = this.state.apiData
                if (JSON.stringify(apiData) !== "{}")
                    this.onProxyDone(apiData)
            })
        }
        else if (isAuthenticated !== true && isAuthenticated !== false) { //return object from popup, when scan fails over limit of OS.  
            Alert.alert('Escape the BTS', 'You have too try attmempted, \nwait few a minutes to try it again', [
                { text : 'Close App', onPress :  () => RNExitApp.exitApp()  }
            ])
        
        }

    }
    componentDidMount() {
        this.setState( ...this.state, { loading : true })
        FingerprintScanner
        .isSensorAvailable()
        .then(isSensor => this.setState( ...this.state, { loading : false, sensorPrompted : true }))
        .then(() => this.getCredential())
        .catch(error => this.setState({ loading : false, errorMessage: error.message }))
    }
    getCredential = async() => {
        this.setState({ loading : true })

        await Keychain.getGenericPassword()
        .then(myCredential => {
            const key = JSON.parse(myCredential.password)
            this.setState( ...this.state, {
                loading     : false,
                user        : key.username,
                password    : key.password,
                accessToken : key.accessToken,
                endpoint    : key.endpoint,
                myKeychain  : JSON.stringify(key),
            })
        })
        .catch(error => {
            if(error === 'INVALID_CREDENTIALS') {
                
            }
            this.setState( ...this.state, {
                loading     : false,
            })
            Keychain.resetGenericPassword().then(() => {
                Actions.register()
            })
        })
        //this.setState({ loading : true })
        /*
        try {
            let credentials = await Keychain.getGenericPassword()

            if (credentials) {
                const { endpoint, username, accessToken } = JSON.parse(credentials.password)
                if ( endpoint && accessToken ) {
                    this.setState({
                        user       : username,
                        accessToken: accessToken,
                        endpoint   : endpoint,
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
            if(error === 'INVALID_CREDENTIALS') {
                await Keychain.resetGenericPassword()
            }
            Actions.register()
        }
        */
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
    openBrowser = (url) => {
        Linking.canOpenURL(url).then(supported => {
            if (!supported) {
                Alert.alert('Can\'t handle url: ' + url)
            } else {
                Linking.openURL(url).then(() => {
                    RNExitApp.exitApp()
                })
            }
        }).catch(error => Alert.alert('An error occurred', error))
    }
    setJsonResponse = (jsonObj) => {
        this.setState( ...this.state, { apiData : jsonObj, loading : false })
    }
    onFetch = async(queryString) => {
        this.setState( ...this.state, { loading : true })

        const strUrl = queryString
        await fetch(strUrl, ApiUtils.optionPOST)
            .then(ApiUtils.checkStatus)
            .then(response => response.json())
            .then(jsonObj => this.setJsonResponse(jsonObj))
            .catch((error) => {
                this.setState( ...this.state, { loading : false })
                Alert.alert('Error', error.message, [
                    { text: 'Dismiss' }
                ], { cancelable: false })
            })
        
    }

    render() {
        const { 
            user           ,
            accessToken    ,
            errorMessage   ,
            sensorPrompted,
            popupShowed
         } = this.state
 
        return (

            <View style={styles.container}>
                <Loader loading={this.state.loading} />
                <View style={styles.rowHeader}>
                    <Image  
                        style     ={styles.logo} 
                        resizeMode='contain' 
                        source    ={bts_logo} />
                </View>
                <View style={styles.rowBody}>
                    <View style={{
                        flexDirection : 'column',
                        alignItems     : 'center',
                        justifyContent : 'center',
                        }}>
                        {!popupShowed && (
                            <View style={{
                                    flexDirection : 'column',
                                    alignItems     : 'center',
                                    justifyContent : 'center',
                                    }}>
                                <TouchableOpacity style  ={styles.fingerprint} onPress={this.handleFingerprintShowed}>
                                    <Image source={finger_print} />
                                </TouchableOpacity>
                                <Text>{ sensorPrompted? 'Touch sensor': 'Tap on finger button and Touch sensor' }</Text>
                            </View>
                        )}
                        
                        {
                            errorMessage && (
                            <View style={styles.messageContainner}>
                                <Text style={styles.errorMessage}>
                                    { errorMessage || 'Scan your fingerprint on the\ndevice scanner to continue'}
                                </Text>
                            </View>
                        )}

                        {popupShowed && (
                            <FingerprintPopup
                                style={styles.popup}
                                handlePopupDismissed={this.handleFingerprintDismissed}
                            />
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