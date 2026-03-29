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
    linkedClientPublicId: null,
    mustResetPassword: false,
    password: "CaseFlowDemo123!",
    role: "admin" as const,
  },
  {
    email: "staff@caseflow.demo",
    fullName: "Jordan Lee",
    linkedClientPublicId: null,
    mustResetPassword: false,
    password: "CaseFlowDemo123!",
    role: "staff" as const,
  },
  {
    email: "client@caseflow.demo",
    fullName: "Marisol Vega",
    linkedClientPublicId: "CF-DEMO-001",
    mustResetPassword: false,
    password: "CaseFlowDemo123!",
    role: "client" as const,
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
    status: "active",
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
    status: "active",
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
    status: "active",
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
    status: "active",
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
    status: "inactive",
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
    status: "active",
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
    status: "active",
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
    status: "inactive",
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
    status: "active",
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
    status: "archived",
  },
];

const CUSTOM_FIELD_DEFINITIONS: Database["public"]["Tables"]["custom_field_definitions"]["Insert"][] = [
  {
    entity_type: "client",
    field_key: "program_track",
    field_type: "select",
    is_required: false,
    label: "Program track",
    select_options: ["Housing stabilization", "Food assistance", "Youth services"],
    sort_order: 1,
  },
  {
    entity_type: "client",
    field_key: "intake_priority",
    field_type: "number",
    is_required: false,
    label: "Intake priority score",
    select_options: [],
    sort_order: 2,
  },
  {
    entity_type: "service_entry",
    field_key: "follow_up_channel",
    field_type: "select",
    is_required: false,
    label: "Follow-up channel",
    select_options: ["Phone", "Text", "Email", "In person"],
    sort_order: 1,
  },
  {
    entity_type: "service_entry",
    field_key: "next_step_due",
    field_type: "date",
    is_required: false,
    label: "Next step due",
    select_options: [],
    sort_order: 2,
  },
];

const detailedNotes = [
  "Initial intake completed. Reviewed transportation barriers, food insecurity, and SNAP renewal requirements. Scheduled a follow-up call to confirm document upload.",
  "Housing stabilization follow-up completed. Client reported a pending utility shutoff notice and needs rental assistance paperwork plus landlord ledger before Friday.",
  "Resource referral completed. Sent pantry locations, emergency food delivery options, and bus pass instructions for the benefits office appointment.",
  "Shelter coordination completed. Client connected with an overnight shelter and requested help with employment verification for rapid rehousing screening.",
  "School liaison follow-up completed. Staff documented attendance concerns, transportation issues, and a request for youth services referral next week.",
  "Domestic violence safety planning reviewed. Shared hotline contact details, confidential shelter options, and next-step planning for secure communication.",
  "Benefits navigation completed. Staff confirmed Medicaid renewal status, SNAP recertification deadlines, and pharmacy transport support.",
  "Case conference note recorded. Discussed work documentation, childcare gaps, and appointment scheduling for family resource center intake.",
  "Follow-up call completed. Client needs a replacement ID, proof of income, and a warm handoff to legal aid for eviction prevention.",
  "Employment support session completed. Staff updated resume referral, verified interview clothing voucher status, and documented transit support request.",
];

function getSetupErrorMessage(error: { message: string }) {
  if (error.message.includes("access_allowlist")) {
    return "The access allowlist migration is not applied in Supabase yet. Run supabase/migrations/20260328233000_access_allowlist.sql and try seeding again.";
  }

  if (error.message.includes("must_reset_password")) {
    return "The latest security migration is not applied in Supabase yet. Run supabase/migrations/20260328213000_client_portal_and_security.sql and try seeding again.";
  }

  if (error.message.includes("portal_profile_id")) {
    return "The client portal migration is not applied in Supabase yet. Run supabase/migrations/20260328213000_client_portal_and_security.sql and try seeding again.";
  }

  return error.message;
}

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
    must_reset_password: user.mustResetPassword,
    role: user.role,
  });

  if (profileError) {
    throw new Error(getSetupErrorMessage(profileError));
  }

  return {
    id: authUser.id,
    linkedClientPublicId: user.linkedClientPublicId,
    name: user.fullName,
  };
}

