import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";


import { useState } from "react";
import "./App.css";

// Chart.js import
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

import { Bar } from "react-chartjs-2";

// Chart.js 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
);

function App() {
  // 입력창 내용 저장
  const [text, setText] = useState("");

  // 할 일 목록 저장
  const [todos, setTodos] = useState([]);

  // 완료된 할 일 개수 계산
  const completedCount = todos.filter((todo) => todo.done).length;

  // 완료율 계산
  const progress =
    todos.length === 0 ? 0 : Math.round((completedCount / todos.length) * 100);

  // 그래프 데이터
const chartData = {
  labels: ["전체 할 일", "완료", "미완료"],
  datasets: [
    {
      label: "할 일 통계",
      data: [
        todos.length,
        completedCount,
        todos.length - completedCount,
      ],
      backgroundColor: [
        "#81c784",
        "#43a047",
        "#c8e6c9",
      ],
      borderRadius: 12,
    },
  ],
};


// 완료된 할 일을 달력 이벤트로 변환
const calendarEvents = todos
  .filter((todo) => todo.done)
  .map((todo) => ({
    title: todo.text,
    date: new Date().toISOString().split("T")[0],
  }));

  // 미완료 할 일이 3개 이상이면 식물이 시든 상태로 변경
  const isWithered = todos.length - completedCount >= 3;

  // 완료 개수에 따라 식물 성장 단계 변경
  let plantEmoji = "🌱";
  let plantStage = "씨앗 단계";

  if (completedCount >= 2) {
    plantEmoji = "🌿";
    plantStage = "새싹 단계";
  }

  if (completedCount >= 4) {
    plantEmoji = "🌸";
    plantStage = "꽃 단계";
  }

  if (completedCount >= 6) {
    plantEmoji = "🍎";
    plantStage = "열매 단계";
  }

  // AI처럼 보이는 피드백 문장
  let feedback = "오늘 첫 할 일을 완료해보세요!";
  if (completedCount >= 1) feedback = "좋아요! 작은 실천이 성장으로 이어지고 있어요.";
  if (completedCount >= 3) feedback = "완료 패턴이 좋습니다. 오늘 집중력이 높아 보여요!";
  if (completedCount >= 5) feedback = "멋져요! 생산성 나무가 열매를 맺고 있어요.";
  if (isWithered) feedback = "미완료 할 일이 많아 식물이 시들었어요. 하나씩 완료해보세요!";

  // 귀여운 과일 장식 목록
  const fruits = ["🍓", "🍊", "🍋", "🍇", "🍎", "🍑", "🍒", "🥝"];

  // 할 일 추가 함수
  const addTodo = () => {
    if (text.trim() === "") return;

    const newTodo = {
      id: Date.now(),
      text: text,
      done: false,
      createdAt: new Date(),
    };

    setTodos([...todos, newTodo]);
    setText("");
  };

  // 완료 체크 변경 함수
  const toggleTodo = (id) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, done: !todo.done } : todo
      )
    );
  };

  // 할 일 삭제 함수
const deleteTodo = (id) => {
  setTodos(todos.filter((todo) => todo.id !== id));
};

// 할 일 수정 함수
const editTodo = (id) => {
  // 수정할 내용을 입력받기
  const newText = prompt("새로운 할 일을 입력하세요");

  // 아무것도 안 입력하면 종료
  if (!newText) return;

  // 해당 todo 내용 수정
  setTodos(
    todos.map((todo) =>
      todo.id === id ? { ...todo, text: newText } : todo
    )
  );
};

  return (
    <div className="app">
      <div className="fruit-background">
        {fruits.map((fruit, index) => (
          <span key={index} className={`floating-fruit fruit-${index}`}>
            {fruit}
          </span>
        ))}
      </div>

      <h1>🌿 식물 성장 TODO 앱</h1>
      <p className="subtitle">할 일을 완료할수록 나만의 식물이 성장합니다.</p>

      <div className="plant-box">
        <div className="badge">🍀 오늘의 성장 기록</div>

        <div className="plant-circle">
          <div className={isWithered ? "plant withered" : "plant"}>
            {isWithered ? "🥀" : plantEmoji}
          </div>
        </div>

        <h2>{isWithered ? "시든 상태" : plantStage}</h2>
        <p className="feedback">{feedback}</p>

        <div className="progress-area">
          <div className="progress-text">성장률 {progress}%</div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="input-box">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="할 일을 입력하세요"
        />
        <button onClick={addTodo}>추가</button>
      </div>

      <ul>
        {todos.map((todo) => (
          <li key={todo.id} className={todo.done ? "done" : ""}>
  <div className="todo-left">
    <input
      type="checkbox"
      checked={todo.done}
      onChange={() => toggleTodo(todo.id)}
    />

    <span>{todo.text}</span>
  </div>

  <div className="todo-buttons">
    <button
      className="edit-btn"
      onClick={() => editTodo(todo.id)}
    >
      수정
    </button>

    <button
      className="delete-btn"
      onClick={() => deleteTodo(todo.id)}
    >
      삭제
    </button>
  </div>
</li>
        ))}
      </ul>

      {/* 생산성 통계 그래프 */}
<div className="chart-box">
  <h3>📊 생산성 통계</h3>

  <Bar data={chartData} />
</div>

{/* 완료 히스토리 달력 */}
<div className="calendar-box">
  <h3>📅 완료 히스토리</h3>

  <FullCalendar
    plugins={[dayGridPlugin]}
    initialView="dayGridMonth"
    events={calendarEvents}
    height="auto"
  />
</div>

      <div className="summary">
        전체 할 일: {todos.length}개 / 완료: {completedCount}개
      </div>
    </div>
  );
}

export default App;