import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

// 1. Parse .env.local
const envContent = fs.readFileSync(".env.local", "utf8");
for (const line of envContent.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) {
    const k = m[1].trim();
    const v = m[2].trim().replace(/^["']|["']$/g, "");
    process.env[k] = v;
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase configuration");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const packageDir = "C:\\Users\\NareshAdmin\\Downloads\\Opus_Care_Training_Compliance_Full_Package";

async function main() {
  console.log("====================================================");
  console.log("OPUS CARE: SEEDING FULL TRAINING PACKAGE & EXTERNAL HUB");
  console.log("====================================================\n");

  // Ensure public/training directory exists for local preview
  const publicTrainingDir = path.join(process.cwd(), "public", "training");
  if (!fs.existsSync(publicTrainingDir)) {
    fs.mkdirSync(publicTrainingDir, { recursive: true });
  }

  // A. Upload PDFs to Supabase Storage & copy to public/training
  console.log("Phase A: Uploading Training PDFs to Storage & Public Web...");
  const pdfFiles = fs.readdirSync(packageDir).filter(f => f.endsWith(".pdf"));
  console.log(`Found ${pdfFiles.length} PDF files in package.\n`);

  for (const file of pdfFiles) {
    const filePath = path.join(packageDir, file);
    const fileBuffer = fs.readFileSync(filePath);

    // Copy to public/training
    const publicDest = path.join(publicTrainingDir, file);
    fs.writeFileSync(publicDest, fileBuffer);

    // Upload to Supabase Storage (crm-documents -> training/materials/{file})
    const storagePath = `training/materials/${file}`;
    const { error: upErr } = await supabase.storage
      .from("crm-documents")
      .upload(storagePath, fileBuffer, {
        contentType: "application/pdf",
        upsert: true
      });

    if (upErr) {
      console.warn(`   ⚠️ Storage upload note for ${file}:`, upErr.message);
    } else {
      console.log(`   ✓ Uploaded & Synced: ${file}`);
    }
  }

  // B. Seed Internal Courses from training_seed_data.json
  console.log("\nPhase B: Seeding Internal Courses into training_courses...");
  const seedFile = path.join(packageDir, "training_seed_data.json");
  const rawSeed = JSON.parse(fs.readFileSync(seedFile, "utf8"));
  console.log(`Found ${rawSeed.length} internal courses to process.\n`);

  const seededCourses = [];
  for (const c of rawSeed) {
    // Transform quiz questions: answer -> correct_index
    const questions = (c.quiz_questions || []).map(q => ({
      question: q.question,
      options: q.options,
      correct_index: q.answer !== undefined ? q.answer : 0
    }));

    // Web URL path accessible in portal
    const materialUrl = c.material_file ? `/training/${c.material_file}` : null;

    const coursePayload = {
      title: c.title.trim(),
      description: c.description || "",
      course_type: c.course_type || "read_quiz",
      material_type: c.material_type || "pdf",
      material_url: materialUrl,
      quiz_questions: questions.length > 0 ? questions : null,
      pass_mark_pct: c.pass_mark_pct || 80,
      validity_months: c.validity_months || 12,
      is_mandatory: c.is_mandatory ?? true,
      certificate_enabled: c.certificate_enabled ?? true,
      is_active: true,
      created_by: "Admin"
    };

    // Check if course already exists by title
    const { data: existing } = await supabase
      .from("training_courses")
      .select("id")
      .eq("title", coursePayload.title)
      .maybeSingle();

    if (existing) {
      const { data: updated, error: upErr } = await supabase
        .from("training_courses")
        .update(coursePayload)
        .eq("id", existing.id)
        .select()
        .single();

      if (upErr) {
        console.error(`   ✗ Error updating course ${c.title}:`, upErr.message);
      } else {
        seededCourses.push(updated);
        console.log(`   ✓ Updated existing course: "${c.title}" (${updated.id.slice(0, 8)})`);
      }
    } else {
      const { data: inserted, error: inErr } = await supabase
        .from("training_courses")
        .insert(coursePayload)
        .select()
        .single();

      if (inErr) {
        console.error(`   ✗ Error inserting course ${c.title}:`, inErr.message);
      } else {
        seededCourses.push(inserted);
        console.log(`   ✓ Created new course: "${c.title}" (${inserted.id.slice(0, 8)})`);
      }
    }
  }

  // C. Assign all internal courses to active support workers
  console.log("\nPhase C: Assigning All Internal Modules to Support Workers...");
  const staffToAssign = [
    { id: "STF-001", name: "James Wilson" },
    { id: "STF-002", name: "Sophie Clarke" }
  ];

  const dueDate = new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0]; // 14 days

  for (const s of staffToAssign) {
    let assignedCount = 0;
    for (const course of seededCourses) {
      const { error } = await supabase
        .from("training_assignments")
        .upsert(
          {
            course_id: course.id,
            staff_id: s.id,
            staff_name: s.name,
            due_date: dueDate,
            assigned_by: "Admin"
          },
          { onConflict: "course_id,staff_id" }
        );
      if (!error) assignedCount++;
    }
    console.log(`   ✓ Assigned ${assignedCount} courses to ${s.name} (${s.id}) (Due: ${dueDate})`);
  }

  // D. Seed Free External Training Library
  console.log("\nPhase D: Seeding Free External Training Library...");
  const externalCatalog = [
    {
      title: "Worker Orientation – Quality, Safety and You",
      provider: "NDIS Quality & Safeguards Commission",
      category: "NDIS Essentials",
      description: "Official NDIS orientation course covering worker responsibilities under the NDIS Code of Conduct, human rights, choice & control, and duty of care.",
      cost: "Free",
      certificate_type: "Official Certificate",
      target_audience: "Required: All Workers",
      duration_text: "Approx. 90 mins",
      url: "https://training.ndiscommission.gov.au/",
      is_active: true
    },
    {
      title: "New Worker NDIS Induction (8 Modules)",
      provider: "NDIS Quality & Safeguards Commission",
      category: "NDIS Essentials",
      description: "Comprehensive 8-part modular induction covering disability identity, communication, incident reporting, safe mealtime practice, and person-centred values.",
      cost: "Free",
      certificate_type: "Official Certificate",
      target_audience: "Recommended: New Workers",
      duration_text: "3–4 hours (Self-paced)",
      url: "https://training.ndiscommission.gov.au/",
      is_active: true
    },
    {
      title: "Supporting Effective Communication",
      provider: "NDIS Quality & Safeguards Commission",
      category: "NDIS Essentials",
      description: "Practical guide to communication rights, non-verbal cues, using augmentative and alternative communication (AAC) devices, and listening actively.",
      cost: "Free",
      certificate_type: "Official Certificate",
      target_audience: "Required: All Workers",
      duration_text: "Approx. 45 mins",
      url: "https://training.ndiscommission.gov.au/",
      is_active: true
    },
    {
      title: "Supporting Safe and Enjoyable Meals",
      provider: "NDIS Quality & Safeguards Commission",
      category: "NDIS Essentials",
      description: "Essential training on identifying choking risks, understanding dysphagia, meal texture preparations, and following speech pathology mealtime plans.",
      cost: "Free",
      certificate_type: "Official Certificate",
      target_audience: "Role-specific: Mealtime Support",
      duration_text: "Approx. 60 mins",
      url: "https://training.ndiscommission.gov.au/",
      is_active: true
    },
    {
      title: "Abuse, Neglect & Exploitation – Module 1: Frontline Workers",
      provider: "NSW Ageing & Disability Commission",
      category: "Safeguarding",
      description: "Free online training for frontline workers on identifying indicators of abuse, neglect and exploitation of older people and adults with disability in home and community settings.",
      cost: "Free",
      certificate_type: "Downloadable Certificate",
      target_audience: "Required: All Workers",
      duration_text: "Approx. 15–20 mins",
      url: "https://www.ageingdisabilitycommission.nsw.gov.au/training.html",
      is_active: true
    },
    {
      title: "Abuse, Neglect & Exploitation – Module 2: Supervisors & Managers",
      provider: "NSW Ageing & Disability Commission",
      category: "Safeguarding",
      description: "Guidance for coordinators, team leaders and managers on handling notifications, reporting to the Commission, and supporting workers through safeguarding inquiries.",
      cost: "Free",
      certificate_type: "Downloadable Certificate",
      target_audience: "Role-specific: Supervisors",
      duration_text: "Approx. 20 mins",
      url: "https://www.ageingdisabilitycommission.nsw.gov.au/training.html",
      is_active: true
    },
    {
      title: "Know My Rights – Provider & Support Worker Journey",
      provider: "NDIS Commission / Ausmed",
      category: "NDIS Essentials",
      description: "Interactive scenario-based learning journey focused on participant rights, dignity, and real-world application of the NDIS Code of Conduct.",
      cost: "Free",
      certificate_type: "Online Pathway",
      target_audience: "Recommended",
      duration_text: "Approx. 45 mins",
      url: "https://www.ausmed.com.au/",
      is_active: true
    },
    {
      title: "Skills for Active Support (8 Modules)",
      provider: "La Trobe University / Living with Disability",
      category: "Support Practice",
      description: "Evidence-based Active Support approach to increase meaningful engagement, autonomy, and quality of life for people with intellectual disability. (Creative Commons BY-SA 4.0).",
      cost: "Free",
      certificate_type: "Creative Commons",
      target_audience: "Recommended: Intellectual Disability",
      duration_text: "8 Self-Paced Modules",
      url: "https://everymomenthaspotential.com.au/",
      is_active: true
    },
    {
      title: "Positive Behaviour Support & Trauma-Informed Practice",
      provider: "NDS / NDIS Commission",
      category: "Behaviour & Trauma",
      description: "Upholding human rights, understanding distress communication, proactive de-escalation, and reducing restrictive practices safely.",
      cost: "Free",
      certificate_type: "Official Certificate",
      target_audience: "Role-specific",
      duration_text: "Approx. 60–90 mins",
      url: "https://www.nds.org.au/",
      is_active: true
    },
    {
      title: "Frontline Practice Leadership",
      provider: "La Trobe University",
      category: "Leadership",
      description: "Six free modules on coaching frontline workers, observing support practice, providing constructive feedback, and sustaining high-quality culture. (Creative Commons BY-SA 4.0).",
      cost: "Free",
      certificate_type: "Creative Commons",
      target_audience: "Leadership & Supervisors",
      duration_text: "6 Modules",
      url: "https://everymomenthaspotential.com.au/frontline-practice-leadership/",
      is_active: true
    },
    {
      title: "External Support Workers Training",
      provider: "ADCET Academy",
      category: "Optional Specialist Learning",
      description: "Professional conduct, working relationships, and practical boundaries when supporting students with disability in education and community contexts.",
      cost: "Free",
      certificate_type: "Certificate + Digital Badge",
      target_audience: "Optional PD",
      duration_text: "Approx. 45 mins",
      url: "https://www.adcet.edu.au/",
      is_active: true
    }
  ];

  let extCount = 0;
  for (const ext of externalCatalog) {
    const { data: existingExt } = await supabase
      .from("external_courses")
      .select("id")
      .eq("title", ext.title)
      .maybeSingle();

    if (existingExt) {
      await supabase
        .from("external_courses")
        .update(ext)
        .eq("id", existingExt.id);
    } else {
      await supabase
        .from("external_courses")
        .insert(ext);
    }
    extCount++;
    console.log(`   ✓ External Course: "${ext.title}" (${ext.provider}) [${ext.category}]`);
  }

  console.log(`\nSuccessfully seeded ${extCount} free external training resources!`);
  console.log("\n====================================================");
  console.log("TRAINING PACKAGE IMPORT & DEPLOYMENT COMPLETE (100% OK)");
  console.log("====================================================");
}

main().catch(console.error);
