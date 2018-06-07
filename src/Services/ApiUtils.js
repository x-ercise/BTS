import * as Keychain from 'react-native-keychain';

//const urlLogin = "http://spwwebapi.azurewebsites.net/api";
//const urlRegister = "http://spwwebapi.azurewebsites.net/api";

var ApiUtils = { 

  urlLogin        : "/Mobile_FingerPrint/Login?id=",
  urlRegister     : "/Mobile_FingerPrint/Register?id=",
  urlRegisterTest : "/Mobile_FingerPrint/RegisterTest?id=",
  optionPOST : { 
      method: 'POST',
      headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json; charset=utf-8'
      }
  },
  checkStatus: function(response) {
    if (response.ok) {
      return response;
    } else {
      let error = new Error(response.statusText);
          error.response = response;
      throw error;
    }
  }

};
export { ApiUtils as default };
