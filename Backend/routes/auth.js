import app from "./server.js";

app.post("/api/auth/register", (req, res) => {
  // Handle user registration logic here
  res.send("User registration endpoint");
});

app.post("/api/auth/login", (req, res) => {
  // Handle user login logic here
  req.body.email = req.body.email.toLowerCase(); // Convert email to lowercase
  req.body.password = req.body.password; // Keep password as is
  res.send("User login endpoint");
});
