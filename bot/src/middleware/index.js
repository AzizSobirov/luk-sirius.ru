const express = require("express");
const cors = require("cors");
const path = require("path");

function setupMiddleware(app) {
  // Basic middleware
  app.use(express.json());
  app.use(cors());
  app.use(express.static("public"));

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error("Error:", err);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  });

  // 404 handler for API routes
  // app.use("/api/*", (req, res) => {
  //   res.status(404).json({
  //     success: false,
  //     error: "Route not found",
  //   });
  // });
}

module.exports = { setupMiddleware };
