import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import pokemonRoutes from "./routes/pokemonRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import gameRoutes from './routes/gameRoutes.js';
import shopRoutes from './routes/shopRoutes.js';

// Configuration des variables d'environnement
dotenv.config();

// Connexion à MongoDB
connectDB();

// Configuration d'Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware pour parser le JSON
app.use(express.json());

// Configuration CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Routes
app.use("/api/pokemons", pokemonRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/game", gameRoutes);
app.use("/api/shop", shopRoutes);

// Route de base
app.get("/", (req, res) => {
  res.send("Bienvenue sur l'API Pokémon avec MongoDB");
});

// Démarrage du serveur
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur démarré sur http://0.0.0.0:${PORT}`);
});
