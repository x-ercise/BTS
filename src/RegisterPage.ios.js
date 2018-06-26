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
            jsonObj     : {},
        }
        this.onContinue = this.onContinue.bind(this)
    }
    
    componentDidMount() {
        Promise.all([this.getCredential()])
        .then(() => {
            this.setState({ loading : false })
        })
        
    }
    
    onContinue = () => {

        Keyboard.dismiss()
        const { user, passwd, endpoint } = this.state
        
        if (user && passwd) {
            let queryString = endpoint + ApiUtils.urlRegisterTest + user + '|' + passwd + '||'
            Promise.all([
                this.onSubscribe(queryString),

            ])
            .then(() => {
                this.setState({ loading : false })
            })
            .catch((error) => {
                this.setState({ loading : false })
            })
        } else {
            this.setState({ loading : false })
            Alert.alert(
                'Form required'
                , 'Please entry username or password'
                , [{ text : 'Dismiss', onPress: () => {} }]
                , { cancelable: false }
            )
        }
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

    onSubscribe = (queryString) => {
        try {
            this.setState({ loading : true })
            const strUrl = queryString
            
            Promise.all([this.onFetch(strUrl)])
            .then(() => {
                const { user, passwd, endpoint, jsonObj } = this.state
                let jsonError = jsonObj.ErrorView  //IsError, Code, Message, Detail, Api, Verb, StackTrace, ErrorObject
                let jsonData = jsonObj.Datas.Data1 //Message,UserName, Password, FingerPrint1, FingerPrint2, MobileToken, RedirectUrl, SampleMobileToken
                
                if (jsonError.IsError) {
                    Alert.alert(
                        'Error'
                        , jsonError.Message
                        , [{ text : 'Dismiss', onPress: () => {} }]
                        , { cancelable: false }
                    )
                } else {
                    this.setState({
                        finger1     : jsonData.FingerPrint1,
                        finger2     : jsonData.FingerPrint2,
                        accessToken : jsonData.MobileToken
                    })
                    let services = JSON.stringify({
                        endpoint : endpoint,
                        password : passwd,
                        accessToken : jsonData.MobileToken
                    })
                    
                    Alert.alert('Infomation', jsonData.Message,
                        [{ text : 'Agree', onPress: async() => await this.setCredential(user, services) }]
                    )
                    
                }
            })

        } catch (error) {
            this.onProxyError(error)
        }
    }
    onProxyDone = (objJson) =>  {
        this.setState({ loading : false })
        const { user, passwd, endpoint } = this.state
        let jsonError = objJson.ErrorView  //IsError, Code, Message, Detail, Api, Verb, StackTrace, ErrorObject
        let jsonData = objJson.Datas.Data1 //Message,UserName, Password, FingerPrint1, FingerPrint2, MobileToken, RedirectUrl, SampleMobileToken
        
        if (jsonError.IsError) {
            Alert.alert(
                'Error'
                , jsonError.Message
                , [{ text : 'Dismiss', onPress: () => {} }]
                , { cancelable: false }
            )
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
                [{ text : 'Agree', onPress: async() => await this.setCredential(user, services) }]
            )
        }
    }
    onProxyError = (error) => {
        this.setState({ loading : false })
        if (error.response && !error.response.ok)
            Alert.alert(
                'Network error'
                , error.response.status + ' access service'
                , [{ text : 'Dismiss', onPress: () => {} }]
                , { cancelable: false }
            )
        else 
            Alert.alert(
                'Network error'
                , error.message
                , [{ text : 'Dismiss', onPress: () => {} }]
                , { cancelable: false }
            )
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
            this.setState({ loading : false })
            await Keychain.setGenericPassword(username, services).done(() => {
                Actions.login()
            })
        } catch (error) {
            if(error === 'INVALID_CREDENTIALS')
                Keychain.resetGenericPassword()
                
            Alert.alert(
                'Keychain couldn\'t be accessed!'
                , error
                , [{ text : 'Dismiss', onPress: () => {} }]
                , { cancelable: false }
            )
        }
    }
    getCredential = async() => {
        
        try {
            this.setState({ loading : false })

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
                    Alert.alert(
                        'error'
                        ,'No credentials stored'
                        , [{ text : 'Dismiss', onPress: () => {} }]
                        , { cancelable: false }
                    )
                }
            } else {
                //Alert.alert('error2', 'No credentials stored', [{ text : 'Dismiss' }])
                let ep = (!credentials.endpoint && "http://spwwebapi.azurewebsites.net/api")
                this.setState({
                    endpoint : ep
                })
            }

        } catch (error) {
            
            Alert.alert(
                'Keychain couldn\'t be accessed!'
                , error
                , [{ text : 'Dismiss', onPress: () => {} }]
                , { cancelable: false }
            )
        }
      
    }

    render() {
        const {user, passwd, endpoint, loading } = this.state

        return (
            <View style={styles.container}>
                <Loader loading={loading} />
                <KeyboardAvoidingView behavior="padding">
                    <View style={styles.caption}>
                        <Text>Fingerprint Registration (only first time)</Text>
                    </View>
                    <View styles={styles.form}>
                        <TextInput
                            dataDetectorType = "link"
                            autoCapitalize = 'none'
                            placeholder    ="input end point service address"
                            style          ={styles.input}
                            value          ={this.state.endpoint}
                            onChangeText   ={(text) => this.setState({endpoint : text})}
                            value          ={this.state.endpoint} />
                        <TextInput
                            placeholder    ="input username"
                            autoCapitalize = 'none'
                            style          ={styles.input}
                            value          ={this.state.user}
                            onChangeText   ={(text) => this.setState({user : text})}
                            value          ={this.state.user} />
                        <TextInput
                            placeholder    ="input password"
                            autoCapitalize = 'none'
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
