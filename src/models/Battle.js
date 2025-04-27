import mongoose from 'mongoose';

const battleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  opponentId: {
    type: Number, // ID du Pokémon adverse
    required: true
  },
  userPokemonId: {
    type: Number, // ID du Pokémon du joueur
    required: true
  },
  result: {
    type: String,
    enum: ['win', 'lose', 'draw'],
    required: true
  },
  xpEarned: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

const Battle = mongoose.model('Battle', battleSchema);

export default Battle; 