require("dotenv").config();
const puppeteer = require("puppeteer");
const { createClient } = require("@supabase/supabase-js");

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function scrapeCourses() {
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();

  await page.goto("https://www.courspora.my.id/course", {
    waitUntil: "networkidle2",
    timeout: 60000,
  });

  // Extract top 5 course titles
  const courses = await page.$$eval(
    "a.font-bold.line-clamp-2",
    (els) => els.map((el) => el.textContent.trim()).filter(Boolean)
  );

  const topCourses = courses.slice(0, 5);

  for (const title of topCourses) {
    // Check if course already exists in DB
    const { data, error } = await supabase
      .from("courses")
      .select("id")
      .eq("title", title)
      .maybeSingle();

    if (error) {
      console.error("DB error:", error);
      continue;
    }

    // Insert only if new
    if (!data) {
      const { error: insertError } = await supabase
        .from("courses")
        .insert([{ title, first_seen: new Date().toISOString() }]);

      if (insertError) {
        console.error("Insert failed:", insertError);
      } else {
        console.log("New course saved:", title);

        // 👉 Place to trigger notification (Supabase function or webhook)
        // e.g. call your /notify endpoint here
      }
    }
  }

  await browser.close();
}

scrapeCourses().catch(console.error);
