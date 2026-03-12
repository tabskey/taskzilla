import express from "express";
import userRoutes from "./infra/http/routes/userRoutes";

export const app = express();

app.use(express.json());

app.use("/api", userRoutes);
