require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.upsert({
  where: { email: "agent@example.com" },
  update: {},
  create: {
    email: "agent@example.com",
    password: "password123",
    name: "Test Agent",
    agency_name: "LocalTrip Agency",
    phone: "07123456789",
  },
});

  const leads = await Promise.all(
    Array.from({ length: 10 }).map((_, i) =>
      prisma.lead.create({
        data: {
          customer_name: `Customer ${i + 1}`,
          phone: `0700000000${i}`,
          email: `customer${i + 1}@example.com`,
          inquiry_text: `Looking for a holiday package number ${i + 1}`,
          destination: ["Paris", "Dubai", "Istanbul", "Bali", "Rome"][i % 5],
          duration: 3 + (i % 5),
          budget: 500 + i * 150,
          group_size: 2 + (i % 4),
          preferences: "Hotel, sightseeing, local food",
          status: ["New", "Contacted", "Qualified", "Converted", "Lost"][i % 5],
          score: 20 + i * 7,
          score_label: ["Cold", "Warm", "Hot"][i % 3],
          interaction_count: i,
          userId: user.id,
        },
      })
    )
  );

  const itinerary1 = await prisma.itinerary.create({
    data: {
      leadId: leads[0].id,
      title: "Paris Weekend Trip",
      summary: "A short Paris city break with sightseeing.",
      days: {
        create: [
          {
            day_number: 1,
            title: "Arrival and Eiffel Tower",
            activities: "Airport pickup, hotel check-in, Eiffel Tower visit",
            meals: "Dinner included",
            hotel: "Paris Central Hotel",
            transport: "Private transfer",
          },
          {
            day_number: 2,
            title: "City Tour",
            activities: "Louvre Museum, Seine cruise, shopping",
            meals: "Breakfast included",
            hotel: "Paris Central Hotel",
            transport: "Coach",
          },
        ],
      },
    },
  });

  const itinerary2 = await prisma.itinerary.create({
    data: {
      leadId: leads[1].id,
      title: "Dubai Luxury Escape",
      summary: "Luxury Dubai package with desert safari.",
      days: {
        create: [
          {
            day_number: 1,
            title: "Arrival",
            activities: "Hotel check-in and Marina walk",
            meals: "Breakfast included",
            hotel: "Dubai Marina Hotel",
            transport: "Private car",
          },
        ],
      },
    },
  });

  const itinerary3 = await prisma.itinerary.create({
    data: {
      leadId: leads[2].id,
      title: "Istanbul Cultural Tour",
      summary: "Historic Istanbul itinerary.",
      days: {
        create: [
          {
            day_number: 1,
            title: "Old City Tour",
            activities: "Blue Mosque, Hagia Sophia, Grand Bazaar",
            meals: "Lunch included",
            hotel: "Old City Hotel",
            transport: "Walking tour",
          },
        ],
      },
    },
  });

  const quotation1 = await prisma.quotation.create({
    data: {
      itineraryId: itinerary1.id,
      total_price: 1200,
      currency: "GBP",
      notes: "Includes hotel, transfers and tours.",
    },
  });

  const quotation2 = await prisma.quotation.create({
    data: {
      itineraryId: itinerary2.id,
      total_price: 2200,
      currency: "GBP",
      notes: "Luxury package with desert safari.",
    },
  });

  await prisma.booking.create({
    data: {
      leadId: leads[0].id,
      itineraryId: itinerary1.id,
      quotationId: quotation1.id,
      status: "Confirmed",
    },
  });

  await prisma.booking.create({
    data: {
      leadId: leads[1].id,
      itineraryId: itinerary2.id,
      quotationId: quotation2.id,
      status: "Pending",
    },
  });

  await prisma.aILog.create({
    data: {
      input: "Create a Paris itinerary",
      output: "Generated a 2-day Paris city break itinerary.",
      feedback: "Good",
      action: "accept", 
    },
  });

  await prisma.agentConfig.create({
    data: {
      name: "LocalTrip Assistant",
      preferences: "Budget-friendly, family trips, city breaks",
      destinations_dataset: "Paris, Dubai, Istanbul, Bali, Rome",
    },
  });

  console.log("Seed data created successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });