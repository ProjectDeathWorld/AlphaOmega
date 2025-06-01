import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
} from 'react-native';
import * as SQLite from 'expo-sqlite';
import { riddles } from '../app/riddles';

let db: SQLite.SQLiteDatabase | null = null;

type Level = 'easy' | 'normal' | 'hard';

const levelConfig = {
  easy: { count: 15, points: 1 },
  normal: { count: 10, points: 2 },
  hard: { count: 5, points: 3 },
};

type AnswerRecord = {
  question: string;
  correctAnswer: string;
  userAnswer: string;
  isCorrect: boolean;
};

// Setup database and create table
export const setupDatabase = async () => {
  db = await SQLite.openDatabaseAsync('answers.db');
  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT,
      correctAnswer TEXT,
      userAnswer TEXT,
      isCorrect INTEGER
    );`
  );
};

async function saveAnswersToDB(answers: AnswerRecord[]) {
  if (!db) return;
  await db.execAsync('DELETE FROM answers;'); // Clear previous answers
  for (const a of answers) {
    await db.runAsync(
      'INSERT INTO answers (question, correctAnswer, userAnswer, isCorrect) VALUES (?, ?, ?, ?);',
      [a.question, a.correctAnswer, a.userAnswer, a.isCorrect ? 1 : 0]
    );
  }
}

async function fetchAnswersFromDB(): Promise<AnswerRecord[]> {
  if (!db) return [];
  const results = await db.getAllAsync('SELECT question, correctAnswer, userAnswer, isCorrect FROM answers;');
return results.map((row) => {
  const r = row as { question: string; correctAnswer: string; userAnswer: string; isCorrect: number };
  return {
    question: r.question,
    correctAnswer: r.correctAnswer,
    userAnswer: r.userAnswer,
    isCorrect: !!r.isCorrect,
  };
});
}

export default function LevelSelector() {
  const [level, setLevel] = useState<Level | null>(null);

  if (!level) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Select Level</Text>
        <Button title="Easy" onPress={() => setLevel('easy')} />
        <Button title="Normal" onPress={() => setLevel('normal')} />
        <Button title="Hard" onPress={() => setLevel('hard')} />
      </View>
    );
  }

  return <Game level={level} />;
}

function Game({ level }: { level: Level }) {
  const [current, setCurrent] = useState(0);
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [dbAnswers, setDbAnswers] = useState<AnswerRecord[]>([]);
  const [saved, setSaved] = useState(false);

  let start = 0;
  if (level === 'normal') start = 15;
  if (level === 'hard') start = 25;
  const questions = riddles.slice(start, start + levelConfig[level].count);

  useEffect(() => {
    setupDatabase();
  }, []);

  useEffect(() => {
    if (finished && answers.length > 0 && !saved) {
      saveAnswersToDB(answers).then(() => {
        fetchAnswersFromDB().then(setDbAnswers);
        setSaved(true);
      });
    }
  }, [finished, answers, saved]);

  const handleSubmit = () => {
    const userAnswer = input.trim();
    const correctAnswer = questions[current].answer;
    const isCorrect = userAnswer.toLowerCase() === correctAnswer.toLowerCase();

    if (isCorrect) {
      setScore(score + levelConfig[level].points);
    }

    setAnswers([
      ...answers,
      {
        question: questions[current].question,
        correctAnswer,
        userAnswer,
        isCorrect,
      },
    ]);
    setInput('');
    if (current + 1 < questions.length) {
      setCurrent(current + 1);
    } else {
      setFinished(true);
    }
  };

  if (finished) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Game Over!</Text>
        <Text style={styles.score}>Your score: {score}</Text>
        <Text style={styles.subtitle}>Review your answers (from database):</Text>
        {(dbAnswers.length > 0 ? dbAnswers : answers).map((a, i) => (
          <View key={i} style={[styles.answerBox, a.isCorrect ? styles.correct : styles.incorrect]}>
            <Text style={styles.questionText}>{i + 1}. {a.question}</Text>
            <Text>
              Your answer: <Text style={{ fontWeight: 'bold' }}>{a.userAnswer || <Text style={{color: 'gray'}}>No answer</Text>}</Text>
            </Text>
            <Text>
              Correct answer: <Text style={{ fontWeight: 'bold' }}>{a.correctAnswer}</Text>
            </Text>
            <Text style={{ color: a.isCorrect ? 'green' : 'red', fontWeight: 'bold' }}>
              {a.isCorrect ? 'Correct' : 'Wrong'}
            </Text>
          </View>
        ))}
        <Button
          title="Play Again"
          onPress={() => {
            setCurrent(0);
            setScore(0);
            setFinished(false);
            setAnswers([]);
            setDbAnswers([]);
            setSaved(false);
          }}
        />
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <Text style={styles.level}>Level: {level.toUpperCase()}</Text>
          <Text style={styles.progress}>
            Question {current + 1} of {questions.length}
          </Text>
          <Text style={styles.riddle}>{questions[current].question}</Text>
          <TextInput
            style={styles.input}
            placeholder="Your answer"
            value={input}
            onChangeText={setInput}
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={handleSubmit}
            returnKeyType="done"
          />
          <Button title="Submit" onPress={handleSubmit} />
          <Text style={styles.score}>Score: {score}</Text>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 28, marginBottom: 20, fontWeight: 'bold' },
  subtitle: { fontSize: 18, marginBottom: 16, textAlign: 'center', color: '#6C63FF' },
  level: { fontSize: 20, marginBottom: 10 },
  progress: { fontSize: 16, marginBottom: 10 },
  riddle: { fontSize: 18, marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', width: 220, padding: 10, marginBottom: 10, borderRadius: 8, fontSize: 16, backgroundColor: '#fafafa' },
  score: { fontSize: 18, marginTop: 10 },
  answerBox: { marginBottom: 16, padding: 12, borderRadius: 8, backgroundColor: '#f5f5f5', width: '100%' },
  correct: { borderLeftWidth: 6, borderLeftColor: 'green' },
  incorrect: { borderLeftWidth: 6, borderLeftColor: 'red' },
  questionText: { fontWeight: 'bold', marginBottom: 4 },
});