import express, { Request, Response } from "express";
import path from "path";
import app from "./app";

const PORT = process.env.PORT || 3001;

// Serve static frontend files in production
app.use(express.static(path.join(__dirname, "..", "public")));

// SPA fallback: serve index.html for any non-API route
app.get("/{*path}", (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
