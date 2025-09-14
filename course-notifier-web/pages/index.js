import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Home() {
  const [courses, setCourses] = useState([]);
  const [audioAllowed, setAudioAllowed] = useState(false);

  useEffect(() => {
    // Request notification permission
    if ("Notification" in window) {
      Notification.requestPermission();
    }

    // Fetch initial courses
    supabase
      .from("courses")
      .select("*")
      .order("first_seen", { ascending: false })
      .then(({ data }) => setCourses(data || []));

    // Prepare audio element
    const audio = new Audio("/ding.mp3");

    // Realtime subscription
    const coursesChannel = supabase
      .channel("courses-channel")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "courses" },
        (payload) => {
          setCourses((prev) => [payload.new, ...prev]);

          // Browser notification
          if (Notification.permission === "granted") {
            new Notification("New Course Added!", {
              body: payload.new.title,
            });
          }

          // Play sound only if user interacted once
          if (audioAllowed) {
            audio.play().catch((err) => console.error("Audio play error:", err));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(coursesChannel);
    };
  }, [audioAllowed]);

  // Button to enable audio on first click
  const handleEnableAudio = () => {
    const audio = new Audio("/ding.mp3");
    audio.play().catch(() => {});
    setAudioAllowed(true);
  };

  const containerStyle = {
    maxWidth: "800px",
    margin: "2rem auto",
    padding: "1rem",
    fontFamily: "Arial, sans-serif",
    color: "#111",
    lineHeight: 1.6,
  };

  const headerStyle = {
    fontSize: "2rem",
    marginBottom: "1rem",
    textAlign: "center",
  };

  const listStyle = {
    listStyleType: "disc",
    paddingLeft: "1.5rem",
  };

  const listItemStyle = {
    padding: "0.5rem 0",
    borderBottom: "1px solid #eee",
  };

  return (
    <div style={containerStyle}>
      <h1 style={headerStyle}>New Courses</h1>

      {/* Button to allow sound */}
      {!audioAllowed && (
        <button onClick={handleEnableAudio} style={{ marginBottom: "1rem" }}>
          Enable Sound Notifications
        </button>
      )}

      {courses.length === 0 ? (
        <p>No courses available yet.</p>
      ) : (
        <ul style={listStyle}>
          {courses.map((c) => (
            <li key={c.id} style={listItemStyle}>
              {c.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
