const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// Test data
const testStudents = [
  {
    name: "John Doe",
    age: 16,
    gender: "Male",
    village: "Downtown",
    attendance: 45,
    score: 35,
    fee_status: "Overdue"
  },
  {
    name: "Jane Smith",
    age: 15,
    gender: "Female",
    village: "Uptown",
    attendance: 85,
    score: 78,
    fee_status: "Paid"
  },
  {
    name: "Mike Johnson",
    age: 17,
    gender: "Male",
    village: "Midtown",
    attendance: 65,
    score: 55,
    fee_status: "Pending"
  },
  {
    name: "Sarah Wilson",
    age: 16,
    gender: "Female",
    village: "Eastside",
    attendance: 95,
    score: 88,
    fee_status: "Paid"
  }
];

async function testAPI() {
  console.log('🧪 Testing Dropout Prediction API\n');
  
  try {
    // Test 1: Health check
    console.log('1. Testing health check...');
    const healthResponse = await axios.get(`${BASE_URL}/`);
    console.log('✅ Health check:', healthResponse.data.message);
    console.log('');

    // Test 2: Add students
    console.log('2. Adding test students...');
    const addedStudents = [];
    for (const student of testStudents) {
      try {
        const response = await axios.post(`${BASE_URL}/students`, student);
        addedStudents.push(response.data.data);
        console.log(`✅ Added: ${student.name} (Risk: ${response.data.data.risk_level})`);
      } catch (error) {
        console.log(`❌ Failed to add ${student.name}:`, error.response?.data?.message || error.message);
      }
    }
    console.log('');

    // Test 3: Get all students
    console.log('3. Fetching all students...');
    const allStudentsResponse = await axios.get(`${BASE_URL}/students`);
    console.log(`✅ Found ${allStudentsResponse.data.count} students`);
    allStudentsResponse.data.data.forEach(student => {
      console.log(`   - ${student.name}: ${student.risk_level} risk (${student.attendance}% attendance, ${student.score}% score)`);
    });
    console.log('');

    // Test 4: Get high-risk students
    console.log('4. Fetching high-risk students...');
    const highRiskResponse = await axios.get(`${BASE_URL}/students/high-risk`);
    console.log(`✅ Found ${highRiskResponse.data.count} high-risk students`);
    highRiskResponse.data.data.forEach(student => {
      console.log(`   - ${student.name}: ${student.attendance}% attendance, ${student.score}% score, ${student.fee_status} fees`);
    });
    console.log('');

    // Test 5: Update risk level
    

    // Test 6: Get specific student
    if (addedStudents.length > 0) {
      console.log('6. Fetching specific student...');
      const studentId = addedStudents[0].id;
      try {
        const studentResponse = await axios.get(`${BASE_URL}/students/${studentId}`);
        console.log(`✅ Student details:`, studentResponse.data.data);
      } catch (error) {
        console.log(`❌ Failed to fetch student:`, error.response?.data?.message || error.message);
      }
      console.log('');
    }

    // Test 7: Error handling
    console.log('7. Testing error handling...');
    
    // Invalid student data
    try {
      await axios.post(`${BASE_URL}/students`, {
        name: "Invalid Student",
        age: 30, // Invalid age
        gender: "Invalid", // Invalid gender
        village: "Test",
        attendance: 150, // Invalid attendance
        score: -10, // Invalid score
        fee_status: "Invalid" // Invalid fee status
      });
    } catch (error) {
      console.log('✅ Validation working - caught invalid data:', error.response?.data?.message);
    }

    // Non-existent student
    try {
      await axios.get(`${BASE_URL}/students/99999`);
    } catch (error) {
      console.log('✅ 404 handling working - caught non-existent student:', error.response?.data?.message);
    }

    console.log('\n🎉 All tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testAPI();
}

module.exports = { testAPI, testStudents };
