import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Générer un JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// POST - Inscription d'un utilisateur
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Cet utilisateur existe déjà'
      });
    }

    // Créer l'utilisateur
    const user = await User.create({
      username,
      email,
      password,
      isAdmin: false, // Par défaut, les nouveaux utilisateurs ne sont pas admin
      tutorialCompleted: false
    });

    if (user) {
      res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          username: user.username,
          email: user.email,
          isAdmin: user.isAdmin,
          tutorialCompleted: user.tutorialCompleted,
          token: generateToken(user._id)
        }
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// POST - Connexion d'un utilisateur
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe invalide'
      });
    }

    // Vérifier si le mot de passe correspond
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe invalide'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        starterPokemon: user.starterPokemon,
        xp: user.xp,
        level: user.level,
        unlockedPokemons: user.unlockedPokemons,
        inventory: user.inventory,
        tutorialCompleted: user.tutorialCompleted,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET - Vérifier la validité du token
router.get('/verify', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          isAdmin: user.isAdmin,
          starterPokemon: user.starterPokemon,
          tutorialCompleted: user.tutorialCompleted
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET - Profil de l'utilisateur
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST - Créer un admin (route protégée, admin seulement)
router.post('/create-admin', protect, async (req, res) => {
  try {
    // Vérifier si l'utilisateur actuel est admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à créer un admin'
      });
    }

    const { username, email, password } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Cet utilisateur existe déjà'
      });
    }

    // Créer l'admin
    const admin = await User.create({
      username,
      email,
      password,
      isAdmin: true
    });

    res.status(201).json({
      success: true,
      data: {
        _id: admin._id,
        username: admin.username,
        email: admin.email,
        isAdmin: admin.isAdmin
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