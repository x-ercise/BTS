import { Dimensions } from 'react-native';
const { width } = Dimensions.get('window');

export default {
  container: {
    position: 'relative',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 164, 222, 0.9)',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    width: width * 0.8,
  },
  contentContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    //backgroundColor: '#ffffff',
    backgroundColor: '#F5FCFF',
  },
  logo: {
    marginVertical: 10,
  },
  heading: {
    textAlign: 'center',
    color: '#00a4de',
    fontSize: 16,
  },
  description: (error) => ({
    textAlign: 'center',
    color: error ? '#ea3d13' : '#a5a5a5',
    height: 80,
    fontSize: 16,
    marginVertical: 10,
    marginHorizontal: 20,
  }),
  buttonContainer: {
    padding: 5,
  },
  buttonText: {
    color: '#8fbc5a',
    fontSize: 15,
    fontWeight: 'bold',
  },
};
