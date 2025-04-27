import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import Pokemon from '../models/Pokemon.js';

const router = express.Router();

// POST - Acheter un objet
router.post('/buy', protect, async (req, res) => {
  try {
    const { itemType, price } = req.body;
    const user = await User.findById(req.user._id);

    // Vérifier si l'utilisateur a assez d'or
    if (user.gold < price) {
      return res.status(400).json({
        success: false,
        message: 'Vous n\'avez pas assez d\'or'
      });
    }

    // Mettre à jour l'inventaire en fonction du type d'objet
    switch (itemType) {
      case 'potion':
        user.inventory.potions += 1;
        break;
      case 'superPotion':
        user.inventory.superPotions += 1;
        break;
      case 'hyperPotion':
        user.inventory.hyperPotions += 1;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Type d\'objet invalide'
        });
    }

    // Déduire l'or
    user.gold -= price;

    await user.save();

    res.status(200).json({
      success: true,
      data: {
        gold: user.gold,
        inventory: user.inventory
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST - Acheter un booster
router.post('/booster', protect, async (req, res) => {
  try {
    const { price } = req.body;
    const user = await User.findById(req.user._id);

    // Vérifier si l'utilisateur a assez d'or
    if (user.gold < price) {
      return res.status(400).json({
        success: false,
        message: 'Vous n\'avez pas assez d\'or'
      });
    }

    // Générer 4 Pokémon aléatoires
    const allPokemons = await Pokemon.find({});
    const randomPokemons = [];
    const unlockedPokemons = new Set(user.unlockedPokemons);

    // Générer 4 Pokémon aléatoires uniques
    while (randomPokemons.length < 4) {
      const randomIndex = Math.floor(Math.random() * allPokemons.length);
      const pokemon = allPokemons[randomIndex];
      
      // 5% de chance d'être shiny
      const isShiny = Math.random() < 0.05;
      
      if (!unlockedPokemons.has(pokemon.id)) {
        randomPokemons.push({
          id: pokemon.id,
          name: pokemon.name,
          isShiny
        });
        unlockedPokemons.add(pokemon.id);
      }
    }

    // Mettre à jour l'utilisateur
    user.gold -= price;
    user.unlockedPokemons = Array.from(unlockedPokemons);
    user.inventory.boosters += 1;

    await user.save();

    res.status(200).json({
      success: true,
      data: {
        gold: user.gold,
        inventory: user.inventory,
        newPokemons: randomPokemons
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET - Obtenir l'inventaire du joueur
router.get('/inventory', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('inventory gold');

    res.status(200).json({
      success: true,
      data: {
        inventory: user.inventory,
        gold: user.gold
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router; 