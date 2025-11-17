import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import flash from "express-flash";
import expressLayouts from "express-ejs-layouts";
import {
  tryConnectAndInit,
  isDbConnected,
  getAllTodos,
  insertTodo,
  flushPendingToDb,
} from "./lib/db.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Set view engine and views folder
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Body parsing
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Session + flash
app.use(session({ secret: "change-me", resave: false, saveUninitialized: true }));
app.use(flash());

// Express EJS Layouts
app.use(expressLayouts);
app.set("layout", "layout"); // default layout -> views/layout.ejs

const PORT = process.env.PORT || 3000;

// Start DB connect attempt loop
tryConnectAndInit();

// --------------------------------------
// ROUTES
// --------------------------------------

// Home page - list todos
app.get("/", async (req, res) => {
  let dbStatus = isDbConnected() ? "connected" : "disconnected";
  let todos;
  if (isDbConnected()) {
    try {
      todos = await getAllTodos();
    } catch (err) {
      todos = [];
      console.error("Error fetching todos from DB:", err);
      req.flash("error", "Error reading from database; showing local list.");
    }
  } else {
    todos = global.__IN_MEMORY_TODOS || [];
    req.flash("info", "Database not connected — using in-memory list.");
  }

  res.render("index", {
    todos,
    dbStatus,
    messages: req.flash(),
  });
});

// Add todo
app.post("/add", async (req, res) => {
  const text = (req.body.text || "").trim();
  if (!text) {
    req.flash("error", "Please enter a todo.");
    return res.redirect("/");
  }

  if (isDbConnected()) {
    try {
      await insertTodo(text);
      req.flash("success", "Saved to database.");
    } catch (err) {
      console.error("Insert error:", err);
      req.flash("error", "Failed to save to DB; storing temporarily in memory.");
      global.__IN_MEMORY_TODOS = global.__IN_MEMORY_TODOS || [];
      global.__IN_MEMORY_TODOS.push({ id: Date.now(), text });
    }
  } else {
    global.__IN_MEMORY_TODOS = global.__IN_MEMORY_TODOS || [];
    global.__IN_MEMORY_TODOS.push({ id: Date.now(), text });
    req.flash(
      "info",
      "Database not connected — saved locally and will sync when DB is available."
    );
  }

  return res.redirect("/");
});

// Optional: force flush pending todos
app.post("/flush", async (req, res) => {
  if (!isDbConnected()) {
    req.flash("error", "Database not connected; cannot flush.");
    return res.redirect("/");
  }
  try {
    await flushPendingToDb();
    req.flash("success", "Pending items flushed to DB.");
  } catch (err) {
    console.error("Flush error:", err);
    req.flash("error", "Flush failed.");
  }
  res.redirect("/");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
