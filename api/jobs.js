import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  /* ================================
     ✅ CORS (VERY IMPORTANT)
  ================================= */
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, x-internal-key"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  /* ================================
     🔐 Protect ONLY POST (internal)
  ================================= */
  if (req.method === "POST") {
    if (req.headers["x-internal-key"] !== process.env.INTERNAL_API_KEY) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  /* ================================
     🚫 Allow only GET & POST
  ================================= */
  if (!["GET", "POST"].includes(req.method)) {
    return res.status(405).json({ error: "Method not allowed" });
  }

  /* ================================
     📥 PUBLIC GET JOBS (frontend)
  ================================= */
  if (req.method === "GET") {
    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "10", 10);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from("jobs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Fetch error:", error);
      return res.status(500).json({ error: "Failed to fetch jobs" });
    }

    return res.status(200).json({
      success: true,
      page,
      limit,
      total: count,
      jobs: data,
    });
  }

  /* ================================
     ➕ INTERNAL POST JOB
  ================================= */
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
      tags,
    } = req.body;

    if (!title || !company || !apply_url) {
      return res.status(400).json({
        error: "Missing required fields: title, company, apply_url",
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
          tags,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Insert error:", error);
      return res.status(500).json({ error: "Failed to insert job" });
    }

    return res.status(201).json({
      success: true,
      job: data,
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
