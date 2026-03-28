import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/lib/database.types";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
});

const supabase = createClient<Database>(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

const DEMO_USERS = [
  {
    email: "admin@caseflow.demo",
    fullName: "Alex Morgan",
    password: "CaseFlowDemo123!",
    role: "admin" as const,
  },
  {
    email: "staff@caseflow.demo",
    fullName: "Jordan Lee",
    password: "CaseFlowDemo123!",
    role: "staff" as const,
  },
];

const DEMO_CLIENTS: Database["public"]["Tables"]["clients"]["Insert"][] = [
  {
    client_id: "CF-DEMO-001",
    full_name: "Marisol Vega",
    preferred_name: "Mari",
    date_of_birth: "1987-04-11",
    phone: "(602) 555-0101",
    email: "marisol.vega@example.org",
    preferred_language: "Spanish",
    pronouns: "she/her",
    housing_status: "Temporary housing",
    referral_source: "Community partner",
  },
  {
    client_id: "CF-DEMO-002",
    full_name: "Devon Carter",
    preferred_name: null,
    date_of_birth: "1995-09-03",
    phone: "(602) 555-0102",
    email: "devon.carter@example.org",
    preferred_language: "English",
    pronouns: "they/them",
    housing_status: "Stable housing",
    referral_source: "Walk-in",
  },
  {
    client_id: "CF-DEMO-003",
    full_name: "Amina Hassan",
    preferred_name: null,
    date_of_birth: "1979-12-18",
    phone: "(602) 555-0103",
    email: "amina.hassan@example.org",
    preferred_language: "Arabic",
    pronouns: "she/her",
    housing_status: "Staying with family or friends",
    referral_source: "Hospital",
  },
  {
    client_id: "CF-DEMO-004",
    full_name: "Bryce Nguyen",
    preferred_name: "Bryce",
    date_of_birth: "2000-06-24",
    phone: "(602) 555-0104",
    email: "bryce.nguyen@example.org",
    preferred_language: "English",
    pronouns: "he/him",
    housing_status: "Unsheltered",
    referral_source: "Hotline",
  },
  {
    client_id: "CF-DEMO-005",
    full_name: "Elena Ruiz",
    preferred_name: null,
    date_of_birth: "1992-02-07",
    phone: "(602) 555-0105",
    email: "elena.ruiz@example.org",
    preferred_language: "Spanish",
    pronouns: "she/her",
    housing_status: "Stable housing",
    referral_source: "School",
  },
  {
    client_id: "CF-DEMO-006",
    full_name: "Samuel Price",
    preferred_name: "Sam",
    date_of_birth: "1984-11-29",
    phone: "(602) 555-0106",
    email: "samuel.price@example.org",
    preferred_language: "English",
    pronouns: "he/him",
    housing_status: "Temporary housing",
    referral_source: "Community partner",
  },
  {
    client_id: "CF-DEMO-007",
    full_name: "Tiana Brooks",
    preferred_name: null,
    date_of_birth: "1998-08-15",
    phone: "(602) 555-0107",
    email: "tiana.brooks@example.org",
    preferred_language: "English",
    pronouns: "she/her",
    housing_status: "Stable housing",
    referral_source: "Walk-in",
  },
  {
    client_id: "CF-DEMO-008",
    full_name: "Oscar Delgado",
    preferred_name: "Oz",
    date_of_birth: "1974-05-22",
    phone: "(602) 555-0108",
    email: "oscar.delgado@example.org",
    preferred_language: "Spanish",
    pronouns: "he/him",
    housing_status: "Temporary housing",
    referral_source: "Hospital",
  },
  {
    client_id: "CF-DEMO-009",
    full_name: "Priya Nair",
    preferred_name: null,
    date_of_birth: "1989-03-17",
    phone: "(602) 555-0109",
    email: "priya.nair@example.org",
    preferred_language: "English",
    pronouns: "she/her",
    housing_status: "Stable housing",
    referral_source: "Community partner",
  },
  {
    client_id: "CF-DEMO-010",
    full_name: "Mateo Jimenez",
    preferred_name: null,
    date_of_birth: "2001-10-30",
    phone: "(602) 555-0110",
    email: "mateo.jimenez@example.org",
    preferred_language: "Spanish",
    pronouns: "he/him",
    housing_status: "Staying with family or friends",
    referral_source: "School",
  },
];

const detailedNotes = [
  "Initial intake completed. Discussed transportation barriers, food insecurity, and follow-up scheduling for benefits renewal.",
  "Case management follow-up completed. Client shared that temporary housing remains unstable, but they connected with a shelter partner and need help with work documentation next week.",
  "Resource referral completed. Sent pantry list, rental assistance application instructions, and a clinic contact. Staff will check in again within seven days.",
];

async function ensureDemoUser(user: (typeof DEMO_USERS)[number]) {
  const { data: listedUsers, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });

  if (listError) {
    throw new Error(listError.message);
  }

  const existingUser = listedUsers.users.find(
    (candidate) => candidate.email === user.email,
  );

  const authUser =
    existingUser ??
    (
      await supabase.auth.admin.createUser({
        email: user.email,
        email_confirm: true,
        password: user.password,
        user_metadata: {
          full_name: user.fullName,
        },
      })
    ).data.user;

  if (!authUser) {
    throw new Error(`Could not create demo user ${user.email}.`);
  }

  const { error: updateUserError } = await supabase.auth.admin.updateUserById(
    authUser.id,
    {
      email_confirm: true,
      password: user.password,
      user_metadata: {
        full_name: user.fullName,
      },
    },
  );

  if (updateUserError) {
    throw new Error(updateUserError.message);
  }

  const { error: profileError } = await supabase.from("profiles").upsert({
    email: user.email,
    full_name: user.fullName,
    id: authUser.id,
    role: user.role,
  });

  if (profileError) {
    throw new Error(profileError.message);
  }

  return {
    id: authUser.id,
    name: user.fullName,
  };
}

