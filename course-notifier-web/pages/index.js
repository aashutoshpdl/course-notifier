import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Home() {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    // Fetch initial courses
    supabase
      .from("courses")
      .select("*")
      .order("first_seen", { ascending: false })
      .then(({ data }) => setCourses(data || []));

    // Realtime subscription using v2 syntax
    const coursesChannel = supabase
      .channel("courses-channel")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "courses" },
        (payload) => {
          setCourses((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(coursesChannel);
    };
  }, []);

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
