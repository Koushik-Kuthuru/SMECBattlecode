import express from "express";
import cors from "cors";
import routes from "./routes.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use("/api", routes);

const PORT = Number(process.env.PORT || 8080);
app.listen(PORT, () => console.log(`API listening on :${PORT}`));
