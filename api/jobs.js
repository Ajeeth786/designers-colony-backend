import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // backend-only
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      title,
      company,
      location,
      job_type,
      experience_level,
      salary_range,
      apply_url,
      source,
      tags
    } = req.body;

    if (!title || !company || !apply_url) {
      return res.status(400).json({
        error: "Missing required fields: title, company, apply_url"
      });
    }

    const { data, error } = await supabase
      .from("jobs")
      .insert([
        {
          title,
          company,
          location,
          job_type,
          experience_level,
          salary_range,
          apply_url,
          source,
          tags
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ error: "Failed to insert job" });
    }

    return res.status(201).json({
      success: true,
      job: data
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
