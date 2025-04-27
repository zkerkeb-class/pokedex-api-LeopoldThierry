import express from 'express';
import Pokemon from '../models/Pokemon.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET - Récupérer tous les pokémons (accessible à tous)
router.get('/', async (req, res) => {
  try {
    const pokemons = await Pokemon.find({});
    console.log('Pokémons trouvés:', pokemons); // Pour le debugging
    res.status(200).json({
      success: true,
      count: pokemons.length,
      data: pokemons
    });
  } catch (error) {
    console.error('Erreur serveur:', error); // Pour le debugging
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des pokémons",
      error: error.message
    });
  }
});

// GET - Récupérer un pokémon par son ID (accessible à tous)
router.get('/:id', async (req, res) => {
  try {
    const pokemon = await Pokemon.findOne({ id: req.params.id });
    if (!pokemon) {
      return res.status(404).json({ message: "Pokémon non trouvé" });
    }
    res.status(200).json(pokemon);
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la récupération du pokémon",
      error: error.message
    });
  }
});

// Middleware d'authentification pour les routes suivantes
// Seuls les utilisateurs connectés peuvent créer, modifier ou supprimer
router.use(protect);

// POST - Créer un nouveau pokémon (utilisateurs connectés)
router.post('/', async (req, res) => {
  try {
    // Vérifier si l'ID existe déjà
    const existingPokemon = await Pokemon.findOne({ id: req.body.id });
    if (existingPokemon) {
      return res.status(400).json({ message: "Un pokémon avec cet ID existe déjà" });
    }
    const newPokemon = new Pokemon(req.body);
    await newPokemon.save();
    res.status(201).json(newPokemon);
  } catch (error) {
    res.status(400).json({
      message: "Erreur lors de la création du pokémon",
      error: error.message
    });
  }
});

// Routes accessibles uniquement aux admins
router.use(authorize('admin'));

// PUT - Mettre à jour un pokémon (admins seulement)
router.put('/:id', async (req, res) => {
  try {
    const updatedPokemon = await Pokemon.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedPokemon) {
      return res.status(404).json({ message: "Pokémon non trouvé" });
    }
    res.status(200).json(updatedPokemon);
  } catch (error) {
    res.status(400).json({
      message: "Erreur lors de la mise à jour du pokémon",
      error: error.message
    });
  }
});

// DELETE - Supprimer un pokémon (admins seulement)
router.delete('/:id', async (req, res) => {
  try {
    const deletedPokemon = await Pokemon.findOneAndDelete({ id: req.params.id });
    if (!deletedPokemon) {
      return res.status(404).json({ message: "Pokémon non trouvé" });
    }
    res.status(200).json({
      message: "Pokémon supprimé avec succès",
      pokemon: deletedPokemon
    });
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la suppression du pokémon",
      error: error.message
    });
  }
});

export default router;
