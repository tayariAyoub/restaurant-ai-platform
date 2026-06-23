import http from "node:http";

const restaurant = {
  id: 1,
  name: "Bella Napoli",
  tagline: "Wood-fired pizza, made with heart.",
  description:
    "A warm neighborhood pizzeria serving slow-fermented dough, Italian classics, and seasonal ingredients in the heart of Berlin.",
  address: "Sonnenallee 42",
  city: "Berlin",
  postal_code: "12045",
  phone: "+49 30 555 0123",
  email: "ciao@bellanapoli.demo",
  opening_hours:
    "Monday: Closed\nTuesday–Thursday: 17:00–22:30\nFriday–Saturday: 12:00–23:00\nSunday: 12:00–22:00",
  hero_image:
    "https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=1800&q=85",
  reservation_url: "",
  categories: [
    {
      id: 1,
      name: "Antipasti",
      description: "Small plates to share.",
      sort_order: 0,
      items: [
        {
          id: 1,
          category_id: 1,
          name: "Burrata Pugliese",
          description: "Creamy burrata, cherry tomatoes, basil oil, sea salt.",
          price: "11.50",
          image_url: "",
          is_available: true,
          is_vegan: false,
          is_vegetarian: true,
          is_halal: false,
          allergens: "milk",
        },
      ],
    },
    {
      id: 2,
      name: "Wood-fired Pizza",
      description: "48-hour fermented dough, baked at 450°C.",
      sort_order: 1,
      items: [
        {
          id: 2,
          category_id: 2,
          name: "Margherita",
          description: "San Marzano tomato, fior di latte, basil, olive oil.",
          price: "12.50",
          image_url: "",
          is_available: true,
          is_vegan: false,
          is_vegetarian: true,
          is_halal: false,
          allergens: "gluten, milk",
        },
        {
          id: 3,
          category_id: 2,
          name: "Ortolana",
          description: "Tomato, grilled vegetables, and vegan mozzarella.",
          price: "14.50",
          image_url: "",
          is_available: true,
          is_vegan: true,
          is_vegetarian: true,
          is_halal: false,
          allergens: "gluten",
        },
      ],
    },
  ],
};

http
  .createServer((request, response) => {
    response.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    response.setHeader("Content-Type", "application/json");
    if (request.method === "OPTIONS") {
      response.statusCode = 204;
      return response.end();
    }
    if (request.url === "/api/restaurant") return response.end(JSON.stringify(restaurant));
    if (request.url === "/api/chat") {
      return response.end(
        JSON.stringify({
          answer: "Our Margherita is €12.50 and vegetarian.",
          conversation_id: "demo",
        }),
      );
    }
    if (request.url === "/api/contact") {
      return response.end(
        JSON.stringify({ id: 1, status: "new", created_at: new Date().toISOString() }),
      );
    }
    response.statusCode = 404;
    return response.end(JSON.stringify({ detail: "Not found" }));
  })
  .listen(8000);