async function main() {
  console.log("Seeding CaseFlow demo data...");

  const [adminUser, staffUser] = await Promise.all(
    DEMO_USERS.map((user) => ensureDemoUser(user)),
  );

  const { data: serviceTypes, error: serviceTypeError } = await supabase
    .from("service_types")
    .select("id, name")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (serviceTypeError || !serviceTypes?.length) {
    throw new Error(
      serviceTypeError?.message ??
        "No service types found. Run the SQL migration before seeding.",
    );
  }

  const { error: deleteClientsError } = await supabase
    .from("clients")
    .delete()
    .in(
      "client_id",
      DEMO_CLIENTS.map((client) => client.client_id ?? ""),
    );

  if (deleteClientsError) {
    throw new Error(deleteClientsError.message);
  }

  const { data: insertedClients, error: clientInsertError } = await supabase
    .from("clients")
    .insert(
      DEMO_CLIENTS.map((client, index) => ({
        ...client,
        created_by: index % 2 === 0 ? adminUser.id : staffUser.id,
      })),
    )
    .select("id, client_id, full_name");

  if (clientInsertError || !insertedClients) {
    throw new Error(clientInsertError?.message ?? "Failed to insert demo clients.");
  }

  const serviceTypeMap = new Map(serviceTypes.map((serviceType) => [serviceType.name, serviceType.id]));
  const serviceTypeCycle = [
    "Assessment",
    "Case management",
    "Resource referral",
    "Follow-up",
    "Shelter check-in",
    "Crisis response",
  ];

  const serviceEntries: Database["public"]["Tables"]["service_entries"]["Insert"][] =
    insertedClients.flatMap((client, index) => {
      const staffMember = index % 2 === 0 ? adminUser : staffUser;

      return Array.from({ length: 3 }, (_, serviceIndex) => {
        const serviceTypeName = serviceTypeCycle[(index + serviceIndex) % serviceTypeCycle.length];
        const serviceTypeId = serviceTypeMap.get(serviceTypeName);

        if (!serviceTypeId) {
          throw new Error(`Missing service type ${serviceTypeName}.`);
        }

        const dayOffset = index * 3 + serviceIndex;
        const serviceDate = new Date();
        serviceDate.setDate(serviceDate.getDate() - dayOffset);

        const notes =
          index < 3
            ? detailedNotes[serviceIndex % detailedNotes.length]
            : `${serviceTypeName} completed. Staff reviewed progress, confirmed contact details, and documented next steps for the client.`;

        return {
          client_id: client.id,
          notes,
          service_date: serviceDate.toISOString().slice(0, 10),
          service_type_id: serviceTypeId,
          staff_member_name: staffMember.name,
          staff_member_profile_id: staffMember.id,
        };
      });
    });

  const { error: serviceEntryError } = await supabase
    .from("service_entries")
    .insert(serviceEntries);

  if (serviceEntryError) {
    throw new Error(serviceEntryError.message);
  }

  console.log("Seed complete.");
  console.log(`Demo users: ${DEMO_USERS.map((user) => user.email).join(", ")}`);
  console.log("Demo password: CaseFlowDemo123!");
  console.log(`Inserted ${insertedClients.length} clients and ${serviceEntries.length} service entries.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
