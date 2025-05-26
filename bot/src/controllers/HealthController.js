class HealthController {
  async getHealth(req, res) {
    res.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    });
  }
}

module.exports = new HealthController();
