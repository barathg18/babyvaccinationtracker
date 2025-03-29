import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { format, parseISO } from 'date-fns';
import Icon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage

// --- Data (Vaccination Schedule and Ranges) ---
//  *Important*:  This data should ideally come from a database or API.
const vaccinationSchedule = [
  { name: 'BCG', date: 'At birth', notes: 'Protects against tuberculosis' },
  { name: 'Hepatitis B (Birth dose)', date: 'At birth', notes: 'Protects against Hepatitis B' },
  { name: 'OPV-0', date: 'At birth', notes: 'Protects against Polio' },
  { name: 'Pentavalent (HepB, DTaP, Hib) - 1', date: '6 weeks', notes: 'Protects against multiple diseases' },
  { name: 'OPV-1', date: '6 weeks', notes: 'Protects against Polio' },
  { name: 'Rotavirus-1', date: '6 weeks', notes: 'Protects against Rotavirus' },
  { name: 'PCV-1', date: '6 weeks', notes: 'Protects against Pneumococcal disease' },
  { name: 'Pentavalent (HepB, DTaP, Hib) - 2', date: '10 weeks', notes: 'Protects against multiple diseases' },
  { name: 'OPV-2', date: '10 weeks', notes: 'Protects against Polio' },
  { name: 'Rotavirus-2', date: '10 weeks', notes: 'Protects against Rotavirus' },
  { name: 'PCV-2', date: '10 weeks', notes: 'Protects against Pneumococcal disease' },
  { name: 'Pentavalent (HepB, DTaP, Hib) - 3', date: '14 weeks', notes: 'Protects against multiple diseases' },
  { name: 'OPV-3', date: '14 weeks', notes: 'Protects against Polio' },
  { name: 'IPV', date: '14 weeks', notes: 'Protects against Polio' },
  { name: 'Rotavirus-3', date: '14 weeks', notes: 'Protects against Rotavirus' },
  { name: 'PCV-3', date: '9 months', notes: 'Protects against Pneumococcal disease' },
  { name: 'Measles-Rubella-1', date: '9 months', notes: 'Protects against Measles and Rubella' },
  { name: 'Japanese Encephalitis-1', date: '9-12 months', notes: 'Protects against Japanese Encephalitis' },
  { name: 'Vitamin A (1st dose)', date: '9 months', notes: 'For Vitamin A deficiency' },
  { name: 'DPT Booster-1', date: '16-24 months', notes: 'Boosts protection against Diphtheria, Pertussis, and Tetanus' },
  { name: 'Measles-Rubella-2', date: '16-24 months', notes: 'Protects against Measles and Rubella' },
  { name: 'Japanese Encephalitis-2', date: '16-24 months', notes: 'Protects against Japanese Encephalitis' },
  { name: 'Vitamin A (2nd dose)', date: '16-24 months', notes: 'For Vitamin A deficiency' },
  { name: 'Typhoid Conjugate Vaccine', date: '16-24 months', notes: 'Protects against Typhoid' },
  { name: 'Varicella', date: '15-18 months', notes: 'Protects against Chickenpox' },
  { name: 'Hep A', date: '12 months', notes: 'Protects against Hepatitis A' },
  { name: 'DPT Booster-2', date: '5-6 years', notes: 'Boosts protection against Diphtheria, Pertussis, and Tetanus' },
  { name: 'Tdap/Td', date: '10-16 years', notes: 'Protects against Tetanus, Diphtheria, and Pertussis/Tetanus' },
];

const idealHeightWeightRanges = [
  { month: 1, height: '50-60 cm', weight: '3.2-6.0 kg' },
  { month: 3, height: '60-70 cm', weight: '5.0-8.0 kg' },
  { month: 6, height: '65-80 cm', weight: '6.5-10.0 kg' },
  { month: 9, height: '70-85 cm', weight: '7.5-11.0 kg' },
  { month: 12, height: '75-90 cm', weight: '8.0-12.0 kg' },
];

// --- Helper Functions ---
const formatDate = (date: Date) => format(date, 'yyyy-MM-dd');

// --- Components ---

