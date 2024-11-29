import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Button,
  StyleSheet,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

// Dummy Data
const courses = [
  { id: '1', name: 'Math 101', location: 'Building A, Room 101' }
];

const seminars = [
  { id: '1', name: 'Seminar 1', date: '2024-12-01', time: '10:00 AM', attended: false, feedbackSubmitted: false },
  { id: '2', name: 'Seminar 2', date: '2024-12-02', time: '2:00 PM', attended: true, feedbackSubmitted: true },
  { id: '3', name: 'Seminar 3', date: '2024-12-03', time: '11:00 AM', attended: false, feedbackSubmitted: false },
  { id: '4', name: 'Seminar 4', date: '2024-12-04', time: '3:00 PM', attended: true, feedbackSubmitted: true },
];

// Sleep function
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 1. Course Page
const CoursePage = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Courses</Text>
      <FlatList
        data={courses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.listItem}
            onPress={() =>
              navigation.navigate('SeminarPage', {
                courseName: item.name,
                location: item.location,
              })
            }
          >
            <Text>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

// 2. Seminar Page
const SeminarPage = ({ route, navigation }) => {
  const courseName = courses[0][1];
  const location = courses[0][2];
  
  return (
    <View style={styles.container}>
      {/* Course Name and Location */}
      <Text style={styles.courseTitle}>{courseName}</Text>
      <Text style={styles.location}>{location}</Text>

      {/* Upcoming Requirements Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming Requirements</Text>
        <Button
          title="Submit Feedback"
          onPress={() => navigation.navigate('FeedbackPage')}
        />
      </View>

      {/* Seminars Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Seminars</Text>
        {seminars.map((seminar) => (
          <View key={seminar.id} style={styles.seminarItem}>
            <View style={styles.seminarDetails}>
              <Text style={styles.seminarName}>{seminar.name}</Text>
              <Text style={styles.seminarInfo}>{`${seminar.date} at ${seminar.time}`}</Text>
            </View>
            <Button
              title="Check In"
              onPress={() => navigation.navigate('LoadingPage', { seminarId: seminar.id })}
            />
          </View>
        ))}
      </View>
    </View>
  );
};

// 3. Loading Page
const LoadingPage = ({ navigation, route }) => {
  const { seminarId } = route.params;
  const [loading, setLoading] = useState(true);

  const handleAttendance = async () => {
    await sleep(2000); // Simulate loading
    setLoading(false);
    await sleep(1000); // Pause to show check mark
    navigation.navigate('SeminarPage');
  };

  React.useEffect(() => {
    handleAttendance();
  }, []);

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Text style={styles.checkmark}>✔️</Text>
      )}
    </View>
  );
};

// 4. Feedback Page
const FeedbackPage = ({ navigation }) => {
  const [feedback, setFeedback] = useState('');

  const handleSubmitFeedback = () => {
    console.log(`Feedback submitted: ${feedback}`);
    navigation.navigate('SeminarPage');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Submit Feedback</Text>
      <TextInput
        style={styles.textInput}
        placeholder="Type your feedback here..."
        value={feedback}
        onChangeText={setFeedback}
      />
      <Button title="Submit" onPress={handleSubmitFeedback} />
    </View>
  );
};

// Main App
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="CoursePage">
        <Stack.Screen name="CoursePage" component={CoursePage} options={{ title: 'Courses' }} />
        <Stack.Screen name="SeminarPage" component={SeminarPage} options={{ title: 'Course Details' }} />
        <Stack.Screen name="LoadingPage" component={LoadingPage} options={{ title: 'Marking Attendance' }} />
        <Stack.Screen name="FeedbackPage" component={FeedbackPage} options={{ title: 'Feedback' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  listItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#ccc' },
  courseTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 5 },
  location: { fontSize: 16, color: 'gray', marginBottom: 20 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  seminarItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  seminarDetails: {
    flex: 1,
  },
  seminarName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  seminarInfo: {
    fontSize: 14,
    color: 'gray',
  },
  textInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  checkmark: { fontSize: 50, color: 'green', textAlign: 'center' },
});

