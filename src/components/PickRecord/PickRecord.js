import React, { Component } from 'react';
import {
    Dimensions,
    Image,
    Slider,
    StyleSheet,
    Text,
    TouchableHighlight,
    View
} from 'react-native';

import Expo, { Asset, Audio, FileSystem, Font, Permissions } from 'expo';


class PickRecord extends Component {
    
  constructor(props) {
      super(props);
      this.recording = null;
      this.sound = null;
      this.isSeeking = false;
      this.shouldPlayAtEndOfSeek = false;
      this.state = {
        haveRecordingPermissions: false,
        isLoading: false,
        isPlaybackAllowed: false,
        muted: false,
        soundPosition: null,
        soundDuration: null,
        recordingDuration: null,
        shouldPlay: false,
        isPlaying: false,
        isRecording: false,
        shouldCorrectPitch: true,
        volume: 1.0,
        rate: 1.0,
      };
      this.recordingSettings = JSON.parse(JSON.stringify(Audio.RECORDING_OPTIONS_PRESET_LOW_QUALITY));
      // // UNCOMMENT THIS TO TEST maxFileSize:
      // this.recordingSettings.android['maxFileSize'] = 12000;
    }
  
    componentDidMount() {
      this.askForPermissions();
    }
  
    askForPermissions = async () => {
      const response = await Permissions.askAsync(Permissions.AUDIO_RECORDING);
      this.setState({
        haveRecordingPermissions: response.status === 'granted',
      });
    };
  
    updateScreenForSoundStatus = status => {
      if (status.isLoaded) {
        this.setState({
          soundDuration: status.durationMillis,
          soundPosition: status.positionMillis,
          shouldPlay: status.shouldPlay,
          isPlaying: status.isPlaying,
          rate: status.rate,
          muted: status.isMuted,
          volume: status.volume,
          shouldCorrectPitch: status.shouldCorrectPitch,
          isPlaybackAllowed: true,
        });
      } else {
        this.setState({
          soundDuration: null,
          soundPosition: null,
          isPlaybackAllowed: false,
        });
        if (status.error) {
          console.log(`FATAL PLAYER ERROR: ${status.error}`);
        }
      }
    };
  
    updateScreenForRecordingStatus = status => {
      if (status.canRecord) {
        this.setState({
          isRecording: status.isRecording,
          recordingDuration: status.durationMillis,
        });
      } else if (status.isDoneRecording) {
        this.setState({
          isRecording: false,
          recordingDuration: status.durationMillis,
        });
        if (!this.state.isLoading) {
          this._stopRecordingAndEnablePlayback();
        }
      }
    };
  
    async stopPlaybackAndBeginRecording() {
      this.setState({
        isLoading: true,
      });
      if (this.sound !== null) {
        await this.sound.unloadAsync();
        this.sound.setOnPlaybackStatusUpdate(null);
        this.sound = null;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      });
      if (this.recording !== null) {
        this.recording.setOnRecordingStatusUpdate(null);
        this.recording = null;
      }
  
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(this.recordingSettings);
      recording.setOnRecordingStatusUpdate(this.updateScreenForRecordingStatus);
  
