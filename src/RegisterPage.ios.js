import React from 'react'
import { 
    Alert, StyleSheet
    , View, Text, TextInput
    , KeyboardAvoidingView
    , TouchableOpacity, Keyboard
} 
from 'react-native'
import * as Keychain from 'react-native-keychain'
import { Actions }   from 'react-native-router-flux'
import Loader        from './Components/Loader'
import ApiUtils      from './Services/ApiUtils'


const ACCESS_CONTROL_OPTIONS = ['None', 'Passcode', 'Password']
const ACCESS_CONTROL_MAP = [null, 
Keychain.ACCESS_CONTROL.DEVICE_PASSCODE, 
Keychain.ACCESS_CONTROL.APPLICATION_PASSWORD, 
Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET]

export default class RegisterPageIOS extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            user        : '',
            passwd      : '',
            finger1     : undefined,
            finger2     : undefined,
            accessToken : '',
            endpoint    : '',
            loading     : false,
        }

    }
    
    componentDidMount() {
        this.getCredential()
    }
    
    onContinue = () => {
        Keyboard.dismiss()
        const { user, passwd, endpoint } = this.state

        if (user && passwd) {
            let queryString = endpoint + ApiUtils.urlRegisterTest + user + '|' + passwd + '||'
            this.onSubscribe(queryString)
        } else {
            Alert.alert('Form required', 'Please entry username or password', [{ text : 'Dismiss' }])
        }
    }
    
    onSubscribe = async(queryString) => {
        try {

            const strUrl = queryString
            //this.setState({ loading : true })

            let objJson = await fetch(strUrl, ApiUtils.optionPOST)
                                .then(ApiUtils.checkStatus)
                                .then(response => response.json())
                                .catch((error) => this.onProxyError(error))
                                
            setTimeout(() => {
                if (objJson) {
                    this.onProxyDone(objJson)
                }
            }, 5000)
        
        } catch (error) {
            Alert.alert("Network error", error.message, [{ text : 'Dismiss' }])
        }
    }
    onProxyDone = (objJson) =>  {
        //this.setState({ loading : false })
        const { user, passwd, endpoint } = this.state
        let jsonError = objJson.ErrorView  //IsError, Code, Message, Detail, Api, Verb, StackTrace, ErrorObject
        let jsonData = objJson.Datas.Data1 //Message,UserName, Password, FingerPrint1, FingerPrint2, MobileToken, RedirectUrl, SampleMobileToken
        
        if (jsonError.IsError) {
            Alert.alert('Error', jsonError.Message, [{ text : 'Dismiss' }])
        } else {
            this.setState({
                finger1     : jsonData.FingerPrint1,
                finger2     : jsonData.FingerPrint2,
                accessToken : jsonData.MobileToken,
            })
            let services = JSON.stringify({
                endpoint : endpoint,
                password : passwd,
                accessToken : jsonData.MobileToken
            })
            Alert.alert('Infomation', jsonData.Message,
                [{ text : 'Agree', onPress: () => this.setCredential(user, services) }]
            )
        }
    }
    onProxyError = (error) => {
        this.setState({ loading : false })
        if (error.response && !error.response.ok)
            Alert.alert('Network error', error.response.status + ' access service', [{ text : 'Dismiss' }])
        else 
            Alert.alert('Network error', error.message, [{ text : 'Dismiss' }])
    }
    setCredential = async(username, services) => {
        try {
            const credentials = await Keychain.getGenericPassword()
            if (credentials) {
                if (credentials.username == this.state.user)
                    await Keychain.resetGenericPassword()
            } else {
                //console.log('No credentials stored')
            }
            await Keychain.setGenericPassword(username, services).done(() => {
                Actions.login()
            })
        } catch (error) {
            if(error === 'INVALID_CREDENTIALS')
                Keychain.resetGenericPassword()
                
            Alert.alert('Keychain couldn\'t be accessed!', error)
        }
    }
    getCredential = async() => {

        try {
            const credentials = await Keychain.getGenericPassword()
            if (credentials) {
                const { endpoint, password, accessToken } = JSON.parse(credentials.password)
                if ( endpoint && accessToken && password ) {
                    this.setState({
                        user        : credentials.username,
                        passwd      : password,
                        accessToken : accessToken,
                        endpoint    : endpoint 
                    })
                } else {
                    Alert.alert('error','No credentials stored', [{ text : 'Dismiss' }])
                }
            } else {
                //Alert.alert('error2', 'No credentials stored', [{ text : 'Dismiss' }])
                let ep = (!credentials.endpoint && "http://spwwebapi.azurewebsites.net/api")
                this.setState({
                    endpoint : ep
                })
            }

        } catch (error) {
            Alert.alert('Keychain couldn\'t be accessed!', error)
        }
      
    }

    render() {
        const {user, passwd, endpoint } = this.state

        return (
            <View style={styles.container}>
                <Loader loading={this.state.loading} />
                <KeyboardAvoidingView behavior="padding">
                    <View style={styles.caption}>
                        <Text>Fingerprint Registration (only first time)</Text>
                    </View>
                    <View styles={styles.form}>
                        <TextInput
                            dataDetectorType = "link"
                            placeholder    ="input end point service address"
                            style          ={styles.input}
                            value          ={this.state.endpoint}
                            onChangeText   ={(text) => this.setState({endpoint : text})}
                            value          ={this.state.endpoint} />
                        <TextInput
                            placeholder    ="input username"
                            style          ={styles.input}
                            value          ={this.state.user}
                            onChangeText   ={(text) => this.setState({user : text})}
                            value          ={this.state.user} />
                        <TextInput
                            placeholder    ="input password"
                            style          ={styles.input}
                            secureTextEntry={true}
                            onChangeText   ={(text) => this.setState({passwd: text})}
                            value          ={this.state.passwd} />
                        <TouchableOpacity 
                            style  ={styles.buttonContainer}
                            onPress={ this.onContinue }>
                            <Text style={styles.buttonText}>SUBMIT</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexGrow: 1,
        flexDirection: 'column',
        padding:30,
        backgroundColor: '#F5FCFF',
    },
    backgroundImage: {
        flex: 1,
        flexGrow: 1,
        flexDirection: 'row',
        position: 'absolute',
        justifyContent: 'center',
        resizeMode: 'stretch',
    },
    caption: {
        padding:10,
        paddingVertical:40,
        flexDirection: 'row',
        justifyContent : 'center',
        alignItems     : 'center',
    },
    form: {
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    input: {
        height: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginBottom:20,
        color: '#111',
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: '#999999',
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
    },
    buttonContainer: {
        backgroundColor: '#2980b9',
        paddingVertical:15,
        marginTop: 40,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    buttonText: {
        textAlign:'center',
        color:'#FFFFFF',
        fontWeight: '700'
    },

})
