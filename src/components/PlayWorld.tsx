import { useState } from 'react'
import './PlayWorld.css'

type Game = 'home' | 'animals'
const animals = [
 { emoji: '🐶', name: 'Dog', sound: 'Woof woof!' },
 { emoji: '🐱', name: 'Cat', sound: 'Meow!' },
 { emoji: '🐮', name: 'Cow', sound: 'Moo!' },
 { emoji: '🦁', name: 'Lion', sound: 'Roar!' },
 { emoji: '🐸', name: 'Frog', sound: 'Ribbit!' },
 { emoji: '🐑', name: 'Sheep', sound: 'Baa baa!' },
]
export function PlayWorld({ name, onBack, voice = true }: { name: string; onBack: () => void; voice?: boolean }) {
 const [game, setGame] = useState<Game>('home')
 const [selected, setSelected] = useState<string | null>(null)
 const [stars, setStars] = useState(0)
 const say = (message: string) => {
  if (!voice || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(message)
  utterance.rate = 0.82
  utterance.pitch = 1.15
  window.speechSynthesis.speak(utterance)
 }
 const playAnimal = (animal: typeof animals[number]) => {
  setSelected(animal.name)
  setStars(s => s + 1)
  say(`${animal.name}! ${animal.sound} Great job!`)
 }
 return <main className="play-world">
  <header className="play-top"><button type="button" onClick={game === 'home' ? onBack : () => { setGame('home'); setSelected(null) }} aria-label="Go back">← Back</button><span>🐻 Pochu's Play World</span><span aria-live="polite">⭐ {stars}</span></header>
  {game === 'home' ? <section className="play-intro">
   <div className="play-mascot" aria-hidden="true">🐻🌈</div>
   <h1>Hi, {name}! 👋</h1><p>Ready for a little adventure?</p>
   <div className="play-tiles">
    <button type="button" className="play-tile animal-tile" onClick={() => { setGame('animals'); say('Welcome to Animal World! Tap an animal!') }}><span>🐼🦁🐸</span><strong>Animal World</strong><small>Tap and discover!</small></button>
    <div className="play-tile coming-tile"><span>🎨🌟</span><strong>Colour Kingdom</strong><small>Coming soon</small></div>
    <div className="play-tile coming-tile"><span>🔢🍎</span><strong>Number Jungle</strong><small>Coming soon</small></div>
   </div>
  </section> : <section className="play-intro">
   <h1>🐾 Animal World</h1><p>Tap an animal to hear what it says!</p>
   <div className="animal-grid">{animals.map(animal => <button type="button" key={animal.name} className="animal-button" onClick={() => playAnimal(animal)} aria-label={`Hear ${animal.name}`}><span aria-hidden="true">{animal.emoji}</span><strong>{animal.name}</strong></button>)}</div>
   <div className="animal-feedback" aria-live="polite">{selected ? <>🎉 Yay! {selected}! ⭐</> : '✨ Choose an animal! ✨'}</div>
  </section>}
 </main>
}
