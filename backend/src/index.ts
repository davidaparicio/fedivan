import "dotenv/config";
import express from "express";
import cors from "cors";
import session from "express-session";
import authRouter from "./routes/auth.js";
import timelineRouter from "./routes/timeline.js";
import { resumeBluesky } from "./platforms/bluesky.js";

const app = express();
const PORT = parseInt(process.env.PORT || "3001", 10);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 },
  })
);

app.use("/api/auth", authRouter);
app.use("/api", timelineRouter);

resumeBluesky().then((ok) => {
  if (ok) console.log("Resumed Bluesky session from DB");
});

app.listen(PORT, () => {
  console.log(`Fedivan backend listening on http://localhost:${PORT}`);
});