      this.recording = recording;
      await this.recording.startAsync(); // Will call this._updateScreenForRecordingStatus to update the screen.
      this.setState({
        isLoading: false,
      });
    }
  
    async stopRecordingAndEnablePlayback() {
      this.setState({
        isLoading: true,
      });
      try {
        await this.recording.stopAndUnloadAsync();
      } catch (error) {
        // Do nothing -- we are already unloaded.
      }
      const info = await FileSystem.getInfoAsync(this.recording.getURI());
      console.log(`FILE INFO: ${JSON.stringify(info)}`);
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        playsInSilentModeIOS: true,
        playsInSilentLockedModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      });
      const { sound, status } = await this.recording.createNewLoadedSound(
        {
          isLooping: true,
          isMuted: this.state.muted,
          volume: this.state.volume,
          rate: this.state.rate,
          shouldCorrectPitch: this.state.shouldCorrectPitch,
        },
        this.updateScreenForSoundStatus
      );
      this.sound = sound;
      this.setState({
        isLoading: false,
      });
    }
  
    onRecordPressed = () => {
      if (this.state.isRecording) {
        this.stopRecordingAndEnablePlayback();
      } else {
        this.stopPlaybackAndBeginRecording();
      }
    };
  
    onPlayPausePressed = () => {
      if (this.sound != null) {
        if (this.state.isPlaying) {
          this.sound.pauseAsync();
        } else {
          this.sound.playAsync();
        }
      }
    };
  
    onStopPressed = () => {
      if (this.sound != null) {
        this.sound.stopAsync();
      }
    };
  
    onMutePressed = () => {
      if (this.sound != null) {
        this.sound.setIsMutedAsync(!this.state.muted);
      }
    };
  
    onVolumeSliderValueChange = value => {
      if (this.sound != null) {
        this.sound.setVolumeAsync(value);
      }
    };
  
    trySetRate = async (rate, shouldCorrectPitch) => {
      if (this.sound != null) {
        try {
          await this.sound.setRateAsync(rate, shouldCorrectPitch);
        } catch (error) {
          // Rate changing could not be performed, possibly because the client's Android API is too old.
        }
      }
    };
  
    onRateSliderSlidingComplete = async value => {
      this.trySetRate(value * RATE_SCALE, this.state.shouldCorrectPitch);
    };
  
    onPitchCorrectionPressed = async value => {
      this.trySetRate(this.state.rate, !this.state.shouldCorrectPitch);
    };
  
    onSeekSliderValueChange = value => {
      if (this.sound != null && !this.isSeeking) {
        this.isSeeking = true;
        this.shouldPlayAtEndOfSeek = this.state.shouldPlay;
        this.sound.pauseAsync();
      }
    };
  
    onSeekSliderSlidingComplete = async value => {
      if (this.sound != null) {
        this.isSeeking = false;
        const seekPosition = value * this.state.soundDuration;
        if (this.shouldPlayAtEndOfSeek) {
          this.sound.playFromPositionAsync(seekPosition);
        } else {
          this.sound.setPositionAsync(seekPosition);
        }
      }
    };
  
    getSeekSliderPosition() {
      if (
        this.sound != null &&
        this.state.soundPosition != null &&
        this.state.soundDuration != null
      ) {
        return this.state.soundPosition / this.state.soundDuration;
      }
      return 0;
    }
  
    getMMSSFromMillis(millis) {
      const totalSeconds = millis / 1000;
      const seconds = Math.floor(totalSeconds % 60);
      const minutes = Math.floor(totalSeconds / 60);
  
      const padWithZero = number => {
        const string = number.toString();
        if (number < 10) {
          return '0' + string;
        }
        return string;
      };
      return padWithZero(minutes) + ':' + padWithZero(seconds);
    }
  
    getPlaybackTimestamp() {
      if (
        this.sound != null &&
        this.state.soundPosition != null &&
        this.state.soundDuration != null
      ) {
        return `${this.getMMSSFromMillis(this.state.soundPosition)} / ${this.getMMSSFromMillis(
          this.state.soundDuration
        )}`;
      }
      return '';
    }
  
    getRecordingTimestamp() {
      if (this.state.recordingDuration != null) {
        return `${this.getMMSSFromMillis(this.state.recordingDuration)}`;
      }
      return `${this.getMMSSFromMillis(0)}`;
    }
  
    render() {
      return  !this.state.haveRecordingPermissions ? (
        
        <View style={styles.container}>
          
          <View />
            <Text style={[styles.noPermissionsText, { fontFamily: 'cutive-mono-regular' }]}>
              You must enable audio recording permissions in order to use this app.
            </Text>
          <View />
       
        </View>
      ) : (
        <View style={styles.container}>
          <View
            style={[
              styles.halfScreenContainer,
              {
                opacity: this.state.isLoading ? DISABLED_OPACITY : 1.0,
              },
            ]}>
          <View />
           
          <View style={styles.recordingContainer}>
          
          <View />
             
          <TouchableHighlight
            underlayColor={BACKGROUND_COLOR}
            style={styles.wrapper}
            onPress={this.onRecordPressed}
            disabled={this.state.isLoading}
          >
            <Image style={styles.image} source={ICON_RECORD_BUTTON.module} />
          </TouchableHighlight>
             
          <View style={styles.recordingDataContainer}>
            
            <View />
              
              <Text style={[styles.liveText, { fontFamily: 'cutive-mono-regular' }]}>
                {this.state.isRecording ? 'LIVE' : ''}
              </Text>
              
              <View style={styles.recordingDataRowContainer}>
                
                <Image
                  style={[styles.image, { opacity: this.state.isRecording ? 1.0 : 0.0 }]}
                  source={ICON_RECORDING.module}
                />
                
                <Text style={[styles.recordingTimestamp, { fontFamily: 'cutive-mono-regular' }]}>
                  {this._getRecordingTimestamp()}
                </Text>
                
              </View>
                
              <View />
              
            </View>
          <View />
        </View>
      <View />
    </View>
    
    <View
      style={[
      styles.halfScreenContainer,
      {
        opacity: !this.state.isPlaybackAllowed || this.state.isLoading ? DISABLED_OPACITY : 1.0 },
      ]}>
            
      <View />
       
       <View style={styles.playbackContainer}>
          
          <Slider style={styles.playbackSlider} trackImage={ICON_TRACK_1.module} thumbImage={ICON_THUMB_1.module} value={this._getSeekSliderPosition()}
            onValueChange={this._onSeekSliderValueChange}
            onSlidingComplete={this._onSeekSliderSlidingComplete}
            disabled={!this.state.isPlaybackAllowed || this.state.isLoading}
          />
          
          <Text style={[styles.playbackTimestamp, { fontFamily: 'cutive-mono-regular' }]}>
            {this._getPlaybackTimestamp()}
          </Text>
        </View>
            
        <View style={[styles.buttonsContainerBase, styles.buttonsContainerTopRow]}>
          
          <View style={styles.volumeContainer}>
        
            <TouchableHighlight underlayColor={BACKGROUND_COLOR} style={styles.wrapper} onPress={this.onMutePressed} disabled={!this.state.isPlaybackAllowed || this.state.isLoading}>
              
              <Image style={styles.image} source={this.state.muted ? ICON_MUTED_BUTTON.module : ICON_UNMUTED_BUTTON.module}/>
            
            </TouchableHighlight>
            
            <Slider
                  style={styles.volumeSlider}
                  trackImage={ICON_TRACK_1.module}
                  thumbImage={ICON_THUMB_2.module}
                  value={1}
                  onValueChange={this.onVolumeSliderValueChange}
                  disabled={!this.state.isPlaybackAllowed || this.state.isLoading}
                />
        
         </View>
              
          <View style={styles.playStopContainer}>
              
            <TouchableHighlight underlayColor={BACKGROUND_COLOR}  style={styles.wrapper} onPress={this.onPlayPausePressed} disabled={!this.state.isPlaybackAllowed || this.state.isLoading}>
             
              <Image style={styles.image} source={this.state.isPlaying ? ICON_PAUSE_BUTTON.module : ICON_PLAY_BUTTON.module} />
            
            </TouchableHighlight>
              
            <TouchableHighlight
                  underlayColor={BACKGROUND_COLOR}
                  style={styles.wrapper}
                  onPress={this._onStopPressed}
                  disabled={!this.state.isPlaybackAllowed || this.state.isLoading}>
                  <Image style={styles.image} source={ICON_STOP_BUTTON.module} />
                </TouchableHighlight>
              </View>
            <View />
            
          </View>
            
            <View style={[styles.buttonsContainerBase, styles.buttonsContainerBottomRow]}>
              
              <Text style={[styles.timestamp, { fontFamily: 'cutive-mono-regular' }]}>Rate:</Text>
              
              <Slider
                style={styles.rateSlider}
                trackImage={ICON_TRACK_1.module}
                thumbImage={ICON_THUMB_1.module}
                value={this.state.rate / RATE_SCALE}
                onSlidingComplete={this._onRateSliderSlidingComplete}
                disabled={!this.state.isPlaybackAllowed || this.state.isLoading}
              />
              
              <TouchableHighlight
                underlayColor={BACKGROUND_COLOR}
                style={styles.wrapper}
                onPress={this._onPitchCorrectionPressed}
                disabled={!this.state.isPlaybackAllowed || this.state.isLoading}>
                <Text style={[{ fontFamily: 'cutive-mono-regular' }]}>
                  PC: {this.state.shouldCorrectPitch ? 'yes' : 'no'}
                </Text>
              </TouchableHighlight>
            
          </View>
            
          <View />
          
        </View>
      </View>
      
    );
  }
}
  
  const styles = StyleSheet.create({
    emptyContainer: {
      alignSelf: 'stretch',
      backgroundColor: '#faf8fb',
      height: 100
    },
    container: {
      flex: 1,
      flexDirection: 'column',
      justifyContent: 'space-between',
      alignItems: 'center',
      alignSelf: 'stretch',
      backgroundColor: '#faf8fb',
      minHeight: 100,
      maxHeight: 150,
    },
    noPermissionsText: {
      textAlign: 'center',
    },
    halfScreenContainer: {
      flex: 1,
      flexDirection: 'column',
      justifyContent: 'space-between',
      alignItems: 'center',
      alignSelf: 'stretch',
      minHeight: 100.0 / 2.0,
      maxHeight: 150.0 / 2.0,
    },
    recordingContainer: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      alignSelf: 'stretch',
      minHeight: ICON_RECORD_BUTTON.height,
      maxHeight: ICON_RECORD_BUTTON.height,
    },
    recordingDataContainer: {
      flex: 1,
      flexDirection: 'column',
      justifyContent: 'space-between',
      alignItems: 'center',
      minHeight: ICON_RECORD_BUTTON.height,
      maxHeight: ICON_RECORD_BUTTON.height,
      minWidth: ICON_RECORD_BUTTON.width * 3.0,
      maxWidth: ICON_RECORD_BUTTON.width * 3.0,
    },
    recordingDataRowContainer: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      minHeight: ICON_RECORDING.height,
      maxHeight: ICON_RECORDING.height,
    },
    playbackContainer: {
      flex: 1,
      flexDirection: 'column',
      justifyContent: 'space-between',
      alignItems: 'center',
      alignSelf: 'stretch',
      minHeight: ICON_THUMB_1.height * 2.0,
      maxHeight: ICON_THUMB_1.height * 2.0,
    },
    playbackSlider: {
      alignSelf: 'stretch',
    },
    liveText: {
      color: LIVE_COLOR,
    },
    recordingTimestamp: {
      paddingLeft: 20,
    },
    playbackTimestamp: {
      textAlign: 'right',
      alignSelf: 'stretch',
      paddingRight: 20,
    },
    image: {
      backgroundColor: '#faf8fb',
    },
    textButton: {
      backgroundColor: '#faf8fb',
      padding: 10,
    },
    buttonsContainerBase: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    buttonsContainerTopRow: {
      maxHeight: ICON_MUTED_BUTTON.height,
      alignSelf: 'stretch',
      paddingRight: 20,
    },
    playStopContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minWidth: (ICON_PLAY_BUTTON.width + ICON_STOP_BUTTON.width) * 3.0 / 2.0,
      maxWidth: (ICON_PLAY_BUTTON.width + ICON_STOP_BUTTON.width) * 3.0 / 2.0,
    },
    volumeContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minWidth: 200.0 / 2.0,
      maxWidth: 200.0 / 2.0,
    },
    volumeSlider: {
      width: 200.0 / 2.0 - 40.0,
    },
    buttonsContainerBottomRow: {
      maxHeight: ICON_THUMB_1.height,
      alignSelf: 'stretch',
      paddingRight: 20,
      paddingLeft: 20,
    },
    rateSlider: {
      width: 350.0 / 2.0,
    },
  });

export default PickRecord;