// Input component for Baby's Name and DOB
const BabyInfoInput = ({
  babyName,
  setBabyName,
  dob,
  setDob,
  onDateSelect,
  isEditing,
  setIsEditing,
}: {
  babyName: string;
  setBabyName: (name: string) => void;
  dob: string;
  setDob: (date: string) => void;
  onDateSelect: (date: string) => void;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
}) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Baby Information</Text>
    {isEditing ? (
      <>
        <TextInput
          style={styles.input}
          placeholder="Baby's Name"
          value={babyName}
          onChangeText={setBabyName}
        />
        <TouchableOpacity style={styles.button} onPress={() => setIsEditing(false)}>
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>
      </>
    ) : (
      <View style={styles.babyInfoDisplay}>
        <Text>Name: {babyName || 'Not set'}</Text>
        <Text>Date of Birth: {dob || 'Not set'}</Text>
        <TouchableOpacity style={styles.button} onPress={() => setIsEditing(true)}>
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>
    )}
    <Calendar
      onDayPress={(day) => onDateSelect(day.dateString)}
      markedDates={dob ? { [dob]: { selected: true, selectedColor: '#a7f3d0' } } : {}}
      maxDate={new Date()} //prevent future dates.
    />
  </View>
);

// Component to display vaccination schedule
const VaccinationSchedule = ({
  schedule,
  markedStatus,
  onMarkVaccinated,
  onClearVaccinated,
}: {
  schedule: typeof vaccinationSchedule;
  markedStatus: { [key: string]: boolean };
  onMarkVaccinated: (vaccineName: string) => void;
  onClearVaccinated: (vaccineName: string) => void;
}) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Vaccination Schedule</Text>
    <FlatList
      data={schedule}
      keyExtractor={(item) => item.name}
      renderItem={({ item }) => (
        <View style={styles.vaccineItem}>
          <View style={{ flex: 1 }}>
            <Text style={styles.vaccineName}>{item.name}</Text>
            <Text style={styles.vaccineDate}>{item.date}</Text>
            <Text style={styles.vaccineNotes}>{item.notes}</Text>
          </View>
          <TouchableOpacity
            onPress={() =>
              markedStatus[item.name]
                ? onClearVaccinated(item.name)
                : onMarkVaccinated(item.name)
            }
            style={styles.statusButton}
          >
            {markedStatus[item.name] ? (
              <Icon name="check-circle" size={24} color="green" /> // Using FontAwesome's check-circle
            ) : (
              <Icon name="circle-thin" size={24} color="gray" /> // Using FontAwesome's circle-thin
            )}
          </TouchableOpacity>
        </View>
      )}
    />
  </View>
);

// Component to display ideal height and weight ranges
const HeightWeightRanges = ({ ranges }: { ranges: typeof idealHeightWeightRanges }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Ideal Height and Weight</Text>
    <FlatList
      data={ranges}
      keyExtractor={(item) => item.month.toString()}
      renderItem={({ item }) => (
        <View style={styles.hwItem}>
          <Text>
            Month {item.month}: {item.height}, {item.weight}
          </Text>
        </View>
      )}
    />
  </View>
);

