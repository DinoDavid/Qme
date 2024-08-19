import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

let currentQuestionIndex = 0;
let totalScore = 0;
let maxTotalScore = 0;
let categoryScores = {};
let userAnswers = [];
let userInfo = {};
let questions = [];  // Tom liste som fylles dynamisk


// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAujHYBr458zucLPt_FUQMaZfBustO7LR0",
    authDomain: "qme1-423d8.firebaseapp.com",
    projectId: "qme1-423d8",
    storageBucket: "qme1-423d8.appspot.com",
    messagingSenderId: "425603580627",
    appId: "1:425603580627:web:c671dd03b1c40136370a26",
    measurementId: "G-CSQGSQWCXT"
    };
  
  // Initialiser Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Fetch questions from quest.json
fetch('quest.json')
    .then(response => response.json())
    .then(data => {
        questions = data.questions; // Tilpasset til ditt JSON-format

        // Beregn maksimal score
        questions.forEach(q => {
            maxTotalScore += q.weight;
            if (!(q.category in categoryScores)) {
                categoryScores[q.category] = { score: 0, maxScore: 0 };
            }
        });

        // Vis første spørsmål når spørsmålene er lastet inn
        document.getElementById('userInfoForm').addEventListener('submit', function (e) {
            e.preventDefault();
            userInfo.name = document.getElementById('name').value;
            userInfo.age = document.getElementById('age').value;
            document.getElementById('surveyTitle').style.display = 'none'; // Skjul overskriften
            document.getElementById('intro').style.display = 'none';
            document.getElementById('questions').style.display = 'block';
            showQuestion();
        });
    })
    .catch(error => console.error('Error loading questions:', error));


// Vise et spørsmål
function showQuestion() {
    if (currentQuestionIndex < questions.length) {
        const currentQuestion = questions[currentQuestionIndex];
        document.getElementById('question-text').innerText = currentQuestion.question;
    } else {
        showResults();
    }
}

// Håndtere svar
document.getElementById('yesButton').addEventListener('click', function () {
    handleAnswer(true);
});

document.getElementById('noButton').addEventListener('click', function () {
    handleAnswer(false);
});

function handleAnswer(isYes) {
    const currentQuestion = questions[currentQuestionIndex];
    userAnswers.push({
        question: currentQuestion.question,
        answer: isYes ? "Ja" : "Nei"
    });

    if (isYes) {
        totalScore += currentQuestion.weight;
        categoryScores[currentQuestion.category].score += currentQuestion.weight;
    }
    categoryScores[currentQuestion.category].maxScore += currentQuestion.weight;
    currentQuestionIndex++;
    showQuestion();
}

// Vise resultatene
function showResults() {
    document.getElementById('questions').style.display = 'none';
    document.getElementById('results').style.display = 'block';
    
    document.getElementById('totalScore').innerText = `Din totale score: ${totalScore} / ${maxTotalScore}`;
    
    // Lag søylediagrammet
    const categoryCtx = document.getElementById('categoryChart').getContext('2d');
    const categories = Object.keys(categoryScores);
    const scores = categories.map(cat => 
        (categoryScores[cat].score / categoryScores[cat].maxScore) * 100
    );
    
    new Chart(categoryCtx, {
        type: 'bar',
        data: {
            labels: categories,
            datasets: [{
                label: '', // Fjerner etiketten for å skjule fargeboksene
                data: scores,
                backgroundColor: categories.map((_, i) => `hsl(${i * 360 / categories.length}, 70%, 50%)`),
                borderColor: 'rgba(0, 0, 0, 0.1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            },
            plugins: {
                legend: {
                    display: false // Skjuler fargeboksene
                }
            }
        }
    });

    // Lag sektordiagrammet
    const totalScoreCtx = document.getElementById('totalScoreChart').getContext('2d');
    new Chart(totalScoreCtx, {
        type: 'doughnut',
        data: {
            labels: ['Oppnådd Score', 'Totalt'],
            datasets: [{
                data: [totalScore, maxTotalScore - totalScore],
                backgroundColor: ['rgba(0, 200, 0, 0.7)', 'rgba(200, 200, 200, 0.7)'],
                borderColor: 'rgba(0, 0, 0, 0.1)',
                borderWidth: 1
            }]
        },
        options: {
            cutout: '70%',
            plugins: {
                legend: {
                    display: true // Skjuler fargeboksene
                }
            }
        }
    });
    const resultData = {
        userInfo,
        userAnswers,
        totalScore,
        categoryScores
    };
    
    // Push data to Firebase Realtime Database
    addDoc(collection(db, 'surveyResults'), resultData)
        .then(() => {
            alert('Resultater lagret!');
        })
        .catch((error) => {
            console.error('Error saving results:', error);
        });
}

