import React, { useEffect, useState } from 'react';
import { View, Button, FlatList, Text, StyleSheet, SafeAreaView, PermissionsAndroid, Platform, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { addFavorite, removeFavorite, loadFavorites } from '../redux/favoritesSlice';
import { Card, Icon } from "@rneui/themed";
import Sound from 'react-native-sound';
import AudioRecord from "react-native-audio-record";
import { request, PERMISSIONS, RESULTS } from "react-native-permissions";



const SimpleKaraokeApp = () => {
  const [backgroundTrack, setBackgroundTrack] = useState(null);
  const [recordingTrack, setRecordingTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlaying1, setIsPlaying1] = useState(false);
  const dispatch = useDispatch();
  const favorites = useSelector((state) => state.favorites.favorites);
  const [recording, setRecording] = useState(false);
  const [filePath, setFilePath] = useState(null);
  const [isLoading, setIsLoading] = useState(false);


  useEffect(() => {
    dispatch(loadFavorites());
  }, [dispatch]);

  useEffect(() => {

    // Load the background track
    Sound.setCategory('Playback');
    const sound = new Sound('https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Kangaroo_MusiQue_-_The_Neverwritten_Role_Playing_Game.mp3', null, (error) => {

      setBackgroundTrack(sound);
    });

    return () => sound.release(); // Cleanup
  }, []);

  const song = { id: '123', title: filePath};

  const toggleFavorite = () => {
    if(!filePath){
      Alert.alert('', 'First, please record the audio & then add to favorite');
      return;
    }
    if (favorites.some((fav) => fav.id === song.id)) {
      dispatch(removeFavorite(song));
    } else {
      dispatch(addFavorite(song));
    }
  };

   // Request microphone permissions
   const requestPermissions = async () => {
    if (Platform.OS === "android") {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } else if (Platform.OS === "ios") {
      const result = await request(PERMISSIONS.IOS.MICROPHONE);
      return result === RESULTS.GRANTED;
    }

    return false;
  };

  // Start Recording
  const startRecording = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      alert("Microphone permission is required to record audio.");
      return;
    }

    const options = {
      sampleRate: 16000, // 16 kHz
      channels: 1, // Mono
      bitsPerSample: 16,
      wavFile: "user_audio.wav", // Recorded audio file name
    };

    AudioRecord.init(options);
    AudioRecord.start();
    setRecording(true);

    if (!backgroundTrack) return;
    setIsPlaying(true)

    // Start playing the background music
    backgroundTrack.play((success) => {
      if (!success) Alert.alert('','Playback failed');
    });
  };

  const stopRecording = async () => {
    if (recording) {
      if (backgroundTrack) backgroundTrack.stop();
      setIsPlaying(false);
  
      const audioFile = await AudioRecord.stop();
      setFilePath(audioFile);
      setRecording(false);
      const sound = new Sound(audioFile, '', (error) => {
        setRecordingTrack(sound);
      });
    }
  };

  const playRecording = async () =>{
    setIsLoading(true);
    recordingTrack.play((success, second) => {
      setIsLoading(false);
      setIsPlaying1(false);
      if (!success) Alert.alert('','Playback failed');
    });

  }

  const stopPlaying = async () =>{
    if (recordingTrack) recordingTrack.stop();
    setIsPlaying1(false);
     setIsLoading(false);
  }

  

  return (
    <SafeAreaView style={styles.container}>
    <View style={styles.header}>
      <Text style={styles.title}>Simple Karaoke App</Text>
      <Icon name="music-note" type="material" color="#FFD700" size={32} />
    </View>

    <View style={styles.content}>
      <Card containerStyle={styles.card}>
        <Text style={styles.cardTitle}>Recording</Text>
        <TouchableOpacity
          style={styles.recordButton}
          onPress={recording ? stopRecording : startRecording}
        >
          <Icon
            name={recording ? "stop-circle" : "microphone"}
            type="font-awesome"
            color="#fff"
            size={24}
          />
          <Text style={styles.recordButtonText}>
            {recording ? "Stop Recording" : "Start Recording"}
          </Text>
        </TouchableOpacity>
        {filePath && (
          <View style={styles.playbackSection}>
            <Text style={styles.filePath}>Recorded File: {filePath}</Text>
            {
            isLoading ? 
            <ActivityIndicator /> : 
            <TouchableOpacity
              style={styles.playButton}
              onPress={isPlaying1 ? stopPlaying : playRecording}
            >
              <Icon
                name={isPlaying1 ? "stop" : "play"}
                type="font-awesome"
                color="#fff"
                size={16}
              />
              <Text style={styles.playButtonText}>
                {isPlaying1 ? "Stop Playing" : "Play Recording"}
              </Text>
            </TouchableOpacity>
          }
          </View>
        )}
      </Card>

      <Card containerStyle={styles.card}>
        <Text style={styles.cardTitle}>Favorites</Text>
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={toggleFavorite}
        >
          <Icon
            name={
              favorites.some((fav) => fav.id === song.id)
                ? "heart"
                : "heart-o"
            }
            type="font-awesome"
            color="#FF6347"
            size={24}
          />
          <Text style={styles.favoriteButtonText}>
            {favorites.some((fav) => fav.id === song.id)
              ? "Remove from Favorites"
              : "Add to Favorites"}
          </Text>
        </TouchableOpacity>
      </Card>

      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card containerStyle={styles.favoriteCard}>
            <Text style={styles.favoriteItem}>
              {item.title}
            </Text>
          </Card>
        )}
      />
    </View>
  </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4e4eff",
    padding: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFD700",
    marginRight: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  recordButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4e4eff",
    padding: 12,
    borderRadius: 8,
  },
  recordButtonText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 8,
  },
  playbackSection: {
    marginTop: 12,
  },
  filePath: {
    fontSize: 14,
    color: "#555",
    marginBottom: 8,
  },
  playButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF6347",
    padding: 8,
    borderRadius: 8,
  },
  playButtonText: {
    color: "#fff",
    fontSize: 14,
    marginLeft: 8,
  },
  favoriteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    backgroundColor: "#FFD700",
    borderRadius: 8,
  },
  favoriteButtonText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 8,
  },
  favoriteCard: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    backgroundColor: "#4e4eff",
  },
  favoriteItem: {
    color: "#fff",
    fontSize: 16,
  },
});

export default SimpleKaraokeApp;

