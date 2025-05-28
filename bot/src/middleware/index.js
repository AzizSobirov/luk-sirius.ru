const express = require("express");
const cors = require("cors");
const path = require("path");

function setupMiddleware(app) {
  // CORS configuration
  const allowedOrigins = [
    "http://localhost:5173",
    /\.luk-sirius\.ru$/
  ];

  app.use(express.json());
  app.use(
    cors({
      origin: function (origin, callback) {
        if (!origin) return callback(null, true); // allow non-browser requests
        if (
          allowedOrigins.some((allowed) =>
            allowed instanceof RegExp
              ? allowed.test(origin.replace(/^https?:\/\//, ""))
              : allowed === origin
          ) ||
          origin === "https://luk-sirius.ru"
        ) {
          return callback(null, true);
        }
        // Return CORS error without logging
        callback(null, false);
      },
      credentials: true,
    })
  );
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