// Main App Component
const BabyVaccinationApp = () => {
  const [babyName, setBabyName] = useState('');
  const [dob, setDob] = useState('');
  const [markedVaccinations, setMarkedVaccinations] = useState<{
    [key: string]: boolean;
  }>({});
  const [isEditingBabyInfo, setIsEditingBabyInfo] = useState(false);


  // Load data from AsyncStorage
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedName = await AsyncStorage.getItem('babyName');
        const storedDob = await AsyncStorage.getItem('dob');
        const storedVaccinations = await AsyncStorage.getItem('markedVaccinations');

        if (storedName) setBabyName(storedName);
        if (storedDob) setDob(storedDob);
        if (storedVaccinations) {
          setMarkedVaccinations(JSON.parse(storedVaccinations) || {}); // Parse or default to {}
        }
      } catch (error) {
        console.error('Error loading data:', error);
        // Handle error appropriately, e.g., show a user-friendly message
      }
    };

    loadData();
  }, []);

  // Save data to AsyncStorage
  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem('babyName', babyName);
        await AsyncStorage.setItem('dob', dob);
        await AsyncStorage.setItem('markedVaccinations', JSON.stringify(markedVaccinations));
        setNotification(); //set notifications
      } catch (error) {
        console.error('Error saving data:', error);
        // Handle error, e.g., show a message to the user
      }
    };
    saveData();

  }, [babyName, dob, markedVaccinations]);

  // Function to handle date selection
  const handleDateSelect = (dateString: string) => {
    const selectedDate = parseISO(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate > today) {
      Alert.alert("Invalid Date", "Please select a date that is not in the future");
      return;
    }
    setDob(dateString);
  };

  // Function to mark a vaccination as done
  const markVaccinated = (vaccineName: string) => {
    setMarkedVaccinations((prev) => ({
      ...prev,
      [vaccineName]: true,
    }));
  };
  // Function to clear a vaccination status
  const clearVaccinated = (vaccineName: string) => {
    setMarkedVaccinations(prev => ({
      ...prev,
      [vaccineName]: false,
    }));
  };

  // Function to set up reminder notifications (Simplified)
  const setNotification = () => {
    // In a real app, you would use a library like react-native-push-notification
    // to schedule local notifications.  This is a *very* simplified example
    // using setTimeout.  It's not suitable for real-world use.

    const today = new Date();
    vaccinationSchedule.forEach((vaccine) => {
      //  *IMPORTANT*:  This is placeholder logic.  You'd need to calculate the *actual*
      //  due date based on the baby's DOB and the vaccination schedule.
      let vaccineDate: Date;
      if (vaccine.date === 'At birth') {
        vaccineDate = new Date(dob);
      }
      else if (vaccine.date === '6 weeks') {
        vaccineDate = new Date(parseISO(dob).getTime() + 6 * 7 * 24 * 60 * 60 * 1000); // Adds 6 weeks
      }
      else if (vaccine.date === '10 weeks') {
        vaccineDate = new Date(parseISO(dob).getTime() + 10 * 7 * 24 * 60 * 60 * 1000);
      }
      else if (vaccine.date === '14 weeks') {
        vaccineDate = new Date(parseISO(dob).getTime() + 14 * 7 * 24 * 60 * 60 * 1000);
      }
      else if (vaccine.date === '9 months') {
        vaccineDate = new Date(parseISO(dob).getTime() + 9 * 30 * 24 * 60 * 60 * 1000);
      }
      else if (vaccine.date === '16-24 months') {
        vaccineDate = new Date(parseISO(dob).getTime() + 18 * 30 * 24 * 60 * 60 * 1000); //average
      }
      else if (vaccine.date === '15-18 months') {
        vaccineDate = new Date(parseISO(dob).getTime() + 16.5 * 30 * 24 * 60 * 60 * 1000);
      }
      else if (vaccine.date === '12 months') {
        vaccineDate = new Date(parseISO(dob).getTime() + 12 * 30 * 24 * 60 * 60 * 1000);
      }
      else if (vaccine.date === '5-6 years') {
        vaccineDate = new Date(parseISO(dob).getTime() + 5.5 * 365 * 24 * 60 * 60 * 1000);
      }
      else if (vaccine.date === '10-16 years') {
        vaccineDate = new Date(parseISO(dob).getTime() + 13 * 365 * 24 * 60 * 60 * 1000);
      }
      else {
        vaccineDate = today;
      }

      const timeDiff = vaccineDate.getTime() - today.getTime();
      const oneDayBefore = timeDiff - 24 * 60 * 60 * 1000; // 1 day before

      if (oneDayBefore > 0 && !markedVaccinations[vaccine.name]) {
        setTimeout(() => {
          Alert.alert(
            'Vaccination Reminder',
            `Reminder: Your baby is due for ${vaccine.name} tomorrow.`,
            [],
          );
        }, oneDayBefore);
      }
    });
  };

  return (
    <View style={styles.container}>
      <BabyInfoInput
        babyName={babyName}
        setBabyName={setBabyName}
        dob={dob}
        setDob={setDob}
        onDateSelect={handleDateSelect}
        isEditing={isEditingBabyInfo}
        setIsEditing={setIsEditingBabyInfo}
      />
      <VaccinationSchedule
        schedule={vaccinationSchedule}
        markedStatus={markedVaccinations}
        onMarkVaccinated={markVaccinated}
        onClearVaccinated={clearVaccinated}
      />
      <HeightWeightRanges ranges={idealHeightWeightRanges} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f0f4f8', // Light background
  },
  section: {
    marginBottom: 20,
    backgroundColor: 'white', // White sections
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2, // Android shadow
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2e7d32', // Green title
  },
  input: {
    height: 40,
    borderColor: '#ddd', // Light border
    borderWidth: 1,
    marginBottom: 12,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5', // Light background for input
  },
  button: {
    color: 'white',
    backgroundColor: '#4caf50', // Green button
    padding: 10,
    borderRadius: 8,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: 'bold'
  },
  editButtonText: {
    color: '#1e88e5', // Blue for edit
    padding: 8,
    borderRadius: 8,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: 'bold',
    textDecorationLine: 'underline'
  },
  vaccineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', // Vertically center icon
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee', // Very light border
  },
  vaccineName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0c3001',
  },
  vaccineDate: {
    fontSize: 14,
    color: '#666',
  },
  vaccineNotes: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  hwItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statusButton: {
    padding: 8,
    borderRadius: 20, // Make it round
  },
  babyInfoDisplay: {
    padding: 10,
    marginTop: 10,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  }
});

export default BabyVaccinationApp;