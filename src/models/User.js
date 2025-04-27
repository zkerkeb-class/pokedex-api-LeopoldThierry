import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Nom d\'utilisateur requis'],
    unique: true,
    trim: true,
    minlength: [3, 'Le nom d\'utilisateur doit contenir au moins 3 caractères']
  },
  email: {
    type: String,
    required: [true, 'Email requis'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Veuillez fournir un email valide'
    ]
  },
  password: {
    type: String,
    required: [true, 'Mot de passe requis'],
    minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères'],
    select: false // Ne pas inclure par défaut dans les requêtes
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  // Nouvelles propriétés pour le jeu
  starterPokemon: {
    type: Number, // ID du Pokémon starter
    default: null
  },
  unlockedPokemons: [{
    type: Number, // IDs des Pokémon débloqués
    ref: 'Pokemon'
  }],
  // Statistiques de combat
  battleStats: {
    wins: {
      type: Number,
      default: 0
    },
    losses: {
      type: Number,
      default: 0
    },
    draws: {
      type: Number,
      default: 0
    }
  },
  // Progression
  xp: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  gold: {
    type: Number,
    default: 0
  },
  // Inventaire du joueur
  inventory: {
    potions: {
      type: Number,
      default: 0
    },
    superPotions: {
      type: Number,
      default: 0
    },
    hyperPotions: {
      type: Number,
      default: 0
    },
    boosters: {
      type: Number,
      default: 0
    }
  },
  tutorialCompleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Middleware pour hacher le mot de passe avant la sauvegarde
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Méthode pour comparer le mot de passe saisi avec le mot de passe haché
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User; 