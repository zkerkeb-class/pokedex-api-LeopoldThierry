import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import Pokemon from '../models/Pokemon.js';
import Battle from '../models/Battle.js';

const router = express.Router();

// POST - Choisir son starter
router.post('/choose-starter', protect, async (req, res) => {
  try {
    const { pokemonId } = req.body;
    const validStarters = [1, 4, 7]; // IDs de Bulbizarre, Salamèche, Carapuce

    if (!validStarters.includes(pokemonId)) {
      return res.status(400).json({
        success: false,
        message: 'Pokémon starter invalide'
      });
    }

    const user = await User.findById(req.user._id);
    if (user.starterPokemon) {
      return res.status(400).json({
        success: false,
        message: 'Vous avez déjà choisi votre starter'
      });
    }

    user.starterPokemon = pokemonId;
    user.unlockedPokemons = [pokemonId];
    user.tutorialCompleted = true;
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        starterPokemon: pokemonId,
        unlockedPokemons: user.unlockedPokemons
      }
    });
  } catch (error) {
    console.error('Erreur lors de la sélection du starter:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST - Lancer un combat
router.post('/battle', protect, async (req, res) => {
  try {
    const { opponentId, userPokemonId } = req.body;
    const user = await User.findById(req.user._id);

    // Vérifier si le Pokémon appartient bien au joueur
    if (!user.unlockedPokemons.includes(userPokemonId)) {
      return res.status(400).json({
        success: false,
        message: 'Ce Pokémon ne vous appartient pas'
      });
    }

    // Simuler le combat et calculer le résultat
    const result = simulateBattle(userPokemonId, opponentId);
    const xpEarned = calculateXpEarned(result);

    // Enregistrer le combat
    const battle = await Battle.create({
      userId: user._id,
      opponentId,
      userPokemonId,
      result,
      xpEarned
    });

    // Mettre à jour l'XP et le niveau du joueur
    user.xp += xpEarned;
    user.level = calculateLevel(user.xp);
    
    // Vérifier si le joueur a gagné un booster
    if (result === 'win' && Math.random() < 0.3) { // 30% de chance de gagner un booster
      user.inventory.boosters += 1;
    }

    await user.save();

    res.status(200).json({
      success: true,
      data: {
        battle,
        xpEarned,
        newLevel: user.level,
        boostersWon: user.inventory.boosters
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST - Ouvrir un booster
router.post('/open-booster', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user.inventory.boosters <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Vous n\'avez pas de booster'
      });
    }

    // Décrémenter le nombre de boosters
    user.inventory.boosters -= 1;

    // Générer un nouveau Pokémon aléatoire
    const newPokemon = await generateRandomPokemon();
    
    // Vérifier si le Pokémon n'est pas déjà débloqué
    if (!user.unlockedPokemons.includes(newPokemon.id)) {
      user.unlockedPokemons.push(newPokemon.id);
    }

    await user.save();

    res.status(200).json({
      success: true,
      data: {
        newPokemon,
        remainingBoosters: user.inventory.boosters
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET - Obtenir la progression du joueur
router.get('/progress', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('xp level unlockedPokemons inventory starterPokemon');

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST - Terminer un combat
router.post('/battle/end', protect, async (req, res) => {
  try {
    const { result, xpEarned, goldEarned } = req.body;
    const user = await User.findById(req.user._id);

    // Mettre à jour les statistiques de combat
    user.battleStats[result] += 1;

    // Mettre à jour l'XP et le niveau
    user.xp += xpEarned;
    user.level = Math.floor(user.xp / 1000) + 1;

    // Mettre à jour l'or
    user.gold += goldEarned;

    await user.save();

    res.status(200).json({
      success: true,
      data: {
        battleStats: user.battleStats,
        xp: user.xp,
        level: user.level,
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

// GET - Obtenir les statistiques du joueur
router.get('/stats', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('battleStats xp level gold');

    res.status(200).json({
      success: true,
      data: {
        battleStats: user.battleStats,
        xp: user.xp,
        level: user.level,
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

// POST - Utiliser une potion spécifique (nouvelle route)
router.post('/use-potion/:type', protect, async (req, res) => {
  try {
    const { type } = req.params;
    const user = await User.findById(req.user._id);

    // Déterminer le type de potion et les PV restaurés
    let potionType, hpRestored;
    switch (type) {
      case '1':
        potionType = 'potions';
        hpRestored = 20;
        break;
      case '2':
        potionType = 'superPotions';
        hpRestored = 50;
        break;
      case '3':
        potionType = 'hyperPotions';
        hpRestored = 120;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Type de potion invalide'
        });
    }

    // Vérifier si l'utilisateur a la potion
    if (user.inventory[potionType] <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Vous n\'avez pas cette potion'
      });
    }

    // Déduire la potion de l'inventaire
    user.inventory[potionType] -= 1;

    await user.save();

    res.status(200).json({
      success: true,
      data: {
        inventory: user.inventory,
        hpRestored,
        message: `Vous avez utilisé une ${potionType} et restauré ${hpRestored} PV`
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Fonctions utilitaires
function simulateBattle(userPokemonId, opponentId) {
  // Logique de simulation de combat
  // Retourne 'win', 'lose' ou 'draw'
  return Math.random() > 0.5 ? 'win' : 'lose';
}

function calculateXpEarned(result) {
  // Logique de calcul d'XP
  return result === 'win' ? 100 : 50;
}

function calculateLevel(xp) {
  // Logique de calcul de niveau
  return Math.floor(xp / 1000) + 1;
}

async function generateRandomPokemon() {
  // Logique de génération aléatoire de Pokémon
  const pokemons = await Pokemon.find({});
  return pokemons[Math.floor(Math.random() * pokemons.length)];
}

export default router; 