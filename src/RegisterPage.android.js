import React from 'react'
import { 
    Alert, StyleSheet
    , View, Text, TextInput, Image
    , KeyboardAvoidingView
    , TouchableOpacity, Keyboard
} 
from 'react-native'
import * as Keychain from 'react-native-keychain'
import { Actions }   from 'react-native-router-flux'
import Loader        from './Components/Loader'
import ApiUtils      from './Services/ApiUtils'
import bts_logo      from './assets/bts_logo.png'

const credentialAppName = "BlessedTotalSolution"
//const defaultApi = "http://spwwebapi.azurewebsites.net/api"
const defaultApi = "http://192.168.1.252/SPWWebAPI/api"
export default class RegisterPageIOS extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            user        : '',
            passwd      : '',
            finger1     : undefined,
            finger2     : undefined,
            accessToken : '',
            endpoint    : defaultApi,
            loading     : false,
            myKeychain  : {},
            jsonObj     : {},
        }
        this.onContinue = this.onContinue.bind(this)
        this.onClearKeyChain = this.onClearKeyChain.bind(this)
        this.onGotoLogin = this.onGotoLogin.bind(this)
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
            Promise.all([
                this.onSubscribe(endpoint, user, passwd),
            ])
            .catch((error) => {
                this.setState({ loading : false })
            })
            .finally(() => {
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
    onClearKeyChain = async() => {
        this.setState({
            user        : '',
            passwd      : '',
            accessToken : '',
            endpoint    : defaultApi, 
        })
        await Keychain.resetGenericPassword()
    }
    onGotoLogin = () => {
        const { 
            user, 
            passwd,
            accessToken,
            endpoint,
            myKeychain
        } = this.state
        //check if have changed, save change before navigate to login
        if (
               (user        != myKeychain.username)
            || (passwd      != myKeychain.password)
            || (accessToken != myKeychain.accessToken)
            || (endpoint    != myKeychain.endpoint)
        ) {
            this.onSubscribe(endpoint, user, passwd)
        } else {
            Actions.login()
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
            .finally(() => {
                this.setState({ loading : false })
            })
    }

    onSubscribe = (endpoint, user, passwd) => {
        this.setState({ loading : true })
        try {
            const strUrl = endpoint + ApiUtils.urlRegisterTest + user + '|' + passwd + '||'
            
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
                        username : user,
                        endpoint : endpoint,
                        password : passwd,
                        accessToken : jsonData.MobileToken
                    })
                    
                    Alert.alert('Infomation', jsonData.Message,
                        [{ text : 'Agree', onPress: async() => await this.setCredential(services) }]
                    )
                    
                }
            })

        } catch (error) {
            this.onProxyError(error)
        } finally {
            this.setState({ loading : false })
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
    setCredential = async(services) => {
        
        try {
            const credentials = await Keychain.getGenericPassword()
            if (credentials) {
                if (credentials.username == this.state.user)
                    await Keychain.resetGenericPassword()
            } else {
                //console.log('No credentials stored')
            }
            this.setState({ loading : false })
            await Keychain.setGenericPassword(credentialAppName, services).done(() => {
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
        } finally {
            this.setState({ loading : false })
        }
    }
    getCredential = async() => {
        
        try {
            
            const credentials = await Keychain.getGenericPassword()
            if (credentials) {
                const { endpoint, username, password, accessToken } = JSON.parse(credentials.password)
                if ( endpoint && accessToken && password ) {
                    
                    this.setState({
                        user        : username,
                        passwd      : password,
                        accessToken : accessToken,
                        endpoint    : endpoint,
                        myKeychain  : credentials,
                    })
                    
                    this.setState({ myKeychain : credentials })
                } else {
                    Alert.alert(
                        'error'
                        ,'No credentials stored'
                        , [{ text : 'Dismiss', onPress: () => {} }]
                        , { cancelable: false }
                    )
                }
            }

        } catch (error) {
            
            Alert.alert(
                'Keychain couldn\'t be accessed!'
                , error
                , [{ text : 'Dismiss', onPress: () => {} }]
                , { cancelable: false }
            )
        } finally {
            this.setState({ loading : false })
        }

      
    }

    render() {
        const {user, passwd, endpoint, loading, accessToken } = this.state

        return (
            <View style={ styles.mainContainer }>
                <Loader loading={loading} />
                <View style={{ backgroundColor:'#f6f5f4', paddingVertical:7, alignItems:'center' }}>
                    <Image source={ bts_logo } style={{ width : 310, height: 90, }} />
                    <View style={{ alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                        <Text style={{ color:'#ee7636', fontStyle:'italic' }}>Fingerprint Authentication for ERP Web</Text>
                    </View>
                </View>
                
                <KeyboardAvoidingView behavior="padding">
                    <View style={{ paddingHorizontal:20, paddingVertical:20, borderWidth: 1, borderColor: '#a4a5a6' }}>
                        <Text style={{ fontWeight: 'bold', fontSize: 15 }}>Web API :</Text>
                        <TextInput
                            dataDetectorType = "link"
                            autoCapitalize = 'none'
                            underlineColorAndroid = "transparent"
                            placeholder    ="input end point service address"
                            style          ={styles.input}
                            value          ={this.state.endpoint}
                            onChangeText   ={(text) => this.setState({endpoint : text})}
                            value          ={this.state.endpoint} />
                    </View>
                    <View style={{ backgroundColor:'#ebebeb', paddingHorizontal:20 }}>
                        <View style={{ paddingTop:20, paddingBottom:10, }}>
                            <Text style={{ fontWeight: 'bold', fontSize: 16, color:'#001577' }}>Fingerprint Registration (only first time)</Text>
                        </View>
                        <View style={{ marginTop:10 }}>
                            <Text style={{ fontWeight: 'bold', fontSize: 15 }}>User Name :</Text>
                            <TextInput
                                    placeholder    ="input username"
                                    underlineColorAndroid = "transparent"
                                    autoCapitalize = 'none'
                                    style          ={styles.input}
                                    value          ={this.state.user}
                                    onChangeText   ={(text) => this.setState({user : text})}
                                    value          ={this.state.user} />
                        </View>
                        <View style={{ marginTop:10 }}>
                            <Text style={{ fontWeight: 'bold', fontSize: 15 }}>Password :</Text>
                            <TextInput
                                placeholder    ="input password"
                                underlineColorAndroid = "transparent"
                                autoCapitalize = 'none'
                                style          ={styles.input}
                                secureTextEntry={true}
                                onChangeText   ={(text) => this.setState({passwd: text})}
                                value          ={this.state.passwd} />
                        </View>
                        {

                            !(accessToken.length > 0) &&
                            <View style={{ alignItems:'center', paddingTop:20, paddingBottom:15, }}>
                                <TouchableOpacity
                                    style  ={ styles.button }
                                    onPress={ this.onContinue }>
                                    <Text style={{ textAlign:'center', color:'#FFFFFF', fontWeight: '700' }}>Continue</Text>
                                </TouchableOpacity>
                            </View>
                        }
                        {
                            (accessToken.length > 0) && 
                            <View style={{ alignItems:'center', paddingTop:20, paddingBottom:15, }} />
                        }
                    </View>
                </KeyboardAvoidingView>
                
                {
                
                    (accessToken.length > 0) &&
                    <View style={{ flexDirection:'row', justifyContent: 'space-between', marginTop: 30, paddingHorizontal: 20, }}>
                        <TouchableOpacity onPress={ this.onClearKeyChain }>
                            <Text style={{ fontWeight: 'bold', fontSize: 14, color:'red' }}>CLEAR KEYCHAIN</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={ this.onGotoLogin }>
                            <Text style={{ fontWeight: 'bold', fontSize: 14, color:'#469184' }}>FINGERPRINT SCAN</Text>
                        </TouchableOpacity>
                    </View>
                
                }
            </View>
        )
    }
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1, flexGrow: 1, flexDirection: 'column', backgroundColor:'#fff', marginTop: 20
    },
    button: {
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
        backgroundColor:'#449af0',
        paddingVertical:15,
        width:200,
    },
    input: {
        marginTop:2,
        height: 40,
        backgroundColor: 'rgba(255,255,255, 0.6)',
        color: '#111',
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: '#e5e5e5',
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
    }

})
