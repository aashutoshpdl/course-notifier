const fetch = require("node-fetch");
const cheerio = require("cheerio");
const { createClient } = require("@supabase/supabase-js");

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function scrapeCourses() {
  const res = await fetch("https://www.courspora.my.id/course");
  const html = await res.text();
  const $ = cheerio.load(html);

  const courses = [];
  $("a.font-bold.line-clamp-2").each((_, el) => {
    const title = $(el).text().trim();
    if (title) courses.push(title);
  });

  console.log("Found courses:", courses);

  for (const title of courses) {
    // Check if exists
    const { data, error } = await supabase
      .from("courses")
      .select("id")
      .eq("title", title)
      .maybeSingle();

    if (error) {
      console.error("DB error:", error);
      continue;
    }

    if (!data) {
      const { error: insertError } = await supabase
        .from("courses")
        .insert([{ title, first_seen: new Date().toISOString() }]);

      if (insertError) console.error("Insert failed:", insertError);
      else console.log("Inserted new course:", title);
    } else {
      console.log("Already in DB:", title);
    }
  }
}

scrapeCourses().catch(console.error);