async function main() {
  console.log("Seeding CaseFlow demo data...");

  const [adminUser, staffUser, clientPortalUser] = await Promise.all(
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

  const { error: deleteAllowlistError } = await supabase
    .from("access_allowlist")
    .delete()
    .in(
      "email",
      DEMO_USERS.map((user) => user.email.toLowerCase()),
    );

  if (deleteAllowlistError) {
    throw new Error(getSetupErrorMessage(deleteAllowlistError));
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

  const { error: deleteDefinitionsError } = await supabase
    .from("custom_field_definitions")
    .delete()
    .in(
      "field_key",
      CUSTOM_FIELD_DEFINITIONS.map((definition) => definition.field_key),
    );

  if (deleteDefinitionsError) {
    throw new Error(deleteDefinitionsError.message);
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

  const clientIdByPublicId = new Map(
    insertedClients.map((client) => [client.client_id, client.id]),
  );

  const { error: allowlistError } = await supabase.from("access_allowlist").upsert(
    DEMO_USERS.map((user) => ({
      created_by: adminUser.id,
      email: user.email.toLowerCase(),
      is_active: true,
      linked_client_id: user.linkedClientPublicId
        ? (clientIdByPublicId.get(user.linkedClientPublicId) ?? null)
        : null,
      notes: "Seeded demo access",
      role: user.role,
    })),
    {
      onConflict: "email",
    },
  );

  if (allowlistError) {
    throw new Error(getSetupErrorMessage(allowlistError));
  }

  if (clientPortalUser.linkedClientPublicId) {
    const linkedClient = insertedClients.find((client) => client.client_id === clientPortalUser.linkedClientPublicId);

    if (!linkedClient) {
      throw new Error(
        `Could not find seeded client ${clientPortalUser.linkedClientPublicId} for the demo portal user.`,
      );
    }

    const { error: portalLinkError } = await supabase
      .from("clients")
      .update({
        email: DEMO_USERS.find((user) => user.role === "client")?.email ?? null,
        portal_profile_id: clientPortalUser.id,
      })
      .eq("id", linkedClient.id);

    if (portalLinkError) {
      throw new Error(getSetupErrorMessage(portalLinkError));
    }
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
          detailedNotes[(index * 3 + serviceIndex) % detailedNotes.length] ??
          `${serviceTypeName} completed. Staff reviewed progress, confirmed contact details, and documented next steps.`;

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

  const { data: customFieldDefinitions, error: customFieldDefinitionError } =
    await supabase
      .from("custom_field_definitions")
      .insert(
        CUSTOM_FIELD_DEFINITIONS.map((definition) => ({
          ...definition,
          created_by: adminUser.id,
        })),
      )
      .select("id, entity_type, field_key");

  if (customFieldDefinitionError || !customFieldDefinitions) {
    throw new Error(
      customFieldDefinitionError?.message ?? "Could not seed custom fields.",
    );
  }

  const definitionMap = new Map(
    customFieldDefinitions.map((definition) => [
      `${definition.entity_type}:${definition.field_key}`,
      definition.id,
    ]),
  );

  const clientCustomFieldValues = insertedClients.flatMap((client, index) => {
    const values: Database["public"]["Tables"]["client_custom_field_values"]["Insert"][] = [];
    const programTrackId = definitionMap.get("client:program_track");
    const intakePriorityId = definitionMap.get("client:intake_priority");

    if (programTrackId) {
      values.push({
        client_id: client.id,
        definition_id: programTrackId,
        value_text: ["Housing stabilization", "Food assistance", "Youth services"][index % 3],
      });
    }

    if (intakePriorityId) {
      values.push({
        client_id: client.id,
        definition_id: intakePriorityId,
        value_text: String((index % 5) + 1),
      });
    }

    return values;
  });

  if (clientCustomFieldValues.length > 0) {
    const { error: clientFieldValueError } = await supabase
      .from("client_custom_field_values")
      .insert(clientCustomFieldValues);

    if (clientFieldValueError) {
      throw new Error(clientFieldValueError.message);
    }
  }

  const { data: insertedServiceEntries, error: insertedServiceEntriesError } =
    await supabase
      .from("service_entries")
      .select("id, client_id, service_date")
      .in("client_id", insertedClients.map((client) => client.id));

  if (insertedServiceEntriesError || !insertedServiceEntries) {
    throw new Error(
      insertedServiceEntriesError?.message ?? "Could not read seeded service entries.",
    );
  }

  const serviceCustomFieldValues = insertedServiceEntries.flatMap((entry, index) => {
    const values: Database["public"]["Tables"]["service_entry_custom_field_values"]["Insert"][] = [];
    const followUpChannelId = definitionMap.get("service_entry:follow_up_channel");
    const nextStepDueId = definitionMap.get("service_entry:next_step_due");

    if (followUpChannelId) {
      values.push({
        definition_id: followUpChannelId,
        service_entry_id: entry.id,
        value_text: ["Phone", "Text", "Email", "In person"][index % 4],
      });
    }

    if (nextStepDueId) {
      const nextStep = new Date(`${entry.service_date}T00:00:00Z`);
      nextStep.setDate(nextStep.getDate() + 7);

      values.push({
        definition_id: nextStepDueId,
        service_entry_id: entry.id,
        value_text: nextStep.toISOString().slice(0, 10),
      });
    }

    return values;
  });

  if (serviceCustomFieldValues.length > 0) {
    const { error: serviceFieldValueError } = await supabase
      .from("service_entry_custom_field_values")
      .insert(serviceCustomFieldValues);

    if (serviceFieldValueError) {
      throw new Error(serviceFieldValueError.message);
    }
  }

  const appointments: Database["public"]["Tables"]["appointments"]["Insert"][] =
    insertedClients.slice(0, 6).map((client, index) => {
      const scheduledFor = new Date();
      scheduledFor.setDate(scheduledFor.getDate() + index);
      scheduledFor.setHours(9 + (index % 4) * 2, 0, 0, 0);

      const assignedStaff = index % 2 === 0 ? adminUser : staffUser;

      return {
        client_id: client.id,
        duration_minutes: 30 + (index % 3) * 15,
        location: index % 2 === 0 ? "Main office" : "Phone call",
        notes: `Upcoming check-in for ${client.full_name}. Review open tasks and confirm next service steps.`,
        reminder_status: index % 3 === 0 ? "sent" : "pending",
        scheduled_for: scheduledFor.toISOString(),
        staff_member_name: assignedStaff.name,
        staff_member_profile_id: assignedStaff.id,
      };
    });

  const { error: appointmentError } = await supabase
    .from("appointments")
    .insert(appointments);

  if (appointmentError) {
    throw new Error(appointmentError.message);
  }

  console.log("Seed complete.");
  console.log(`Demo users: ${DEMO_USERS.map((user) => user.email).join(", ")}`);
  console.log("Demo password: CaseFlowDemo123!");
  console.log(
    `Inserted ${insertedClients.length} clients, ${serviceEntries.length} service entries, ${appointments.length} appointments, and ${customFieldDefinitions.length} custom field definitions.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
