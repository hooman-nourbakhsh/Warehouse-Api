require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/database");
const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");
const swaggerUi = require("swagger-ui-express");

// Load swagger configuration
let swaggerDocument = require("./swagger/swagger.json");

const app = express();
let PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware to parse JSON bodies
app.use(express.json());

// Enable CORS for all origins
app.use(cors());

// Routes
app.use("/products", productRoutes);
app.use("/auth", authRoutes);

// Helper function to start server and try the next port if the current one is taken
function startServer(port) {
  const SERVER_URL = process.env.SERVER_URL || `http://localhost:${PORT}`;

  const server = app.listen(port, () => {
    console.log(`Server is running on ${SERVER_URL}`);

    // Update Swagger with the correct port
    swaggerDocument.servers = [
      {
        url: SERVER_URL,
        description: "Production server",
      },
    ];

    // Serve updated Swagger docs
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    console.log(`Swagger API docs are available at ${SERVER_URL}/api-docs`);
  });

  // Handle error in case the port is in use
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.log(`Port ${port} is in use, trying port ${port + 1}...`);
      startServer(port + 1); // Try the next port
    } else {
      console.error("Server error:", err);
    }
  });
}

// Start the server and handle port availability
startServer(PORT);
