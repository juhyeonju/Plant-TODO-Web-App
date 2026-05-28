import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";


import { useState, useEffect, useCallback } from "react";
import { supabase } from "./lib/supabase";
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
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("오늘 첫 할 일을 완료해보세요!");
  const [feedbackLoading, setFeedbackLoading] = useState(false);

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

  // 귀여운 과일 장식 목록
  const fruits = ["🍓", "🍊", "🍋", "🍇", "🍎", "🍑", "🍒", "🥝"];

  // 초기 데이터 로드 (Supabase)
  useEffect(() => {
    const fetchTodos = async () => {
      const { data, error } = await supabase
        .from("todos")
        .select("*")
        .order("created_at", { ascending: true });
      if (!error && data) setTodos(data);
      setLoading(false);
    };
    fetchTodos();
  }, []);

  // AI 피드백 요청 (DeepSeek via /api/feedback)
  const fetchFeedback = useCallback(async (currentTodos) => {
    if (currentTodos.length === 0) {
      setFeedback("오늘 첫 할 일을 완료해보세요!");
      return;
    }
    const wilt = currentTodos.length - currentTodos.filter((t) => t.done).length >= 3;
    if (wilt) {
      setFeedback("미완료 할 일이 많아 식물이 시들었어요. 하나씩 완료해보세요!");
      return;
    }
    setFeedbackLoading(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completedCount: currentTodos.filter((t) => t.done).length,
          totalCount: currentTodos.length,
          todos: currentTodos,
        }),
      });
      const data = await res.json();
      if (data.feedback) setFeedback(data.feedback);
    } catch {
      // 네트워크 오류 시 기존 피드백 유지
    } finally {
      setFeedbackLoading(false);
    }
  }, []);

  // 할 일 추가
  const addTodo = async () => {
    if (text.trim() === "") return;
    const { data, error } = await supabase
      .from("todos")
      .insert({ text: text.trim(), done: false })
      .select()
      .single();
    if (!error && data) {
      const updated = [...todos, data];
      setTodos(updated);
      fetchFeedback(updated);
    }
    setText("");
  };

  // 완료 토글
  const toggleTodo = async (id, currentDone) => {
    const { error } = await supabase
      .from("todos")
      .update({ done: !currentDone })
      .eq("id", id);
    if (!error) {
      const updated = todos.map((todo) =>
        todo.id === id ? { ...todo, done: !currentDone } : todo
      );
      setTodos(updated);
      fetchFeedback(updated);
    }
  };

  // 할 일 삭제
  const deleteTodo = async (id) => {
    const { error } = await supabase.from("todos").delete().eq("id", id);
    if (!error) {
      const updated = todos.filter((todo) => todo.id !== id);
      setTodos(updated);
      fetchFeedback(updated);
    }
  };

  // 할 일 수정
  const editTodo = async (id) => {
    const newText = prompt("새로운 할 일을 입력하세요");
    if (!newText) return;
    const { error } = await supabase
      .from("todos")
      .update({ text: newText })
      .eq("id", id);
    if (!error) {
      setTodos(todos.map((todo) =>
        todo.id === id ? { ...todo, text: newText } : todo
      ));
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") addTodo();
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
        <p className={`feedback ${feedbackLoading ? "feedback--loading" : ""}`}>
          {feedbackLoading ? "AI가 피드백을 작성 중..." : feedback}
        </p>

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
          onKeyDown={handleKeyDown}
          placeholder="할 일을 입력하세요"
          disabled={loading}
        />
        <button onClick={addTodo} disabled={loading}>추가</button>
      </div>

      {loading ? (
        <p className="loading-text">불러오는 중...</p>
      ) : (
      <ul>
        {todos.map((todo) => (
          <li key={todo.id} className={todo.done ? "done" : ""}>
  <div className="todo-left">
    <input
      type="checkbox"
      checked={todo.done}
      onChange={() => toggleTodo(todo.id, todo.done)}
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
      )}

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